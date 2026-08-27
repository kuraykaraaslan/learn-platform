// Turns a `run project` fence into the shape WebContainer's mount() expects
// (a FileSystemTree) plus a generated package.json. Only a *type* import from
// @webcontainer/api (erased at compile time, zero runtime cost) — the actual
// SDK is browser-only and this needs to stay unit-testable in plain Node.
// runtime/webcontainer.client.ts is the only place that imports the real
// thing, and only lazily.
import type { FileSystemTree } from '@webcontainer/api';
import { splitSnippetFiles, FILE_MARKER } from './course_content.snippets';

export type { FileSystemTree };
export type MountFile = { path: string; contents: string };

/**
 * Splits a `run project` fence the same way scripts/verify-code.ts does
 * (splitSnippetFiles) and reads each part's path off its `// path.ts`
 * marker — required, not inferred: an un-named part would silently overwrite
 * the last named one at some made-up path. A single-file fence (no marker at
 * all) falls back to `entry` from the fence's meta.
 */
export function extractMountFiles(code: string, entry: string | undefined): MountFile[] {
  const parts = splitSnippetFiles(code);

  if (parts.length === 1 && !FILE_MARKER.test(parts[0].split('\n', 1)[0])) {
    if (!entry) throw new Error('Single-file `run project` fence with no path marker needs an explicit entry=.');
    return [{ path: entry, contents: parts[0] }];
  }

  return parts.map((part) => {
    const lines = part.split('\n');
    const match = FILE_MARKER.exec(lines[0]);
    if (!match) throw new Error(`\`run project\` fence part has no leading "// path.ts" marker: ${lines[0]}`);
    return { path: match[1], contents: lines.slice(1).join('\n').replace(/^\n/, '') };
  });
}

export function buildFileSystemTree(files: MountFile[]): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const { path, contents } of files) {
    const segments = path.split('/').filter(Boolean);
    let cursor = tree;
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const existing = cursor[segment];
      if (existing && 'directory' in existing) {
        cursor = existing.directory;
      } else {
        const dir: FileSystemTree = {};
        cursor[segment] = { directory: dir };
        cursor = dir;
      }
    }
    cursor[segments[segments.length - 1]] = { file: { contents } };
  }

  return tree;
}

// node: builtins and relative imports need no package.json entry.
const IMPORT_SOURCE = /(?:from\s+|require\()\s*['"]([^'"]+)['"]/g;

function importedPackageNames(files: MountFile[]): string[] {
  const names = new Set<string>();
  for (const { contents } of files) {
    IMPORT_SOURCE.lastIndex = 0;
    for (let match = IMPORT_SOURCE.exec(contents); match; match = IMPORT_SOURCE.exec(contents)) {
      const source = match[1];
      if (source.startsWith('.') || source.startsWith('node:')) continue;
      // A scoped package (@scope/name) keeps two segments; anything else
      // keeps the first — "express/foo" and "express" both need "express".
      const segments = source.split('/');
      names.add(source.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]);
    }
  }
  return [...names].sort();
}

/**
 * A package.json with every imported package as a dependency, version
 * "latest" — this is the one place this file has to guess: the fence shows
 * what a snippet imports, never which version. WebContainer's own
 * `npm install` resolves whatever "latest" turns out to mean at run time.
 */
export function buildPackageJson(files: MountFile[], entry: string): string {
  const dependencies = Object.fromEntries(importedPackageNames(files).map((name) => [name, 'latest']));
  return JSON.stringify(
    {
      name: 'lesson-project',
      private: true,
      version: '0.0.0',
      type: 'module',
      main: entry,
      dependencies,
    },
    null,
    2
  );
}

export function buildProjectMount(code: string, entry: string | undefined): { tree: FileSystemTree; entry: string } {
  const resolvedEntry = entry ?? 'index.ts';
  const files = extractMountFiles(code, entry);
  const packageJson = buildPackageJson(files, resolvedEntry);
  const tree = buildFileSystemTree([...files, { path: 'package.json', contents: packageJson }]);
  return { tree, entry: resolvedEntry };
}
