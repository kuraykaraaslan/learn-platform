# 129. Concurrency & Async Fundamentals — Event Loop, Promises, Race Conditions

## What It Is
JavaScript runs on a single thread, but achieves concurrency through the **event loop**: synchronous code runs to completion, then queued callbacks (I/O completions, timers) run one at a time, with microtasks (resolved promises) draining before the next macrotask. `async`/`await` is syntax sugar over promises — it doesn't create threads, it just makes the pause-and-resume points around `await` look like ordinary sequential code.

This is exactly why "single-threaded" doesn't mean "race-condition-free." If two concurrent requests each do `await read()` then `await write()`, the event loop can interleave them: request A reads, request B reads (before A's write happens), both compute based on stale data, both write, and one write silently overwrites the other's effect. The single thread guarantees no two lines run *simultaneously*, but says nothing about what happens *between* two `await`s in the same function.

`Promise.all` runs promises concurrently and fails fast on the first rejection; `Promise.allSettled` waits for all of them regardless of outcome — picking the wrong one either kills a batch job on one bad item, or silently swallows failures you needed to know about.


```quiz
- q: "Two concurrent calls to the same async function each read a balance, then write it back. JavaScript is single-threaded \u2014 can they still corrupt each other?"
  anchor: "says nothing about what happens *between* two `await`s in the same function"
  options:
    - text: "No \u2014 single-threaded execution means one line runs at a time, so the read and the write happen together"
      correct: false
      why: "Single-threading guarantees no two lines run simultaneously, but it says nothing about what happens between two awaits in the same function \u2014 and that gap is exactly where the other call gets to run."
    - text: "Yes \u2014 the event loop can run the second call's read before the first call's write lands"
      correct: true
      why: "That is the whole race: both calls read the same stale value across their own await, both compute from it, and the second write silently overwrites the first."
    - text: "Only if the code uses worker_threads"
      correct: false
      why: "worker_threads is the escape hatch for CPU-bound parallelism. This race needs no threads at all \u2014 two await points around shared state are enough."

- q: "You are sending 500 welcome emails and need to know exactly which ones failed. Promise.all or Promise.allSettled?"
  anchor: "fails fast on the first rejection"
  options:
    - text: "Promise.all \u2014 it rejects with the first error, which tells you what went wrong"
      correct: false
      why: "Promise.all fails fast on the first rejection, so the other 499 outcomes are thrown away. You learn that something failed, not which ones."
    - text: "Promise.allSettled \u2014 it waits for every outcome regardless of the others"
      correct: true
      why: "allSettled reports every result, so you can filter the rejected ones. That is the reporting requirement the question states."
    - text: "Either one \u2014 they differ only in performance"
      correct: false
      why: "They differ in semantics, not speed. Picking the wrong one either kills a batch job on one bad item or silently swallows failures you needed to see."
```

## Key Concepts
- **Call stack, task queue, microtask queue**: sync code runs first, then microtasks (promise callbacks) drain fully, then one macrotask (timer/I/O callback) runs, repeat
- **`async`/`await`**: sugar over `.then()` chains — the function pauses at `await` and resumes later without blocking the thread
- **Race condition despite single-threading**: interleaved `await` points between reading and writing shared state
- **`Promise.all` vs `Promise.allSettled`**: fail-fast on first rejection vs wait for every outcome
- **`worker_threads`**: Node's actual escape hatch for CPU-bound parallelism — a real OS thread, not the event loop

## Example Code
```typescript
// A race condition despite JS being single-threaded: two concurrent calls interleave
// between the read and the write.
let balance = 100;

async function withdraw(amount: number) {
  const current = await readBalanceFromDb();      // <-- await yields control here
  if (current < amount) throw new Error("insufficient funds");
  await writeBalanceToDb(current - amount);        // both calls can read the SAME `current`
}

// Fix: make the check-and-write atomic at the database level (also see #6 Distributed Locking)
async function withdrawSafely(userId: string, amount: number) {
  const result = await db.$executeRaw`
    UPDATE accounts SET balance = balance - ${amount}
    WHERE user_id = ${userId} AND balance >= ${amount}
  `;
  if (result === 0) throw new Error("insufficient funds");
}

// Promise.all fails fast; allSettled reports every outcome — pick deliberately
const results = await Promise.allSettled(userIds.map((id) => sendWelcomeEmail(id)));
const failed = results.filter((r) => r.status === "rejected");
```

The `withdraw` shape above, run for real: two concurrent calls each withdrawing 60 from an opening balance of 100, then the same pair against an atomic compare-and-set. Predict both final balances before revealing them — is the naive one lower than the safe one?

```proof sha=4742acde7e6baef4 at=2026-09-02 commit=9614387
$ bash run.sh
$ node race.js
--- naive read-then-write: two concurrent withdrawals of 60 from 100 ---
A: read  balance=100
B: read  balance=100
A: write balance=40
B: write balance=40
A: withdrew 60
B: withdrew 60
final balance: 40
120 was withdrawn from an opening balance of 100, and neither call failed

--- atomic compare-and-set, same two concurrent withdrawals ---
A: withdrew 60
B: refused (insufficient funds)
final balance: 40
```

## When to Use
- Any code with more than one `await` touching shared state (a balance, a counter, an inventory count) — assume interleaving is possible
- Independent async operations with no shared state — run them with `Promise.all` instead of sequential `await`s to cut latency
- Batch operations where partial failure is expected and must be reported — use `Promise.allSettled`, not `Promise.all`

## Common Mistakes
- Assuming single-threaded execution means no race conditions — it only means no two lines run *simultaneously*, not that state is safe across an `await`
- Unhandled promise rejections from a fire-and-forget async call with no `.catch`
- Sequential `await`s for independent operations, adding latency that `Promise.all` would have avoided
- Blocking the event loop with synchronous CPU-heavy work (e.g. a large synchronous JSON parse or regex) instead of offloading to `worker_threads`

## Further Reading
- Philip Roberts — "What the heck is the event loop anyway?" (JSConf talk, still the clearest visual explanation)
- Node.js official docs — "The Node.js Event Loop, Timers, and process.nextTick()"
- [Jake Archibald — "Tasks, microtasks, queues and schedules"](https://jakearchibald.com)

```recall
- q: "Walk through how two concurrent withdrawals can overdraw a single-threaded account."
  must:
    - "both calls await the read before either write happens"
    - "each reads the same starting balance and passes its own sufficient-funds check"
    - "each writes starting balance minus its own amount, so the second write overwrites the first"
    - "the total withdrawn exceeds the balance and neither call reports an error"

- q: "What does JavaScript's single thread actually guarantee, and what does it not?"
  must:
    - "it guarantees no two lines run simultaneously"
    - "it does not guarantee state is unchanged across an await"
    - "any function with two awaits touching shared state can interleave with another call"

- q: "How do you actually fix the interleaving, and why does that work?"
  must:
    - "make the check and the write one atomic operation at the database level"
    - "a conditional UPDATE that both decrements and enforces the balance condition"
    - "there is no read-then-write gap left for another call to slip into"
```
