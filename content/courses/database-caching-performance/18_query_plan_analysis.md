# 18. Query Plan Analysis — EXPLAIN ANALYZE

## Coverage Level
**Not Covered** — There is no query performance analysis tooling, no slow query logging configuration, and no documented process for investigating slow endpoints. When a query is slow, the current debugging approach is likely guesswork.

## What It Is
`EXPLAIN ANALYZE` is PostgreSQL's execution plan tool. It shows you exactly how PostgreSQL intends to execute a query (the plan) and, after running it, what actually happened (actual timing, row counts, loops). It's the primary tool for understanding why a query is slow and what to do about it. Every backend developer who uses PostgreSQL should be comfortable reading a basic query plan.

`EXPLAIN` (without `ANALYZE`) shows the estimated plan without running the query — safe for production investigation of expensive queries. `EXPLAIN ANALYZE` actually runs the query and shows real timing — use this in development or on a read replica. `EXPLAIN (ANALYZE, BUFFERS)` additionally shows how many data pages were read from disk vs cache — the most complete picture of what the query is doing.

The key things to look for in a plan are: **Seq Scan on a large table** (means no index is being used, which is usually wrong), **Nested Loop with a high estimated rows count** (can be slow when row estimates are wrong due to stale statistics), **Sort** (means no index is covering the ORDER BY), **high "actual time"** on a specific node (tells you exactly which step is slow), and a large discrepancy between "rows=estimated" and "actual rows" (stale statistics — run `ANALYZE tablename` to update them).

## Key Concepts
- **Seq Scan**: Full table scan; PostgreSQL reads every row; acceptable for small tables or queries returning most rows; bad for large tables with selective filters
- **Index Scan**: Uses an index to find rows; efficient for selective filters; does a heap fetch per matching row
- **Index Only Scan**: Uses a covering index; no heap fetch needed; fastest for covered queries
- **Bitmap Index Scan**: Used when multiple index conditions combine; efficient for moderate selectivity
- **Nested Loop**: For each row in the outer set, scan the inner set; fast when inner set is small and indexed; slow when outer set is large
- **Hash Join**: Builds a hash table of the smaller relation; efficient for larger joins without indexes
- **rows estimate vs actual rows**: Large discrepancies mean stale statistics; run `ANALYZE` or `VACUUM ANALYZE`
- **Buffers: shared hit / read**: Cache hits (fast) vs disk reads (slow); high "read" values indicate cold data

