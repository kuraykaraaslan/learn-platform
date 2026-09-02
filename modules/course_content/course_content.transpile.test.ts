import { describe, expect, it } from 'vitest';
import { transpileForSandbox, RUNNABLE_LANGS } from './course_content.transpile';

describe('RUNNABLE_LANGS', () => {
  it('is exactly typescript/ts/javascript/js — no tsx/jsx (ADR 0002: no in-page React preview)', () => {
    expect([...RUNNABLE_LANGS].sort()).toEqual(['javascript', 'js', 'ts', 'typescript']);
  });
});

describe('transpileForSandbox', () => {
  it('strips TypeScript type annotations', () => {
    const result = transpileForSandbox('const a: number = 1;\nconsole.log(a);', 'typescript');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.code).not.toContain(': number');
      expect(result.code).toContain('console.log(a)');
    }
  });

  it('produces code that actually executes and behaves correctly', () => {
    const result = transpileForSandbox(
      'function double(n: number): number { return n * 2; }\nconsole.log(double(21));',
      'typescript'
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const logs: unknown[] = [];
    // new Function is deliberate here: this is exactly what the sandbox worker does with the same output
    new Function('console', result.code)({ log: (...args: unknown[]) => logs.push(...args) });
    expect(logs).toEqual([42]);
  });

  it('passes plain JavaScript through unchanged in behavior (no transform needed)', () => {
    const result = transpileForSandbox('console.log(1 + 1);', 'javascript');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const logs: unknown[] = [];
    new Function('console', result.code)({ log: (...args: unknown[]) => logs.push(...args) });
    expect(logs).toEqual([2]);
  });

  it('rejects a lang outside RUNNABLE_LANGS without attempting sucrase at all', () => {
    const result = transpileForSandbox('console.log("x")', 'bash');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('bash');
  });

  it('returns a readable error for syntactically invalid input, rather than throwing', () => {
    const result = transpileForSandbox('const a: number = ;;;', 'typescript');
    expect(result.ok).toBe(false);
  });
});
