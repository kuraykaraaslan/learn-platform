'use client';
import { useEffect, useState } from 'react';

/**
 * Drives the enter/exit animation lifecycle of an overlay.
 *
 * State machine:
 *   open=true  → 'open'    (immediately mounted)
 *   open=false → 'closing' (panel still mounted, plays exit animation)
 *              → 'closed'  (panel unmounted)
 *
 * - `mounted` tells the caller whether to render the overlay at all.
 * - `state` is mirrored to `data-state` on the panel so CSS can target
 *   `[data-state="closing"]` for exit animations.
 * - The exit window is fixed to 250ms — matches the Tailwind
 *   `duration-200`/`250` token used across overlays for parity with
 *   the EJS counterparts.
 */

export type PresenceState = 'open' | 'closing' | 'closed';

const EXIT_MS = 250;

export function usePresence(open: boolean): {
  mounted: boolean;
  state: PresenceState;
} {
  const [state, setState] = useState<PresenceState>(open ? 'open' : 'closed');

  useEffect(() => {
    if (open) {
      setState('open');
      return;
    }
    // Only run the closing animation if we were previously mounted.
    setState((prev) => (prev === 'closed' ? 'closed' : 'closing'));
    const t = window.setTimeout(() => setState('closed'), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  return {
    mounted: state !== 'closed',
    state,
  };
}
