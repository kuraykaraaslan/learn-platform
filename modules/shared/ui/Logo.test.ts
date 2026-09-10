import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Logo, LogoMark } from './Logo';
import { LOGO_NODES, LOGO_PATHS, LOGO_TILE } from './logo.geometry';

describe('Logo', () => {
  it('renders the full lockup as a link home', () => {
    const html = renderToStaticMarkup(React.createElement(Logo));
    expect(html).toContain('href="/"');
    expect(html).toContain('learn.kuray');
    expect(html).toContain('.dev');
    for (const d of LOGO_PATHS) expect(html).toContain(d);
  });

  it('keeps the brand name for screen readers when compact', () => {
    const html = renderToStaticMarkup(React.createElement(Logo, { compact: true }));
    expect(html).toContain('sr-only');
    expect(html).toContain('learn.kuray.dev');
    expect(html).toContain(LOGO_PATHS[0]);
  });

  it('renders unlinked when href is null', () => {
    const html = renderToStaticMarkup(React.createElement(Logo, { href: null }));
    expect(html).not.toContain('<a ');
  });

  it('colors the mark from the theme tokens, not hardcoded hex', () => {
    const html = renderToStaticMarkup(React.createElement(LogoMark));
    expect(html).toContain('stroke-primary');
    expect(html).toContain('fill-secondary');
    expect(html).not.toMatch(/#[0-9a-f]{6}/i);
  });
});

describe('geometry', () => {
  // The 45deg arm is the house constant, shared with the kui-viewer mark
  // (Brand_Positioning_Rules/logo-system.md). Asserted rather than eyeballed:
  // the two marks live on different grids in different repos, and an angle
  // nudged by hand here is the one change that silently breaks the pair.
  it('forks both arms at exactly 45 degrees', () => {
    const [stem, ...arms] = LOGO_PATHS;
    const forkX = Number(stem.match(/^M([\d.]+)/)![1]);
    const forkY = 16;

    expect(arms).toHaveLength(2);
    for (const arm of arms) {
      const [x, y] = arm.match(/([\d.]+) ([\d.]+)$/)!.slice(1).map(Number);
      expect(Math.abs(x - forkX)).toBeCloseTo(Math.abs(y - forkY), 5);
    }
  });

  it('keeps the arm-tip nodes on the arm tips', () => {
    const tips = LOGO_PATHS.slice(1).map((d) => {
      const [x, y] = d.match(/([\d.]+) ([\d.]+)$/)!.slice(1).map(Number);
      return { cx: x, cy: y };
    });
    expect(LOGO_NODES.map((n) => ({ cx: n.cx, cy: n.cy }))).toEqual(tips);
  });
});

describe('generated brand assets', () => {
  // app/icon.svg & friends are built from the same geometry by
  // scripts/generate-brand-assets.ts and committed. If the mark changes and the
  // script isn't re-run, the favicon silently keeps the old shape — this is the
  // guard for exactly that.
  it('app/icon.svg is in sync with logo.geometry.ts', () => {
    const svg = fs.readFileSync(path.join(process.cwd(), 'app', 'icon.svg'), 'utf-8');
    for (const d of LOGO_PATHS) expect(svg).toContain(d);
    expect(svg).toContain(`scale(${LOGO_TILE.scale})`);
  });
});
