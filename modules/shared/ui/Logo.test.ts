import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Logo, LogoMark } from './Logo';
import { LOGO_PATHS, LOGO_TILE } from './logo.geometry';

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
