# 17. Database Index Strategy (Composite, Covering, Partial Index)

## What It Is
An index is a separate data structure (typically a B-tree) that PostgreSQL maintains alongside your table, allowing it to find rows matching a condition without scanning every row. Indexes trade write overhead (every INSERT/UPDATE/DELETE must update all relevant indexes) and storage for faster reads. Choosing which indexes to create — and which not to — is one of the highest-leverage performance decisions in a database-backed application.

A **composite index** is an index on multiple columns in a defined order, and the order decides how cheaply it serves a query. An index on `(tenant_id, created_at)` serves a filter on `tenant_id` alone, or on both together, by descending into the part of the tree that filter names. A filter on `created_at` alone names nothing at the top of the tree — and what happens then is version-dependent, which is the part usually stated as an absolute. PostgreSQL 18 will still use such an index, skipping across the leading values; the proof below shows it doing so, and shows the cost in the plan's `Index Searches` count. Older versions would not use it at all. Either way the advice is the same and the reason is now a measured one rather than a rule: put the column that appears alone in the most WHERE clauses first.

A **covering index** includes all columns needed to satisfy a query — both the filter columns and the SELECT columns — allowing PostgreSQL to return results directly from the index without touching the main table (an "index-only scan"). This eliminates the heap fetch step and can dramatically speed up read-heavy queries. A **partial index** indexes only a subset of rows matching a condition (`WHERE status = 'active'`). If 90% of your `user_sessions` rows are expired, a partial index `WHERE expires_at > now()` covers the 10% you actually query, is smaller, and is faster to maintain.

```quiz
- q: "You have an index on `(tenant_id, created_at)`. Which query can use it?"
  anchor: "column order matters; leading column rule applies"
  options:
    - text: "`WHERE created_at > $1`, since `created_at` is in the index"
      correct: false
      why: "The leading column rule: with no predicate on `tenant_id`, the index cannot be traversed from the front."
    - text: "`WHERE tenant_id = $1`, and also `WHERE tenant_id = $1 AND created_at > $2`"
      correct: true
      why: "A composite index serves the leading column and any prefix of its column list."
    - text: "Both equally — B-tree indexes are order-independent"
      correct: false
      why: "Column order is precisely what a composite B-tree encodes."

- q: "99% of `jobs` rows are `status = 'done'`, and every query looks for `status = 'pending'`. What indexes best?"
  anchor: "Index with a `WHERE` clause; indexes only matching rows; smaller and faster to maintain than a full index"
  options:
    - text: "A full B-tree on `status`"
      correct: false
      why: "It indexes the 99% nobody queries, paying write overhead and space for rows never looked up."
    - text: "A partial index with `WHERE status = 'pending'`"
      correct: true
      why: "Smaller and faster to maintain, because it indexes only the matching rows."
    - text: "A covering index on `(status) INCLUDE (id)`"
      correct: false
      why: "Covering removes heap fetches. It does nothing about the wasted 99% of entries."

- q: "You index every column that appears in any WHERE clause. What does that cost?"
  anchor: "Every index adds overhead to INSERT/UPDATE/DELETE; don't index every column"
  options:
    - text: "Nothing on writes — indexes only affect the read path"
      correct: false
      why: "Every index has to be maintained on INSERT, UPDATE and DELETE."
    - text: "Every write pays for every index — index on actual query patterns instead"
      correct: true
      why: "Which is why the advice is to index by what queries actually run, not by what columns exist."
    - text: "Only storage, and storage is cheap"
      correct: false
      why: "Storage is the smaller half. The write path is where it is felt."
```

