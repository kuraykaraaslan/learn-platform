# 553. Debugging Without a Console: Reset Reasons, Trace Buffers, and the Heisenbug

## What It Is
Every technique a developer relies on for diagnosis assumes something a field device does not have. There is no console to read, no log file to fetch, no debugger attached, no way to reproduce the state, and often no way to reach the device at all until someone drives to it. The bug that matters is the one that appeared once, at four in the morning, on unit 37, three months in — and the only evidence that will ever exist is the evidence the firmware was **designed to leave behind before the failure happened**.

The reflex to reach for first is the one that hurts most. `printf` over a serial port is not free: at 115,200 baud a byte is ten bits, so it takes 10 ÷ 115200 seconds — about 87 µs — and a forty-character line is therefore roughly 3.5 ms during which the loop is not running, unless the driver buffers and the interrupt does the sending. Adding it changes the timing of the very race you are chasing, which is why the bug so often disappears when you instrument it and returns when you stop. **A tool that changes the system's timing cannot be the primary tool for timing bugs.**

What works is cheap, permanent and designed in. **Record the reset reason** — the register that distinguishes power-on from brownout from watchdog from fault is a handful of bits, and without it a watchdog reset and a loose battery contact look identical forever (Lesson 551). **Keep a trace ring in memory that startup does not clear**, a few hundred bytes of small numeric events — state transitions, error codes, the tick of the last successful cycle — written with a single store each, and reported after the next boot. **Capture the fault registers** in the fault handler, where the address that was being accessed and the stacked program counter are still available, and store them the same way. All three survive the reset that erased everything else, and all three cost nothing when nothing is wrong.

For anything that must be watched *live*, the cheapest instrument on a device is a **pin**. Setting a GPIO high on entry to a function and low on exit costs a single store each and a logic analyser turns that into a timeline of when the handler ran, how long it took, and what it overlapped with — measurement that does not perturb what it measures, which is exactly what `printf` cannot promise. This is the software counterpart of Lesson 540's bring-up order: establish what is true at the lowest level, then move up.

The last piece is procedural rather than technical. A device that fails in the field is a device whose evidence must be extracted before its state is destroyed — and the first instinct of everyone involved will be to power-cycle it. Write down what to collect and in what order **before** the first deployment, in the same way Lesson 540 writes the bring-up sequence down before the first board arrives.

```quiz
- q: "Why is `printf` a poor primary tool for a timing bug on a device?"
  anchor: "A tool that changes the system's timing cannot be the primary tool for timing bugs"
  options:
    - text: "Because the serial port is usually unavailable in the field"
      correct: false
      why: "Often true, but the deeper problem applies even on the bench with the port connected."
    - text: "Because it takes real time — milliseconds for one line — and so changes the timing of the race being investigated"
      correct: true
      why: "It is why the bug disappears when instrumented and returns when the instrumentation is removed."
    - text: "Because formatting allocates memory the device does not have"
      correct: false
      why: "Formatting can be made allocation-free; the transmission time remains."

- q: "What single piece of state most changes what a field failure can be diagnosed from?"
  anchor: "Record the reset reason"
  options:
    - text: "A timestamp of the failure"
      correct: false
      why: "Useful, but the device's clock is a tick counter that restarted at zero (Lesson 549)."
    - text: "The reset reason — power-on, brownout, watchdog or fault — captured from the register that distinguishes them"
      correct: true
      why: "Without it, a watchdog reset and a loose battery contact are indistinguishable forever."
    - text: "The firmware version, which identifies the build"
      correct: false
      why: "Necessary context, but it does not tell you what happened."

- q: "How can a handler's timing be observed without changing it?"
  anchor: "the cheapest instrument on a device is a"
  options:
    - text: "By adding a counter and printing it once per second"
      correct: false
      why: "The print still takes milliseconds, and a counter loses the shape of the event."
    - text: "By toggling a GPIO pin on entry and exit and watching it with a logic analyser"
      correct: true
      why: "A single store at each end, and the timeline shows duration and overlap directly."
    - text: "By running the same code on a development board with a debugger attached"
      correct: false
      why: "The bench does not reproduce the field's timing, which is the thing under investigation."
```

## Key Concepts
- **The evidence is whatever was designed in beforehand** — there is no console, no log file and no reproduction
- **`printf` costs real time**: 10 bits per byte at 115,200 baud is about 87 µs, so a 40-character line is roughly 3.5 ms
- **It changes the timing of the bug being chased** — the classic disappear-when-instrumented failure
- **Record the reset reason**: power-on, brownout, watchdog and fault are otherwise indistinguishable (Lesson 551)
- **Keep a trace ring in memory the startup code does not clear** — small numeric events, one store each
- **Capture the fault registers in the fault handler**, where the faulting address and stacked PC still exist
- **A GPIO pin plus a logic analyser** measures timing without perturbing it — the software half of Lesson 540
- **Write the evidence-collection order down before deployment**, because the first instinct in the field is to power-cycle

