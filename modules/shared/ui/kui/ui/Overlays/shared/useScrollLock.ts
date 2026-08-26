'use client';
import { useEffect } from 'react';

/**
 * Locks body scroll while an overlay is open.
 *
 * - Compensates for the missing scrollbar by adding equivalent
 *   `padding-right` to the body so layout does not shift.
 * - iOS rubber-band fix: position the body `fixed` at the current
 *   scrollY so touch scroll is fully suppressed; restore scrollY on
 *   unlock.
 * - Reference-counted: multiple overlays open simultaneously share a
 *   single lock so the body is only unlocked when the last overlay closes.
 */

let lockCount = 0;
let originalBodyStyle = {
  overflow: '',
  paddingRight: '',
  position: '',
  top: '',
  width: '',
};
let savedScrollY = 0;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iP(ad|hone|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function lock() {
  if (lockCount === 0) {
    const body = document.body;
    const html = document.documentElement;
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    originalBodyStyle = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };

    if (isIOS()) {
      savedScrollY = window.scrollY;
      body.style.position = 'fixed';
      body.style.top = `-${savedScrollY}px`;
      body.style.width = '100%';
    } else {
      body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        const currentPad = parseFloat(getComputedStyle(body).paddingRight) || 0;
        body.style.paddingRight = `${currentPad + scrollbarWidth}px`;
      }
    }
  }
  lockCount += 1;
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    const body = document.body;
    const wasIOS = body.style.position === 'fixed';
    body.style.overflow = originalBodyStyle.overflow;
    body.style.paddingRight = originalBodyStyle.paddingRight;
    body.style.position = originalBodyStyle.position;
    body.style.top = originalBodyStyle.top;
    body.style.width = originalBodyStyle.width;
    if (wasIOS) {
      window.scrollTo(0, savedScrollY);
    }
  }
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return () => unlock();
  }, [active]);
}
