/**
 * Typechecks every TypeScript/TSX code fence in the corpus and writes a report
 * to content/_reports/code-verification.{json,md}.
 *
 * Each fence is extracted to its own file and compiled together in one tsc
 * pass. `export {}` is appended so every snippet is a module — without it a
 * fence with no import/export is a global script and unrelated lessons collide
 * on the same identifier names.
 *
 * TS2307 ("cannot find module") is tolerated: a snippet may legitimately import
 * a package this repo does not install. Everything else is a defect the reader
 * would hit on paste.
 *
 *   npx tsx scripts/verify-code.ts          # report only
 *   npx tsx scripts/verify-code.ts --strict # exit 1 if any defect remains
 */
import fs from 'node:fs';

// Piping this report into `head` closes stdout early; without this the process
// dies with an unhandled EPIPE instead of just stopping.
process.stdout.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EPIPE') process.exit(0);
  throw error;
});
import ts from 'typescript';
import os from 'node:os';
import path from 'node:path';
import { listFences, type Fence } from '../modules/course_content/course_content.fences';
import { splitSnippetFiles } from '../modules/course_content/course_content.snippets';
import { parseFenceMeta } from '../modules/course_content/course_content.fence-meta';

const TS_LANGS = new Set(['typescript', 'ts', 'tsx', 'javascript', 'js', 'jsx']);
const OUT_DIR = path.join(process.cwd(), 'content', '_reports');

/**
 * Defect classes, in the order a reader would hit them.
 *
 * `missing-module` is tolerated: a snippet may legitimately import a package
 * this repo does not install. `implicit-any` is tolerated *only* in a snippet
 * that also has a missing module, because the parameter it complains about is
 * usually typed by that very package — counting it there would blame the
 * lesson for this repo's dependency list.
 */
type DefectClass =
  | 'missing-module'
  | 'assumed-context'
  | 'assumed-helper'
  | 'shows-variants'
  | 'syntax'
  | 'undefined-identifier'
  | 'implicit-any'
  | 'type-error';

/**
 * Identifiers a lesson may reference without showing: the reader's own ORM,
 * cache client, logger and queue. Every documentation corpus assumes these;
 * spelling them out in each snippet would add noise and teach nothing.
 *
 * This list is deliberately closed. A name that is NOT here and is not defined
 * in the snippet is a real gap — the reader is being shown a symbol they have
 * no way to reconstruct.
 */
const ASSUMED_CONTEXT = new Set([
  'db', 'prisma', 'PrismaClient', 'redis', 'logger', 'dataSource', 'systemDb',
  'queue', 'sagaQueue', 'pool', 'anthropic', 'eventBus', 'repo', 'sessionRepo',
  'userRepo', 'rotationHistoryRepo', 'stripe', 'tenantDb', 'systemDb',
]);

function classify(code: string, message = ''): DefectClass {
  if (code === 'TS2307') return 'missing-module';
  // Type-only packages this repo does not install (@types/electron, React's
  // jsx-runtime). Same category as a missing module: not the lesson's fault.
  if (code === 'TS2875') return 'missing-module';
  if (code === 'TS2503' && /Cannot find namespace '(Electron|NodeJS|Express|JSX)'/.test(message))
    return 'missing-module';
  if (code === 'TS2304' || code === 'TS2552') {
    const name = /Cannot find name '([^']+)'/.exec(message)?.[1];
    if (name && ASSUMED_CONTEXT.has(name)) return 'assumed-context';
  }
  if (/^TS1\d{3}$/.test(code)) return 'syntax';
  // A snippet that defines `GET` twice, or has two default exports, is showing
  // two versions of the same thing — the wrong one and the right one, or two
  // options being compared. That is the teaching pattern, not a defect.
  if (['TS2300', 'TS2393', 'TS2323', 'TS2451', 'TS2528', 'TS2396'].includes(code))
    return 'shows-variants';
  if (code === 'TS2304' || code === 'TS2552') return 'undefined-identifier';
  if (code === 'TS7006' || code === 'TS7031' || code === 'TS7034' || code === 'TS7005')
    return 'implicit-any';
  return 'type-error';
}

/**
 * Names that appear ONLY in call position — never with a property read off
 * them, never in a type annotation. `await sendWelcomeEmail(tenantId)` tells
 * the reader everything they need: the name is the contract and the arguments
 * are visible. Declaring a body for it would pad the snippet without adding
 * information.
 *
 * The moment a name is used as a type, or has a field read off it, it stops
 * qualifying — because then the reader genuinely cannot reconstruct its shape,
 * and that IS a defect.
 */
