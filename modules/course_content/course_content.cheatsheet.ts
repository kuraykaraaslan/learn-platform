// P33: the per-course cheat sheet, derived rather than written.
//
// docs/investigate/04-roadmap.md's Tier 3 item states the condition that
// shapes this entire module: "Cheat sheet seçimi mekanik kuralla yapılmalı
// (Key Concepts + mistake lead'leri, parseMistakes'i yeniden kullanarak),
// asla yeniden özetleyen bir AI geçişiyle değil."
//
// So nothing here rewrites, shortens or summarises anything. Every string that
// reaches the page is lifted verbatim out of the lesson it came from, and
// course_content.cheatsheet.test.ts asserts exactly that against the whole
// corpus — if someone later decides the output would read better "tidied up",
// the test fails rather than the corpus quietly acquiring a second, unverified
// voice.
import { parseMistakes, splitBulletItems } from './course_content.mistakes';
import { splitLessonSections } from './course_content.parser';
import { readCourseManifest, readLessonMarkdown } from './course_content.manifest';

/** Measured first, then capped — the same arrangement build-search-index.ts
 *  uses for MAX_INDEX_GZ_BYTES. The roadmap warned that a full-text course
 *  pack would be enormous (content-seo-personal-brand's 43 lessons ≈ 45k
 *  words); a cheat sheet is a few bullets per lesson, and that same course
 *  measures 80,520 bytes here — about a fifth of its full text. The cap sits
 *  above today's largest with room, and the test that enforces it names the
 *  course that would trip it first. */
export const MAX_CHEATSHEET_BYTES = 98_304;

export type CheatSheetLesson = {
  id: number;
  title: string;
  lessonSlug: string;
  /** `## Key Concepts` bullets, verbatim markdown. */
  concepts: string[];
  /** The bold opening of each Common Mistakes item — `parseMistakes().lead`,
   *  verbatim. Never the body: a cheat sheet reminds, it does not re-teach. */
  mistakes: string[];
};

export type CheatSheet = {
  courseSlug: string;
  title: string;
  description: string;
  lessons: CheatSheetLesson[];
};

/** "029_owasp_top_10.md" -> "owasp-top-10", the same derivation the service
 *  uses; duplicated rather than exported from there because that module pulls
 *  in the concept index and the whole lesson pipeline. */
function fileToLessonSlug(file: string): string {
  return file.replace(/\.md$/, '').replace(/^\d+_/, '').replace(/_/g, '-');
}

export function buildCheatSheet(courseSlug: string): CheatSheet {
  const manifest = readCourseManifest(courseSlug);

  const lessons = [...manifest.items]
    .sort((a, b) => a.id - b.id)
    .map((item) => {
      const { sections } = splitLessonSections(readLessonMarkdown(courseSlug, item.file));
      return {
        id: item.id,
        title: item.title,
        lessonSlug: fileToLessonSlug(item.file),
        concepts: splitBulletItems(sections.keyConcepts),
        mistakes: parseMistakes(sections.commonMistakes).map((m) => m.lead),
      };
    });

  return {
    courseSlug,
    title: manifest.title,
    description: manifest.description,
    lessons,
  };
}

/** The rendered size a cap is applied to: every string the page will print. */
export function cheatSheetBytes(sheet: CheatSheet): number {
  const text = sheet.lessons
    .flatMap((lesson) => [lesson.title, ...lesson.concepts, ...lesson.mistakes])
    .join('\n');
  return Buffer.byteLength(text, 'utf8');
}
