import { describe, expect, it } from 'vitest';
import { parseFenceMeta } from './course_content.fence-meta';
import { markdownToHtml } from './course_content.markdown';

describe('parseFenceMeta', () => {
  it('defaults to run:false, project:false, empty opts for an empty meta string', () => {
    expect(parseFenceMeta('')).toEqual({ run: false, project: false, opts: {} });
  });

  it('recognizes the bare "run" token', () => {
    expect(parseFenceMeta('run')).toEqual({ run: true, project: false, opts: {} });
  });

  it('recognizes the bare "project" token', () => {
    expect(parseFenceMeta('run project')).toEqual({ run: true, project: true, opts: {} });
  });

  it('parses entry= and seed= into their own fields, not opts', () => {
    const meta = parseFenceMeta('run entry=foo.ts seed=demo');
    expect(meta.run).toBe(true);
    expect(meta.entry).toBe('foo.ts');
    expect(meta.seed).toBe('demo');
    expect(meta.opts).toEqual({});
  });

  it('parses a quoted cmd= value, spaces and all', () => {
    const meta = parseFenceMeta('run project entry=server.ts cmd="node server.js"');
    expect(meta.cmd).toBe('node server.js');
    expect(meta.entry).toBe('server.ts');
    expect(meta.opts).toEqual({});
  });

  it('parses the exact example from docs/phases/09-webcontainer.md', () => {
    const meta = parseFenceMeta('project entry=server.ts cmd="node server.js"');
    expect(meta).toEqual({
      run: false,
      project: true,
      entry: 'server.ts',
      cmd: 'node server.js',
      opts: {},
    });
  });

  it('puts an unrecognized key=value into opts', () => {
    expect(parseFenceMeta('timeout=500').opts).toEqual({ timeout: '500' });
  });

  it('puts an unrecognized bare token into opts as true', () => {
    expect(parseFenceMeta('noimports').opts).toEqual({ noimports: true });
  });

  it('tolerates extra whitespace', () => {
    expect(parseFenceMeta('  run   entry=foo.ts  ')).toEqual({
      run: true,
      project: false,
      entry: 'foo.ts',
      opts: {},
    });
  });

  it('an unquoted value stops at the next whitespace, unlike a quoted one', () => {
    const meta = parseFenceMeta('entry=server.ts cmd=node');
    expect(meta.entry).toBe('server.ts');
    expect(meta.cmd).toBe('node');
  });
});

describe('the `run` marker is free (locks in the corpus-measured claim)', () => {
  it('produces byte-identical HTML with or without a `run` meta token', () => {
    const withRun = markdownToHtml('```typescript run\nconst a: number = 1;\n```');
    const without = markdownToHtml('```typescript\nconst a: number = 1;\n```');
    expect(withRun).toBe(without);
  });

  it('holds for `run project entry=... cmd="..."` too, quotes and all', () => {
    const withMeta = markdownToHtml('```typescript run project entry=server.ts cmd="node server.js"\nconst a = 1;\n```');
    const without = markdownToHtml('```typescript\nconst a = 1;\n```');
    expect(withMeta).toBe(without);
  });
});
