# 537. Energy Budgets: Compute the Battery Life, Never Quote It

## What It Is
"This node runs for two years on a battery" is a claim, and in the field it is usually wrong by a lot. The honest form is a **charge budget**: a list of what the device does in a day, how long each activity lasts, and how much current it draws while doing it, added up into milliamp-hours per day and divided into the battery's usable capacity. The number falls out of the arithmetic, and every input is either a datasheet figure or a design decision — never a remembered "typical".

The budget has three kinds of line. **Active bursts**: measuring, computing, transmitting — high current, short duration, a few times an hour. **Sleep**: the long stretch between bursts — tiny current, almost all the time, and often the largest single contributor because it runs 24 hours a day. And the line people forget: **the regulator's own quiescent current**, which flows continuously regardless of what the firmware does. This lesson's `proof` computes one day's budget with the regulator on its own line, and then swaps just the regulator: a common cheap LDO turns a seven-year design into a sixteen-day one, and a better one takes the regulator out of the equation entirely. Nothing in the firmware changed.

This is different from Lesson 472's constraint, and the difference is worth stating. Lesson 472 is about a *regulatory airtime limit* — the radio may only transmit for 1% of the time by law, which caps how often you can send. Lesson 537 is about *energy* — how much charge each of those transmissions costs, and whether the battery lasts. A design can be legal on airtime and dead on battery in a month, or fine on battery and illegal on airtime; the two budgets are separate and both must close.

The output is not a single number to quote. It is a model with a **sensitivity**: change one input, see what moves. The `proof` shows that halving the transmit time or doubling the wake interval — the knobs a firmware engineer reaches for first — barely move a budget that the regulator dominates. Compute the budget, find the line that dominates, and fix that one.

```quiz
- q: "A node's energy budget says two years. In the field the batteries last five weeks. The firmware is efficient. Where do you look first?"
  anchor: "the line people forget: **the regulator's own quiescent current**"
  options:
    - text: "The radio transmit current — it is the highest single figure"
      correct: false
      why: "It is the highest instantaneous current but the shortest duration. A budget blown by 20x is usually a continuous draw, not a burst."
    - text: "A continuous draw the budget missed — most often the regulator's quiescent current, or a higher-than-spec sleep current"
      correct: true
      why: "Anything that runs 24 h/day dominates. A cheap LDO at a few mA quiescent turns years into weeks with no firmware change."
    - text: "Battery self-discharge"
      correct: false
      why: "Self-discharge matters over years, not weeks. A 20x miss is an active continuous load."

- q: "How is an energy budget different from Lesson 472's duty-cycle constraint?"
  anchor: "the two budgets are separate and both must close"
  options:
    - text: "They are the same constraint expressed in different units"
      correct: false
      why: "One is a legal airtime cap, the other is a charge budget. A design can pass one and fail the other."
    - text: "Lesson 472 is a regulatory limit on how often you may transmit; this lesson is how much charge each transmission costs and whether the battery lasts"
      correct: true
      why: "Legal on airtime and dead on battery in a month is a real outcome, and so is the reverse."
    - text: "Lesson 472 applies to LoRaWAN only and energy budgets apply to all radios"
      correct: false
      why: "Energy budgets apply to all radios, but the airtime limit is a specific regulatory rule, not the same kind of thing."
```

## Key Concepts
- **A battery life is computed, not quoted** — a charge budget in mAh/day divided into usable capacity
- **Every input is a datasheet figure or a design decision** — never a "typical"
- **Three kinds of line**: active bursts (high current, short), sleep (tiny current, almost always), and the regulator's quiescent current (continuous)
- **Sleep often dominates** because it runs 24 h/day; the regulator quiescent line is the one most often forgotten
- **This is not Lesson 472** — that is a legal airtime cap; this is energy, and both budgets must close independently
- **The output is a model with a sensitivity**, not one number
- **Firmware knobs** (transmit time, wake rate) barely move a budget the regulator dominates
- **Find the dominant line and fix that one**

## Example Code
Your own schedule and currents, into a battery-life estimate — then the proof that keeps the regulator honest:

```calc
inputs:
  - { id: sleep_ua,       label: "Sleep current: MCU + sensor + regulator quiescent (µA)", type: number, default: 28, min: 0 }
  - { id: active_ma,      label: "Average current during a wake (mA)", type: number, default: 9, min: 0 }
  - { id: active_s,       label: "Seconds awake per wake", type: number, default: 0.09, min: 0 }
  - { id: wakes_per_day,  label: "Wakes per day", type: number, default: 144, min: 1 }
  - { id: capacity_mah,   label: "Battery capacity (mAh)", type: number, default: 2400, min: 1 }
  - { id: usable_frac,    label: "Usable fraction before the regulator drops out", type: number, default: 0.8, min: 0 }
outputs:
  - { label: "Sleep charge per day (mAh)", expr: "sleep_ua / 1000 * 24", format: number }
  - { label: "Active charge per day (mAh)", expr: "active_ma * active_s * wakes_per_day / 3600", format: number }
  - { label: "Total per day (mAh)", expr: "sleep_ua / 1000 * 24 + active_ma * active_s * wakes_per_day / 3600", format: number }
  - { label: "Estimated life (days)", expr: "capacity_mah * usable_frac / (sleep_ua / 1000 * 24 + active_ma * active_s * wakes_per_day / 3600)", format: number }
```

