import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProjectRunner } from './ProjectRunner';
import type { LessonBlock } from '../course_content.blocks';

function projectBlock(): Extract<LessonBlock, { kind: 'code' }> {
  return {
    kind: 'code',
    id: 'exampleCode-0',
    lang: 'typescript',
    meta: { run: true, project: true, entry: 'server.ts', cmd: 'node server.js', opts: {} },
    source: '// server.ts\nimport express from "express";\nconst app = express();',
    html: '<pre><code>...</code></pre>',
  };
}

describe('ProjectRunner', () => {
  it('shows a Run Project button and no output/preview before any click', () => {
    const html = renderToStaticMarkup(React.createElement(ProjectRunner, { block: projectBlock() }));
    expect(html).toContain('Run Project');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('npm install');
  });

  it('does not import @webcontainer/api at module scope', async () => {
    // If this module (or anything it statically imports) pulled in the SDK
    // eagerly, this import itself would already have loaded a browser-only
    // package inside vitest's plain-node environment and thrown.
    await expect(import('./ProjectRunner')).resolves.toBeDefined();
  });
});
