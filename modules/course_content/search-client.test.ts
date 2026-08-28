import { describe, expect, it } from 'vitest';
import { search, type SearchRecord } from './search-client';

const RECORDS: SearchRecord[] = [
  {
    courseSlug: 'distributed-systems-api-design',
    lessonSlug: 'idempotency-key-pattern',
    courseTitle: 'Distributed Systems & API Design',
    title: 'Idempotency Key Pattern',
    mistakes: ['Not scoping keys to the API key that created them', 'Reusing a key for a different request body'],
  },
  {
    courseSlug: 'database-caching-performance',
    lessonSlug: 'connection-pool-tuning',
    courseTitle: 'Database, Caching & Performance',
    title: 'Connection Pool Tuning',
    mistakes: ['Pool exhaustion under burst traffic', 'Setting pool size without measuring actual concurrency'],
  },
];

describe('search', () => {
  it('returns nothing for a query shorter than 2 characters', () => {
    expect(search(RECORDS, 'a')).toEqual([]);
    expect(search(RECORDS, '')).toEqual([]);
  });

  it('finds a lesson by a symptom phrase in its Common Mistakes, even without knowing the concept name', () => {
    const results = search(RECORDS, 'pool exhaustion');
    expect(results).toHaveLength(1);
    expect(results[0].record.title).toBe('Connection Pool Tuning');
    expect(results[0].matchedMistake).toContain('Pool exhaustion');
  });

  it('ranks a mistake-lead match above a title-only match', () => {
    // "pool" appears in both title AND lead for one record, only nowhere for
    // the other — the mistake-weighted record should come first regardless.
    const results = search(RECORDS, 'pool');
    expect(results[0].record.title).toBe('Connection Pool Tuning');
  });

  it('is case-insensitive', () => {
    expect(search(RECORDS, 'IDEMPOTENCY')).toHaveLength(1);
  });

  it('returns nothing when nothing matches', () => {
    expect(search(RECORDS, 'zzz-no-match-zzz')).toEqual([]);
  });
});
