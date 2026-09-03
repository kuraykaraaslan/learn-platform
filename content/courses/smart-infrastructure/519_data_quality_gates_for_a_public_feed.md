# 519. Data Quality Gates for a Public-Facing Feed

## What It Is
Internally, a bad reading is a nuisance — someone notices the dashboard looks wrong and investigates. On a **public feed**, a bad reading is published: cited in a report, plotted by a journalist, ingested by someone else's model, and it cannot be recalled. So the feed needs a gate — a set of checks every record passes before it is exposed — and the gate has to be explicit, documented, and applied consistently, because the consumers cannot see your internal context and will take the numbers at face value.

The checks fall into a few classes and each catches something a schema does not. **Range**: the value is within the sensor's stated physical bounds — but only after normalisation (Lesson 516), because a bound is meaningless in the wrong unit. **Completeness**: a field the feed contract says is mandatory is not null. **Timeliness**: the observation timestamp is not in the future and not impossibly old relative to the feed's own clock. **Referential**: the sensor id resolves to a real asset in the crosswalk (Lesson 515) — a reading from an unknown sensor is either a misconfiguration or someone else's data. **Duplicate**: the same sensor and instant does not already have a reading.

A naive filter — "value is not null and within range" — passes far more than a real gate does, because it silently accepts the future-dated reading, the duplicate and the unknown-sensor reading. This course's seed has ten readings; the naive filter passes eight, the full gate passes five. The gap is the point: the three records the naive check lets through are exactly the ones a schema and a range check are blind to.

What the gate does with a failing record is a policy decision that belongs in the contract (Lesson 522). The safe default for a public feed is **withhold and flag** — do not publish it, record why, and expose an aggregate "N records withheld this period" so the omission is itself visible. Silently dropping is worse than publishing bad data, because a consumer cannot tell a gap from a genuine absence of measurement.

```quiz
- q: "Why does a public-facing feed need an explicit quality gate that an internal dashboard can do without?"
  anchor: "a bad reading is published: cited in a report, plotted by a journalist, ingested by someone else's model, and it cannot be recalled"
  options:
    - text: "Because public feeds have more traffic"
      correct: false
      why: "Load is a scaling concern. The reason is that a published bad value is consumed by people with no way to know it is wrong."
    - text: "Because consumers cannot see your internal context, take the numbers at face value, and a published value cannot be recalled"
      correct: true
      why: "Internally someone notices and investigates; externally the number is already in a report."
    - text: "Because public feeds must be faster"
      correct: false
      why: "Latency is unrelated to whether the data is correct."

- q: "Why does a naive 'not null and in range' filter pass more records than a real gate?"
  anchor: "it silently accepts the future-dated reading, the duplicate and the unknown-sensor reading"
  options:
    - text: "Because it does not check the data type"
      correct: false
      why: "Type is usually already enforced. What the naive filter misses is timeliness, referential and duplicate checks."
    - text: "Because a future-dated reading, a duplicate, and a reading from a sensor not in the crosswalk all have valid in-range values"
      correct: true
      why: "The seed's naive filter passes eight of ten; the full gate passes five, and the three extra are exactly these classes."
    - text: "Because it runs before normalisation"
      correct: false
      why: "That is a real ordering bug (Lesson 516) but not why the naive filter over-passes here."
```

## Key Concepts
- **A bad reading on a public feed is published and cannot be recalled** — the gate is not optional
- **The gate is explicit, documented, consistently applied** — consumers take the numbers at face value
- **Range** — within the sensor's stated bounds, checked *after* normalisation (Lesson 516)
- **Completeness** — mandatory fields per the feed contract are not null
- **Timeliness** — timestamp not in the future, not impossibly old, relative to the feed's clock
- **Referential** — the sensor id resolves to a real asset in the crosswalk (Lesson 515)
- **Duplicate** — no existing reading for the same sensor and instant
- **A naive filter over-passes** — it accepts the future-dated reading, the duplicate and the unknown sensor
- **Withhold and flag, don't silently drop** — expose "N withheld" so the gap is visible

## Example Code
The full gate as one query — one row per failing reading, tagged with the class it failed:

```sql run seed=crosswalk
WITH feed_now AS (SELECT TIMESTAMPTZ '2024-03-01 04:00:00+00' AS t)
SELECT r.reading_id, r.sensor_id, r.value, r.unit,
  CASE
    WHEN r.value IS NULL THEN 'incomplete: null value'
    WHEN r.value < r.min_valid OR r.value > r.max_valid THEN 'range: outside stated bounds'
    WHEN r.observed_at > (SELECT t FROM feed_now) THEN 'timeliness: timestamp in the future'
    WHEN NOT EXISTS (SELECT 1 FROM id_crosswalk x WHERE x.external_id = r.sensor_id)
         THEN 'referential: sensor not in crosswalk'
    WHEN EXISTS (SELECT 1 FROM feed_reading d
                 WHERE d.sensor_id = r.sensor_id AND d.observed_at = r.observed_at
                   AND d.reading_id < r.reading_id)
         THEN 'duplicate: same sensor and instant'
  END AS failed_check
FROM feed_reading r, feed_now
WHERE r.value IS NULL
   OR r.value < r.min_valid OR r.value > r.max_valid
   OR r.observed_at > feed_now.t
   OR NOT EXISTS (SELECT 1 FROM id_crosswalk x WHERE x.external_id = r.sensor_id)
   OR EXISTS (SELECT 1 FROM feed_reading d
              WHERE d.sensor_id = r.sensor_id AND d.observed_at = r.observed_at
                AND d.reading_id < r.reading_id)
ORDER BY r.reading_id;
```

