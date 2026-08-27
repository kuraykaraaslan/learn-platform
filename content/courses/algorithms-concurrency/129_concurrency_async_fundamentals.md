# 129. Concurrency & Async Fundamentals — Event Loop, Promises, Race Conditions

## What It Is
JavaScript runs on a single thread, but achieves concurrency through the **event loop**: synchronous code runs to completion, then queued callbacks (I/O completions, timers) run one at a time, with microtasks (resolved promises) draining before the next macrotask. `async`/`await` is syntax sugar over promises — it doesn't create threads, it just makes the pause-and-resume points around `await` look like ordinary sequential code.

This is exactly why "single-threaded" doesn't mean "race-condition-free." If two concurrent requests each do `await read()` then `await write()`, the event loop can interleave them: request A reads, request B reads (before A's write happens), both compute based on stale data, both write, and one write silently overwrites the other's effect. The single thread guarantees no two lines run *simultaneously*, but says nothing about what happens *between* two `await`s in the same function.

`Promise.all` runs promises concurrently and fails fast on the first rejection; `Promise.allSettled` waits for all of them regardless of outcome — picking the wrong one either kills a batch job on one bad item, or silently swallows failures you needed to know about.

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
- Jake Archibald — "Tasks, microtasks, queues and schedules" (jakearchibald.com)
