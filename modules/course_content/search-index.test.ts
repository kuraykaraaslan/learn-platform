import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { listCourseSlugs, readCourseManifest } from './course_content.manifest';
import { hasCapstone, loadCapstone } from './course_content.capstone';
import type { SearchRecord } from './search-client';

const index: SearchRecord[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public', 'search-index.json'), 'utf-8')
);

const capstoneRecords = index.filter((r) => r.lessonSlug === 'capstone');
const withCapstone = listCourseSlugs().filter(hasCapstone);

describe('the search index', () => {
  it('carries one record per lesson plus one per capstone', () => {
    const lessons = listCourseSlugs().reduce((n, slug) => n + readCourseManifest(slug).items.length, 0);
    expect(index).toHaveLength(lessons + withCapstone.length);
  });

  it('indexes a capstone for exactly the courses that have one', () => {
    expect(capstoneRecords.map((r) => r.courseSlug).sort()).toEqual([...withCapstone].sort());
  });

  it('addresses the capstone route with the existing record shape', () => {
    // SearchLauncher builds /courses/<courseSlug>/<lessonSlug>; the capstone
    // route is /courses/<slug>/capstone, so no new field is needed. This test
    // is what keeps that true if either side moves.
    for (const record of capstoneRecords) {
      expect(record.lessonSlug).toBe('capstone');
      const route = path.join(process.cwd(), 'app', 'courses', '[courseSlug]', 'capstone', 'page.tsx');
      expect(fs.existsSync(route)).toBe(true);
    }
  });

  it('gives a capstone its rubric leads as the searchable mistakes', () => {
    for (const record of capstoneRecords) {
      const leads = loadCapstone(record.courseSlug)!.rubric.map((row) => row.lead);
      expect(record.mistakes).toEqual(leads);
      expect(record.title.startsWith('Capstone — ')).toBe(true);
    }
  });

  // docs/phases/38-search-finds-the-capstone.md: a cheat sheet repeats its
  // lessons verbatim (P33's contract), so indexing one would return every hit
  // twice and leave the reader to work out which is the source.
  it('does not index cheat sheets', () => {
    expect(index.some((r) => r.lessonSlug === 'cheatsheet')).toBe(false);
    expect(index.some((r) => r.title.toLowerCase().includes('cheat sheet'))).toBe(false);
  });
});
