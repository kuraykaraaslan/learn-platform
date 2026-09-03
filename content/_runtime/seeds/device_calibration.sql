-- Seed for lesson 534. Two tables:
--
--   * `raw_sample(device_id, taken_at, counts)` — the ADC output, exactly as
--     each of eight devices reported it, sampling the SAME room over one
--     morning. The devices differ only in their front end: a per-device true
--     offset (counts) and true gain error (ppm).
--   * `device_calibration(device_id, offset_counts, gain_ppm, calibrated_at,
--     cause)` — the correction measured for each device at calibration time.
--
-- The lesson's claim, shown by query and not by sentence:
--   1. The same raw count becomes a different temperature on each device.
--   2. The uncalibrated fleet's spread at one instant looks like weather.
--   3. Applying each device's calibration collapses that spread.
--
-- Three deviations, injected by named cause the way sensor_readings.sql does:
--   * dev-07 — `offset drift`: its true offset has moved since calibration, so
--     the stored correction is stale and it reads biased.
--   * dev-05 — `gain error`: calibration recorded offset but not gain, so a
--     large gain error survives correction and shows up as a slope.
--   * dev-08 — `never calibrated`: no row at all; the query must decide what to
--     do with it rather than silently dropping it.
--
-- Determinism: counts are `round()` of fixed arithmetic over a generate_series;
-- no random(). The conversion constant is 0.05 degC per count (a 12-bit ADC
-- reading a 10 mV/degC sensor on a 2.048 V reference — stated, not tuned).
DROP TABLE IF EXISTS raw_sample;
DROP TABLE IF EXISTS device_calibration;

CREATE TABLE device_calibration (
  device_id     text PRIMARY KEY,
  offset_counts int NOT NULL,
  gain_ppm      int NOT NULL,
  calibrated_at date NOT NULL,
  cause         text NOT NULL
);

CREATE TABLE raw_sample (
  device_id text NOT NULL,
  taken_at  timestamptz NOT NULL,
  counts    int NOT NULL,
  PRIMARY KEY (device_id, taken_at)
);

-- Per-device front-end truth used to GENERATE the raw counts. Not visible to
-- the queries — that is the point.
--   true_offset : the offset the device actually has now
--   true_gain   : its actual gain error, ppm
CREATE TEMP TABLE _truth (device_id text, true_offset int, true_gain int);
INSERT INTO _truth VALUES
  ('dev-01', 40,     0),
  ('dev-02', 55,   200),
  ('dev-03', 12,  -300),
  ('dev-04', 80,   150),
  ('dev-05', 33,  9000),   -- large gain error; calibration missed it
  ('dev-06', 60,  -180),
  ('dev-07', 70,   120),   -- true offset is 70; calibration table still says 24
  ('dev-08', 48,  -220);   -- never calibrated

-- One morning, 06:00 to 11:00, sampled every 30 minutes. The room warms
-- linearly from 19.0 to 22.5 degC — the SAME physical temperature for every
-- device at a given instant.
INSERT INTO raw_sample (device_id, taken_at, counts)
SELECT
  t.device_id,
  TIMESTAMPTZ '2026-02-03 06:00:00+00' + make_interval(mins => s.i * 30),
  round(
    t.true_offset
    + (19.0 + s.i * 0.3) / (0.05 * (1 + t.true_gain / 1000000.0))
  )::int
FROM _truth t
CROSS JOIN generate_series(0, 7) AS s(i);

-- The stored calibration. dev-08 is deliberately absent.
INSERT INTO device_calibration (device_id, offset_counts, gain_ppm, calibrated_at, cause) VALUES
  ('dev-01', 40,     0, DATE '2026-01-15', 'in tolerance'),
  ('dev-02', 55,   200, DATE '2026-01-15', 'in tolerance'),
  ('dev-03', 12,  -300, DATE '2026-01-15', 'in tolerance'),
  ('dev-04', 80,   150, DATE '2026-01-15', 'in tolerance'),
  ('dev-05', 33,     0, DATE '2026-01-15', 'gain error'),      -- gain not measured
  ('dev-06', 60,  -180, DATE '2026-01-15', 'in tolerance'),
  ('dev-07', 24,   120, DATE '2025-08-01', 'offset drift');    -- calibrated long ago; offset has moved

DROP TABLE _truth;

CREATE INDEX raw_sample_at ON raw_sample (taken_at);
ANALYZE raw_sample;
ANALYZE device_calibration;
