# 466. Webhooks: Delivery, Retries, and Verifying What Arrived

## What It Is
**Mode: cloud.** Polling a translation manifest works and does not scale: a system watching a hundred models spends most of its rate limit asking whether anything happened. A webhook inverts it — you register a callback URL for an event, and the service posts to it when that event occurs.

The registration itself carries the shape of the whole feature. A hook names a **system** (which service's events), an **event type**, a **scope** (which folder, which project, which URN), and a **callback URL**. Narrow scopes are the point: a hook on everything is a hook you will spend more time filtering than you saved by not polling.

Delivery is where the design work is. A webhook is an HTTP POST from someone else's infrastructure to yours, and every property of that sentence causes something. It can arrive **more than once**, so the handler must be idempotent — the same argument as (#7). It can arrive **out of order**, so the payload's own sequencing, not arrival order, decides what is current. It can **fail to arrive**, so a webhook is a latency optimisation over polling and not a replacement for reconciliation. And it can be **sent by anyone who knows your URL**, so it has to be verified.

The last one deserves emphasis because it is the one people skip. A callback URL is public by construction. Anything that treats an unverified POST as authoritative has an unauthenticated write endpoint, and "the URL is hard to guess" is not authentication — it is the same reasoning (#8) already rejects.

Finally: **respond fast and process later**. The sender has a timeout, and a handler that does the work inline turns a slow database into a delivery failure and then into a retry storm. Acknowledge, enqueue, return.

*(Which systems and event types exist is a vendor list that changes. Checked 2026-09; the current catalogue is in the service documentation.)*

```quiz
- q: "Your webhook handler runs a two-second import before responding. What goes wrong?"
  anchor: "a handler that does the work inline turns a slow database into a delivery failure"
  options:
    - text: "Nothing, as long as it finishes before the timeout"
      correct: false
      why: "It works until the day the work is slower than usual, and then it produces retries of work that is already running."
    - text: "A slow run exceeds the sender's timeout, is treated as a failure, and is retried — while the first one is still going"
      correct: true
      why: "Acknowledge, enqueue, return. The work happens after the response."
    - text: "The event is lost, because a timeout means it is not redelivered"
      correct: false
      why: "The opposite: a timeout is what triggers redelivery, which is why the duplicate arrives."

- q: "Why must a webhook handler be idempotent?"
  anchor: "It can arrive **more than once**"
  options:
    - text: "Because the service may deliver the same event more than once"
      correct: true
      why: "Retries after a timeout or an error produce duplicates of an event you may have already handled — the same argument as the idempotency key pattern."
    - text: "Because events can arrive out of order"
      correct: false
      why: "That is a real and separate problem, and ordering is solved by the payload's own sequencing rather than by idempotency."
    - text: "Because the payload might be tampered with in transit"
      correct: false
      why: "Also real, also separate — that is what verification is for."
```

## Key Concepts
- **Hook registration**: a system, an event type, a scope and a callback URL
- **Narrow scopes**: a hook on everything is filtering work you took on voluntarily
- **At-least-once delivery**: the same event can arrive more than once, so the handler is idempotent (#7)
- **No ordering guarantee**: sequencing comes from the payload, not from arrival order
- **Delivery can fail entirely**: a webhook is faster than polling, not a replacement for reconciliation
- **The callback URL is public**: an unverified POST handler is an unauthenticated write endpoint (#8)
- **Respond fast, process later**: acknowledge, enqueue, return — the sender has a timeout
- **A timeout causes a retry**: so slow inline work manufactures the duplicates it then has to handle

## Example Code
The handler shape, with each of the four delivery properties answered:

```typescript
type WebhookPayload = {
  /** The service's own id for this delivery — the idempotency key. */
  hookId: string;
  eventId: string;
  eventType: string;
  /** The service's own ordering signal. Arrival order is not it. */
  occurredAt: string;
  urn: string;
};

type Store = {
  alreadyHandled: (eventId: string) => Promise<boolean>;
  markHandled: (eventId: string, occurredAt: string) => Promise<void>;
  lastSeenAt: (urn: string) => Promise<string | null>;
};

type Queue = { enqueue: (payload: WebhookPayload) => Promise<void> };

export type HandlerResult = { status: number; body: string };

/** `verify` is supplied by the caller because how a signature is computed is
 *  the vendor's business and changes; that it is checked at all is not. */
export async function handleDelivery(
  raw: string,
  signature: string | undefined,
  verify: (raw: string, signature: string) => boolean,
  store: Store,
  queue: Queue
): Promise<HandlerResult> {
  // 1. Verify before parsing. An unverified POST is an anonymous write.
  if (!signature || !verify(raw, signature)) return { status: 401, body: 'unverified' };

  const payload = JSON.parse(raw) as WebhookPayload;

  // 2. At-least-once: a duplicate is a success, not an error. Returning 4xx
  //    here would make the sender retry the delivery it already delivered.
  if (await store.alreadyHandled(payload.eventId)) return { status: 200, body: 'duplicate' };

  // 3. Out of order: an event older than what we have already applied is
  //    stale, and applying it would move the record backwards.
  const lastSeen = await store.lastSeenAt(payload.urn);
  if (lastSeen !== null && payload.occurredAt < lastSeen) {
    await store.markHandled(payload.eventId, payload.occurredAt);
    return { status: 200, body: 'stale' };
  }

  // 4. Respond fast: the work happens after the response, not inside it.
  await store.markHandled(payload.eventId, payload.occurredAt);
  await queue.enqueue(payload);
  return { status: 200, body: 'accepted' };
}
```

## When to Use
- When a workflow reacts to something happening in someone else's system, and polling for it is most of your traffic
- When translation completion, file changes or project activity should trigger work promptly
- Alongside a periodic reconciliation pass, which is what covers the deliveries that never arrive
- When designing the callback endpoint, where verification, idempotency and fast acknowledgement are all decided at once

## Common Mistakes
- **Not verifying the signature** — the URL is public by construction, so an unverified handler accepts writes from anyone who learns it
- **Doing the work inline** — the sender times out, retries, and now two copies of slow work are running
- **Returning an error for a duplicate** — the sender reads that as a failed delivery and retries it, so a duplicate becomes a loop
- **Trusting arrival order** — there is none; the payload's own timestamp or sequence decides what is current
- **Treating webhooks as complete** — deliveries can be lost entirely, so a reconciliation pass is part of the design and not a fallback
- **Registering one hook on everything** — the filtering you avoided by not polling comes back as filtering in your handler

## Further Reading
- [Webhooks overview](https://aps.autodesk.com/en/docs/webhooks/v1/developers_guide/overview/) — the hook model and the current system and event catalogue, at the index
- [RFC 9110 — HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc9110) — what a status code communicates to a retrying sender, which is the whole contract here
- [Autodesk Platform Services documentation](https://aps.autodesk.com/developer/documentation) — the service index

```recall
- q: "Name the four delivery properties a webhook handler has to answer, and how."
  must:
    - "at-least-once — the handler is idempotent, keyed on the event id"
    - "no ordering — sequencing comes from the payload, not from arrival"
    - "delivery can fail — a reconciliation pass covers what never arrives"
    - "the URL is public — verify the signature before doing anything"

- q: "Why must a handler acknowledge before doing the work?"
  must:
    - "the sender has a timeout"
    - "a slow inline handler is read as a failed delivery and retried"
    - "so the work is enqueued and the response returns immediately"

- q: "What should a handler return for a duplicate delivery, and why?"
  must:
    - "success, not an error"
    - "an error is read as a failed delivery and retried"
    - "so returning 4xx for a duplicate turns one duplicate into a loop"
```
