# 41. PostgreSQL MVCC — Vacuum, Bloat, Transaction Isolation

## What It Is
MVCC (Multi-Version Concurrency Control) is PostgreSQL's strategy for allowing concurrent reads and writes without locking each other out. When you update a row, PostgreSQL does not modify it in place. Instead, it writes a new version of the row and marks the old version as expired (dead). Reads that started before the update still see the old version; reads that start after see the new version. This is what makes `SELECT` never block `UPDATE` in PostgreSQL.

The consequence is that dead row versions accumulate on disk. VACUUM is the process that reclaims space from dead rows. Autovacuum runs this process automatically, but its default configuration is tuned for general workloads. High-write tables — like your `audit_logs`, `user_sessions`, and any table with frequent soft deletes — accumulate dead rows faster than autovacuum's defaults handle. When dead row accumulation outpaces vacuuming, you get table bloat: the table's on-disk size grows beyond what the live data justifies, and query performance degrades because PostgreSQL must scan more pages to find live rows.

Transaction isolation levels control what a transaction can see of concurrent modifications. PostgreSQL offers four levels (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE) but defaults to READ COMMITTED. This means within a single transaction, two identical `SELECT` queries can return different results if another transaction committed between them. Most applications work fine with READ COMMITTED, but for critical operations (account balance updates, subscription state transitions, seat count enforcement) you need either REPEATABLE READ or explicit locking.

## Key Concepts
- **MVCC** — Each row version has `xmin` (transaction that created it) and `xmax` (transaction that deleted/updated it); readers see rows where `xmin` is committed and `xmax` is either null or not yet committed
- **Dead tuple** — An old row version that is no longer visible to any active transaction; takes up space until vacuumed
- **VACUUM** — Marks dead tuples as reusable space; does not shrink the file (use `VACUUM FULL` for that, which locks the table)
- **Autovacuum** — Background process that runs VACUUM and ANALYZE automatically; default settings are conservative
- **Bloat** — Table or index size significantly exceeds what live data requires; caused by insufficient vacuuming or `UPDATE`-heavy workloads
- **Transaction ID Wraparound** — Transaction IDs are 32-bit integers; if they wrap around without vacuuming, PostgreSQL will shut down the entire database to prevent data corruption; prevented by autovacuum
- **READ COMMITTED** — Default isolation; each statement sees the latest committed data; susceptible to non-repeatable reads
- **REPEATABLE READ** — Transaction sees a consistent snapshot from its start time; prevents non-repeatable reads but not serialization anomalies
- **SERIALIZABLE** — Strongest isolation; transactions behave as if run one after another; significant performance cost

## Example Code
```sql
-- ─── Diagnosing table bloat ───────────────────────────────────────────────

-- Check dead tuple count and last vacuum time for your high-write tables
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  ROUND(n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 2) AS dead_pct,
  last_autovacuum,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE relname IN ('audit_logs', 'user_sessions', 'tenant_audit_logs')
ORDER BY n_dead_tup DESC;

-- Rule of thumb: if dead_pct > 20%, autovacuum needs tuning for this table

-- ─── Autovacuum tuning for high-write tables ──────────────────────────────

-- audit_logs accumulates inserts constantly; vacuum it more aggressively
ALTER TABLE audit_logs SET (
  autovacuum_vacuum_scale_factor = 0.01,  -- vacuum when 1% of rows are dead (default: 20%)
  autovacuum_analyze_scale_factor = 0.005, -- analyze when 0.5% of rows change
  autovacuum_vacuum_cost_delay = 2         -- faster vacuum, more I/O (default: 20ms)
);

ALTER TABLE user_sessions SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- sessions expire frequently
  autovacuum_vacuum_threshold = 100        -- vacuum if at least 100 dead rows
);

-- ─── Manual VACUUM (run during low-traffic periods) ──────────────────────
VACUUM ANALYZE audit_logs;       -- reclaim dead tuples, update statistics
VACUUM FULL audit_logs;          -- compact the file (locks the table — use pg_repack instead)
-- pg_repack is a better option for VACUUM FULL in production (no lock)

-- ─── Transaction isolation levels in TypeORM ─────────────────────────────
```

```typescript
// modules/payment/payment.service.ts
// Use SERIALIZABLE isolation for operations that must not have race conditions
// Example: checking and updating a seat count

import { DataSource, IsolationLevel } from 'typeorm';

export async function addTenantMember(
  dataSource: DataSource,
  tenantId: string,
  userId: string
): Promise<void> {
  await dataSource.transaction(
    IsolationLevel.REPEATABLE_READ,  // or 'SERIALIZABLE' for stricter guarantees
    async (manager) => {
      // Within REPEATABLE READ: these two SELECTs will return consistent data
      // even if another transaction commits between them
      const tenant = await manager.findOne(Tenant, {
        where: { tenantId },
        lock: { mode: 'pessimistic_write' }, // additional row-level lock
      });

      const currentMemberCount = await manager.count(TenantMember, {
        where: { tenantId, status: 'ACTIVE' },
      });

      const seatLimit = tenant?.subscription?.seatLimit ?? 5;

      if (currentMemberCount >= seatLimit) {
        throw new Error('Seat limit reached');
      }

      await manager.save(TenantMember, { tenantId, userId, status: 'ACTIVE' });
    }
  );
}

// READ COMMITTED (default) would allow two concurrent requests to both
// see "4 members out of 5" and both add a member, exceeding the limit.
// REPEATABLE READ + pessimistic lock prevents this.
```

## When to Use
- **Autovacuum tuning** — When your `audit_logs` or `user_sessions` tables show high dead tuple percentages; set it up proactively since these tables have high write rates
- **REPEATABLE READ** — For multi-step transactions that read then write, where consistency between the reads matters (subscription seat limits, coupon usage counts)
- **SERIALIZABLE** — For financial transactions, idempotency key checks, or any operation where two concurrent requests must not both succeed
- **Bloat monitoring** — Add the dead tuple query to your monitoring dashboard; investigate if any table exceeds 20% dead rows

## Common Mistakes
- **Using `VACUUM FULL` in production** — It locks the entire table for the duration; use `pg_repack` instead for online compaction
- **Assuming `UPDATE` is atomic by default** — `UPDATE balance = balance + 100 WHERE userId = $1` is atomic per row, but `SELECT balance; UPDATE balance = $newBalance` across two statements in READ COMMITTED is a race condition
- **Not understanding that `REPEATABLE READ` in PostgreSQL is snapshot isolation** — PostgreSQL's REPEATABLE READ gives you a transaction-start snapshot, which is stronger than the SQL standard requires but still allows "write skew" anomalies in certain patterns
- **Ignoring transaction ID wraparound warnings** — PostgreSQL logs warnings when a database is approaching wraparound (age > 1 billion); these must be addressed urgently with a `VACUUM FREEZE`

## Further Reading
- [PostgreSQL MVCC documentation](https://www.postgresql.org/docs/current/mvcc.html)
- [PostgreSQL autovacuum tuning guide](https://www.postgresql.org/docs/current/routine-vacuuming.html)
- [Cybertec: Understanding PostgreSQL bloat](https://www.cybertec-postgresql.com/en/what-is-table-bloat-and-how-to-fix-it/)
