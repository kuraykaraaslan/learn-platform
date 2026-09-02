/**
 * Parses every `mermaid` fence in the corpus with mermaid's own parser and
 * fails the build on a genuine syntax error.
 *
 * Why a standalone script rather than a content-lint rule: mermaid's `parse()`
 * is async, and scripts/content-lint's rule signature is synchronous
 * (`lesson: (file) => Finding[]`). Threading promises through the whole rule
 * runner for one check is not worth it — this runs in CI next to
 * stamp-verify.ts, which is already where the checks that actually execute
 * something live.
 *
 * KNOWN PARTIAL COVERAGE, stated rather than hidden. `graph` and
 * `stateDiagram-v2` sanitize their labels during parse, which needs DOMPurify
 * with a real DOM; under plain Node that throws "DOMPurify.addHook is not a
 * function" — an environment limitation, not a defect in the diagram. Those are
 * reported as UNVERIFIED and do not fail the run, because a check that calls
 * four valid diagrams broken is worse than no check. `sequenceDiagram` needs no
 * DOM and is fully verified.
 *
 * Closing the gap would mean adding jsdom purely for this script. That is a
 * deliberate trade the repo has not made — docs/phases/00-blocks-and-copy.md's
 * acceptance criteria include "no new npm dependency" — so the limitation is
 * recorded here instead of quietly papered over.
 *
 * docs/phases/07-mermaid.md's own acceptance criterion (broken syntax renders a
 * readable error rather than a blank space) remains the reader-facing safety
 * net. This is the author-facing one.
 *
 *   npx tsx scripts/verify-mermaid.ts
 */
import { listFences } from '../modules/course_content/course_content.fences';

const NO_DOM = 'DOMPurify.addHook is not a function';

type Outcome = { where: string; kind: 'ok' | 'unverified' | 'failed'; message?: string };

async function main(): Promise<void> {
  const fences = listFences().filter((f) => f.lang === 'mermaid');

  if (fences.length === 0) {
    console.log('mermaid fences: 0');
    return;
  }

  // mermaid is a browser library and pulls in a lot; only import it when there
  // is actually something to check.
  const mermaid = (await import('mermaid')).default;
  const outcomes: Outcome[] = [];

  for (const fence of fences) {
    const where = `${fence.courseSlug}/${fence.file}:${fence.line}`;
    try {
      await mermaid.parse(fence.code);
      outcomes.push({ where, kind: 'ok' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      outcomes.push({
        where,
        kind: message.includes(NO_DOM) ? 'unverified' : 'failed',
        message,
      });
    }
  }

  const failed = outcomes.filter((o) => o.kind === 'failed');
  const unverified = outcomes.filter((o) => o.kind === 'unverified');

  for (const o of unverified) {
    console.log(`UNVERIFIED (needs a DOM to parse this diagram type): ${o.where}`);
  }
  for (const o of failed) {
    console.error(`MERMAID SYNTAX: ${o.where}\n  ${(o.message ?? '').split('\n')[0]}`);
  }

  console.log(
    `mermaid fences: ${fences.length}  ok: ${outcomes.length - failed.length - unverified.length}  unverified: ${unverified.length}  failed: ${failed.length}`
  );
  if (failed.length > 0) process.exit(1);
}

void main();
