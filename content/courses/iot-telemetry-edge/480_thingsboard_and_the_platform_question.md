# 480. ThingsBoard and the Platform Question: What You Get, What You Hand Over

## What It Is
At some point in every telemetry project someone asks whether to use a platform. ThingsBoard is a common answer, and the useful way to evaluate it is not a feature list — feature lists age badly and are the same for every product in the category. It is to look at the **data model** it imposes, because that is what you will be living inside, and to build the equivalent by hand once, because that is the only honest measure of what it is doing for you.

Three distinctions carry most of the value.

**Device and asset are separate entities.** A device is a thing that measures; an asset is a thing that exists — a building, a room, a pump. A device is attached to an asset and can be replaced without the asset losing its history. Conflating them is the single most consequential modelling mistake in this domain, because a sensor swap then either orphans two years of readings or silently attributes the new sensor's data to the old one's identity. This is the same split IFC makes between an element and the property sets describing it (Lesson 436), for the same reason.

**Telemetry and attributes are different kinds of data.** Telemetry is a series: append-only, keyed by device and instant, queried over ranges. An attribute is current state: one value per key, overwritten in place, with no history. A firmware version is an attribute. A temperature is telemetry. Storing a firmware version as telemetry gives you a time series of a value that changes four times a year; storing a temperature as an attribute throws away everything except the last reading. The scopes — what the server knows, what is shared with the device, what the device reports — are the desired-versus-reported model from Lesson 479 with names attached.

**A rule engine is a pipeline you configure rather than deploy.** Incoming messages pass through a graph of nodes that filter, transform, enrich, store and act. What that buys is that a change to alerting logic is a configuration change; what it costs is that the logic is now in a form your version control, code review and test suite do not see — which is the real hand-over and the one worth arguing about.

The version matters and moves: this describes the model as documented at the time of writing, and the platform's own documentation is the current authority.

```quiz
- q: "A sensor is replaced with a new unit in the same room. What does the device/asset split protect?"
  anchor: "can be replaced without the asset losing its history"
  options:
    - text: "Nothing — the readings belong to the room either way"
      correct: false
      why: "Only if the room is a modelled entity. Without it, the readings belong to a device that no longer exists."
    - text: "The room's history, which survives the swap because the readings were attached to a device attached to the room"
      correct: true
      why: "Conflate them and the swap either orphans the old data or attributes new readings to the old identity."
    - text: "The device's warranty record"
      correct: false
      why: "Real and not the point. The question is where the measurement history lives."

- q: "Where should a device's firmware version be stored?"
  anchor: "An attribute is current state: one value per key, overwritten in place"
  options:
    - text: "As telemetry, so you have a history of versions"
      correct: false
      why: "That is a time series of a value that changes a few times a year, and it makes the current value a query rather than a lookup."
    - text: "As an attribute — current state, overwritten in place"
      correct: true
      why: "Which is exactly what the desired-versus-reported model of Lesson 479 needs it to be."
    - text: "In both, since the distinction is a convention"
      correct: false
      why: "It is a storage and query model, not a convention: the two are indexed and retained differently."
```

## Key Concepts
- **Evaluate the data model, not the feature list** — features change, the model is what you live in
- **Device versus asset**: a thing that measures against a thing that exists
- **A device can be replaced; the asset keeps its history** — the reason the split exists
- **Telemetry**: append-only series, keyed by device and instant, queried over ranges
- **Attribute**: current state, one value per key, overwritten, no history
- **Scopes** (server, shared, client) are Lesson 479's desired-versus-reported with names
- **Rule engine**: a configurable pipeline of filter, transform, enrich, store, act
- **The hand-over is that the logic leaves your repository** — no version control, no review, no tests
- **Building it by hand once** is the only honest measure of what the platform provides
- **The buy-or-build criteria are model criteria**, not feature comparisons

## Example Code
The platform's data model, built by hand in ordinary Postgres. Not to argue against the platform — to see the size of what it does:

```sql run
SET TIME ZONE 'UTC';

-- The three tables an IoT platform gives you, built by hand so the shape is
-- visible. First the two entity kinds, because conflating them is the design
-- mistake the split exists to prevent.
CREATE TABLE asset (
  asset_id text PRIMARY KEY,
  name     text NOT NULL,
  parent   text REFERENCES asset (asset_id)
);

CREATE TABLE device (
  device_id text PRIMARY KEY,
  name      text NOT NULL,
  -- A device measures an asset; it is not the asset. Replace the sensor and
  -- the asset's history has to survive, which this column is what allows.
  asset_id  text NOT NULL REFERENCES asset (asset_id)
);

-- Attributes: current state about a device, overwritten in place. There is
-- exactly one row per key, and no history — which is the whole distinction
-- from telemetry below.
CREATE TABLE device_attribute (
  device_id  text NOT NULL REFERENCES device (device_id),
  scope      text NOT NULL CHECK (scope IN ('server', 'shared', 'client')),
  key        text NOT NULL,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (device_id, scope, key)
);

-- Telemetry: measurements over time, append-only, keyed by device and instant.
-- The key is what makes the ingest idempotent, exactly as in Lesson 475.
CREATE TABLE device_telemetry (
  device_id   text NOT NULL REFERENCES device (device_id),
  key         text NOT NULL,
  measured_at timestamptz NOT NULL,
  value       double precision NOT NULL,
  PRIMARY KEY (device_id, key, measured_at)
);

INSERT INTO asset VALUES
  ('site-riverside', 'Riverside Depot', NULL),
  ('bldg-depot',     'Depot building',  'site-riverside'),
  ('room-plant',     'Plant room',      'bldg-depot');

INSERT INTO device VALUES
  ('dev-0041', 'Plant room temp/humidity', 'room-plant'),
  ('dev-0042', 'Depot ambient',            'bldg-depot');

INSERT INTO device_attribute VALUES
  ('dev-0041', 'server', 'firmware',      '"1.4.2"',        '2026-03-01 00:00:00+00'),
  ('dev-0041', 'server', 'battery_pct',   '61',             '2026-03-01 06:00:00+00'),
  ('dev-0041', 'shared', 'report_seconds','600',            '2026-02-20 00:00:00+00'),
  ('dev-0042', 'server', 'firmware',      '"1.3.9"',        '2026-01-11 00:00:00+00');

INSERT INTO device_telemetry (device_id, key, measured_at, value)
SELECT 'dev-0041', 'celsius',
       timestamptz '2026-03-01 00:00:00+00' + (i * interval '10 minutes'),
       round((18.0 + 4.0 * sin(i * 0.21))::numeric, 2)
FROM generate_series(0, 143) AS i;

-- The query a dashboard actually asks: latest value per device, per key.
-- DISTINCT ON is Postgres's answer; a platform calls this "latest telemetry"
-- and does it for you.
SELECT DISTINCT ON (device_id, key) device_id, key, measured_at, value
FROM device_telemetry
ORDER BY device_id, key, measured_at DESC;
```

And the two queries that show what the model is for:

```sql run
-- The query that shows why the asset/device split earns its keep: roll a
-- measurement up the asset hierarchy, without the readings knowing anything
-- about the building.
WITH RECURSIVE tree AS (
  SELECT asset_id, name, asset_id AS root FROM asset WHERE parent IS NULL
  UNION ALL
  SELECT a.asset_id, a.name, t.root FROM asset a JOIN tree t ON a.parent = t.asset_id
)
SELECT
  t.root                          AS site,
  count(DISTINCT d.device_id)     AS devices,
  count(dt.value)                 AS readings,
  round(avg(dt.value)::numeric, 2) AS mean_celsius
FROM tree t
JOIN device d ON d.asset_id = t.asset_id
LEFT JOIN device_telemetry dt ON dt.device_id = d.device_id AND dt.key = 'celsius'
GROUP BY t.root;

-- And the one a platform makes trivial and a hand-built system does not:
-- everything a device currently claims about itself, in one row.
SELECT device_id, jsonb_object_agg(key, value) AS current_state
FROM device_attribute
WHERE scope = 'server'
GROUP BY device_id
ORDER BY device_id;
```

Roughly sixty lines of DDL and two queries. That is the honest lower bound on what a platform gives you for this part — and it is genuinely not very much, which is why the decision turns on the rule engine, the dashboards, the device management and the operational burden rather than on the schema.

## When to Use
- Early in a project, when the model can still be chosen rather than migrated to
- When comparing platforms, where the schema they impose is a more durable comparison than the feature matrix
- When deciding whether to adopt one at all, where the question is which criteria decide it rather than which product wins a feature comparison
- When integrating with one, since knowing which of your concepts maps onto device, asset, telemetry and attribute is the whole integration

## Common Mistakes
- **Conflating device and asset** — the sensor swap then orphans the history or misattributes it, and both are discovered a year later
- **Storing state as telemetry** — a firmware version becomes a time series, and the current value becomes a query with an ordering
- **Storing measurements as attributes** — everything except the last reading is gone, permanently and silently
- **Evaluating on features** — the feature list is the same across the category and changes faster than the documentation
- **Putting business logic in the rule engine without a plan for it** — it is outside version control, code review and the test suite, which is the real trade
- **Assuming the model can be escaped later** — an export gives you the rows; the concepts the data was shaped around leave with the platform

## Further Reading
- [ThingsBoard documentation](https://thingsboard.io/docs/) — the entity model, attribute scopes and rule engine, and the current authority on all three
- [ThingsBoard telemetry documentation](https://thingsboard.io/docs/user-guide/telemetry/) — the telemetry-versus-attribute distinction as the platform itself states it
- [PostgreSQL table partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html) — what the hand-built version needs next, and what a platform is quietly doing for you (Lesson 477)

```recall
- q: "State the device/asset distinction and the failure it prevents."
  must:
    - "a device is a thing that measures; an asset is a thing that exists"
    - "a device is attached to an asset and can be replaced"
    - "conflating them means a sensor swap orphans the history or misattributes it"

- q: "Distinguish telemetry from attributes, with an example each."
  must:
    - "telemetry is an append-only series keyed by device and instant, queried over ranges — a temperature"
    - "an attribute is current state, one value per key, overwritten, no history — a firmware version"

- q: "What is the real hand-over when adopting a rule engine?"
  must:
    - "the logic becomes configuration rather than code"
    - "so it leaves version control, code review and the test suite"
    - "which is the trade worth arguing about, rather than the feature list"
```
