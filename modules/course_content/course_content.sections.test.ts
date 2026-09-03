import { describe, expect, it } from 'vitest';
import { listCourseSlugs } from './course_content.manifest';
import {
  COURSE_SECTION_IDS,
  COURSE_SECTIONS,
  sectionForCourse,
} from './course_content.sections';
import { CourseContentService } from './course_content.service';

describe('course sections (home-page branches)', () => {
  it('assigns every course on disk to exactly one branch', () => {
    const classified = COURSE_SECTIONS.flatMap((s) => s.slugs).sort();
    expect(classified).toEqual([...listCourseSlugs()].sort());
  });

  it('never lists the same course in two branches', () => {
    const all = COURSE_SECTIONS.flatMap((s) => s.slugs);
    expect(all.length).toBe(new Set(all).size);
  });

  it('only references courses that actually exist', () => {
    const onDisk = new Set(listCourseSlugs());
    for (const section of COURSE_SECTIONS) {
      for (const slug of section.slugs) {
        expect(onDisk.has(slug) ? slug : `${slug} (missing)`).toBe(slug);
      }
    }
  });

  it('sectionForCourse round-trips with the declared membership', () => {
    for (const section of COURSE_SECTIONS) {
      for (const slug of section.slugs) {
        expect(sectionForCourse(slug)).toBe(section.id);
      }
    }
    expect(sectionForCourse('not-a-course')).toBeNull();
  });

  it('gives every branch a unique id', () => {
    const ids = COURSE_SECTIONS.map((s) => s.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('gives every branch a kebab-case id', () => {
    for (const section of COURSE_SECTIONS) {
      expect(section.id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it('gives every branch a non-empty title and blurb', () => {
    for (const section of COURSE_SECTIONS) {
      expect(section.title.trim().length).toBeGreaterThan(0);
      expect(section.blurb.trim().length).toBeGreaterThan(0);
    }
  });

  it('never declares an empty branch', () => {
    for (const section of COURSE_SECTIONS) {
      expect(section.slugs.length).toBeGreaterThan(0);
    }
  });

  // One named exception, not a silent relaxation — P13's own risk row says a
  // genuinely smaller branch changes this test WITH a reason. P14-P21 open
  // 'built-environment' one course at a time, so it lives below three until
  // P16 lands. The exception expires on its own: the test below fails the
  // moment the branch reaches three and the entry is still here.
  const UNDER_CONSTRUCTION = new Set(['built-environment']);

  it('never declares a branch smaller than three courses', () => {
    // A judgement made mechanical, the same way P11 keeps RecallCard's
    // MIN_ANSWER_LENGTH in a test: a two-course "branch" is a topic tag
    // wearing a branch's clothes, and it renders as a near-empty home-page
    // section.
    for (const section of COURSE_SECTIONS) {
      if (UNDER_CONSTRUCTION.has(section.id)) continue;
      expect(section.slugs.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps no finished branch on the under-construction list', () => {
    for (const id of UNDER_CONSTRUCTION) {
      const section = COURSE_SECTIONS.find((s) => s.id === id);
      expect(section ? id : `${id} (no such branch)`).toBe(id);
      expect(section!.slugs.length).toBeLessThan(3);
    }
  });

  it("keeps the home page CTA pointed at the first branch's first course", () => {
    // app/(frontend)/page.tsx builds the site's primary call to action from
    // sections[0].courses[0]. Appending a branch is safe; prepending one
    // silently changes where "start here" goes, and nothing else would notice.
    expect(CourseContentService.listCourseSections()[0].id).toBe('engineering');
  });

  it('listCourseSections keeps the declared order and covers every course', () => {
    const sections = CourseContentService.listCourseSections();
    expect(sections.map((s) => s.id)).toEqual(COURSE_SECTIONS.map((s) => s.id));

    for (const section of sections) {
      const declared = COURSE_SECTIONS.find((s) => s.id === section.id)!.slugs;
      expect(section.courses.map((c) => c.slug)).toEqual(declared);
    }

    const flat = sections.flatMap((s) => s.courses.map((c) => c.slug)).sort();
    expect(flat).toEqual([...listCourseSlugs()].sort());
  });
});

describe('catalogStats', () => {
  it('reports the measured corpus size, not a hardcoded guess', () => {
    const stats = CourseContentService.catalogStats();
    expect(stats.lessons).toBe(422);
    expect(stats.courses).toBe(listCourseSlugs().length);
    expect(stats.drillableLessons).toBeGreaterThan(0);
    expect(stats.drillableLessons).toBeLessThanOrEqual(stats.lessons);
    expect(stats.conceptTerms).toBeGreaterThan(0);
  });
});

describe('listCourses branch metadata', () => {
  it('gives every course a section, a dominant bracket, and a cover path', () => {
    for (const course of CourseContentService.listCourses()) {
      expect(COURSE_SECTION_IDS).toContain(course.section);
      expect(course.bracketCounts[course.dominantBracket]).toBeGreaterThan(0);
      // dominantBracket really is the max
      for (const [, n] of Object.entries(course.bracketCounts)) {
        expect(n).toBeLessThanOrEqual(course.bracketCounts[course.dominantBracket]);
      }
      expect(course.cover).toBe(`/covers/${course.slug}.webp`);
    }
  });
});
