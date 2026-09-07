# 549. Time Without a Clock: Ticks, Overflow, and the Subtraction That Saves You

## What It Is
A microcontroller powers up not knowing what year it is. What it has instead is a **tick counter**: a variable incremented by a timer interrupt, counting from zero since this boot, in units the firmware chose. That is enough for everything the device does internally — intervals, timeouts, debounce windows, the state machines of Lesson 546 — and it is not enough for anything anyone else will read, because a reading stamped "1,204,338 ticks after an unspecified power-on" cannot be joined to anything. Turning ticks into wall-clock time requires something external, and the three clocks that have to be reconciled are Lesson 474's subject.

The tick counter has one property that catches nearly everyone: **it wraps**. A 32-bit counter incremented every millisecond returns to zero after 2³² milliseconds, which the proof below computes as 49.71 days. Firmware written this year will run through that boundary in the field, unattended, once every seven weeks, and the boundary is invisible on any bench where the longest test is a weekend.

The failure it causes has a specific shape. Written as `now >= last + interval`, the test computes a deadline that may itself wrap past the end of the counter, after which the comparison answers a question about the wrong side of the boundary. Written as `(now - last) >= interval` in the counter's own unsigned width, the subtraction wraps in exactly the same way the counter does, and the two wraps cancel. **Subtracting first is not a defensive trick; it is the only form that is arithmetically correct**, and it costs nothing.

