import { describe, expect, it } from 'vitest';
import { parseFenceMeta } from './course_content.fence-meta';
import { markdownToHtml } from './course_content.markdown';

describe('parseFenceMeta', () => {
  it('defaults to run:false, empty opts for an empty meta string', () => {
    expect(parseFenceMeta('')).toEqual({ run: false, opts: {} });
  });

  it('recognizes the bare "run" token', () => {
    expect(parseFenceMeta('run')).toEqual({ run: true, opts: {} });
  });

  it('parses entry= and seed= into their own fields, not opts', () => {
    const meta = parseFenceMeta('run entry=foo.ts seed=demo');
    expect(meta.run).toBe(true);
    expect(meta.entry).toBe('foo.ts');
    expect(meta.seed).toBe('demo');
    expect(meta.opts).toEqual({});
  });

  it('puts an unrecognized key=value into opts', () => {
    expect(parseFenceMeta('timeout=500').opts).toEqual({ timeout: '500' });
  });

  it('puts an unrecognized bare token into opts as true', () => {
    expect(parseFenceMeta('noimports').opts).toEqual({ noimports: true });
  });

  it('tolerates extra whitespace', () => {
    expect(parseFenceMeta('  run   entry=foo.ts  ')).toEqual({ run: true, entry: 'foo.ts', opts: {} });
  });
});

describe('the `run` marker is free (locks in the corpus-measured claim)', () => {
  it('produces byte-identical HTML with or without a `run` meta token', () => {
    const withRun = markdownToHtml('```typescript run\nconst a: number = 1;\n```');
    const without = markdownToHtml('```typescript\nconst a: number = 1;\n```');
    expect(withRun).toBe(without);
  });
});
