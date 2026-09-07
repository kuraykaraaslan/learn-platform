# 544. Shared State: `volatile` Is Not Atomic, and the Torn Read

## What It Is
The moment a handler and the loop touch the same variable, two questions appear that application code rarely has to separate. The first is **visibility**: will the loop notice that the handler changed it? The second is **atomicity**: can the loop see a value that was never actually stored? They have different causes and different fixes, and `volatile` answers only the first one.

`volatile` is an instruction to the compiler: do not cache this object in a register, do not elide reads of it, do not reorder its accesses relative to other volatile accesses. That is exactly what a flag set by a handler needs, and it is why a non-volatile flag polled in a loop can be read once and then never again — the compiler proved nothing in the loop changes it, and the compiler was right about the code it could see. But `volatile` says nothing about how many instructions a load takes, and **a keyword the compiler honours cannot make the hardware's bus wider than it is**.

That is where **tearing** comes from. A 32-bit counter on a core that moves 16 bits at a time is read in two instructions, and an interrupt can land between them. The loop then combines a high half from before the increment with a low half from after it — or the reverse — and gets a number that was never in the variable at any instant. The classic symptom is a timer that occasionally jumps by 65,536, or a byte count that briefly goes backwards; the classic misdiagnosis is a hardware fault.

There are three honest fixes and they are not interchangeable. **Keep the shared object no wider than the core's atomic access** — a `uint8_t` flag on any core, a 32-bit word on a 32-bit core — and the tear cannot occur. **Disable interrupts around the read**, which is correct but blocks the very handler whose latency you were protecting, so it must be short enough to state in instructions. Or **read until stable**: read, read again, and accept the value only when two consecutive reads agree, which needs no critical section but assumes the writer is slower than the reader. The choice is a trade, and pretending `volatile` made it for you is the mistake this lesson exists to prevent.

One more thing `volatile` does not do, because it is the bug that survives every review: **it is not a memory barrier for non-volatile data**. Marking a flag volatile does not guarantee that the buffer the flag describes was written before the flag was set — on a core that reorders, or a compiler that reorders the non-volatile store, the reader can see the flag first. That ordering problem, and its one correct lock-free shape, is Lesson 545.

```quiz
- q: "A 32-bit tick counter is incremented by a timer handler and read by the loop, and it is declared `volatile`. What can still go wrong?"
  anchor: "a number that was never in the variable at any instant"
  options:
    - text: "Nothing — `volatile` makes the access atomic"
      correct: false
      why: "It controls what the compiler may optimize, not how many bus cycles a 32-bit load takes."
    - text: "On a core that reads it in two halves, an interrupt between them yields a combination of old and new halves"
      correct: true
      why: "The loop sees a value that never existed, typically off by exactly one half's worth."
    - text: "The loop may read a stale value forever because the compiler cached it"
      correct: false
      why: "That is the failure `volatile` does prevent."

- q: "Which fix removes tearing without ever disabling interrupts?"
  anchor: "read until stable"
  options:
    - text: "Declaring both the reader's and the writer's copies `volatile`"
      correct: false
      why: "Two volatile objects still tear individually. The keyword is orthogonal to width."
    - text: "Reading twice and accepting the value only when two consecutive reads agree"
      correct: true
      why: "It costs an extra read and assumes the writer is slower than the reader, but it holds off nothing."
    - text: "Making the variable `static`"
      correct: false
      why: "Storage class has nothing to do with how many instructions the load takes."

- q: "Why is `volatile` on a flag not enough to publish a buffer the flag describes?"
  anchor: "it is not a memory barrier for non-volatile data"
  options:
    - text: "Because the buffer must be volatile too, and then it is safe"
      correct: false
      why: "Making the whole buffer volatile costs every optimization and still does not order the two stores on a reordering core."
    - text: "Because nothing orders the non-volatile buffer writes against the volatile flag write — the reader can see the flag first"
      correct: true
      why: "Ordering is a separate guarantee, and Lesson 545 is the shape that gets it right."
    - text: "Because flags cannot be shared between contexts at all"
      correct: false
      why: "A single-byte flag is the standard interface; the problem is what it claims about other memory."
```

## Key Concepts
- **Two separate questions**: visibility (will the reader notice?) and atomicity (can the reader see a value that never existed?)
- **`volatile` answers visibility only** — no caching in a register, no elided reads, no reordering against other volatile accesses
- **Tearing** happens when an object is wider than the core's atomic access and a handler lands mid-read
- **Symptom**: a counter that jumps by exactly one half's worth, or briefly goes backwards — commonly misdiagnosed as hardware
- **Fix 1 — narrow the object** to something the core reads in one access; the tear becomes impossible
- **Fix 2 — a critical section**, correct but it delays the handler whose latency you were protecting
- **Fix 3 — read until stable**, no critical section, but it assumes the writer is slower than the reader
- **`volatile` is not a memory barrier for non-volatile data** — the flag can be observed before the buffer it describes (Lesson 545)

## Example Code
The tear, counted rather than described. The model is a 32-bit counter on a core that moves 16 bits per access — the same shape as an 8-bit core with a 16-bit counter, or any core with a value wider than its word:

