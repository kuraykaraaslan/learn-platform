# 14. Outbox Pattern

## What It Is
The Outbox Pattern solves the dual-write problem: when you need to both commit a database transaction AND publish a message to an event bus or job queue, there is no atomic operation that guarantees both succeed or both fail. The naive `await db.save(); await queue.add(event)` sequence has a silent failure window — the DB write succeeds, the queue enqueue fails (network hiccup, Redis restart, process crash), and you've just created a ghost: a state change that no downstream system knows about.

The solution is to treat the message as data: write the message to an `outbox` table in the same database transaction as the state change. The message is now durable — it's part of your ACID transaction. A separate **outbox relay** process polls the outbox table (or is triggered by PostgreSQL's `LISTEN/NOTIFY` mechanism) and publishes unpublished messages to BullMQ or another broker. Once published and acknowledged, the relay marks the message as processed. Because the relay can crash and restart, it must retry, which means your message consumers must be idempotent.

This pattern is the foundation of reliable event-driven architectures. Without it, every `await queue.add()` outside a database transaction is a potential silent failure. With it, your state transitions and their downstream effects are guaranteed to be eventually consistent — the outbox relay ensures every committed state change eventually produces its events.

## Key Concepts
- **Dual-write problem**: Writing to two separate stores (DB + queue) is not atomic; one can fail while the other succeeds
- **Outbox table**: An `outbox` table in your database that stores pending messages; written atomically with the state change
- **Outbox relay**: A process that reads unpublished outbox entries and publishes them to the message broker
- **At-least-once delivery**: The relay publishes each message at least once; consumers must handle duplicates via idempotency keys
- **PostgreSQL `LISTEN/NOTIFY`**: A lightweight push mechanism; a trigger can `NOTIFY` a channel on outbox insert, letting the relay react immediately without polling
- **Polling vs push**: Polling (every 1s) is simpler; `LISTEN/NOTIFY` is lower latency but more complex to set up
- **Message ordering**: Outbox messages must be published in order per aggregate ID; use a sequence column and process in order
- **Dead letter handling**: If publishing fails repeatedly (BullMQ is down), the outbox message must not be silently dropped — alert and retry with backoff

## Example Code
```typescript
// Outbox pattern with PostgreSQL + BullMQ + Prisma
// Step 1: Write outbox entry in the same transaction as the state change
// Step 2: Outbox relay polls and publishes

// Prisma schema addition:
// model OutboxMessage {
//   id          String    @id @default(uuid())
//   aggregateId String    // the ID of the entity that changed
//   eventType   String    // e.g., 'TenantCreated', 'UserInvited'
//   payload     Json
//   status      String    @default("pending")  // 'pending' | 'published'
//   createdAt   DateTime  @default(now())
//   publishedAt DateTime?
//   @@index([status, createdAt])
// }

// ─── Step 1: Write state + outbox entry atomically ───
async function createTenant(
  name: string,
  ownerId: string,
  db: PrismaClient
): Promise<Tenant> {
  return db.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name, ownerId, status: 'active' },
    });

    // Outbox entry in the same transaction — atomically guaranteed
    await tx.outboxMessage.create({
      data: {
        aggregateId: tenant.id,
        eventType: 'TenantCreated',
        payload: { tenantId: tenant.id, name, ownerId },
      },
    });

    return tenant;
  });
  // If either fails, both roll back — no dual-write inconsistency
}

// ─── Step 2: Outbox relay — polls and publishes ───
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';

const eventQueue = new Queue('domain-events');

async function runOutboxRelay(db: PrismaClient) {
  // Poll every second for unpublished messages
  setInterval(async () => {
    // Fetch and lock a batch of pending messages
    await db.$transaction(async (tx) => {
      const messages = await tx.$queryRaw<OutboxMessage[]>`
        SELECT * FROM outbox_messages
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT 50
        FOR UPDATE SKIP LOCKED
      `;

      if (messages.length === 0) return;

      for (const msg of messages) {
        // Publish to BullMQ — use eventId as BullMQ job ID for deduplication
        await eventQueue.add(msg.eventType, msg.payload, {
          jobId: msg.id, // BullMQ deduplicates by jobId — safe to retry relay
        });
      }

      // Mark batch as published
      await tx.outboxMessage.updateMany({
        where: { id: { in: messages.map((m) => m.id) } },
        data: { status: 'published', publishedAt: new Date() },
      });
    });
  }, 1000);
}

// ─── PostgreSQL NOTIFY trigger for lower latency (optional) ───
// Add this trigger to your migration:
/*
CREATE OR REPLACE FUNCTION notify_outbox_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('outbox_ready', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER outbox_insert_trigger
AFTER INSERT ON outbox_messages
FOR EACH ROW EXECUTE FUNCTION notify_outbox_insert();
*/

// Then listen in Node.js (using pg directly):
// pgClient.query('LISTEN outbox_ready');
// pgClient.on('notification', () => runRelayBatch());
```

## When to Use
- Any time you emit a BullMQ job or an external event as a consequence of a database state change — the outbox pattern makes that consequence reliable
- Tenant creation / provisioning — emit provisioning events reliably, not best-effort
- Payment status changes — a Stripe webhook updates your DB and must reliably trigger downstream effects (seat adjustments, email notifications)
- Any operation in your saga orchestrator where a step completes and must trigger the next step — the outbox ensures the trigger is never lost

## Common Mistakes
- **Polling without `FOR UPDATE SKIP LOCKED`**: Multiple relay instances polling without this will pick the same rows, resulting in duplicate publishes; `SKIP LOCKED` ensures each relay instance works on a distinct subset
- **Using Redis as the outbox store**: If Redis loses data before the relay publishes, you've lost the message; the outbox must be in the same ACID database as your state
- **Not cleaning up published messages**: The outbox table grows indefinitely; add a scheduled job to delete `status = 'published'` messages older than your retention window (e.g., 7 days)
- **Publishing outside the transaction "for performance"**: The entire point of the outbox is atomic write-and-enqueue; moving the `outboxMessage.create()` outside the transaction defeats the pattern entirely

## Further Reading
- [**"Transactional Outbox Pattern" by Chris Richardson](https://microservices.io/patterns/data/transactional-outbox.html)** — The canonical definition with a clear diagram; the microservices.io pattern catalog is an excellent reference
- [**"Reliable Messaging with the Outbox Pattern" by Kamil Grzybek](https://kamilgrzybek.com)** — Detailed implementation walkthrough with .NET examples that translate well to TypeScript
- [**Debezium documentation](https://debezium.io)** — Change Data Capture tool that implements the outbox relay by reading PostgreSQL WAL directly; relevant if you want a high-throughput relay without polling
