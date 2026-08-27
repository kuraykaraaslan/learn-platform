# 43. Zero-Downtime Database Migration

## What It Is
A zero-downtime database migration is a schema change applied to a live database without dropping queries, locking tables for user-visible durations, or requiring coordinated application downtime. The naive approach — stop the app, run `prisma migrate deploy`, start the app — works for small databases and solo projects but becomes operationally unacceptable as your user base grows and your database size increases. A migration that locks a table with 10 million rows can hold that lock for minutes, dropping every write to that table during that window.

The solution is the expand/contract pattern, also called multi-phase migration. Instead of changing a column in one step, you expand the schema (add the new structure), deploy the application code that writes to both old and new structures, then contract (remove the old structure) after all reads have switched to the new one. Each phase is a separate, backward-compatible schema change. This means each phase can be deployed without downtime because the database schema and the running application code are always compatible.

For your multi-tenant setup, zero-downtime migrations have an additional dimension: you are running the same migration across N tenant databases, and the migration must be idempotent (safe to run twice) because failures halfway through mean some tenants have the new schema and some do not. You need a migration tracking table per-tenant or a central migration state store, and you need rollback logic for when the migration fails on tenant N after succeeding on tenants 1 through N-1.

## Key Concepts
- **Expand/contract pattern** — Phase 1: add new columns/tables (expand). Phase 2: migrate data and update app code. Phase 3: remove old columns/tables (contract)
- **Backward-compatible migration** — A schema change the old application version can work with; enables rolling deploys where old and new app code run simultaneously
- **`NOT NULL` without default** — Adding a `NOT NULL` column without a default requires a full table rewrite in PostgreSQL; the safe approach is: add as nullable, backfill, add NOT NULL constraint
- **`pg_repack`** — Performs table rewrites and index rebuilds without exclusive locks (unlike `VACUUM FULL` or `ALTER TABLE`)
- **`CREATE INDEX CONCURRENTLY`** — Builds an index without locking the table; takes longer but allows reads and writes to proceed
- **Migration state per tenant** — For multi-tenant setups, tracking which migrations have been applied to which tenant database prevents partial-migration inconsistencies
- **Blue-green deployment** — Run two environments simultaneously; the new version with the new schema runs in green while blue serves traffic; switch traffic after green is healthy
- **Rollback plan** — Every migration phase should have a documented and tested rollback; in expand/contract, rollback is straightforward because old code still works with the expanded schema

## Example Code
```typescript
// ─── Example: Adding a NOT NULL column safely ─────────────────────────────
// Goal: Add `tenantSlug VARCHAR NOT NULL` to the tenants table
// Naive approach (BAD): ALTER TABLE tenants ADD COLUMN slug VARCHAR NOT NULL DEFAULT '';
//   This rewrites the entire table, holding an exclusive lock.

// Phase 1 — Expand: add as nullable (no lock, instant in PostgreSQL 11+)
// Migration file: 001_add_tenant_slug_nullable.sql
/*
  ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug VARCHAR;
  -- No lock required; existing rows get NULL
*/

// Phase 2 — Backfill: populate the new column for existing rows
// Run this as a background job, not in the migration itself
// migration-scripts/002_backfill_tenant_slug.ts
import { getSystemDataSource } from '@/lib/typeorm';

export async function backfillTenantSlugs(): Promise<void> {
  const ds = await getSystemDataSource();

  // Process in batches to avoid long-running transactions
  const BATCH_SIZE = 500;
  let lastId = '';
  let processed = 0;

  while (true) {
    const batch = await ds.query<{ tenantId: string; name: string }[]>(`
      SELECT tenant_id, name FROM tenants
      WHERE slug IS NULL AND tenant_id > $1
      ORDER BY tenant_id
      LIMIT $2
    `, [lastId, BATCH_SIZE]);

    if (batch.length === 0) break;

    for (const tenant of batch) {
      const slug = tenant.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      await ds.query(
        `UPDATE tenants SET slug = $1 WHERE tenant_id = $2 AND slug IS NULL`,
        [slug, tenant.tenantId]
      );
    }

    processed += batch.length;
    lastId = batch[batch.length - 1].tenantId;
    console.log(`Backfilled ${processed} tenants`);
  }
}

// Phase 3 — Contract: add NOT NULL constraint after all rows are populated
// Migration file: 003_add_tenant_slug_not_null.sql
/*
  -- First verify: should return 0 before running
  -- SELECT COUNT(*) FROM tenants WHERE slug IS NULL;

  ALTER TABLE tenants ALTER COLUMN slug SET NOT NULL;
  CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_slug ON tenants(slug);
  -- CONCURRENTLY builds the index without locking the table
*/

// ─── Multi-tenant migration runner ────────────────────────────────────────
// libs/typeorm/tenant-migrator.ts

interface TenantMigrationState {
  tenantId: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  error?: string;
  completedAt?: Date;
}

export async function runMigrationAcrossTenants(
  migrationName: string,
  migrationFn: (tenantId: string) => Promise<void>
): Promise<void> {
  const tenants = await getAllTenantIds();
  const states = new Map<string, TenantMigrationState>();

  for (const tenantId of tenants) {
    states.set(tenantId, { tenantId, status: 'pending' });
  }

  // Process tenants serially to avoid overloading the DB
  for (const tenantId of tenants) {
    states.get(tenantId)!.status = 'running';
    try {
      await migrationFn(tenantId);
      states.get(tenantId)!.status = 'done';
      states.get(tenantId)!.completedAt = new Date();
      console.log(`[Migration:${migrationName}] Tenant ${tenantId}: done`);
    } catch (err: any) {
      states.get(tenantId)!.status = 'failed';
      states.get(tenantId)!.error = err.message;
      console.error(`[Migration:${migrationName}] Tenant ${tenantId}: FAILED`, err.message);
      // Continue with other tenants; report failures at the end
    }
  }

  const failed = [...states.values()].filter(s => s.status === 'failed');
  if (failed.length > 0) {
    console.error(`Migration ${migrationName} failed for ${failed.length} tenants:`);
    failed.forEach(f => console.error(`  ${f.tenantId}: ${f.error}`));
    // Re-run is safe because migrations should be idempotent (IF NOT EXISTS, WHERE IS NULL, etc.)
    throw new Error(`Migration partially failed; re-run to complete remaining tenants`);
  }
}
```

## When to Use
- Any migration on a table larger than ~1 million rows that requires a full table rewrite (type changes, adding NOT NULL, renaming columns)
- Any migration that runs across all tenant databases — always use the idempotent, batched approach
- Before adding indexes on large tables: always use `CREATE INDEX CONCURRENTLY`
- When your deployment requires running two versions of the app simultaneously (blue-green or canary deploys)

## Common Mistakes
- **Running long migrations inside a single transaction** — Backfilling 10 million rows in one transaction holds locks for the entire duration; always process in batches with commits between them
- **`prisma migrate deploy` in production without testing on a production-size database** — A migration that takes 0.1s on development data can take 10 minutes on production; always test on a copy of production data
- **Not making migrations idempotent** — `ADD COLUMN foo` fails on the second run; always use `ADD COLUMN IF NOT EXISTS`; this is critical for multi-tenant migration runners
- **Dropping the old column in the same deploy as adding the new one** — The running app version still references the old column; drop columns only after the new version is fully deployed and the old version is no longer running

## Further Reading
- [Prisma: Production database migrations](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [Postgres: online schema changes with expand/contract (Stripe engineering)](https://stripe.com/blog/online-migrations)
- [`CREATE INDEX CONCURRENTLY` documentation](https://www.postgresql.org/docs/current/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY)
