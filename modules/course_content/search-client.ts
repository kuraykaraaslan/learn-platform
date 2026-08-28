// Pure, dependency-free scoring over the static index scripts/build-search-
// index.ts writes to public/search-index.json. No fuzzy-match library
// (Fuse.js et al.) — substring matching is what the spec's own examples
// need ("double charge", "lock timeout" are typed close to verbatim), and
// this keeps the search UI's own JS near-zero instead of paying for a
// general-purpose matcher this corpus doesn't need.
export type SearchRecord = {
  courseSlug: string;
  lessonSlug: string;
  courseTitle: string;
  title: string;
  mistakes: string[];
};

export type SearchResult = {
  record: SearchRecord;
  score: number;
  /** Which Common Mistakes lead matched, if any — shown as the reason a
   *  result surfaced when it wasn't the title/course that matched. */
  matchedMistake?: string;
};

// Common Mistakes leads are the reason this exists at all (docs/phases/12:
// "the one entry point for a reader who doesn't yet know the concept's
// name"), so they outweigh a title match, which any generic full-text
// search already gets right.
const MISTAKE_WEIGHT = 10;
const TITLE_WEIGHT = 5;
const COURSE_WEIGHT = 2;

export function search(records: SearchRecord[], query: string, limit = 8): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: SearchResult[] = [];
  for (const record of records) {
    let score = 0;
    let matchedMistake: string | undefined;

    for (const mistake of record.mistakes) {
      if (mistake.toLowerCase().includes(q)) {
        score += MISTAKE_WEIGHT;
        matchedMistake ??= mistake;
      }
    }
    if (record.title.toLowerCase().includes(q)) score += TITLE_WEIGHT;
    if (record.courseTitle.toLowerCase().includes(q)) score += COURSE_WEIGHT;

    if (score > 0) results.push({ record, score, matchedMistake });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
