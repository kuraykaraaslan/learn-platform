/**
 * Prebuild step (docs/phases/12-search-and-review-queue.md): every
 * drillable Common Mistakes item, from every VERIFIED lesson, written to
 * public/review-index.json. The Return Queue (/review) has no deck of its
 * own — it schedules replays of exactly this content, keyed identically to
 * progress.store.ts's mistakeKey() so a reviewBox entry (box, next review
 * date) looks itself up here by the same key it's stored under.
 *
 * Unverified lessons are excluded for the same reason FailureDrillCard and
 * QuizCard never open on one: never open an exercise on content that
 * hasn't passed the mechanical gates (docs/phases/README's invariant #3).
 *
 *   npx tsx scripts/build-review-index.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from '../modules/course_content/course_content.manifest';
import { splitLessonSections } from '../modules/course_content/course_content.parser';
import { parseMistakes } from '../modules/course_content/course_content.mistakes';
import { mistakeKey } from '../modules/progress/progress.store';
import type { ReviewCard } from '../modules/progress/review-card';

const OUT_PATH = path.join(process.cwd(), 'public', 'review-index.json');

/** "029_owasp_top_10.md" -> "owasp-top-10" — duplicated from
 *  course_content.service.ts for the same reason build-search-index.ts
 *  duplicates it: that function isn't exported, and this is the only other
 *  place that needs it. */
function fileToLessonSlug(file: string): string {
  return file
    .replace(/\.md$/, '')
    .replace(/^\d+_/, '')
    .replace(/_/g, '-');
}

function buildIndex(): ReviewCard[] {
  const cards: ReviewCard[] = [];

  for (const courseSlug of listCourseSlugs()) {
    const manifest = readCourseManifest(courseSlug);
    for (const item of manifest.items) {
      if (item.verified !== true) continue;

      const raw = readLessonMarkdown(courseSlug, item.file);
      const { sections } = splitLessonSections(raw);
      const mistakes = parseMistakes(sections.commonMistakes).filter((m) => m.form !== 'single');

      for (const m of mistakes) {
        cards.push({
          key: mistakeKey(courseSlug, item.file, m.id),
          courseSlug,
          lessonSlug: fileToLessonSlug(item.file),
          lessonTitle: item.title,
          lead: m.lead,
          bodyHtml: m.bodyHtml,
        });
      }
    }
  }

  return cards;
}

const cards = buildIndex();
const json = JSON.stringify(cards);
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, json);

const gzSize = zlib.gzipSync(json).length;
console.log(`review index: ${cards.length} cards, ${json.length} bytes, ${gzSize} bytes gz -> ${OUT_PATH}`);
