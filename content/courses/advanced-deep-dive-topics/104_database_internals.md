# 104. Database Internals — B-tree, WAL, MVCC Deep Dive, Vacuum

## Coverage Level
**Not Covered** — You use Prisma and TypeORM effectively but the physical storage layer beneath them is a blind spot.

## What It Is
Most developers treat PostgreSQL as a black box: send SQL, get rows. But when your queries slow down, your disk fills up, or your replica lags, the black box needs to be opened. Understanding how PostgreSQL physically stores and retrieves data lets you make decisions that can't be made from ORM documentation alone.

Three mechanisms dominate PostgreSQL internals: the B-tree index structure that makes lookups fast, the Write-Ahead Log (WAL) that makes the database durable and replicatable, and MVCC (Multi-Version Concurrency Control) that allows reads and writes to proceed without blocking each other — at the cost of dead tuples that accumulate over time.

Knowing these three means you can diagnose bloat, tune autovacuum, understand replication lag, design indexes that actually get used, and explain to a client why their database is using 40GB of disk for 2GB of actual data.

## Key Concepts
- **B-tree index**: A balanced tree where each node holds sorted keys and pointers. Lookups are O(log n). Sequential inserts (e.g., auto-increment IDs) are efficient; random inserts (e.g., UUIDs) cause page splits.
- **Heap file**: The table data itself, stored in 8KB pages. Rows are not sorted — the B-tree index points into heap pages.
- **WAL (Write-Ahead Log)**: Every change is written to the WAL before the heap. Guarantees durability (fsync the WAL, not the heap) and enables streaming replication.
- **MVCC**: Each UPDATE creates a new row version (`xmax` on old, new row inserted). Readers see a consistent snapshot without locking writers.
- **Dead tuples**: Old row versions left behind by UPDATE/DELETE. They occupy space until vacuumed.
- **Autovacuum**: Background process that reclaims dead tuple space and updates planner statistics. If it falls behind, queries slow and disk fills.
- **VACUUM FREEZE**: Prevents transaction ID wraparound — a critical maintenance operation on long-running databases.
- **Bloat**: The ratio of dead space to live data. A table with 80% bloat uses 5× the necessary disk and slows sequential scans.

## Example Code

```sql
-- Check dead tuple count and bloat per table
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup,
  n_dead_tup,
  ROUND(n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 2) AS dead_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;

-- Check index usage — indexes with 0 scans are wasted space
SELECT
  indexrelname AS index_name,
  relname AS table_name,
  idx_scan AS scans,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
JOIN pg_index USING (indexrelid)
WHERE idx_scan = 0
  AND NOT indisprimary
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check WAL lag on replicas (run on primary)
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  (sent_lsn - replay_lsn) AS replication_lag_bytes
FROM pg_stat_replication;

-- Force vacuum on a bloated table (run manually if autovacuum is behind)
VACUUM (VERBOSE, ANALYZE) your_table_name;

-- Check transaction ID age — if close to 2 billion, emergency VACUUM FREEZE needed
SELECT
  datname,
  age(datfrozenxid) AS xid_age,
  2147483647 - age(datfrozenxid) AS xids_remaining
FROM pg_database
ORDER BY xid_age DESC;
```

## When to Use
- Your table has grown large but queries are slower than expected — check bloat before adding indexes
- Replica is lagging — WAL generation rate exceeds network bandwidth or replica I/O
- After bulk DELETE or UPDATE operations — dead tuples spike, manual VACUUM may be needed
- UUID primary keys causing write slowdowns — B-tree page splits from random inserts
- Disk usage grows much faster than data volume — bloat is the likely cause

## Common Mistakes
- Assuming VACUUM = VACUUM FULL (VACUUM FULL locks the table and rewrites it; regular VACUUM does not)
- Using UUIDs as primary keys without a ULID/UUIDv7 alternative — random B-tree inserts at scale cause 30–50% index bloat
- Disabling autovacuum on "busy" tables — this causes bloat and eventually transaction ID wraparound
- Not monitoring `pg_stat_user_tables` — dead tuple accumulation is invisible until performance degrades

## Further Reading
- *The Internals of PostgreSQL* — Hironobu Suzuki (free online): chapter-by-chapter breakdown of heap, indexes, WAL, and MVCC
- PostgreSQL docs: `pg_stat_user_tables`, `pg_stat_user_indexes` — the two most important monitoring views
- *Use The Index, Luke* (use-the-index-luke.com) — practical B-tree index design, vendor-neutral
