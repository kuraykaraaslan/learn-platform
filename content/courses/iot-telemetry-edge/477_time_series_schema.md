# 477. Time-Series Schema and Retention: Partitions, Rollups, and Deleting Data

## What It Is
Telemetry has a property most application data does not: it is written once, never updated, read mostly in ranges, and **eventually has to be deleted**. Every design decision here follows from that last one, because deleting from a large table is the operation that turns out to be hard.

The shape is **partition by time**. A partitioned table is many tables behind one name, split on the measurement timestamp, and its value is that dropping old data becomes a catalogue operation rather than a scan. `DELETE FROM telemetry WHERE measured_at < ...` writes a dead tuple for every row and leaves the space occupied until a vacuum reclaims it; `DROP TABLE telemetry_2026_01` is instant and returns the space immediately. On a table with hundreds of millions of rows that is the difference between a retention policy and a wish.

There is a trap in the partition bounds that is specific to timestamps. A bound on a `timestamptz` column is resolved **once, at CREATE time, using whichever time zone the session had**. Write `FOR VALUES FROM ('2026-02-01')` and the boundary means a different instant depending on who ran the migration, so rows near it land in the wrong partition or in none at all. Say the offset explicitly and the bound means the same thing everywhere — the run below does, and would fail without it.

The second structure is the **rollup**: aggregates computed once and stored, so a year-long chart reads a year of hourly rows rather than a year of ten-second ones. What to keep in a rollup is a real decision — an average alone hides the excursion that Lesson 482's alerting exists to catch, so minimum and maximum go in beside it, along with the sample count, because an hour with four readings and an hour with three hundred should not look alike.

The two together give a retention policy with shape: **raw data for weeks, rollups for years**. The January detail is dropped and January's hourly summary survives it, which is almost always what people actually want when they say they need the history.

```quiz
- q: "Why partition a telemetry table by time?"
  anchor: "dropping old data becomes a catalogue operation rather than a scan"
  options:
    - text: "To make range queries faster"
      correct: false
      why: "Partition pruning does help range queries, and an index gives most of that. Deletion is what only partitioning solves."
    - text: "So retention is a DROP TABLE rather than a DELETE that writes a dead tuple per row"
      correct: true
      why: "On a large table that is the difference between a policy and an intention."
    - text: "Because Postgres cannot index a table beyond a certain size"
      correct: false
      why: "It can. The problem is reclaiming space from a bulk delete, not indexing."

- q: "What is wrong with `FOR VALUES FROM ('2026-02-01')` on a `timestamptz` column?"
  anchor: "resolved **once, at CREATE time, using whichever time zone the session had**"
  options:
    - text: "Nothing — the literal is unambiguous"
      correct: false
      why: "It is ambiguous by exactly the session's UTC offset, and the resolution is baked in permanently at CREATE time."
    - text: "It resolves using the session's time zone, so the boundary means a different instant depending on who ran the migration"
      correct: true
      why: "Rows near the boundary then land in the wrong partition, or in none at all."
    - text: "Partition bounds cannot be timestamps"
      correct: false
      why: "They can and usually are. The offset is what has to be stated."
```

## Key Concepts
- **Write-once, range-read, eventually deleted** — the shape every decision follows from
- **Partition by measurement time**: many tables behind one name
- **`DROP TABLE` beats `DELETE`**: a catalogue operation against a dead tuple per row
- **State the offset in partition bounds**: a `timestamptz` bound is resolved once, in the session's time zone
- **Rollup**: aggregates computed once and stored, so long ranges read few rows
- **Keep min and max, not just the mean** — an average hides the excursion an alert exists to catch
- **Keep the sample count**: an hour with four readings and one with three hundred are different facts
- **Raw for weeks, rollups for years** — the retention shape that matches what people mean by history
- **Create partitions ahead of time**: an insert with no matching partition fails, and it fails at midnight

## Example Code
The partitioned table, populated and inspected:

```sql run
-- Pinned so this page shows you the same output it shows everyone else: this
-- runs in YOUR browser, so without it the session time zone is whatever your
-- machine is set to, and every timestamp below would render differently.
SET TIME ZONE 'UTC';

-- A time-series table that can be deleted from. The partition key is the
-- measurement time, and every partition is a table Postgres can DROP whole.
CREATE TABLE telemetry (
  device_id   text        NOT NULL,
  measured_at timestamptz NOT NULL,
  celsius     numeric(5,2) NOT NULL,
  PRIMARY KEY (device_id, measured_at)
) PARTITION BY RANGE (measured_at);

-- The offsets are not decoration. A partition bound on a `timestamptz`
-- column is resolved ONCE, at CREATE time, using the session's time zone —
-- so '2026-02-01' means a different instant depending on who ran the DDL,
-- and rows near a boundary land in the wrong partition or in none at all.
-- Say the offset and the bound means the same thing everywhere.
CREATE TABLE telemetry_2026_01 PARTITION OF telemetry
  FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-02-01 00:00:00+00');
CREATE TABLE telemetry_2026_02 PARTITION OF telemetry
  FOR VALUES FROM ('2026-02-01 00:00:00+00') TO ('2026-03-01 00:00:00+00');
CREATE TABLE telemetry_2026_03 PARTITION OF telemetry
  FOR VALUES FROM ('2026-03-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');

-- Three months of ten-minute readings from four devices.
INSERT INTO telemetry (device_id, measured_at, celsius)
SELECT
  'dev-' || lpad(d::text, 4, '0'),
  timestamptz '2026-01-01 00:00:00+00' + (i * interval '10 minutes'),
  round((18.0 + 4.0 * sin((i + d * 7) * 0.021))::numeric, 2)
FROM generate_series(1, 4) AS d, generate_series(0, 12959) AS i;

SELECT
  tableoid::regclass AS partition,
  count(*)           AS rows,
  min(measured_at) AS first_reading,
  max(measured_at) AS last_reading
FROM telemetry
GROUP BY 1
ORDER BY 1;
```

