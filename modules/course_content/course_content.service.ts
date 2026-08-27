import type { AppSidebarNavGroup } from '@kui/app/AppSidebar';
import {
  listCourseSlugs,
  readCourseManifest,
  readLessonMarkdown,
} from './course_content.manifest';
import { parseLessonBlocks } from './course_content.parser';
import { parseMistakes } from './course_content.mistakes';
import { loadConcepts, type ConceptSummary } from './course_content.concepts';
import { lessonIndex } from './course_content.index';
import {
  type Bracket,
  type CourseSummary,
  type Lesson,
  type ManifestItem,
} from './course_content.types';

/** "029_owasp_top_10.md" -> "owasp-top-10" */
function fileToLessonSlug(file: string): string {
  return file
    .replace(/\.md$/, '')
    .replace(/^\d+_/, '')
    .replace(/_/g, '-');
}

function emptyBracketCounts(): Record<Bracket, number> {
  return { '0-1': 0, '1-3': 0, '3-7': 0, '7-10': 0 };
}

export class CourseContentService {
  static listCourses(): CourseSummary[] {
    return listCourseSlugs().map((slug) => {
      const manifest = readCourseManifest(slug);
      const bracketCounts = emptyBracketCounts();
      for (const item of manifest.items) bracketCounts[item.bracket]++;
      return {
        slug: manifest.slug,
        title: manifest.title,
        description: manifest.description,
        count: manifest.items.length,
        bracketCounts,
      };
    });
  }

  static getCourseSummary(courseSlug: string): CourseSummary | null {
    if (!listCourseSlugs().includes(courseSlug)) return null;
    return CourseContentService.listCourses().find((c) => c.slug === courseSlug) ?? null;
  }

  static listLessonItems(courseSlug: string): (ManifestItem & { lessonSlug: string })[] {
    const manifest = readCourseManifest(courseSlug);
    return manifest.items.map((item) => ({ ...item, lessonSlug: fileToLessonSlug(item.file) }));
  }

  static getLesson(courseSlug: string, lessonSlug: string): Lesson | null {
    const items = CourseContentService.listLessonItems(courseSlug);
    const item = items.find((i) => i.lessonSlug === lessonSlug);
    if (!item) return null;

    const raw = readLessonMarkdown(courseSlug, item.file);
    const { blocks, sections, usedConcepts } = parseLessonBlocks(raw, item.id);

    const allConcepts = loadConcepts();
    const lessons = lessonIndex();
    const concepts: Record<string, ConceptSummary> = Object.fromEntries(
      usedConcepts.flatMap((slug) => {
        const concept = allConcepts[slug];
        const definingLesson = lessons.get(concept.lesson);
        if (!definingLesson) return [];
        const summary: ConceptSummary = {
          slug,
          term: concept.term,
          short: concept.short,
          href: definingLesson.href,
          lessonTitle: definingLesson.title,
        };
        return [[slug, summary]];
      })
    );

    return {
      ...item,
      courseSlug,
      blocks,
      mistakes: parseMistakes(sections.commonMistakes),
      concepts,
    };
  }

  /** Sidebar nav: a single flat list in AUTHORED order (manifest id).
   *
   * This used to sort by experience bracket first, which reordered 20 of the
   * 23 courses and broke the sequence the lessons were written in — a reader
   * opening business-finance-solo-ops landed on 352 "Ethical Growth" instead
   * of 316 "Cash Flow and Runway", which every later lesson builds on. The
   * bracket is a property of a lesson, not its position; it is shown as a
   * badge (see CourseOverviewPage and LessonPage), never as an ordering. */
  static getSidebarNavGroups(courseSlug: string): AppSidebarNavGroup[] {
    const items = CourseContentService.listLessonItems(courseSlug);
    const sorted = [...items].sort((a, b) => a.id - b.id);

    return [
      {
        items: sorted.map((i) => ({
          id: i.lessonSlug,
          label: i.title,
          href: `/courses/${courseSlug}/${i.lessonSlug}`,
        })),
      },
    ];
  }
}
