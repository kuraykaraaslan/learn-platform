# 13. CQRS Read Model Optimization (Materialized Views)

## Coverage Level
**Not Covered** — Your application queries the same normalized tables for both writes and reads. Dashboard and listing queries likely involve multiple JOINs on every request, with no denormalized read models or materialized views to serve expensive queries cheaply.

## What It Is
The read model optimization side of CQRS — without the full event sourcing overhead — is about accepting that your normalized write schema is often a poor fit for read queries. A normalized schema minimizes redundancy; a read model maximizes query performance by denormalizing, pre-aggregating, and pre-joining data for specific query patterns. These are different goals, and trying to serve both from the same table often means you serve neither well.

A **materialized view** in PostgreSQL is a named query whose results are physically stored on disk. Unlike a regular view (which re-executes the query every time), a materialized view is refreshed explicitly (`REFRESH MATERIALIZED VIEW`) or on a schedule. This is ideal for expensive aggregation queries — monthly revenue, active user counts, tenant usage summaries — that would otherwise run a full table scan on every dashboard load. With `REFRESH MATERIALIZED VIEW CONCURRENTLY`, you can refresh without locking out readers.

You don't need event sourcing to apply this pattern. The simpler version — applicable today — is to identify your most expensive, most frequent read queries, and either: (1) create a PostgreSQL materialized view refreshed on a schedule or triggered by BullMQ, (2) maintain a separate denormalized summary table updated by triggers or application-level writes, or (3) use a Redis hash as a live read model updated whenever the source data changes. Each approach trades freshness for performance; which is acceptable depends on the query.

## Key Concepts
- **Materialized view**: A stored query result in PostgreSQL; refreshed explicitly; faster reads at the cost of data freshness
- **`REFRESH MATERIALIZED VIEW CONCURRENTLY`**: Refreshes the view without locking readers; requires a unique index on the view
- **Denormalized summary table**: An application-managed table that stores pre-computed aggregates, updated on writes — more flexible than a materialized view but requires manual maintenance
- **Read model projection**: In event-sourced systems, a read model is rebuilt by replaying events; in non-event-sourced systems, it's a derived table kept in sync via triggers or application code
- **Freshness vs performance tradeoff**: More frequent refresh = fresher data but more compute; less frequent = cheaper but staleness risk
- **Trigger-maintained denormalized columns**: PostgreSQL triggers that update a summary column on the parent row when child rows change — e.g., `tenants.member_count` updated when `tenant_members` rows are inserted/deleted
- **Write-through cache**: Update the read model synchronously on every write; always fresh but adds latency to writes
- **Eventual read model**: Update the read model asynchronously via BullMQ; lower write latency but a lag window

## Example Code
```typescript
// Pattern 1: PostgreSQL materialized view for tenant usage dashboard
// Run this in a migration to create the view

/*
CREATE MATERIALIZED VIEW tenant_usage_summary AS
SELECT
  t.id                        AS tenant_id,
  t.name                      AS tenant_name,
  COUNT(DISTINCT tm.user_id)  AS member_count,
  COUNT(DISTINCT s.id)        AS active_sessions,
  MAX(tm.last_active_at)      AS last_activity_at,
  SUM(al.request_count)       AS requests_last_30d
FROM tenants t
LEFT JOIN tenant_members tm ON tm.tenant_id = t.id
LEFT JOIN user_sessions s   ON s.tenant_id = t.id AND s.expires_at > NOW()
LEFT JOIN audit_log al      ON al.tenant_id = t.id
                            AND al.created_at > NOW() - INTERVAL '30 days'
GROUP BY t.id, t.name;

-- Required for CONCURRENTLY refresh:
CREATE UNIQUE INDEX ON tenant_usage_summary (tenant_id);
*/

// Application: query the materialized view (fast — pre-computed)
async function getTenantDashboardData(tenantId: string) {
  return db.$queryRaw<TenantUsageSummary[]>`
    SELECT * FROM tenant_usage_summary WHERE tenant_id = ${tenantId}
  `;
}

// Refresh via BullMQ on a schedule (every 5 minutes)
import { Queue, Worker } from 'bullmq';

const refreshQueue = new Queue('read-model-refresh', {
  defaultJobOptions: { repeat: { every: 5 * 60 * 1000 } }, // every 5 min
});

new Worker('read-model-refresh', async () => {
  // CONCURRENTLY = no exclusive lock, readers continue unblocked
  await db.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_usage_summary`;
  console.log('tenant_usage_summary refreshed');
});

// ─── Pattern 2: Denormalized column maintained by application ───
// Keep `tenants.member_count` up to date without a full COUNT query

async function addTenantMember(tenantId: string, userId: string, db: PrismaClient) {
  await db.$transaction([
    db.tenantMember.create({
      data: { tenantId, userId, role: 'member' },
    }),
    // Increment the denormalized counter atomically
    db.tenant.update({
      where: { id: tenantId },
      data: { memberCount: { increment: 1 } },
    }),
  ]);
}

async function removeTenantMember(tenantId: string, userId: string, db: PrismaClient) {
  await db.$transaction([
    db.tenantMember.delete({
      where: { tenantId_userId: { tenantId, userId } },
    }),
    db.tenant.update({
      where: { id: tenantId },
      data: { memberCount: { decrement: 1 } },
    }),
  ]);
}

// Now listing tenants with member counts is a single table scan — no JOIN
async function listTenantsWithCounts() {
  return db.tenant.findMany({
    select: { id: true, name: true, memberCount: true },
    orderBy: { memberCount: 'desc' },
  });
}
```

## When to Use
- Dashboard queries that aggregate across many rows (user counts, event counts, revenue totals) — replace with materialized views refreshed on a schedule
- Listing pages that require sorted/filtered results from JOINs across 3+ tables — denormalize into a summary table
- Any query that runs on every page load and takes more than 100ms on the primary database
- Admin reporting features that can tolerate a few minutes of staleness — materialized views with periodic refresh are ideal

## Common Mistakes
- **Refreshing without `CONCURRENTLY`**: A plain `REFRESH MATERIALIZED VIEW` takes an exclusive lock and blocks all reads on that view for the duration — always use `CONCURRENTLY` in production (requires a unique index)
- **Forgetting to refresh**: A materialized view that never gets refreshed is just a stale table; wire up the refresh to BullMQ or a cron job and monitor its last-refresh timestamp
- **Denormalizing everything eagerly**: Not every table needs a read model; profile first, then denormalize the specific queries that are slow — premature denormalization creates synchronization bugs
- **Not handling consistency between write model and read model**: If you maintain a denormalized column (like `memberCount`) but forget to update it in one code path, it drifts silently — use database transactions to update both atomically, or use PostgreSQL triggers as a safety net

## Further Reading
- **PostgreSQL documentation — "Materialized Views"** — Covers `CREATE MATERIALIZED VIEW`, refresh options, and the `CONCURRENTLY` requirement; short and definitive
- **"CQRS Journey" by Microsoft Patterns & Practices (microsoft.com/en-us/download/details.aspx?id=34774)** — A free e-book walking through the full CQRS read model pattern; even the non-event-sourced parts are directly applicable
- **"Denormalization Is OK" by Brandur Leach (brandur.org)** — A pragmatic argument for read-model denormalization in PostgreSQL applications; resonates well for a solo developer who values simplicity