The second thing a tick is not is accurate. It comes from an oscillator with a tolerance stated in parts per million, so two devices that both "wait one hour" will disagree, and a device that counts its own uptime will disagree with a server (Lesson 518's ordering problem). Drift is a specification to look up and budget for, not a defect to be surprised by — and it is the reason a device that needs real time asks for it repeatedly rather than setting it once at the factory.

```quiz
- q: "What does a microcontroller's tick counter actually count?"
  anchor: "counting from zero since this boot"
  options:
    - text: "Seconds since the Unix epoch, maintained by the real-time clock"
      correct: false
      why: "Only if such a part exists and has been set. The tick counter has no epoch at all."
    - text: "Increments since this power-on, in whatever unit the firmware chose"
      correct: true
      why: "That makes it perfect for intervals and useless for anything another system must correlate."
    - text: "Instructions executed since reset"
      correct: false
      why: "It is driven by a timer peripheral, and is independent of what the core is executing."

- q: "Why is `now >= last + interval` wrong on a wrapping counter?"
  anchor: "the two wraps cancel"
  options:
    - text: "Because addition is slower than subtraction on most cores"
      correct: false
      why: "The cost is identical. The difference is correctness."
    - text: "Because the computed deadline can wrap past the end of the counter, so the comparison answers about the wrong side of the boundary"
      correct: true
      why: "Subtracting first wraps the same way the counter does, and the two wraps cancel."
    - text: "Because `last` may have been updated by an interrupt"
      correct: false
      why: "That is a separate concern (Lesson 544) and it applies to both forms equally."

- q: "Two devices are told to sample every hour. Why do they drift apart?"
  anchor: "a tolerance stated in parts per million"
  options:
    - text: "Because interrupt latency accumulates on the busier device"
      correct: false
      why: "The tick comes from a timer peripheral; handler latency does not change how often it counts."
    - text: "Because each oscillator has a frequency tolerance in ppm, so their ticks are not the same length"
      correct: true
      why: "It is a specification to budget for, which is why a device that needs real time re-asks for it."
    - text: "Because 32-bit counters wrap at different times on different devices"
      correct: false
      why: "The wrap is deterministic and identical; drift exists long before any wrap."
```

## Key Concepts
- **A tick counter counts from zero since this boot** — no epoch, no date, no relationship to anyone else's time
- **It is sufficient for intervals** and insufficient for anything another system must correlate (Lesson 474)
- **It wraps** — 32 bits of milliseconds is 49.71 days, computed rather than remembered
- **Correct form: `(now - last) >= interval`** in the counter's unsigned width — the two wraps cancel
- **Broken form: `now >= last + interval`** — the deadline itself can wrap past the end of the counter
- **The tick is not accurate**: the oscillator's tolerance is a ppm figure to budget for, not a defect
- **Devices that need real time re-ask for it**, because drift makes a one-time factory setting worthless (Lesson 518)

## Example Code
The two forms, side by side, around the boundary where they stop agreeing:

```typescript run
/** JavaScript models a 32-bit unsigned counter with `>>> 0`. Both functions
 *  below are what the firmware would compute; only the arithmetic differs. */
const u32 = (n: number): number => n >>> 0;

const correct = (now: number, last: number, interval: number): boolean =>
  u32(now - last) >= interval;

const naive = (now: number, last: number, interval: number): boolean =>
  now >= u32(last + interval);

const INTERVAL = 1000; // ticks; a 1 ms tick makes this one second
const last = 0xffffff00; // a start close enough to the top that the deadline wraps

console.log(`last = ${last} (0x${last.toString(16)}), interval = ${INTERVAL} ticks`);
console.log(`the naive deadline last + interval truncates to ${u32(last + INTERVAL)}`);
console.log('');
console.log('  elapsed        now    correct   naive   truth');
for (const elapsed of [0, 1, 255, 256, 743, 744, 999, 1000, 1001]) {
  const now = u32(last + elapsed);
  const truth = elapsed >= INTERVAL;
  const c = correct(now, last, INTERVAL);
  const n = naive(now, last, INTERVAL);
  const flag = n === truth ? '' : '   <-- wrong';
  console.log(
    `  ${String(elapsed).padStart(7)}  ${String(now).padStart(10)}    ${String(c).padStart(5)}   ${String(n).padStart(5)}   ${String(truth).padStart(5)}${flag}`
  );
}

console.log('');
console.log('The naive form reports the interval as elapsed the instant it starts, because');
console.log('the deadline it computed lies on the other side of the wrap. The correct form');
console.log('never consults an absolute deadline at all -- it only ever asks how far the');
console.log('counter has moved, and that distance wraps exactly as the counter does.');
```

That is one start value. The claim worth checking is the general one — that the subtraction is right everywhere and the addition is wrong in more places than it looks. An 8-bit counter is small enough to enumerate completely, so the check can be exhaustive rather than illustrative. Before reading the output, guess what fraction of all possible (start, elapsed) pairs the naive form gets wrong:

```proof sha=620f9ca5d2a00d5b at=2026-09-07 commit=8aa74f4
$ node wrap.js
8-bit counter, period 100 ticks, all 65536 (start, elapsed) pairs enumerated.

masked subtraction failed to recover the elapsed count : 0 of 65536
naive comparison gave the wrong answer                 : 17140 of 65536
start values for which the naive form ever misfires    : 255 of 256

first misfire in enumeration order:
  last=1 elapsed=255 now=0 -> naive says false, truth is true

Only one start value out of 256 is safe: last=0, where the counter and the
deadline can never wrap apart. The other 255 are wrong for some elapsed, and on a
free-running counter every start value comes around. The naive form is not an edge
case that needs a big counter -- it is wrong for a quarter of all the pairs there are.

32-bit counter, last=0xffffff00, period 1000 ticks, scanning 2000 ticks forward.
  deadline last+period truncates to        : 744
  ticks the naive form fires early         : 256
  ticks the naive form stays silent late   : 0

A 1 ms tick in a 32-bit counter wraps every 49.71 days.
That is the whole problem: the naive form is correct for seven weeks of testing
and then wrong once, in the field, on a device nobody is watching. The fix is
not a wider counter -- it is subtracting first.
```

The figure that matters is not the count itself but where the bad cases are: they are not clustered at the top of the range, and there is nothing rare about them. The one safe start value is zero — which is exactly the value a device has while it is sitting on your desk shortly after boot.

## When to Use
- On every interval, timeout and debounce comparison in firmware, without exception — there is no case where the addition form is preferable
- When reviewing someone else's timing code, where `>= last + interval` is a defect to be fixed rather than a style to be tolerated
- When a device works for weeks and then misbehaves once, which is the signature the wrap leaves
- When two devices must agree on an interval, where the oscillator's ppm figure sets what agreement is achievable
- When a reading leaves the device and must be correlated with anything else, where ticks must first become a real timestamp (Lesson 474)

## Common Mistakes
- **Writing `now >= last + interval`** — correct for seven weeks of testing, then wrong in the field
- **Widening the counter to 64 bits "to avoid the problem"** — it postpones a bug the subtraction removes for free, and costs an atomicity problem on a 32-bit core (Lesson 544)
- **Storing a deadline instead of a start time** — the stored value is the thing that wraps; the start time never causes a wrong answer
- **Treating the tick as accurate** — the oscillator tolerance is a real number that has to appear in the timing budget
- **Setting the real-time clock once at the factory** — drift makes the setting wrong long before the device is retired
- **Sending a reading stamped with ticks** — the receiver has no way to convert "1,204,338 since an unknown boot" into a time (Lesson 474)

## Further Reading
- [ARM Cortex-M4 Devices Generic User Guide (ARM DUI 0553)](https://developer.arm.com/documentation/dui0553/latest/) — SysTick: the counter most Cortex-M firmware derives its tick from, and its width
- [Nordic nRF52832 Product Specification — RTC and timer peripherals](https://infocenter.nordicsemi.com/topic/ps_nrf52832/rtc.html) — one part's counter widths, prescalers and the oscillator accuracy figures they inherit
- [Lesson 474](/courses/iot-telemetry-edge/three-clocks) — the device clock, the gateway clock and the server clock, and which one a reading should carry
- [Lesson 546](/courses/embedded-firmware/never-block-cooperative-state-machines) — the state machines whose every transition depends on this comparison being right
- [Lesson 518](/courses/smart-infrastructure/event-ordering-without-a-shared-clock) — ordering events across systems that do not share a clock, which is this problem one layer up

```recall
- q: "What does a tick counter give you, and what does it not?"
  must:
    - "it counts increments since this boot, with no epoch and no date"
    - "that is sufficient for intervals, timeouts and debounce windows"
    - "it is insufficient for anything another system must correlate, which needs a real timestamp (Lesson 474)"

- q: "Write the correct elapsed-time test and explain why it works."
  must:
    - "(now - last) >= interval, computed in the counter's own unsigned width"
    - "the subtraction wraps exactly as the counter wraps, so the two cancel"
    - "the addition form computes a deadline that can wrap past the end of the counter and then compares against the wrong side"

- q: "Why is a 32-bit millisecond counter's wrap a field-only bug?"
  must:
    - "2^32 milliseconds is about 49.71 days"
    - "no ordinary test runs that long, so the boundary is never crossed on the bench"
    - "the device crosses it unattended, once every seven weeks, for its whole service life"
```
