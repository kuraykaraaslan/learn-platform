'use client';
import { useEffect, useState } from 'react';

/**
 * Resolves the portal mount target for an overlay.
 *
 * - Defaults to `document.body`.
 * - Accepts an explicit `Element` or a CSS selector string.
 * - Returns `null` on the server / before mount so callers can
 *   conditionally skip `createPortal`.
 */

export function usePortal(target?: Element | string | null): Element | null {
  const [node, setNode] = useState<Element | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (target instanceof Element) {
      setNode(target);
      return;
    }
    if (typeof target === 'string') {
      setNode(document.querySelector(target));
      return;
    }
    setNode(document.body);
  }, [target]);

  return node;
}
