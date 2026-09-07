# 568. The Alert You Can Defend: From Indicator to a Work Order Somebody Accepts

## What It Is
An indicator becomes useful at exactly one moment: when somebody changes what they were going to do because of it. Everything before that is arithmetic. So the last question in this chain is not statistical — it is **where to put the threshold**, and the honest answer is that the number falls out of two costs and a rate, not out of the data.

The two costs are asymmetric and the asymmetry is the whole design. A **false alarm** costs an inspection: a technician goes, finds nothing, and — more expensively — trusts the next alert slightly less. A **missed failure** costs an unplanned outage: the callout, the collateral damage, the disruption, and whatever the asset's criticality score (Lesson 507) says the consequence is worth. When the second is thirty times the first, a threshold that produces some false alarms is correct, and a threshold tuned until the alerts are all real is producing far too few of them.

The rate matters as much as the costs, and it is the part people leave out. If the failure being predicted happens twice a year across the fleet, an alert rule firing weekly is wrong regardless of how good its statistics are — most of what it fires on cannot be the thing. This is the same arithmetic that makes rare-event screening hard everywhere, and on maintenance data it usually means **the useful threshold is much less sensitive than the one the analysis suggests**.

What makes an alert defensible in the room is not the threshold, though. It is that the alert carries its own evidence: which asset, which indicator, how far from *this asset's* baseline, over what window, compared against which profile, and what the same indicator did the last three times. An alert that says "vibration high" gets argued with. An alert that says "0.36 mm/s above this unit's own hour-of-week profile, sustained for nine days, and this unit has no maintenance record at all" gets a work order — and the last clause of that sentence is Lesson 569's subject.

Then Lesson 482's mechanics apply: hysteresis so it does not flap, a dead band so small movements do not re-fire it, debounce so one artefact is not an event. Those are the correct tools once the indicator is right, and they are the wrong tools for making a bad indicator quieter.

```quiz
- q: "A threshold is tuned until nearly every alert turns out to be real. What has gone wrong?"
  anchor: "producing far too few of them"
  options:
    - text: "Nothing — a high precision rate is the goal"
      correct: false
      why: "It is a goal only when the two errors cost the same, which here they do not."
    - text: "It is set far too high — when a missed failure costs many times an inspection, some false alarms are correct"
      correct: true
      why: "The asymmetry is the design, and a perfectly clean alert list means most of the real cases are being missed."
    - text: "The indicator is not sensitive enough"
      correct: false
      why: "The indicator may be fine; the threshold on top of it is the thing that was tuned."

- q: "Why does the failure rate matter as much as the two costs?"
  anchor: "most of what it fires on cannot be the thing"
  options:
    - text: "Because rare failures are cheaper"
      correct: false
      why: "Rarity has nothing to do with the cost of the consequence."
    - text: "Because a rule firing weekly for something that happens twice a year is mostly firing on something else"
      correct: true
      why: "It is the arithmetic of rare-event screening, and it usually means a less sensitive threshold."
    - text: "Because rates determine the window length"
      correct: false
      why: "Window length is Lesson 565's decision and is independent of this one."

- q: "What makes an alert defensible in the room?"
  anchor: "the alert carries its own evidence"
  options:
    - text: "A high confidence score attached to it"
      correct: false
      why: "A score with no provenance is exactly what gets argued with."
    - text: "The evidence: which asset, how far from its own baseline, over what window, against which profile, and what happened before"
      correct: true
      why: "'Vibration high' gets argued with; a stated deviation over a stated window gets a work order."
    - text: "Approval from the asset owner before it is sent"
      correct: false
      why: "That is a process for suppressing alerts, not for making them defensible."
```

## Key Concepts
- **An indicator is useful only when somebody acts differently** because of it
- **The threshold comes from two costs and a rate**, not from the data
- **A false alarm costs an inspection** — plus a durable loss of trust in the next alert
- **A missed failure costs an outage**, scaled by the asset's criticality (Lesson 507)
- **When the costs are asymmetric, some false alarms are correct** — a perfectly clean alert list is a red flag
- **The base rate constrains the alert rate** — weekly alerts for a twice-yearly failure are mostly not the failure
- **Defensibility comes from carried evidence**: asset, deviation, baseline, window, profile, history
- **Lesson 482's mechanics come last** — hysteresis and dead bands refine a correct indicator

