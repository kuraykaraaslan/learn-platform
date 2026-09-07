# 545. One Producer, One Consumer, No Lock: The Ring Buffer Between Two Contexts

## What It Is
A handler that captures and a loop that decides (Lesson 543) need a queue between them, and on a microcontroller that queue is almost always a **ring buffer**: a fixed array, an index where the producer writes, an index where the consumer reads, and both wrapping to zero at the end. It is the standard shape for a reason — it never allocates, its worst case is its average case, and its memory cost is decided at build time, which is the only kind of cost this course lets you have (Lesson 548).

The interesting part is that it needs **no lock at all**, provided two rules hold. The first is ownership: **exactly one context writes each index**. The producer advances `head` and only reads `tail`; the consumer advances `tail` and only reads `head`. Nothing is ever read-modify-written by both, so the interleaving that would need mutual exclusion never exists. The second rule is ordering: **fill the slot before publishing the index, and read the index before reading the slot**. That one is not a style preference — swap the producer's two writes and the consumer can be handed a slot the producer had not written yet, which is the failure the proof below counts.

This is also why the obvious convenience — keeping a `count` of items alongside the two indices — is a trap. A count is incremented by the producer and decremented by the consumer, so it is written by both, and `count++` is a load, an add and a store that an interrupt can land inside (Lesson 544). The moment you add it, the structure needs a critical section it did not need before. The conventional alternative is to leave **one slot permanently unused** so that `head == tail` can mean empty and nothing else: a ring declared with eight slots holds seven items. Paying one slot to keep the structure lock-free is almost always the better trade on a device where the critical section would delay the very handler feeding the queue.

Two boundaries belong here. **What to do when the ring is full is not this lesson's question** — dropping the newest, overwriting the oldest, or refusing to accept new data are product decisions, and Lesson 476 is where they are argued. This lesson only guarantees that whichever policy you choose is implemented on a structure that is actually correct. And on a core or compiler that may reorder stores, the ordering rule needs an explicit barrier or a C11 atomic to be enforceable — `volatile` alone does not order the slot write against the index write (Lesson 544).

```quiz
- q: "Why does a single-producer, single-consumer ring buffer need no lock?"
  anchor: "exactly one context writes each index"
  options:
    - text: "Because interrupts are disabled while it is used"
      correct: false
      why: "Nothing is disabled. That is the point of the structure."
    - text: "Because each index has exactly one writer, so no read-modify-write is ever shared between the contexts"
      correct: true
      why: "The producer owns head and only reads tail; the consumer owns tail and only reads head."
    - text: "Because the array is fixed-size, and fixed-size structures are inherently thread-safe"
      correct: false
      why: "A fixed size removes allocation, not races. A shared count in a fixed array still races."

- q: "Why should a ring buffer not keep an item `count` next to its two indices?"
  anchor: "it is written by both"
  options:
    - text: "It wastes RAM that the extra slot would use better"
      correct: false
      why: "The cost is correctness, not a few bytes."
    - text: "Because both contexts modify it, so it needs a critical section the indices did not need"
      correct: true
      why: "`count++` is a load, an add and a store, and an interrupt can land inside it."
    - text: "Because the count can be derived, and derived state is always slower"
      correct: false
      why: "Deriving it is cheap. The reason to derive it is that it stops being shared mutable state."

- q: "What does leaving one slot of the ring permanently unused buy you?"
  anchor: "one slot permanently unused"
  options:
    - text: "Room for a sentinel value marking the end of the data"
      correct: false
      why: "No sentinel is involved; the indices carry all the information."
    - text: "An unambiguous empty test — `head == tail` can only mean empty, so no shared count is needed"
      correct: true
      why: "Without it, a full ring and an empty ring look identical, which is what forces a count."
    - text: "Alignment, so that each entry starts on a word boundary"
      correct: false
      why: "Alignment is a property of the element type and the array, not of the spare slot."
```

## Key Concepts
- **A ring buffer never allocates** — fixed array, two indices, wrap to zero; the cost is known at build time
- **Rule 1, ownership**: exactly one context writes each index — producer owns `head`, consumer owns `tail`
- **Rule 2, ordering**: fill the slot, then publish the index; read the index, then read the slot
- **A shared `count` reintroduces the race** — it is written by both, and `count++` is three operations
- **Leave one slot unused** so `head == tail` unambiguously means empty; eight slots hold seven items
- **The full policy is Lesson 476's question** — this lesson guarantees only that the structure is correct
- **Ordering needs a barrier** on a reordering core or compiler; `volatile` does not provide one (Lesson 544)

## Example Code
The whole structure, and the wrap that gives it its name:

```typescript run
/** A single-producer / single-consumer ring. On the device `slots` is a
 *  static array sized at build time and the two indices are plain words --
 *  no allocation, no lock, no critical section. */
const SLOTS = 8; // one is left unused, so this ring holds 7

type Ring = { slots: (number | null)[]; head: number; tail: number };

const empty = (r: Ring): boolean => r.head === r.tail;
const full = (r: Ring): boolean => (r.head + 1) % SLOTS === r.tail;
const used = (r: Ring): number => (r.head - r.tail + SLOTS) % SLOTS;

/** Producer context (the interrupt handler). Writes head, reads tail. */
function push(r: Ring, value: number): boolean {
  if (full(r)) return false; // caller decides what that means (Lesson 476)
  r.slots[r.head] = value; // 1. fill the slot
  r.head = (r.head + 1) % SLOTS; // 2. THEN publish it
  return true;
}

/** Consumer context (the loop). Writes tail, reads head. */
function pop(r: Ring): number | null {
  if (empty(r)) return null;
  const value = r.slots[r.tail]; // 1. read the slot the index published
  r.slots[r.tail] = null; // (model only: makes an unwritten slot visible)
  r.tail = (r.tail + 1) % SLOTS; // 2. THEN release it
  return value;
}

const ring: Ring = { slots: Array(SLOTS).fill(null), head: 0, tail: 0 };

console.log('push until full:');
for (let v = 1; v <= 9; v++) {
  const ok = push(ring, v);
  console.log(`  push(${v}) -> ${ok ? 'ok' : 'REFUSED (full)'}   head=${ring.head} tail=${ring.tail} used=${used(ring)}`);
}

console.log('');
console.log(`${SLOTS} slots, ${used(ring)} items held. The unused slot is what lets head==tail mean empty.`);
console.log('');

console.log('drain three, then push three more -- the indices wrap, the data does not move:');
for (let i = 0; i < 3; i++) console.log(`  pop() -> ${pop(ring)}   head=${ring.head} tail=${ring.tail}`);
for (const v of [10, 11, 12]) {
  push(ring, v);
  console.log(`  push(${v})   head=${ring.head} tail=${ring.tail} used=${used(ring)}`);
}

console.log('');
console.log('Nothing was copied, nothing was allocated, and neither context ever waited.');
console.log('used() is derived from the two indices on demand -- deliberately not stored,');
console.log('because a stored count would be written by both contexts.');
```

Two claims above are easy to state and easy to get wrong: that no lock is needed, and that the producer's two writes cannot be swapped. Both can be checked exhaustively rather than argued, because the state space is small — every interleaving of the two contexts' individual reads and writes, explored with a worklist.

Before reading the output, predict two things: whether the correct ordering produces any bad state, and whether the swapped ordering does.

```proof sha=0e33e9122d742d3e at=2026-09-07 commit=8aa74f4
$ node ring.js
Single-producer/single-consumer ring: 3 slots, 3 items, every interleaving explored.
The producer alone writes head; the consumer alone writes tail; there is no lock.

Producer fills the slot, THEN publishes head:
  reachable interleavings (distinct states) : 58
  states with nothing left to run           : 2
  states where the consumer saw wrong data  : none

Producer publishes head, THEN fills the slot:
  reachable interleavings (distinct states) : 79
  states with nothing left to run           : 2
  states where the consumer saw wrong data  : YES
  first such state                          : consumed [null] -- expected the prefix [1]
  buffer at that point                      : [null,null,null]

Both versions are the same code with two lines swapped, and both are lock-free.
Explored 58 and 79 states respectively -- exhaustively, not sampled.
Only the ordering separates a correct ring from one that hands the consumer a
slot the producer had not written yet. No amount of testing on a quiet bench
finds the second one; the enumeration finds it every time.
```

The swapped version is not "riskier" or "less clean" — it is wrong, and it is wrong in a way that produces a consumer holding data the producer never wrote. Note also that both versions explore a comparable number of states and neither ever blocks: being lock-free was never the property in question.

## When to Use
- Between an interrupt handler and the loop, which is the case it exists for
- Whenever the producer must not wait — a handler cannot block, so the queue must accept or refuse immediately (Lesson 543)
- When memory must be decided at build time, since a ring's footprint is `slots × element size` and nothing else (Lesson 548)
- When exactly one context produces and one consumes; with two producers, the ownership rule breaks and a lock or an atomic is required
- When the store-and-forward buffer of Lesson 476 has to be implemented on the device rather than described

## Common Mistakes
- **Adding a shared `count` field** — it turns a lock-free structure into one that needs a critical section
- **Publishing the index before filling the slot** — the consumer can read a slot that was never written, as the proof counts
- **Using all the slots** — then a full ring and an empty ring are indistinguishable, and something has to disambiguate them
- **Assuming `volatile` orders the slot write against the index write** — it does not; that needs a barrier or an atomic
- **Reusing the structure with two producers** — the ownership rule was the entire basis for dropping the lock
- **Blocking in the producer when the ring is full** — a handler that waits for the loop cannot be unblocked by the loop it is preempting

## Further Reading
- [ARM Cortex-M Programming Guide to Memory Barrier Instructions (ARM DAI 0321)](https://developer.arm.com/documentation/dai0321/latest/) — when an explicit barrier is required and when the core's ordering already guarantees it
- [Linux kernel: circular buffers and the barriers they need](https://www.kernel.org/doc/html/latest/core-api/circular-buffers.html) — the same single-producer/single-consumer argument, with the memory-barrier pairing spelled out
- [Lesson 476](/courses/iot-telemetry-edge/store-and-forward) — what to do when the ring is full: the overflow policy this lesson deliberately does not choose
- [Lesson 544](/courses/embedded-firmware/shared-state-volatile-and-atomicity) — why the ordering rule cannot be delegated to `volatile`
- [Lesson 543](/courses/embedded-firmware/interrupts-and-the-two-contexts) — the handler that fills this ring, and why it must return instead of waiting for space

```recall
- q: "State the two rules that let a ring buffer run without a lock."
  must:
    - "ownership: exactly one context writes each index -- producer owns head, consumer owns tail"
    - "ordering: fill the slot before publishing the index, and read the index before reading the slot"
    - "with both rules, no shared read-modify-write exists, so there is nothing to exclude"

- q: "Why is a stored item count a mistake in a lock-free ring?"
  must:
    - "it is written by both the producer and the consumer"
    - "count++ is a load, an add and a store, and an interrupt can land inside it"
    - "deriving the count from the two indices keeps every field single-writer"

- q: "Why does a ring buffer leave one slot unused?"
  must:
    - "so that head == tail can only mean empty"
    - "otherwise a full ring is indistinguishable from an empty one"
    - "the alternative is a shared count, which costs correctness rather than one slot"
```
