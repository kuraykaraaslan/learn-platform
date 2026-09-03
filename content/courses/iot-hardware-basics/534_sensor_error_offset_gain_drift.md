# 534. Sensor Error: Offset, Gain, Drift, and Per-Device Calibration

## What It Is
Two identical sensor parts, from the same reel, measuring the same thing, do not agree. The disagreement has a structure, and naming its parts is what turns "the readings are noisy" into a correction you can apply.

**Offset** is a constant added to every reading — the sensor reports 2.3 °C when the true value is 2.0, always, across its whole range. **Gain error** is a slope: the sensor reads correct at one point and diverges proportionally away from it, so it might be right at 0 °C and read 1% high at 50 °C. **Drift** is offset or gain changing slowly over time or with temperature — the correction that was right last year is stale now (Lesson 474's clock drift is the same idea for time). **Noise** is the random part, and unlike the other three it cannot be calibrated away, only averaged down.

Offset and gain are correctable because they are systematic: measure the sensor against a reference at two known points, compute the offset and gain that map its readings onto truth, and store those two numbers per device. This is **per-device calibration**, and the key word is *per-device* — a single fleet-wide correction removes the average error and leaves each unit's individual error untouched. The datasheet accuracy you cannot rely on (Lesson 526's missing min/max column) is exactly the error calibration removes.

This lesson's `sql run` works a seed of eight devices sampling one room over a morning. Applied naively — count times a constant — the fleet spreads by several degrees, and that spread looks exactly like a real temperature gradient across the room. Apply each device's stored calibration and the spread collapses to a fraction of a degree — except for two devices the seed built to fail: one whose offset drifted since it was calibrated, and one that was never calibrated at all. The query has to decide what to do with the un-calibrated device rather than silently dropping it.

```quiz
- q: "A fleet of identical sensors in one room reports a 3 °C spread. A single fleet-wide offset correction is applied. What happens?"
  anchor: "a single fleet-wide correction removes the average error and leaves each unit's individual error untouched"
  options:
    - text: "The spread collapses to near zero"
      correct: false
      why: "Only per-device calibration does that. A fleet-wide number shifts every reading by the same amount, so the spread between devices is unchanged."
    - text: "The mean moves toward truth but the 3 °C spread between devices stays"
      correct: true
      why: "The spread is each device's individual offset and gain, which a single shared number cannot address."
    - text: "The spread doubles"
      correct: false
      why: "A shared offset does not amplify the spread; it just translates the whole distribution."

- q: "Which of offset, gain, drift and noise cannot be calibrated away?"
  anchor: "unlike the other three it cannot be calibrated away, only averaged down"
  options:
    - text: "Gain — because it depends on temperature"
      correct: false
      why: "Gain is systematic and correctable, including its temperature dependence if you characterise it."
    - text: "Noise — it is random, so there is no fixed correction; you can only average it down"
      correct: true
      why: "Offset, gain and drift are systematic. Noise has no repeatable value to subtract."
    - text: "Drift — because it changes over time"
      correct: false
      why: "Drift is correctable; the correction just has to be refreshed. That it goes stale is why recalibration schedules exist."
```

## Key Concepts
- **Offset**: a constant added to every reading, across the whole range
- **Gain error**: a slope — correct at one point, diverging proportionally away from it
- **Drift**: offset or gain changing slowly with time or temperature — the correction goes stale (cf. Lesson 474)
- **Noise**: the random part — not calibratable, only averaged down
- **Offset and gain are correctable** because they are systematic: two known points give two numbers
- **Per-device calibration** stores those two numbers for each unit — a fleet-wide correction does not close the spread
- **This is what the un-guaranteed datasheet accuracy leaves for you** (Lesson 526)
- **An uncalibrated device is a decision**, not a row to drop silently

## Example Code
Eight devices, one room, one morning. First the naive conversion, then per-device calibration:

```sql run seed=device_calibration
-- The same raw count means a different temperature on each device, because
-- each has its own offset and gain. (Conversion constant: 0.05 degC/count.)
SELECT c.device_id,
       round((750 - c.offset_counts) * 0.05 * (1 + c.gain_ppm / 1000000.0), 2) AS temp_from_count_750
FROM device_calibration c
ORDER BY c.device_id;
```

