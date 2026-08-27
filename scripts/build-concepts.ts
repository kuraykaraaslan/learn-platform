/**
 * Coverage report for content/concepts.json: which terms actually got linked
 * and where, which terms never matched anywhere in the corpus (a likely typo
 * — the term text doesn't appear the way it's spelled), and which lessons hit
 * the 4-link-per-lesson cap (an approximation: exactly 4 distinct concepts
 * used in one lesson strongly suggests the cap bit, but a lesson could
 * legitimately have exactly 4 and no more available).
 *
 *   npx tsx scripts/build-concepts.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from '../modules/course_content/course_content.manifest';
import { parseLessonBlocks } from '../modules/course_content/course_content.parser';
import { loadConcepts, buildConceptIndex } from '../modules/course_content/course_content.concepts';

const OUT_DIR = path.join(process.cwd(), 'content', '_reports');

const concepts = loadConcepts();
const { pattern } = buildConceptIndex(concepts);

const linkedInLessons = new Map<string, Set<string>>(); // slug -> {courseSlug/file}
const atCapLessons: string[] = [];
let totalLessons = 0;

for (const courseSlug of listCourseSlugs()) {
  for (const item of readCourseManifest(courseSlug).items) {
    totalLessons++;
    const raw = readLessonMarkdown(courseSlug, item.file);
    const { usedConcepts } = parseLessonBlocks(raw, item.id);
    const target = `${courseSlug}/${item.file}`;

    for (const slug of usedConcepts) {
      const set = linkedInLessons.get(slug) ?? new Set<string>();
      set.add(target);
      linkedInLessons.set(slug, set);
    }
    if (usedConcepts.length >= 4) atCapLessons.push(target);
  }
}

// Raw text scan — independent of linking outcome (self-link exclusion,
// per-lesson cap, already-linked-this-section) — so a term with real
// occurrences but zero links is distinguished from one that's simply never
// spelled the way concepts.json says it is.
const rawOccurrences = new Map<string, number>();
if (pattern) {
  for (const slug of Object.keys(concepts)) rawOccurrences.set(slug, 0);
  const lookup = buildConceptIndex(concepts).lookup;
  for (const courseSlug of listCourseSlugs()) {
    for (const item of readCourseManifest(courseSlug).items) {
      const raw = readLessonMarkdown(courseSlug, item.file);
      pattern.lastIndex = 0;
      for (const match of raw.matchAll(pattern)) {
        const found = lookup.get(match[0].toLowerCase());
        if (found) rawOccurrences.set(found.slug, (rawOccurrences.get(found.slug) ?? 0) + 1);
      }
    }
  }
}

const byTerm = Object.keys(concepts)
  .sort()
  .map((slug) => ({
    slug,
    term: concepts[slug].term,
    lessonsLinkedIn: [...(linkedInLessons.get(slug) ?? [])].sort(),
    rawOccurrences: rawOccurrences.get(slug) ?? 0,
  }));

const neverMatched = byTerm.filter((t) => t.rawOccurrences === 0);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(OUT_DIR, 'concepts.json'),
  JSON.stringify(
    {
      generatedFrom: 'scripts/build-concepts.ts',
      totalTerms: Object.keys(concepts).length,
      totalLessons,
      totals: {
        neverMatched: neverMatched.length,
        atCapLessons: atCapLessons.length,
      },
      neverMatched: neverMatched.map((t) => t.slug),
      atCapLessons: atCapLessons.sort(),
      byTerm,
    },
    null,
    2
  ) + '\n'
);

console.log(
  `${Object.keys(concepts).length} terms · ${totalLessons} lessons · ${neverMatched.length} never matched · ${atCapLessons.length} lessons at the 4-link cap`
);
console.log('report -> content/_reports/concepts.json');
