# 106. Event Streaming — Kafka vs BullMQ: When to Choose

## What It Is
BullMQ and Kafka solve different problems. BullMQ is a job queue: you push a task, a worker picks it up, processes it, and it's gone. Kafka is an event log: you publish an event, it's durably stored in an ordered log, and any number of consumers can read it — including consumers that didn't exist when the event was published, reading from any point in history.

The distinction matters at scale and in multi-service architectures. A job queue is "do this thing once." An event log is "this thing happened — let everyone who cares know, now and in the future." If you need to replay events (reprocess orders after a bug fix, rebuild a read model, audit what happened), Kafka enables it. BullMQ does not — a processed job is gone.

For most solo SaaS products under 100K events/day, BullMQ is the right choice. Kafka adds operational complexity (brokers, ZooKeeper/KRaft, consumer group management) that pays off at scale or when you have multiple independent services consuming the same event stream.

## Key Concepts
- **Job queue (BullMQ)**: Task-oriented. One producer, one consumer (or pool). Job is removed after processing. Retry on failure. Good for: email sending, image processing, scheduled tasks.
- **Event log (Kafka)**: Event-oriented. Immutable, ordered, partitioned log. Multiple consumer groups, each with independent offset. Events retained for configured duration (days/weeks).
- **Consumer group**: A named group of consumers that share work. Each partition is assigned to one consumer in the group. Different groups get all events independently.
- **Partition**: Unit of parallelism in Kafka. Events with the same key go to the same partition, preserving order per key. More partitions = more parallelism.
- **Offset**: Each event's position in a partition. Consumers commit offsets to track progress. You can reset an offset to replay events.
- **At-least-once delivery**: The default. Events may be processed more than once on failure — your consumer must be idempotent.
- **Exactly-once semantics**: Kafka supports it with transactions + idempotent producers. Complex to implement, required for financial operations.
- **Event replay**: Reprocessing historical events. Impossible in BullMQ, trivial in Kafka (reset consumer group offset).

```tradeoff
question: "Job queue, or event log?"
sides:
  - name: "BullMQ (job queue)"
    wins_when:
      - signal: "count the events per day: under roughly 100K, the operational cost of brokers, KRaft and consumer-group management buys nothing"
      - signal: "write down who consumes each event — if the answer is one worker, then processed-and-gone is the whole requirement"
      - signal: "you cannot name a replay you have actually needed; a hypothetical replay is not yet a requirement"
  - name: "Kafka (event log)"
    wins_when:
      - signal: "name a concrete replay: reprocessing orders after a bug fix, rebuilding a read model, auditing what happened"
      - signal: "list the services reading the same stream — more than one independent consumer is what a job queue cannot serve"
      - signal: "a consumer that does not exist yet has to be able to read events published today, from any point in history"
```

## Example Code

```typescript
// BullMQ — the Redis-backed option, with the worker pattern done properly
import { Queue, Worker, Job } from 'bullmq';
import { getBullMQConnection } from '@/lib/redis/bullmq';

const connection = getBullMQConnection();

// Producer
const emailQueue = new Queue('email', { connection });

await emailQueue.add('send-welcome', {
  userId: 'u_123',
  email: 'user@example.com',
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true,
  removeOnFail: false, // keep failed jobs for inspection
});

// Consumer
const worker = new Worker('email', async (job: Job) => {
  // Must be idempotent — may run more than once on failure
  await sendEmail(job.data);
}, { connection, concurrency: 5 });

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

// ---
// Kafka — when you've outgrown BullMQ (kafkajs)
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'my-app', brokers: ['localhost:9092'] });

// Producer
const producer = kafka.producer({ idempotent: true }); // prevents duplicate events on retry
await producer.connect();
await producer.send({
  topic: 'user.registered',
  messages: [{
    key: 'u_123',           // same key → same partition → ordered per user
    value: JSON.stringify({ userId: 'u_123', email: 'user@example.com', ts: Date.now() }),
  }],
});

// Consumer group — independent from another group reading the same topic
const consumer = kafka.consumer({ groupId: 'email-service' });
await consumer.connect();
await consumer.subscribe({ topic: 'user.registered', fromBeginning: false });
await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value!.toString());
    await sendWelcomeEmail(event); // must be idempotent
  },
});
```

## When to Use
**Stay with BullMQ when:**
- Single application, one service consuming each queue
- Events don't need to be replayed
- Operational simplicity matters (no Kafka cluster to manage)
- Under ~50K jobs/day

**Move to Kafka when:**
- Multiple independent services need to react to the same event
- You need event replay (bug fixes, new consumers reading history)
- Event ordering per entity (per-user, per-tenant) is required
- You're building an audit trail that must be immutable and queryable

## Common Mistakes
- Using BullMQ as an event bus by having multiple workers on the same queue — only one worker gets each job, not all of them
- Not making Kafka consumers idempotent — at-least-once delivery is the default, duplicates happen on broker restart
- Using Kafka for simple background jobs — adds complexity with no benefit at small scale
- Not setting a retention policy on Kafka topics — default infinite retention fills disk

## Further Reading
- *Designing Data-Intensive Applications* — Martin Kleppmann: chapters 10–11 cover stream processing and the log abstraction better than anything else
- [BullMQ docs](https://docs.bullmq.io) — covers patterns, flows, and sandboxed processors
- [Confluent's Kafka tutorials](https://developer.confluent.io) — free, hands-on, producer/consumer to Kafka Streams
- [Apache Kafka documentation](https://kafka.apache.org/documentation/) — the design section explains the log abstraction the comparison above rests on
