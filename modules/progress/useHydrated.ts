'use client';

import { useSyncExternalStore } from 'react';
import { useProgressStore } from './progress.store';

// zustand's persist middleware IS the external store here: onFinishHydration
// returns its own unsubscribe, which is exactly useSyncExternalStore's subscribe
// contract. Reading hasHydrated() as the snapshot rather than mirroring it into
// component state is what keeps this out of an effect — the pre-React-19 shape
// (useState + useEffect + setState) trips react-hooks/set-state-in-effect and
// renders one extra time on every mount to say what the store already knew.
const subscribe = (onStoreChange: () => void) => useProgressStore.persist.onFinishHydration(onStoreChange);
const getSnapshot = () => useProgressStore.persist.hasHydrated();
// On the server nothing has hydrated by definition, so the SSR pass and the
// first client render agree — the mismatch guard this hook exists for.
const getServerSnapshot = () => false;

/**
 * True once useProgressStore has read its persisted state back from
 * localStorage. The single place this is checked — every component reading
 * progress state renders its pre-hydration default until this flips, instead
 * of each one reimplementing the SSR-vs-client mismatch guard (and getting it
 * subtly wrong) on its own.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
