# 543. Interrupts: The Function That Runs While You Are Not Looking

## What It Is
An **interrupt** is a function the hardware calls. Nothing in your code invokes it, nothing schedules it, and it can start between any two instructions of the superloop — including between the two halves of a single assignment. When it returns, the loop resumes as if nothing happened. That is the whole mechanism, and it is the reason a device can respond to a pin change in microseconds while its main loop is busy elsewhere.

The cost is that **the handler borrows the machine**. While it runs, the loop does not, and on most cores an interrupt of equal or lower priority cannot run either. Everything in the handler is therefore paid for twice: once in its own execution, and once in the latency it adds to whatever else was waiting. A handler that formats a string, walks a list, or waits on a bus is not slow code in a slow place — it is slow code in the one place where slowness is measured against the deadline of every other event in the system.

So the discipline is a single rule: **the handler captures, the loop decides**. Read the register that would otherwise be overwritten, put the value somewhere the loop can find it, raise a flag, and return. Everything else — scaling, filtering, formatting, transmitting — happens in the loop, where taking a millisecond costs a millisecond and nothing more. This is the same shape as Lesson 528's open-drain interrupt line, seen from the software side: the pin tells you something happened, and what it means is decided elsewhere.

Two properties of handlers surprise people who arrive from application code. They cannot block — there is no scheduler to yield to, so a wait inside a handler is a hang with extra steps. And they are not a safe place for anything that assumes exclusive access to a shared structure: an allocator, a logging buffer, a linked list mid-update. What the handler may touch, and how, is Lesson 544's subject, and it is a harder problem than it looks.

```quiz
- q: "Why is work inside an interrupt handler more expensive than the same work in the loop?"
  anchor: "the handler borrows the machine"
  options:
    - text: "Handlers run on a slower clock to save power"
      correct: false
      why: "The core runs at the same speed. The cost is exclusivity, not clock rate."
    - text: "While it runs, the loop and equal-or-lower-priority interrupts do not — its cost is added to everything else's latency"
      correct: true
      why: "It is paid twice: its own time, plus the delay it imposes on every other pending event."
    - text: "The compiler cannot optimize handler code"
      correct: false
      why: "It optimizes handlers normally. The problem is when they run, not how well they are compiled."

- q: "A handler needs to send the reading it just captured over the radio. What should it do?"
  anchor: "the handler captures, the loop decides"
  options:
    - text: "Send it — the data is freshest at that moment"
      correct: false
      why: "A radio write is a long, often blocking operation, running where nothing else can proceed."
    - text: "Store the value, set a flag, and return; the loop transmits"
      correct: true
      why: "Capture what would be lost, decide later. The value keeps; the deadline does not."
    - text: "Re-enable interrupts inside the handler, then send"
      correct: false
      why: "Nesting the handler back into itself turns one long operation into a reentrancy problem too."

- q: "What happens when a handler blocks waiting for something?"
  anchor: "a wait inside a handler is a hang with extra steps"
  options:
    - text: "The scheduler switches to the main loop until the wait completes"
      correct: false
      why: "There is no scheduler in this context; nothing else can be selected to run."
    - text: "It hangs — nothing can run to make the awaited event happen, and the watchdog eventually resets the device"
      correct: true
      why: "Whatever the handler waits for usually needs the loop or a lower-priority interrupt to progress."
    - text: "The interrupt is dropped and the loop continues"
      correct: false
      why: "Interrupts are not abandoned when they take too long; the core stays in the handler."
```