## Key Concepts
- **B-tree index**: The default PostgreSQL index type; supports `=`, `<`, `>`, `BETWEEN`, `LIKE 'prefix%'` efficiently
- **Composite index**: Index on multiple columns; column order matters; leading column rule applies
- **Covering index (`INCLUDE`)**: PostgreSQL 11+ syntax that adds non-key columns to the index; enables index-only scans
- **Partial index**: Index with a `WHERE` clause; indexes only matching rows; smaller and faster to maintain than a full index
- **Index-only scan**: Query satisfied entirely from the index without touching the heap (main table); requires covering index
- **Seq scan**: Full table scan; acceptable for small tables or low-selectivity filters; bad for large tables with selective filters
- **Index bloat**: Over time, dead tuples accumulate in indexes; `VACUUM` reclaims them; `REINDEX CONCURRENTLY` rebuilds without locking
- **Write overhead**: Every index adds overhead to INSERT/UPDATE/DELETE; don't index every column — index based on actual query patterns

Building the index is the other half of the decision, and two server settings
decide how long it takes and how much memory it uses while it happens:

```numbers
caption: "What an index build is given to work with. Both values are read from a running server by the query below this table."
rows:
  - quantity: "PostgreSQL 18 `maintenance_work_mem`"
    default: "64MB"
    source: "https://www.postgresql.org/docs/current/runtime-config-resource.html"
    at_scale: "It is the memory a single index build, VACUUM or ALTER TABLE gets. On a large table 64MB means the sort spills to disk, so the build is bounded by disk throughput rather than by CPU — and the usual report is that 'creating the index took all night'."
    measure: "`SHOW maintenance_work_mem;`, then `SET maintenance_work_mem = '1GB';` in the session doing the build and compare"
  - quantity: "PostgreSQL 18 `max_parallel_maintenance_workers`"
    default: "2"
    source: "https://www.postgresql.org/docs/current/runtime-config-resource.html"
    at_scale: "A B-tree build can use parallel workers, and two is the ceiling regardless of how many cores the machine has. It is a per-build limit, so raising it for a one-off migration is a session-level decision rather than a cluster-wide one."
    measure: "`SHOW max_parallel_maintenance_workers;` and watch `pg_stat_activity` during a build to count the workers that actually appear"
```

Both are session-settable, which is the practical point: an index build during
a migration window can be given far more memory and more workers than the
cluster's steady-state defaults, without changing anything for normal traffic.

```sql run
-- What this server would give an index build. Run it against yours.
SELECT name, setting, unit, boot_val
FROM pg_settings
WHERE name IN ('maintenance_work_mem', 'max_parallel_maintenance_workers', 'work_mem')
ORDER BY name;
```

Note what that run shows for `max_parallel_maintenance_workers`: `boot_val` is
2 and `setting` is 0. The server executing this query is an embedded, single-
threaded PostgreSQL, so it has been configured down — which is the distinction
worth taking away. `boot_val` is the default the software ships with;
`setting` is what the server you are talking to has actually been given. On
your own database they will differ too, for less exotic reasons, and only the
second one is enforcing anything.

## Example Code

Same seeded table as the query-plan-analysis lesson: 400 tenants, 20,000 users, 50,000 `tenant_members` rows, no indexes yet. Each fence below is self-contained — run them in any order.

**Composite index** — the leading-column rule in action: an index on `(tenant_id, status)` serves a query filtering on both, or on `tenant_id` alone, but not on `status` alone.

```sql run seed=tenant_members
CREATE INDEX IF NOT EXISTS idx_tm_tenant_status ON tenant_members(tenant_id, status);
ANALYZE tenant_members;

EXPLAIN ANALYZE
SELECT * FROM tenant_members WHERE tenant_id = 42 AND status = 'active';
```

**Covering index → index-only scan** — this is the one that needs three separate fences, and that's a genuine PostgreSQL constraint, not an artifact of running in a browser: `VACUUM` refuses to run inside a multi-statement transaction block, so it can never be combined with another statement in one call — not here, not in a real migration either.

```sql run seed=tenant_members
-- INCLUDE adds role/status to the index leaf without making them part of the
-- key — they ride along for free once the index is already being scanned.
CREATE INDEX IF NOT EXISTS idx_tm_covering ON tenant_members(tenant_id) INCLUDE (role, status);
```

```sql run seed=tenant_members
-- Its own fence, on purpose — see the note above.
VACUUM ANALYZE tenant_members;
```

