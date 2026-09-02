# 17. Database Index Strategy (Composite, Covering, Partial Index)

## What It Is
An index is a separate data structure (typically a B-tree) that PostgreSQL maintains alongside your table, allowing it to find rows matching a condition without scanning every row. Indexes trade write overhead (every INSERT/UPDATE/DELETE must update all relevant indexes) and storage for faster reads. Choosing which indexes to create — and which not to — is one of the highest-leverage performance decisions in a database-backed application.

A **composite index** is an index on multiple columns in a defined order. The leading column rule determines its usefulness: an index on `(tenant_id, created_at)` can be used for queries filtering on `tenant_id` alone, or on `(tenant_id, created_at)` together — but not for queries filtering on `created_at` alone. Column order in composite indexes mirrors column order in WHERE clauses; put the most selective column first if queries filter on it alone.

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

## When to Use
- Any query that filters on `tenantId` + one or more additional columns — these are your most common queries in a multi-tenant app and the first place to apply composite indexes
- Listing endpoints with `ORDER BY created_at DESC LIMIT N` — the sort column must be the trailing column in the index
- Tables with a natural "active vs inactive" split (sessions, invitations, jobs) — use partial indexes to keep index size small
- Any query slower than 100ms on production data — run `EXPLAIN ANALYZE` and look for seq scans on large tables

## Common Mistakes
- **Over-indexing**: Every index slows down writes; tables with 8 indexes on 10 columns are common in over-indexed apps; index based on actual query plans, not hypothetical ones
- **Wrong composite column order**: An index on `(status, tenant_id)` won't help a query that only filters on `tenant_id`; put the column appearing in the most standalone WHERE clauses first
- **Partial indexes with functions**: `WHERE expires_at > NOW()` creates a partial index with a snapshot condition at creation time — it doesn't dynamically filter; for time-based partial indexes, use explicit cutoff columns or accept the index covers the full table
- **Not using `CREATE INDEX CONCURRENTLY`**: Creating an index without `CONCURRENTLY` takes a write lock on the table, blocking all writes for the duration; always use `CONCURRENTLY` for indexes on production tables

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
