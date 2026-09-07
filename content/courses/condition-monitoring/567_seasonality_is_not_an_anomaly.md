# 567. Seasonality Is Not an Anomaly: Comparing Like With Like

## What It Is
Buildings have rhythms and so does everything in them. A fan works harder in the afternoon than at three in the morning; a pump runs on weekdays and idles at the weekend; a chiller's load follows the outside temperature. These cycles are large, they are entirely normal, and **they are usually bigger than the fault you are looking for**.

That last sentence is the whole lesson, and on the data in this course it is measurable: the healthy assets' weekly cycle spans **1.060 mm/s** between its quietest and busiest hour, while the degrading asset has moved **0.364 mm/s** in twenty days. The signal you want is a third the size of the pattern you already have. A single baseline for the whole week averages the cycle away and then reports every busy Tuesday afternoon as a deviation of the same magnitude as the fault.

The fix is to stop comparing a reading to *an average* and start comparing it to **what this asset normally does at this hour, on this day of the week**. The baseline becomes a small table — a profile — rather than a single number, and the indicator becomes the **residual**: observed minus expected-for-this-slot. On a healthy machine the residual is close to zero all week, including at its busiest, which is precisely what a single average cannot deliver.

Two practical notes. The profile needs enough history to have seen each slot several times, which for an hour-of-week profile means a month rather than a week — and it inherits everything Lesson 564 said about which month. And a profile can absorb a fault the same way a baseline can: if the degradation was already running while the profile was built, the profile now expects it. **A profile is a baseline with more resolution, not a different kind of thing**, and every warning about baselines applies to it.

```quiz
- q: "Why does a single weekly average produce false alarms on a healthy machine?"
  anchor: "they are usually bigger than the fault you are looking for"
  options:
    - text: "Because averages are always too low"
      correct: false
      why: "The level is right on average — the problem is that the machine is not average at any given hour."
    - text: "Because the daily and weekly cycle is often larger than the fault, so busy hours deviate from the average as much as a fault does"
      correct: true
      why: "On this course's data the cycle spans 1.060 mm/s and the fault has moved 0.364."
    - text: "Because averages ignore the most recent data"
      correct: false
      why: "A rolling average includes it; the issue is comparing different parts of the cycle to one number."

- q: "What replaces a single baseline value?"
  anchor: "what this asset normally does at this hour, on this day of the week"
  options:
    - text: "A higher threshold, set above the busiest hour"
      correct: false
      why: "That hides the fault everywhere except at the peak, which is where it is least visible."
    - text: "A profile — expected value per slot — with the indicator becoming the residual against it"
      correct: true
      why: "On a healthy machine the residual is near zero all week, including at its busiest."
    - text: "A separate threshold per shift, set by the operators"
      correct: false
      why: "Closer, but it is a hand-maintained approximation of the profile the data already contains."

- q: "How much history does an hour-of-week profile need?"
  anchor: "enough history to have seen each slot several times"
  options:
    - text: "One week — that is one observation of every slot"
      correct: false
      why: "One observation per slot is a sample of one; a single unusual Tuesday becomes the definition of Tuesday."
    - text: "Enough that each slot has been observed several times, so a month rather than a week"
      correct: true
      why: "And it carries every warning from Lesson 564 about which month."
    - text: "A full year, to capture seasonal weather"
      correct: false
      why: "Sometimes desirable, but the requirement is per-slot repetition, not calendar coverage."
```

## Key Concepts
- **Cycles are normal and large** — daily load, weekday/weekend occupancy, weather-driven demand
- **The cycle is often bigger than the fault**: here 1.060 mm/s of weekly swing against 0.364 mm/s of degradation
- **A single average reports every busy hour as a deviation** the size of a real fault
- **Compare like with like**: expected value per hour-of-week slot, and the indicator is the **residual**
- **A healthy machine's residual is near zero all week**, including at its peak
- **A profile is a baseline with more resolution** — every Lesson 564 warning still applies
- **It needs each slot observed several times** — a month, not a week

## Example Code
First, the size of the thing that is not a fault:

```sql run seed=condition_history
-- The weekly cycle, measured: for each asset, how far apart are its quietest
-- and busiest hour-of-week slots, using only the first two weeks?
WITH profile AS (
  SELECT asset_id,
         EXTRACT(isodow FROM measured_at)::int AS dow,
         EXTRACT(hour  FROM measured_at)::int  AS hr,
         AVG(vibration_mm_s)                   AS profile_mean
  FROM asset_telemetry
  WHERE measured_at < TIMESTAMPTZ '2026-04-15 00:00:00+00'
  GROUP BY asset_id, dow, hr
)
SELECT asset_id,
       ROUND(MIN(profile_mean), 3)                    AS quietest_slot,
       ROUND(MAX(profile_mean), 3)                    AS busiest_slot,
       ROUND(MAX(profile_mean) - MIN(profile_mean), 3) AS weekly_swing
FROM profile
GROUP BY asset_id
ORDER BY asset_id;
```

Three of the four come back at 1.060 mm/s — they share a load pattern, which is
what makes them a fleet. `AHU-04`'s 2.786 is not a bigger cycle: its profile
slots contain the single-sample artefacts of Lesson 566, and one artefact in a
slot moves that slot's mean. A profile built from a mean inherits every problem
a mean has, which is an argument for building it from a median.