```sql run seed=device_calibration
-- Naive: temperature = counts * 0.05, no per-device correction. The fleet
-- spread at one instant looks like a real gradient across the room.
SELECT
  min(round(counts * 0.05, 2)) AS coolest,
  max(round(counts * 0.05, 2)) AS warmest,
  round(max(counts * 0.05) - min(counts * 0.05), 2) AS spread_degC
FROM raw_sample
WHERE taken_at = TIMESTAMPTZ '2026-02-03 08:00:00+00';
```

```sql run seed=device_calibration
-- Calibrated: apply each device's stored offset and gain. The spread
-- collapses -- except for the two devices the seed built to fail, which the
-- LEFT JOIN and the cause column surface rather than hide.
SELECT r.device_id,
       CASE WHEN c.device_id IS NULL THEN NULL
            ELSE round((r.counts - c.offset_counts) * 0.05 * (1 + c.gain_ppm / 1000000.0), 2)
       END AS calibrated_degC,
       COALESCE(c.cause, 'never calibrated') AS status
FROM raw_sample r
LEFT JOIN device_calibration c ON c.device_id = r.device_id
WHERE r.taken_at = TIMESTAMPTZ '2026-02-03 08:00:00+00'
ORDER BY r.device_id;
```

The true temperature at 08:00 is 20.2 °C. Five devices land within 0.02 °C of it. `dev-05` reads 20.00 — its gain error was never measured, so the correction leaves a slope that grows with temperature. `dev-07` reads 22.5 — its offset drifted after it was calibrated, so the stored correction is stale. `dev-08` reads nothing — it has no calibration row, and the query returns a NULL with a reason instead of dropping it. That missing row is a dangling reference in the same sense as Lesson 517's dangling edge: a join that assumes every device has a calibration, and quietly loses the ones that do not. The naive spread of 3.4 °C was never weather; it was eight uncalibrated front ends.

## When to Use
- When a fleet of identical sensors disagrees — decompose the disagreement into offset, gain, drift and noise before calling it noise
- When the datasheet gives accuracy only as "typ" with no bound (Lesson 526) — calibration is how you get a bound
- When commissioning devices — a two-point calibration against a reference, stored per serial number (Lesson 512's register keys on identity)
- When old devices read consistently off — check the calibration date; drift means the stored correction is stale
- When aggregating readings across devices for a public feed (Lesson 519) — an uncalibrated device's reading needs a policy, not a silent include

## Common Mistakes
- **Calling systematic error "noise"** — noise is the part with no fixed value; offset and gain have one and can be subtracted
- **Applying one fleet-wide correction** — it moves the mean and leaves every device's individual spread in place
- **Calibrating once and never again** — drift makes the stored numbers stale, which is why recalibration intervals exist
- **Dropping readings from uncalibrated devices silently** — the aggregate then looks complete and is quietly biased
- **Trusting the datasheet's typical accuracy** — it is not guaranteed, and the fleet spread is the proof
- **Storing calibration by position instead of by serial** — swap two devices and both corrections are now wrong (Lesson 506)

## Further Reading
- [NIST: Engineering Statistics Handbook — calibration](https://www.itl.nist.gov/div898/handbook/mpc/section1/mpc11.htm) — offset (bias), gain (linearity) and drift as measurement-system parameters
- [Sensirion SHT4x datasheet, Rev. 1](https://sensirion.com/products/catalog/SHT40) — a sensor whose datasheet distinguishes repeatability (noise) from accuracy (systematic), the split this lesson names
- [Lesson 474](/courses/iot-telemetry-edge/three-clocks) — drift as a systematic, correctable-but-staleable error, applied to clocks instead of sensors

```recall
- q: "Name the four components of sensor error and which one cannot be calibrated away."
  must:
    - "offset (a constant), gain error (a slope), drift (offset/gain changing over time)"
    - "noise — the random part"
    - "noise cannot be calibrated, only averaged down; the other three are systematic and correctable"

- q: "Why does per-device calibration matter, and what does a fleet-wide correction fail to do?"
  must:
    - "each device has its own offset and gain"
    - "a fleet-wide number shifts every reading equally and leaves the between-device spread intact"
    - "per-device calibration stores two numbers per unit and collapses the spread"

- q: "What should a query do with a device that has no calibration row?"
  must:
    - "not drop it silently — that biases the aggregate and hides the gap"
    - "return a NULL or a flagged value with a reason (LEFT JOIN plus the cause)"
    - "the uncalibrated device is a policy decision, especially for a public feed (Lesson 519)"
```