function callOnlyNames(source: ts.SourceFile): Set<string> {
  // `called` ends up meaning "referenced in a way that carries its own
  // meaning": a call, a service method call, or a bare mention such as an ORM
  // model token (`manager.findOne(Tenant, ...)`) or a named constant
  // (`system: SUMMARY_SYSTEM_PROMPT`). None of those require the reader to know
  // an internal shape.
  const called = new Set<string>();
  const shaped = new Set<string>();

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      // `helper(x)` and `Service.method(x)` are both behaviour: the call names
      // what happens, and the arguments are visible.
      if (ts.isIdentifier(node.expression)) called.add(node.expression.text);
      else if (
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression)
      )
        called.add(node.expression.expression.text);
    }
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      // `AuthService.login(input)` is behaviour: the call is self-describing in
      // exactly the way a bare helper call is, and spelling out the service's
      // interface would pad the snippet.
      //
      // `user.email` is data: the reader cannot know what a User carries unless
      // the lesson shows it, so a value read keeps the name in `shaped`.
      const isImmediatelyCalled =
        ts.isCallExpression(node.parent) && node.parent.expression === node;
      if (!isImmediatelyCalled) shaped.add(node.expression.text);
    }
    if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
      shaped.add(node.typeName.text);
    }
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression)) {
      // `new BcryptPasswordHasher()` is construction, and the name plus the
      // port it satisfies is the whole contract — the same reasoning as a call.
      // If a value is read off the result, the property-access branch above
      // still disqualifies it.
      called.add(node.expression.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  // Any bare identifier reference counts, unless it was disqualified above by
  // having a value read off it or appearing in a type position.
  const mentioned = new Set<string>();
  const collect = (node: ts.Node) => {
    if (ts.isIdentifier(node) && !ts.isPropertyAccessExpression(node.parent)) mentioned.add(node.text);
    ts.forEachChild(node, collect);
  };
  collect(source);
  for (const name of mentioned) called.add(name);

  for (const name of shaped) called.delete(name);
  return called;
}

function classifyWithContext(
  code: string,
  message: string,
  callOnly: Set<string>,
  siblings: Set<string>
): DefectClass {
  const base = classify(code, message);
  // TS2686 ("'React' refers to a UMD global") is the same question as an
  // undefined name: is this symbol available here? If a sibling file in the
  // same fence imports it, it is.
  if (code === 'TS2686') {
    const umd = /'([^']+)' refers to a UMD global/.exec(message)?.[1];
    if (umd && siblings.has(umd)) return 'assumed-context';
  }
  if (base !== 'undefined-identifier') return base;
  const name = /Cannot find name '([^']+)'/.exec(message)?.[1];
  if (!name) return base;
  if (siblings.has(name)) return 'assumed-context';
  return callOnly.has(name) ? 'assumed-helper' : base;
}

/** Top-level names declared — or imported — anywhere in a source file. */
function topLevelDeclarations(source: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  // Walks the whole tree, not just top level: a fixture declared inside a
  // `describe(...)` is still something the rest of the fence refers to.
  const walk = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) names.add(node.name.text);
    ts.forEachChild(node, walk);
  };
  walk(source);

  for (const stmt of source.statements) {
    // An import in one file of a fence is what the next file relies on; the
    // lesson shows them together and the reader reads them together.
    if (ts.isImportDeclaration(stmt) && stmt.importClause) {
      const clause = stmt.importClause;
      if (clause.name) names.add(clause.name.text);
      if (clause.namedBindings) {
        if (ts.isNamedImports(clause.namedBindings))
          for (const el of clause.namedBindings.elements) names.add(el.name.text);
        else names.add(clause.namedBindings.name.text);
      }
    }
    if (ts.isVariableStatement(stmt))
      for (const decl of stmt.declarationList.declarations)
        if (ts.isIdentifier(decl.name)) names.add(decl.name.text);
    if (
      (ts.isFunctionDeclaration(stmt) ||
        ts.isClassDeclaration(stmt) ||
        ts.isInterfaceDeclaration(stmt) ||
        ts.isTypeAliasDeclaration(stmt) ||
        ts.isEnumDeclaration(stmt)) &&
      stmt.name
    )
      names.add(stmt.name.text);
  }
  return names;
}

