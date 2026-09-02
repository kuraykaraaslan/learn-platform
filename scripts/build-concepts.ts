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
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { splitLessonSections } from '../modules/course_content/course_content.parser';

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
  const resolveRaw = buildConceptIndex(concepts).resolve;
  for (const courseSlug of listCourseSlugs()) {
    for (const item of readCourseManifest(courseSlug).items) {
      const raw = readLessonMarkdown(courseSlug, item.file);
      pattern.lastIndex = 0;
      for (const match of raw.matchAll(pattern)) {
        const found = resolveRaw(match[0]);
        if (!found) continue;
        rawOccurrences.set(found.slug, (rawOccurrences.get(found.slug) ?? 0) + 1);
        const seen = rawByLesson.get(found.slug) ?? [];
        if (!seen.includes(item.id)) seen.push(item.id);
        rawByLesson.set(found.slug, seen);
      }
    }
  }
}

// Exactly the text remark-concepts can see. It matches inside `text` nodes
// only, and skips link/linkReference subtrees — so `inlineCode` and fenced
// `code` are unreachable by construction, not by a strip-the-tags
// approximation. Collecting the same nodes here is what lets a term the cap
// dropped be told apart from one that only ever occurs inside code.
const mdast = unified().use(remarkParse).use(remarkGfm);

function linkableText(markdown: string): string {
  const out: string[] = [];
  const walk = (node: { type: string; value?: string; children?: unknown[] }) => {
    if (node.type === 'link' || node.type === 'linkReference') return;
    if (node.type === 'text' && typeof node.value === 'string') out.push(node.value);
    if (Array.isArray(node.children)) for (const c of node.children) walk(c as typeof node);
  };
  walk(mdast.parse(markdown) as unknown as { type: string; children?: unknown[] });
  return out.join('\n');
}

