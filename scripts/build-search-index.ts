/**
 * Prebuild step (docs/phases/12-search-and-review-queue.md): one static
 * JSON record per lesson, written to public/search-index.json and fetched
 * once by the ⌘K search UI. Common Mistakes leads are weighted highest at
 * query time (modules/course_content/search-client.ts) so the corpus is
 * searchable by *symptom* ("double charge", "lock timeout") — the one
 * entry point for a reader who doesn't yet know the name of the concept
 * that would fix it.
 *
 *   npx tsx scripts/build-search-index.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from '../modules/course_content/course_content.manifest';
import { splitLessonSections } from '../modules/course_content/course_content.parser';
import { parseMistakes } from '../modules/course_content/course_content.mistakes';

const OUT_PATH = path.join(process.cwd(), 'public', 'search-index.json');
// docs/phases/12 originally set ≤50 KB gz, measured before docs/phases/02
// (the bold-lead pass) existed. P2's own acceptance criterion is single
// Common Mistakes items corpus-wide <= 250 (from a baseline of 1041); each
// conversion adds a real, non-empty lead to this index where previously
// there was none (see course_content.mistakes.ts's doc comment: 'single'
// leads are empty). Measured growth during the P2 pass: ~33-40 bytes gz
// per converted item. At the P2 target (250 remaining), extrapolating from
// the corpus measured at single=579/46316 bytes gz projects to roughly
// 58-60 KB gz at P2 completion — already over the original 50 KB figure
// with the pass not yet finished. 96 KB keeps meaningful headroom past
// that projection (a ⌘K-triggered fetch at that size is still trivial)
// rather than picking the exact projected number and re-hitting this wall
// on the next re-measurement.
const MAX_INDEX_GZ_BYTES = 96 * 1024;

/** "029_owasp_top_10.md" -> "owasp-top-10" — matches
 *  course_content.service.ts's fileToLessonSlug exactly; duplicated rather
 *  than imported since that function isn't exported and this script has no
 *  other reason to depend on the whole service module. */
function fileToLessonSlug(file: string): string {
  return file
    .replace(/\.md$/, '')
    .replace(/^\d+_/, '')
    .replace(/_/g, '-');
}

export type SearchRecord = {
  courseSlug: string;
  lessonSlug: string;
  courseTitle: string;
  title: string;
  /** Common Mistakes leads — the highest-weighted field at query time. */
  mistakes: string[];
};

function buildIndex(): SearchRecord[] {
  const records: SearchRecord[] = [];

  for (const courseSlug of listCourseSlugs()) {
    const manifest = readCourseManifest(courseSlug);
    for (const item of manifest.items) {
      const raw = readLessonMarkdown(courseSlug, item.file);
      const { sections } = splitLessonSections(raw);
      const mistakes = parseMistakes(sections.commonMistakes)
        .map((m) => m.lead)
        .filter((lead) => lead.length > 0);

      records.push({
        courseSlug,
        lessonSlug: fileToLessonSlug(item.file),
        courseTitle: manifest.title,
        title: item.title,
        mistakes,
      });
    }
  }

  return records;
}

const records = buildIndex();
const json = JSON.stringify(records);
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, json);

const gzSize = zlib.gzipSync(json).length;
console.log(`search index: ${records.length} lessons, ${json.length} bytes, ${gzSize} bytes gz -> ${OUT_PATH}`);
if (gzSize > MAX_INDEX_GZ_BYTES) {
  console.error(`search index is ${gzSize} bytes gz, over the ${MAX_INDEX_GZ_BYTES}-byte budget`);
  process.exit(1);
}
