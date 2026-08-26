# 42. Optimistic vs Pessimistic Locking in Prisma/TypeORM

## Coverage Level
**Not Covered** — Your services perform read-then-write patterns (check seat count, then add member; check subscription, then activate feature) without explicit locking. In single-instance development this is unnoticeable, but concurrent requests in production can create race conditions that violate business invariants like seat limits, coupon usage caps, and unique resource constraints.

## What It Is
A race condition in database operations occurs when two concurrent transactions both read the same state, both decide it is safe to proceed, and both write — resulting in a state that neither transaction would have allowed individually. The classic example is a seat limit check: transaction A reads "4 of 5 seats used", transaction B reads "4 of 5 seats used", both see room for one more, and both add a member. You now have 6 members against a limit of 5.

Optimistic locking assumes conflicts are rare and detects them at write time. The pattern: add a `version` column to the row; read the row including its version; when writing, add `WHERE version = $readVersion` to the UPDATE; if zero rows are updated, a conflict occurred and the caller must retry. This adds no lock contention — reads and writes proceed without blocking each other. The downside is that you must handle the conflict response (retry logic) and the pattern only works for UPDATE operations on a single row.

Pessimistic locking acquires a database-level lock at read time: `SELECT FOR UPDATE` (or `FOR SHARE`) holds a row lock until the transaction commits. Any concurrent transaction that tries to select the same row for update will wait. This guarantees that the state you read is the state you write to — no other transaction can change it between your read and your write. The downside is reduced concurrency: transactions queue up behind each other, and a slow transaction holds the lock for longer.

For your SaaS, pessimistic locking is the safer default for low-frequency high-stakes operations (adding a member, activating a subscription, consuming a coupon). Optimistic locking is better for high-frequency operations where conflicts are rare and retries are cheap.

## Key Concepts
- **Race condition** — Two concurrent transactions both read the same state and both proceed to write, producing an inconsistent final state
- **Optimistic locking** — Version column on the row; conflict detected at write time via `WHERE version = $n`; no blocking, requires retry logic
- **Pessimistic locking** — `SELECT FOR UPDATE` acquires a row lock at read time; guarantees exclusive access until transaction commits
- **`FOR UPDATE SKIP LOCKED`** — PostgreSQL extension: skip rows that are already locked rather than waiting; used for job queue-style processing
- **`FOR SHARE`** — Shared lock: allows other readers to also acquire `FOR SHARE`, but blocks `FOR UPDATE`; useful for read-heavy operations that must not be modified
- **Deadlock** — Two transactions each waiting for a lock held by the other; PostgreSQL detects and aborts one; prevent by always acquiring locks in the same order
- **Retry with backoff** — Optimistic lock conflicts should be retried with exponential backoff; too-aggressive retry can amplify contention
- **Version column** — An `INTEGER` or `TIMESTAMP` field incremented on every update; serves as the conflict detection token

