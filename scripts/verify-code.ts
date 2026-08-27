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
import ts from 'typescript';
import os from 'node:os';
import path from 'node:path';
import { listFences, type Fence } from '../modules/course_content/course_content.fences';

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
  | 'syntax'
  | 'undefined-identifier'
  | 'implicit-any'
  | 'type-error';

function classify(code: string): DefectClass {
  if (code === 'TS2307') return 'missing-module';
  if (/^TS1\d{3}$/.test(code)) return 'syntax';
  if (code === 'TS2304' || code === 'TS2552') return 'undefined-identifier';
  if (code === 'TS7006' || code === 'TS7031' || code === 'TS7034' || code === 'TS7005')
    return 'implicit-any';
  return 'type-error';
}

type Defect = { code: string; line: number; message: string; class: DefectClass };
type Result = Fence & { snippetFile: string; defects: Defect[] };

function realDefects(r: Result): Defect[] {
  const hasMissingModule = r.defects.some((d) => d.class === 'missing-module');
  return r.defects.filter((d) => {
    if (d.class === 'missing-module') return false;
    if (d.class === 'implicit-any' && hasMissingModule) return false;
    return true;
  });
}

const fences = listFences().filter((f) => TS_LANGS.has(f.lang.toLowerCase()));
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-code-'));

const results: Result[] = fences.map((f, index) => {
  const ext = f.lang.toLowerCase() === 'tsx' || f.lang.toLowerCase() === 'jsx' ? '.tsx' : '.ts';
  const snippetFile = path.join(workDir, `${String(index).padStart(4, '0')}${ext}`);
  fs.writeFileSync(snippetFile, `${f.code}\nexport {};\n`);
  return { ...f, snippetFile, defects: [] };
});

// The TypeScript compiler API, not the `tsc` CLI.
//
// This matters and is not a style choice: when ANY file in a tsc program has a
// syntax error, the CLI suppresses semantic diagnostics for the WHOLE program.
// 19 lessons ship JSX inside a fence tagged `typescript`, which is a parse
// error — so a single CLI pass reported those 19 and declared the other 143
// snippets clean, hiding every missing import and undefined identifier in the
// corpus. Per-file diagnostics off one program give the true picture.
const program = ts.createProgram(
  results.map((r) => r.snippetFile),
  {
    noEmit: true,
    skipLibCheck: true,
    strict: true, // matches tsconfig.json — the bar a reader pasting this faces
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    jsx: ts.JsxEmit.ReactJSX,
    allowJs: true,
  }
);

for (const result of results) {
  const source = program.getSourceFile(result.snippetFile);
  if (!source) continue;
  const diagnostics = [
    ...program.getSyntacticDiagnostics(source),
    ...program.getSemanticDiagnostics(source),
  ];
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
      class: classify(code),
    });
  }
}

const failing = results.filter((r) => realDefects(r).length > 0);
const onlyMissingModules = results.filter((r) => r.defects.length > 0 && realDefects(r).length === 0);
const clean = results.filter((r) => r.defects.length === 0);

const byClass = new Map<DefectClass, number>();
for (const r of results) for (const d of realDefects(r)) byClass.set(d.class, (byClass.get(d.class) ?? 0) + 1);

// Private aliases that cannot resolve for any reader — the first owner's repo.
const PRIVATE_ALIAS = /from\s+['"]@\/(libs|modules|stores|components)\//g;
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
        fences: results.length,
        clean: clean.length,
        onlyMissingModules: onlyMissingModules.length,
        failing: failing.length,
        lessonsAffected: byLesson.size,
        privateAliasImports: privateImports.length,
      },
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
  `| TS/TSX fences | ${results.length} |`,
  `| Clean | ${clean.length} |`,
  `| Only uninstalled-module errors (tolerated) | ${onlyMissingModules.length} |`,
  `| **Failing** | **${failing.length}** |`,
  `| Lessons affected | ${byLesson.size} |`,
  `| Fences importing private \`@/libs\|modules\|stores\` aliases | ${privateImports.length} |`,
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

console.log(`fences: ${results.length}  clean: ${clean.length}  tolerated: ${onlyMissingModules.length}  failing: ${failing.length}`);
console.log(`lessons affected: ${byLesson.size}   private-alias imports: ${privateImports.length}`);
console.log(`reports -> content/_reports/code-verification.{json,md}`);

if (process.argv.includes('--strict') && failing.length > 0) process.exit(1);