```proof sha=1a06c8e82ce92fed at=2026-09-03 commit=c761a61
$ node budget.js
Per wake (144 wakes/day):
  state                 duration     current      charge/day
  sensor measurement      8.2 ms      4.200 mA      0.001 mAh
  compute + format       20.0 ms      3.700 mA      0.003 mAh
  radio transmit         60.0 ms     11.200 mA      0.027 mAh
  MCU + sensor sleep    24.00 h    0.003080 mA      0.074 mAh
  regulator quiescent   24.00 h    0.025000 mA      0.600 mAh   <- its own line

Total: 0.705 mAh/day
On a 2400 mAh cell at 80% usable: 2723 days (7.46 years).

Change one parameter, hold the rest:
  regulator 25 uA -> 5 mA (cheap LDO):      120.1 mAh/day  -> 16 days
  regulator 25 uA -> 1.6 uA (MCP1700):     0.144 mAh/day  -> 13377 days
  transmit 60 ms -> 120 ms (one retry):    0.73 mAh/day  -> 2623 days
  wake every 10 min -> every 5 min:         0.74 mAh/day  -> 2608 days

The regulator swap changes the answer by more than an order of magnitude and
touches no firmware. The transmit and wake-rate changes are what a reader
would reach for first, and they barely move it. Compute the budget; do not
quote it, and do not optimise the part that is not the problem.
```

The `calc`'s default sleep current lumps the regulator in with everything else. The `proof` pulls it onto its own line and then changes only that line — which is the number that actually decides the answer.

## When to Use
- Before committing to a battery size or a service interval — the budget, not a vendor's "up to X years"
- When a deployed fleet drains faster than promised — build the budget from measured currents and find the missing line
- When choosing a regulator — its quiescent current is a first-order design parameter for a sleepy node, not a detail
- When a firmware optimisation is proposed to save power — check it against the budget; if the regulator dominates, it will not help
- Alongside Lesson 472's airtime budget — both must close, and they constrain different things

## Common Mistakes
- **Quoting a battery life instead of computing one** — the quoted number is almost always optimistic and unaccountable
- **Omitting the regulator's quiescent current** — it runs continuously and often dominates a low-duty-cycle budget
- **Using the datasheet's headline sleep current** — real sleep current includes leakage, a watchdog, and a sensor that did not fully power down
- **Optimising the transmit path first** — it is a short burst; the continuous lines are where a blown budget lives
- **Confusing the energy budget with the airtime limit** — they are separate constraints (Lesson 472) and both can fail
- **Ignoring usable capacity** — a cell's full rating is not all reachable before the regulator's dropout voltage

## Further Reading
- [Nordic nRF52832 Product Specification, Rev. 1.4 — "Current consumption" chapter](https://infocenter.nordicsemi.com/topic/ps_nrf52832/current_consumption.html) — the per-mode current figures a real budget is built from, with their conditions
- [TI: Understanding the Quiescent Current of a Low-Dropout Regulator (SLYT412)](https://www.ti.com/lit/an/slyt412/slyt412.pdf) — why the regulator's own current is a line in the budget, and how it varies with load
- [Lesson 472](/courses/iot-telemetry-edge/lorawan-duty-cycle) — the regulatory airtime limit: the other budget a radio node must close, and a separate constraint from energy

```recall
- q: "What is an energy budget and what are its three kinds of line?"
  must:
    - "a list of daily activities with duration and current, summed to mAh/day and divided into usable capacity"
    - "active bursts (high current, short), sleep (tiny current, almost always)"
    - "the regulator's quiescent current — continuous, and the line most often forgotten"

- q: "How does an energy budget differ from Lesson 472's duty-cycle constraint?"
  must:
    - "Lesson 472 is a legal cap on how often the radio may transmit"
    - "this is a charge budget — how much energy each transmission costs and whether the battery lasts"
    - "the two are separate; a design can pass one and fail the other"

- q: "Why do firmware power optimisations often fail to extend battery life?"
  must:
    - "transmit and wake-rate changes touch short bursts"
    - "a low-duty-cycle budget is dominated by continuous lines — sleep and regulator quiescent"
    - "compute the budget, find the dominant line, and fix that one"
```
