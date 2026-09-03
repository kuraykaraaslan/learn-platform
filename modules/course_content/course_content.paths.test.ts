import { describe, expect, it } from 'vitest';
import {
  DEVELOPER_PATHS,
  DEVELOPER_PATH_IDS,
  pathsForLesson,
} from './course_content.paths';
import { lessonIndex } from './course_content.index';
import { CourseContentService } from './course_content.service';

describe('developer paths', () => {
  it('declares exactly four paths', () => {
    // docs/phases/23-developer-paths.md: four hand-curated cross-course
    // reading orders. Not a hard invariant of the type, but a decision worth
    // a test — a fifth path is a choice, not an accident.
    expect(DEVELOPER_PATHS).toHaveLength(4);
  });

  it('gives every path a unique kebab-case id, derived into the union', () => {
    const ids = DEVELOPER_PATHS.map((p) => p.id);
    expect(ids.length).toBe(new Set(ids).size);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    expect([...DEVELOPER_PATH_IDS].sort()).toEqual([...ids].sort());
  });

  it('keeps every path between 8 and 16 steps', () => {
    for (const path of DEVELOPER_PATHS) {
      expect(path.steps.length).toBeGreaterThanOrEqual(8);
      expect(path.steps.length).toBeLessThanOrEqual(16);
    }
  });

  it('never repeats a lesson id within one path', () => {
    for (const path of DEVELOPER_PATHS) {
      expect(path.steps.length).toBe(new Set(path.steps).size);
    }
  });

  it('resolves every step to a real lesson', () => {
    const index = lessonIndex();
    for (const path of DEVELOPER_PATHS) {
      for (const id of path.steps) {
        expect(index.has(id) ? id : `${id} (missing)`).toBe(id);
      }
    }
  });

  it('draws every path from at least two distinct courses', () => {
    // The line between a path and a branch: a path that repeats one course's
    // lesson list is just a copy of that course's overview, not curation.
    for (const path of DEVELOPER_PATHS) {
      const resolved = CourseContentService.getPath(path.id)!;
      expect(resolved.courseCount).toBeGreaterThanOrEqual(2);
    }
  });

  it('gives every path a non-empty title and blurb', () => {
    for (const path of DEVELOPER_PATHS) {
      expect(path.title.trim().length).toBeGreaterThan(0);
      expect(path.blurb.trim().length).toBeGreaterThan(0);
    }
  });

  it('pathsForLesson returns every path a lesson is in, and an empty array otherwise', () => {
    // A lesson in no path is expected, not a defect.
    const firstStep = DEVELOPER_PATHS[0].steps[0];
    expect(pathsForLesson(firstStep).map((p) => p.id)).toContain(DEVELOPER_PATHS[0].id);

    // 1 is a fundamentals lesson id that no built-environment path touches.
    expect(pathsForLesson(1)).toEqual([]);

    // Cross-check against the raw data for every lesson in the corpus.
    for (const id of lessonIndex().keys()) {
      const expected = DEVELOPER_PATHS.filter((p) => p.steps.some((s) => s === id)).map((p) => p.id);
      expect(pathsForLesson(id).map((p) => p.id)).toEqual(expected);
    }
  });
});

describe('CourseContentService path resolution', () => {
  it('listPaths summarises all four with measured step and course counts', () => {
    const summaries = CourseContentService.listPaths();
    expect(summaries.map((s) => s.id)).toEqual(DEVELOPER_PATHS.map((p) => p.id));
    for (const s of summaries) {
      const def = DEVELOPER_PATHS.find((p) => p.id === s.id)!;
      expect(s.stepCount).toBe(def.steps.length);
      expect(s.courseCount).toBeGreaterThanOrEqual(2);
    }
  });

  it('getPath resolves steps in declared order and groups them by course keeping that order', () => {
    for (const def of DEVELOPER_PATHS) {
      const path = CourseContentService.getPath(def.id)!;
      expect(path.steps.map((s) => s.id)).toEqual([...def.steps]);

      const regrouped = path.byCourse.flatMap((g) => g.steps.map((s) => s.id));
      // Every step appears once across the groups.
      expect(regrouped.sort((a, b) => a - b)).toEqual([...def.steps].sort((a, b) => a - b));
      // Within a course group, steps keep the path's relative order.
      const order = [...def.steps] as number[];
      for (const group of path.byCourse) {
        const positions = group.steps.map((s) => order.indexOf(s.id));
        expect(positions).toEqual([...positions].sort((a, b) => a - b));
      }
    }
  });

  it('getPath returns null for an unknown id', () => {
    expect(CourseContentService.getPath('not-a-path')).toBeNull();
  });
});
