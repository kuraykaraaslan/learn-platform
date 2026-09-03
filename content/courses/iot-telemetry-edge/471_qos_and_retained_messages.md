# 471. QoS 0/1/2 and Retained Messages: The At-Least-Once You Actually Get

## What It Is
MQTT offers three delivery qualities, and the numbers are less interesting than what each one costs and what it does not promise.

**QoS 0** is fire and forget: one transmission, no acknowledgement, no retry. The message is delivered at most once and possibly not at all, and the publisher learns nothing either way. **QoS 1** adds an acknowledgement and a retry until one arrives, giving at-least-once delivery — which means duplicates, because a lost acknowledgement is indistinguishable from a lost message. **QoS 2** adds a four-packet handshake that makes delivery exactly-once, at the cost of two round trips and per-message state on both ends.

The trap is reading QoS 2 as "the safe one" and stopping there. **The guarantee is per hop, between a client and its broker.** A publisher using QoS 2 has an exactly-once contract with the broker; what the broker does onward to each subscriber is that subscription's QoS, and what happens after the subscriber's client library hands the message to your code is not MQTT's business at all. A message delivered exactly once and then processed twice because your handler crashed after acting and before acknowledging is a duplicate MQTT cannot see.

So the honest position is that **you build for at-least-once regardless**, which is Lesson 475's subject, and choose QoS on cost rather than on correctness. On a constrained radio link QoS 2's extra round trips can be more expensive than the deduplication they would save.

**Retained messages** are the other half of this lesson and answer a different question: what does a subscriber see when it connects *between* publications? A retained message is the last value on a topic, held by the broker and delivered immediately on subscribe. Without one, a dashboard that connects at 09:05 sees nothing until the next reading. With one, it sees the 09:00 value straight away — and must be able to tell that it is old, which is why the payload carries its own timestamp rather than relying on arrival.

The **Last Will and Testament** completes the picture: a message the client registers at connect time for the broker to publish if the connection drops without a clean disconnect. It is how a fleet notices a device is gone without polling for it.

```quiz
- q: "A publisher uses QoS 2. Can the subscriber's handler still run twice for one reading?"
  anchor: "The guarantee is per hop, between a client and its broker"
  options:
    - text: "No — exactly-once means exactly once, end to end"
      correct: false
      why: "The contract is between a client and its broker. It says nothing about the subscriber's own subscription QoS, or about what happens inside the handler."
    - text: "Yes — the guarantee is per hop, and processing is outside MQTT entirely"
      correct: true
      why: "A handler that acts and then crashes before acknowledging will see the message again."
    - text: "Only if the subscriber uses QoS 0"
      correct: false
      why: "QoS 0 loses messages rather than duplicating them. The duplication risk is in the handler."

- q: "A dashboard connects at 09:05 and the device reports every ten minutes. What does a retained message change?"
  anchor: "the last value on a topic, held by the broker and delivered immediately on subscribe"
  options:
    - text: "Nothing — retained messages are for reliability, not for new subscribers"
      correct: false
      why: "That is exactly what they are for: the last value on the topic, delivered on subscribe."
    - text: "The dashboard sees the 09:00 value immediately instead of waiting until 09:10"
      correct: true
      why: "And it must be able to tell that value is five minutes old, which is why the payload carries its own timestamp."
    - text: "The broker replays every message since 09:00"
      correct: false
      why: "One message per topic is retained — the last. MQTT is not a log."
```

## Key Concepts
- **QoS 0**: at most once — one transmission, no acknowledgement, cheapest
- **QoS 1**: at least once — retried until acknowledged, therefore duplicates
- **QoS 2**: exactly once — a four-packet handshake, two round trips, state on both ends
- **The guarantee is per hop**: publisher-to-broker and broker-to-subscriber are separate contracts
- **Processing is outside all of it**: a handler that crashes after acting sees the message again
- **Build for at-least-once regardless** and choose QoS on cost (Lesson 475)
- **Retained message**: the last value on a topic, delivered on subscribe — one per topic, not a log
- **Last Will and Testament**: a message the broker publishes when a client disconnects uncleanly
- **Clean session versus persistent session**: whether the broker keeps a subscriber's queue while it is away, which decides what a reconnecting client receives

