# 17. Database Index Strategy (Composite, Covering, Partial Index)

## What It Is
An index is a separate data structure (typically a B-tree) that PostgreSQL maintains alongside your table, allowing it to find rows matching a condition without scanning every row. Indexes trade write overhead (every INSERT/UPDATE/DELETE must update all relevant indexes) and storage for faster reads. Choosing which indexes to create — and which not to — is one of the highest-leverage performance decisions in a database-backed application.

A **composite index** is an index on multiple columns in a defined order. The leading column rule determines its usefulness: an index on `(tenant_id, created_at)` can be used for queries filtering on `tenant_id` alone, or on `(tenant_id, created_at)` together — but not for queries filtering on `created_at` alone. Column order in composite indexes mirrors column order in WHERE clauses; put the most selective column first if queries filter on it alone.

A **covering index** includes all columns needed to satisfy a query — both the filter columns and the SELECT columns — allowing PostgreSQL to return results directly from the index without touching the main table (an "index-only scan"). This eliminates the heap fetch step and can dramatically speed up read-heavy queries. A **partial index** indexes only a subset of rows matching a condition (`WHERE status = 'active'`). If 90% of your `user_sessions` rows are expired, a partial index `WHERE expires_at > now()` covers the 10% you actually query, is smaller, and is faster to maintain.

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
```typescript
// Prisma schema annotations for strategic indexes
// These translate directly to PostgreSQL CREATE INDEX statements in migrations

// ─── Example: tenant_members table ───
// Prisma schema:
/*
model TenantMember {
  id          String   @id @default(uuid())
  tenantId    String
  userId      String
  role        String   @default("member")
  status      String   @default("active")  // 'active' | 'suspended' | 'invited'
  lastActiveAt DateTime?
  createdAt   DateTime @default(now())

  // 1. Composite: most queries filter by tenantId first, then userId
  @@unique([tenantId, userId])

  // 2. Composite for listing active members sorted by activity
  @@index([tenantId, status, lastActiveAt(sort: Desc)])

  // 3. Partial index via raw SQL in migration (Prisma doesn't support partial indexes natively):
  // CREATE INDEX tenant_members_active_idx ON tenant_members(tenant_id, last_active_at DESC)
  // WHERE status = 'active';
}
*/

// ─── Adding partial and covering indexes via Prisma's raw migration ───
// In your migration SQL file (add to the migration Prisma generates):

const migrationSQL = `
-- Partial index: only active sessions (90% of rows are expired)
CREATE INDEX CONCURRENTLY user_sessions_active_idx
  ON user_sessions(tenant_id, user_id, expires_at DESC)
  WHERE expires_at > NOW();
  -- This index is much smaller than a full index on user_sessions
  -- because it excludes the vast majority of expired rows

-- Covering index: query fetches id, email, display_name filtered by tenant_id
-- The INCLUDE columns are in the index leaf but not the key — enables index-only scan
CREATE INDEX CONCURRENTLY users_tenant_listing_idx
  ON users(tenant_id, created_at DESC)
  INCLUDE (id, email, display_name, status);
  -- A SELECT id, email, display_name, status FROM users WHERE tenant_id = $1
  -- ORDER BY created_at DESC can now be answered without touching the heap

-- Composite for audit log time-range queries within a tenant
CREATE INDEX CONCURRENTLY audit_log_tenant_time_idx
  ON audit_log(tenant_id, created_at DESC, event_type);
`;

// ─── Identifying missing indexes via EXPLAIN ANALYZE ───
// Run this directly in psql or via a migration to add a helper function:

async function explainQuery(db: PrismaClient, tenantId: string) {
  // Use $queryRaw to run EXPLAIN ANALYZE on a specific query
  const plan = await db.$queryRaw`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT id, email, display_name
    FROM users
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  console.log(plan);
  // Look for "Seq Scan" on large tables — that's a missing index
  // Look for "Index Only Scan" — that means your covering index is working
  // Look for "Buffers: shared hit=X read=Y" — high "read" means cold data
}

// ─── Composite index column order decision ───
// BAD: tenantId has low cardinality in this context — put userId first if it's
// in every query and has higher selectivity
// @@index([status, tenantId, userId]) -- wrong order for WHERE tenantId = ? AND userId = ?

// GOOD: leading columns match the WHERE clause filters
// @@index([tenantId, userId, status]) -- correct for WHERE tenantId = ? AND userId = ?
```

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
- **"Use the Index, Luke" (use-the-index-luke.com)** — The best free online guide to SQL indexing; vendor-neutral, database-agnostic, and written for application developers rather than DBAs
- **"Indexing in Postgres: What You Need to Know" by Brandur Leach** — Covers Prisma + PostgreSQL indexing patterns specifically; discusses covering indexes and the cases where Prisma's auto-migration falls short