## Example Code
The procedure, in the form it has to exist in — written before the device ships, and short enough to be followed by whoever is standing in front of it:

```md
## Before touching the device — the state disappears on power-cycle
- [ ] Photograph or note every visible indicator before doing anything (LEDs, display, physical position)
- [ ] Read the reset reason register and the persistent boot-failure counter (Lesson 551) — these survive a reset, not a power-cycle
- [ ] Dump the no-init trace ring and the last stored fault registers over whatever link still works
- [ ] Record the device's own uptime in ticks and the last successful cycle tick (Lesson 549 — ticks, not a wall clock)
- [ ] Only now, power-cycle if you must

## What the firmware must already carry for the above to be possible
- [ ] Reset reason latched into persistent state on every boot, before anything can overwrite it
- [ ] A no-init RAM region excluded from the startup zeroing, holding the trace ring and the boot counter
- [ ] A fault handler that stores the faulting address and stacked program counter and then resets deliberately
- [ ] Trace events written with a single store, no formatting, no allocation, safe from an interrupt (Lesson 545)
- [ ] A way to report all of it after the next boot, over the normal link, without a technician present

## Live investigation, when the device is reachable and the fault is reproducible
- [ ] GPIO toggle on entry/exit of the suspect handler; watch with a logic analyser, do not add prints (Lesson 543)
- [ ] Confirm power and signal before suspecting software — the bring-up order still applies (Lesson 540)
- [ ] Check the stack high-water mark against its allocation before believing any memory-corruption theory (Lesson 548)
- [ ] Compare the value the firmware computed against the value that reached storage (Lesson 494)
- [ ] Change one thing at a time, and write down what changed — the next person has only what you wrote
```

## When to Use
- Before the first deployment, where every item above is cheap to add and impossible to add retrospectively
- When a device returns from the field, where the order of collection decides whether the trip produced evidence or noise
- When a fault is intermittent and disappears under instrumentation, which is the signal to stop adding prints
- When a fleet shows a pattern of resets, where the reset reason turns a rumour into a distribution (Lesson 479)
- When a memory-corruption theory is proposed, where the stack high-water mark either supports it or ends it (Lesson 548)

## Common Mistakes
- **Adding prints to find a timing bug** — the instrumentation is now part of the timing, and the bug moves
- **Relying on RAM that startup zeroes** — the evidence is erased by the boot that was supposed to report it
- **Power-cycling before reading the reset reason** — the one register that would have said what happened is cleared
- **Formatting or allocating inside a trace call** — it becomes too expensive to leave enabled, so it is disabled, so it is absent when needed
- **Storing timestamps from a tick counter as if they were wall-clock time** — they restart at zero every boot (Lesson 549)
- **Leaving the collection procedure to be improvised in the field** — under pressure, the device gets power-cycled first

## Further Reading
- [Debugging hard faults on ARM Cortex-M (Memfault Interrupt)](https://interrupt.memfault.com/blog/cortex-m-hardfault-debug) — reading the fault status registers and recovering the stacked frame from inside the handler
- [ARM Cortex-M4 Devices Generic User Guide (ARM DUI 0553)](https://developer.arm.com/documentation/dui0553/latest/) — the fault status registers, the stacked frame layout, and what the core preserves on an exception
- [Nordic nRF52832 Product Specification — RESETREAS and the power module](https://infocenter.nordicsemi.com/topic/ps_nrf52832/power.html) — one part's reset-reason bits and which reset sources set them
- [Lesson 540](/courses/iot-hardware-basics/bring-up-and-fault-isolation) — the power-then-signal-then-software order this checklist is the field counterpart of

```recall
- q: "Why is adding `printf` the wrong first move for an intermittent field bug?"
  must:
    - "transmission takes real time -- about 87 microseconds per byte at 115,200 baud, milliseconds for a line"
    - "that changes the timing of the race being investigated"
    - "so the bug disappears while instrumented and returns when the instrumentation is removed"

- q: "Name the three pieces of evidence that survive a reset, and what each answers."
  must:
    - "the reset reason register -- whether it was power-on, brownout, watchdog or fault"
    - "a trace ring in no-init RAM that startup does not clear -- what the device was doing beforehand"
    - "the fault registers captured in the fault handler -- the faulting address and the stacked program counter"

- q: "How do you observe a handler's timing without changing it?"
  must:
    - "toggle a GPIO pin on entry and exit -- a single store at each end"
    - "watch it with a logic analyser, which shows duration and overlap directly"
    - "unlike printing, it does not perturb the timing it is measuring"
```