Now the same last-seven-days window scored two ways — against one number per asset, and against the profile:

```sql run seed=condition_history
-- Residuals against a single per-asset average.
WITH global AS (
  SELECT asset_id, AVG(vibration_mm_s) AS expected
  FROM asset_telemetry
  WHERE measured_at < TIMESTAMPTZ '2026-04-15 00:00:00+00'
  GROUP BY asset_id
)
SELECT t.asset_id,
       ROUND(AVG(t.vibration_mm_s - g.expected), 3) AS mean_residual,
       ROUND(MAX(t.vibration_mm_s - g.expected), 3) AS max_residual
FROM asset_telemetry t
JOIN global g USING (asset_id)
WHERE t.measured_at >= TIMESTAMPTZ '2026-05-09 00:00:00+00'
GROUP BY t.asset_id
ORDER BY t.asset_id;
```

```sql run seed=condition_history
-- The same window, scored against each asset's own hour-of-week profile.
WITH profile AS (
  SELECT asset_id,
         EXTRACT(isodow FROM measured_at)::int AS dow,
         EXTRACT(hour  FROM measured_at)::int  AS hr,
         AVG(vibration_mm_s)                   AS expected
  FROM asset_telemetry
  WHERE measured_at < TIMESTAMPTZ '2026-04-15 00:00:00+00'
  GROUP BY asset_id, dow, hr
),
recent AS (
  SELECT asset_id,
         EXTRACT(isodow FROM measured_at)::int AS dow,
         EXTRACT(hour  FROM measured_at)::int  AS hr,
         vibration_mm_s
  FROM asset_telemetry
  WHERE measured_at >= TIMESTAMPTZ '2026-05-09 00:00:00+00'
)
SELECT r.asset_id,
       ROUND(AVG(r.vibration_mm_s - p.expected), 3) AS mean_residual,
       ROUND(MAX(r.vibration_mm_s - p.expected), 3) AS max_residual
FROM recent r
JOIN profile p USING (asset_id, dow, hr)
GROUP BY r.asset_id
ORDER BY r.asset_id;
```

Compare the two `max_residual` columns. Against a single average, the healthy `AHU-01` peaks at **0.467** and the degrading `AHU-02` at **0.885** — a threshold placed between them is uncomfortably tight, and one placed at 0.5 fires on a machine with nothing wrong with it. Against the profile, healthy peaks at **0.057** and degrading at **0.496**: the same fault, the same data, and now nearly an order of magnitude between them. Nothing was made more sensitive; the cycle simply stopped being counted as a deviation.

## When to Use
- On any asset whose load follows occupancy, weather or a production schedule — which is most building plant
- When a monitor produces alerts that cluster at the same time of day or the same day of the week
- Before tightening a threshold to catch something subtle, since removing the cycle usually buys more than tightening does
- When comparing two periods, so that a fortnight containing a bank holiday is not read as a change in the machine
- When a profile is a month old and a repair has happened since, where Lesson 571's re-baselining applies to it too

## Common Mistakes
- **One baseline for a machine with a cycle** — every busy hour deviates as much as a fault does
- **Raising the threshold above the peak** — the fault is now invisible everywhere except at the busiest hour
- **Building a profile from one week** — each slot has one observation, so one odd Tuesday defines Tuesday
- **Building a profile while a fault is running** — the profile expects the fault, exactly as a baseline would
- **Assuming the cycle is small** — measure it; here it is nearly three times the fault it would have hidden
- **Treating a profile as a different mechanism from a baseline** — it is the same thing with more resolution, and inherits every caveat

## Further Reading
- [PostgreSQL documentation: `EXTRACT` and date/time functions](https://www.postgresql.org/docs/current/functions-datetime.html) — the field extraction an hour-of-week profile is built from, including `isodow`
- [Lesson 564](/courses/condition-monitoring/baselines) — the per-asset baseline this lesson gives more resolution to
- [Lesson 474](/courses/iot-telemetry-edge/three-clocks) — which clock and which zone the hour-of-week slot is computed in, since a profile in the wrong zone is smeared across two slots
- [Lesson 477](/courses/iot-telemetry-edge/time-series-schema) — retention: whether the month of history a profile needs is still there when you want it

```recall
- q: "Why is a single baseline value wrong for an asset with a daily or weekly cycle?"
  must:
    - "the cycle is often larger than the fault being looked for"
    - "so every busy hour produces a deviation the size of a real problem"
    - "here the weekly swing is 1.060 mm/s against a fault of 0.364 mm/s"

- q: "What replaces the single baseline, and what does the indicator become?"
  must:
    - "a profile: an expected value per hour-of-week slot, built from the asset's own history"
    - "the indicator becomes the residual -- observed minus expected for that slot"
    - "on a healthy machine the residual stays near zero all week, including at its busiest"

- q: "What does a profile inherit from a baseline?"
  must:
    - "every warning about which window it was built from"
    - "a profile built while a fault was running expects the fault"
    - "and it needs each slot observed several times, so a month rather than a week"
```
