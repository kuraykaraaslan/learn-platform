# 1. CAP Theorem

## What It Is
CAP Theorem states that a distributed data system can only guarantee two of three properties simultaneously: **Consistency** (every read receives the most recent write or an error), **Availability** (every request receives a non-error response, though it may not be the most recent write), and **Partition Tolerance** (the system continues operating despite arbitrary network partitions between nodes). Because network partitions are a physical reality in any distributed system, you effectively choose between CP and AP, not between all three.

The practical implication is that this isn't a single system-wide decision — it's a per-data-store, per-feature decision. Your PostgreSQL primary is CP: if the primary goes down, reads from it fail rather than serving stale data. Your Redis session cache is AP: if Redis has a partition, you might serve stale session data rather than returning an error. Knowing which tradeoff each component makes helps you reason about failure modes before they happen in production.

Where developers go wrong is treating CAP as a binary "pick two" label on the entire system. Real systems mix CP and AP across subsystems. PACELC (an extension of CAP) adds latency to the model: even when there's no partition, you trade consistency for latency. This is why read replicas introduce replication lag, and why "eventual consistency" is the honest name for what most high-availability systems actually deliver.

```quiz
- q: "\"We're a CA system — we don't really have partitions.\" What is wrong with that?"
  anchor: "Because network partitions are a physical reality in any distributed system, you effectively choose between CP and AP"
  options:
    - text: "Nothing, on a single-datacenter deployment"
      correct: false
      why: "A single datacenter lowers how often partitions happen; it does not remove them from the physical reality of a distributed system."
    - text: "Partition tolerance is not optional — the real choice is CP or AP"
      correct: true
      why: "Two of three is the theorem's framing; the practical version is which of C and A you give up when a partition arrives."
    - text: "CA is achievable, but only with synchronous replication"
      correct: false
      why: "Synchronous replication is a way of choosing CP. It does not make partitions go away."

- q: "Your PostgreSQL primary and your Redis session cache. Which is which?"
  anchor: "Your PostgreSQL primary is CP: if the primary goes down, reads from it fail rather than serving stale data"
  options:
    - text: "Both CP — they are part of the same system"
      correct: false
      why: "The tradeoff is per data store and per feature, not one system-wide decision."
    - text: "Postgres is CP; the Redis session cache is AP"
      correct: true
      why: "Postgres fails the read rather than serving stale data; Redis may serve a stale session rather than erroring."
    - text: "Postgres is AP, because replicas can still serve reads"
      correct: false
      why: "The claim is about the primary, which fails rather than serving something stale."

- q: "What does the C in CAP actually promise?"
  anchor: "every read receives the most recent write or an error"
  options:
    - text: "That stored data is never invalid or corrupted"
      correct: false
      why: "That is the C in ACID — a different property that happens to share a letter."
    - text: "Every read receives the most recent write, or an error"
      correct: true
      why: "The \"or an error\" half is what makes it a genuine tradeoff against availability."
    - text: "That every replica holds identical bytes at every instant"
      correct: false
      why: "The guarantee is about what a read observes, not about the physical state of every replica at all times."
```

## Key Concepts
- **Consistency (C)**: All nodes see the same data at the same time; a read always returns the latest committed write
- **Availability (A)**: The system always responds to requests, even if the response may be stale
- **Partition Tolerance (P)**: The system continues working when network communication between nodes is lost
- **CP systems**: Prioritize correctness over uptime — PostgreSQL primary, etcd, ZooKeeper
- **AP systems**: Prioritize uptime over correctness — Redis (with replication), Cassandra, CouchDB
- **Eventual consistency**: AP systems converge to the same state once partitions heal; "eventually" has no time bound
- **PACELC**: Extends CAP by acknowledging the latency-consistency tradeoff even during normal operation (no partition)
- **Strong vs weak consistency**: Strong = linearizability (PostgreSQL with `SERIALIZABLE`); weak = "read your own writes" or "monotonic reads"

