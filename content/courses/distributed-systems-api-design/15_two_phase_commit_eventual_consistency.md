# 15. Two-Phase Commit vs Eventual Consistency

## Coverage Level
**Not Covered** — Your current architecture uses single-database transactions (ACID) for most operations. As your multi-tenant setup potentially involves separate tenant databases, the practical tradeoffs between 2PC and eventual consistency haven't been addressed in any documented architectural decision.

## What It Is
When a transaction must span multiple independent databases or services, you lose the single-database ACID guarantee. Two-Phase Commit (2PC) is the protocol for achieving atomicity across multiple participants: in the **prepare** phase, a coordinator asks every participant "can you commit?" and waits for all to say yes; in the **commit** phase, the coordinator tells all participants to commit (or abort if any said no). If all participants prepared successfully, the commit is guaranteed to happen on all of them.

The problem with 2PC is its availability and latency cost. During the commit phase, if the coordinator crashes, participants are blocked in a "prepared" state — they've locked their resources and can neither commit nor abort without hearing from the coordinator. This is called the "in-doubt transaction" problem, and it can block indefinitely. In a distributed system where failures are normal, 2PC's blocking nature makes it unsuitable for high-availability use cases. Most cloud databases and ORMs don't support 2PC at all.

**Eventual consistency** is the practical alternative: accept that different parts of the system may be temporarily out of sync, and design the system to converge to a consistent state over time. The tools for this are the Saga pattern (item 3), the Outbox pattern (item 14), idempotency keys (item 7), and compensating transactions. Eventual consistency is not "eventual incorrectness" — it's a deliberate choice to trade the synchronous consistency guarantee for availability and performance, while using design patterns to ensure the system always converges to the correct state.

## Key Concepts
- **ACID transaction**: Atomic, Consistent, Isolated, Durable — guaranteed for single-database operations; the gold standard you're giving up when spanning databases
- **Two-Phase Commit (2PC)**: Coordinator + participants protocol; prepare phase + commit phase; provides atomicity at the cost of blocking on coordinator failure
- **Coordinator**: The node that drives the 2PC protocol; a single point of failure in classic 2PC
- **In-doubt transaction**: A participant in the "prepared" state waiting for a commit or abort signal that may never arrive if the coordinator crashed
- **Blocking nature of 2PC**: Participants hold locks during the commit phase; coordinator failure causes indefinite blocking — unacceptable for high-availability systems
- **Eventual consistency**: Different nodes/databases converge to the same state eventually; requires careful design (sagas, outbox, idempotency) to prevent permanent inconsistency
- **BASE**: Basically Available, Soft state, Eventual consistency — the alternative to ACID for distributed systems; AP systems are BASE systems
- **Compensating transaction**: The "undo" of an eventually consistent operation if a later step fails; forward-moving, not a rollback

