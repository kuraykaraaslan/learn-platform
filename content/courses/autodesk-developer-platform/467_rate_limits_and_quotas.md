# 467. Rate Limits and Quotas: Backoff Against Someone Else's API

## What It Is
**Mode: cloud.** Every hosted API limits how fast you may call it, and the limit is not yours to set, not reliably published as a number you can build against, and subject to change without your release cycle noticing.

That last part is what decides the design. A client that hard-codes "eight requests per second" is encoding a fact it does not own. When the limit moves, the client either wastes capacity it now has or hammers a limit it no longer fits — and neither shows up as a bug report, only as slowness or as a mysterious wall of rejections. **A client that discovers the limit by observing rejections does not have to know the number at all**, and the run below shows one converging on exactly the rate it was never told.

The protocol gives you two signals. A **429** says you exceeded a limit. A **`Retry-After`** header, when present, says how long to wait — and it outranks any backoff you would have computed, because the server knows something you do not. Where there is no header, the shape is exponential backoff with a cap and **jitter**: without jitter, every client rejected in the same second retries in the same second, and the recovery is a second stampede.

Two distinctions are worth keeping separate. A **rate limit** is requests per unit time and is recovered from by waiting a little. A **quota** is a total over a billing period and is not — waiting does not restore it, so the response to approaching one is to do less work, not to do it more slowly. And a **retry** is only safe on an operation that can be repeated: (#7)'s idempotency argument decides which calls may be retried at all.

*(Limits, quota units and header names are vendor values that change. Checked 2026-09; this lesson gives the mechanism, and the current numbers are in the service documentation — where they belong, because a number in a lesson is a number that rots.)*

```quiz
- q: "A response carries both a 429 and a `Retry-After: 12`. What should the client wait?"
  anchor: "it outranks any backoff you would have computed"
  options:
    - text: "Its own backoff, since 12 seconds may be conservative"
      correct: false
      why: "The server knows the window it is enforcing. Guessing shorter is how you get rejected again."
    - text: "Twelve seconds — the server's own answer beats a computed one"
      correct: true
      why: "Backoff is what you do when the server has told you nothing."
    - text: "The larger of the two, to be safe"
      correct: false
      why: "That is not safer, just slower — and it discards the one authoritative signal in the exchange."

- q: "You are approaching a monthly quota rather than a rate limit. Does backoff help?"
  anchor: "waiting does not restore it"
  options:
    - text: "Yes — slowing down keeps you under any limit"
      correct: false
      why: "A quota is a total over a period. Spreading the same total over more time still spends it."
    - text: "No — a quota is a total, so the response is to do less work rather than to do it more slowly"
      correct: true
      why: "Which is a product decision, not a client one: cache more, request fewer outputs, batch."
    - text: "Only if the quota resets on a rolling window"
      correct: false
      why: "Rolling or fixed, the total is the constraint. Waiting shifts when you spend it, not how much."
```

## Key Concepts
- **The limit is not yours** — not published as a stable number, and it changes outside your release cycle
- **Discover, do not hard-code**: a client that adapts to rejections needs no number
- **429**: the signal that a limit was exceeded
- **`Retry-After` outranks your backoff** — the server knows the window
- **Exponential backoff with a cap** — for when there is no header
- **Jitter is not optional**: without it, clients rejected together retry together
- **Rate limit vs quota**: one is recovered by waiting, the other by doing less
- **Only retry what is safe to repeat** — (#7)'s argument decides which calls those are
- **Concurrency is a limit too**: many parallel requests can breach a limit that a serial client never sees

## Example Code
Two clients against the same server, neither told anything about it:

```typescript run
// deterministically, because the real thing is someone else's server — and
// what matters is the shape of the client, not any particular quota number.

/** A token bucket, which is what a rate limiter usually is on the other side.
 *  The numbers here are the SIMULATION's, not any vendor's: the point is the
 *  client's behaviour, which has to be right without knowing them. */
class Bucket {
  private tokens: number;
  constructor(private capacity: number, private refillPerTick: number) {
    this.tokens = capacity;
  }
  tick(): void {
    this.tokens = Math.min(this.capacity, this.tokens + this.refillPerTick);
  }
  /** true = served, false = 429. */
  take(): boolean {
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

type Outcome = { tick: number; sent: number; served: number; rejected: number };

/** A client that fires everything it has, every tick. */
function greedy(ticks: number, perTick: number): Outcome[] {
  const bucket = new Bucket(20, 5);
  const out: Outcome[] = [];
  for (let t = 0; t < ticks; t++) {
    bucket.tick();
    let served = 0;
    let rejected = 0;
    for (let i = 0; i < perTick; i++) (bucket.take() ? served++ : rejected++);
    out.push({ tick: t, sent: perTick, served, rejected });
  }
  return out;
}

/** A client that halves its rate on a rejection and edges back up on success —
 *  additive increase, multiplicative decrease, the shape TCP uses. It does not
 *  know the capacity or the refill rate, and it does not need to. */
function adaptive(ticks: number, startRate: number): Outcome[] {
  const bucket = new Bucket(20, 5);
  const out: Outcome[] = [];
  let rate = startRate;
  for (let t = 0; t < ticks; t++) {
    bucket.tick();
    const sent = Math.max(1, Math.round(rate));
    let served = 0;
    let rejected = 0;
    for (let i = 0; i < sent; i++) (bucket.take() ? served++ : rejected++);
    rate = rejected > 0 ? Math.max(1, rate / 2) : rate + 0.5;
    out.push({ tick: t, sent, served, rejected });
  }
  return out;
}

function report(name: string, outcomes: Outcome[]): void {
  const sent = outcomes.reduce((a, o) => a + o.sent, 0);
  const served = outcomes.reduce((a, o) => a + o.served, 0);
  const rejected = outcomes.reduce((a, o) => a + o.rejected, 0);
  console.log(
    `${name.padEnd(10)} sent ${String(sent).padStart(4)}  served ${String(served).padStart(4)}  ` +
      `rejected ${String(rejected).padStart(4)}  wasted ${((rejected / sent) * 100).toFixed(0)}%`
  );
}

console.log('server: bucket of 20, refilling 5 per tick — the client is told none of this');
console.log('');
report('greedy', greedy(40, 12));
report('adaptive', adaptive(40, 12));
console.log('');
console.log('Both get roughly the same work done, because the server decides that. The');
console.log('difference is entirely in what the client burns to find out.');
console.log('');

// Where the adaptive client settles, which is the useful part: it converges on
// the refill rate without ever being told it.
const tail = adaptive(200, 12).slice(-20);
const settled = tail.reduce((a, o) => a + o.sent, 0) / tail.length;
console.log(`after 200 ticks the adaptive client is sending ~${settled.toFixed(1)} per tick`);
console.log('against a refill of 5 — it found the limit by observing rejections, not by');
console.log('reading a number out of documentation that can change without notice.');
console.log('');

// The one thing a simulation cannot teach and the protocol can: when the
// server tells you how long to wait, that beats any backoff you compute.
type Response = { status: number; retryAfterSeconds?: number };

function waitFor(response: Response, attempt: number): number {
  // Retry-After is the server's own answer and outranks the client's guess.
  if (response.retryAfterSeconds !== undefined) return response.retryAfterSeconds * 1000;
  // Otherwise: exponential, capped, with jitter — because without jitter every
  // client that was rejected together retries together.
  const backoff = Math.min(30_000, 500 * 2 ** attempt);
  return backoff / 2 + Math.random() * (backoff / 2);
}

console.log('delay chosen, by attempt, with no Retry-After header:');
for (const attempt of [0, 1, 2, 3, 4, 5, 6]) {
  const capped = Math.min(30_000, 500 * 2 ** attempt);
  console.log(`  attempt ${attempt}: between ${capped / 2} ms and ${capped} ms`);
}
console.log('');
console.log(`and with the server saying so: ${waitFor({ status: 429, retryAfterSeconds: 7 }, 6)} ms, whatever the attempt count`);
```

Both get roughly the same work done — the server decides that. The difference is that one of them spends more than half its requests being told no.

## When to Use
- Any integration against an API you do not run, which is all of this course's cloud half
- When a job fans out — translating many models, fetching many property documents — where concurrency is what breaches the limit
- When a workflow's cost matters, where quota is a budget line and not a technical constraint
- When designing retry policy, alongside (#4)'s circuit breaker for the case where the far side is not rate-limiting you but failing

## Common Mistakes
- **Hard-coding the documented rate** — it is a value you do not own, and when it moves the client is either wasteful or rejected
- **Ignoring `Retry-After`** — it is the only authoritative number in the exchange, and computing your own instead is guessing over knowledge
- **Backoff without jitter** — every client rejected in the same second retries in the same second, and the recovery is another stampede
- **Retrying non-idempotent calls** — a retried write that was not safe to repeat is a duplicate, which is (#7)'s subject
- **Treating a quota like a rate limit** — waiting does not give it back; the response is fewer requests, not slower ones
- **Testing against a small workload** — the limit is discovered under fan-out, so a serial test says nothing about the parallel job that hits it

## Further Reading
- [RFC 9110 — HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc9110) — status 429 and the `Retry-After` header, defined rather than described
- [Autodesk Platform Services documentation](https://aps.autodesk.com/developer/documentation) — the service index, where current limits and quota units are published
- [Model Derivative overview](https://aps.autodesk.com/en/docs/model-derivative/v2/developers_guide/overview/) — the service most likely to be fanned out against, and therefore the one that finds your limit first

```recall
- q: "Why should a client not hard-code a documented rate limit?"
  must:
    - "the limit is not yours and changes outside your release cycle"
    - "when it moves the client either wastes capacity or is rejected"
    - "a client that adapts to rejections converges on the real rate without knowing it"

- q: "Give the backoff rule in order of authority."
  must:
    - "Retry-After, when present, outranks anything you compute"
    - "otherwise exponential with a cap"
    - "and always with jitter, or clients rejected together retry together"

- q: "Distinguish a rate limit from a quota."
  must:
    - "a rate limit is requests per unit time, recovered by waiting"
    - "a quota is a total over a period — waiting does not restore it"
    - "so the response to a quota is fewer requests, not slower ones"
```
