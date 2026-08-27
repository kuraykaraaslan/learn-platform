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
  /** `run project` (P9): a multi-file fence that needs a real npm install +
   *  server, not the P8 sandbox — mount()ed into a WebContainer instead of
   *  transpiled and run in an iframe worker. */
  project: boolean;
  /** Which file in a multi-file fence to execute. */
  entry?: string;
  /** A named input seed for a fence whose demo depends on one. */
  seed?: string;
  /** The command WebContainer spawns after `npm install`, e.g.
   *  `cmd="node server.js"` — quoted because it's the one meta value with
   *  spaces in it. */
  cmd?: string;
  /** Anything else, so an unrecognized `key=value` isn't silently dropped. */
  opts: Record<string, unknown>;
};

// A key=value pair, where the value is either "quoted, possibly with spaces"
// or a single bare word — or, with no `=`, a standalone flag token like `run`.
const TOKEN = /([A-Za-z_][\w-]*)=(?:"([^"]*)"|(\S+))|(\S+)/g;

export function parseFenceMeta(meta: string): FenceMeta {
  const result: FenceMeta = { run: false, project: false, opts: {} };

  TOKEN.lastIndex = 0;
  for (let match = TOKEN.exec(meta); match; match = TOKEN.exec(meta)) {
    const [, key, quotedValue, bareValue, flag] = match;

    if (flag !== undefined) {
      if (flag === 'run') result.run = true;
      else if (flag === 'project') result.project = true;
      else result.opts[flag] = true;
      continue;
    }

    const value = quotedValue ?? bareValue;
    if (key === 'entry') result.entry = value;
    else if (key === 'seed') result.seed = value;
    else if (key === 'cmd') result.cmd = value;
    else result.opts[key] = value;
  }

  return result;
}