## Example Code
```typescript
// Reading and acting on EXPLAIN ANALYZE output

// ─── Run EXPLAIN ANALYZE via Prisma raw query ───
async function analyzeQuery(db: PrismaClient, tenantId: string) {
  // Always use EXPLAIN ANALYZE on dev/staging, not production (it runs the query)
  // Use EXPLAIN (no ANALYZE) on production to avoid executing expensive queries
  const plan = await db.$queryRaw`
    EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
    SELECT
      tm.id, tm.role, tm.last_active_at,
      u.email, u.display_name
    FROM tenant_members tm
    INNER JOIN users u ON u.id = tm.user_id
    WHERE tm.tenant_id = ${tenantId}
      AND tm.status = 'active'
    ORDER BY tm.last_active_at DESC
    LIMIT 50
  `;

  // plan is an array of rows, each with a "QUERY PLAN" string
  // Log it to console during development
  (plan as any[]).forEach((row) => console.log(row['QUERY PLAN']));
}

/*
Example output to read:
─────────────────────────────────────────────────────────────────────────────
Limit  (cost=0.43..150.12 rows=50 width=96) (actual time=0.123..2.341 ms rows=50 loops=1)
  ->  Nested Loop  (cost=0.43..3420.00 rows=1140 width=96) (actual time=0.121..2.309 ms rows=50 loops=1)
        ->  Index Scan using tenant_members_tenant_status_active_idx on tenant_members tm
              (cost=0.29..1700.00 rows=1140 width=48) (actual time=0.089..1.102 ms rows=50 loops=1)
              Index Cond: ((tenant_id = '...'::uuid) AND (status = 'active'))
              Filter: (status = 'active')
        ->  Index Scan using users_pkey on users u
              (cost=0.14..1.52 rows=1 width=48) (actual time=0.023..0.023 ms rows=1 loops=50)
              Index Cond: (id = tm.user_id)
Buffers: shared hit=203 read=0
Planning Time: 0.845 ms
Execution Time: 2.451 ms

READING THIS PLAN:
- "Limit" at the top → applied after the inner plan; execution stops at 50 rows
- "Nested Loop" → for each of the 50 tenant_members rows, fetch 1 user row
- First Index Scan uses our partial index (tenant_id + status = 'active') ✓
- Second Index Scan uses users_pkey (primary key) → O(1) per lookup ✓
- "Buffers: shared hit=203 read=0" → all data in memory, no disk I/O ✓
- Execution Time: 2.451 ms → acceptable for this query

RED FLAGS to look for in plans:
- "Seq Scan on [large_table]" → missing index
- "actual rows=50000" vs "rows=100" → stale statistics (run ANALYZE)
- "Sort Method: external merge  Disk: 12288kB" → sort spilled to disk (add index, or increase work_mem)
- "actual time=1200.000..1200.000 ms" on a specific node → that node is the bottleneck
─────────────────────────────────────────────────────────────────────────────
*/

// ─── Enable slow query logging in PostgreSQL ───
// Add to postgresql.conf (or via Supabase/RDS parameter group):
// log_min_duration_statement = 200   # log queries taking > 200ms
// log_statement = 'none'             # don't log all statements, just slow ones

// ─── Add Prisma query logging in development ───
export function createDevDb() {
  return new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'warn' },
    ],
  });
}

// Listen for slow queries (> 100ms) and log them
export function attachSlowQueryLogger(db: PrismaClient, thresholdMs = 100) {
  db.$on('query', (e) => {
    if (e.duration > thresholdMs) {
      console.warn(`SLOW QUERY (${e.duration}ms):\n${e.query}\nParams: ${e.params}`);
    }
  });
}
```

## When to Use
- When an API endpoint is noticeably slow — run `EXPLAIN ANALYZE` on the specific query before reaching for indexes
- During development of any new listing/filtering endpoint — run `EXPLAIN` to verify the query plan is using indexes as expected
- After adding a new index — verify the query planner actually uses it with `EXPLAIN`
- When troubleshooting production performance issues — enable `log_min_duration_statement` to capture slow queries automatically, then analyze them

## Common Mistakes
- **Running `EXPLAIN ANALYZE` on a write query in production**: `ANALYZE` executes the query — an `ANALYZE` on a DELETE or UPDATE runs it for real; use `EXPLAIN` (without `ANALYZE`) for writes, or wrap in a transaction you immediately roll back
- **Ignoring the row estimate vs actual row discrepancy**: A plan that looks efficient based on estimates can be catastrophic when estimates are 100x off; check "rows=N" vs "actual rows=N" and run `VACUUM ANALYZE table` if they diverge significantly
- **Assuming adding an index will always help**: PostgreSQL uses the index only if the planner estimates it's cheaper; for queries returning more than ~5–10% of the table, a seq scan is faster; don't add an index and assume it's being used — verify with EXPLAIN
- **Not using `EXPLAIN (FORMAT JSON)`**: The JSON format (`EXPLAIN (ANALYZE, FORMAT JSON)`) can be pasted into tools like explain.dalibo.com for a visual plan; much easier to read for complex multi-join queries

## Further Reading
- **"explain.dalibo.com"** — Free online tool to visualize PostgreSQL query plans; paste JSON output from `EXPLAIN (ANALYZE, FORMAT JSON)` for a visual, annotated breakdown
- **"Use the Index, Luke" — "Execution Plans" section (use-the-index-luke.com/sql/explain-plan)** — The best non-official explanation of how to read query plans; language-agnostic and very clear
- **PostgreSQL documentation — "Using EXPLAIN"** — The official reference; explains each node type, cost estimates, and the statistics system that feeds the planner
