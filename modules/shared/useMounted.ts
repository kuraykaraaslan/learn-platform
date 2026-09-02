'use client';

import { useSyncExternalStore } from 'react';

// A store that never changes: the snapshot differs between the server pass and
// every client pass, and that difference is the whole signal. React's own
// answer to "am I past hydration yet" now that setState-in-an-effect is a lint
// error — same one render as the effect version, without the effect.
const neverChanges = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * False during SSR and on the hydrating render, true afterwards. For the narrow
 * case of a component whose correct output genuinely cannot be known on the
 * server — a browser-resolved theme, a DOM node, a localStorage value — where
 * rendering the client answer during hydration would be a mismatch.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(neverChanges, onClient, onServer);
}
