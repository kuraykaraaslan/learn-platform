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
// Which lesson ids each term's raw text turns up in — lets a term that is
// merely self-contained be told apart from one the linker actually dropped.
const rawByLesson = new Map<string, number[]>();
if (pattern) {
  for (const slug of Object.keys(concepts)) rawOccurrences.set(slug, 0);
  const lookup = buildConceptIndex(concepts).lookup;
  for (const courseSlug of listCourseSlugs()) {
    for (const item of readCourseManifest(courseSlug).items) {
      const raw = readLessonMarkdown(courseSlug, item.file);
      pattern.lastIndex = 0;
      for (const match of raw.matchAll(pattern)) {
        const found = lookup.get(match[0].toLowerCase());
        if (!found) continue;
        rawOccurrences.set(found.slug, (rawOccurrences.get(found.slug) ?? 0) + 1);
        const seen = rawByLesson.get(found.slug) ?? [];
        if (!seen.includes(item.id)) seen.push(item.id);
        rawByLesson.set(found.slug, seen);
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

// The number this report exists to surface, and did not: a term whose text is
// somewhere in the corpus still gives the reader nothing if it never renders a
// link. `neverMatched` is a typo check and reads as reassurance on its own —
// it is currently 0 while 17 terms produce no link at all.
//
// Three causes, worth separating because only one of them is a defect:
//   own-lesson-only  the term is used only where it is defined, and a term is
//                    deliberately never linked inside its own lesson
//   unlinked-elsewhere  it appears in another lesson's text but still did not
//                    link — the per-lesson cap was spent, or every occurrence
//                    is inside code, which the plugin never descends into
//   never-matched    the text does not appear at all (already counted above)
const neverLinked = byTerm
  .filter((t) => t.lessonsLinkedIn.length === 0)
  .map((t) => {
    const own = concepts[t.slug].lesson;
    const elsewhere = rawByLesson.get(t.slug)?.filter((id) => id !== own) ?? [];
    return {
      slug: t.slug,
      term: t.term,
      cause: t.rawOccurrences === 0 ? 'never-matched' : elsewhere.length === 0 ? 'own-lesson-only' : 'unlinked-elsewhere',
      alsoAppearsInLessons: elsewhere,
    };
  });

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
        neverLinked: neverLinked.length,
        neverLinkedByCause: {
          'own-lesson-only': neverLinked.filter((t) => t.cause === 'own-lesson-only').length,
          'unlinked-elsewhere': neverLinked.filter((t) => t.cause === 'unlinked-elsewhere').length,
          'never-matched': neverLinked.filter((t) => t.cause === 'never-matched').length,
        },
        atCapLessons: atCapLessons.length,
      },
      neverMatched: neverMatched.map((t) => t.slug),
      neverLinked,
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
console.log(
  `${neverLinked.length} terms never render a link  (own-lesson-only ${neverLinked.filter((t) => t.cause === 'own-lesson-only').length} · unlinked-elsewhere ${neverLinked.filter((t) => t.cause === 'unlinked-elsewhere').length} · never-matched ${neverLinked.filter((t) => t.cause === 'never-matched').length})`
);
for (const t of neverLinked.filter((x) => x.cause === 'unlinked-elsewhere'))
  console.log(`  unlinked-elsewhere: ${t.slug} — text appears in lesson(s) ${t.alsoAppearsInLessons.join(', ')}`);
console.log('report -> content/_reports/concepts.json');
