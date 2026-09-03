/**
 * Renders the static brand assets from the one geometry source
 * (modules/shared/ui/logo.geometry.ts) into app/:
 *
 *   app/icon.svg              — the favicon browsers actually prefer
 *   app/favicon.ico           — 32px PNG-in-ICO, for /favicon.ico requests
 *   app/apple-icon.png        — 180px, square (iOS applies its own mask)
 *   app/opengraph-image.png   — 1200×630 share card
 *   public/icon-192.png       — PWA / Android home screen (see app/manifest.ts)
 *   public/icon-512.png
 *   public/icon-maskable-512.png — square, for Android's own mask
 *
 * These are committed, so this only needs re-running when the mark changes:
 *
 *   npx tsx scripts/generate-brand-assets.ts
 *
 * Needs `sharp` (already a transitive dep, same as scripts/generate-covers.ts).
 * The OG card's type is drawn by librsvg through fontconfig, so it renders with
 * whatever grotesque the machine has — the committed PNG is the artifact that
 * matters, not the local font list.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  LOGO_COLORS,
  LOGO_NODES,
  LOGO_PATHS,
  LOGO_TILE,
  LOGO_VIEW_BOX,
} from '../modules/shared/ui/logo.geometry';

const APP_DIR = path.join(process.cwd(), 'app');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const FONT_STACK = 'Geist, Inter, Ubuntu Sans, DejaVu Sans, sans-serif';

/** The bare mark, on its 32-unit grid. */
function markSvg(stroke: string, node: string, strokeWidth: number, nodeRadius: number) {
  const paths = LOGO_PATHS.map((d) => `<path d="${d}"/>`).join('');
  const nodes = LOGO_NODES.map(
    (n) => `<circle cx="${n.cx}" cy="${n.cy}" r="${nodeRadius}" fill="${node}"/>`
  ).join('');
  return (
    `<g fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" ` +
    `stroke-linecap="round" stroke-linejoin="round">${paths}</g>${nodes}`
  );
}

/**
 * The mark knocked out of a filled rounded square. `cornerRadius` is overridable
 * because iOS masks apple-icon itself and wants square corners.
 */
function tileSvg(size: number, cornerRadius: number = LOGO_TILE.cornerRadius) {
  const inner = markSvg(
    LOGO_COLORS.onBrand,
    LOGO_COLORS.onBrand,
    LOGO_TILE.strokeWidth,
    LOGO_TILE.nodeRadius
  );
  // userSpaceOnUse, not the default objectBoundingBox: the stem is a zero-width
  // box, and a bounding-box gradient on it degenerates (the stroke disappears).
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEW_BOX}" width="${size}" height="${size}">
  <defs><linearGradient id="lkd" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${LOGO_COLORS.gradientFrom}"/><stop offset="1" stop-color="${LOGO_COLORS.gradientTo}"/>
  </linearGradient></defs>
  <rect width="32" height="32" rx="${cornerRadius}" fill="url(#lkd)"/>
  <g transform="translate(16 16) scale(${LOGO_TILE.scale}) translate(-16 -16)">${inner}</g>
</svg>`;
}

function ogSvg() {
  const tile = tileSvg(112).replace(/^<svg[^>]*>|<\/svg>$/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#1b2540"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${LOGO_COLORS.secondary}" stop-opacity="0.30"/>
      <stop offset="1" stop-color="${LOGO_COLORS.secondary}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${LOGO_COLORS.gradientFrom}"/><stop offset="1" stop-color="${LOGO_COLORS.gradientTo}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1010" cy="150" r="420" fill="url(#glow)"/>
  <g transform="translate(100 130)"><svg width="112" height="112" viewBox="${LOGO_VIEW_BOX}">${tile}</svg></g>
  <text x="100" y="330" font-family="${FONT_STACK}" font-size="72" font-weight="700" fill="#f1f5f9" letter-spacing="-1.5">learn.kuray<tspan fill="#94a3b8" font-weight="500">.dev</tspan></text>
  <text x="100" y="394" font-family="${FONT_STACK}" font-size="32" font-weight="500" fill="#a0aec4">Path to the software business era.</text>
  <text x="100" y="500" font-family="${FONT_STACK}" font-size="25" font-weight="400" fill="#7c8aa5">Code runs in your browser  ·  mistakes are drills  ·  no sign-up</text>
  <rect x="0" y="622" width="1200" height="8" fill="url(#bar)"/>
</svg>`;
}

/** Minimal ICO container around a single PNG (all modern browsers read this). */
function icoFromPng(png: Buffer, size: number) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);
  return Buffer.concat([header, entry, png]);
}

async function main() {
  // The in-app React mark (Logo.tsx) is the open two-tone version; the favicon
  // needs the tile — a 3px stroke on a transparent 16px square is mush.
  const iconSvg = tileSvg(32);
  fs.writeFileSync(path.join(APP_DIR, 'icon.svg'), `${iconSvg}\n`);

  const png32 = await sharp(Buffer.from(iconSvg), { density: 1600 })
    .resize(32, 32)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), icoFromPng(png32, 32));

  await sharp(Buffer.from(tileSvg(180, 0)), { density: 1600 })
    .resize(180, 180)
    .flatten({ background: LOGO_COLORS.gradientFrom })
    .png()
    .toFile(path.join(APP_DIR, 'apple-icon.png'));

  // Android home screen. `maskable` gets the square full-bleed tile — Android
  // crops to its own shape, and a pre-rounded icon would get double-rounded.
  for (const [file, size, radius] of [
    ['icon-192.png', 192, LOGO_TILE.cornerRadius],
    ['icon-512.png', 512, LOGO_TILE.cornerRadius],
    ['icon-maskable-512.png', 512, 0],
  ] as const) {
    // 4× the target then downscale — librsvg's density is relative to the SVG's
    // declared width, so a fixed high value blows past sharp's pixel limit here.
    await sharp(Buffer.from(tileSvg(size, radius)), { density: 384 })
      .resize(size, size)
      .png()
      .toFile(path.join(PUBLIC_DIR, file));
  }

  await sharp(Buffer.from(ogSvg()), { density: 144 })
    .resize(1200, 630)
    .png()
    .toFile(path.join(APP_DIR, 'opengraph-image.png'));

  // Referenced nowhere by hand — Next picks up <name>.alt.txt next to the image.
  fs.writeFileSync(
    path.join(APP_DIR, 'opengraph-image.alt.txt'),
    'learn.kuray.dev — Path to the software business era.'
  );

  console.log(
    'Brand assets written — app/: icon.svg, favicon.ico, apple-icon.png, opengraph-image.png; ' +
      'public/: icon-192.png, icon-512.png, icon-maskable-512.png'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
