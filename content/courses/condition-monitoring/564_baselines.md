# 564. Baselines: An Absolute Threshold Is a Guess About a Machine You Have Not Met

## What It Is
The first thing anyone builds on vibration or temperature data is a threshold, and the first thing that threshold does is fail in both directions at once. It fires constantly on the big unit that has always run at that level, and it stays silent on the small one whose reading has doubled. Both outcomes come from the same mistake: **an absolute threshold is a statement about a population, and the question is about an individual machine**.

The alternative is a **baseline**: what this asset normally does, computed from its own history. The indicator becomes a *deviation* — this asset against itself last month — and the units stop mattering, because the comparison is internal. Two machines whose normal levels differ by 60% can then be watched with one rule, which is the thing the absolute threshold was reaching for and could not have.

A baseline needs three decisions and none of them is technical. **How long a window?** Long enough to contain the asset's normal variation, including whatever cycles it has (Lesson 567), and short enough to be about the machine as it is now. **From when?** A baseline computed during a fault bakes the fault in as normal, which is why the window's start date belongs in the record. And **what invalidates it?** A repair changes the machine, so the baseline before it describes something that no longer exists — the subject of Lesson 571.

The awkward case is a new asset, and it is worth being honest rather than clever about it. Until it has a history, an asset has no baseline, and the options are all imperfect: a fleet baseline for the same model, the manufacturer's stated figure, or a stated warm-up period during which the asset is monitored but not alarmed. What you cannot do is pretend the first week's data is a baseline; a week that happens to contain a heatwave becomes the definition of normal for the next year.

```quiz
- q: "A fleet-wide vibration threshold fires on one healthy machine and misses one that is degrading. Why?"
  anchor: "an absolute threshold is a statement about a population, and the question is about an individual machine"
  options:
    - text: "The threshold was set too low"
      correct: false
      why: "Any single value fails both ways here: raising it silences the false alarm and buries the real one further."
    - text: "Machines differ in their normal level, so one absolute value cannot be right for all of them"
      correct: true
      why: "The comparison has to be internal — each asset against its own history."
    - text: "The degrading machine's sensor is faulty"
      correct: false
      why: "Possible in general, but the mechanism here is the threshold, not the sensor."

- q: "What is the danger of computing a baseline from an asset's first two weeks?"
  anchor: "A baseline computed during a fault bakes the fault in as normal"
  options:
    - text: "Two weeks is too little data to be statistically valid"
      correct: false
      why: "Sample size matters, but the sharper risk is what those two weeks contained."
    - text: "If anything unusual was happening, that becomes the definition of normal for everything after"
      correct: true
      why: "Which is why the baseline's window start belongs in the record, not just its value."
    - text: "Baselines must always cover a full year"
      correct: false
      why: "It has to cover the asset's cycles, which is a shorter and more specific requirement (Lesson 567)."

- q: "A new asset has no history. What is the honest option?"
  anchor: "a stated warm-up period during which the asset is monitored but not alarmed"
  options:
    - text: "Use the first week as its baseline"
      correct: false
      why: "That is exactly the trap — a week containing anything unusual defines normal for a year."
    - text: "A fleet baseline for the same model, a manufacturer figure, or a stated warm-up with no alarms"
      correct: true
      why: "All imperfect, all better than inventing a baseline from a week."
    - text: "Alarm on absolute values until a baseline exists"
      correct: false
      why: "That reintroduces the population-versus-individual error this lesson opens with."
```

## Key Concepts
- **An absolute threshold answers a population question**, and condition is an individual-machine question
- **It fails both ways at once**: constant alarms on the big unit, silence on the small one that doubled
- **A baseline is what this asset normally does**, computed from its own history; the indicator is the deviation
- **Three decisions**: window length, window start, and what invalidates it — none of them technical
- **A baseline computed during a fault defines the fault as normal** — the window start belongs in the record
- **A repair invalidates the baseline** (Lesson 571), because the machine after it is a different machine
- **A new asset has no baseline** — fleet figure, manufacturer figure, or a stated warm-up with no alarms

## Example Code
Four air handling units, forty-five days of hourly vibration. First, the absolute threshold, set where a reasonable engineer would set it:

```sql run seed=condition_history
-- A fleet-wide alarm at 3.5 mm/s. Which assets trip it, and how often?
SELECT asset_id,
       COUNT(*)                                   AS hours_over,
       ROUND(MIN(vibration_mm_s), 3)              AS lowest_over,
       ROUND(MAX(vibration_mm_s), 3)              AS highest
FROM asset_telemetry
WHERE vibration_mm_s > 3.5
GROUP BY asset_id
ORDER BY asset_id;
```

