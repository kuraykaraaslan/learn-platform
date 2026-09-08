import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { listCourseSlugs, readCourseManifest } from './course_content.manifest';
import { hasCapstone, loadCapstone, hasPathCapstone, loadPathCapstone } from './course_content.capstone';
import { DEVELOPER_PATHS } from './course_content.paths';
import type { SearchRecord } from './search-client';

const index: SearchRecord[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public', 'search-index.json'), 'utf-8')
);

// docs/phases/43-path-capstone.md: a record is now addressed by its `href`
// alone, so "is this a capstone" is a question about the route, not about a
// slug field that only existed to be concatenated.
const capstoneRecords = index.filter((r) => r.href.endsWith('/capstone'));
const courseCapstones = capstoneRecords.filter((r) => r.href.startsWith('/courses/'));
const pathCapstones = capstoneRecords.filter((r) => r.href.startsWith('/paths/'));

const withCapstone = listCourseSlugs().filter(hasCapstone);
const pathsWithCapstone = DEVELOPER_PATHS.filter((p) => hasPathCapstone(p.id));

describe('the search index', () => {
  it('carries one record per lesson plus one per capstone, course and path alike', () => {
    const lessons = listCourseSlugs().reduce((n, slug) => n + readCourseManifest(slug).items.length, 0);
    expect(index).toHaveLength(lessons + withCapstone.length + pathsWithCapstone.length);
  });

  it('indexes a capstone for exactly the courses that have one', () => {
    expect(courseCapstones.map((r) => r.courseSlug).sort()).toEqual([...withCapstone].sort());
  });

  it('indexes a capstone for exactly the paths that have one', () => {
    expect(pathCapstones.map((r) => r.href).sort()).toEqual(
      pathsWithCapstone.map((p) => `/paths/${p.id}/capstone`).sort()
    );
  });

  it('gives every record a href that a route can serve', () => {
    // The launcher navigates to `record.href` verbatim. A path capstone lives
    // under a different route family than a course one, which is why the field
    // exists at all: courseSlug + lessonSlug could not address both.
    for (const record of index) {
      expect(record.href.startsWith('/courses/') || record.href.startsWith('/paths/')).toBe(true);
    }
    for (const family of [
      path.join(process.cwd(), 'app', 'courses', '[courseSlug]', 'capstone', 'page.tsx'),
      path.join(process.cwd(), 'app', '(frontend)', 'paths', '[slug]', 'capstone', 'page.tsx'),
    ]) {
      expect(fs.existsSync(family)).toBe(true);
    }
  });

  it('gives a capstone its rubric leads as the searchable mistakes', () => {
    for (const record of courseCapstones) {
      const leads = loadCapstone(record.courseSlug)!.rubric.map((row) => row.lead);
      expect(record.mistakes).toEqual(leads);
      expect(record.title.startsWith('Capstone — ')).toBe(true);
    }
    for (const record of pathCapstones) {
      const pathId = record.href.split('/')[2];
      const leads = loadPathCapstone(pathId)!.rubric.map((row) => row.lead);
      expect(record.mistakes).toEqual(leads);
      expect(record.title.startsWith('Capstone — ')).toBe(true);
    }
  });

  // docs/phases/38-search-finds-the-capstone.md: a cheat sheet repeats its
  // lessons verbatim (P33's contract), so indexing one would return every hit
  // twice and leave the reader to work out which is the source.
  it('does not index cheat sheets', () => {
    expect(index.some((r) => r.href.endsWith('/cheatsheet'))).toBe(false);
    expect(index.some((r) => r.title.toLowerCase().includes('cheat sheet'))).toBe(false);
  });
});
