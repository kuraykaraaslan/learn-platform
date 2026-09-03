# 491. Simulation Output vs Observation: Keeping Them Apart in One Schema

## What It Is
A twin that only records what happened is a history. A twin that also holds what a model *predicts* is more useful and considerably more dangerous, because the two kinds of number look identical in a table and mean opposite things.

An **observation** is a measurement: something physical produced it, it has a device behind it, and its error bars come from the sensor. A **simulation output** is a computation: a model produced it, it has assumptions behind it, and its error bars come from those assumptions. Put both in a `value` column and within a month somebody will compute a monthly average across the two, publish it, and be asked where the number came from.

The fix is not two tables. Two tables sound clean and produce a system where every query has to be written twice, and the one that matters — comparing the prediction against what actually happened — becomes a join nobody maintains. The fix is **one table with the distinction as a column**, and a rule that no query may aggregate across it without saying so.

What the column has to carry is more than a flag. A simulation output needs **which model version produced it**, because a prediction is only meaningful against the assumptions that generated it, and models get revised. It needs **when it was computed**, which is a different instant from the time it is a prediction *about* — so a simulated value has two timestamps where an observation has one. And it needs **what it was computed from**, at least by reference, because a prediction whose inputs cannot be identified cannot be re-examined when it turns out to be wrong.

The reason this matters more here than in most schemas is that the twin's whole value proposition is comparison. **"The model said 18 and the room was 24" is the sentence a twin exists to produce**, and it is only sayable if the two numbers were never mixed.

```quiz
- q: "Why not put simulation output and observations in separate tables?"
  anchor: "becomes a join nobody maintains"
  options:
    - text: "Because two tables cannot be indexed consistently"
      correct: false
      why: "They can. The cost is elsewhere."
    - text: "Because the query that matters compares them, and separating them makes that comparison a join nobody maintains"
      correct: true
      why: "One table with the distinction as a column keeps the comparison a WHERE clause."
    - text: "Because simulation outputs are too numerous to store separately"
      correct: false
      why: "Volume is usually the other way round — observations are more numerous."

- q: "How many timestamps does a simulated value need?"
  anchor: "a simulated value has two timestamps where an observation has one"
  options:
    - text: "One, like an observation"
      correct: false
      why: "It needs the instant it is a prediction ABOUT and the instant it was computed. Those differ, and a revised model recomputes the same prediction."
    - text: "Two — the instant it predicts, and the instant it was computed"
      correct: true
      why: "Plus the model version, because a prediction is only meaningful against its assumptions."
    - text: "Three, including when it was superseded"
      correct: false
      why: "Supersession is derivable from the computed-at times of the later rows. Two is what has to be stored."
```

## Key Concepts
- **Observation**: something physical produced it; its error comes from a sensor
- **Simulation output**: a model produced it; its error comes from assumptions
- **Both look like a `value`** — which is the entire problem
- **One table, the distinction as a column** — not two tables
- **Two tables make the comparison a join** nobody maintains
- **A simulated value needs a model version**: a prediction is meaningless without its assumptions
- **And two timestamps**: what it predicts, and when it was computed
- **And its inputs by reference**, or a wrong prediction cannot be re-examined
- **No aggregate crosses the column** without saying so, in a rule that is written down
- **The comparison is the twin's value** — "the model said 18 and the room was 24"

## Example Code
One table, with the distinction in the type rather than in a convention:

```sql
-- A twin's state store, with the two kinds of number kept apart by a column
-- rather than by a table. Lesson 487's narrow shape, plus the provenance a
-- prediction needs and an observation does not.
CREATE TYPE value_origin AS ENUM ('observed', 'simulated');

CREATE TABLE twin_value (
  asset_id    text        NOT NULL,
  point       text        NOT NULL,
  -- The instant the value is ABOUT. The same for both kinds.
  measured_at timestamptz NOT NULL,
  origin      value_origin NOT NULL,
  value       double precision NOT NULL,

  -- Observation-only: which device produced it.
  device_id   text,
  -- Simulation-only: which model, which run, and when it was computed. A
  -- prediction without these cannot be re-examined after it turns out wrong.
  model_id      text,
  model_version text,
  computed_at   timestamptz,

  -- A simulated value's identity includes its model version: the same model
  -- revised produces a NEW prediction about the same instant, and both are
  -- worth keeping.
  PRIMARY KEY (asset_id, point, measured_at, origin, model_version),

  -- The constraint that stops the two shapes blurring. Without it, an
  -- observation with a model_version and a simulation with a device_id are
  -- both insertable, and the column stops meaning anything.
  CONSTRAINT observation_shape CHECK (
    origin <> 'observed' OR (device_id IS NOT NULL AND model_id IS NULL AND computed_at IS NULL)
  ),
  CONSTRAINT simulation_shape CHECK (
    origin <> 'simulated' OR (device_id IS NULL AND model_id IS NOT NULL AND computed_at IS NOT NULL)
  )
);
```

Note the primary key. A simulated value's identity includes its model version, because a revised model produces a genuinely new prediction about the same instant and **both are worth keeping** — the pair of them is how you find out that a model revision improved anything.

```sql
-- The query the whole schema exists for: prediction against observation,
-- as one row per instant. Nothing here is a join across tables.
SELECT
  o.measured_at,
  o.value                        AS observed,
  s.value                        AS simulated,
  round((o.value - s.value)::numeric, 2) AS residual,
  s.model_version
FROM twin_value o
JOIN twin_value s
  ON s.asset_id = o.asset_id AND s.point = o.point AND s.measured_at = o.measured_at
 AND s.origin = 'simulated'
WHERE o.asset_id = 'ahu-1' AND o.point = 'supply-temp' AND o.origin = 'observed'
ORDER BY o.measured_at;

-- And the query nobody should write without meaning to. It is legal, it runs,
-- and it averages a measurement together with a guess about the same instant.
-- The `origin` column is what makes the mistake visible in review rather than
-- invisible in a table.
SELECT avg(value) FROM twin_value WHERE asset_id = 'ahu-1' AND point = 'supply-temp';
```

## When to Use
- Any twin that carries a prediction — an energy model, a thermal model, a demand forecast
- When a reported figure has to be defensible, where the origin column is how its provenance is answered
- When comparing a design intent against operation, which is the comparison a twin is usually bought for
- When a model is revised, where keeping both predictions is how the revision's value is measured

## Common Mistakes
- **One `value` column with no origin** — the two kinds become indistinguishable at the moment of insert, permanently
- **Two tables** — every query written twice, and the comparison becomes a join that rots
- **Storing a prediction without its model version** — it cannot be re-examined when it is wrong, which is when anybody looks
- **One timestamp on a simulated value** — the instant predicted and the instant computed are different, and a revision needs both
- **Aggregating across the origin column** — legal, runs, and produces a number that is neither a measurement nor a prediction
- **Overwriting a prediction when the model is revised** — the pair is the evidence that the revision helped
- **Treating a residual as a model error** — it is the difference between two things that each have their own uncertainty, and Lesson 493 is about saying so

## Further Reading
- [Digital Twin Definition Language (DTDL)](https://github.com/Azure/opendigitaltwins-dtdl) — how one ontology models a computed property alongside a telemetry one
- [Asset Administration Shell (Industrial Digital Twin Association)](https://industrialdigitaltwin.org/en/content-hub) — a second treatment, from a domain where simulation output is central
- [PostgreSQL `WITH` queries](https://www.postgresql.org/docs/current/queries-with.html) — for the residual analyses this schema is designed to support

```recall
- q: "Distinguish an observation from a simulation output, and say why the schema cares."
  must:
    - "an observation is a measurement, with a device behind it and sensor error"
    - "a simulation output is a computation, with assumptions behind it and model error"
    - "both look like a value column, which is the entire problem"

- q: "Why one table rather than two?"
  must:
    - "the query that matters compares them"
    - "two tables make that comparison a join nobody maintains"
    - "one table with origin as a column keeps it a WHERE clause"

- q: "What must a simulated value carry that an observation does not?"
  must:
    - "the model id and model version that produced it"
    - "the instant it was computed, as well as the instant it predicts"
    - "its inputs by reference, so a wrong prediction can be re-examined"
```
