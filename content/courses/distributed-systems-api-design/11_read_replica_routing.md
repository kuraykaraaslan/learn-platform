# 11. Read Replica Routing in Prisma/TypeORM

## Coverage Level
**Not Covered** — Your boilerplate has a system database and tenant databases (a solid architectural split), but no read replica configuration. All reads and writes go to the same primary instance. Under load, analytical queries and reporting reads will compete with write throughput on the primary.

## What It Is
A read replica is a continuously synchronized copy of your database that accepts only `SELECT` queries. Writes go to the primary; the primary streams its write-ahead log (WAL) to replicas, which apply the changes asynchronously. The lag between a write on the primary and its visibility on the replica is called replication lag — typically milliseconds on the same cloud region, but potentially seconds under write-heavy load or cross-region replication.

The value is twofold. First, read-heavy workloads (dashboards, reports, search, analytics) are offloaded from the primary, improving write throughput and reducing contention. Second, replicas provide a live backup: in a primary failure scenario, a replica can be promoted to primary. In a multi-tenant SaaS, the "system" database (tenants, billing, users) is often the most read-heavy — session checks, permission lookups, and tenant resolution happen on nearly every request.

In Prisma (your current ORM), read replica routing requires the `@prisma/extension-read-replicas` extension (released in Prisma 5.x). It transparently routes `findMany`, `findUnique`, `findFirst`, and `count` operations to a replica client while routing mutations to the primary. You can still force a specific query to the primary when you need strong consistency (immediately after a write, for example) using `.$primary()`. In TypeORM (which you're also adding based on your git status), the `DataSource` configuration accepts a `replication` option with `master` and `slaves` arrays.

## Key Concepts
- **Replication lag**: The delay between a write on the primary and its visibility on the replica; can be milliseconds to seconds
- **Read-your-own-writes consistency**: After writing, if you immediately query the replica, you might not see your own write; use `.$primary()` for these cases
- **WAL (Write-Ahead Log)**: The mechanism PostgreSQL uses to stream changes to replicas; replicas apply WAL entries in order
- **Streaming replication**: PostgreSQL's built-in replication mechanism; replicas connect to the primary and receive WAL in real-time
- **Primary routing**: Mutations (INSERT, UPDATE, DELETE, transactions) always go to the primary
- **Replica routing**: Idempotent reads (SELECT without transaction side effects) can go to replicas
- **Sticky sessions for reads after writes**: After a mutation, subsequent reads in the same request should go to the primary to avoid reading stale data
- **Connection pool per role**: Each replica needs its own connection pool; read traffic + write traffic should not share the same pool

## Example Code
```typescript
// Prisma 5.x with @prisma/extension-read-replicas
// npm install @prisma/extension-read-replicas

import { PrismaClient } from '@prisma/client';
import { readReplicas } from '@prisma/extension-read-replicas';

// Create the extended client with a read replica
export const db = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL, // Primary (writes)
}).$extends(
  readReplicas({
    url: process.env.DATABASE_READ_REPLICA_URL, // Replica (reads)
    // For multiple replicas, pass an array:
    // url: [process.env.REPLICA_1_URL, process.env.REPLICA_2_URL],
  })
);

// ─── Usage patterns ───

// Automatically routed to replica — safe for stale-tolerant reads
async function listTenantMembers(tenantId: string) {
  return db.tenantMember.findMany({
    where: { tenantId },
    include: { user: { select: { id: true, email: true } } },
  });
}

// After a write, read from primary to avoid replication lag
async function updateAndReturnUser(userId: string, data: { displayName: string }) {
  await db.user.update({ where: { id: userId }, data });

  // Force primary read: you need to see your own write
  return db.$primary().user.findUniqueOrThrow({ where: { id: userId } });
}

// Heavy analytical query: explicitly route to replica to protect primary
async function getMonthlyActiveTenantsReport(): Promise<number> {
  const result = await db.$replica().tenantMember.count({
    where: {
      lastActiveAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });
  return result;
}

// ─── TypeORM equivalent (for your TypeORM migration) ───
// TypeORM DataSource with replication config

import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  replication: {
    master: {
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    },
    slaves: [
      {
        host: process.env.DB_READ_REPLICA_HOST,
        port: 5432,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
      },
    ],
  },
  entities: ['src/**/*.entity.ts'],
});

// In a repository, force master for a specific query:
const userRepo = AppDataSource.getRepository(User);
const queryRunner = AppDataSource.createQueryRunner('master'); // explicit
try {
  const user = await queryRunner.manager.findOneOrFail(User, { where: { id: userId } });
} finally {
  await queryRunner.release();
}
```

## When to Use
- When your primary database CPU or I/O is consistently above 50% — offloading reads to a replica is the most cost-effective scaling step before sharding
- Dashboard and reporting queries that scan large portions of the dataset — these should never run on the primary in a production SaaS
- Search and filter operations that aren't latency-critical (tenant admin views, analytics pages)
- When you need a live hot-standby for disaster recovery — your read replica doubles as a failover target

## Common Mistakes
- **Reading from replica immediately after a write in the same request**: The replica may be 50–200ms behind; always use `.$primary()` for reads that must reflect a just-completed write (e.g., return the updated record after saving it)
- **Running transactions on the replica connection**: Transactions that contain writes must go to the primary; some drivers silently route them correctly, others don't — always verify
- **Not monitoring replication lag**: Unmonitored replication lag can grow silently during write bursts; set up a `pg_stat_replication` check or a CloudWatch/Datadog metric with an alert threshold
- **Assuming one pool is enough**: The replica connection pool must be sized independently from the primary pool; read traffic patterns differ significantly from write traffic

## Further Reading
- **Prisma documentation — "Read Replicas extension"** — Official docs for `@prisma/extension-read-replicas`; covers configuration, `.$primary()`, `.$replica()`, and multi-replica round-robin
- **PostgreSQL documentation — "High Availability, Load Balancing, and Replication"** — Explains streaming replication, WAL shipping, and standby configuration at the database level
- **"Scaling PostgreSQL with Read Replicas" (Supabase blog)** — Practical guide from a PostgreSQL-as-a-service provider; covers Supabase-specific config but the concepts apply universally
