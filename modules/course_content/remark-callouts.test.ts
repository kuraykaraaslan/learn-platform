import { describe, expect, it } from 'vitest';
import { markdownToHtml } from './course_content.markdown';

describe('remarkCallouts', () => {
  it('turns a `[!KIND]` blockquote into an aside, dropping the marker line', () => {
    const html = markdownToHtml('> [!WARNING]\nThis is a warning.');
    expect(html).toContain('<aside data-callout="warning">');
    expect(html).toContain('This is a warning.');
    expect(html).not.toContain('[!WARNING]');
    expect(html).not.toContain('<blockquote>');
  });

  it.each(['NOTE', 'TIP', 'WARNING', 'CAUTION', 'PITFALL'])('recognizes %s', (kind) => {
    const html = markdownToHtml(`> [!${kind}]\nBody text.`);
    expect(html).toContain(`data-callout="${kind.toLowerCase()}"`);
  });

  it('leaves an ordinary blockquote (no marker) untouched', () => {
    const html = markdownToHtml('> Just a regular quote.');
    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('<aside');
  });

  it('does not treat an unrecognized bracket tag as a callout', () => {
    const html = markdownToHtml('> [!TODO]\nNot a real kind.');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('[!TODO]');
  });

  it('a callout body still gets normal inline rendering (bold, code)', () => {
    const html = markdownToHtml('> [!TIP]\nUse `const`, not **var**.');
    expect(html).toContain('<code>const</code>');
    expect(html).toContain('<strong>var</strong>');
  });
});
