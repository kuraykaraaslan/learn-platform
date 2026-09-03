# 520. Historical Replay: Answering "What Did the System Know at 03:00?"

## What It Is
An incident review asks a question ordinary queries cannot answer: not "what is the state now", but "what did the integration believe at 03:00 last Tuesday". Which asset did sensor `RTU-07` resolve to then? What reading was the latest? Which quality checks had it passed? The current tables answer "now"; historical replay answers "as of a past instant", and it only works if the data was built to support it.

Two ingredients make it possible. Validity-time columns on the reference data — the crosswalk's `valid_from` / `valid_to` from Lesson 515 — so a resolve can be asked "as of T" by filtering to rows whose window contains T. And an append-only fact stream for observations: readings are inserted, never updated, each with the instant it was observed and the instant it was ingested (the two are different — Lesson 474). Replay then means "consider only rows ingested on or before T, and for reference data, only rows valid at T".

The distinction that trips people up is **observed-at versus known-at**. A reading observed at 02:55 but not ingested until 03:20 was *not* something the system knew at 03:00, even though its observation timestamp is earlier. An incident review that wants to know what an operator could have seen must filter on ingest time; an analysis of what physically happened filters on observation time. A replay query has to be explicit about which, because they give different answers precisely in the window that matters.

Replay also inherits every ambiguity in the underlying data. If the crosswalk has an overlap (Lesson 515), the "as of T" resolve returns two assets for that period — and that is correct: the system genuinely did not have one answer then. Replay is not a way to clean up history; it is a way to see history as it actually was, including the parts that were wrong.

```quiz
- q: "What two ingredients does historical replay require?"
  anchor: "Validity-time columns on the reference data — the crosswalk's `valid_from` / `valid_to` from Lesson 515"
  options:
    - text: "A backup taken every hour and a restore procedure"
      correct: false
      why: "Restoring a backup gives you one past state at backup granularity. Replay needs finer, query-time resolution."
    - text: "Validity-time columns on reference data, and an append-only fact stream with observed-at and ingested-at timestamps"
      correct: true
      why: "Then 'as of T' is a filter: reference rows valid at T, fact rows ingested by T."
    - text: "A separate reporting database and a nightly ETL"
      correct: false
      why: "A snapshot warehouse helps analytics but does not let you ask an arbitrary past instant unless it kept validity time too."

- q: "Why must a replay query be explicit about observed-at versus ingested-at?"
  anchor: "they give different answers precisely in the window that matters"
  options:
    - text: "Because observed-at is always more accurate"
      correct: false
      why: "Neither is more accurate; they answer different questions. Observed-at is when it happened, ingested-at is when the system learned it."
    - text: "Because a reading observed before T but ingested after T was not something the system knew at T — and incident reviews care about that gap"
      correct: true
      why: "'What could the operator see' filters on ingest time; 'what physically happened' filters on observation time."
    - text: "Because ingested-at is stored in a different timezone"
      correct: false
      why: "Zone handling is separate (Lesson 516). The distinction here is which event the timestamp marks."
```

