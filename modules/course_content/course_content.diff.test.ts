import { describe, expect, it } from 'vitest';
import { looksLikeDiff, parseDiff } from './course_content.diff';

describe('looksLikeDiff', () => {
  it('is true only when both markers are present', () => {
    expect(looksLikeDiff('// ── broken ──\nx\n// ── fixed ──\ny')).toBe(true);
    expect(looksLikeDiff('// ── broken ──\nx')).toBe(false);
    expect(looksLikeDiff('plain code, no markers')).toBe(false);
  });
});

describe('parseDiff', () => {
  it('splits broken-then-fixed into two independent bodies', () => {
    const raw = ['type Shared = string;', '', '// ── broken ──', 'function f() { return 1; }', '', '// ── fixed ──', 'function f() { return 2; }'].join(
      '\n'
    );
    const widget = parseDiff(raw);
    expect(widget.broken).toContain('type Shared = string;');
    expect(widget.broken).toContain('return 1;');
    expect(widget.broken).not.toContain('return 2;');
    expect(widget.fixed).toContain('type Shared = string;');
    expect(widget.fixed).toContain('return 2;');
    expect(widget.fixed).not.toContain('return 1;');
  });

  it('splits fixed-then-broken in that order too', () => {
    const raw = ['// ── fixed ──', 'const ok = true;', '// ── broken ──', 'const ok = false;'].join('\n');
    const widget = parseDiff(raw);
    expect(widget.fixed).toContain('const ok = true;');
    expect(widget.broken).toContain('const ok = false;');
  });
});
