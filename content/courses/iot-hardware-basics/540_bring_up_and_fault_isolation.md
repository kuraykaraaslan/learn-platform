# 540. Bring-Up and Fault Isolation: Power, Then Signal, Then Software

## What It Is
Bring-up is the first time a new board is powered, and fault isolation is what you do when the reading is wrong later. Both follow the same rule, and it is the rule Lesson 524 promised: **the signal chain is ordered, so check it in order** — power, then signal, then software — and never skip forward, because a fault early in the chain produces confusing symptoms everywhere after it.

The order matters because of how faults propagate. If the 3.3 V rail is actually at 2.9 V (a wrong regulator resistor, a short pulling it down), the MCU may run, the sensor may respond, and the readings will be wrong in ways that look like a calibration or a firmware problem — you can spend a day in the debugger over a power fault. So the first checks are always: is every supply rail at the right voltage, under load, with no excess current draw. Only when power is confirmed do you check that the MCU is alive and the buses are wired right (Lessons 529, 530). Only when the signal path is confirmed do you look at firmware.

Fault isolation in the field is the same procedure run backwards from a symptom. A wrong reading: is the supply at the sensor correct (Lesson 536's voltage drop)? Is the raw ADC count sane, or is it stuck, railed, or floating (Lesson 528)? Does the count convert to a plausible value with the calibration applied (Lesson 534)? Is the value that reaches the queue the same one the firmware computed (Lesson 494's offline capture)? Each step is a measurement, and each rules out a section of the chain.

This is the same discipline as the emergency checklist in Lesson 253 and the store-and-forward recovery in Lesson 476: **a written sequence beats reasoning from scratch under pressure**, because the sequence encodes the order that a stressed person forgets. The checklist below is that sequence for a sensor node.

```quiz
- q: "A new board's sensor readings are wrong. You have spent an hour in the debugger. What should you have checked first?"
  anchor: "you can spend a day in the debugger over a power fault"
  options:
    - text: "The sensor's calibration constants in firmware"
      correct: false
      why: "That is a software-layer check, and the rule is power, then signal, then software. A power fault mimics a calibration fault."
    - text: "Every supply rail's voltage under load, and the total current draw — a power fault produces wrong readings that look like software"
      correct: true
      why: "A rail at the wrong voltage makes the MCU run, the sensor respond, and everything downstream wrong. Confirm power first, always."
    - text: "Whether the firmware build is the latest"
      correct: false
      why: "Worth ruling out, but it is a software-layer check and comes after power and signal are confirmed."

- q: "Why does bring-up follow a fixed order rather than checking whatever seems most likely?"
  anchor: "a written sequence beats reasoning from scratch under pressure"
  options:
    - text: "To satisfy a quality process"
      correct: false
      why: "It may also do that, but the reason is that a fault early in the chain produces misleading symptoms in every later stage."
    - text: "Because the signal chain is ordered — a fault at one stage confuses every stage after it, so checking in order rules out sections cleanly"
      correct: true
      why: "The same reason Lesson 253's emergency checklist and Lesson 476's recovery are sequences: the order is what a stressed person forgets."
    - text: "Because the tools can only be used in that order"
      correct: false
      why: "The tools are flexible. The discipline is imposed to avoid chasing downstream symptoms of an upstream fault."
```

## Key Concepts
- **Bring-up and field fault isolation follow one rule**: power, then signal, then software — in order, no skipping
- **A fault early in the chain produces misleading symptoms downstream** — a power fault looks like a firmware fault
- **Power checks first**: every rail at the right voltage under load, no excess current
- **Then signal**: MCU alive, buses wired right (Lessons 529, 530), raw ADC count sane (Lesson 528)
- **Then software**: calibration (Lesson 534), and the value that reaches the queue matches the one computed (Lesson 494)
- **Field fault isolation is the same procedure run backward from a symptom**
- **Each step is a measurement that rules out a section of the chain**
- **A written sequence beats reasoning from scratch under pressure** (Lessons 253, 476)

## Example Code
The bring-up and fault-isolation checklist for a sensor node. Run top to bottom; do not skip to a lower section while a higher one is unconfirmed:

