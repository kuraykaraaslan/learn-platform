/**
 * A single fence very often shows SEVERAL files, separated by a path comment:
 *
 *   // app/api/users/route.ts
 *   export async function GET() { ... }
 *
 *   // lib/users.ts
 *   export default function users() { ... }
 *
 * Concatenating those into one module produces duplicate `GET`s, two default
 * exports and colliding `beforeEach`es. Splitting on the marker checks what
 * the lesson actually shows: several files, each on its own.
 *
 * Shared between scripts/verify-code.ts and the browser runner (P8) —
 * deliberately not cosmetic: a runner that splits a multi-file fence
 * differently from the verifier would execute code the verifier never
 * actually typechecked.
 */
// The whole comment must BE the path — optionally with a short trailing note
// after a dash or in parentheses. Without that anchor, "// Next.js App Router
// already does code splitting" is read as a file called "Next.js".
export const FILE_MARKER =
  /^[ \t]{0,4}(?:\/\/|#)\s*([\w@][\w./@-]*\.(?:ts|tsx|js|jsx|mts|cts))\s*(?:[—–-]\s.*|\(.*\))?$/;

export function splitSnippetFiles(code: string): string[] {
  const lines = code.split('\n');
  const parts: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (FILE_MARKER.test(line) && current.some((l) => l.trim())) {
      parts.push(current);
      current = [];
    }
    current.push(line);
  }
  parts.push(current);
  return parts.filter((p) => p.some((l) => l.trim())).map((p) => p.join('\n'));
}
