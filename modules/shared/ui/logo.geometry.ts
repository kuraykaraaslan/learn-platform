/**
 * The learn.kuray.dev brand mark, as raw geometry.
 *
 * The mark is a "K" whose arms are drawn as a branching path with a node at
 * each tip — the K of kuray, and at the same time the roadmap this site is:
 * one trunk, a fork, two destinations.
 *
 * This module is the single source of truth for that geometry. Two consumers
 * share it and must not drift apart:
 *   - modules/shared/ui/Logo.tsx  — the in-app React mark (theme-token colors)
 *   - scripts/generate-brand-assets.ts — favicon / apple icon / OG image
 * so it stays framework-free (no JSX, no React import) on purpose.
 */

export const LOGO_VIEW_BOX = '0 0 32 32';

/** Stem, upper arm, lower arm. Drawn as strokes with round caps/joins. */
export const LOGO_PATHS = ['M9.5 5.5V26.5', 'M9.5 16 22 6.2', 'M9.5 16 22 25.8'] as const;

/** The two destination nodes at the arm tips. */
export const LOGO_NODES = [
  { cx: 22, cy: 6.2 },
  { cx: 22, cy: 25.8 },
] as const;

/** Weights for the open mark (transparent background, two-tone). */
export const LOGO_STROKE_WIDTH = 3.4;
export const LOGO_NODE_RADIUS = 3.2;

/**
 * Weights for the tile lockup (mark knocked out of a filled rounded square —
 * favicon, app icon, OG card). The mark is scaled down to sit inside the tile's
 * padding, so its stroke and nodes are drawn heavier pre-scale to land back on
 * the open mark's optical weight: 4.4 × 0.74 ≈ 3.3.
 */
export const LOGO_TILE = {
  scale: 0.74,
  strokeWidth: 4.4,
  nodeRadius: 4.1,
  /** Corner radius on the 32-unit grid; ~23%, the iOS-ish squircle read. */
  cornerRadius: 7.5,
} as const;

/** Fixed brand colors — used where CSS custom properties can't reach (static
 * SVG/PNG assets). In-app the mark uses the theme tokens instead, so it tracks
 * light/dark; see Logo.tsx. */
export const LOGO_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  gradientFrom: '#3b82f6',
  gradientTo: '#7c3aed',
  onBrand: '#ffffff',
} as const;
