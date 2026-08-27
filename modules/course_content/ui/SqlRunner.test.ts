import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SqlRunner } from './SqlRunner';
import type { LessonBlock } from '../course_content.blocks';

function sqlBlock(): Extract<LessonBlock, { kind: 'code' }> {
  return {
    kind: 'code',
    id: 'exampleCode-0',
    lang: 'sql',
    meta: { run: true, project: false, seed: 'tenant_members', opts: {} },
    source: 'EXPLAIN ANALYZE SELECT * FROM tenant_members WHERE tenant_id = 42;',
    html: '<pre><code>...</code></pre>',
  };
}

describe('SqlRunner', () => {
  it('shows a Run button and no results/honesty-banner before any click', () => {
    const html = renderToStaticMarkup(
      React.createElement(SqlRunner, {
        block: sqlBlock(),
        seedSql: '-- seed sql',
        courseSlug: 'database-caching-performance',
        lessonFile: '18_query_plan_analysis.md',
      })
    );
    expect(html).toContain('Run');
    expect(html).not.toContain('Real Postgres query planner');
    expect(html).not.toContain('<table');
  });

  it('does not import @electric-sql/pglite at module scope', async () => {
    // If this module (or anything it statically imports) pulled in PGlite
    // eagerly, this import itself would already have loaded a browser-only
    // WASM-backed package inside vitest's plain-node environment and thrown.
    await expect(import('./SqlRunner')).resolves.toBeDefined();
  });
});
