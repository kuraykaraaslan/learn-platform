import { describe, expect, it } from 'vitest';
import { splitSnippetFiles } from './course_content.snippets';

describe('splitSnippetFiles', () => {
  it('returns the whole fence as one file when there is no marker', () => {
    const code = 'const a = 1;\nconsole.log(a);';
    expect(splitSnippetFiles(code)).toEqual([code]);
  });

  it('splits on a "// path.ts" marker into separate files', () => {
    const code = [
      '// app/api/users/route.ts',
      'export async function GET() {}',
      '',
      '// lib/users.ts',
      'export default function users() {}',
    ].join('\n');
    const parts = splitSnippetFiles(code);
    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain('export async function GET');
    expect(parts[1]).toContain('export default function users');
  });

  it('does not split on a marker as the very first line (nothing precedes it yet)', () => {
    const code = '// app/api/users/route.ts\nexport async function GET() {}';
    expect(splitSnippetFiles(code)).toHaveLength(1);
  });

  it('does not treat an explanatory comment as a file marker', () => {
    const code = '// Next.js App Router already does code splitting\nexport default function Page() {}';
    expect(splitSnippetFiles(code)).toHaveLength(1);
  });

  it('accepts a marker with a trailing note after a dash', () => {
    const code = ['const a = 1;', '// lib/users.ts — the repository layer', 'export default function users() {}'].join(
      '\n'
    );
    expect(splitSnippetFiles(code)).toHaveLength(2);
  });

  it('recognizes a "#"-prefixed marker too, given a recognized extension', () => {
    const code = ['const a = 1;', '# config.ts', 'export const x = 1;'].join('\n');
    expect(splitSnippetFiles(code)).toHaveLength(2);
  });

  it('does not split on a marker naming an unrecognized extension (e.g. .py)', () => {
    const code = ['const a = 1;', '# server.py', 'def handler(): pass'].join('\n');
    expect(splitSnippetFiles(code)).toHaveLength(1);
  });
});
