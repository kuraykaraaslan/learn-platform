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

A plan is the planner's arithmetic, and the arithmetic runs on constants that
ship with the server. Three of them decide most of what a plan chooses, and
none of them knows anything about your hardware until you tell it:

```numbers
caption: "Planner constants, as PostgreSQL ships them. Every value below can be read from your own server with the query underneath this table."
rows:
  - quantity: "PostgreSQL 18 `random_page_cost`"
    default: "4.0"
    source: "https://www.postgresql.org/docs/current/runtime-config-query.html"
    at_scale: "It says a random page read costs four times a sequential one — true of a spinning disk, wrong by roughly an order of magnitude on SSD or NVMe. Left at 4.0 the planner systematically prefers sequential scans and rejects index plans that would win."
    measure: "`SHOW random_page_cost;`, then compare a forced index plan against the seq scan with `EXPLAIN (ANALYZE, BUFFERS)` on your own data"
  - quantity: "PostgreSQL 18 `effective_cache_size`"
    default: "4GB"
    source: "https://www.postgresql.org/docs/current/runtime-config-query.html"
    at_scale: "It is not an allocation — it is the planner's estimate of how much of the OS cache is available to it. On a machine with far more or far less RAM the estimate is simply wrong, and index scans are costed against a cache size nobody has."
    measure: "`SHOW effective_cache_size;` and compare it with the machine's actual free memory"
  - quantity: "PostgreSQL 18 `default_statistics_target`"
    default: "100"
    source: "https://www.postgresql.org/docs/current/runtime-config-query.html"
    at_scale: "It sets how many histogram buckets ANALYZE collects per column. On a skewed column — a tenant id where one tenant owns most rows — 100 buckets estimate the common case and miss the tail, and the plan chosen for the tail is the one that times out."
    measure: "`SELECT attname, n_distinct, most_common_freqs FROM pg_stats WHERE tablename = 'your_table';`"
```

Read your own server's values rather than assuming these — the point of the
last column is that the answer for your database is one query away:

```sql run
-- The planner constants above, straight out of the running server. `boot_val`
-- is the compiled-in default; `setting` is what this server is actually using.
SELECT name, setting, unit, boot_val
FROM pg_settings
WHERE name IN ('random_page_cost', 'seq_page_cost', 'effective_cache_size', 'default_statistics_target')
ORDER BY name;
```

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

Everything above is a plan you produced. The claim the prose makes about them —
that a predicate written one way uses the index and the *same predicate* written
another way does not — is a claim about the planner, so it is checked rather
than asserted. This runs in CI on every commit:

```proof sha=723938594edcb5a7 at=2026-09-08 commit=fc21918
$ node plans.js
50000 rows, one index: readings_at_idx on (at). Both queries return the same rows.

A) the predicate written as a range on the column itself:
   Aggregate (actual rows=1.00 loops=1)
     ->  Index Only Scan using readings_at_idx on readings (actual rows=60.00 loops=1)
           Index Cond: ((at >= '2026-01-05 09:00:00+00'::timestamp with time zone) AND (at < '2026-01-05 10:00:00+00'::timestamp with time zone))
           Heap Fetches: 60
           Index Searches: 1

B) the same hour, written as date_trunc('hour', at) = ...:
   Aggregate (actual rows=1.00 loops=1)
     ->  Seq Scan on readings (actual rows=60.00 loops=1)
           Filter: (date_trunc('hour'::text, at) = '2026-01-05 09:00:00+00'::timestamp with time zone)
           Rows Removed by Filter: 49940

Both answers: A = 60, B = 60 rows.
The index exists, the query is selective, and B does not use it. Wrapping the
column in a function means the index on that column no longer describes the
expression being filtered on, so every row must be read and tested.

--- what a stale statistic looks like
   pg_class.reltuples before ANALYZE : 50000
   pg_class.reltuples after ANALYZE  : 70000
   rows actually in the table        : 70000
   plan for device_id = 999          : ->  Seq Scan on readings (actual rows=20000.00 loops=1)

The planner does not count rows; it reads a statistic that ANALYZE last wrote.
Between the insert and the next ANALYZE it is planning against a table that no
longer exists, and no amount of reading the query will show you that.
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

```breaks
caption: Two reports of the same shape — "it got slow" — with different causes and different knobs. Write your diagnosis before you look.
entries:
  - symptom: >-
      A dashboard tile that read one hour of a 50,000-row table returned in
      under 20 ms all last quarter. Nobody changed the schema. It now takes
      seconds, and the index it depends on is still there.
    instinct: >-
      The index must have gone missing or gone stale, so re-create it — or add
      a second one on the same column.
    look: EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, COSTS OFF, BUFFERS OFF) SELECT count(*) FROM readings WHERE date_trunc('hour', at) = timestamptz '2026-01-05 09:00:00+00';
    see: |-
      ->  Seq Scan on readings (actual rows=60.00 loops=1)
            Filter: (date_trunc('hour'::text, at) = '2026-01-05 09:00:00+00'::timestamp with time zone)
            Rows Removed by Filter: 49940
    why: >-
      The index describes the values in the column. The filter is not on the
      column, it is on a function of it, so the index does not describe the
      thing being compared and every row has to be read and tested. "Rows
      Removed by Filter: 49940" is the whole table minus the answer — the
      signature of a predicate the index could not narrow.
    knob: >-
      Rewrite the predicate as a half-open range on the bare column (`at >= x
      AND at < y`), which the existing index serves. If the function form is
      genuinely needed, the index has to describe it too — an expression index
      on `date_trunc('hour', at)`.
  - symptom: >-
      A query that has always used its index starts choosing a sequential scan
      shortly after a bulk load of 20,000 rows. The query, the index and the
      data are all fine.
    instinct: >-
      The planner is wrong and needs to be overridden — set `enable_seqscan =
      off`, or add an index hint.
    look: SELECT reltuples::bigint AS planner_thinks FROM pg_class WHERE relname = 'readings';
    see: |-
      pg_class.reltuples before ANALYZE : 50000
      pg_class.reltuples after ANALYZE  : 70000
      rows actually in the table        : 70000
    why: >-
      The planner does not count rows. It reads a statistic that `ANALYZE` last
      wrote, and between a bulk load and the next `ANALYZE` it is planning
      against a table that no longer exists. Nothing in the query text shows
      this; the gap is only visible by asking what the planner believes.
    knob: >-
      `ANALYZE tablename` after any bulk load, rather than waiting for
      autovacuum's threshold. Overriding the planner instead hides the stale
      statistic and leaves every other query on that table planning against it.
```

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
