'use client';

import { useEffect, useState } from 'react';
import { useProgressStore } from './progress.store';

/**
 * True once useProgressStore has read its persisted state back from
 * localStorage. The single place this is checked — every component reading
 * progress state renders its pre-hydration default until this flips, instead
 * of each one reimplementing the Next 15 SSR-vs-client mismatch guard (and
 * getting it subtly wrong) on its own.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useProgressStore.persist.hasHydrated());

  useEffect(() => {
    if (useProgressStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useProgressStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
