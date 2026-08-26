# 6. Distributed Locking (Redis Redlock, DB-based)

## Coverage Level
**Not Covered** — Your boilerplate has no distributed locking mechanism. In a multi-tenant SaaS with a shared Redis instance and the possibility of multiple Node.js processes (or future horizontal scaling), concurrent operations on the same resource have no mutual exclusion guarantee.

## What It Is
A distributed lock allows multiple processes across different machines to agree that only one of them holds the lock on a given resource at a given time. This is necessary when you have multiple Node.js processes (Next.js API routes, BullMQ workers, background tasks) that may concurrently try to mutate the same shared state — provisioning a tenant, deducting credits, processing a webhook event.

In a single-process Node.js app, the event loop gives you implicit single-threading for synchronous operations. As soon as you `await`, another request can interleave. Scaling to multiple processes or servers (horizontal scaling, serverless with concurrent invocations) removes even that implicit safety. A distributed lock is the correct tool when: (1) the operation must happen exactly once, (2) it's too expensive or incorrect to replay, and (3) a database transaction cannot span the entire critical section.

**Redlock** is the Redis-based distributed locking algorithm. It acquires a lock by setting a key with a random value and a TTL (using `SET key value NX PX ttl`). The lock is released by deleting the key only if the value matches (verified atomically with a Lua script), preventing a process from releasing a lock it didn't acquire. The TTL prevents deadlocks if a process crashes while holding the lock. For critical financial operations, a **database advisory lock** (`SELECT pg_advisory_xact_lock(hashId)` in PostgreSQL) is often more appropriate — it's ACID, automatically released on transaction end, and avoids the Redlock controversy around correctness under certain Redis failure modes.

## Key Concepts
- **Mutual exclusion**: Only one process holds the lock at a time; others wait or fail fast
- **Deadlock prevention**: Lock TTL ensures the lock is always eventually released, even if the holder crashes
- **Lock fencing token**: A monotonically increasing token issued with the lock; downstream services reject requests with stale tokens — defends against "zombie" lock holders
- **NX (not exists) flag**: Redis `SET key value NX PX ttl` sets the key only if it doesn't exist — the atomic acquire operation
- **Lua script for unlock**: Atomic check-and-delete ensures you only release your own lock, not one re-acquired by another process
- **PostgreSQL advisory locks**: `pg_advisory_lock(key)` / `pg_advisory_xact_lock(key)` — database-level locks that are ACID and auto-released; prefer for operations within a DB transaction
- **Lock granularity**: Lock on the specific resource ID, not on the operation type — `lock:tenant:${tenantId}:provision` not `lock:provision`

## Example Code
```typescript
// Minimal Redis-based distributed lock (Redlock-compatible single-node)
// For multi-node Redis, use the `redlock` npm package which implements
// the full Redlock algorithm across N independent Redis nodes.

import { Redis } from 'ioredis';
import crypto from 'crypto';

interface Lock {
  key: string;
  value: string;
  release: () => Promise<void>;
}

const UNLOCK_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  else
    return 0
  end
`;

export async function acquireLock(
  redis: Redis,
  resource: string,     // e.g., `lock:tenant:${tenantId}:provision`
  ttlMs: number = 10_000
): Promise<Lock | null> {
  const key = `dlock:${resource}`;
  const value = crypto.randomUUID(); // unique per acquisition

  // SET key value NX PX ttl — atomic: only sets if key doesn't exist
  const result = await redis.set(key, value, 'NX', 'PX', ttlMs);

  if (result !== 'OK') {
    return null; // Lock is held by someone else
  }

  return {
    key,
    value,
    release: async () => {
      // Atomic: only delete if value matches (we still hold the lock)
      await redis.eval(UNLOCK_SCRIPT, 1, key, value);
    },
  };
}

// --- Usage example: tenant provisioning ---
export async function provisionTenant(tenantId: string) {
  const lock = await acquireLock(redis, `tenant:${tenantId}:provision`, 15_000);

  if (!lock) {
    throw new Error(`Tenant ${tenantId} provisioning is already in progress`);
  }

  try {
    // Critical section: only one process runs this at a time
    await createTenantSchema(tenantId);
    await seedTenantDefaults(tenantId);
    await markTenantActive(tenantId);
  } finally {
    await lock.release(); // Always release, even on error
  }
}

// --- PostgreSQL advisory lock: better for DB-scoped operations ---
// Automatically released when the transaction ends — no TTL management needed
export async function deductCreditsWithAdvisoryLock(
  db: PrismaClient,
  tenantId: string,
  amount: number
) {
  await db.$transaction(async (tx) => {
    // Hash the tenantId string to a bigint for the advisory lock key
    const lockKey = BigInt(
      parseInt(tenantId.replace(/-/g, '').slice(0, 8), 16)
    );

    // Acquire advisory lock — blocks if another transaction holds it
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

    // Now safe to read-modify-write within this transaction
    const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    if (tenant.credits < amount) throw new Error('Insufficient credits');
    await tx.tenant.update({
      where: { id: tenantId },
      data: { credits: { decrement: amount } },
    });
  }); // Advisory lock is automatically released here
}
```

## When to Use
- Tenant provisioning — creating schemas, seeding defaults; must happen exactly once
- Credit/quota deduction — read-modify-write on a counter that must not go negative
- Scheduled job coordination — ensuring only one instance of a cron job runs at a time across multiple processes
- Webhook processing — preventing duplicate processing of the same webhook event when retries cause concurrent delivery

## Common Mistakes
- **Not using a TTL on Redis locks**: A process that crashes while holding the lock will deadlock all other processes indefinitely until the key is manually deleted
- **Releasing someone else's lock**: Always use the check-and-delete Lua script; a plain `DEL key` will release a lock that another process re-acquired after your TTL expired
- **Setting TTL too short**: If the critical section takes longer than the TTL, the lock expires while you're still in it; another process acquires the lock and you have two holders — set TTL to 3–5x the expected operation duration
- **Using Redlock for very short operations**: For operations entirely within a PostgreSQL transaction, `pg_advisory_xact_lock` is simpler, safer (ACID), and has no TTL management — prefer it over Redis locks for DB-scoped critical sections

## Further Reading
- **"How to do distributed locking" by Martin Kleppmann (martin.kleppmann.com/2016/02/08)** — A critical analysis of Redlock's safety guarantees; essential reading before using it in production for high-stakes operations
- **"Distributed Locks with Redis" (redis.io/docs/manual/patterns/distributed-locks)** — The official Redis documentation on Redlock; covers the algorithm and multi-node version
- **`redlock` npm package documentation** — The standard Node.js implementation; the README explains the five-node quorum algorithm and the tradeoffs