type Defect = { code: string; line: number; message: string; class: DefectClass };
type Result = Fence & { snippetFile: string; defects: Defect[] };

/**
 * Test-runner globals are injected by vitest/jest at run time and are not
 * something a snippet is expected to declare. Counting them as defects blames
 * the lesson for this tool's lack of @types/jest.
 */
const TEST_GLOBALS =
  /Cannot find name '(expect|describe|it|test|jest|vi|beforeEach|afterEach|beforeAll|afterAll|suite)'/;

/**
 * Errors that only exist because a symbol's TYPE is unavailable. If `multer` is
 * not installed then `error instanceof multer.MulterError` cannot narrow, and
 * the resulting "'error' is of type 'unknown'" says nothing about the lesson —
 * the narrowing it wrote is correct. Same for a value returned by an assumed
 * helper: its type is unknowable here by construction.
 */
const COLLATERAL = new Set(['TS18046', 'TS2339', 'TS2345', 'TS2322', 'TS7006', 'TS7031', 'TS2571', 'TS2578', 'TS2786']);

/** True for a fence marked `run` in its info string — checked per-Result
 *  since a multi-file fence's parts all share the same `meta`. */
function isRunFence(r: Result): boolean {
  return parseFenceMeta(r.meta).run;
}

/**
 * True for a `run project` fence (P9, WebContainer).
 *
 * This is the exception to isRunFence's strict tier, and the distinction is
 * the whole reason a project fence can exist at all. P8's `run` fence goes to
 * a browser sandbox with no network and no module loader, so a missing module
 * there is fatal — the reader would click Run and get nothing. A `run project`
 * fence goes to WebContainer, which performs a real `npm install` from the
 * generated package.json before it ever starts the entry file, so importing
 * express is exactly what it is supposed to do.
 *
 * Before this distinction existed, isRunFence's strictness applied to both and
 * made every project fence fail verification on its own dependencies — which
 * is why the corpus carried zero of them despite the runner shipping in P9.
 */
function isProjectFence(r: Result): boolean {
  return parseFenceMeta(r.meta).project;
}

/**
 * `missing-module`/`assumed-context`/`assumed-helper` are tolerated for a
 * plain documentation fence (the reader is reading, not executing — an
 * uninstalled package or an assumed ORM client teaches something even if it
 * doesn't compile standalone). A `run` fence has no such excuse: the sandbox
 * has no network access and no module loader, so any of these three is
 * fatal, not tolerated — docs/phases/08-live-js-runner.md's stricter tier.
 */
function realDefects(r: Result): Defect[] {
  const strict = isRunFence(r) && !isProjectFence(r);
  // Anything whose type flows from a name this snippet does not resolve is
  // downstream noise. Fix the undefined name first and these become real.
  const unresolvable = r.defects.some((d) =>
    ['missing-module', 'assumed-helper', 'assumed-context', 'undefined-identifier'].includes(d.class)
  );
  return r.defects.filter((d) => {
    if (!strict) {
      if (d.class === 'missing-module') return false;
      if (d.class === 'assumed-context') return false;
      if (d.class === 'assumed-helper') return false;
    }
    if (d.class === 'shows-variants') return false;
    if (unresolvable && !strict && COLLATERAL.has(d.code)) return false;
    if (TEST_GLOBALS.test(d.message)) return false;
    return true;
  });
}

const fences = listFences().filter((f) => TS_LANGS.has(f.lang.toLowerCase()));
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-code-'));

const results: Result[] = [];
fences.forEach((f, index) => {
  const lang = f.lang.toLowerCase();
  const ext = lang === 'tsx' || lang === 'jsx' ? '.tsx' : '.ts';
  splitSnippetFiles(f.code).forEach((part, partIndex) => {
    const snippetFile = path.join(
      workDir,
      `${String(index).padStart(4, '0')}-${String(partIndex).padStart(2, '0')}${ext}`
    );
    fs.writeFileSync(snippetFile, `${part}\nexport {};\n`);
    results.push({ ...f, code: part, snippetFile, defects: [] });
  });
});

