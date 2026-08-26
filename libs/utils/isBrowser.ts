// COPIED FROM: kui-react/libs/utils/isBrowser.ts (v1.0.1, copied 2026-08-26)
// True only in browser environments. Use to guard bare window/localStorage access
// so components remain safe in Next.js App Router server rendering.
export const isBrowser = typeof window !== 'undefined';
