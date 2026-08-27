# 131. Message Queues 101 — Pub/Sub and Point-to-Point Basics

## What It Is
A message queue decouples producers from consumers through a broker sitting in between: the producer doesn't need to know who (or how many) consumers exist, and the consumer doesn't need to know who produced the message or when. There are two shapes this takes. **Point-to-point (queue)** delivers each message to exactly one consumer among a pool — useful for distributing work items across workers. **Publish/subscribe (topic)** delivers each message to *every* subscriber independently — useful for fan-out, where multiple unrelated systems each need to react to the same event (an order-placed event triggering an email, an inventory update, and an analytics record, independently).

Delivery guarantees are the part that bites people in production. Most brokers offer **at-least-once** delivery by default — a message can be delivered more than once (after a consumer crash before acknowledging, for example), which means consumers must be written to tolerate duplicates (this is exactly why Idempotency Key Pattern, #7, exists). True **exactly-once** delivery is hard to achieve end-to-end and usually isn't actually guaranteed even when a broker advertises it, unless the consumer's side effect is also idempotent.

## Key Concepts
- **Point-to-point (queue)**: each message consumed by exactly one worker in a pool — for distributing work
- **Pub/sub (topic)**: each message delivered to every subscriber — for fan-out to independent systems
- **At-least-once delivery**: the realistic default; consumers must handle duplicate delivery
- **Consumer groups**: a way to have multiple independent "logical consumers" each get their own copy of a topic, while each group internally load-balances across its workers
- **Dead-letter queue (DLQ)**: where messages go after repeated processing failure, so they don't retry forever or get silently dropped
- **Backpressure**: what happens when consumers can't keep up with producers — queue depth grows, and something (rate limiting, autoscaling, or shedding) has to give

## Example Code
```typescript
// Conceptual shape: one event, fanned out to independent consumers via pub/sub
// (see #27 for a concrete BullMQ implementation, #106 for Kafka)

// Producer: doesn't know or care who's listening
const { id: orderId, userId, totalCents } = order;
await eventBus.publish("order.placed", { orderId, userId, totalCents });

// Three independent subscribers, each with its own concern and its own retry/DLQ policy
eventBus.subscribe("order.placed", "email-service", async (event) => {
  await sendOrderConfirmationEmail(event.userId, event.orderId); // must be safe to run twice
});

eventBus.subscribe("order.placed", "inventory-service", async (event) => {
  await decrementInventory(event.orderId); // needs its own idempotency key (see #7)
});

eventBus.subscribe("order.placed", "analytics-service", async (event) => {
  await recordOrderEvent(event); // least critical — safe to lose occasionally, unlike the other two
});
```

## When to Use
- Decoupling slow or unreliable work (sending email, calling a third-party API) from the request/response path
- Fan-out: one event needs to trigger several independent, unrelated side effects
- Smoothing a traffic spike — a queue absorbs a burst that would otherwise overwhelm downstream consumers directly

## Common Mistakes
- Using a queue as a database — querying/filtering message backlogs instead of writing consumed data to a proper store
- Writing consumers that assume exactly-once delivery, then silently double-processing (double-charging, double-emailing) on the inevitable redelivery
- Unbounded retry loops with no dead-letter queue, so one permanently-broken message blocks the whole queue forever
- No monitoring on queue depth/consumer lag, so backpressure only becomes visible once it's already a user-facing incident

## Further Reading
- "Designing Data-Intensive Applications" by Martin Kleppmann — chapter 11 (Stream Processing) covers this model precisely
- AWS SQS documentation — "at-least-once" and DLQ concepts, explained vendor-neutral-enough to generalize
- [RabbitMQ tutorials](https://rabbitmq.com/getstarted.html) — hands-on, covers both queue and topic exchange patterns
