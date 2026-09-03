# 487. Time-Series Storage for Twin State: Narrow Tables and Last-Value Queries

## What It Is
A twin's state store answers two questions with very different shapes: **what is everything doing now**, and **what did this one thing do over that period**. Getting one table to serve both is most of the design.

The first decision is **narrow rather than wide**. A wide table has a column per measurement — `supply_temp`, `flow_rate`, `damper_position` — and it is comfortable until the sixteenth sensor type arrives, at which point every new point is a migration. A narrow table is `(asset, point, measured_at, value)`: one row shape for everything, so a new point is an `INSERT`. What you give up is per-point typing, which means a value column that is one type for every point and a units question that has to live somewhere else.

The second is the **last-value query**, which is the one a twin runs constantly and the one a naive schema is worst at. `SELECT ... WHERE measured_at = (SELECT max(...))` per point is a subquery per point. Postgres's `DISTINCT ON` does it in one pass, and with an index on `(asset, point, measured_at DESC)` it can stop after the first row of each group rather than scanning a group and sorting it. That index order is the whole optimisation: `(asset, point)` narrows, and `DESC` puts the newest first.

The third is that **gaps are not in the table**. A point that stopped reporting has no rows to find, so no query over the rows can see the absence. Detecting it means generating the timestamps you expected and `LEFT JOIN`ing the real ones against them — which is the shape every "why is my chart flat there" investigation converges on, and it is worth writing once as a view.

Retention is Lesson 477's subject and applies here unchanged: partition by measurement time, roll up, drop partitions. What is specific to a twin is that **the current value must survive the retention of its own history**. Drop the partition holding the last reading of a point that has since gone quiet, and the twin forgets what it knew — so the last-value cache is a separate table, written on ingest, and not derived from the history at query time.

```quiz
- q: "Why is a narrow `(asset, point, measured_at, value)` table preferred over a column per measurement?"
  anchor: "every new point is a migration"
  options:
    - text: "It is faster to query"
      correct: false
      why: "A wide table is usually faster for a row of related values. The reason is not speed."
    - text: "The set of points is open-ended, so a column per point makes every new sensor a migration"
      correct: true
      why: "A narrow table makes it an INSERT, at the cost of per-point typing."
    - text: "Because narrow tables compress better"
      correct: false
      why: "They may, and that is not the argument. Schema churn is."

- q: "A point stopped reporting two hours ago. Why can no query over the table find the gap?"
  anchor: "A point that stopped reporting has no rows to find"
  options:
    - text: "Because the rows are there with null values"
      correct: false
      why: "There are no rows at all. A missing reading is not a row containing nothing."
    - text: "Because the missing readings are not rows — the expected timestamps have to be generated and left-joined"
      correct: true
      why: "Which is why gap detection is a generate_series and a LEFT JOIN rather than a WHERE clause."
    - text: "Because the index does not cover absent values"
      correct: false
      why: "No index can point at a row that does not exist."
```

## Key Concepts
- **Two query shapes**: everything now, and one thing over a period
- **Narrow over wide**: `(asset, point, measured_at, value)` makes a new point an `INSERT`
- **What narrow costs**: per-point typing, and units have to live elsewhere
- **`DISTINCT ON`** answers the last-value question in one pass
- **Index on `(asset, point, measured_at DESC)`** — the `DESC` is what lets it stop after one row per group
- **Gaps are absent rows**: `generate_series` plus `LEFT JOIN`, not a `WHERE` clause
- **Identity is `(asset, point, measured_at)`** — Lesson 475's key, so a late arrival is a no-op
- **Retention is Lesson 477's** — partition, roll up, drop
- **The current value must outlive its history**: cache it on ingest rather than deriving it from rows that get dropped

## Example Code
The narrow table, with a gap and a point on a different cadence in it:

```sql run seed=twin_state
SET TIME ZONE 'UTC';

-- What the table holds. One row shape for every kind of point, which is what
-- makes a new sensor an INSERT rather than a migration.
SELECT point, count(DISTINCT asset_id) AS assets, count(*) AS samples,
       min(measured_at) AS first, max(measured_at) AS last
FROM twin_state
GROUP BY point
ORDER BY samples DESC;
```

The query a twin runs constantly:

```sql run seed=twin_state
SET TIME ZONE 'UTC';

-- The query a twin answers most often: the current value of everything.
-- DISTINCT ON is Postgres's one-row-per-group, and with the index in the seed
-- it reads one row per (asset, point) rather than scanning the history.
SELECT DISTINCT ON (asset_id, point)
  asset_id, point, measured_at, value
FROM twin_state
ORDER BY asset_id, point, measured_at DESC;
```

One row per `(asset, point)`, newest first, in a single pass. Note that `setpoint` and `supply-temp` come back side by side despite reporting at completely different rates — which is what the narrow shape buys.

And the gap, which is not in the table:

```sql run seed=twin_state
SET TIME ZONE 'UTC';

-- Finding the gaps, which a query over the rows themselves cannot do: the
-- missing readings are not in the table, so they have to be generated and
-- LEFT JOINed against. This is the shape every "why is my chart flat there"
-- investigation ends up needing.
WITH expected AS (
  SELECT
    a.asset_id,
    gs AS measured_at
  FROM (SELECT DISTINCT asset_id FROM twin_state WHERE point = 'supply-temp') a
  CROSS JOIN generate_series(
    timestamptz '2026-03-01 00:00:00+00',
    timestamptz '2026-03-01 11:55:00+00',
    interval '5 minutes'
  ) AS gs
)
SELECT
  e.asset_id,
  count(*) FILTER (WHERE s.value IS NULL) AS missing_samples,
  min(e.measured_at) FILTER (WHERE s.value IS NULL) AS gap_starts,
  max(e.measured_at) FILTER (WHERE s.value IS NULL) AS gap_ends
FROM expected e
LEFT JOIN twin_state s
  ON s.asset_id = e.asset_id AND s.point = 'supply-temp' AND s.measured_at = e.measured_at
GROUP BY e.asset_id
ORDER BY missing_samples DESC, e.asset_id;
```

## When to Use
- Any twin state store, where the narrow-versus-wide decision is made once and migrated with difficulty
- When the last-value query is slow, where `DISTINCT ON` plus the right index order is usually the whole fix
- When a chart has an unexplained flat section, where gap detection tells you whether the data is missing or the value genuinely did not move
- When designing retention, where the last-value cache has to be separated from the history it came from

## Common Mistakes
- **A column per measurement** — comfortable at ten points and a migration per sensor at a hundred
- **A subquery per point for the last value** — one query per point where `DISTINCT ON` does all of them in a pass
- **Indexing `(measured_at)` alone** — the last-value query narrows by asset and point first, and an index in that order lets it stop after one row
- **Looking for gaps in the rows** — the missing readings are not rows, so the expected timestamps have to be generated
- **Deriving the current value from the history at query time** — retention then deletes what the twin knew about a point that has gone quiet
- **Assuming one cadence** — a setpoint and a temperature in the same table report at wildly different rates, and any query that assumes an interval is wrong about one of them

## Further Reading
- [PostgreSQL `WITH` queries](https://www.postgresql.org/docs/current/queries-with.html) — common table expressions, which is what the gap-detection query is built from
- [PostgreSQL set-returning functions](https://www.postgresql.org/docs/current/functions-srf.html) — `generate_series`, the other half of gap detection
- [PostgreSQL table partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html) — the retention structure this table needs, covered in Lesson 477
- [TimescaleDB documentation](https://docs.timescale.com/) — where these three patterns are automated, and worth comparing against what you would build

```recall
- q: "State the narrow-versus-wide trade for a twin state table."
  must:
    - "narrow is (asset, point, measured_at, value) — one row shape, so a new point is an INSERT"
    - "wide is a column per measurement, so a new point is a migration"
    - "narrow gives up per-point typing, and units have to live elsewhere"

- q: "How is the last-value query answered, and what makes it fast?"
  must:
    - "DISTINCT ON, in a single pass over the table"
    - "an index on (asset, point, measured_at DESC)"
    - "the DESC lets the planner stop after the first row of each group"

- q: "Why can't a query find a reporting gap, and what is the shape that can?"
  must:
    - "the missing readings are absent rows, not rows containing nothing"
    - "generate the expected timestamps and LEFT JOIN the real ones against them"
    - "and the current value must be cached on ingest, or retention deletes what the twin knew"
```