Two assets trip it. Neither of them is the one that is failing. `AHU-03` is simply a larger unit that has always run near that level, and `AHU-04` is producing single-sample artefacts (Lesson 566). The asset that is actually degrading never appears, because its readings are still well under 3.5.

Now the same data, each asset against its own history:

```sql run seed=condition_history
-- Baseline from the first two weeks; comparison window is the last seven days.
WITH baseline AS (
  SELECT asset_id,
         AVG(vibration_mm_s)         AS base_avg,
         STDDEV_SAMP(vibration_mm_s) AS base_sd
  FROM asset_telemetry
  WHERE measured_at < TIMESTAMPTZ '2026-04-15 00:00:00+00'
  GROUP BY asset_id
),
recent AS (
  SELECT asset_id, AVG(vibration_mm_s) AS recent_avg
  FROM asset_telemetry
  WHERE measured_at >= TIMESTAMPTZ '2026-05-09 00:00:00+00'
  GROUP BY asset_id
)
SELECT b.asset_id,
       ROUND(b.base_avg, 3)                            AS baseline,
       ROUND(r.recent_avg, 3)                          AS recent,
       ROUND(r.recent_avg - b.base_avg, 3)             AS delta,
       ROUND((r.recent_avg - b.base_avg) / b.base_sd, 2) AS sd_from_baseline
FROM baseline b
JOIN recent r USING (asset_id)
ORDER BY b.asset_id;
```

`AHU-02` moves 0.364 mm/s above its own baseline and nothing else moves upward at all. The absolute rule could not see it because 2.8 mm/s is unremarkable for a fleet containing a machine that idles at 3.3; the internal comparison sees it immediately, in a query that is four lines longer.

Two details in that output are worth keeping. `AHU-03`'s delta is negative and large — a repair, not a fault, and Lesson 571 is about why a monitor built this way keeps reporting it forever. And `AHU-02`'s deviation is only 1.23 standard deviations, which is nowhere near a conventional alarm and is nonetheless the only real finding in the table. That gap between "clearly the largest signal here" and "not statistically dramatic" is the subject of Lesson 568.

## When to Use
- On every asset with enough history to have one, which after a month of telemetry is most of them
- When a monitoring system is generating alerts nobody trusts, where an absolute threshold is the usual cause
- When adding an asset to an existing scheme, where the warm-up period has to be decided rather than assumed
- When a value looks alarming, to check it against that asset's own history before escalating
- After any repair or replacement, where the baseline describes a machine that no longer exists (Lesson 571)

## Common Mistakes
- **One threshold for a fleet of different machines** — it fires on the loud healthy one and misses the quiet failing one
- **Baselining from whatever data is on hand** — if it contained a fault or a heatwave, that is now normal
- **Not recording the baseline's window** — a value with no provenance cannot be reviewed or reproduced
- **Baselining a brand-new asset from its first week** — a week is a sample of one of everything
- **Keeping a baseline through a repair** — the deviation afterwards is real and permanent and means nothing (Lesson 571)
- **Reading a small standard-deviation figure as "not a finding"** — on a smooth machine, 1.2 SD can be the only real movement in the fleet

## Further Reading
- [ISO 17359 — condition monitoring and diagnostics of machines, general guidelines](https://www.iso.org/standard/71194.html) — the standard's treatment of baselines and alarm criteria; catalogue reference, the clause text is paid
- [Lesson 507](/courses/asset-management-systems/condition-and-criticality) — the condition score this deviation is meant to inform, and its own scale
- [Lesson 534](/courses/iot-hardware-basics/sensor-error) — per-device offset and gain, which is a baseline problem one layer down in the hardware
- [Lesson 571](/courses/condition-monitoring/the-monitor-that-decays) — what a repair does to every baseline computed before it
- [Lesson 565](/courses/condition-monitoring/features-over-windows) — the window the baseline is computed over, and what its length decides

```recall
- q: "Why does an absolute threshold fail on a fleet of assets?"
  must:
    - "it is a statement about a population, while condition is a question about one machine"
    - "it fires constantly on a unit that has always run at that level"
    - "and stays silent on a smaller unit whose own reading has doubled"

- q: "What three decisions does a baseline require?"
  must:
    - "how long the window is -- long enough to contain the asset's normal cycles, short enough to describe it as it is now"
    - "when the window starts, since a baseline computed during a fault defines the fault as normal"
    - "what invalidates it, because a repair makes the machine a different machine"

- q: "What are the honest options for an asset with no history?"
  must:
    - "a fleet baseline for the same model, or the manufacturer's stated figure"
    - "or a stated warm-up period where the asset is monitored but not alarmed"
    - "what you cannot do is treat the first week as a baseline"
```
