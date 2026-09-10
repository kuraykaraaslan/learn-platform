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

/**
 * Stem, upper arm, lower arm. Drawn as strokes with round caps/joins.
 *
 * The arms leave the stem at exactly 45deg (dx == dy == 9.8) — the house
 * constant, shared with the kui-viewer mark. Do not eyeball this angle: the
 * two marks are meant to read as the same hand, and 45deg is the only value
 * that survives being redrawn on a different grid.
 *
 * The reach is 9.8 because the *vertical* extent is what binds. A node at the
 * tip adds LOGO_NODE_RADIUS beyond it, so 16 +/- (9.8 + 3.2) fills the 32-unit
 * grid to a 3-unit margin. A longer arm at 45deg would push the nodes off the
 * tile; the stem x then follows from centering what is left (10.4 - 1.7 to
 * 20.2 + 3.2 centers on 16.05).
 */
export const LOGO_PATHS = ['M10.4 5.5V26.5', 'M10.4 16 20.2 6.2', 'M10.4 16 20.2 25.8'] as const;

/** The two destination nodes at the arm tips. */
export const LOGO_NODES = [
  { cx: 20.2, cy: 6.2 },
  { cx: 20.2, cy: 25.8 },
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