## Example Code
```typescript
// Demonstrating CP vs AP decision points in your SaaS stack

// --- SCENARIO: User logs out ---
// You want session invalidation to be CONSISTENT (CP behavior).
// If Redis is unavailable, it's safer to fail the logout than to say
// "logged out" when the session token might still be valid.

async function logoutUserCP(sessionToken: string): Promise<void> {
  // Attempt to delete from Redis — if Redis is down, throw rather than silently succeed
  const deleted = await redis.del(`session:${sessionToken}`);
  if (deleted === 0) {
    // Token didn't exist — already logged out, idempotent
    return;
  }
  // Also invalidate in DB as source of truth
  await db.userSession.update({
    where: { token: sessionToken },
    data: { revokedAt: new Date() },
  });
}

// --- SCENARIO: Displaying user's display name in a feed ---
// Stale data here is acceptable — AP behavior is fine.
// Serve from Redis cache even if slightly behind the DB.

async function getUserDisplayNameAP(userId: string): Promise<string> {
  const cached = await redis.get(`user:display_name:${userId}`);
  if (cached) {
    return cached; // Possibly 60s stale — acceptable for a feed
  }
  // Cache miss: fetch from DB and populate cache
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  await redis.setex(`user:display_name:${userId}`, 60, user.displayName);
  return user.displayName;
}

// KEY INSIGHT: logoutUserCP uses CP (fail if cache is unavailable)
//              getUserDisplayNameAP uses AP (serve stale rather than fail)
// Document these decisions — future-you will thank present-you.
```

## When to Use
- When choosing a new data store for a feature — ask "what happens during a network partition?" before defaulting to a new Redis instance
- When designing session/auth flows — consistency failures here have security implications, not just UX ones
- When adding a read replica — you've just introduced AP behavior for reads; document which queries can tolerate replication lag
- When a production incident involves stale data — trace back to whether the system was AP and whether that was intentional
- When onboarding a collaborator — a short CAP decision record per data store prevents months of "why does this sometimes return old data?"

## Common Mistakes
- **Treating the whole system as one CAP choice**: Your PostgreSQL, Redis, and any future message broker each have their own CP/AP tradeoff — document them separately
- **Ignoring partition tolerance entirely**: "Our database is always up" is not a partition tolerance strategy; networks fail, containers restart, and cloud AZs go down
- **Confusing consistency levels**: PostgreSQL `READ COMMITTED` (the default) is not strongly consistent — dirty reads are prevented, but you can still read different values in the same transaction under certain isolation levels
- **Not considering PACELC**: Even without partitions, read replicas and caches trade consistency for latency — acknowledge this in your architecture, especially for features like billing or entitlement checks

## Further Reading
- **"Designing Data-Intensive Applications" by Martin Kleppmann** — Chapter 9 covers consistency and consensus in depth; the clearest treatment of CAP in a practical context
- **"CAP Twelve Years Later: How the Rules Have Changed" by Eric Brewer (IEEE Computer, 2012)** — The original theorem author clarifying common misinterpretations; freely available online
- **"PACELC" Wikipedia / Daniel Abadi's blog post** — Extends CAP with the latency dimension; explains why "eventual consistency" is the honest default for most cloud systems

```recall
- q: "State the three properties precisely."
  must:
    - "Consistency — every read receives the most recent write, or an error"
    - "Availability — every request receives a non-error response, though possibly not the most recent write"
    - "Partition tolerance — the system keeps operating despite arbitrary network partitions between nodes"

- q: "Why is the real choice CP or AP rather than any two of the three?"
  must:
    - "network partitions are a physical reality in any distributed system"
    - "so partition tolerance is not something you can decline"
    - "what remains is choosing which of consistency and availability to give up during a partition"

- q: "At what level is the CAP tradeoff decided, and why does that matter?"
  must:
    - "per data store and per feature, not system-wide"
    - "a Postgres primary is CP — reads fail rather than serve stale data"
    - "a Redis session cache is AP — it may serve stale session data rather than error"
    - "knowing each component's tradeoff lets you reason about failure modes before they happen in production"
```
