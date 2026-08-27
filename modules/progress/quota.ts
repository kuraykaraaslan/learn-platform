import type { StateStorage } from 'zustand/middleware';

const MAX_EVICTIONS = 3;

function isQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

/** The shape every progress.store.ts kind map shares: a flat Record whose
 *  insertion order IS recency (progress.store.ts's setters delete-then-reinsert
 *  a touched key, which bumps it to the end — no separate timestamp needed). */
type KindMap = Record<string, unknown>;

/** Drops the oldest quarter of each kind map, in place — "oldest" meaning
 *  earliest in insertion order, per the delete-then-reinsert convention above. */
function evictOldest(kindMaps: KindMap[]): boolean {
  let evicted = false;
  for (const map of kindMaps) {
    const keys = Object.keys(map);
    const dropCount = Math.ceil(keys.length / 4);
    if (dropCount === 0) continue;
    for (const key of keys.slice(0, dropCount)) delete map[key];
    evicted = true;
  }
  return evicted;
}

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

/**
 * Wraps localStorage so a QuotaExceededError doesn't lose the whole store (or
 * throw past zustand, which the persist middleware doesn't retry on its own).
 * On overflow, evicts the least-recently-touched quarter of every kind map in
 * the payload and retries, up to MAX_EVICTIONS times.
 *
 * Also the SSR/test guard: zustand's persist middleware calls getItem
 * synchronously on store creation. FailureDrillCard.tsx is a 'use client'
 * component, but Next still executes its module graph — including this
 * store — on the server to produce the initial HTML, where localStorage does
 * not exist. Without this guard, that first server render (and this repo's
 * node-environment vitest, same gap) throws before hydration ever runs.
 */
export function createQuotaSafeStorage(): StateStorage {
  return {
    getItem: (name) => (hasLocalStorage() ? localStorage.getItem(name) : null),
    removeItem: (name) => {
      if (hasLocalStorage()) localStorage.removeItem(name);
    },
    setItem: (name, value) => {
      if (!hasLocalStorage()) return;
      let payload = value;
      for (let attempt = 0; attempt <= MAX_EVICTIONS; attempt++) {
        try {
          localStorage.setItem(name, payload);
          return;
        } catch (error) {
          if (!isQuotaExceeded(error) || attempt === MAX_EVICTIONS) throw error;

          const parsed = JSON.parse(payload) as { state?: Record<string, unknown> };
          const kindMaps = Object.values(parsed.state ?? {}).filter(
            (v): v is KindMap => typeof v === 'object' && v !== null
          );
          if (!evictOldest(kindMaps)) throw error;
          payload = JSON.stringify(parsed);
        }
      }
    },
  };
}
