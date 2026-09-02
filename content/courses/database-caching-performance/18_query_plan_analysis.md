# 18. Query Plan Analysis — EXPLAIN ANALYZE

## What It Is
`EXPLAIN ANALYZE` is PostgreSQL's execution plan tool. It shows you exactly how PostgreSQL intends to execute a query (the plan) and, after running it, what actually happened (actual timing, row counts, loops). It's the primary tool for understanding why a query is slow and what to do about it. Every backend developer who uses PostgreSQL should be comfortable reading a basic query plan.

`EXPLAIN` (without `ANALYZE`) shows the estimated plan without running the query — safe for production investigation of expensive queries. `EXPLAIN ANALYZE` actually runs the query and shows real timing — use this in development or on a read replica. `EXPLAIN (ANALYZE, BUFFERS)` additionally shows how many data pages were read from disk vs cache — the most complete picture of what the query is doing.

The key things to look for in a plan are: **Seq Scan on a large table** (means no index is being used, which is usually wrong), **Nested Loop with a high estimated rows count** (can be slow when row estimates are wrong due to stale statistics), **Sort** (means no index is covering the ORDER BY), **high "actual time"** on a specific node (tells you exactly which step is slow), and a large discrepancy between "rows=estimated" and "actual rows" (stale statistics — run `ANALYZE tablename` to update them).

```quiz
- q: "`EXPLAIN ANALYZE` shows rows=12 estimated against 480,000 actual. What is that telling you?"
  anchor: "Large discrepancies mean stale statistics; run `ANALYZE` or `VACUUM ANALYZE`"
  options:
    - text: "The query is slow and needs an index"
      correct: false
      why: "Perhaps, but the planner chose this plan from the 12. Fix the estimate before trusting anything it produced."
    - text: "The statistics are stale — run `ANALYZE` or `VACUUM ANALYZE`"
      correct: true
      why: "A planner working from an estimate four orders of magnitude out will pick the wrong join and the wrong scan."
    - text: "Estimates are always approximate; the gap can be ignored"
      correct: false
      why: "Approximate is one thing. Four orders of magnitude is a broken input."

- q: "The plan shows a nested loop over a 2-million-row outer set. Good or bad?"
  anchor: "fast when inner set is small and indexed; slow when outer set is large"
  options:
    - text: "Good — a nested loop avoids building a hash table"
      correct: false
      why: "It does, and pays for it by scanning the inner set two million times."
    - text: "Bad — it scans the inner set once per outer row"
      correct: true
      why: "Nested loops are fast when the outer set is small and the inner one is indexed. This is the opposite case."
    - text: "Neutral — the planner would not have chosen it if it were bad"
      correct: false
      why: "It would, working from a bad row estimate. That is the previous question's failure mode."

- q: "Two runs of the same query, same plan: the first slow, the second fast. What changed?"
  anchor: "Cache hits (fast) vs disk reads (slow)"
  options:
    - text: "The plan was cached, so the second run skipped planning"
      correct: false
      why: "The plan is identical, and planning is cheap next to the difference being measured."
    - text: "Buffers — the first run read from disk, the second hit the cache"
      correct: true
      why: "shared hit versus shared read is exactly this distinction, and a high read count means cold data."
    - text: "Nothing measurable — the difference is noise"
      correct: false
      why: "A cold-to-warm cache transition is a real and reproducible effect."
```

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

This runs against a real, single-process Postgres in your browser (PGlite), seeded with 400 tenants, 20,000 users, and 50,000 `tenant_members` rows — no index on `tenant_id` yet. Run it, read the plan, then try the second query below.

```sql run seed=tenant_members
EXPLAIN ANALYZE
SELECT * FROM tenant_members WHERE tenant_id = 42;
```

Read the "Seq Scan" line, the "Rows Removed by Filter" line (everything the planner had to read and discard), and the "Execution Time" line — then add the index this table is missing and run the same query again:

```sql run seed=tenant_members
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON tenant_members(tenant_id);
ANALYZE tenant_members;

EXPLAIN ANALYZE
SELECT * FROM tenant_members WHERE tenant_id = 42;
```

The plan changes shape — from a full scan of all 50,000 rows to a bitmap index scan that only touches the ~125 rows for tenant 42. That's not a simulated difference; it's the same planner PostgreSQL runs in production, choosing a different strategy because `ANALYZE` gave it real statistics and a usable index now exists.

```sql run seed=tenant_members
-- IF NOT EXISTS again: this fence stands on its own whether or not you ran
-- the one above first — the index is a precondition of the plan below, not
-- something this specific query creates.
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON tenant_members(tenant_id);
ANALYZE tenant_members;

-- EXPLAIN (no ANALYZE) shows the estimated plan without running the query —
-- the version safe to run against a production table you don't want to
-- actually execute (an UPDATE or DELETE, for instance).
EXPLAIN
SELECT tm.id, tm.role, tm.last_active_at, u.email, u.display_name
FROM tenant_members tm
JOIN users u ON u.id = tm.user_id
WHERE tm.tenant_id = 42 AND tm.status = 'active'
ORDER BY tm.last_active_at DESC
LIMIT 50;
```

RED FLAGS to look for in a plan, in any of the three above:
- **"Seq Scan" on a table this size** — missing index, or the planner decided the index wasn't worth using (check selectivity)
- **A large gap between the estimated `rows=` and the actual `rows=`** — stale statistics; run `ANALYZE`
- **"Rows Removed by Filter" close to the total row count** — the index (if any) narrowed the search far less than you'd expect
- **A high "actual time" on one specific node** — that node, not the query as a whole, is the bottleneck

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
- [**"Use the Index, Luke" — "Execution Plans" section](https://use-the-index-luke.com/sql/explain-plan)** — The best non-official explanation of how to read query plans; language-agnostic and very clear
- **PostgreSQL documentation — "Using EXPLAIN"** — The official reference; explains each node type, cost estimates, and the statistics system that feeds the planner
- [PostgreSQL: using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) — how to read the plan, and why `EXPLAIN ANALYZE` differs from `EXPLAIN`

```recall
- q: "Contrast Index Scan and Index Only Scan."
  must:
    - "an index scan uses an index to find rows and does a heap fetch per matching row"
    - "an index only scan uses a covering index and needs no heap fetch — the fastest for covered queries"

- q: "When does the planner reach for a Bitmap Index Scan?"
  must:
    - "when multiple index conditions combine"
    - "it is efficient for moderate selectivity"

- q: "What is a hash join good for?"
  must:
    - "it builds a hash table of the smaller relation"
    - "efficient for larger joins without indexes"
```
