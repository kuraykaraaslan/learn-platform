import { createHash } from 'node:crypto';
import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from './course_content.manifest';
import { parseLessonMarkdown } from './course_content.parser';
import type { LessonSections } from './course_content.types';

export type ParseSnapshot = {
  lessonCount: number;
  /** courseSlug -> lessonFile -> { title, <section>: sha256 } */
  courses: Record<string, Record<string, Record<string, string>>>;
};

function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 16);
}

/**
 * Hashes the *rendered* output of every lesson, not the raw markdown — so a
 * change that reformats source without changing what the reader sees passes,
 * and a change that alters a single rendered character fails.
 */
export function buildParseSnapshot(): ParseSnapshot {
  const courses: ParseSnapshot['courses'] = {};
  let lessonCount = 0;

  for (const slug of listCourseSlugs()) {
    const manifest = readCourseManifest(slug);
    const lessons: Record<string, Record<string, string>> = {};

    for (const item of manifest.items) {
      const raw = readLessonMarkdown(slug, item.file);
      const { title, sections } = parseLessonMarkdown(raw, item.id);
      const entry: Record<string, string> = { title: sha(title) };
      for (const [key, html] of Object.entries(sections) as [keyof LessonSections, string][]) {
        entry[key] = sha(html);
      }
      lessons[item.file] = entry;
      lessonCount++;
    }

    courses[slug] = lessons;
  }

  return { lessonCount, courses };
}