```typescript run
/** A 16-bit-wide machine holding a 32-bit counter. The loop must read it in
 *  two accesses; the timer handler may increment between them. Nothing here
 *  is random: every preemption point is enumerated. */
const HALF = 0x10000;

type Machine = { hi: number; lo: number };

const load = (m: Machine): number => m.hi * HALF + m.lo;

function increment(m: Machine): void {
  m.lo = (m.lo + 1) % HALF;
  if (m.lo === 0) m.hi = m.hi + 1; // the carry: the only time hi changes
}

/** The loop's naive read: high half, then low half, with the handler
 *  possibly firing in between. */
function naiveRead(m: Machine, interruptBetweenHalves: boolean): number {
  const hi = m.hi;
  if (interruptBetweenHalves) increment(m);
  const lo = m.lo;
  return hi * HALF + lo;
}

/** Read until two consecutive reads agree. */
function stableRead(m: Machine, interruptsRemaining: number): number {
  let remaining = interruptsRemaining;
  let previous = naiveRead(m, remaining-- > 0);
  for (let attempt = 0; attempt < 4; attempt++) {
    const next = naiveRead(m, remaining-- > 0);
    if (next === previous) return next;
    previous = next;
  }
  return previous;
}

// Counters at, just before, and well away from a carry boundary.
const starts = [0x0000_FFFE, 0x0000_FFFF, 0x0001_0000, 0x0002_ABCD];

console.log('naive two-access read, with and without an interrupt in the gap:');
console.log('  counter      no interrupt   interrupt in gap   error');
let torn = 0;
for (const start of starts) {
  const quiet: Machine = { hi: Math.floor(start / HALF), lo: start % HALF };
  const busy: Machine = { hi: Math.floor(start / HALF), lo: start % HALF };
  const a = naiveRead(quiet, false);
  const b = naiveRead(busy, true);
  const truth = load(busy); // what the counter actually holds afterwards
  const error = b - truth;
  if (error !== 0) torn++;
  console.log(
    `  ${start.toString().padStart(10)}   ${a.toString().padStart(12)}   ${b.toString().padStart(16)}   ${error === 0 ? 'none' : error.toLocaleString('en-US')}`
  );
}

console.log('');
console.log(`torn results: ${torn} of ${starts.length}`);
console.log('The tear is not a small error. It is off by exactly one half-width -- 65,536');
console.log('here -- and only at a carry, so it appears roughly once every 65,536 increments');
console.log('and never on the bench.');
console.log('');

console.log('read-until-stable, same counters, an interrupt allowed in the first gap:');
for (const start of starts) {
  const m: Machine = { hi: Math.floor(start / HALF), lo: start % HALF };
  const value = stableRead(m, 1);
  console.log(`  ${start.toString().padStart(10)} -> ${value.toString().padStart(10)}   (actual ${load(m)})`);
}
console.log('');
console.log('Two consecutive agreeing reads cost one extra load and hold off nothing --');
console.log('but they assume the writer is slower than the reader. A counter ticking every');
console.log('instruction would never settle, and that case needs a critical section instead.');
```

## When to Use
- On every variable written in one context and read in another — decide visibility and atomicity separately, in that order
- When a value is wider than the core's word, which is the case for any 32-bit counter on an 8- or 16-bit part
- When a counter shows an impossible jump or goes backwards, before suspecting the hardware
- When choosing between a critical section and a stable read: how long may the handler be delayed, and how fast does the writer move?
- When a flag guards a buffer, where the flag alone is not enough and the ordering rule of Lesson 545 applies

## Common Mistakes
- **Treating `volatile` as atomic** — it constrains the compiler, not the width of the bus
- **Treating `volatile` as a lock** — it excludes nothing; two contexts can still interleave inside one read-modify-write
- **Assuming `count++` is one operation** — it is a load, an add and a store, and the handler can land between any two
- **Disabling interrupts for a long region "to be safe"** — the latency you added is now the deadline you miss (Lesson 543)
- **Sharing a wide struct through a flag** — the flag can become visible before the struct's non-volatile writes (Lesson 545)
- **Diagnosing a torn read as a hardware fault** — it appears once per carry, which looks like noise and is entirely software

## Further Reading
- [GCC: `volatile` — what the compiler does and does not promise](https://gcc.gnu.org/onlinedocs/gcc/Volatiles.html) — the accesses that must not be optimized away, stated by the implementation itself
- [Linux kernel: why `volatile` is almost always the wrong tool](https://www.kernel.org/doc/html/latest/process/volatile-considered-harmful.html) — the same visibility/atomicity/ordering separation, argued for a much larger codebase
- [ISO/IEC JTC1/SC22/WG14 — the C language committee](https://www.open-std.org/jtc1/sc22/wg14/) — ISO/IEC 9899 is where `volatile`'s semantics are actually defined; the drafts are public
- [Lesson 545](/courses/embedded-firmware/the-ring-buffer-between-two-contexts) — the ordering guarantee `volatile` does not give you, and the one shape that gets it right

```recall
- q: "What does `volatile` guarantee, and what does it not?"
  must:
    - "it guarantees visibility: no caching in a register, no elided reads, no reordering against other volatile accesses"
    - "it does not guarantee atomicity -- a wide object is still read in several accesses"
    - "and it does not order non-volatile accesses around it, so it is not a memory barrier"

- q: "What is a torn read and what does it look like in the field?"
  must:
    - "a value assembled from halves read before and after a writer changed it"
    - "so the reader sees a number that was never actually stored"
    - "typically a counter jumping by exactly one half-width, or briefly going backwards, once per carry"

- q: "Name the three fixes for tearing and their costs."
  must:
    - "narrow the object to the core's atomic access width -- free, but limits what can be shared"
    - "a critical section -- correct, but it delays the handler it was protecting"
    - "read until two consecutive reads agree -- no blocking, but it assumes the writer is slower than the reader"
```