```sql run seed=tenant_members
-- Only role and status are selected, and both are covered by the index
-- above — nothing here needs a row from the actual table.
EXPLAIN ANALYZE
SELECT role, status FROM tenant_members WHERE tenant_id = 42;
```

Look for `Index Only Scan` and `Heap Fetches: 0` in that last plan — PostgreSQL answered the query entirely from the index, without touching `tenant_members` itself. Before `VACUUM` ran, the same query would still use the index but couldn't claim `Heap Fetches: 0`: the visibility map (which rows are guaranteed visible to every transaction) is only current after a vacuum, and without it Postgres still has to check the heap.

Two of this lesson's claims are about what the planner will refuse and what it
will accept, which is not something an author is entitled to simply state. They
are run instead, on the same PostgreSQL build the fences above use, on every
commit:

```proof sha=d339b6f38476843c at=2026-09-08 commit=fc21918
$ node indexes.js
PostgreSQL 18.3 (PGlite, the same build the lesson's run buttons use)

1. A partial index whose predicate calls now().

   $ CREATE INDEX ... ON user_sessions (tenant_id) WHERE expires_at > NOW();
   ERROR:  functions in index predicate must be marked IMMUTABLE

   There is no snapshot-at-creation-time behaviour to reason about, because
   the statement does not execute. A partial index predicate must be IMMUTABLE,
   and now() is STABLE. The fix is a real cutoff value, not a call:
   WHERE expires_at > timestamptz '2026-03-01 00:00:00+00'  -> accepted
   index 376 kB against a 2944 kB table

2. The leading column rule, on a composite index (status, tenant_id).

   filtering on tenant_id alone — the NON-leading column:
     Aggregate (actual rows=1.00 loops=1)
       ->  Bitmap Heap Scan on user_sessions (actual rows=500.00 loops=1)
             Recheck Cond: (tenant_id = 42)
             Heap Blocks: exact=368
             ->  Bitmap Index Scan on sessions_status_tenant_idx (actual rows=500.00 loops=1)
                   Index Cond: (tenant_id = 42)
                   Index Searches: 5

   The index is used. It is not free, and the plan says where the cost went:
   "Index Searches" counts how many separate descents the scan had to make,
   because the filter does not constrain the leading column. Compare an index
   whose leading column IS the filter:
     Aggregate (actual rows=1.00 loops=1)
       ->  Bitmap Heap Scan on user_sessions (actual rows=500.00 loops=1)
             Recheck Cond: (tenant_id = 42)
             Heap Blocks: exact=368
             ->  Bitmap Index Scan on sessions_tenant_idx (actual rows=500.00 loops=1)
                   Index Cond: (tenant_id = 42)
                   Index Searches: 1

   One search instead of several. That difference is what the leading column
   rule is actually about.
   The rule survives as advice about column order; it does not survive as a
   statement about what this version of the planner is capable of.
```

## When to Use
- Any query that filters on `tenantId` + one or more additional columns — these are your most common queries in a multi-tenant app and the first place to apply composite indexes
- Listing endpoints with `ORDER BY created_at DESC LIMIT N` — the sort column must be the trailing column in the index
- Tables with a natural "active vs inactive" split (sessions, invitations, jobs) — use partial indexes to keep index size small
- Any query slower than 100ms on production data — run `EXPLAIN ANALYZE` and look for seq scans on large tables

## Common Mistakes
- **Over-indexing**: Every index slows down writes; tables with 8 indexes on 10 columns are common in over-indexed apps; index based on actual query plans, not hypothetical ones
- **Wrong composite column order**: An index on `(status, tenant_id)` serves a query filtering on `tenant_id` alone far more expensively than one on `(tenant_id, ...)` would — and on PostgreSQL versions before skip scan, not at all; put the column appearing in the most standalone WHERE clauses first
- **Partial indexes with functions**: `WHERE expires_at > NOW()` does not create a snapshot condition — it is **rejected outright** (`functions in index predicate must be marked IMMUTABLE`), because `now()` is `STABLE`; there is no creation-time behaviour to reason about, so use an explicit cutoff value, an explicit cutoff column, or accept an index over the full table
- **Not using `CREATE INDEX CONCURRENTLY`**: Creating an index without `CONCURRENTLY` takes a write lock on the table, blocking all writes for the duration; always use `CONCURRENTLY` for indexes on production tables

