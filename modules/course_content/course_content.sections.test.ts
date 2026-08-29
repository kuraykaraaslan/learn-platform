import { describe, expect, it } from 'vitest';
import { listCourseSlugs } from './course_content.manifest';
import { COURSE_SECTIONS, sectionForCourse } from './course_content.sections';
import { CourseContentService } from './course_content.service';

describe('course sections (home-page tracks)', () => {
  it('assigns every course on disk to exactly one track', () => {
    const classified = COURSE_SECTIONS.flatMap((s) => s.slugs).sort();
    expect(classified).toEqual([...listCourseSlugs()].sort());
  });

  it('never lists the same course in two tracks', () => {
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
    expect(stats.lessons).toBe(412);
    expect(stats.courses).toBe(listCourseSlugs().length);
    expect(stats.drillableLessons).toBeGreaterThan(0);
    expect(stats.drillableLessons).toBeLessThanOrEqual(stats.lessons);
    expect(stats.conceptTerms).toBeGreaterThan(0);
  });
});

describe('listCourses track metadata', () => {
  it('gives every course a section, a dominant bracket, and a cover path', () => {
    for (const course of CourseContentService.listCourses()) {
      expect(course.section).toMatch(/^(engineering|business)$/);
      expect(course.bracketCounts[course.dominantBracket]).toBeGreaterThan(0);
      // dominantBracket really is the max
      for (const [, n] of Object.entries(course.bracketCounts)) {
        expect(n).toBeLessThanOrEqual(course.bracketCounts[course.dominantBracket]);
      }
      expect(course.cover).toBe(`/covers/${course.slug}.webp`);
    }
  });
});
