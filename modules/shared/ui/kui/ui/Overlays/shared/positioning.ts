'use client';
/**
 * Anchor positioning utilities for Popover-like overlays.
 *
 * TODO M4: Integrate `@floating-ui/react` (lazy-loaded) for
 * auto-placement, collision detection (flip / shift), arrow positioning
 * and virtual-element anchors (context menus). For M1 we expose only
 * the static Tailwind class table currently used by Popover so the
 * import surface is stable when M4 lands.
 */

export type Placement = 'top' | 'bottom' | 'left' | 'right';

export const placementClasses: Record<Placement, string> = {
  bottom: 'top-full left-0 mt-2',
  top: 'bottom-full left-0 mb-2',
  left: 'right-full top-0 mr-2',
  right: 'left-full top-0 ml-2',
};