## Example Code
There is no runtime here: every one of these behaviours is a property of a broker connection, and a page cannot honestly simulate one. What is worth writing down is the decision, which is a table rather than a code path:

```text
                       QoS 0        QoS 1              QoS 2
packets per message    1            2                  4
duplicates possible    no           yes                no (per hop)
loss possible          yes          no (per hop)       no (per hop)
broker state           none         until acked        per-message, both ends
good for               dense,       readings that      commands that must not
                       cheap        must all arrive    repeat
                       readings
```

```typescript
/** The publish decision, written as a function so it is somewhere rather than
 *  scattered. Note that nothing here chooses QoS 2 for a reading: readings are
 *  deduplicated at ingest, and the extra round trips buy nothing that
 *  Lesson 475's unique constraint does not already provide. */
type Message =
  | { kind: 'reading'; metric: string; everySeconds: number }
  | { kind: 'state'; metric: string }
  | { kind: 'command'; idempotent: boolean };

export type PublishOptions = { qos: 0 | 1 | 2; retain: boolean };

export function publishOptions(message: Message): PublishOptions {
  switch (message.kind) {
    // A reading arriving twice is handled by the ingest; a reading arriving
    // every second makes QoS 1's acknowledgement traffic the dominant cost.
    case 'reading':
      return { qos: message.everySeconds < 10 ? 0 : 1, retain: false };
    // State is retained: a subscriber connecting later needs the current
    // value, not the next change to it.
    case 'state':
      return { qos: 1, retain: true };
    // The only case where the extra round trips earn their keep — and only
    // when the receiver cannot make the operation idempotent itself.
    case 'command':
      return { qos: message.idempotent ? 1 : 2, retain: false };
  }
}
```

## When to Use
- QoS 0: dense readings where the next one is along shortly and the loss of one is not material
- QoS 1: readings that must all arrive, with deduplication at the ingest doing the rest
- QoS 2: commands that must not repeat and cannot be made idempotent, where two round trips are affordable
- Retained: any topic representing current state — a mode, a setpoint, a device's last known reading
- Last Will: any fleet where a device going quiet should be noticed without polling

## Common Mistakes
- **Reading QoS 2 as end-to-end** — it is a per-hop contract, and the subscriber's own QoS and handler are separate problems
- **Skipping deduplication because QoS 2 is on** — the handler can still run twice, and the ingest is where that is cheap to fix
- **Using QoS 2 for high-rate readings** — four packets per message on a constrained link, to avoid duplicates a unique constraint would have dropped for free
- **Treating retained messages as history** — one message per topic is retained; a client wanting the last hour needs a store, not a broker
- **Rendering a retained value as current** — it can be arbitrarily old, which is why the payload carries its own timestamp
- **Forgetting the Last Will topic in the subscription plan** — a will nobody subscribes to is a message the broker publishes into the void

## Further Reading
- [MQTT 5.0 specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html) — sections 4.3 (quality of service) and 3.3.1 (retain), including the exact per-hop wording
- [MQTT 3.1.1 specification](https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html) — the version much deployed hardware speaks; the QoS semantics are the same and the session handling differs
- [PostgreSQL INSERT](https://www.postgresql.org/docs/current/sql-insert.html) — `ON CONFLICT`, which is where the duplicates QoS does not prevent are actually handled

```recall
- q: "Give the three qualities of service and what each costs."
  must:
    - "QoS 0 — at most once, one packet, no acknowledgement"
    - "QoS 1 — at least once, retried until acknowledged, so duplicates"
    - "QoS 2 — exactly once per hop, four packets, state on both ends"

- q: "Why does QoS 2 not remove the need for deduplication?"
  must:
    - "the guarantee is per hop, between a client and its broker"
    - "the subscriber's own subscription QoS is a separate contract"
    - "and a handler that acts then crashes before acknowledging sees the message again"

- q: "What problem does a retained message solve, and what is its limit?"
  must:
    - "a subscriber connecting between publications sees the last value immediately"
    - "one message per topic is retained — it is not a history"
    - "and it can be arbitrarily old, so the payload must carry its own timestamp"
```
