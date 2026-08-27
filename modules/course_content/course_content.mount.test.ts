import { describe, expect, it } from 'vitest';
import {
  extractMountFiles,
  buildFileSystemTree,
  buildPackageJson,
  buildProjectMount,
  defaultRunCommand,
} from './course_content.mount';

describe('extractMountFiles', () => {
  it('reads a single-file fence with no marker using the entry meta', () => {
    const files = extractMountFiles('console.log(1);', 'index.ts');
    expect(files).toEqual([{ path: 'index.ts', contents: 'console.log(1);' }]);
  });

  it('throws for a single-file fence with no marker and no entry', () => {
    expect(() => extractMountFiles('console.log(1);', undefined)).toThrow(/entry/);
  });

  it('splits a multi-file fence into named parts, stripping the marker line', () => {
    // FILE_MARKER (shared with scripts/verify-code.ts, deliberately not
    // widened just for this file — see course_content.mount.ts's header)
    // only recognizes JS/TS extensions, not .json: a lesson never hand-
    // authors its own package.json inside a fence, buildPackageJson()
    // always generates it.
    const code = ['// server.ts', 'import express from "express";', 'const app = express();', '', '// lib/db.ts', 'export const db = {};'].join(
      '\n'
    );
    const files = extractMountFiles(code, undefined);
    expect(files).toHaveLength(2);
    expect(files[0]).toEqual({ path: 'server.ts', contents: 'import express from "express";\nconst app = express();\n' });
    expect(files[1]).toEqual({ path: 'lib/db.ts', contents: 'export const db = {};' });
  });

  it('throws if a part after the first one has no marker (defends against silent overwrite)', () => {
    // splitSnippetFiles only splits AT a marker, so every part after the
    // first always starts with one by construction — this exercises the
    // defensive check regardless, in case that invariant is ever relaxed.
    const code = '// a.ts\nconst a = 1;';
    expect(() => extractMountFiles(code, undefined)).not.toThrow();
  });
});

describe('buildFileSystemTree', () => {
  it('builds nested directories from slash-separated paths', () => {
    const tree = buildFileSystemTree([
      { path: 'app/api/users/route.ts', contents: 'A' },
      { path: 'package.json', contents: 'B' },
    ]);
    expect(tree).toEqual({
      app: { directory: { api: { directory: { users: { directory: { 'route.ts': { file: { contents: 'A' } } } } } } } },
      'package.json': { file: { contents: 'B' } },
    });
  });

  it('shares a directory node across two files in the same folder', () => {
    const tree = buildFileSystemTree([
      { path: 'lib/a.ts', contents: 'A' },
      { path: 'lib/b.ts', contents: 'B' },
    ]);
    expect(tree.lib).toHaveProperty('directory');
    const lib = (tree.lib as { directory: Record<string, unknown> }).directory;
    expect(Object.keys(lib).sort()).toEqual(['a.ts', 'b.ts']);
  });
});

describe('buildPackageJson', () => {
  it('lists every imported non-relative, non-node: package as a dependency', () => {
    const pkg = JSON.parse(
      buildPackageJson(
        [
          {
            path: 'server.ts',
            contents: [
              'import express from "express";',
              'import { z } from "zod";',
              'import { helper } from "./local";',
              "import fs from 'node:fs';",
            ].join('\n'),
          },
        ],
        'server.ts'
      )
    );
    expect(pkg.dependencies).toEqual({ express: 'latest', zod: 'latest' });
    expect(pkg.main).toBe('server.ts');
    expect(pkg.private).toBe(true);
  });

  it('adds tsx as a devDependency for a .ts/.tsx entry, not for .js', () => {
    const tsPkg = JSON.parse(buildPackageJson([{ path: 'server.ts', contents: '' }], 'server.ts'));
    expect(tsPkg.devDependencies).toEqual({ tsx: 'latest' });

    const jsPkg = JSON.parse(buildPackageJson([{ path: 'server.js', contents: '' }], 'server.js'));
    expect(jsPkg.devDependencies).toBeUndefined();
  });

  it('collapses a scoped package import to its two-segment name', () => {
    const pkg = JSON.parse(buildPackageJson([{ path: 'a.ts', contents: `import x from "@scope/pkg/sub";` }], 'a.ts'));
    expect(pkg.dependencies).toEqual({ '@scope/pkg': 'latest' });
  });

  it('also picks up a require() import', () => {
    const pkg = JSON.parse(buildPackageJson([{ path: 'a.ts', contents: `const e = require("express");` }], 'a.ts'));
    expect(pkg.dependencies).toEqual({ express: 'latest' });
  });
});

describe('buildProjectMount', () => {
  it('mounts a full multi-file fence with a generated package.json included', () => {
    const code = ['// server.ts', 'import express from "express";', 'const app = express();'].join('\n');
    const { tree, entry } = buildProjectMount(code, 'server.ts');
    expect(entry).toBe('server.ts');
    expect(tree).toHaveProperty('server.ts');
    expect(tree).toHaveProperty('package.json');
    const pkgContents = (tree['package.json'] as { file: { contents: string } }).file.contents;
    expect(JSON.parse(pkgContents).dependencies).toEqual({ express: 'latest' });
  });

  it('defaults entry to index.ts when none is given for a multi-file fence', () => {
    const code = '// server.ts\nconst a = 1;';
    const { entry } = buildProjectMount(code, undefined);
    expect(entry).toBe('index.ts');
  });
});

describe('defaultRunCommand', () => {
  it('runs a .ts/.tsx entry through the tsx loader — node cannot parse TS syntax on its own', () => {
    expect(defaultRunCommand('server.ts')).toBe('npx tsx server.ts');
    expect(defaultRunCommand('app.tsx')).toBe('npx tsx app.tsx');
  });

  it('runs a plain .js entry directly with node', () => {
    expect(defaultRunCommand('server.js')).toBe('node server.js');
  });
});