## Key Concepts
- **Replay answers "as of a past instant"**, not "now" — and only if the data was built for it
- **Ingredient 1**: validity-time columns on reference data (the crosswalk's `valid_from` / `valid_to`)
- **Ingredient 2**: an append-only fact stream — readings inserted never updated, with observed-at and ingested-at
- **"As of T"** = reference rows valid at T, fact rows ingested on or before T
- **Observed-at vs known-at** — a reading observed at 02:55, ingested at 03:20, was not known at 03:00
- **Incident review filters on ingest time** ("what could the operator see"); **physical analysis filters on observation time**
- **Replay inherits the data's ambiguities** — an overlapping crosswalk returns two assets for that period, correctly
- **Replay shows history as it was**, wrong parts included — it is not a cleanup

## Example Code
Resolving one id as of three different past instants, straight off the crosswalk's validity columns:

```sql run seed=crosswalk
-- What did SCADA tag RTU-07 resolve to, as of each instant?
SELECT q.as_of,
  (SELECT string_agg(x.asset_key, ' + ' ORDER BY x.asset_key)
   FROM id_crosswalk x
   WHERE x.system = 'SCADA' AND x.external_id = 'RTU-07'
     AND x.valid_from <= q.as_of
     AND (x.valid_to IS NULL OR x.valid_to > q.as_of)) AS resolved_asset
FROM (VALUES
  (TIMESTAMPTZ '2023-01-01 00:00:00+00'),
  (TIMESTAMPTZ '2023-06-01 00:00:00+00'),
  (TIMESTAMPTZ '2024-03-01 00:00:00+00')
) AS q(as_of)
ORDER BY q.as_of;
```

```sql run seed=crosswalk
-- The whole crosswalk state as of one past instant — a point-in-time snapshot
-- reconstructed by filtering, not stored.
WITH as_of AS (SELECT TIMESTAMPTZ '2023-06-01 00:00:00+00' AS t)
SELECT asset_key, system, external_id
FROM id_crosswalk, as_of
WHERE valid_from <= t AND (valid_to IS NULL OR valid_to > t)
  AND asset_key IN ('A-0003', 'A-0006')
ORDER BY asset_key, system;
```

```sql run seed=crosswalk
-- The overlap that replay does not hide: from 2023-03-15 onward, RTU-07 is
-- valid for BOTH A-0003 and A-0006, because the A-0006 row was never closed.
-- "As of 2024-03-01" honestly returns two assets — the system did not have one
-- answer.
WITH as_of AS (SELECT TIMESTAMPTZ '2024-03-01 00:00:00+00' AS t)
SELECT x.asset_key, x.valid_from, COALESCE(x.valid_to::text, 'open') AS valid_to
FROM id_crosswalk x, as_of
WHERE x.system = 'SCADA' AND x.external_id = 'RTU-07'
  AND x.valid_from <= t AND (x.valid_to IS NULL OR x.valid_to > t)
ORDER BY x.valid_from;
```

## When to Use
- In an incident or safety review, where "what did the system show at the time" is the central question
- When a published figure is disputed and you need to reproduce exactly what the feed said on a given date
- When testing a change to resolution or quality logic against real history — replay the past inputs, compare the outputs
- When designing the schema: the decision to keep validity time and an append-only fact stream has to be made before the history you will want exists

## Common Mistakes
- **Updating reference data in place** — the previous mapping is gone, and every past resolve now returns today's answer
- **Only storing observation time** — you can reconstruct what happened but not what the system knew, which is what a review asks
- **Filtering replay on the wrong timestamp** — "what could the operator see" on observation time includes readings that had not arrived yet
- **Expecting replay to give a clean answer** — if the data was ambiguous then, an honest replay is ambiguous now
- **Relying on backups for replay** — they give you backup-interval granularity, not an arbitrary instant, and usually not the reference data's history
- **Deleting old fact rows on a retention schedule without a plan for replay** — the review you cannot do is the one after the data aged out (Lesson 477)

## Further Reading
- [Martin Fowler: Temporal Patterns (Audit Log, Effectivity, Snapshot)](https://martinfowler.com/eaaDev/timeNarrative.html) — the pattern language behind validity time and point-in-time reconstruction
- [PostgreSQL: Range Types and exclusion constraints](https://www.postgresql.org/docs/current/rangetypes.html) — `tstzrange` and an exclusion constraint can enforce non-overlap on validity windows at write time
- [Lesson 477](/courses/iot-telemetry-edge/time-series-schema) — partitions, rollups and retention, and why deleting raw history limits what you can later replay

```recall
- q: "What does historical replay answer, and what two things must the data have for it to work?"
  must:
    - "'what did the system know as of a past instant', not 'what is true now'"
    - "validity-time columns on reference data (valid_from / valid_to)"
    - "an append-only fact stream with observed-at and ingested-at timestamps"

- q: "Explain observed-at versus known-at and which an incident review uses."
  must:
    - "observed-at is when the measurement happened; ingested-at is when the system received it"
    - "a reading observed at 02:55 but ingested at 03:20 was not known at 03:00"
    - "an incident review ('what could the operator see') filters on ingest time"

- q: "Why can a replay return an ambiguous answer, and is that a bug?"
  must:
    - "replay inherits every ambiguity in the underlying data, e.g. an overlapping crosswalk"
    - "'as of T' then honestly returns two assets — the system did not have one answer then"
    - "not a bug — replay shows history as it was, wrong parts included"
```
