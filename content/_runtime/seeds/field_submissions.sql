-- Seed for lessons 495, 502 and 503. Three tables, because the lesson is in
-- the relationship between them:
--
--   * `submission_attempt` is the raw upload log, including every retry the
--     field app made — the same arrivals a naive server would have stored;
--   * `field_submission` is where records are supposed to end up, keyed on the
--     id the DEVICE generated at capture time;
--   * `asset_register` is the model-derived list a submission is validated
--     against, with two deliberate gaps.
--
-- The duplicates are injected by cause, not sprinkled: a lost response, a
-- resent batch, and an app relaunch that reloaded its queue from disk. All
-- three are correct behaviour for an offline client.
--
-- Two validation defects are also deliberate: one submission names an asset
-- that is not in the register at all, and one names an asset on a different
-- storey from the one the inspector recorded.
DROP TABLE IF EXISTS submission_attempt;
DROP TABLE IF EXISTS field_submission;
DROP TABLE IF EXISTS asset_register;

-- The model-derived register. Lesson 503 validates against this.
CREATE TABLE asset_register (
  asset_tag text PRIMARY KEY,
  storey_id text NOT NULL,
  ifc_type  text NOT NULL
);

CREATE TABLE field_submission (
  -- Generated on the device, at capture time, with no network. This is the
  -- primary key, which is what makes a retry a no-op.
  client_id   text PRIMARY KEY,
  asset_tag   text NOT NULL,
  storey_id   text NOT NULL,
  finding     text NOT NULL,
  captured_at timestamptz NOT NULL,
  -- Metres, as the device reported it. Lesson 497: a position is a
  -- measurement, and this column is what says how good it is.
  accuracy_m  double precision,
  -- Bytes uploaded so far against the total. Lesson 502's partial upload.
  photo_bytes_total    bigint,
  photo_bytes_received bigint
);

CREATE TABLE submission_attempt (
  attempt_no  int PRIMARY KEY,
  client_id   text NOT NULL,
  asset_tag   text NOT NULL,
  storey_id   text NOT NULL,
  finding     text NOT NULL,
  captured_at timestamptz NOT NULL,
  accuracy_m  double precision,
  cause       text NOT NULL
);

INSERT INTO asset_register (asset_tag, storey_id, ifc_type) VALUES
  ('AT-0141', 'L01', 'IfcPump'),
  ('AT-0142', 'L01', 'IfcSensor'),
  ('AT-0155', 'L01', 'IfcAirTerminal'),
  ('AT-0163', 'L02', 'IfcValve'),
  ('AT-0170', 'L02', 'IfcFan'),
  ('AT-0181', 'L03', 'IfcPump');

-- Twelve captures across three days. Positions vary in reported accuracy,
-- including two that are too imprecise to place an asset at all.
INSERT INTO submission_attempt (attempt_no, client_id, asset_tag, storey_id, finding, captured_at, accuracy_m, cause) VALUES
  (1,  'f3a1-0001', 'AT-0141', 'L01', 'corrosion on flange',  '2026-03-01 08:12:00+00',    6, 'first attempt'),
  (2,  'f3a1-0002', 'AT-0141', 'L01', 'gasket weeping',       '2026-03-01 08:19:00+00',    9, 'first attempt'),
  (3,  'f3a1-0002', 'AT-0141', 'L01', 'gasket weeping',       '2026-03-01 08:19:00+00',    9, 'retry: response lost'),
  (4,  'f3a1-0003', 'AT-0155', 'L01', 'label illegible',      '2026-03-01 09:41:00+00',   14, 'first attempt'),
  (5,  'f3a1-0003', 'AT-0155', 'L01', 'label illegible',      '2026-03-01 09:41:00+00',   14, 'batch resent'),
  (6,  'f3a1-0004', 'AT-0163', 'L02', 'guard missing',        '2026-03-02 07:55:00+00',  850, 'batch resent'),
  (7,  'f3a1-0005', 'AT-0163', 'L02', 'vibration audible',    '2026-03-02 08:02:00+00',  920, 'first attempt'),
  (8,  'f3a1-0004', 'AT-0163', 'L02', 'guard missing',        '2026-03-02 07:55:00+00',  850, 'app relaunched'),
  (9,  'f3a1-0005', 'AT-0163', 'L02', 'vibration audible',    '2026-03-02 08:02:00+00',  920, 'app relaunched'),
  (10, 'f3a1-0006', 'AT-0170', 'L02', 'access blocked',       '2026-03-03 11:30:00+00',   11, 'first attempt'),
  -- An asset tag that is not in the register: mistyped, or an asset nobody
  -- modelled. Lesson 503 finds it.
  (11, 'f3a1-0007', 'AT-0199', 'L02', 'pipe support loose',   '2026-03-03 11:52:00+00',    8, 'first attempt'),
  -- A real asset, recorded on the wrong storey. Both values are valid and the
  -- pair is not, which is the only kind of defect a join can find.
  (12, 'f3a1-0008', 'AT-0181', 'L02', 'insulation damaged',   '2026-03-03 12:20:00+00',    7, 'first attempt');

-- Photo uploads, two of which were interrupted. Lesson 502 resumes them.
INSERT INTO field_submission (client_id, asset_tag, storey_id, finding, captured_at, accuracy_m, photo_bytes_total, photo_bytes_received)
SELECT DISTINCT ON (client_id)
  client_id, asset_tag, storey_id, finding, captured_at, accuracy_m,
  CASE client_id
    WHEN 'f3a1-0001' THEN 2411008
    WHEN 'f3a1-0004' THEN 3145728
    WHEN 'f3a1-0006' THEN 1887436
    ELSE NULL
  END,
  CASE client_id
    WHEN 'f3a1-0001' THEN 2411008
    -- Cut off at about 40%.
    WHEN 'f3a1-0004' THEN 1245184
    -- Cut off almost immediately.
    WHEN 'f3a1-0006' THEN 65536
    ELSE NULL
  END
FROM submission_attempt
ORDER BY client_id, attempt_no;

CREATE INDEX submission_attempt_client ON submission_attempt (client_id);
ANALYZE asset_register;
ANALYZE field_submission;
ANALYZE submission_attempt;
