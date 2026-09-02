# 45. Time-Series Data — TimescaleDB or Partition by Range

## What It Is
Time-series data is any data where the primary access pattern is by time range: "give me all audit log entries for tenant X in the last 30 days", "show me login activity for the last 7 days", "aggregate API call counts by hour over the past month". Standard table scans become progressively slower as the table grows because PostgreSQL must scan more and more rows to find the relevant time window.

There are two main approaches for managing this in PostgreSQL. The first is native table partitioning: `PARTITION BY RANGE (created_at)`. PostgreSQL splits the logical table across multiple physical tables (partitions), each covering a time range (e.g., one partition per month). A query with a `WHERE created_at BETWEEN $start AND $end` only scans the relevant partitions — partition pruning eliminates the others entirely. Old partitions can be dropped instantly (`DROP TABLE audit_logs_2023_q1`) without a slow `DELETE` operation.

The second approach is TimescaleDB, a PostgreSQL extension that wraps the partitioning concept in a higher-level API called hypertables, and adds time-series-specific features: automatic chunk creation, continuous aggregates (materialized views that stay updated automatically), data compression, and tiered storage (hot/warm/cold data at different storage costs). TimescaleDB is compelling if your use case is genuinely time-series (metrics, telemetry, IoT data, financial ticks). For audit logs and session analytics, native partitioning is simpler and sufficient.

```quiz
- q: "Your table is range-partitioned on `created_at`, but a query filters only on `tenant_id`. What happens?"
  anchor: "only works when the WHERE clause contains the partition key"
  options:
    - text: "Postgres selects the partitions holding that tenant"
      correct: false
      why: "It has no way to know which those are. The partition boundaries encode `created_at` and nothing else."
    - text: "Every partition is scanned — pruning needs the partition key in the WHERE clause"
      correct: true
      why: "Partitioning helps queries that filter on the key; the rest get no benefit and still pay the overhead."
    - text: "The query is rejected as invalid against a partitioned table"
      correct: false
      why: "It runs perfectly well. It just runs against all of it."

- q: "You need to remove data older than a year from a partitioned table. `DELETE`, or something else?"
  anchor: "more efficient than `DELETE WHERE created_at < $threshold`"
  options:
    - text: "`DELETE WHERE created_at < now() - interval '1 year'`"
      correct: false
      why: "That rewrites rows, generates WAL, and leaves bloat for vacuum to reclaim afterwards."
    - text: "Drop the partitions that fall entirely past the threshold"
      correct: true
      why: "A retention policy dropping whole partitions or chunks is the efficient form of the same intent."
    - text: "`TRUNCATE` the table and reload what you meant to keep"
      correct: false
      why: "That removes the recent data too, and reloading it is strictly more work than dropping the old partitions."

- q: "What is a continuous aggregate?"
  anchor: "TimescaleDB's auto-updating materialized view"
  options:
    - text: "A view recomputed on every query, so it is never stale"
      correct: false
      why: "That is a plain view. The point here is that the result is precomputed and stored."
    - text: "An auto-updating materialized view — the GROUP BY is precomputed and refreshed for you"
      correct: true
      why: "Materialized-view speed without scheduling the refresh yourself."
    - text: "A trigger maintaining a summary table on every insert"
      correct: false
      why: "That is the hand-rolled equivalent, and it puts the whole cost on the write path."
```

## Key Concepts
- **Table partitioning** — A single logical table split into multiple physical storage units based on a partition key; queries that filter on the partition key only scan relevant partitions
- **Range partitioning** — `PARTITION BY RANGE (created_at)` — most natural for time-series; one partition per week/month/quarter
- **Partition pruning** — PostgreSQL's query planner eliminates partitions that cannot contain matching rows; only works when the WHERE clause contains the partition key
- **Declarative partitioning** — PostgreSQL syntax for defining partitions directly in DDL; supported since PostgreSQL 10
- **TimescaleDB hypertable** — A partitioned table managed by TimescaleDB; chunks are created automatically; supports compression and continuous aggregates
- **Continuous aggregate** — TimescaleDB's auto-updating materialized view; `SELECT hour, COUNT(*) ... GROUP BY hour` precomputed and refreshed automatically
- **Chunk** — TimescaleDB terminology for a partition; default chunk interval is 7 days
- **Data retention policy** — Automatically drop partitions/chunks older than a threshold; more efficient than `DELETE WHERE created_at < $threshold`

## Example Code
```sql run
-- ─── Option A: Native PostgreSQL range partitioning ──────────────────────

-- Create the parent (partitioned) table
CREATE TABLE audit_logs (
  audit_log_id UUID NOT NULL,
  tenant_id UUID,
  actor_id UUID,
  action VARCHAR NOT NULL,
  resource_type VARCHAR,
  resource_id VARCHAR,
  metadata JSONB,
  ip_address VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create initial partitions (automate this with a cron job or pg_partman)
CREATE TABLE audit_logs_2025_q1
  PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE audit_logs_2025_q2
  PARTITION OF audit_logs
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

CREATE TABLE audit_logs_2025_q3
  PARTITION OF audit_logs
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');

-- Index on each partition (PostgreSQL inherits this automatically with partitioned indexes)
CREATE INDEX ON audit_logs (tenant_id, created_at);
CREATE INDEX ON audit_logs (actor_id, created_at);

-- A row every ten days across all three quarters. Routing is automatic: the
-- value of created_at decides which partition the row lands in.
INSERT INTO audit_logs (audit_log_id, tenant_id, actor_id, action, created_at)
SELECT gen_random_uuid(),
       '11111111-1111-1111-1111-111111111111',
       gen_random_uuid(),
       'record.updated',
       d
FROM generate_series('2025-01-15'::timestamptz, '2025-09-15', '10 days') AS d;

-- Where each row actually went:
SELECT tableoid::regclass AS partition, count(*)
FROM audit_logs GROUP BY 1 ORDER BY 1;

-- Efficient time-range query — only scans Q2 partition. Read the plan: the
-- scan names audit_logs_2025_q2, and the other two partitions never appear.
-- (In application code the tenant id is a bound parameter; it is written out
-- here so the query runs as-is — see lesson 30 on why you would not inline it
-- for real.)
EXPLAIN
SELECT * FROM audit_logs
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND created_at BETWEEN '2025-04-01' AND '2025-06-30'
ORDER BY created_at DESC
LIMIT 50;

-- Data retention: drop Q1 2025 instantly (no slow DELETE)
DROP TABLE audit_logs_2025_q1; -- instant!
-- vs: DELETE FROM audit_logs WHERE created_at < '2025-04-01' — very slow

-- Use pg_partman extension to automate partition creation and maintenance
-- CREATE EXTENSION pg_partman;
-- SELECT partman.create_parent('public.audit_logs', 'created_at', 'range', 'monthly');
```

