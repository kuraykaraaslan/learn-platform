-- Seed for lesson 475's deduplication queries. Two tables, because the whole
-- lesson lives in the gap between them:
--
--   * `reading_arrival` is what the gateway delivered — raw, unconstrained,
--     and containing every duplicate the transport produced;
--   * `sensor_reading` is where readings are supposed to end up, with the
--     identity constraint that makes a duplicate impossible.
--
-- The duplicates are injected on purpose and by cause, not sprinkled at
-- random: an acknowledgement that never got back, a second gateway that heard
-- the same uplink, and a store-and-forward flush that re-sent something
-- already delivered. Positions and values are derived from the row number by
-- fixed arithmetic, so every reader sees the same table.
DROP TABLE IF EXISTS reading_arrival;
DROP TABLE IF EXISTS sensor_reading;

CREATE TABLE sensor_reading (
  device_id   text        NOT NULL,
  measured_at timestamptz NOT NULL,
  celsius     numeric(5,2) NOT NULL,
  -- The identity of a reading is the PAIR. Two devices measuring at the same
  -- instant are two readings; the same device measuring twice at one instant
  -- cannot happen, and an arrival claiming it did is a duplicate.
  PRIMARY KEY (device_id, measured_at)
);

CREATE TABLE reading_arrival (
  device_id   text        NOT NULL,
  measured_at timestamptz NOT NULL,
  -- The ingest's own clock. Deliberately not part of the identity above:
  -- the same reading arriving twice has two different received_at values,
  -- which is exactly why it cannot be part of the key.
  received_at timestamptz NOT NULL,
  celsius     numeric(5,2) NOT NULL,
  cause       text        NOT NULL
);

-- 8 devices, 60 readings each at ten-minute intervals: 480 first deliveries.
INSERT INTO reading_arrival (device_id, measured_at, received_at, celsius, cause)
SELECT
  'dev-' || lpad(d::text, 4, '0'),
  timestamptz '2026-03-01 00:00:00+00' + (i * interval '10 minutes'),
  timestamptz '2026-03-01 00:00:00+00' + (i * interval '10 minutes') + interval '2 seconds',
  round((18.0 + 4.0 * sin((i + d * 7) * 0.21))::numeric, 2),
  'first delivery'
FROM generate_series(1, 8) AS d, generate_series(0, 59) AS i;

-- Cause 1: the ingest stored the reading and its acknowledgement was lost, so
-- the gateway sent the same uplink again about thirty seconds later.
INSERT INTO reading_arrival (device_id, measured_at, received_at, celsius, cause)
SELECT device_id, measured_at, received_at + interval '29 seconds', celsius, 'gateway retry, ack lost'
FROM reading_arrival
WHERE cause = 'first delivery' AND (extract(epoch FROM measured_at)::bigint / 600) % 7 = 0;

-- Cause 2: two gateways were in range and both forwarded the same
-- transmission, a second apart. Nothing failed; the network simply heard it
-- twice.
INSERT INTO reading_arrival (device_id, measured_at, received_at, celsius, cause)
SELECT device_id, measured_at, received_at + interval '1 second', celsius, 'second gateway'
FROM reading_arrival
WHERE cause = 'first delivery' AND (extract(epoch FROM measured_at)::bigint / 600) % 11 = 0;

-- Cause 3: one device lost its link for two hours and flushed its buffer on
-- reconnect, re-sending the last reading it had already delivered along with
-- the ones it had not. These arrive HOURS after they were measured, which is
-- what makes received_at useless as an ordering key.
INSERT INTO reading_arrival (device_id, measured_at, received_at, celsius, cause)
SELECT device_id, measured_at, timestamptz '2026-03-01 05:10:00+00', celsius, 'store-and-forward flush'
FROM reading_arrival
WHERE cause = 'first delivery'
  AND device_id = 'dev-0003'
  AND measured_at >= timestamptz '2026-03-01 03:00:00+00'
  AND measured_at <  timestamptz '2026-03-01 05:00:00+00';

CREATE INDEX reading_arrival_device ON reading_arrival (device_id, measured_at);
ANALYZE reading_arrival;
ANALYZE sensor_reading;