```md
## Power — confirm before touching anything else
- [ ] Board draws roughly the expected current at power-on (not zero, not excessive — a short reads as excess, a dead regulator as near-zero)
- [ ] Every supply rail measured at its pin: within tolerance, under load, not just unloaded
- [ ] No rail sagging when the radio transmits or the sensor takes a reading (Lesson 536's drop, on-board)
- [ ] Regulator and any power components at a normal temperature, not hot (Lesson 525's power equation)
- [ ] Reverse-polarity and brown-out behaviour checked deliberately, not discovered in the field

## Signal — only after power is confirmed
- [ ] MCU is alive: debugger connects, or a heartbeat LED / boot message appears
- [ ] Each bus checked: TX↔RX crossover and common ground (Lesson 529); I²C/SPI addresses and pull-ups (Lesson 530)
- [ ] Every device on each bus acknowledges / returns its ID register
- [ ] Raw ADC counts are sane: not stuck at 0, not railed at full scale, not drifting like a floating input (Lesson 528)
- [ ] Cross-voltage interfaces measured, not assumed (Lesson 531)

## Software — only after the signal path is confirmed
- [ ] Raw counts convert to a plausible physical value with the nominal formula (Lesson 533)
- [ ] Per-device calibration loaded and applied; calibrated value matches a reference measurement (Lesson 534)
- [ ] The value written to the local queue is byte-identical to the one the firmware computed (Lesson 494)
- [ ] Timestamps carry the right clock and zone (Lesson 474)
- [ ] Energy draw over a full duty cycle matches the budget (Lesson 537)
```

## When to Use
- The first time any new board is powered — bring-up is not optional and it is not "just flash it and see"
- When a fielded unit reports wrong data — run the checklist backward from the symptom before opening the debugger
- When a fault is intermittent — the checklist's "under load" and "when transmitting" items are where intermittents hide
- When handing a board to someone else to debug — the checklist is what you hand them, so they start at power
- After any board change (Lesson 539) — re-run bring-up; a new spin is a new board

## Common Mistakes
- **Starting in the debugger** — a power or wiring fault produces software-looking symptoms and wastes the most expensive debugging time
- **Checking rails unloaded** — a rail that is fine at no load can collapse under the transmit current
- **Skipping to a lower section** while a higher one is unconfirmed — you are now debugging downstream symptoms of an upstream fault
- **Treating bring-up as a one-time event** — every board spin needs it again (Lesson 539)
- **Not writing the sequence down** — under field pressure the order is exactly what gets skipped (Lessons 253, 476)
- **Confirming "it works" without the load and duty-cycle checks** — the energy and voltage-drop faults only show under real operation

## Further Reading
- [SparkFun: Troubleshooting a project (systematic approach)](https://learn.sparkfun.com/tutorials/troubleshooting-a-project) — the same power-then-signal-then-software order, bench-oriented
- [Lesson 476](/courses/iot-telemetry-edge/store-and-forward) — recovering a device that lost its link and came back: a written recovery sequence for a stressed situation
- [Lesson 494](/courses/field-data-collection/offline-first-capture) — the "the queue is the product" check: confirming the value that reaches storage is the one that was captured
- [Lesson 253](/courses/client-delivery-pm-handover/deployment-runbook-and-emergency-handover) — the emergency checklist: the same "a written sequence beats reasoning under pressure" argument for a production incident

```recall
- q: "State the bring-up rule and why the order is fixed."
  must:
    - "power, then signal, then software — in order, never skipping forward"
    - "the signal chain is ordered, so a fault at one stage produces misleading symptoms in every stage after it"
    - "checking in order rules out whole sections of the chain cleanly"

- q: "Give the first checks in each of the three sections."
  must:
    - "power: expected current draw, every rail at voltage under load, no sag when transmitting"
    - "signal: MCU alive, buses wired right (crossover, ground, addresses, pull-ups), raw ADC count sane"
    - "software: nominal conversion plausible, calibration applied, queued value matches computed value"

- q: "How does field fault isolation relate to bring-up?"
  must:
    - "it is the same ordered procedure, run backward from a symptom"
    - "each step is a measurement that rules out a section of the chain"
    - "a written sequence beats reasoning from scratch under pressure (Lessons 253, 476)"
```
