import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const CONCEPTS_PATH = path.join(process.cwd(), 'content', 'concepts.json');

// Hand-written terms only (see docs/phases/03-concept-glossary.md) — a
// generated "define this term" pass produces a definition that drifts from
// how the corpus itself actually uses the word.
const ConceptSchema = z
  .object({
    term: z.string(),
    aliases: z.array(z.string()).optional(),
    short: z.string(),
    /** Lesson id (globally unique) that defines this term — never linked
     *  from within its own lesson. */
    lesson: z.number(),
  })
  .strict();

const ConceptsSchema = z.record(z.string(), ConceptSchema);

export type Concept = z.infer<typeof ConceptSchema>;

// Common enough to appear in nearly every lesson — auto-linking these is
// exactly the "mavi çorba" (blue soup of links) the phase spec warns
// against. Curation-time guard: a term this generic is rejected at load
// rather than silently diluting the glossary's usefulness.
const GENERIC_DENYLIST = new Set([
  'cache',
  'token',
  'queue',
  'state',
  'service',
  'api',
  'data',
  'server',
  'client',
  'request',
  'response',
  'function',
  'error',
  'user',
  'system',
]);

/** Throws on the first term that's too generic to safely auto-link.
 *  Separated from loadConcepts() so it's testable without touching the
 *  filesystem. */
export function assertNoGenericTerms(concepts: Record<string, Concept>): void {
  for (const [slug, concept] of Object.entries(concepts)) {
    if (GENERIC_DENYLIST.has(concept.term.toLowerCase())) {
      throw new Error(
        `content/concepts.json: "${slug}" defines "${concept.term}", which is on the generic-term denylist — too common to auto-link without producing noise. Pick a more specific term or phrase.`
      );
    }
  }
}

let cached: Record<string, Concept> | null = null;

/** Reads and Zod-validates content/concepts.json. Empty file (`{}`) is
 *  valid — the glossary is curated incrementally, by hand. */
export function loadConcepts(): Record<string, Concept> {
  if (cached) return cached;
  if (!fs.existsSync(CONCEPTS_PATH)) {
    cached = {};
    return cached;
  }
  const raw = JSON.parse(fs.readFileSync(CONCEPTS_PATH, 'utf-8'));
  const concepts = ConceptsSchema.parse(raw);
  assertNoGenericTerms(concepts);

  cached = concepts;
  return cached;
}

export type ConceptMatch = { slug: string; concept: Concept };

/** Client-safe projection of a Concept — resolves `lesson` (a bare id) to a
 *  real href/title via course_content.index.ts's lessonIndex(), which is
 *  filesystem-backed and must stay server-side. ui/ConceptTooltip.tsx only
 *  ever sees this shape, never the raw Concept. */
export type ConceptSummary = {
  slug: string;
  term: string;
  short: string;
  href: string;
  lessonTitle: string;
};

/**
 * Every (term or alias, lowercased) -> its concept, plus a single regex that
 * matches any of them as a whole word/phrase. Longest-first so "idempotency
 * key" is tried before a shorter alias that happens to be its prefix.
 */
/** A variant written entirely in capitals is an acronym, and the capitals are
 *  the signal. Matching it case-insensitively is how "BASE" (the ACID
 *  counterpart) came to wrap the ordinary English word "base" in 18 lessons —
 *  "base case", "base class", "base price" — handing the reader a tooltip
 *  about eventual consistency. Measured across the corpus, requiring exact
 *  case for these drops 25 links and all 25 are that same mistake; no other
 *  concept loses one, because every other acronym is written in capitals
 *  wherever it appears. */
function isAcronym(variant: string): boolean {
  return /^[A-Z][A-Z0-9-]+$/.test(variant);
}

export function buildConceptIndex(concepts: Record<string, Concept>): {
  lookup: Map<string, ConceptMatch>;
  pattern: RegExp | null;
  /** Resolves matched text to a concept, enforcing the acronym case rule.
   *  Prefer this over reading `lookup` directly — a bare lookup cannot tell
   *  "BASE" from "base". */
  resolve: (matched: string) => ConceptMatch | undefined;
} {
  const lookup = new Map<string, ConceptMatch>();
  const variants: string[] = [];
  // lowercase key -> the exact capitalisation an acronym must be written in
  const acronyms = new Map<string, string>();

  for (const [slug, concept] of Object.entries(concepts)) {
    for (const variant of [concept.term, ...(concept.aliases ?? [])]) {
      const key = variant.toLowerCase();
      if (!lookup.has(key)) lookup.set(key, { slug, concept });
      if (isAcronym(variant) && !acronyms.has(key)) acronyms.set(key, variant);
      variants.push(variant);
    }
  }

  const resolve = (matched: string): ConceptMatch | undefined => {
    const key = matched.toLowerCase();
    const exact = acronyms.get(key);
    if (exact !== undefined && matched !== exact) return undefined;
    return lookup.get(key);
  };

  if (variants.length === 0) return { lookup, pattern: null, resolve };

  const escaped = variants
    .sort((a, b) => b.length - a.length)
    .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'gi');

  return { lookup, pattern, resolve };
}
