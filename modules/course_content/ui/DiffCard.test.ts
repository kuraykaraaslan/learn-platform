import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DiffCard } from './DiffCard';
import { parseDiff } from '../course_content.diff';

const RAW = ['// ── broken ──', 'const x = 1;', '// ── fixed ──', 'const x = 2;'].join('\n');

describe('DiffCard', () => {
  it('defaults to showing the broken half, not the fixed one', () => {
    const widget = parseDiff(RAW);
    const html = renderToStaticMarkup(React.createElement(DiffCard, { widget }));
    expect(html).toContain('const x = 1;');
    expect(html).not.toContain('const x = 2;');
  });

  it('has a toggle for both broken and fixed', () => {
    const widget = parseDiff(RAW);
    const html = renderToStaticMarkup(React.createElement(DiffCard, { widget }));
    expect(html).toMatch(/broken/i);
    expect(html).toMatch(/fixed/i);
  });
});
