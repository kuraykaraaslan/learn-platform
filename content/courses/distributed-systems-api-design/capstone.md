# Capstone — The Payment That Might Have Happened

## Brief
A checkout endpoint charges a card through a payment provider and then records
the order. Last week a customer was charged twice. The logs show one request,
one timeout at 30 seconds, one client retry, and two successful charges at the
provider.

Nobody wrote a bug. The request timed out *after* the provider had committed
the charge and *before* the response came back, and the retry did the only
thing it could with what it knew.

Your job is the endpoint that survives that sequence — and the harder half,
being able to state precisely which outcomes it still cannot distinguish.

## Deliverable
A design for the endpoint, written as a request flow plus the schema it needs.
It is done when it contains:

1. **The idempotency key**: who generates it, what it is scoped to, and what
   happens when the same key arrives with a different request body.
2. **The three arrivals, separately**: first arrival, retry while the first is
   still in flight, and retry after the first completed. Each one's response.
3. **The schema**, as SQL, including the constraint that makes the concurrent
   case impossible rather than unlikely.
4. **The provider call's position** relative to the transaction, and what is
   written before it, after it, and what happens if the process dies between.
5. **The ambiguous outcome**: the case where you cannot tell whether the charge
   happened. State what the endpoint returns, what it records, and what a human
   will have to do about it — because something will.

Point 5 is the exercise. The rest is a schema; that one is a decision about
what you are prepared to be wrong about.

## Rubric
Score yourself honestly against each row. Every one is a mistake this course
already documents, taken verbatim from the lesson named beside it — none of
them was invented for this exercise.

```rubric
rows:
  - lead: "Retrying non-idempotent operations"
    lesson: 4
    looks_like: "Your retry policy sits above a call that moves money and carries no key. Each attempt is a fresh charge as far as the provider is concerned, which is exactly how the customer in the brief was charged twice."
  - lead: "Catching and silencing circuit open errors"
    lesson: 4
    looks_like: "The ambiguous case — timed out, might have succeeded — is caught and turned into a clean failure response. The caller retries, the operation happens again, and nothing recorded that the first outcome was unknown rather than failed."
  - lead: "Publishing outside the transaction \"for performance\""
    lesson: 14
    looks_like: "The order row is committed and the event is published afterwards. The process can die between the two, and nothing downstream ever learns the order exists."
  - lead: "Polling without `FOR UPDATE SKIP LOCKED`"
    lesson: 14
    looks_like: "Two publisher instances read the same outbox rows and both send them. The design has an outbox but no statement about which worker owns a row while it is being published."
  - lead: "Leaving \"provisioning\" status entities unmonitored"
    lesson: 15
    looks_like: "Rows left `in_progress` because the process died mid-charge are in your schema and in nobody's queue. This is the hardest half of the deliverable: state who looks at them, how often, and what they are able to do about it."
  - lead: "Not documenting the consistency model"
    lesson: 15
    looks_like: "Your design does not say, in writing, what a caller may assume when it receives a 200 and what a 409 means instead — so every consumer assumes something different, and one of them is wrong."
```

## Reference Walkthrough
This is one correct shape, not the only one. Read it after you have scored
yourself.

**The key belongs to the caller, and it is scoped to the intent.**

The client generates it, once, for the operation it means to perform — not per
attempt, and not per customer. A retry reuses it; a second, genuinely different
charge does not. The server stores the hash of the request body beside it, so
"same key, different body" is a rejectable error rather than a silent replay of
something the caller no longer meant.

**The schema makes the concurrent case a constraint violation, not a race.**

```sql
CREATE TABLE payment_attempt (
  idempotency_key text PRIMARY KEY,
  requester_id    text        NOT NULL,
  request_hash    text        NOT NULL,
  status          text        NOT NULL DEFAULT 'in_progress',
  provider_ref    text,
  response_body   jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

**The first arrival claims the key before doing anything expensive.**

```sql
INSERT INTO payment_attempt (idempotency_key, requester_id, request_hash)
VALUES ($1, $2, $3)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING idempotency_key;
```

Zero rows returned means somebody else owns this key. That is the whole
concurrency control: no read-then-write, no advisory lock, no window. A retry
arriving while the first is still in flight gets zero rows, reads the stored
row, sees `in_progress`, and is told to retry later — a `409` with a
`Retry-After`, not a second charge.

A retry arriving after completion also gets zero rows, reads the row, sees
`succeeded`, and receives `response_body` — the *original* response, byte for
byte, with the same payment id the first caller saw.

**The provider call sits outside the transaction, and the outbox sits inside.**

The charge cannot be rolled back by a database transaction, so it must not be
inside one. The order row and the outbox row are written together, in one
transaction, after the provider returns; the publisher reads the outbox
separately. That ordering is what makes "the order exists but nothing
downstream heard about it" impossible rather than rare.

**Those three arrivals are executed, not asserted.** The run below performs
them in order against a real PostgreSQL and reports what the database returned
each time. Predict the row count of the second arrival before opening it:

```proof sha=d394993e088a182d at=2026-09-08 commit=393ce83
$ node idempotency.js
arrival 1 (first)            rows returned: 1  status: in_progress
arrival 2 (retry, in flight) rows returned: 0  -> 409, do not charge again
arrival 3 (retry, completed) rows returned: 0  status: succeeded
                             replays: {"payment_id":"pay_77","amount_cents":4200}
same key, different body     same_request: false  -> reject, not replay

rows in payment_attempt after three arrivals: 1

That is the whole concurrency control. There is no read-then-write, no
advisory lock and no window: the primary key decides which arrival owns the
operation, and the two that do not own it are told so by getting nothing back.

Note what is NOT proven here. Nothing above shows what happens when the
process dies between calling the provider and writing the result — that row
stays in_progress with no provider_ref, and no schema resolves it. The
walkthrough says so, and this run cannot say otherwise.
```

**And the part that has no clean answer.**

If the process dies between calling the provider and recording the result, the
row is left `in_progress` with no `provider_ref`. Nothing in your own system
knows whether money moved. There is no schema that removes this case; there is
only a decision about it, and the decision is:

- the endpoint returns a `409` on retry, never a `200`, because it cannot
  honestly claim success;
- a reconciliation job queries the provider by idempotency key — which is why
  the key is sent to the provider too, not just stored locally — and resolves
  the row;
- rows still `in_progress` past a stated age are surfaced to a human, with the
  customer and amount, because the alternative is a customer who was charged
  and has no order.

State that in the API documentation as what a `200` means and what it does not.
A consumer that knows "200 means the charge is recorded, and a 409 means we do
not yet know" can be built correctly. One that has to guess cannot.
