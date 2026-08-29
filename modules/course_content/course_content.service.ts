import fs from 'node:fs';
import path from 'node:path';
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
import { COURSE_SECTIONS, sectionForCourse } from './course_content.sections';
import type { LessonBlock } from './course_content.blocks';
import {
  BRACKET_ORDER,
  type Bracket,
  type CatalogStats,
  type CourseSection,
  type CourseSummary,
  type Lesson,
  type LessonCard,
  type LessonFeatures,
  type LessonSections,
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

/** First sentence of a markdown blob, as plain text — for a list teaser. */
function firstSentence(markdown: string): string {
  const flat = markdown
    .replace(/\s+/g, ' ')
    .replace(/\*\*|\*|`|_/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
  const match = flat.match(/^(.+?[.!?])(\s|$)/);
  return (match ? match[1] : flat).slice(0, 180);
}

/** Rough reading time from the prose in every section (~200 wpm), min 1. */
function estimateMinutes(sections: LessonSections): number {
  const words = Object.values(sections).join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function deriveFeatures(
  blocks: Record<keyof LessonSections, LessonBlock[]>,
  drills: number
): LessonFeatures {
  const f: LessonFeatures = {
    drills,
    checklist: false,
    template: false,
    quiz: false,
    tradeoff: false,
    recall: false,
    diff: false,
    runnableCode: false,
    project: false,
    sql: false,
    mermaid: false,
  };
  for (const list of Object.values(blocks)) {
    for (const block of list) {
      if (block.kind === 'widget') {
        if (block.widget.type === 'checklist') f.checklist = true;
        else if (block.widget.type === 'template') f.template = true;
        else if (block.widget.type === 'quiz') f.quiz = true;
        else if (block.widget.type === 'tradeoff') f.tradeoff = true;
        else if (block.widget.type === 'recall') f.recall = true;
        else if (block.widget.type === 'diff') f.diff = true;
      } else if (block.kind === 'code') {
        if (block.lang === 'mermaid') f.mermaid = true;
        if (block.meta.project) f.project = true;
        else if (block.meta.run) {
          if (block.lang === 'sql') f.sql = true;
          else f.runnableCode = true;
        }
      }
    }
  }
  return f;
}

export class CourseContentService {
  static listCourses(): CourseSummary[] {
    return listCourseSlugs().map((slug) => {
      const manifest = readCourseManifest(slug);
      const bracketCounts = emptyBracketCounts();
      for (const item of manifest.items) bracketCounts[item.bracket]++;
      const section = sectionForCourse(slug);
      if (!section) {
        // course_content.sections.test.ts enforces this too, but a missing
        // classification here would otherwise mean a course with no home-page
        // section — fail loudly instead.
        throw new Error(`Course "${slug}" is not assigned to a track in course_content.sections.ts`);
      }
      const dominantBracket = BRACKET_ORDER.reduce((best, b) =>
        bracketCounts[b] > bracketCounts[best] ? b : best
      );
      return {
        slug: manifest.slug,
        title: manifest.title,
        description: manifest.description,
        count: manifest.items.length,
        bracketCounts,
        section,
        dominantBracket,
        cover: `/covers/${manifest.slug}.webp`,
      };
    });
  }

  /** Home-page catalog: the two tracks, each with its courses in the reading
   *  order declared in course_content.sections.ts. */
  static listCourseSections(): CourseSection[] {
    const bySlug = new Map(CourseContentService.listCourses().map((c) => [c.slug, c]));
    return COURSE_SECTIONS.map((section) => ({
      id: section.id,
      title: section.title,
      blurb: section.blurb,
      courses: section.slugs.flatMap((slug) => {
        const course = bySlug.get(slug);
        return course ? [course] : [];
      }),
    }));
  }

  /** Corpus-wide numbers for the hero — read from the measured reports, never
   *  typed in by hand (they go stale the moment the corpus changes). */
  static catalogStats(): CatalogStats {
    const mistakesPath = path.join(process.cwd(), 'content', '_reports', 'mistakes.json');
    const mistakes = JSON.parse(fs.readFileSync(mistakesPath, 'utf-8')) as {
      totals: { lessons: number; lessonsWithZeroDrillable: number };
    };
    return {
      lessons: mistakes.totals.lessons,
      courses: listCourseSlugs().length,
      drillableLessons: mistakes.totals.lessons - mistakes.totals.lessonsWithZeroDrillable,
      conceptTerms: Object.keys(loadConcepts()).length,
    };
  }

  static getCourseSummary(courseSlug: string): CourseSummary | null {
    if (!listCourseSlugs().includes(courseSlug)) return null;
    return CourseContentService.listCourses().find((c) => c.slug === courseSlug) ?? null;
  }

  static listLessonItems(courseSlug: string): (ManifestItem & { lessonSlug: string })[] {
    const manifest = readCourseManifest(courseSlug);
    return manifest.items.map((item) => ({ ...item, lessonSlug: fileToLessonSlug(item.file) }));
  }

  /** Course-overview list: each lesson with a teaser, a reading-time estimate,
   *  and the set of interactive mechanisms it actually contains. Parses every
   *  lesson in the course — only ever called at build time (the overview page
   *  is statically generated). */
  static listLessonCards(courseSlug: string): LessonCard[] {
    return CourseContentService.listLessonItems(courseSlug).map((item) => {
      const raw = readLessonMarkdown(courseSlug, item.file);
      const { blocks, sections } = parseLessonBlocks(raw, item.id);
      // Drills only count when the lesson is verified — an unverified lesson
      // never opens an exercise (docs/phases/01), so its Common Mistakes stay
      // plain prose regardless of how drillable their form is.
      const drills = item.verified === true ? parseMistakes(sections.commonMistakes).length : 0;
      return {
        ...item,
        teaser: firstSentence(sections.whatItIs),
        minutes: estimateMinutes(sections),
        features: deriveFeatures(blocks, drills),
      };
    });
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
      minutes: estimateMinutes(sections),
      blocks,
      mistakes: parseMistakes(sections.commonMistakes),
      concepts,
    };
  }

  /** P12 (docs/phases/12): within-course prev/next, same authored-id order
   *  as the sidebar (see getSidebarNavGroups' own comment on why bracket
   *  never reorders it). No cross-course chaining at the boundary — the
   *  first/last lesson in a course simply has no prev/next, rather than
   *  silently jumping into an unrelated course's reading order. */
  static getLessonNeighbors(
    courseSlug: string,
    lessonSlug: string
  ): { prev: { title: string; href: string } | null; next: { title: string; href: string } | null } {
    const sorted = [...CourseContentService.listLessonItems(courseSlug)].sort((a, b) => a.id - b.id);
    const index = sorted.findIndex((i) => i.lessonSlug === lessonSlug);
    if (index === -1) return { prev: null, next: null };

    const toLink = (item: (typeof sorted)[number] | undefined) =>
      item ? { title: item.title, href: `/courses/${courseSlug}/${item.lessonSlug}` } : null;

    return { prev: toLink(sorted[index - 1]), next: toLink(sorted[index + 1]) };
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
