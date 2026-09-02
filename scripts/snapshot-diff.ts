/**
 * Classifies a content/_reports/parse-snapshot.json diff into the two kinds it
 * can contain, because only one of them is ever expected.
 *
 * A section's hash can move for two very different reasons:
 *
 *   EXPLAINED   — that section's own markdown changed. You edited it; the
 *                 render followed. Normal for any content batch.
 *   UNEXPLAINED — that section's markdown is byte-identical, and its rendered
 *                 HTML changed anyway. Something outside the section reached
 *                 in.
 *
 * The second kind is the one worth stopping for, and it is invisible in a
 * `git diff` — the file's own bytes for that section are unchanged. The case
 * that motivated this script: remark-concepts spends a whole-lesson budget of
 * concept links shared across all six sections, so adding prose to an early
 * section can silently strip a tooltip from a later one. parse-snapshot
 * recorded it faithfully; the hash was simply read as "expected, I edited that
 * lesson" and waved through.
 *
 * Exit code is 1 when anything is UNEXPLAINED, so this can gate a batch.
 *
 *   npx tsx scripts/snapshot-diff.ts             # against HEAD's snapshot
 *   npx tsx scripts/snapshot-diff.ts --base <ref>
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { buildParseSnapshot } from '../modules/course_content/course_content.snapshot';
import { splitLessonSections } from '../modules/course_content/course_content.parser';
import type { LessonSections } from '../modules/course_content/course_content.types';

const baseIdx = process.argv.indexOf('--base');
const base = baseIdx === -1 ? 'HEAD' : process.argv[baseIdx + 1];

const SNAPSHOT = 'content/_reports/parse-snapshot.json';

function showAt(ref: string, file: string): string | null {
  try {
    return execSync(`git show ${ref}:${file}`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null; // added since `ref`
  }
}

const recordedRaw = showAt(base, SNAPSHOT);
if (!recordedRaw) throw new Error(`${SNAPSHOT} does not exist at ${base}`);
const recorded = JSON.parse(recordedRaw) as ReturnType<typeof buildParseSnapshot>;
const current = buildParseSnapshot();

type Row = { lesson: string; section: string };
const explained: Row[] = [];
const unexplained: Row[] = [];

for (const [slug, lessons] of Object.entries(current.courses)) {
  for (const [file, sections] of Object.entries(lessons)) {
    const was = recorded.courses[slug]?.[file];
    if (!was) continue; // new lesson — nothing to compare against
    const moved = Object.keys(sections).filter((k) => sections[k] !== was[k]);
    if (moved.length === 0) continue;

    const lessonPath = path.join('content', 'courses', slug, file);
    const before = showAt(base, lessonPath);
    // Whole lesson unchanged but a hash moved: unexplained by definition.
    const beforeSections = before === null ? null : splitLessonSections(before).sections;
    const afterSections = splitLessonSections(fs.readFileSync(lessonPath, 'utf-8')).sections;

    for (const key of moved) {
      const row = { lesson: `${slug}/${file}`, section: key };
      if (key === 'title') {
        (before === null || splitLessonSections(before).title === splitLessonSections(fs.readFileSync(lessonPath, 'utf-8')).title
          ? unexplained
          : explained
        ).push(row);
        continue;
      }
      const k = key as keyof LessonSections;
      const sourceChanged = beforeSections !== null && beforeSections[k] !== afterSections[k];
      (sourceChanged ? explained : unexplained).push(row);
    }
  }
}

for (const r of explained) console.log(`explained    ${r.lesson}  ${r.section}`);
for (const r of unexplained) console.error(`UNEXPLAINED  ${r.lesson}  ${r.section} — markdown byte-identical, render changed`);

console.log(`\nvs ${base}: ${explained.length} explained · ${unexplained.length} unexplained`);
if (unexplained.length > 0) {
  console.error('\nA section rendered differently without its own source changing. Something outside it reached in —');
  console.error('the whole-lesson concept-link budget in remark-concepts is the known cause. Diff the rendered HTML before committing.');
  process.exit(1);
}
