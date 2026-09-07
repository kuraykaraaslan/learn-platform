# 546. Never Block: Cooperative State Machines Instead of `delay()`

## What It Is
`delay(500)` is the first function most people meet on a microcontroller and the first one that has to be unlearned. It does not schedule anything and it does not yield to anything, because there is nothing to yield to (Lesson 542). It spins — burning instructions, keeping the core awake, and holding the loop shut — for half a second during which **the device cannot do anything else it was built to do**. On a board with one blinking LED that is invisible. On a sensor node that must also watch a button, feed a watchdog and drain a radio queue, it is the bug.

The replacement is not a thread. It is a **state machine driven by the loop**: each job keeps a small state variable and a timestamp of when it last acted, and on every iteration it asks one question — *is it time for my next step?* — and returns immediately either way. A job with four steps becomes four states, none of which blocks, and the loop visits every job on every pass. Nothing waits; everything checks.

This changes what a "sequence" looks like. Warm up the sensor for 50 ms, take a reading, wait for the radio to be ready, transmit: written with delays this is a straight line that owns the CPU for the whole sequence. Written as a state machine it is a `switch` on the current step, and every one of those waits becomes an elapsed-time comparison the loop evaluates in nanoseconds. The code is longer and it is the only version that composes with anything else running on the same device.

There is a second cost that only appears in the field. A busy-wait keeps the core at full current for its whole duration, so a device whose energy budget assumed sleeping between wakes (Lesson 537) does not merely respond late — it drains a battery at a rate the budget never modelled. The state-machine version reaches the bottom of its loop with nothing to do, which is exactly the condition under which firmware may put the core to sleep and let an interrupt wake it. **Not blocking is the precondition for sleeping**, and sleeping is where the battery life came from.

One detail matters enough to name: the "is it time?" comparison must be written as a subtraction of two timestamps, not as a comparison against a computed deadline. The reason is that the tick counter wraps, and Lesson 549 is entirely about the day that happens.

```quiz
- q: "What does `delay(500)` actually do on a bare-metal microcontroller?"
  anchor: "the device cannot do anything else it was built to do"
  options:
    - text: "Yields to the scheduler so other work can run for 500 ms"
      correct: false
      why: "There is no scheduler in a superloop. There is nothing to yield to."
    - text: "Spins for 500 ms with the loop shut and the core awake, so nothing else in the loop runs"
      correct: true
      why: "It is not a scheduling primitive, it is a busy-wait that also costs the energy budget."
    - text: "Puts the core to sleep for 500 ms and wakes on a timer"
      correct: false
      why: "Some libraries offer a sleeping variant, but plain delay spins; and sleeping still blocks the loop."

- q: "How is a four-step sequence with waits rewritten so it does not block?"
  anchor: "state machine driven by the loop"
  options:
    - text: "As four threads, one per step"
      correct: false
      why: "Threads need an RTOS and a stack each (Lesson 547); the superloop needs neither for this."
    - text: "As a state variable plus a timestamp, where each pass asks whether it is time for the next step and returns"
      correct: true
      why: "Every wait becomes an elapsed-time comparison the loop evaluates and moves on from."
    - text: "By shortening each delay until the total is acceptable"
      correct: false
      why: "Shorter delays still block, and now the sequence is also wrong."

- q: "Why does blocking cost battery life beyond the delay itself?"
  anchor: "Not blocking is the precondition for sleeping"
  options:
    - text: "Because the compiler cannot optimize a busy-wait loop"
      correct: false
      why: "Optimization is not the issue; the core is drawing full current either way."
    - text: "Because a device that never reaches an idle loop bottom never sleeps, and the energy budget assumed it would"
      correct: true
      why: "Sleep is entered when there is nothing to do, and a busy-wait guarantees there always is."
    - text: "Because interrupts fire more often while blocked"
      correct: false
      why: "Interrupt rate is unchanged. What changed is that the core never idles between them."
```

## Key Concepts
- **`delay()` does not yield** — there is nothing to yield to; it spins with the loop shut
- **The replacement is a state machine**: a state variable, a timestamp, and one "is it time?" check per pass
- **Every job returns immediately** — the loop visits all of them on every iteration
- **A sequence becomes a `switch`**, longer to write and the only form that composes with other work
- **Not blocking is the precondition for sleeping** — the loop reaching the bottom with nothing to do is what permits sleep (Lesson 537)
- **Compare elapsed time by subtraction**, never against a precomputed deadline (Lesson 549)
- **A blocked loop also stops feeding the watchdog**, which turns a long delay into a reset (Lesson 551)

## Example Code
The same job — warm up, sample, transmit — written both ways and run against the same twenty ticks, counting what else the device managed to do:

```typescript run
/** One timeline, two implementations. `serviced` counts the ticks on which
 *  the loop was free to handle a button press that arrives on every tick. */
const TICKS = 20;
const WARMUP = 5;
const SEND = 3;

// --- blocking version: the sequence owns the CPU from start to finish ---
let blockingServiced = 0;
let t = 0;
while (t < TICKS) {
  // "delay(WARMUP)" -- the loop is shut for these ticks
  t += WARMUP;
  // take the reading (1 tick)
  t += 1;
  // "delay(SEND)" while the radio finishes
  t += SEND;
  // one pass of the loop is now free to look at the button
  if (t < TICKS) blockingServiced++;
  t += 1;
}

// --- state-machine version: every tick returns to the loop ---
type State = 'idle' | 'warming' | 'sampling' | 'sending';
let state: State = 'idle';
let since = 0;
let smServiced = 0;
let readings = 0;

for (let tick = 0; tick < TICKS; tick++) {
  switch (state) {
    case 'idle':
      state = 'warming';
      since = tick;
      break;
    case 'warming':
      if (tick - since >= WARMUP) { state = 'sampling'; since = tick; }
      break;
    case 'sampling':
      readings++;
      state = 'sending';
      since = tick;
      break;
    case 'sending':
      if (tick - since >= SEND) { state = 'idle'; since = tick; }
      break;
  }
  smServiced++; // the loop reached its bottom: the button gets looked at
}

console.log(`over ${TICKS} ticks, with a button press arriving on every tick:`);
console.log(`  blocking version      : button looked at on ${blockingServiced} ticks`);
console.log(`  state-machine version : button looked at on ${smServiced} ticks`);
console.log(`  readings taken (state machine): ${readings}`);
console.log('');
console.log('Both versions do the same work in the same order and take the same time to');
console.log('complete a cycle. The difference is entirely in what else the device could do');
console.log('while doing it -- and in whether the loop ever reaches a point where the core');
console.log('is allowed to sleep.');
```

## When to Use
- On every timed sequence in firmware — warm-up, settling, retry backoff, debounce windows
- When a device must remain responsive to something else while a slow operation proceeds
- When the energy budget assumes sleep between wakes, since blocking removes the opportunity to sleep
- When a watchdog is enabled and any single loop iteration could otherwise exceed its window (Lesson 551)
- When porting example code from a datasheet or a vendor guide, which is almost always written with delays for clarity

## Common Mistakes
- **Using `delay()` for anything but a hardware-mandated wait of microseconds** — anything longer belongs in a state machine
- **Replacing `delay()` with a shorter `delay()`** — the loop is still shut, only for less time, and the sequence is now wrong
- **Keeping the state but not the timestamp** — without a recorded time the state machine cannot tell how long it has been in a state
- **Comparing against a precomputed deadline** — `now >= start + wait` breaks when the tick counter wraps (Lesson 549)
- **Assuming an RTOS makes blocking acceptable** — a task that blocks on a delay is fine, but one that busy-waits still burns the core (Lesson 547)
- **Forgetting that the sleep decision lives at the bottom of the loop** — code that never gets there never sleeps, whatever the power configuration says

## Further Reading
- [Zephyr Project: threads, timers and the cost of blocking](https://docs.zephyrproject.org/latest/kernel/services/threads/index.html) — what an RTOS provides instead, and what a blocking call means once one exists
- [ARM Cortex-M4 Devices Generic User Guide (ARM DUI 0553)](https://developer.arm.com/documentation/dui0553/latest/) — `WFI`/`WFE`: the instructions a loop reaches only when it has nothing left to do
- [Lesson 537](/courses/iot-hardware-basics/energy-budgets) — the energy budget that assumed the core would be asleep between wakes
- [Lesson 549](/courses/embedded-firmware/time-without-a-clock) — how the "is it time?" comparison must be written so it survives the counter wrapping

```recall
- q: "Why is `delay()` unacceptable in a superloop?"
  must:
    - "it does not yield, because there is no scheduler to yield to"
    - "it spins with the loop shut, so nothing else in the device runs"
    - "and it keeps the core awake, which breaks an energy budget that assumed sleep"

- q: "Describe the shape that replaces a blocking sequence."
  must:
    - "a state variable plus a timestamp of the last transition"
    - "each loop pass asks whether enough time has elapsed for the next step, then returns immediately"
    - "a sequence of waits becomes a switch over states, and every job is visited every pass"

- q: "What is the relationship between blocking and sleeping?"
  must:
    - "the core may sleep when the loop reaches the bottom with nothing to do"
    - "a busy-wait guarantees there is always something to do, so the device never sleeps"
    - "not blocking is therefore the precondition for the battery life the budget predicted"
```