## Example Code
```typescript
// Demonstrating WHY 2PC is impractical and what eventual consistency looks like instead

// ─── NAIVE (BROKEN): Dual database write without coordination ───
async function createTenantNaive(name: string, ownerId: string) {
  // Write to system database
  const tenant = await systemDb.tenant.create({ data: { name, ownerId } });

  // Write to tenant's own database — CRASH HERE = inconsistent state
  await tenantDb.settings.create({ data: { tenantId: tenant.id, key: 'initialized', value: 'true' } });

  // If the process crashes between these two lines:
  // - System DB has the tenant record ✓
  // - Tenant DB has no settings record ✗
  // The system is now permanently inconsistent with no recovery mechanism
}

// ─── WITH EVENTUAL CONSISTENCY: Outbox + Saga ───
// Step 1: Write to system DB + outbox in one transaction
async function createTenantEC(name: string, ownerId: string) {
  return systemDb.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name, ownerId, status: 'provisioning' }, // Not 'active' yet
    });

    // Outbox entry triggers the provisioning saga asynchronously
    await tx.outboxMessage.create({
      data: {
        eventType: 'TenantProvisioningStarted',
        aggregateId: tenant.id,
        payload: { tenantId: tenant.id, name, ownerId },
      },
    });

    return tenant;
  });
  // If the app crashes here, the tenant is in 'provisioning' status
  // The outbox relay will re-emit the event on restart
  // The saga handler is idempotent — safe to replay
}

// Step 2: Saga handles tenant database initialization
async function handleTenantProvisioningStarted(payload: { tenantId: string; name: string }) {
  const { tenantId } = payload;

  // Check if already provisioned (idempotency)
  const tenant = await systemDb.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  if (tenant.status === 'active') return; // Already done — idempotent

  // Initialize tenant's own DB
  await initializeTenantDatabase(tenantId);
  await seedTenantDefaults(tenantId);

  // Update system DB to reflect completion
  await systemDb.tenant.update({
    where: { id: tenantId },
    data: { status: 'active' },
  });
  // Eventual consistency: the two databases are now in sync
  // Total time from request to consistency: milliseconds to seconds
}

// ─── When 2PC IS appropriate: PostgreSQL-to-PostgreSQL with PREPARE TRANSACTION ───
// Only for on-prem or controlled infra where you manage both DBs and can handle in-doubt txns

async function transferFundsWith2PC(
  sourceDb: PoolClient,
  destDb: PoolClient,
  txId: string,
  amount: number
) {
  try {
    // Prepare phase
    await sourceDb.query(`BEGIN`);
    await sourceDb.query(`UPDATE accounts SET balance = balance - ${amount} WHERE id = 'source'`);
    await sourceDb.query(`PREPARE TRANSACTION '${txId}-source'`);

    await destDb.query(`BEGIN`);
    await destDb.query(`UPDATE accounts SET balance = balance + ${amount} WHERE id = 'dest'`);
    await destDb.query(`PREPARE TRANSACTION '${txId}-dest'`);

    // Commit phase (coordinator logs this decision durably before committing)
    await sourceDb.query(`COMMIT PREPARED '${txId}-source'`);
    await destDb.query(`COMMIT PREPARED '${txId}-dest'`);
  } catch {
    // Abort both prepared transactions
    await sourceDb.query(`ROLLBACK PREPARED '${txId}-source'`).catch(() => {});
    await destDb.query(`ROLLBACK PREPARED '${txId}-dest'`).catch(() => {});
    throw new Error('2PC failed — both transactions rolled back');
  }
}
```

## When to Use
- **2PC**: Internal, controlled multi-database transactions where both databases are PostgreSQL, you manage both, and in-doubt transaction monitoring is in place; rare in SaaS
- **Eventual consistency**: Any operation spanning your system database and a tenant database, external service calls (payment, email), or any cross-service boundary
- **Explicit saga + outbox**: Whenever you previously wrote `await a(); await b()` across different databases or services — replace with an outbox entry and a saga step
- Billing operations where both the payment charge (Stripe) and the credit allocation (your DB) must both happen — use idempotency + saga, not 2PC

## Common Mistakes
- **Assuming eventual consistency means "probably consistent"**: Eventual consistency is a guarantee of convergence, not "might or might not converge"; it requires correct implementation — idempotency, outbox, saga
- **Using 2PC in cloud/serverless environments**: Cloud databases (RDS, Aurora, PlanetScale, Supabase) often don't support `PREPARE TRANSACTION` or have it disabled; check before designing around it
- **Leaving "provisioning" status entities unmonitored**: Eventual consistency leaves entities in intermediate states; you need a monitor that alerts on entities stuck in `status = 'provisioning'` for more than N minutes
- **Not documenting the consistency model**: Saying "we use eventual consistency" without specifying the convergence mechanism and the maximum lag window leaves the next developer (you in 6 months) guessing

## Further Reading
- **"Designing Data-Intensive Applications" by Martin Kleppmann** — Chapters 7 and 9 cover transactions, 2PC, and consensus in depth; the most thorough treatment available
- **"Starbucks Does Not Use Two-Phase Commit" by Gregor Hohpe (enterpriseintegrationpatterns.com)** — A short, memorable analogy for why eventual consistency is the practical choice in real-world systems
- **"Life Beyond Distributed Transactions" by Pat Helland (Microsoft Research, 2007)** — The original paper arguing that distributed transactions don't scale and entities + messaging is the correct model; available free online