const linkableByLesson = new Map<string, number[]>(); // pattern resolved TO this slug
// Same text, but asking only "do these words occur", ignoring which concept the
// shared alternation awards the span to. A term present here and absent above
// was out-matched by an overlapping variant of another concept — e.g.
// "connection pool exhaustion" is claimed by connection-pooling's alias
// "connection pool", which consumes the word `pool` before `pool exhaustion`
// can match. That is a distinct failure from occurring only inside code.
const presentByLesson = new Map<string, number[]>();
const presentRawByLesson = new Map<string, number[]>();
const looseRawByLesson = new Map<string, number[]>();
const plainRe = new Map<string, RegExp>();      // as the acronym rule requires
const plainReLoose = new Map<string, RegExp>(); // ignoring case entirely
const esc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const acronym = (v: string) => /^[A-Z][A-Z0-9-]+$/.test(v);
for (const [slug, c] of Object.entries(concepts)) {
  const variants = [c.term, ...(c.aliases ?? [])];
  // An acronym only counts where it is written in capitals — same rule
  // buildConceptIndex's resolve() applies, so the report cannot claim a term
  // is reachable in prose the linker will refuse.
  const caseAware = variants.map((v) => (acronym(v) ? `(?-i:${esc(v)})` : esc(v)));
  plainRe.set(
    slug,
    variants.every(acronym)
      ? new RegExp(`\\b(?:${variants.map(esc).join('|')})\\b`)
      : new RegExp(`\\b(?:${caseAware.join('|')})\\b`, 'i')
  );
  plainReLoose.set(slug, new RegExp(`\\b(?:${variants.map(esc).join('|')})\\b`, 'i'));
}
{
  const { resolve, pattern } = buildConceptIndex(concepts);
  if (pattern) {
    for (const courseSlug of listCourseSlugs()) {
      for (const item of readCourseManifest(courseSlug).items) {
        const sections = splitLessonSections(readLessonMarkdown(courseSlug, item.file)).sections;
        const text = linkableText(Object.values(sections).join('\n\n'));
        pattern.lastIndex = 0;
        for (const match of text.matchAll(pattern)) {
          const found = resolve(match[0]);
          if (!found) continue;
          const seen = linkableByLesson.get(found.slug) ?? [];
          if (!seen.includes(item.id)) seen.push(item.id);
          linkableByLesson.set(found.slug, seen);
        }
        const rawMd = readLessonMarkdown(courseSlug, item.file);
        for (const [slug, re] of plainRe) {
          if (re.test(text)) {
            const seen = presentByLesson.get(slug) ?? [];
            if (!seen.includes(item.id)) seen.push(item.id);
            presentByLesson.set(slug, seen);
          }
          if (re.test(rawMd)) {
            const seen = presentRawByLesson.get(slug) ?? [];
            if (!seen.includes(item.id)) seen.push(item.id);
            presentRawByLesson.set(slug, seen);
          }
          if (plainReLoose.get(slug)!.test(rawMd)) {
            const seen = looseRawByLesson.get(slug) ?? [];
            if (!seen.includes(item.id)) seen.push(item.id);
            looseRawByLesson.set(slug, seen);
          }
        }
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
    const rawElsewhere = rawByLesson.get(t.slug)?.filter((id) => id !== own) ?? [];
    const linkableElsewhere = linkableByLesson.get(t.slug)?.filter((id) => id !== own) ?? [];
    const presentElsewhere = presentByLesson.get(t.slug)?.filter((id) => id !== own) ?? [];
    const presentRaw = presentRawByLesson.get(t.slug) ?? [];
    // Ordered on the plain scans, not on the shared pattern: the pattern awards
    // an overlapping span to whichever variant it reaches first, so using it to
    // answer "does this term occur here at all" mislabels a shadowed term as
    // one that simply never occurs. pool-exhaustion is the case that caught it.
    const looseElsewhere = (looseRawByLesson.get(t.slug) ?? []).filter((id) => id !== own);
    const cause =
      presentRaw.length === 0
        ? looseElsewhere.length > 0
          ? 'case-mismatch'
          : 'never-matched'
        : presentRaw.filter((id) => id !== own).length === 0
          ? looseElsewhere.length > 0
            ? 'case-mismatch'
            : 'own-lesson-only'
          : linkableElsewhere.length > 0
            ? 'cap-starved'
            : presentElsewhere.length > 0
              ? 'shadowed'
              : 'code-only';
    return {
      slug: t.slug,
      term: t.term,
      cause,
      linkableInLessons: linkableElsewhere,
      presentInLessons: presentElsewhere,
      alsoAppearsInLessons: rawElsewhere,
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
          'code-only': neverLinked.filter((t) => t.cause === 'code-only').length,
          shadowed: neverLinked.filter((t) => t.cause === 'shadowed').length,
          'case-mismatch': neverLinked.filter((t) => t.cause === 'case-mismatch').length,
          'cap-starved': neverLinked.filter((t) => t.cause === 'cap-starved').length,
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
const count = (c: string) => neverLinked.filter((t) => t.cause === c).length;
console.log(
  `${neverLinked.length} terms never render a link  (own-lesson-only ${count('own-lesson-only')} · code-only ${count('code-only')} · shadowed ${count('shadowed')} · case-mismatch ${count('case-mismatch')} · cap-starved ${count('cap-starved')} · never-matched ${count('never-matched')})`
);
for (const t of neverLinked.filter((x) => x.cause === 'case-mismatch'))
  console.log(`  case-mismatch: ${t.slug} — an acronym, written in some other case wherever it appears outside its own lesson`);
for (const t of neverLinked.filter((x) => x.cause === 'shadowed'))
  console.log(`  shadowed: ${t.slug} — words present in lesson(s) ${t.presentInLessons.join(', ')}, but an overlapping variant of another concept claims the span`);
for (const t of neverLinked.filter((x) => x.cause === 'cap-starved'))
  console.log(`  cap-starved: ${t.slug} — linkable prose in lesson(s) ${t.linkableInLessons.join(', ')}, but the 4-link cap was already spent`);
console.log('report -> content/_reports/concepts.json');
