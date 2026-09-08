import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NumbersCard } from './NumbersCard';
import { parseNumbers } from '../course_content.numbers';

const YAML = `
caption: "Two settings."
rows:
  - quantity: "PostgreSQL 18 \`lock_timeout\`"
    default: "0 — no limit"
    source: "https://www.postgresql.org/docs/current/runtime-config-client.html"
    at_scale: "The statement waits for as long as the holder keeps the lock."
    measure: "\`SHOW lock_timeout;\`"
  - quantity: "Pool size your team agreed"
    default: "—"
    at_scale: "Nobody publishes a default for a number that belongs to your workload."
    measure: "\`SELECT count(*) FROM pg_stat_activity;\`"
`;

describe('NumbersCard', () => {
  it('renders every column, and links the default to what publishes it', () => {
    const html = renderToStaticMarkup(React.createElement(NumbersCard, { widget: parseNumbers(YAML) }));
    expect(html).toContain('lock_timeout');
    expect(html).toContain('Why it is wrong at scale');
    expect(html).toContain('href="https://www.postgresql.org/docs/current/runtime-config-client.html"');
    expect(html).toContain('2 values');
  });

  it('leaves an unpublished default unlinked rather than inventing a source', () => {
    const html = renderToStaticMarkup(React.createElement(NumbersCard, { widget: parseNumbers(YAML) }));
    const rows = html.split('<tr').slice(1);
    const unpublished = rows.find((row) => row.includes('Pool size your team agreed'))!;
    expect(unpublished).not.toContain('<a ');
  });

  it('turns backticked spans into code and interprets nothing else', () => {
    const widget = parseNumbers(YAML.replace('Two settings.', 'A <script>alert(1)</script> caption'));
    const html = renderToStaticMarkup(React.createElement(NumbersCard, { widget }));
    expect(html).toContain('<code');
    expect(html).not.toContain('<script>');
  });
});

// Same boundary CalcCard had to learn: course_content.numbers.ts top-level
// imports yaml and zod for build-time parsing, so a value import here would
// drag the YAML parser into the shipped lesson chunk. The table is inert, so
// this card is also a server component — the cheapest possible widget.
describe('NumbersCard bundle boundary', () => {
  it('imports course_content.numbers as a type only, and declares no client boundary', async () => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync(new URL('./NumbersCard.tsx', import.meta.url), 'utf-8');
    const imports = source.match(/^import .*course_content\.numbers';$/gm) ?? [];
    expect(imports).toHaveLength(1);
    expect(imports[0]).toMatch(/^import type /);
    expect(source).not.toContain("'use client'");
  });
});