The rollup, computed from it:

```sql run
-- The rollup: hourly aggregates, computed once and stored, so a year-long
-- chart does not read a year of ten-minute rows. Note what is kept — min and
-- max as well as the mean, because an average hides the excursion that the
-- alert in lesson 482 exists to catch.
CREATE TABLE telemetry_hourly (
  device_id text        NOT NULL,
  bucket    timestamptz NOT NULL,
  samples   int         NOT NULL,
  mean_c    numeric(5,2) NOT NULL,
  min_c     numeric(5,2) NOT NULL,
  max_c     numeric(5,2) NOT NULL,
  PRIMARY KEY (device_id, bucket)
);

INSERT INTO telemetry_hourly (device_id, bucket, samples, mean_c, min_c, max_c)
SELECT
  device_id,
  date_trunc('hour', measured_at) AS bucket,
  count(*),
  round(avg(celsius), 2),
  min(celsius),
  max(celsius)
FROM telemetry
GROUP BY device_id, date_trunc('hour', measured_at);

SELECT
  (SELECT count(*) FROM telemetry)        AS raw_rows,
  (SELECT count(*) FROM telemetry_hourly) AS rollup_rows,
  round((SELECT count(*) FROM telemetry)::numeric
        / (SELECT count(*) FROM telemetry_hourly), 1) AS rows_per_bucket;
```

And retention, which is the reason for all of the above:

```sql run
-- Retention. This is the reason the table is partitioned at all: dropping a
-- partition is a catalogue operation, while DELETE writes a dead tuple for
-- every row and leaves the space behind until a vacuum reclaims it.
SELECT count(*) AS rows_before_drop FROM telemetry;

DROP TABLE telemetry_2026_01;

SELECT count(*) AS rows_after_drop FROM telemetry;

-- The rollup outlives the raw data it was computed from, which is the whole
-- point: the January detail is gone and January's hourly summary is not.
SELECT
  count(*) FILTER (WHERE bucket < '2026-02-01') AS january_buckets_kept,
  count(*)                                      AS rollup_rows
FROM telemetry_hourly;
```

Note the last result: January's raw readings are gone and January's hourly buckets are not. That asymmetry is the policy.

## When to Use
- Any table that accumulates measurements indefinitely, which is every telemetry store
- When a retention requirement exists at all — legal, contractual or budgetary — since it decides the partition interval
- When queries over long ranges are slow, where a rollup is usually a better answer than a bigger index
- When choosing between a general database and a purpose-built time-series one, since these three structures are most of what the latter automates (#45)

## Common Mistakes
- **Deleting instead of dropping** — a bulk `DELETE` leaves the space occupied and the table bloated until a vacuum catches up
- **Unqualified timestamp literals in partition bounds** — they resolve in the session's time zone, permanently, at CREATE time
- **Not creating partitions ahead** — an insert with no matching partition errors, and the first one arrives at midnight on the first of the month
- **Rolling up to the mean only** — the excursion that mattered is exactly what an average removes
- **Dropping the sample count from a rollup** — a bucket's average means nothing without knowing how many readings are behind it
- **Partitioning by ingest time** — the retention question is about when things happened, and Lesson 474's backlog would scatter one device's readings across partitions

## Further Reading
- [PostgreSQL table partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html) — declarative partitioning, pruning, and the attach/detach operations retention uses
- [PostgreSQL window functions](https://www.postgresql.org/docs/current/functions-window.html) — for the gap-filling and last-value-per-bucket queries a rollup usually needs alongside it
- [TimescaleDB documentation](https://docs.timescale.com/) — the extension that automates hypertables, continuous aggregates and retention policies, which are these three structures by other names

```recall
- q: "Why is partitioning by time the structural decision for telemetry?"
  must:
    - "the data is write-once and eventually has to be deleted"
    - "DROP TABLE on a partition is a catalogue operation"
    - "DELETE writes a dead tuple per row and leaves the space until vacuum"

- q: "State the partition-bound trap on a timestamptz column."
  must:
    - "the bound is resolved once, at CREATE time, in the session's time zone"
    - "so the same literal means a different instant depending on who ran it"
    - "rows near the boundary land in the wrong partition or in none"

- q: "What belongs in a rollup beyond the average, and why?"
  must:
    - "minimum and maximum, because an average hides the excursion an alert exists to catch"
    - "the sample count, because a bucket with four readings and one with three hundred are different facts"
    - "and the rollup outlives the raw data — raw for weeks, rollups for years"
```
