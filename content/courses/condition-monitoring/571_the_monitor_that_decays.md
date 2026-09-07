# 571. The Monitor That Decays: Re-Baselining After Maintenance

## What It Is
Every baseline, profile and threshold in this course describes a machine at a moment. Machines change, and the two ways they change are opposite: they **degrade**, which is what the monitor exists to detect, and they get **repaired**, which is what the monitor was never told about. A monitor that is not told about repairs slowly stops describing the asset it is watching, and it does so without failing, alerting, or looking any different.

The clearest case is a component replacement. A bearing change steps the vibration down permanently, and every comparison against the old baseline now reports a large, stable negative deviation forever. Nobody alerts on things getting better, so the finding sits there unnoticed — and the machine's *new* normal is never established, which means the next real degradation has to climb all the way back up through the old baseline before it looks like anything at all. **The repair did not just invalidate the baseline; it hid the next fault.**

The subtler case is drift in the measurement rather than the machine. A sensor's offset and gain move over time (Lesson 534), and a re-seated or replaced sensor lands at a different offset immediately. The indicator moves, the machine did not, and no amount of statistics distinguishes the two — only the maintenance record can, which is one more reason Lesson 569's structured fields matter.

So a monitor needs a **re-baselining trigger**, and there are only three plausible sources for it: an event in the maintenance record (best, and only as good as that record), a detected step change in the data (possible, and it cannot tell a repair from a fault), or a schedule (crude, and it silently re-baselines through faults). Most schemes end up combining the first two: the event triggers it, and a step change with no matching event is itself a finding — either a repair nobody recorded, or a machine that changed abruptly on its own.

What re-baselining costs is history, and the trade is genuine. Reset, and the comparison is honest but every trend before the repair is gone. Keep it, and the trend is long but the comparison is against a machine that no longer exists. The usual resolution is to keep both: baselines are **versioned**, each with the date and reason it started, and the indicator uses the current one while the history remains readable.

```quiz
- q: "A bearing is replaced and the baseline is left alone. What happens?"
  anchor: "The repair did not just invalidate the baseline; it hid the next fault"
  options:
    - text: "The monitor alerts, because the readings changed sharply"
      correct: false
      why: "Nobody alerts on an improvement, so the step down passes unnoticed."
    - text: "It reports a permanent negative deviation nobody acts on, and the next real fault has to climb back through the old baseline before it shows"
      correct: true
      why: "The repair invalidates the baseline and hides the following fault at the same time."
    - text: "The baseline adjusts itself over the following weeks"
      correct: false
      why: "Only if it is a rolling baseline — and then it also absorbs faults, which is the opposite problem."

- q: "An indicator steps to a new level and the machine was not touched. What else could it be?"
  anchor: "A sensor's offset and gain move over time"
  options:
    - text: "Nothing — a step change in the data means a step change in the machine"
      correct: false
      why: "A replaced or re-seated sensor lands at a different offset immediately."
    - text: "A sensor change or drift, which no statistic can distinguish from a machine change"
      correct: true
      why: "Only the maintenance record separates them, which is why the record's structure matters."
    - text: "A change in the window length"
      correct: false
      why: "That would smooth the series, not step it."

- q: "Why version baselines rather than simply resetting them?"
  anchor: "baselines are **versioned**"
  options:
    - text: "To satisfy an audit requirement"
      correct: false
      why: "It may help there, but the reason is analytical."
    - text: "Because resetting makes the comparison honest and destroys the trend; versioning keeps both"
      correct: true
      why: "The indicator uses the current baseline while the earlier history stays readable."
    - text: "Because thresholds cannot be changed once set"
      correct: false
      why: "Thresholds change freely; the problem is what happens to the history when they do."
```

## Key Concepts
- **Machines change in two directions**: degradation, which the monitor exists to find, and repair, which it is not told about
- **A repair steps the indicator permanently** and nobody alerts on an improvement
- **The repair hides the next fault** — the following degradation must climb back through the stale baseline
- **Sensor drift and replacement look identical to a machine change** (Lesson 534); only the record separates them
- **Three trigger sources**: a maintenance event (best), a detected step change (cannot tell repair from fault), a schedule (crude)
- **A step change with no matching event is itself a finding** — an unrecorded repair, or an abrupt machine change
- **Version baselines** with a start date and a reason, so the comparison is current and the history survives

