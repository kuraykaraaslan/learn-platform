# 52. OLTP vs OLAP — Analytical vs Transactional Workload Separation

## What It Is
OLTP (Online Transaction Processing) and OLAP (Online Analytical Processing) describe two fundamentally different ways databases are used, and mixing them on the same instance will eventually hurt both.

OLTP is what your app does all day: short, concurrent reads and writes against individual rows. Inserting a new user session, updating a subscription status, fetching a tenant's members — these queries touch a few rows at a time, run in milliseconds, and happen thousands of times per minute. PostgreSQL with normalized schemas and row-level locking is purpose-built for this.

OLAP is what happens when someone asks "how many users signed up per country last month, broken down by subscription tier, excluding churned accounts?" That query scans millions of rows, aggregates them, and may run for seconds or minutes. Running it against your production OLTP database causes full table scans, lock contention, and visible slowdowns for real users. The solution is to move analytical queries to a separate system — a read replica, a data warehouse (BigQuery, Snowflake, Redshift, DuckDB), or a materialized view layer — and keep your production PostgreSQL clean for transactional work.

For a multi-tenant SaaS, this matters earlier than most founders expect. As soon as you need to build a usage dashboard, a billing report, or tenant health metrics, you are doing OLAP. Doing it against your production DB at 2 AM is fine. Doing it inline during a page load is not.

## Key Concepts
- **OLTP** — short transactions, row-level operations, high concurrency, normalized schema, optimized for writes and point reads
- **OLAP** — long-running aggregations, columnar access patterns, low concurrency, denormalized/star schema, optimized for analytical reads
- **Read replica** — a streaming copy of your primary OLTP database; safe for heavy reads but still row-oriented
- **Data warehouse** — purpose-built analytical store (BigQuery, Snowflake, Redshift); columnar storage for fast aggregations
- **ETL / ELT** — Extract-Transform-Load (or Load-then-Transform); the pipeline that moves data from OLTP to OLAP
- **Materialized view** — a pre-computed query result stored as a table; a lightweight OLAP layer inside PostgreSQL itself
- **DuckDB** — an embeddable in-process OLAP engine; can query Parquet files or Postgres directly; great for smaller-scale analytics
- **HTAP** — Hybrid Transactional/Analytical Processing; some databases (TiDB, SingleStore) claim to handle both, but with trade-offs

## Example Code
```typescript
// Scenario: you need a "tenant activity summary" for an admin dashboard.
// WRONG: running this aggregation against your production OLTP PostgreSQL
// during a page request will scan millions of audit_log rows.

// ❌ Bad — analytical query hitting the production OLTP database inline
async function getTenantSummaryBad(tenantId: string) {
  return db.query(`
    SELECT
      COUNT(DISTINCT user_id)          AS active_users,
      COUNT(*)                          AS total_events,
      DATE_TRUNC('day', created_at)     AS day
    FROM audit_log
    WHERE tenant_id = $1
      AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY day
    ORDER BY day
  `, [tenantId]);
  // Full table scan on audit_log — no index on (tenant_id, created_at, user_id) combo
}

// ✓ Better option 1: Materialized view, refreshed on a schedule (inside PostgreSQL)
// Run this DDL once:
// CREATE MATERIALIZED VIEW tenant_daily_activity AS
//   SELECT tenant_id, DATE_TRUNC('day', created_at) AS day,
//          COUNT(DISTINCT user_id) AS active_users, COUNT(*) AS total_events
//   FROM audit_log
//   GROUP BY tenant_id, day;
// CREATE UNIQUE INDEX ON tenant_daily_activity (tenant_id, day);
// -- Refresh nightly via a BullMQ cron job:
async function refreshAnalyticsView(db: Pool): Promise<void> {
  // CONCURRENTLY means readers are not blocked during refresh
  await db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_daily_activity');
}

// ✓ Better option 2: BullMQ job exports data to DuckDB (embedded OLAP)
import Database from 'duckdb'; // npm install duckdb

async function buildAnalyticsSnapshot(rows: AnalyticsRow[]): Promise<void> {
  const duck = new Database(':memory:');
  const conn = duck.connect();

  // DuckDB can ingest a JS array directly — no file needed
  conn.run('CREATE TABLE activity AS SELECT * FROM ?', [rows]);

  const result = conn.all(`
    SELECT tenant_id, YEAR(day) AS yr, MONTH(day) AS mo,
           SUM(total_events) AS monthly_events
    FROM activity
    GROUP BY tenant_id, yr, mo
    ORDER BY monthly_events DESC
  `);
  // Write result back to a summary table in PostgreSQL for the dashboard
}

// Rule of thumb: if a query touches > ~10,000 rows for a single page request,
// it belongs in a scheduled job that writes a pre-computed summary, not inline.
```

## When to Use
1. **Usage dashboards and admin panels** — aggregate queries across all tenants; schedule these as nightly jobs that write to a summary table.
2. **Billing and revenue reporting** — `SUM(amount) GROUP BY month` across a large transactions table; run against a read replica or warehouse, not primary.
3. **Churn analysis, cohort reports, funnel metrics** — multi-step analytical queries that require full scans; move to DuckDB or BigQuery.
4. **Large exports** — a tenant requests a CSV of all their activity for the past year; stream from a read replica, not the primary.
5. **SLO / usage limit enforcement** — pre-compute "API calls this month per tenant" in a BullMQ job and cache in Redis, not inline on every API request.

## Common Mistakes
- **Running unbounded aggregations in API handlers** — `COUNT(*) FROM audit_log WHERE tenant_id = ?` will eventually bring your app to its knees as the table grows.
- **Ignoring read replicas** — if your cloud provider (e.g., RDS, Supabase, Neon) offers read replicas, use them for all reporting queries — free performance headroom.
- **Over-engineering early** — you do not need Snowflake at 100 tenants. Start with materialized views and a BullMQ refresh job; migrate to a warehouse when the pain is real.
- **Forgetting to index analytical queries** — even on a read replica, an unindexed `GROUP BY` on a 10M-row table takes minutes; add composite indexes or partial indexes for common analytical filters.

## Further Reading
- PostgreSQL documentation on Materialized Views: https://www.postgresql.org/docs/current/rules-materializedviews.html
- DuckDB — the in-process OLAP database: https://duckdb.org/docs/
- Designing Data-Intensive Applications, Martin Kleppmann — Chapter 3 (Storage and Retrieval)
