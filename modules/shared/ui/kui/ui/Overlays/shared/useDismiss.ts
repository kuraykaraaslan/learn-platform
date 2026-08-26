'use client';
import { useEffect } from 'react';
import { isFocusTrapTopLayer } from './useFocusTrap';

/**
 * Handles Escape + outside-click dismissal for overlays.
 *
 * - Escape: only the topmost active overlay (per useFocusTrap stack)
 *   dismisses, so stacking modals do not all close together.
 * - Outside click: capture-phase pointerdown so children listening on
 *   the bubble phase can still consume the event (e.g. Popover triggers
 *   nested inside their own root).
 *
 * Pass `escape: false` to opt out (e.g. when useFocusTrap already owns
 * Escape) or `outsidePointer: false` to disable click-outside (Modal
 * uses an explicit backdrop click handler instead).
 */

type Options = {
  active: boolean;
  ref: React.RefObject<HTMLElement | null>;
  onDismiss: () => void;
  escape?: boolean;
  outsidePointer?: boolean;
};

export function useDismiss({
  active,
  ref,
  onDismiss,
  escape = true,
  outsidePointer = true,
}: Options) {
  useEffect(() => {
    if (!active) return;

    function onKey(e: KeyboardEvent) {
      if (!escape) return;
      if (e.key !== 'Escape') return;
      if (!isFocusTrapTopLayer(ref)) return;
      onDismiss();
    }

    function onPointer(e: PointerEvent) {
      if (!outsidePointer) return;
      const root = ref.current;
      if (!root) return;
      if (root.contains(e.target as Node)) return;
      if (!isFocusTrapTopLayer(ref)) return;
      onDismiss();
    }

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer, true);
    };
  }, [active, ref, onDismiss, escape, outsidePointer]);
}
