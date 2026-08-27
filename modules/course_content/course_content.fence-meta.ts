// Parses a fence's meta string — everything in the info string after the
// language token, e.g. "run" or "run entry=foo.ts" for
// ```typescript run entry=foo.ts. Free to add: remark-rehype only ever put
// the FIRST info-string token into the hast className; the rest already sits
// untouched in data.meta, and hast-util-to-html ignores `data` entirely — so
// marking any number of fences `run` never moves parse-snapshot.json
// (verified: sha(markdownToHtml("```ts run\\nx\\n```")) ===
// sha(markdownToHtml("```ts\\nx\\n```"))).

export type FenceMeta = {
  run: boolean;
  /** Which file in a multi-file fence to execute — unused until a run fence
   *  actually needs one (today's corpus doesn't). */
  entry?: string;
  /** A named input seed for a fence whose demo depends on one — same status
   *  as `entry`. */
  seed?: string;
  /** Anything else, so an unrecognized `key=value` isn't silently dropped. */
  opts: Record<string, unknown>;
};

export function parseFenceMeta(meta: string): FenceMeta {
  const result: FenceMeta = { run: false, opts: {} };

  for (const token of meta.trim().split(/\s+/).filter(Boolean)) {
    if (token === 'run') {
      result.run = true;
      continue;
    }
    const eq = token.indexOf('=');
    if (eq === -1) {
      result.opts[token] = true;
      continue;
    }
    const key = token.slice(0, eq);
    const value = token.slice(eq + 1);
    if (key === 'entry') result.entry = value;
    else if (key === 'seed') result.seed = value;
    else result.opts[key] = value;
  }

  return result;
}