```sql run seed=crosswalk
-- Naive filter vs full gate: how many records each would publish.
WITH feed_now AS (SELECT TIMESTAMPTZ '2024-03-01 04:00:00+00' AS t)
SELECT
  count(*) AS total,
  count(*) FILTER (
    WHERE value IS NOT NULL AND value BETWEEN min_valid AND max_valid
  ) AS naive_passes,
  count(*) FILTER (
    WHERE value IS NOT NULL AND value BETWEEN min_valid AND max_valid
      AND observed_at <= (SELECT t FROM feed_now)
      AND EXISTS (SELECT 1 FROM id_crosswalk x WHERE x.external_id = feed_reading.sensor_id)
      AND NOT EXISTS (SELECT 1 FROM feed_reading d
                      WHERE d.sensor_id = feed_reading.sensor_id
                        AND d.observed_at = feed_reading.observed_at
                        AND d.reading_id < feed_reading.reading_id)
  ) AS full_gate_passes
FROM feed_reading, feed_now;
```

```sql run seed=crosswalk
-- What a consumer of the feed should also get: the withheld count, so an
-- omission is visible rather than looking like missing measurement.
WITH feed_now AS (SELECT TIMESTAMPTZ '2024-03-01 04:00:00+00' AS t),
gated AS (
  SELECT r.*,
    (r.value IS NOT NULL AND r.value BETWEEN r.min_valid AND r.max_valid
      AND r.observed_at <= (SELECT t FROM feed_now)
      AND EXISTS (SELECT 1 FROM id_crosswalk x WHERE x.external_id = r.sensor_id)
      AND NOT EXISTS (SELECT 1 FROM feed_reading d
                      WHERE d.sensor_id = r.sensor_id AND d.observed_at = r.observed_at
                        AND d.reading_id < r.reading_id)) AS published
  FROM feed_reading r
)
SELECT sensor_id,
       count(*) FILTER (WHERE published)     AS published,
       count(*) FILTER (WHERE NOT published) AS withheld
FROM gated
GROUP BY sensor_id
ORDER BY sensor_id;
```

## When to Use
- Before exposing any internal data on a public or partner feed — the gate is a release gate, not a monitoring nicety
- When defining the feed contract (Lesson 522), where the checks, their bounds, and the withhold policy are all clauses
- When a consumer reports a wrong value in your published data — the gate is where the missing check should be added
- As a scheduled job over recent data, publishing the withheld-count aggregate alongside the feed itself

## Common Mistakes
- **Only checking null and range** — the duplicate and the unknown-sensor reading both pass, and both are wrong
- **Range-checking before normalising units** — a loose bound passes the mis-scaled value and a tight one fails the correct one (Lesson 516)
- **Silently dropping failures** — a consumer cannot distinguish a withheld reading from no measurement at all
- **No withheld-count in the published output** — the gaps are invisible and look like the sensor was offline
- **Different gates in different code paths** — one exporter is strict, another is not, and the feed is inconsistent
- **Treating the future-timestamp check as paranoia** — a device with a wrong clock produces them routinely, and a plotted future point distorts every trend line

## Further Reading
- [Great Expectations — data quality concepts](https://docs.greatexpectations.io/docs/core/introduction/) — a framework's vocabulary for expectations, suites and validation results, useful even if you build the gate by hand
- [OGC API — Features: conformance and validation](https://docs.ogc.org/is/17-069r4/17-069r4.html) — what a standards-compliant public feature feed is expected to guarantee to consumers
- [Lesson 475](/courses/iot-telemetry-edge/idempotent-ingest) — deduplicating a reading that arrives several times, the ingest-side version of the duplicate check
- [Lesson 516](/courses/smart-infrastructure/units-scales-and-timezones) — why the range check has to run after unit normalisation, not before

```recall
- q: "Why is an explicit quality gate essential for a public feed specifically?"
  must:
    - "a published bad reading is cited, plotted and ingested by others and cannot be recalled"
    - "consumers cannot see internal context and take the numbers at face value"
    - "internally someone notices and investigates; externally the number is already in a report"

- q: "Name the check classes in the gate and one thing each catches that a schema does not."
  must:
    - "range (after normalisation), completeness (mandatory not null), timeliness (not future/too old)"
    - "referential (sensor resolves in the crosswalk), duplicate (same sensor and instant)"
    - "a naive null+range filter also passes the future-dated reading, the duplicate and the unknown-sensor reading"

- q: "What should the gate do with a failing record, and why not just drop it?"
  must:
    - "withhold and flag — do not publish, record why"
    - "expose an aggregate 'N withheld' so the omission is visible"
    - "a silent drop is indistinguishable from a genuine absence of measurement"
```
