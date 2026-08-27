/**
 * One-time mechanical retag: any md/markdown-tagged fence with >=3 bold-label
 * lines (`**Label:**` at line start — the shape of a fillable document
 * template, not real markdown) gets retagged to `template`. rehype-highlight
 * doesn't recognize that language, so it prints the fence literally instead
 * of running it through the markdown grammar, which today turns bold labels
 * and any table embedded in the same fence into unreadable monospace noise.
 * course_content.blocks.ts's splitBlocks then turns a `template`-tagged
 * fence into a `{kind:'widget'}` block for ui/widgets/TemplateFormCard.tsx.
 *
 * Scope is deliberately exactly the form-shaped fences (measured: 91) — see
 * docs/phases/04-template-widgets.md. Checklist-shaped fences are handled
 * separately, by content pattern rather than a retag (see splitBlocks):
 * checkbox syntax doesn't suffer the same rendering breakage bold labels do,
 * so there's nothing here for a checklist fence to be retagged away from.
 *
 *   npx tsx scripts/retag-template-fences.ts            # writes files
 *   npx tsx scripts/retag-template-fences.ts --dry-run  # reports only
 */
import fs from 'node:fs';
import path from 'node:path';
import { listFences, type Fence } from '../modules/course_content/course_content.fences';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'courses');
const LABEL = /^\s*\*\*([^*]{2,60}):?\*\*/;
// Backtick count varies (a fence containing a nested ``` block needs 4+ to
// stay open) — captured and preserved rather than assumed to be exactly 3.
const OPEN_FENCE = /^(\s*)(`{3,})(md|markdown)\s*$/;

function labelLines(code: string): number {
  return code.split('\n').filter((l) => LABEL.test(l)).length;
}

const dryRun = process.argv.includes('--dry-run');

const candidates = listFences().filter(
  (f) => (f.lang === 'md' || f.lang === 'markdown') && labelLines(f.code) >= 3
);

const byFile = new Map<string, Fence[]>();
for (const f of candidates) {
  const key = `${f.courseSlug}/${f.file}`;
  byFile.set(key, [...(byFile.get(key) ?? []), f]);
}

let retagged = 0;
const changedFiles: string[] = [];

for (const [target, fences] of byFile) {
  const { courseSlug, file } = fences[0];
  const filePath = path.join(CONTENT_ROOT, courseSlug, file);
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

  let changed = false;
  for (const f of fences) {
    const idx = f.line - 1;
    const match = OPEN_FENCE.exec(lines[idx]);
    if (!match) {
      console.error(`SKIPPED (unexpected fence line shape): ${target}:${f.line}: ${JSON.stringify(lines[idx])}`);
      continue;
    }
    lines[idx] = `${match[1]}${match[2]}template`;
    retagged++;
    changed = true;
  }

  if (changed) {
    changedFiles.push(target);
    if (!dryRun) fs.writeFileSync(filePath, lines.join('\n'));
  }
}

console.log(`${dryRun ? '[dry run] ' : ''}retagged ${retagged} fence(s) across ${changedFiles.length} file(s)`);
if (dryRun) for (const f of changedFiles.sort()) console.log(`  ${f}`);