## Example Code
The threshold argument, as arithmetic. Put in your own figures; the output that matters is the last line, which is the false-alarm count at which the scheme stops paying:

```calc
inputs:
  - { id: alerts_month,    label: "Alerts raised per month, at the proposed threshold", type: number, default: 6, min: 0 }
  - { id: true_fraction,   label: "Fraction of alerts that find something real", type: number, default: 0.25, min: 0 }
  - { id: inspect_cost,    label: "Cost of one inspection triggered by an alert", type: number, default: 350, min: 0 }
  - { id: failures_year,   label: "Unplanned failures per year without monitoring", type: number, default: 4, min: 0 }
  - { id: failure_cost,    label: "Cost of one unplanned failure (callout, damage, disruption)", type: number, default: 9000, min: 0 }
  - { id: caught_fraction, label: "Fraction of those failures this scheme catches in time", type: number, default: 0.5, min: 0 }
outputs:
  - { label: "Inspections per year", expr: "alerts_month * 12", format: number }
  - { label: "Inspection cost per year", expr: "alerts_month * 12 * inspect_cost", format: number }
  - { label: "Failure cost avoided per year", expr: "failures_year * caught_fraction * failure_cost", format: number }
  - { label: "Net per year", expr: "failures_year * caught_fraction * failure_cost - alerts_month * 12 * inspect_cost", format: number }
```

On the defaults, three quarters of the alerts find nothing and the scheme still pays for itself several times over — which is the point that gets lost in every meeting where someone objects to the false-alarm rate. The number to argue about is not the fraction that were wrong; it is whether the *caught fraction* is honest, and that is a question about labels rather than about statistics (Lesson 569).

## When to Use
- When setting or defending a threshold, where the two costs and the base rate are the argument
- When a team is about to tune a rule until its alerts are all correct, which usually means it is now catching almost nothing
- When an alert is being ignored, since the fix is usually the evidence it carries rather than its threshold
- When a monitoring scheme's value is questioned, where the arithmetic above is the form of the answer
- Before applying hysteresis or a dead band, since those refine a correct indicator and disguise an incorrect one (Lesson 482)

## Common Mistakes
- **Optimising for precision** — with asymmetric costs, an alert list with no false positives is catching too little
- **Ignoring the base rate** — a rule firing far more often than the failure occurs is mostly firing on something else
- **Sending "vibration high"** — an alert with no evidence gets argued with and then gets muted
- **Claiming a caught fraction you cannot support** — it is the one input that decides the answer and the one nobody has labels for (Lesson 569)
- **Treating a trust loss as free** — every false alarm is also a small permanent reduction in the response to the next one
- **Using hysteresis to fix a noisy indicator** — quieter, not righter; fix the indicator first (Lessons 566, 567)

## Further Reading
- [Lesson 482](/courses/iot-telemetry-edge/alerting-without-crying-wolf) — hysteresis, debounce and dead bands, applied once the indicator is right
- [Lesson 507](/courses/asset-management-systems/condition-and-criticality) — criticality, which is what scales the cost of the failure this threshold is trading against
- [Lesson 508](/courses/asset-management-systems/work-orders-and-maintenance-history) — the work order an accepted alert becomes, and the record it should leave behind
- [Lesson 61](/courses/observability-deployment/alerting-design) — the same trust-erosion argument on a system whose alerts page a person at night

```recall
- q: "Where does an alert threshold actually come from?"
  must:
    - "the cost of a false alarm, the cost of a missed failure, and the base rate of the failure"
    - "not from the data or from the statistics alone"
    - "when the costs are asymmetric, a threshold that produces some false alarms is the correct one"

- q: "Why is an alert list with no false positives a warning sign?"
  must:
    - "it means the threshold is set far above where the cost asymmetry would put it"
    - "so most of the real cases are being missed"
    - "the goal is the best trade between the two errors, not the elimination of one of them"

- q: "What makes an alert defensible?"
  must:
    - "it carries its own evidence: the asset, the deviation from that asset's own baseline, the window, the profile"
    - "and what the same indicator did previously"
    - "'vibration high' gets argued with and muted; a stated deviation over a stated window gets a work order"
```