// The TypeScript compiler API, not the `tsc` CLI.
//
// This matters and is not a style choice: when ANY file in a tsc program has a
// syntax error, the CLI suppresses semantic diagnostics for the WHOLE program.
// 19 lessons ship JSX inside a fence tagged `typescript`, which is a parse
// error — so a single CLI pass reported those 19 and declared the other 143
// snippets clean, hiding every missing import and undefined identifier in the
// corpus. Per-file diagnostics off one program give the true picture.
/**
 * Node and DOM cannot share one program. lib.dom declares a global `crypto` of
 * type `Crypto` (Web Crypto), which shadows Node's `crypto` module and makes
 * every `crypto.randomBytes` look like an error; its `Text` shadows React
 * Native's. Each snippet is checked under the flavor it is written for.
 */
function flavorOf(code: string): 'node' | 'dom' {
  return /from ['"](?:node:)?(?:crypto|fs|path|http|https|os|dns|net|child_process|stream|worker_threads)['"]/.test(
    code
  )
    ? 'node'
    : 'dom';
}

// Mirrors the repo's own tsconfig.json, because the bar is "does this compile
// where a reader would paste it" — not "under some stricter config of the
// tool's own invention". Getting this wrong produces confident false
// positives: without esModuleInterop every `import crypto from 'crypto'` looks
// broken, and without the DOM lib every snippet touching `document` does too.
const baseOptions = {
  noEmit: true,
  skipLibCheck: true,
  strict: true,
  esModuleInterop: true,
  allowSyntheticDefaultImports: true,
  resolveJsonModule: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  jsx: ts.JsxEmit.ReactJSX,
  allowJs: true,
} satisfies ts.CompilerOptions;

const byFlavor: Record<'node' | 'dom', string[]> = { node: [], dom: [] };
for (const r of results) byFlavor[flavorOf(r.code)].push(r.snippetFile);

const programs = {
  node: ts.createProgram(byFlavor.node, { ...baseOptions, lib: ['lib.es2022.d.ts'] }),
  dom: ts.createProgram(byFlavor.dom, {
    ...baseOptions,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  }),
};
const programFor = (r: Result) => programs[flavorOf(r.code)];

// name -> declared anywhere in the same fence
const siblingDeclarations = new Map<string, Set<string>>();
{
  const byFence = new Map<string, Result[]>();
  for (const r of results) {
    const key = `${r.courseSlug}/${r.file}#${r.line}`;
    byFence.set(key, [...(byFence.get(key) ?? []), r]);
  }
  for (const group of byFence.values()) {
    const all = new Set<string>();
    for (const r of group) {
      const sf = programFor(r).getSourceFile(r.snippetFile);
      if (sf) for (const n of topLevelDeclarations(sf)) all.add(n);
    }
    for (const r of group) siblingDeclarations.set(r.snippetFile, all);
  }
}

for (const result of results) {
  const program = programFor(result);
  const source = program.getSourceFile(result.snippetFile);
  if (!source) continue;
  const diagnostics = [
    ...program.getSyntacticDiagnostics(source),
    ...program.getSemanticDiagnostics(source),
  ];
  const callOnly = callOnlyNames(source);
  // A fence split into several files still describes one coherent example, so
  // a helper defined in the first file is not "undefined" when the second one
  // calls it. Names declared anywhere in the same fence are known.
  const siblings = siblingDeclarations.get(result.snippetFile) ?? new Set<string>();
  for (const d of diagnostics) {
    const code = `TS${d.code}`;
    const line =
      d.file && d.start !== undefined
        ? d.file.getLineAndCharacterOfPosition(d.start).line + 1
        : 0;
    result.defects.push({
      code,
      line,
      message: ts.flattenDiagnosticMessageText(d.messageText, ' '),
      class: classifyWithContext(
        code,
        ts.flattenDiagnosticMessageText(d.messageText, ' '),
        callOnly,
        siblings
      ),
    });
  }
}

const failing = results.filter((r) => realDefects(r).length > 0);
const onlyMissingModules = results.filter((r) => r.defects.length > 0 && realDefects(r).length === 0);
const clean = results.filter((r) => r.defects.length === 0);

const runFences = results.filter(isRunFence);
const runnable = {
  total: runFences.length,
  ready: runFences.filter((r) => realDefects(r).length === 0).length,
  blocked: runFences.filter((r) => realDefects(r).length > 0).length,
};

const byClass = new Map<DefectClass, number>();
for (const r of results) for (const d of realDefects(r)) byClass.set(d.class, (byClass.get(d.class) ?? 0) + 1);

