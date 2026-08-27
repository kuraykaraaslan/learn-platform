import { transform } from 'sucrase';

/** Langs the sandbox will actually execute. Deliberately excludes
 *  tsx/jsx — ADR 0002 rules out an in-page React preview entirely (an
 *  opaque-origin iframe can't import React, and there's nowhere for JSX to
 *  render TO that would mean anything); a plain-logic snippet is the whole
 *  point of this runner. verify-code.ts's TS_LANGS is broader on purpose —
 *  it typechecks tsx too — this set is narrower, for what can actually run. */
export const RUNNABLE_LANGS = new Set(['typescript', 'ts', 'javascript', 'js']);

export type TranspileResult = { ok: true; code: string } | { ok: false; error: string };

/**
 * Strips TypeScript types with sucrase (~70KB gz, chosen over esbuild-wasm's
 * ~10MB and the ~1.2MB gz `typescript` package already in devDependencies —
 * see docs/phases/08-live-js-runner.md). Sucrase does no type CHECKING; that
 * already happened at build time via scripts/verify-code.ts. This only ever
 * needs to not crash on syntax it doesn't recognize.
 */
export function transpileForSandbox(source: string, lang: string): TranspileResult {
  if (!RUNNABLE_LANGS.has(lang)) {
    return { ok: false, error: `"${lang}" is not a runnable language in this sandbox.` };
  }
  try {
    const isTypeScript = lang === 'typescript' || lang === 'ts';
    const { code } = transform(source, { transforms: isTypeScript ? ['typescript'] : [] });
    return { ok: true, code };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
