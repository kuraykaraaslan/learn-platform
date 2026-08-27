import { listCourseSlugs, readCourseManifest } from './course_content.manifest';

export type LessonRef = { id: number; courseSlug: string; lessonSlug: string; title: string; href: string };

/** "029_owasp_top_10.md" -> "owasp-top-10" — mirrors CourseContentService. */
function fileToLessonSlug(file: string): string {
  return file.replace(/\.md$/, '').replace(/^\d+_/, '').replace(/_/g, '-');
}

let cached: Map<number, LessonRef> | null = null;

/**
 * Lesson id -> canonical URL, built once per process from the manifests.
 *
 * Ids are globally unique across all 23 courses (asserted in
 * course_content.service.test.ts), which is what makes a bare "(#41)" in prose
 * resolvable without knowing which course the reader is in.
 */
export function lessonIndex(): Map<number, LessonRef> {
  if (cached) return cached;
  const index = new Map<number, LessonRef>();
  for (const courseSlug of listCourseSlugs()) {
    for (const item of readCourseManifest(courseSlug).items) {
      const lessonSlug = fileToLessonSlug(item.file);
      index.set(item.id, {
        id: item.id,
        courseSlug,
        lessonSlug,
        title: item.title,
        href: `/courses/${courseSlug}/${lessonSlug}`,
      });
    }
  }
  cached = index;
  return index;
}