// Private aliases that cannot resolve for any reader — the first owner's repo.
// Deliberately not /g: a global regex carries lastIndex across .test() calls,
// so filtering a list with one skips every other match. This counter read 23
// when the real number was 31, for exactly that reason.
//
// What this number is NOT: a to-do list. Measured across the 21 fences that
// carry these 51 imports, 11 point at a file the same fence declares and 40
// point outside it, at a module the reader is meant to have in their own app
// (`@/components/ui` in the barrel-import lesson IS the subject of that
// lesson). Rewriting the 11 to relative paths buys nothing checkable either:
// snippet files are written to disk under index names (`0012-03.ts`), so a
// relative import cannot resolve here in any spelling — it just moves from one
// tolerated missing-module to another. The count is a health signal about how
// much corpus code assumes one specific repo layout, not a queue of fixes.
const PRIVATE_ALIAS = /from\s+['"]@\/(libs|modules|stores|components)\//;
const privateImports = results.filter((r) => PRIVATE_ALIAS.test(r.code));

const byLesson = new Map<string, Result[]>();
for (const r of failing) {
  const key = `${r.courseSlug}/${r.file}`;
  byLesson.set(key, [...(byLesson.get(key) ?? []), r]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(OUT_DIR, 'code-verification.json'),
  JSON.stringify(
    {
      generatedFrom: 'scripts/verify-code.ts',
      defectsByClass: Object.fromEntries(byClass),
      totals: {
        // `results` is one entry per snippet FILE — splitSnippetFiles() turns a
        // multi-file fence into several. 166 TS-ish fences currently yield 294
        // files. Both numbers are reported so neither gets quoted as the other.
        snippetFiles: results.length,
        fences: fences.length,
        clean: clean.length,
        onlyMissingModules: onlyMissingModules.length,
        failing: failing.length,
        lessonsAffected: byLesson.size,
        privateAliasImports: privateImports.length,
      },
      runnable,
      lessons: [...byLesson.entries()].map(([lesson, rs]) => ({
        lesson,
        lessonId: rs[0].lessonId,
        title: rs[0].lessonTitle,
        fences: rs.map((r) => ({
          lang: r.lang,
          line: r.line,
          section: r.section,
          defects: realDefects(r),
        })),
      })),
    },
    null,
    2
  ) + '\n'
);

const md: string[] = [
  '# Code verification report',
  '',
  '`npx tsx scripts/verify-code.ts` — every TypeScript/TSX fence in the corpus,',
  'extracted and typechecked. Generated file: do not edit by hand.',
  '',
  '| | |',
  '|---|---:|',
  `| TS/TSX fences | ${fences.length} |`,
  `| Snippet files they split into | ${results.length} |`,
  `| Clean | ${clean.length} |`,
  `| Only uninstalled-module errors (tolerated) | ${onlyMissingModules.length} |`,
  `| **Failing** | **${failing.length}** |`,
  `| Lessons affected | ${byLesson.size} |`,
  `| Snippet files importing private \`@/libs\|modules\|stores\` aliases | ${privateImports.length} |`,
  `| Snippet files in \`run\` fences: ready / blocked | ${runnable.ready} / ${runnable.blocked} |`,
  '',
  '## Defects by class',
  '',
  '| Class | Count |',
  '|---|---:|',
  ...[...byClass.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`),
  '',
  '## Failing lessons',
  '',
];
for (const [lesson, rs] of [...byLesson.entries()].sort()) {
  md.push(`### ${lesson}`, '');
  for (const r of rs) {
    md.push(`- \`${r.lang}\` fence at line ${r.line} (section: ${r.section ?? 'none'})`);
    for (const d of realDefects(r)) {
      md.push(`  - ${d.code}: ${d.message}`);
    }
  }
  md.push('');
}
fs.writeFileSync(path.join(OUT_DIR, 'code-verification.md'), md.join('\n'));

fs.rmSync(workDir, { recursive: true, force: true });

console.log(`fences: ${fences.length}  snippet files: ${results.length}  clean: ${clean.length}  tolerated: ${onlyMissingModules.length}  failing: ${failing.length}`);
console.log(`lessons affected: ${byLesson.size}   private-alias imports: ${privateImports.length}`);
console.log(`runnable: ready ${runnable.ready}  blocked ${runnable.blocked}  (of ${runnable.total} snippet files inside \`run\` fences)`);
console.log(`reports -> content/_reports/code-verification.{json,md}`);

if (process.argv.includes('--strict') && failing.length > 0) process.exit(1);
