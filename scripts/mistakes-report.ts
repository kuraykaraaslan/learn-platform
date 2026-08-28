/**
 * P2 (docs/phases/02-bold-lead-pass.md) progress measurement — the
 * acceptance criteria's own tool, not a proxy for it. Prints per-lesson
 * {single, drillable, form distribution} and writes
 * content/_reports/mistakes.json. Re-run after any bold-lead pass to see
 * whether `single` actually dropped and `>=2 drillable` actually grew —
 * the two corpus-wide numbers the phase is graded on.
 *
 *   npx tsx scripts/mistakes-report.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from '../modules/course_content/course_content.manifest';
import { splitLessonSections } from '../modules/course_content/course_content.parser';
import { parseMistakes, type MistakeForm } from '../modules/course_content/course_content.mistakes';

const OUT_PATH = path.join(process.cwd(), 'content', '_reports', 'mistakes.json');

type LessonReport = {
  courseSlug: string;
  file: string;
  verified: boolean;
  total: number;
  single: number;
  drillable: number;
  formCounts: Record<MistakeForm, number>;
};

const EMPTY_FORM_COUNTS = (): Record<MistakeForm, number> => ({
  'bold-dash': 0,
  'bold-colon': 0,
  'bold-space': 0,
  'plain-dash': 0,
  single: 0,
});

const lessons: LessonReport[] = [];

for (const courseSlug of listCourseSlugs()) {
  const manifest = readCourseManifest(courseSlug);
  for (const item of manifest.items) {
    const raw = readLessonMarkdown(courseSlug, item.file);
    const { sections } = splitLessonSections(raw);
    const mistakes = parseMistakes(sections.commonMistakes);

    const formCounts = EMPTY_FORM_COUNTS();
    for (const m of mistakes) formCounts[m.form]++;

    lessons.push({
      courseSlug,
      file: item.file,
      verified: item.verified === true,
      total: mistakes.length,
      single: formCounts.single,
      drillable: mistakes.length - formCounts.single,
      formCounts,
    });
  }
}

const totalSingle = lessons.reduce((sum, l) => sum + l.single, 0);
const drillableLessons = lessons.filter((l) => l.drillable >= 2).length;
const zeroMistakeLessons = lessons.filter((l) => l.total === 0).length;

const report = {
  generatedFrom: 'scripts/mistakes-report.ts',
  totals: {
    lessons: lessons.length,
    single: totalSingle,
    lessonsWithZeroDrillable: lessons.filter((l) => l.drillable === 0).length,
    lessonsWithNoMistakesAtAll: zeroMistakeLessons,
    lessonsWithTwoPlusDrillable: drillableLessons,
  },
  lessons,
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');

console.log(
  `mistakes: ${lessons.length} lessons  single: ${totalSingle}  >=2 drillable: ${drillableLessons}  0 mistakes: ${zeroMistakeLessons}`
);
console.log(`report -> ${OUT_PATH}`);
