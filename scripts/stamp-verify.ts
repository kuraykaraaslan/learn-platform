/**
 * The only writer of a `proof` fence's body. For every `proof` fence in the
 * corpus, runs its content/_verify/<courseSlug>/<lessonId>/'s `npm run
 * verify` command for real, and rewrites the fence to the real captured
 * stdout — never a hand-typed transcript.
 *
 * A `proof` fence is never a Run button (docs/phases/05-ci-and-proof.md):
 * the reader never executes anything themselves. What they see is exactly
 * what this script actually produced, stamped with when and against which
 * commit — and content-lint's verify/hand-edited-output rule fails the
 * build the moment a byte inside a proof fence stops matching its own
 * recorded sha, whether from hand-editing or from the underlying content
 * changing without a re-stamp.
 *
 *   npx tsx scripts/stamp-verify.ts          # writes lesson files
 *   npx tsx scripts/stamp-verify.ts --check  # re-runs, diffs, exits 1 on mismatch (CI)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { listFences, type Fence } from '../modules/course_content/course_content.fences';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'courses');
const VERIFY_ROOT = path.join(process.cwd(), 'content', '_verify');

function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 16);
}

const checkMode = process.argv.includes('--check');
const commitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
const today = new Date().toISOString().slice(0, 10);

const proofFences = listFences().filter((f) => f.lang === 'proof');

type Outcome = { fence: Fence; body: string; newSha: string; onDiskSha: string };
const outcomes: Outcome[] = [];
let missingWorkspace = 0;

for (const f of proofFences) {
  const verifyDir = path.join(VERIFY_ROOT, f.courseSlug, String(f.lessonId));
  if (!fs.existsSync(verifyDir)) {
    console.error(`No content/_verify/${f.courseSlug}/${f.lessonId} for a \`proof\` fence in ${f.courseSlug}/${f.file}`);
    missingWorkspace++;
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(verifyDir, 'package.json'), 'utf-8')) as {
    scripts?: { verify?: string };
  };
  const cmd = pkg.scripts?.verify;
  if (!cmd) throw new Error(`${verifyDir}/package.json has no "scripts.verify" command`);

  // execSync's return value is stdout only — stderr is piped away and
  // dropped unless merged into the command itself. A real terminal
  // interleaves both, and check.js's failure message (console.error, so
  // stderr) is exactly the line a reader needs to see, so merge explicitly.
  const rawOutput = execSync(`${cmd} 2>&1`, { cwd: verifyDir, encoding: 'utf-8' });
  const body = `$ ${cmd}\n${rawOutput.replace(/\n$/, '')}`;
  const newSha = sha(body);
  // What's actually written between the fence markers right now — not the
  // meta line's own sha= claim, which a hand-edit could tamper with in
  // lockstep with the body and this check must not simply trust.
  const onDiskSha = sha(f.code);

  outcomes.push({ fence: f, body, newSha, onDiskSha });
}

if (checkMode) {
  // Compares the freshly re-run output against what's actually written in
  // the file right now (onDiskSha), not against the meta line's sha=
  // attribute (recordedSha) — a hand-edit to the body, with or without a
  // matching edit to sha=, must still be caught here.
  const mismatched = outcomes.filter((o) => o.onDiskSha !== o.newSha);
  for (const o of mismatched) {
    console.error(
      `MISMATCH: ${o.fence.courseSlug}/${o.fence.file} — on-disk body sha ${o.onDiskSha}, fresh run sha ${o.newSha}. Either hand-edited, or the underlying behavior changed — run \`npx tsx scripts/stamp-verify.ts\` to re-stamp if the latter.`
    );
  }
  console.log(`checked: ${outcomes.length}  ok: ${outcomes.length - mismatched.length}  mismatched: ${mismatched.length}`);
  if (mismatched.length > 0 || missingWorkspace > 0) process.exit(1);
} else {
  let updated = 0;
  // Grouped by file, each file's fences processed bottom-to-top: rewriting
  // one fence's body changes the file's line count, which would invalidate
  // every later fence's already-computed `line` in the same file if
  // processed top-to-bottom instead.
  const byFile = new Map<string, Outcome[]>();
  for (const o of outcomes) {
    const key = `${o.fence.courseSlug}/${o.fence.file}`;
    (byFile.get(key) ?? byFile.set(key, []).get(key)!).push(o);
  }

  for (const [key, fileOutcomes] of byFile) {
    const toWrite = fileOutcomes.filter((o) => o.onDiskSha !== o.newSha);
    if (toWrite.length === 0) continue;

    const [courseSlug, file] = key.split('/');
    const filePath = path.join(CONTENT_ROOT, courseSlug, file);
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

    for (const o of toWrite.sort((a, b) => b.fence.line - a.fence.line)) {
      const openLineIdx = o.fence.line - 1;
      // ''.split('\n') is ['a one-element array'], not zero elements — an
      // empty fence body (the placeholder this script fills in the first
      // time) has 0 body lines, not 1.
      const bodyLineCount = o.fence.code === '' ? 0 : o.fence.code.split('\n').length;
      const newMetaLine = `\`\`\`proof sha=${o.newSha} at=${today} commit=${commitSha}`;
      lines.splice(openLineIdx, 1 + bodyLineCount, newMetaLine, ...o.body.split('\n'));
      updated++;
    }

    fs.writeFileSync(filePath, lines.join('\n'));
  }

  console.log(`proof fences: ${outcomes.length}  updated: ${updated}  unchanged: ${outcomes.length - updated}  missing workspace: ${missingWorkspace}`);
  if (missingWorkspace > 0) process.exit(1);
}