## Example Code
The decision, stated as the trade it is:

```tradeoff
question: "A component has been replaced on a monitored asset. Reset the baseline, or keep the existing one?"
sides:
  - name: "Reset to a new baseline"
    wins_when:
      - signal: "the repair changed the machine's normal behaviour measurably — a replaced bearing, impeller or motor steps the level and every later comparison against the old figure is meaningless"
      - signal: "the asset is critical enough that the next fault must be detected from its true current normal rather than from a level it will never return to"
      - signal: "there is a maintenance event with a date, so the boundary between the two baselines is defensible rather than guessed"
      - signal: "the monitoring scheme already versions baselines, so resetting costs nothing in history — the earlier series stays readable under its own version"
  - name: "Keep the existing baseline"
    wins_when:
      - signal: "the work was routine and did not touch anything that moves the indicator — a filter change, a lubrication visit, a software update"
      - signal: "the observable step is within the asset's ordinary variation, so declaring a new baseline would encode noise as a change"
      - signal: "the trend across the repair is the finding — a component replaced twice in six months is a story the reset would erase from the indicator"
      - signal: "there is not yet enough post-repair history to compute a trustworthy new baseline, and the warm-up period of Lesson 564 applies"
```

The two columns are not symmetric in one respect worth noticing: keeping a baseline is the default that happens when nobody decides anything, and it is the wrong default whenever a component was actually changed. A monitoring scheme with no re-baselining process is not neutral — it has silently chosen the second column for every repair in its history.

## When to Use
- On every maintenance event that touched something the indicator can see, which is most of them
- When an asset shows a large, stable deviation that nobody has acted on — check the maintenance record before the machine
- When a step change appears with no matching event, which is a finding either way
- After a sensor is replaced or re-seated, where the indicator moved and the machine did not (Lesson 534)
- When setting up a scheme, since the re-baselining trigger has to exist before the first repair rather than after it

## Common Mistakes
- **Having no re-baselining process** — the default of keeping the old baseline is wrong for every real repair
- **Resetting on every work order** — routine visits that touch nothing then destroy the trend
- **Resetting without recording the reason** — a baseline with no provenance cannot be reviewed later (Lesson 564)
- **Ignoring improvements** — a permanent negative deviation is a signal that something changed, not an absence of news
- **Attributing a sensor change to the machine** — no statistic separates them; the record does
- **Re-baselining on a schedule** — it eventually re-baselines straight through a developing fault and calls it normal

## Further Reading
- [ISO 17359 — condition monitoring and diagnostics of machines, general guidelines](https://www.iso.org/standard/71194.html) — the standard's treatment of baseline establishment and when it must be repeated; catalogue reference, the clause text is paid
- [Lesson 534](/courses/iot-hardware-basics/sensor-error) — offset, gain and drift: the measurement's own changes, which look exactly like the machine's
- [Lesson 564](/courses/condition-monitoring/baselines) — the baseline this lesson invalidates, and the warm-up period a new one needs
- [Lesson 569](/courses/condition-monitoring/labels-come-from-maintenance-history) — the structured maintenance record that makes the trigger possible at all

```recall
- q: "What does an unrecorded repair do to a monitor?"
  must:
    - "it steps the indicator permanently, and nobody alerts on an improvement so it goes unnoticed"
    - "every later comparison is against a machine that no longer exists"
    - "and the next real fault has to climb back through the stale baseline before it looks like anything"

- q: "Name the three possible re-baselining triggers and their weaknesses."
  must:
    - "a maintenance event -- best, but only as good as the record"
    - "a detected step change -- possible, but it cannot tell a repair from a fault"
    - "a schedule -- crude, and it eventually re-baselines through a developing fault"

- q: "Why are baselines versioned rather than replaced?"
  must:
    - "resetting makes the current comparison honest but destroys the earlier trend"
    - "keeping the old one preserves the trend but compares against a machine that no longer exists"
    - "versioning with a start date and a reason keeps both -- current comparison, readable history"
```