## Example Code
```typescript
// ─── Optimistic locking in TypeORM ────────────────────────────────────────

import { Entity, Column, VersionColumn, Repository } from 'typeorm';

@Entity('tenant_subscriptions')
export class TenantSubscription {
  @Column()
  tenantId!: string;

  @Column()
  seatLimit!: number;

  @Column()
  seatUsed!: number;

  // TypeORM manages this automatically — increments on every save()
  @VersionColumn()
  version!: number;
}

export async function addSeatOptimistic(
  repo: Repository<TenantSubscription>,
  tenantId: string,
  maxRetries = 3
): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const sub = await repo.findOneOrFail({ where: { tenantId } });

    if (sub.seatUsed >= sub.seatLimit) {
      throw new Error('Seat limit reached');
    }

    sub.seatUsed += 1;

    try {
      // TypeORM adds WHERE version = $currentVersion automatically
      // If another request updated seatUsed first, this throws OptimisticLockVersionMismatchError
      await repo.save(sub);
      return; // success
    } catch (err: any) {
      if (err.name === 'OptimisticLockVersionMismatchError' && attempt < maxRetries - 1) {
        // Exponential backoff before retry
        await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, attempt)));
        continue;
      }
      throw err; // exceeded retries or different error
    }
  }
}

// ─── Pessimistic locking in TypeORM ───────────────────────────────────────

import { DataSource } from 'typeorm';

export async function addSeatPessimistic(
  dataSource: DataSource,
  tenantId: string
): Promise<void> {
  await dataSource.transaction(async (manager) => {
    // SELECT ... FOR UPDATE — acquires exclusive row lock
    // Any other transaction attempting FOR UPDATE on this row will wait here
    const sub = await manager
      .getRepository(TenantSubscription)
      .findOne({
        where: { tenantId },
        lock: { mode: 'pessimistic_write' }, // SELECT FOR UPDATE
      });

    if (!sub) throw new Error('Subscription not found');
    if (sub.seatUsed >= sub.seatLimit) throw new Error('Seat limit reached');

    sub.seatUsed += 1;
    await manager.save(sub);
    // Lock is released when the transaction commits here
  });
  // No retry needed — the lock guarantees only one transaction proceeds at a time
}

// ─── Pessimistic locking in Prisma ────────────────────────────────────────
// Prisma does not have a built-in pessimistic lock API; use $queryRaw

async function addSeatPessimisticPrisma(
  prisma: PrismaClient,
  tenantId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Manual SELECT FOR UPDATE via raw query
    const [sub] = await tx.$queryRaw<TenantSubscription[]>`
      SELECT * FROM tenant_subscriptions
      WHERE tenant_id = ${tenantId}
      FOR UPDATE
    `;

    if (!sub) throw new Error('Not found');
    if (sub.seatUsed >= sub.seatLimit) throw new Error('Seat limit reached');

    await tx.$executeRaw`
      UPDATE tenant_subscriptions
      SET seat_used = seat_used + 1
      WHERE tenant_id = ${tenantId}
    `;
  });
}

// ─── FOR SKIP LOCKED — job queue pattern ──────────────────────────────────
// "Give me one row that no one else is processing right now"
const [job] = await dataSource.query(`
  SELECT * FROM pending_jobs
  WHERE status = 'pending'
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED
`);
// If multiple workers run this concurrently, each gets a different row
```

## When to Use
- **Pessimistic locking** — Seat limit enforcement, coupon redemption, plan activation, any operation where you read a numeric constraint and then update it
- **Optimistic locking** — Updating user profile fields, saving document content, any update where the read and write are on the same row and conflicts are rare
- **No locking** — Appending to audit logs, creating new records, read-only queries — locking adds overhead for operations that are not subject to race conditions
- **`FOR SKIP LOCKED`** — Processing jobs from a queue table, running scheduled tasks, any worker pattern where multiple processes should claim non-overlapping work

## Common Mistakes
- **Optimistic locking without retry logic** — An `OptimisticLockVersionMismatchError` that surfaces as a 500 error to the user is worse than no locking; always handle the conflict and retry
- **Pessimistic locking outside a transaction** — `SELECT FOR UPDATE` outside a transaction releases the lock immediately; the lock must be held for the duration of the read-modify-write sequence
- **Long transactions with pessimistic locks** — A transaction that holds a `FOR UPDATE` lock while calling an external API (Stripe, email) blocks all other writers for the duration of that API call; do external calls outside the transaction
- **Not locking in the same order across transactions** — If transaction A locks row X then row Y, and transaction B locks row Y then row X, you have a potential deadlock; standardize lock acquisition order

## Further Reading
- [TypeORM locking documentation](https://typeorm.io/select-query-builder#lock-optimistic-and-pessimistic-locking)
- [PostgreSQL explicit locking documentation](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Martin Fowler: Optimistic Offline Lock pattern](https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html)