## Key Concepts
- **Hardware calls the handler** — it can begin between any two instructions of the loop
- **The handler borrows the machine**: while it runs, the loop and equal-or-lower-priority interrupts do not
- **Its cost is paid twice** — its own execution, plus the latency it adds to every pending event
- **The rule: the handler captures, the loop decides** — read the perishable register, set a flag, return
- **Handlers cannot block** — there is no scheduler to yield to; a wait inside a handler is a hang with extra steps
- **Handlers are not safe places for shared structures** — allocators, log buffers, half-updated lists
- **Capture what is perishable**, which is usually one register read and a counter (Lesson 549's tick)

## Example Code
The same interrupt, written twice. The two halves differ by where the work happens — and that difference is the entire lesson:

```typescript
type Sample = { raw: number; tick: number };

declare function readAdcRegister(): number;
declare function currentTick(): number;
declare function radioSend(payload: string): void;
declare function appendToLog(line: string): void;

// ── broken ──
// Everything happens in the handler, because "that is where the data is".
function onAdcCompleteBroken(): void {
  const raw = readAdcRegister();
  const degrees = raw / 100;
  // Formatting allocates. Logging touches a buffer the loop also writes.
  // radioSend() waits on a bus. All three run with the loop stopped, and
  // with every other interrupt of this priority or lower held off.
  appendToLog(`adc ${raw} -> ${degrees.toFixed(2)} C`);
  radioSend(JSON.stringify({ degrees, at: currentTick() }));
}

// ── fixed ──
// The handler captures what would be lost and returns. `pending` is the
// entire interface between the two contexts (Lesson 544 is about making
// that interface correct).
let pending: Sample | null = null;
let overruns = 0;

function onAdcCompleteFixed(): void {
  if (pending !== null) {
    overruns++; // the loop has not consumed the last one -- count it, do not block
    return;
  }
  pending = { raw: readAdcRegister(), tick: currentTick() };
}

function loopIterationFixed(): void {
  const sample = pending;
  if (sample === null) return;
  pending = null;
  const degrees = sample.raw / 100;
  appendToLog(`adc ${sample.raw} -> ${degrees.toFixed(2)} C`);
  radioSend(JSON.stringify({ degrees, at: sample.tick }));
}
```

Note the `overruns` counter in the fixed half. The handler cannot wait for the loop to catch up, so the only honest options are to drop the new sample or overwrite the old one — and either way the device should know how often it happened. A dropped sample nobody counted is the same class of problem as Lesson 476's unchosen overflow policy: the behaviour exists whether or not anyone decided it.

## When to Use
- On every peripheral that produces data on its own schedule — a converter, a timer, a pin change, a received byte
- When a value would be lost if not read promptly, which is the only thing that truly belongs in a handler
- When a device must respond in microseconds while the loop is busy with something long
- When deciding what an event costs: measure the handler's work against every other event's deadline, not against the loop's spare time
- When a system "misses events under load", where a long handler is the first thing to look at

## Common Mistakes
- **Doing the work in the handler because that is where the data arrives** — capture is the job; deciding is the loop's
- **Calling anything that allocates, formats or logs from a handler** — those touch structures the loop is in the middle of using
- **Blocking inside a handler** — nothing can run to end the wait, so it becomes a hang the watchdog resolves by reset (Lesson 551)
- **Forgetting to clear the interrupt flag in the peripheral** — the handler re-enters immediately and the device appears frozen
- **Silently dropping samples when the loop is behind** — count the overruns, or the device lies about how much data it saw
- **Assuming a handler is atomic with respect to the loop** — it is atomic against lower priorities, not against anything it shares memory with (Lesson 544)

## Further Reading
- [ARM Cortex-M4 Devices Generic User Guide (ARM DUI 0553)](https://developer.arm.com/documentation/dui0553/latest/) — the exception model: priorities, preemption, tail-chaining and what "returning from a handler" actually does
- [Nordic nRF52832 Product Specification — interrupt and event model](https://infocenter.nordicsemi.com/topic/ps_nrf52832/nvic.html) — one vendor's mapping from peripheral events to handlers, and the flag that must be cleared
- [Lesson 528](/courses/iot-hardware-basics/floating-inputs-pullups-pulldowns-open-drain) — the shared open-drain interrupt line, from the hardware side
- [Lesson 476](/courses/iot-telemetry-edge/store-and-forward) — the overflow policy argument the `overruns` counter belongs to

```recall
- q: "State the rule for what belongs in an interrupt handler."
  must:
    - "the handler captures, the loop decides"
    - "read what is perishable (a register that would be overwritten), store it, set a flag, return"
    - "scaling, formatting, logging and transmitting all belong in the loop"

- q: "Why is time spent in a handler more expensive than the same time in the loop?"
  must:
    - "while the handler runs, the loop and equal-or-lower-priority interrupts cannot"
    - "its cost is added to the latency of every other pending event"
    - "so it is measured against other deadlines, not against the loop's spare time"

- q: "What should a handler do when the loop has not yet consumed the previous sample?"
  must:
    - "it cannot block or wait for the loop"
    - "it drops the new value or overwrites the old one -- a policy that has to be chosen"
    - "and it counts the occurrence, so the device does not silently lie about lost data"
```
