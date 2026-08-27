import { describe, expect, it } from 'vitest';
import { CourseContentService } from './course_content.service';
import { listCourseSlugs, readCourseManifest } from './course_content.manifest';

describe('lesson ordering', () => {
  it('follows the authored manifest order in the sidebar, not the experience bracket', () => {
    // Regression guard for the bracket-before-id sort that reordered 20 of the
    // 23 courses. This course is the worst case: bracket sorting promoted 352
    // "Ethical Growth" (authored 37th) above 316 "Cash Flow and Runway", the
    // lesson every later one builds on.
    const [group] = CourseContentService.getSidebarNavGroups('business-finance-solo-ops');
    const manifest = readCourseManifest('business-finance-solo-ops');
    const authored = [...manifest.items].sort((a, b) => a.id - b.id);

    expect(group.items.map((i) => i.label)).toEqual(authored.map((i) => i.title));
    expect(group.items[0].label).toBe(authored[0].title);
  });

  it('never reorders any course away from its manifest sequence', () => {
    for (const slug of listCourseSlugs()) {
      const [group] = CourseContentService.getSidebarNavGroups(slug);
      const authored = [...readCourseManifest(slug).items].sort((a, b) => a.id - b.id);
      expect({ [slug]: group.items.map((i) => i.label) }).toEqual({
        [slug]: authored.map((i) => i.title),
      });
    }
  });

  it('gives every lesson a unique slug within its course', () => {
    for (const slug of listCourseSlugs()) {
      const slugs = CourseContentService.listLessonItems(slug).map((i) => i.lessonSlug);
      expect({ [slug]: slugs.length }).toEqual({ [slug]: new Set(slugs).size });
    }
  });

  it('gives every lesson a globally unique id, so "#N" cross-references resolve', () => {
    const seen = new Map<number, string>();
    for (const slug of listCourseSlugs()) {
      for (const item of readCourseManifest(slug).items) {
        expect(seen.has(item.id) ? `${item.id} also in ${seen.get(item.id)}` : 'unique').toBe(
          'unique'
        );
        seen.set(item.id, slug);
      }
    }
    expect(seen.size).toBe(412);
  });
});
