// The only module in this codebase that imports @electric-sql/pglite, and
// only ever inside boot() below — never at top level — so a page with no
// `sql run` block ships none of it. Client-side only, no server counterpart:
// a fresh in-memory Postgres per browser tab, discarded on navigation.
import type { PGlite, Results } from '@electric-sql/pglite';

export type SqlStatementResult = {
  /** Column names, in order — empty for a statement with no result set (DDL, INSERT without RETURNING). */
  columns: string[];
  rows: Record<string, unknown>[];
  command?: string;
  rowCount?: number;
};

function toStatementResult(r: Results): SqlStatementResult {
  return {
    columns: r.fields.map((f) => f.name),
    rows: r.rows as Record<string, unknown>[],
    command: r.command,
    rowCount: r.rowCount,
  };
}

/**
 * One in-memory PGlite instance per (lesson, seed name), seeded once and
 * reused across every `sql run` block sharing both — booting a fresh
 * instance per block would re-run the (idempotent, but not free) seed script
 * on every block, and a reader running several fences in the same lesson
 * expects earlier statements (like `CREATE INDEX`) to still be there.
 *
 * Scoped by lesson, not by seed name alone: this map is module-level state
 * that survives a client-side route change (Next.js doesn't reload the
 * module between pages in the same tab). Two different lessons that happen
 * to both use `seed=tenant_members` must NOT share one mutable database —
 * an index created while reading lesson A would otherwise still be there,
 * unannounced, when the reader later visits lesson B.
 */
const instances = new Map<string, Promise<PGlite>>();

function bootInstance(seed: string): Promise<PGlite> {
  return (async () => {
    const { PGlite } = await import('@electric-sql/pglite');
    const db = new PGlite();
    if (seed) await db.exec(seed);
    return db;
  })();
}

function instanceKey(lessonKey: string, seedName: string): string {
  return `${lessonKey}#${seedName}`;
}

function getInstance(key: string, seedSql: string): Promise<PGlite> {
  let promise = instances.get(key);
  if (!promise) {
    promise = bootInstance(seedSql);
    instances.set(key, promise);
  }
  return promise;
}

export type RunSqlEvent =
  | { type: 'status'; text: string }
  | { type: 'results'; results: SqlStatementResult[] }
  | { type: 'error'; message: string };

/**
 * Runs `sql` (one or more ;-separated statements) against the shared
 * instance for `lessonKey` + `seedName`, booting and seeding it first if
 * this is the first query against that pair in this tab. Streams status so
 * the caller can show a "Booting Postgres…" state during the (WASM-
 * download-bound) first call.
 */
export async function runSql(
  sql: string,
  lessonKey: string,
  seedName: string,
  seedSql: string,
  onEvent: (event: RunSqlEvent) => void
): Promise<void> {
  try {
    const key = instanceKey(lessonKey, seedName);
    const alreadyBooted = instances.has(key);
    if (!alreadyBooted) onEvent({ type: 'status', text: 'Booting Postgres (WASM)…' });
    const db = await getInstance(key, seedSql);

    onEvent({ type: 'status', text: 'Running…' });
    const results = await db.exec(sql);
    onEvent({ type: 'results', results: results.map(toStatementResult) });
  } catch (error) {
    onEvent({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
}
