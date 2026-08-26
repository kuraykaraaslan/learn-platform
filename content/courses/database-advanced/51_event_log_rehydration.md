# 51. Event Log Rehydration (Rebuilding State from Event Log)

## Coverage Level
**Not Covered** — Your audit log captures events, but there is no mechanism to reconstruct entity state by replaying those events.

## What It Is
Event log rehydration is the technique of rebuilding the current state of an entity by replaying a sequential log of all events that have ever happened to it, rather than reading a "current state" snapshot from a table. If you store every mutation as an immutable event — `UserCreated`, `EmailChanged`, `PasswordReset` — you can always reconstruct what a user looked like at any point in time by folding those events in order.

This pattern is the runtime half of Event Sourcing. You do not have to go full event-sourced to benefit from it: even a hybrid approach, where you have a normal relational table for reads but replay events for audits and debugging, gives you a powerful debugging superpower. When a customer reports "my account was changed without my knowledge," you replay their event log and see exactly what happened and when.

The relevance to your stack is direct. You have an `audit_log` module. If that log is append-only and contains structured payloads, you are one step away from full rehydration. The missing piece is an `applyEvent` reducer function that knows how to fold each event type into a state object.

## Key Concepts
- **Event** — an immutable, past-tense record of something that happened (`UserEmailChanged`, not `UpdateEmail`)
- **Aggregate** — the entity whose state you are rebuilding (e.g., `User`, `TenantSubscription`)
- **Reducer / apply function** — a pure function `(state, event) => state` that processes one event at a time
- **Snapshot** — a cached, pre-computed state at a known version to avoid replaying the entire history on every read
- **Event stream** — all events for a single aggregate, identified by an `aggregateId`
- **Version / sequence number** — monotonically increasing counter per aggregate that enables optimistic concurrency
- **Projection** — a read model built by processing events, possibly across multiple aggregate types
- **Idempotency** — replaying the same event twice must produce the same result; crucial for recovery scenarios

## Example Code
```typescript
// types/events.ts — define your domain events as a discriminated union
type UserEvent =
  | { type: 'UserCreated';      payload: { email: string; hashedPassword: string } }
  | { type: 'EmailChanged';     payload: { newEmail: string } }
  | { type: 'PasswordReset';    payload: { newHashedPassword: string } }
  | { type: 'AccountSuspended'; payload: { reason: string } }
  | { type: 'AccountRestored';  payload: Record<string, never> };

// The shape of the rehydrated aggregate
interface UserState {
  email: string;
  hashedPassword: string;
  suspended: boolean;
  suspendedReason: string | null;
  version: number;
}

// The pure reducer — this is the heart of rehydration
function applyUserEvent(state: UserState, event: UserEvent): UserState {
  switch (event.type) {
    case 'UserCreated':
      return { ...state, email: event.payload.email, hashedPassword: event.payload.hashedPassword };

    case 'EmailChanged':
      return { ...state, email: event.payload.newEmail };

    case 'PasswordReset':
      return { ...state, hashedPassword: event.payload.newHashedPassword };

    case 'AccountSuspended':
      return { ...state, suspended: true, suspendedReason: event.payload.reason };

    case 'AccountRestored':
      return { ...state, suspended: false, suspendedReason: null };

    default:
      // TypeScript exhaustiveness check — compiler will catch missing cases
      return event satisfies never, state;
  }
}

// Rehydration entry point — reads from your audit_log table
async function rehydrateUser(userId: string, upToVersion?: number): Promise<UserState> {
  const events = await db.query<{ type: string; payload: object; version: number }>(
    `SELECT type, payload, version FROM audit_log
     WHERE aggregate_id = $1 AND aggregate_type = 'User'
     ORDER BY version ASC
     ${upToVersion ? 'AND version <= $2' : ''}`,
    upToVersion ? [userId, upToVersion] : [userId],
  );

  const initial: UserState = { email: '', hashedPassword: '', suspended: false, suspendedReason: null, version: 0 };

  return events.reduce(
    (state, row) => ({ ...applyUserEvent(state, row as UserEvent), version: row.version }),
    initial,
  );
}

// Usage: rebuild state as of version 5 — useful for point-in-time debugging
const stateAtV5 = await rehydrateUser('user-uuid', 5);
```

## When to Use
1. **Point-in-time debugging** — a support request asks "what did this user's profile look like last Tuesday?" Replay up to that timestamp.
2. **Audit compliance** — regulators require a complete, tamper-evident history of all changes to sensitive records.
3. **Fixing data bugs** — if you discover a bug corrupted state between versions 30–40, you can replay events 1–29, skip the buggy ones, and continue from 41.
4. **Building new read models** — you add a new analytics table; instead of a migration, replay all historical events to populate it.
5. **Undo / rollback features** — let users revert an entity to a previous version by replaying only up to that point.

## Common Mistakes
- **Mutating events retroactively** — events are facts. Never update an existing event row. Append a corrective event instead (`EmailCorrected`).
- **Skipping version gaps** — if you allow out-of-order appends without a version check, you get corrupt state. Always enforce a `WHERE version = $expectedNextVersion` constraint on insert.
- **Not snapshotting** — an aggregate with 10,000 events is slow to rehydrate on every request. Cache a snapshot every N events and replay only the tail.
- **Fat events with derived data** — store only the minimal facts in the event payload. Computed fields belong in the projection, not the event itself.

## Further Reading
- Martin Fowler — Event Sourcing: https://martinfowler.com/eaaDev/EventSourcing.html
- Greg Young — CQRS and Event Sourcing (YouTube talk, 2010): search "Greg Young CQRS event sourcing"
- EventStoreDB documentation (dedicated event store database): https://developers.eventstore.com/