```typescript
// ─── Option B: TimescaleDB ─────────────────────────────────────────────────
// After installing the TimescaleDB extension:

// Migration SQL (run once):
import { DataSource } from 'typeorm';
/*
  -- Convert existing table to hypertable
  SELECT create_hypertable('audit_logs', 'created_at',
    chunk_time_interval => INTERVAL '1 week',
    if_not_exists => TRUE
  );

  -- Enable compression (saves 90%+ on old time-series data)
  ALTER TABLE audit_logs SET (
    timescaledb.compress,
    timescaledb.compress_orderby = 'created_at DESC',
    timescaledb.compress_segmentby = 'tenant_id'
  );

  -- Automatically compress chunks older than 7 days
  SELECT add_compression_policy('audit_logs', INTERVAL '7 days');

  -- Automatically drop chunks older than 90 days (data retention policy)
  SELECT add_retention_policy('audit_logs', INTERVAL '90 days');

  -- Continuous aggregate: precomputed hourly counts by tenant
  CREATE MATERIALIZED VIEW audit_log_hourly
  WITH (timescaledb.continuous) AS
  SELECT
    time_bucket('1 hour', created_at) AS bucket,
    tenant_id,
    COUNT(*) AS event_count
  FROM audit_logs
  GROUP BY bucket, tenant_id;

  -- Auto-refresh the continuous aggregate
  SELECT add_continuous_aggregate_policy('audit_log_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
  );
*/

// TypeORM query — works identically with partitioned or TimescaleDB tables
// The query API is unchanged; partitioning is transparent to the application
export async function getAuditLogsInRange(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  ds: DataSource
) {
  return ds
    .getRepository(TenantAuditLog)
    .createQueryBuilder('log')
    .where('log.tenantId = :tenantId', { tenantId })
    .andWhere('log.createdAt BETWEEN :start AND :end', {
      start: startDate,
      end: endDate,
    })
    .orderBy('log.createdAt', 'DESC')
    .limit(100)
    .getMany();
  // Partition pruning applies automatically — only relevant partitions are scanned
}
```

## When to Use
- **Native partitioning** — When your audit log, session, or event tables exceed 10 million rows and time-range queries are noticeably slow; add partitioning before migration becomes painful
- **TimescaleDB** — When you have genuine time-series metrics (API latency percentiles, system resource usage, financial data) that benefit from continuous aggregates and compression
- **Data retention** — Any time you have a compliance or cost requirement to drop old data; partitioned tables make this `O(1)` instead of `O(N)` where N is the number of rows to delete
- **Tenant-scoped time-series queries** — Your per-tenant databases are already isolated; partitioning within each tenant DB handles the time dimension independently

## Common Mistakes
- **Adding partitioning to an existing large table** — You cannot `ALTER TABLE` an existing unpartitioned table into a partitioned one; you must create a new partitioned table and migrate the data; plan this migration carefully
- **Not indexing the partition key** — Partitioning speeds up range queries on `created_at`, but queries that filter only on `tenant_id` still scan all partitions; add composite indexes (`tenant_id`, `created_at`)
- **Too many partitions** — Daily partitions on a busy table can create thousands of partitions, each with its own set of indexes, causing planning overhead; monthly or quarterly partitions are usually the right granularity for audit logs
- **Using TimescaleDB for non-time-series data** — TimescaleDB adds operational complexity (extension management, version compatibility); don't use it for tables that don't have time as the primary access dimension

## Further Reading
- [PostgreSQL declarative partitioning documentation](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [TimescaleDB getting started guide](https://docs.timescale.com/getting-started/latest/)
- [pg_partman — PostgreSQL partition management extension](https://github.com/pgpartman/pg_partman)

```recall
- q: "What is table partitioning, and what does range partitioning look like for time-series?"
  must:
    - "a single logical table split into multiple physical storage units based on a partition key"
    - "queries filtering on the partition key only scan the relevant partitions"
    - "`PARTITION BY RANGE (created_at)` — one partition per week, month or quarter"

- q: "What is a hypertable, and what is a chunk?"
  must:
    - "a hypertable is a partitioned table managed by TimescaleDB, with chunks created automatically"
    - "it supports compression and continuous aggregates"
    - "a chunk is TimescaleDB's term for a partition, with a default interval of 7 days"

- q: "What is declarative partitioning?"
  must:
    - "PostgreSQL syntax for defining partitions directly in the DDL"
    - "supported since PostgreSQL 10"
```
