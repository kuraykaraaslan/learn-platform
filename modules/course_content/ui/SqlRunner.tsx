// Always present on a `sql run` block — same "single component, no
// next/dynamic split" shape as ProjectRunner.tsx: runtime/pglite.client.ts
// already keeps its only expensive import (@electric-sql/pglite, ~5MB gz of
// WASM + data) inside an async function, never at module top level, so
// importing that module here statically still ships zero PGlite bytes until
// Run is actually clicked.
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import { runSql, type SqlStatementResult } from '../runtime/pglite.client';
import { useProgressStore, editorKey, lessonKey } from '@/modules/progress/progress.store';
import type { LessonBlock } from '../course_content.blocks';

type Status = 'idle' | 'running' | 'done' | 'error';

// docs/phases/10-pglite-sql.md's "zorunlu dürüstlük bandı" (mandatory
// honesty band): PGlite is single-process, no parallel workers, no real
// disk. The plan SHAPE (scan type, join order, row estimates) is genuine
// Postgres — the planner really does choose Seq Scan vs. Index Scan based on
// real statistics. Timings and buffer counts are not representative of any
// real server and must never be read as a performance number. Non-
// negotiable per the spec: rendered above every result, not just once.
function HonestyBanner() {
  return (
    <p className="mb-2 rounded border border-warning bg-warning-subtle px-2 py-1.5 text-warning-fg">
      Real Postgres query planner — plan shape (scan type, join order, row estimates) is genuine. This runs
      single-process in your browser: timings and buffer counts do not represent a real server.
    </p>
  );
}

function isPlanResult(result: SqlStatementResult): boolean {
  return result.columns.length === 1 && /query plan/i.test(result.columns[0]);
}

function ResultView({ result }: { result: SqlStatementResult }) {
  if (isPlanResult(result)) {
    return (
      <pre className="whitespace-pre-wrap rounded bg-surface-overlay p-2 font-mono text-text-primary">
        {result.rows.map((row) => String(Object.values(row)[0])).join('\n')}
      </pre>
    );
  }

  if (result.columns.length === 0) {
    return (
      <p className="text-text-secondary">
        {result.command ?? 'OK'}
        {typeof result.rowCount === 'number' ? ` (${result.rowCount} row${result.rowCount === 1 ? '' : 's'})` : ''}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr>
            {result.columns.map((col) => (
              <th key={col} className="border border-border bg-surface-overlay px-2 py-1 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {result.columns.map((col) => (
                <td key={col} className="border border-border px-2 py-1">
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {result.rows.length === 0 && <p className="mt-1 text-text-secondary">(0 rows)</p>}
    </div>
  );
}

export function SqlRunner({
  block,
  seedSql,
  courseSlug,
  lessonFile,
}: {
  block: Extract<LessonBlock, { kind: 'code' }>;
  seedSql: string;
  courseSlug: string;
  lessonFile: string;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [statusText, setStatusText] = useState('');
  const [results, setResults] = useState<SqlStatementResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const key = editorKey(courseSlug, lessonFile, block.id);
  const savedSource = useProgressStore((s) => s.editors[key]);
  const setEditorValue = useProgressStore((s) => s.setEditorValue);
  const source = savedSource ?? block.source;
  const seedName = block.meta.seed ?? '';

  async function run() {
    setStatus('running');
    setResults([]);
    setErrorMessage(null);

    await runSql(source, lessonKey(courseSlug, lessonFile), seedName, seedSql, (event) => {
      switch (event.type) {
        case 'status':
          setStatusText(event.text);
          break;
        case 'results':
          setStatus('done');
          setResults(event.results);
          break;
        case 'error':
          setStatus('error');
          setErrorMessage(event.message);
          break;
      }
    });
  }

  return (
    <div className="mt-2">
      <textarea
        value={source}
        onChange={(e) => setEditorValue(key, e.target.value)}
        spellCheck={false}
        rows={Math.min(20, Math.max(3, source.split('\n').length))}
        className="w-full resize-y rounded-md border border-border bg-surface-sunken p-3 font-mono text-xs text-text-primary outline-none focus-visible:border-primary"
      />
      <button
        type="button"
        onClick={run}
        disabled={status === 'running'}
        className="mt-2 rounded-md border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Run
      </button>

      {status !== 'idle' && (
        <div className="mt-2 rounded-md border border-border bg-surface-sunken p-3 font-mono text-xs">
          <HonestyBanner />
          {status === 'running' && <p className="text-text-secondary">{statusText || 'Running…'}</p>}
          {results.map((result, i) => (
            <div key={i} className={cn(i > 0 && 'mt-3 border-t border-border pt-2')}>
              <ResultView result={result} />
            </div>
          ))}
          {errorMessage && <pre className="whitespace-pre-wrap text-error">{errorMessage}</pre>}
        </div>
      )}
    </div>
  );
}
