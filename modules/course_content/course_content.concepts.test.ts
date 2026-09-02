import { describe, expect, it } from 'vitest';
import { loadConcepts, assertNoGenericTerms, buildConceptIndex, type Concept } from './course_content.concepts';

describe('loadConcepts', () => {
  it('reads the real content/concepts.json without throwing, and every entry has a defining lesson', () => {
    const concepts = loadConcepts();
    expect(Object.keys(concepts).length).toBeGreaterThan(0);
    for (const [slug, concept] of Object.entries(concepts)) {
      expect(concept.term, slug).toBeTruthy();
      expect(concept.short, slug).toBeTruthy();
      expect(concept.lesson, slug).toBeGreaterThan(0);
    }
  });
});

describe('assertNoGenericTerms', () => {
  it('rejects a term on the generic denylist', () => {
    const concepts: Record<string, Concept> = {
      cache: { term: 'cache', short: 'x', lesson: 1 },
    };
    expect(() => assertNoGenericTerms(concepts)).toThrow(/generic-term denylist/);
  });

  it('is case-insensitive', () => {
    const concepts: Record<string, Concept> = {
      tok: { term: 'Token', short: 'x', lesson: 1 },
    };
    expect(() => assertNoGenericTerms(concepts)).toThrow();
  });

  it('accepts a specific multi-word term', () => {
    const concepts: Record<string, Concept> = {
      'idempotency-key': { term: 'idempotency key', short: 'x', lesson: 1 },
    };
    expect(() => assertNoGenericTerms(concepts)).not.toThrow();
  });
});

describe('buildConceptIndex', () => {
  it('returns a null pattern for an empty glossary', () => {
    const { lookup, pattern } = buildConceptIndex({});
    expect(lookup).toEqual(new Map());
    expect(pattern).toBeNull();
  });

  it('resolve() requires an all-caps acronym to be written in caps', () => {
    // The regression this guards: "BASE" (the ACID counterpart) matched the
    // ordinary English word "base" and wrapped it in 18 lessons — "base case",
    // "base class", "base price" — each one handing the reader a tooltip about
    // eventual consistency.
    const { resolve, pattern } = buildConceptIndex({
      base: { term: 'BASE', short: 'x', lesson: 1 },
    });
    expect(resolve('BASE')?.slug).toBe('base');
    expect(resolve('base')).toBeUndefined();
    expect(resolve('Base')).toBeUndefined();
    // The pattern still finds the word — the case rule is applied on resolve,
    // so a lowercase hit is matched and then declined rather than never seen.
    expect(pattern!.test('a base case')).toBe(true);
  });

  it('resolve() leaves ordinary terms case-insensitive', () => {
    const { resolve } = buildConceptIndex({
      'idempotency-key': { term: 'idempotency key', short: 'x', lesson: 1 },
    });
    for (const written of ['idempotency key', 'Idempotency Key', 'IDEMPOTENCY KEY'])
      expect(resolve(written)?.slug).toBe('idempotency-key');
  });

  it('matches the canonical term and every alias, case-insensitively', () => {
    const { lookup, pattern } = buildConceptIndex({
      'idempotency-key': {
        term: 'idempotency key',
        aliases: ['idempotency keys', 'idempotent key'],
        short: 'x',
        lesson: 1,
      },
    });
    expect(pattern).not.toBeNull();
    const text = 'An Idempotency Key, some idempotency keys, one idempotent key.';
    const matches = [...text.matchAll(pattern!)].map((m) => m[0]);
    expect(matches).toEqual(['Idempotency Key', 'idempotency keys', 'idempotent key']);
    for (const m of matches) expect(lookup.get(m.toLowerCase())?.slug).toBe('idempotency-key');
  });

  it('tries the longest variant first, so a longer alias is not shadowed by a shorter one', () => {
    const { pattern } = buildConceptIndex({
      a: { term: 'key', short: 'x', lesson: 1 },
      b: { term: 'idempotency key', short: 'x', lesson: 2 },
    });
    const match = pattern!.exec('an idempotency key here');
    expect(match?.[0]).toBe('idempotency key');
  });

  it('matches whole words/phrases only — no partial-word hits', () => {
    const { pattern } = buildConceptIndex({ a: { term: 'key', short: 'x', lesson: 1 } });
    expect(pattern!.test('monkey')).toBe(false);
    pattern!.lastIndex = 0;
    expect(pattern!.test('the key is here')).toBe(true);
  });
});
