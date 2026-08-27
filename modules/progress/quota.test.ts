import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQuotaSafeStorage } from './quota';

function quotaExceeded(): DOMException {
  return new DOMException('quota exceeded', 'QuotaExceededError');
}

/** A fake localStorage that rejects any write over `limit` bytes — enough to
 *  drive quota.ts's retry/eviction loop without a real browser. */
function makeFakeLocalStorage(limit: number) {
  const data = new Map<string, string>();
  return {
    getItem: (name: string) => data.get(name) ?? null,
    setItem: (name: string, value: string) => {
      if (value.length > limit) throw quotaExceeded();
      data.set(name, value);
    },
    removeItem: (name: string) => data.delete(name),
    _data: data,
  };
}

describe('createQuotaSafeStorage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('passes getItem/setItem/removeItem straight through when nothing is over quota', () => {
    const fake = makeFakeLocalStorage(10_000);
    vi.stubGlobal('localStorage', fake);

    const storage = createQuotaSafeStorage();
    storage.setItem('learn:v1', JSON.stringify({ state: { mistake: { a: 'knew' } } }));
    expect(storage.getItem('learn:v1')).toContain('"a":"knew"');
  });

  it('evicts the oldest quarter of each kind map and retries on QuotaExceededError', () => {
    const fake = makeFakeLocalStorage(200);
    vi.stubGlobal('localStorage', fake);

    // 20 mistake entries — payload starts well over the 200-byte limit.
    const mistake = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`m${i}`, 'missed']));
    const payload = JSON.stringify({ state: { mistake, expandAll: {} } });
    expect(payload.length).toBeGreaterThan(200);

    const storage = createQuotaSafeStorage();
    storage.setItem('learn:v1', payload);

    const stored = JSON.parse(storage.getItem('learn:v1') as string);
    const remainingKeys = Object.keys(stored.state.mistake);
    expect(remainingKeys.length).toBeLessThan(20);
    // Eviction drops from the front (oldest / least-recently-touched).
    expect(remainingKeys).not.toContain('m0');
    expect(remainingKeys).toContain('m19');
  });

  it('re-throws a non-quota error unchanged', () => {
    const fake = {
      getItem: () => null,
      setItem: () => {
        throw new Error('disk on fire');
      },
      removeItem: () => {},
    };
    vi.stubGlobal('localStorage', fake);

    const storage = createQuotaSafeStorage();
    expect(() => storage.setItem('learn:v1', '{}')).toThrow('disk on fire');
  });

  it('no-ops instead of throwing when localStorage does not exist (SSR)', () => {
    vi.stubGlobal('localStorage', undefined);
    const storage = createQuotaSafeStorage();
    expect(() => storage.setItem('learn:v1', '{}')).not.toThrow();
    expect(storage.getItem('learn:v1')).toBeNull();
  });
});
