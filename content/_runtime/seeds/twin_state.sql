-- Seed for lesson 487's twin-state queries. One narrow table, which is the
-- whole design decision: `(asset, point, ts, value)` rather than a column per
-- measurement, because the set of points a twin carries is open-ended and a
-- column per point is a migration per sensor.
--
-- Three things are in here on purpose, because a twin's state table meets all
-- three within a week of going live:
--
--   * gaps — `ahu-2/supply-temp` stops reporting for two hours, so a chart
--     drawn by joining on time has nothing to join to;
--   * late arrivals — one device's readings land hours after they were
--     measured (Lesson 474), which is why `measured_at` and not arrival time
--     is the key;
--   * a point with a different cadence — `plant/flow-rate` reports every
--     thirty minutes while the temperatures report every five, so any query
--     that assumes one interval is wrong about one of them.
--
-- Every value is a fixed function of the row number. No random().
DROP TABLE IF EXISTS twin_state;

CREATE TABLE twin_state (
  asset_id    text        NOT NULL,
  point       text        NOT NULL,
  measured_at timestamptz NOT NULL,
  value       double precision NOT NULL,
  -- The identity of a state sample, as Lesson 475 argued for readings. Late
  -- arrival of something already stored is a no-op rather than a duplicate.
  PRIMARY KEY (asset_id, point, measured_at)
);

-- Four temperature points, every five minutes for twelve hours.
INSERT INTO twin_state (asset_id, point, measured_at, value)
SELECT
  'ahu-' || a,
  'supply-temp',
  timestamptz '2026-03-01 00:00:00+00' + (i * interval '5 minutes'),
  round((18.0 + 2.5 * sin((i + a * 23) * 0.06))::numeric, 2)
FROM generate_series(1, 4) AS a, generate_series(0, 143) AS i
-- The gap: ahu-2 reports nothing between 04:00 and 06:00.
WHERE NOT (a = 2 AND i BETWEEN 48 AND 71);

-- A point on a different cadence entirely.
INSERT INTO twin_state (asset_id, point, measured_at, value)
SELECT
  'plant',
  'flow-rate',
  timestamptz '2026-03-01 00:00:00+00' + (i * interval '30 minutes'),
  round((3.2 + 0.4 * cos(i * 0.31))::numeric, 2)
FROM generate_series(0, 23) AS i;

-- A setpoint, which changes rarely and is still state rather than telemetry.
INSERT INTO twin_state (asset_id, point, measured_at, value) VALUES
  ('ahu-1', 'setpoint', '2026-03-01 00:00:00+00', 18.0),
  ('ahu-1', 'setpoint', '2026-03-01 07:30:00+00', 20.0),
  ('ahu-2', 'setpoint', '2026-03-01 00:00:00+00', 18.0),
  ('ahu-3', 'setpoint', '2026-03-01 00:00:00+00', 18.0),
  ('ahu-4', 'setpoint', '2026-03-01 00:00:00+00', 18.0);

-- The index the last-value query needs, and the reason it is in this order:
-- (asset, point) narrows, and measured_at DESC puts the newest first so the
-- planner can stop after one row per group.
CREATE INDEX twin_state_latest ON twin_state (asset_id, point, measured_at DESC);
ANALYZE twin_state;