```breaks
caption: The index is there and the query is still slow. Write down what you would check before you look.
entries:
  - symptom: >-
      A tenant-scoped count over 50,000 rows runs several times slower than the
      same count in a sibling service. Both have a composite index that
      contains `tenant_id`, and `EXPLAIN` shows the index being used in both.
    instinct: >-
      The index is being used, so indexing is not the problem — go and look at
      the connection pool or the application code.
    look: EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, COSTS OFF, BUFFERS OFF) SELECT count(*) FROM user_sessions WHERE tenant_id = 42;
    see: |-
      ->  Bitmap Index Scan on sessions_status_tenant_idx (actual rows=500.00 loops=1)
            Index Cond: (tenant_id = 42)
            Index Searches: 5
    why: >-
      "Used" and "used well" are different plan facts. `tenant_id` is the
      second column of `(status, tenant_id)`, so the filter constrains nothing
      at the top of the tree and the scan has to make a separate descent for
      each leading value it skips over. `Index Searches` is where that shows up
      — the sibling service's index leads with `tenant_id` and reports 1.
    knob: >-
      Column order. An index leading with the column that appears alone in the
      most WHERE clauses; the `Index Searches` count is how you confirm the new
      one is doing what you expected rather than merely being listed.
  - symptom: >-
      A migration that adds a partial index for live sessions fails on all 3
      environments, including a staging database where the table has 0 rows.
    instinct: >-
      A permissions or locking problem — the table is busy, or the migration
      user cannot create indexes.
    look: CREATE INDEX ... ON user_sessions (tenant_id) WHERE expires_at > NOW();
    see: |-
      ERROR:  functions in index predicate must be marked IMMUTABLE
    why: >-
      An index predicate is evaluated once per row at write time and must give
      the same answer forever, so PostgreSQL only accepts `IMMUTABLE`
      functions in it. `now()` is `STABLE`. The statement never runs, which
      means the widely-repeated "it snapshots the condition at creation time"
      describes behaviour that does not exist.
    knob: >-
      A literal cutoff (`WHERE expires_at > timestamptz '2026-03-01
      00:00:00+00'`), reindexed on a schedule; or a boolean column the
      application maintains. Both are IMMUTABLE predicates, and both make the
      staleness explicit instead of imagined.
```

## Further Reading
- **PostgreSQL documentation — "Indexes"** — Chapters 11–12 in the official docs; covers B-tree, partial, covering, and multicolumn indexes with examples
- [**"Use the Index, Luke"](https://use-the-index-luke.com)** — The best free online guide to SQL indexing; vendor-neutral, database-agnostic, and written for application developers rather than DBAs
- **"Indexing in Postgres: What You Need to Know" by Brandur Leach** — Covers Prisma + PostgreSQL indexing patterns specifically; discusses covering indexes and the cases where Prisma's auto-migration falls short
- [PostgreSQL: index types](https://www.postgresql.org/docs/current/indexes-types.html) — B-tree, hash, GiST, GIN and BRIN, and what each is actually for

```recall
- q: "What is a covering index, and what does it enable?"
  must:
    - "PostgreSQL 11+ `INCLUDE` syntax adds non-key columns to the index"
    - "it enables an index-only scan — the query is satisfied entirely from the index without touching the heap"

- q: "When is a seq scan acceptable?"
  must:
    - "on small tables, or for low-selectivity filters"
    - "it is bad on large tables with selective filters"

- q: "What is index bloat, and how is it dealt with?"
  must:
    - "dead tuples accumulate in indexes over time"
    - "`VACUUM` reclaims them"
    - "`REINDEX CONCURRENTLY` rebuilds without locking"
```
