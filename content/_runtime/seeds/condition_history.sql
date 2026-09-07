-- Seed for the condition-monitoring course (lessons 564, 565, 567 and 569).
--
-- `sensor_readings.sql` was built for lesson 475's duplicate question and is
-- the wrong shape here: this course needs a long, regular history per asset
-- with deliberate, *named* deviations in it. Four assets, hourly, 45 days.
--
-- Every value is derived from the timestamp by fixed arithmetic -- there is no
-- random() anywhere, so every reader sees the same table and every query in
-- the lessons returns the same rows.
--
-- The four assets are four teaching cases, and each one exists to defeat a
-- different naive analysis:
--
--   AHU-01  healthy. A daily cycle and a weekend drop, nothing else. The
--           control: any method that flags this one is producing false alarms.
--   AHU-02  degrading. From day 25 a slow upward ramp in vibration. Never
--           crosses a plausible fleet-wide alarm threshold inside the window,
--           which is the point of lesson 564.
--   AHU-03  re-baselined. A bearing replacement on day 20 steps the vibration
--           down permanently. Its "normal" before and after are different
--           machines, which is lesson 571.
--   AHU-04  spiky. One-sample jumps every 137th hour -- transport and sensor
--           artefacts, not machine behaviour. They wreck a mean and a standard
--           deviation, which is lesson 566.
--
-- `maintenance_event` is deliberately incomplete: AHU-02 is degrading and has
-- no event recorded against it at all. That absence is lesson 569's subject --
-- the labels a predictive model would need are exactly the rows nobody wrote.

DROP TABLE IF EXISTS maintenance_event;
DROP TABLE IF EXISTS asset_telemetry;

CREATE TABLE asset_telemetry (
  asset_id       text         NOT NULL,
  measured_at    timestamptz  NOT NULL,
  vibration_mm_s numeric(7,3) NOT NULL,
  motor_temp_c   numeric(6,2) NOT NULL,
  PRIMARY KEY (asset_id, measured_at)
);

CREATE TABLE maintenance_event (
  asset_id    text        NOT NULL,
  occurred_at timestamptz NOT NULL,
  kind        text        NOT NULL
);

INSERT INTO asset_telemetry (asset_id, measured_at, vibration_mm_s, motor_temp_c)
SELECT
  a.asset_id,
  t.ts,
  ROUND(
    (
      a.base
      -- daily cycle: the plant works harder in the afternoon
      + 0.30 * sin(2 * pi() * (EXTRACT(hour FROM t.ts)::float8 - 6) / 24)
      -- weekend: lower occupancy, lower load
      + CASE WHEN EXTRACT(isodow FROM t.ts) >= 6 THEN -0.45 ELSE 0 END
      -- AHU-02: degradation ramp from day 25, 0.022 mm/s per day
      + CASE WHEN a.asset_id = 'AHU-02' AND t.n > 25 * 24
             THEN 0.022 * ((t.n - 25 * 24)::float8 / 24) ELSE 0 END
      -- AHU-03: bearing replacement on day 20 drops it permanently
      + CASE WHEN a.asset_id = 'AHU-03' AND t.n > 20 * 24 THEN -0.60 ELSE 0 END
      -- AHU-04: one-sample artefacts, every 137th hour
      + CASE WHEN a.asset_id = 'AHU-04' AND t.n % 137 = 0 THEN 4.20 ELSE 0 END
      -- a small deterministic wobble so the series is not a smooth curve
      + 0.05 * sin(t.n::float8 * 1.7)
    )::numeric, 3),
  ROUND(
    (
      a.temp_base
      + 2.5 * sin(2 * pi() * (EXTRACT(hour FROM t.ts)::float8 - 6) / 24)
      + CASE WHEN EXTRACT(isodow FROM t.ts) >= 6 THEN -3.0 ELSE 0 END
      + CASE WHEN a.asset_id = 'AHU-02' AND t.n > 25 * 24
             THEN 0.18 * ((t.n - 25 * 24)::float8 / 24) ELSE 0 END
      + 0.4 * sin(t.n::float8 * 0.9)
    )::numeric, 2)
FROM (
  VALUES ('AHU-01', 2.10, 61.0),
         ('AHU-02', 2.60, 63.0),
         ('AHU-03', 3.40, 66.0),
         ('AHU-04', 2.30, 62.0)
) AS a(asset_id, base, temp_base)
CROSS JOIN (
  SELECT ts, n
  FROM generate_series(
         TIMESTAMPTZ '2026-04-01 00:00:00+00',
         TIMESTAMPTZ '2026-05-15 23:00:00+00',
         INTERVAL '1 hour'
       ) WITH ORDINALITY AS g(ts, n)
) AS t;

-- What the CMMS actually holds. Note what is not here: AHU-02 has no event of
-- any kind, and it is the asset that is degrading (lesson 569).
INSERT INTO maintenance_event (asset_id, occurred_at, kind) VALUES
  ('AHU-01', TIMESTAMPTZ '2026-04-08 09:00:00+00', 'planned service'),
  ('AHU-03', TIMESTAMPTZ '2026-04-21 07:00:00+00', 'bearing replacement'),
  ('AHU-03', TIMESTAMPTZ '2026-04-21 15:00:00+00', 'return to service'),
  ('AHU-04', TIMESTAMPTZ '2026-04-30 11:00:00+00', 'sensor re-seated'),
  ('AHU-01', TIMESTAMPTZ '2026-05-06 09:00:00+00', 'planned service');
