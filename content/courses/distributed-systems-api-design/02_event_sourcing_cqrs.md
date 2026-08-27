# 2. Event Sourcing + CQRS

## What It Is
Event Sourcing is a persistence pattern where, instead of storing the current state of an entity, you store the sequence of events that led to that state. The current state is derived by replaying those events. A `UserAccount` isn't a row you UPDATE — it's the projection of events like `UserRegistered`, `EmailChanged`, `PasswordReset`, and `AccountSuspended`. The event log becomes the single source of truth, and the current-state table is a derived, disposable read model.

CQRS (Command Query Responsibility Segregation) separates the write side (commands that mutate state) from the read side (queries that return data). Without event sourcing, CQRS can be as simple as routing writes to a primary DB and reads to a replica with a custom query model. With event sourcing, CQRS becomes more powerful: you publish events from the write side and build any number of independent read models (projections) optimized for specific query patterns — one for full-text search, one for analytics, one for the main UI.

Together, they shine in domains with complex business rules, audit requirements, and the need for temporal queries ("what did this account look like on March 15th?"). They add real complexity — eventual consistency between write and read sides, event schema evolution, snapshot management — so they're not a default choice. For a multi-tenant SaaS, the billing/subscription domain is typically the first place where the audit trail benefit justifies the complexity.

## Key Concepts
- **Event**: An immutable, past-tense fact — `SubscriptionUpgraded`, not `UpgradeSubscription`
- **Event store**: An append-only log of events, keyed by aggregate ID and ordered by sequence number
- **Aggregate**: The consistency boundary; all events for one aggregate are processed serially
- **Projection**: A read model built by consuming events; can be rebuilt from scratch by replaying the event log
- **Command**: A request to change state — validated first, then produces one or more events if accepted
- **Command handler**: Validates the command against current state, writes events to the store
- **CQRS**: Separates the command model (write) from the query model (read); each is optimized independently
- **Snapshot**: A periodic checkpoint of projected state to avoid replaying thousands of events on every load

## Example Code
```typescript
// Minimal event sourcing example for a Subscription aggregate
// Uses PostgreSQL as the event store (no extra infrastructure needed to start)

// --- Types ---
type DomainEvent =
  | { type: 'SubscriptionStarted'; planId: string; startedAt: Date }
  | { type: 'SubscriptionUpgraded'; newPlanId: string; upgradedAt: Date }
  | { type: 'SubscriptionCancelled'; reason: string; cancelledAt: Date };

interface SubscriptionState {
  planId: string | null;
  status: 'active' | 'cancelled' | 'none';
}

// --- Projection: derive state from events ---
function project(events: DomainEvent[]): SubscriptionState {
  return events.reduce<SubscriptionState>(
    (state, event) => {
      switch (event.type) {
        case 'SubscriptionStarted':
          return { planId: event.planId, status: 'active' };
        case 'SubscriptionUpgraded':
          return { ...state, planId: event.newPlanId };
        case 'SubscriptionCancelled':
          return { ...state, status: 'cancelled' };
      }
    },
    { planId: null, status: 'none' }
  );
}

// --- Command handler: validate then append event ---
async function handleUpgradeSubscription(
  tenantId: string,
  newPlanId: string,
  db: PrismaClient
): Promise<void> {
  // Load all events for this aggregate
  const rows = await db.subscriptionEvent.findMany({
    where: { tenantId },
    orderBy: { sequenceNumber: 'asc' },
  });
  const events = rows.map((r) => r.payload as DomainEvent);
  const state = project(events);

  // Validate command against current state
  if (state.status !== 'active') {
    throw new Error('Cannot upgrade a non-active subscription');
  }
  if (state.planId === newPlanId) {
    throw new Error('Already on this plan');
  }

  // Append the new event — this is the only write
  await db.subscriptionEvent.create({
    data: {
      tenantId,
      sequenceNumber: rows.length, // optimistic: use DB sequence or a transaction for real use
      type: 'SubscriptionUpgraded',
      payload: { type: 'SubscriptionUpgraded', newPlanId, upgradedAt: new Date() },
    },
  });
}
// The read model (e.g., a `subscriptions` table) is updated by a separate
// projection worker that consumes new events — decoupled from the write path.
```

## When to Use
- Billing and subscription domains where "what happened and when" is a regulatory or support requirement
- Anywhere you need to reconstruct past state (audit logs, debugging, replaying events to test new business logic)
- When multiple downstream consumers need different views of the same data (search index, analytics, main UI)
- When business rules are complex enough that CRUD mutations obscure the intent — events make the domain language explicit

## Common Mistakes
- **Using it everywhere**: Event sourcing is heavyweight; a `UserPreferences` CRUD table does not need an event log
- **Mutable events**: Events must be immutable and versioned; never UPDATE an event row — only append new corrective events
- **Forgetting snapshots**: Replaying 50,000 events on every aggregate load is a performance disaster; add snapshots once event counts grow
- **Tight coupling between event producer and projection**: Projections should be independently deployable consumers; if the projection logic lives in the same transaction as the event write, you've defeated the purpose

## Further Reading
- **"Designing Data-Intensive Applications" by Martin Kleppmann** — Chapter 11 (Stream Processing) covers event sourcing and CQRS in the context of real systems
- **"Implementing Domain-Driven Design" by Vaughn Vernon** — Chapters 8 and 12 cover aggregates and event sourcing from a DDD perspective; pairs well with the pattern
- [**EventStoreDB documentation](https://eventstore.com)** — Even if you use PostgreSQL as your event store, reading the EventStoreDB docs gives you the canonical mental model of how an event log works
