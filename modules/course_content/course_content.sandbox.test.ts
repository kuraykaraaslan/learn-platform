import { describe, expect, it } from 'vitest';
import { serializeForSandbox, buildWorkerSource, buildSandboxHtml } from './course_content.sandbox';

describe('serializeForSandbox', () => {
  it('serializes primitives', () => {
    expect(serializeForSandbox('hi')).toBe('hi');
    expect(serializeForSandbox(42)).toBe('42');
    expect(serializeForSandbox(true)).toBe('true');
    expect(serializeForSandbox(null)).toBe('null');
    expect(serializeForSandbox(undefined)).toBe('undefined');
  });

  it('serializes an Error as its stack (or message if no stack)', () => {
    const err = new Error('boom');
    expect(serializeForSandbox(err)).toBe(err.stack);
    const bare = Object.assign(Object.create(Error.prototype), { message: 'no stack' });
    expect(serializeForSandbox(bare)).toBe('no stack');
  });

  it('serializes a function by name', () => {
    function namedFn() {}
    expect(serializeForSandbox(namedFn)).toBe('[Function: namedFn]');
    expect(serializeForSandbox(() => {})).toBe('[Function: anonymous]');
  });

  it('serializes plain objects and arrays', () => {
    expect(serializeForSandbox({ a: 1, b: 'x' })).toBe('{ a: 1, b: x }');
    expect(serializeForSandbox([1, 'two', true])).toBe('[1, two, true]');
  });

  it('stops recursing past depth 4 with an ellipsis', () => {
    const deep = { a: { b: { c: { d: { e: { f: 'too deep' } } } } } };
    const out = serializeForSandbox(deep);
    expect(out).toContain('…');
    expect(out).not.toContain('too deep');
  });

  it('caps entries at 200 and notes how many more there were', () => {
    const bigArray = Array.from({ length: 250 }, (_, i) => i);
    const out = serializeForSandbox(bigArray);
    expect(out).toContain('…+50 more');
    expect(out.split(',').length).toBeLessThan(260);
  });

  it('is cycle-safe: a self-referencing object does not recurse forever', () => {
    const obj: Record<string, unknown> = { name: 'x' };
    obj.self = obj;
    const out = serializeForSandbox(obj);
    expect(out).toContain('[Circular]');
  });

  it('is cycle-safe across siblings, not just a single lineage', () => {
    const shared: Record<string, unknown> = { id: 1 };
    const out = serializeForSandbox({ a: shared, b: shared });
    // The same object appearing twice as SIBLINGS (not an ancestor of
    // itself) is not a cycle — both should serialize fully, not as
    // '[Circular]'. Regression guard for a WeakSet keyed on "ever seen"
    // instead of "currently on the path from the root".
    expect(out).not.toContain('[Circular]');
    expect((out.match(/id: 1/g) ?? []).length).toBe(2);
  });
});

describe('buildWorkerSource', () => {
  it('embeds a working copy of serializeForSandbox and is syntactically valid JS', () => {
    const source = buildWorkerSource();
    expect(source).toContain('function serializeForSandbox');
    // Syntax-check without executing (no `self`/`postMessage` here in node).
    expect(() => new Function(source)).not.toThrow();
  });

  it('never references fetch, XMLHttpRequest, or the DOM', () => {
    const source = buildWorkerSource();
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/XMLHttpRequest/);
    expect(source).not.toMatch(/document\./);
  });
});

describe('buildSandboxHtml', () => {
  it('locks the CSP to default-src none', () => {
    const html = buildSandboxHtml('test-nonce');
    expect(html).toContain(`content="default-src 'none'; script-src 'unsafe-inline'"`);
  });

  it('embeds the given nonce and authenticates messages by it, not by origin', () => {
    const html = buildSandboxHtml('abc-123');
    expect(html).toContain('"abc-123"');
    expect(html).toContain('event.data.nonce !== NONCE');
  });

  it('wires window.onerror and unhandledrejection', () => {
    const html = buildSandboxHtml('n');
    expect(html).toContain('window.onerror');
    expect(html).toContain('unhandledrejection');
  });

  it('runs the snippet inside a Worker via a blob: URL, not inline in the frame', () => {
    const html = buildSandboxHtml('n');
    expect(html).toContain('new Worker(URL.createObjectURL(workerBlob))');
  });
});
