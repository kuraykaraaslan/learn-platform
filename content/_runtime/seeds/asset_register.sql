-- Seed for lessons 504, 505, 508 and 510. Four tables, because the course is
-- about what happens between them:
--
--   * `asset` is the register itself — one row per asset, with a `parent_id`
--     that makes it a tree (Site -> System -> Subsystem -> Component). Lesson
--     504 reads one row; Lesson 505 walks the tree with a recursive CTE.
--   * `work_order` is the maintenance history. Lesson 508's anti-join is a
--     LEFT JOIN from `asset` to this table looking for the NULLs.
--   * `condition_reading` is the inspection history — a score somebody recorded
--     on a visit, never a score this seed invented a formula for.
--   * `asset_import` is a SECOND register, from another system, that Lesson 510
--     has to merge into the first. Some tags match exactly, some match only
--     after normalisation, some match on serial instead of tag, and some do
--     not match anything.
--
-- The deliberate gaps, all of them ordinary:
--
--   * Two assets have NO work order of any kind, and one of them is the most
--     critical asset on the site (`PMP-1001A`). That is the row Lesson 508
--     exists to surface — neglect is an absence, and an absence is invisible
--     to every query that starts FROM work_order.
--   * `asset_import` contains one tag that is a typo, one that differs only in
--     spacing, one that differs only in case, one asset that was replaced so
--     its serial changed but its tag did not, and one asset that is simply not
--     in the first register at all.
DROP TABLE IF EXISTS asset_import;
DROP TABLE IF EXISTS condition_reading;
DROP TABLE IF EXISTS work_order;
DROP TABLE IF EXISTS asset;

CREATE TABLE asset (
  -- The functional location tag: what is stencilled on the equipment and what
  -- a work order names. It survives the component being replaced (Lesson 506).
  tag          text PRIMARY KEY,
  name         text NOT NULL,
  -- Self-reference: NULL for the site, the parent tag for everything else.
  parent_id    text REFERENCES asset (tag),
  asset_class  text NOT NULL,
  -- The manufacturer's serial of the unit currently installed. Changes when
  -- the unit is swapped; the tag does not. NULL for locations that are not a
  -- single serialised unit (a site, a system).
  serial       text,
  -- 1 (run to failure is fine) to 5 (failure stops the whole site). Recorded
  -- by the organisation, from its own consequence table — Lesson 507 builds
  -- one rather than quoting a number.
  criticality  int NOT NULL DEFAULT 3,
  installed_on date,
  status       text NOT NULL DEFAULT 'in-service'
);

CREATE TABLE work_order (
  wo_id        int PRIMARY KEY,
  asset_tag    text NOT NULL REFERENCES asset (tag),
  -- 'PPM' planned preventive, 'CM' corrective (something broke).
  wo_type      text NOT NULL,
  summary      text NOT NULL,
  raised_on    date NOT NULL,
  completed_on date
);

CREATE TABLE condition_reading (
  reading_id  int PRIMARY KEY,
  asset_tag   text NOT NULL REFERENCES asset (tag),
  observed_on date NOT NULL,
  -- 1 (as new) to 5 (failed). An inspector's judgement on a visit.
  score       int NOT NULL,
  inspector   text NOT NULL
);

CREATE TABLE asset_import (
  import_tag    text PRIMARY KEY,
  import_name   text NOT NULL,
  import_serial text
);

-- The tree. Site -> System -> Subsystem -> Component, four levels deep.
INSERT INTO asset (tag, name, parent_id, asset_class, serial, criticality, installed_on, status) VALUES
  ('ST-NORTH',    'North Campus',                 NULL,          'site',       NULL,        3, NULL,          'in-service'),

  ('SYS-HVAC-B2', 'Block B HVAC',                 'ST-NORTH',    'system',     NULL,        4, NULL,          'in-service'),
  ('AHU-B2-01',   'Air Handling Unit B2-01',      'SYS-HVAC-B2', 'subsystem',  NULL,        4, '2014-06-01',  'in-service'),
  ('FAN-B2-01',   'Supply Fan B2-01',             'AHU-B2-01',   'component',  'SN-FAN-7741', 4, '2014-06-01', 'in-service'),
  ('COIL-B2-01',  'Cooling Coil B2-01',           'AHU-B2-01',   'component',  'SN-CL-2210',  3, '2014-06-01', 'in-service'),
  ('FILT-B2-01',  'Filter Bank B2-01',            'AHU-B2-01',   'component',  NULL,          2, '2022-03-10', 'in-service'),
  ('AHU-B2-02',   'Air Handling Unit B2-02',      'SYS-HVAC-B2', 'subsystem',  NULL,        3, '2014-06-01',  'in-service'),
  ('FAN-B2-02',   'Supply Fan B2-02',             'AHU-B2-02',   'component',  'SN-FAN-7742', 3, '2019-09-20', 'in-service'),
  ('COIL-B2-02',  'Cooling Coil B2-02',           'AHU-B2-02',   'component',  'SN-CL-2214',  3, '2014-06-01', 'in-service'),

  ('SYS-WATER',   'Domestic Water',               'ST-NORTH',    'system',     NULL,        5, NULL,          'in-service'),
  ('PMP-SET-01',  'Booster Pump Set 01',          'SYS-WATER',   'subsystem',  NULL,        5, '2013-02-15',  'in-service'),
  ('PMP-1001A',   'Booster Pump 1001A',           'PMP-SET-01',  'component',  'SN-P-55019',  5, '2013-02-15', 'in-service'),
  ('PMP-1001B',   'Booster Pump 1001B',           'PMP-SET-01',  'component',  'SN-P-55021',  5, '2020-11-02', 'in-service'),
  ('PRV-1001',    'Pressure Reducing Valve 1001', 'PMP-SET-01',  'component',  'SN-V-3390',   4, '2013-02-15', 'in-service'),
  ('TNK-01',      'Break Tank 01',                'SYS-WATER',   'subsystem',  NULL,        4, '2013-02-15',  'in-service'),

  ('SYS-ELEC',    'LV Distribution',              'ST-NORTH',    'system',     NULL,        4, NULL,          'in-service'),
  ('DB-B2-L1',    'Distribution Board B2 L1',     'SYS-ELEC',    'subsystem',  NULL,        4, '2014-06-01',  'in-service'),
  ('ACB-B2-L1',   'Air Circuit Breaker B2 L1',    'DB-B2-L1',    'component',  'SN-ACB-118',  4, '2014-06-01', 'in-service'),
  ('MTR-B2-L1',   'Utility Meter B2 L1',          'DB-B2-L1',    'component',  'SN-MTR-9004', 2, '2014-06-01', 'in-service'),
  ('DB-B2-L2',    'Distribution Board B2 L2',     'SYS-ELEC',    'subsystem',  NULL,        3, '2014-06-01',  'in-service'),

  ('SYS-FIRE',    'Fire Protection',              'ST-NORTH',    'system',     NULL,        5, NULL,          'in-service'),
  ('FP-PUMP-01',  'Fire Pump 01',                 'SYS-FIRE',    'component',  'SN-FP-4471',  5, '2013-02-15', 'in-service'),
  ('FP-TANK-01',  'Fire Water Tank 01',           'SYS-FIRE',    'component',  NULL,          5, '2013-02-15', 'in-service');

-- Work orders. Note which assets appear here and which never do.
INSERT INTO work_order (wo_id, asset_tag, wo_type, summary, raised_on, completed_on) VALUES
  (5001, 'FAN-B2-01',  'PPM', 'Annual belt and bearing check',         '2024-02-05', '2024-02-06'),
  (5002, 'FAN-B2-01',  'CM',  'Bearing noise reported, bearing replaced', '2024-08-12', '2024-08-14'),
  (5003, 'COIL-B2-01', 'PPM', 'Coil clean and fin comb',               '2024-03-01', '2024-03-01'),
  (5004, 'FILT-B2-01', 'PPM', 'Filter media change',                   '2024-01-15', '2024-01-15'),
  (5005, 'FILT-B2-01', 'PPM', 'Filter media change',                   '2024-07-15', '2024-07-16'),
  (5006, 'FAN-B2-02',  'PPM', 'Annual belt and bearing check',         '2024-02-19', '2024-02-19'),
  (5007, 'COIL-B2-02', 'PPM', 'Coil clean and fin comb',               '2024-03-04', '2024-03-05'),
  (5008, 'PMP-1001B',  'PPM', 'Vibration survey and alignment',        '2024-04-10', '2024-04-11'),
  (5009, 'PMP-1001B',  'CM',  'Mechanical seal weeping, seal kit fitted', '2024-09-03', '2024-09-06'),
  (5010, 'PRV-1001',   'PPM', 'Setpoint verification',                 '2024-05-20', '2024-05-20'),
  (5011, 'ACB-B2-L1',  'PPM', 'Thermographic survey',                  '2024-06-11', '2024-06-11'),
  (5012, 'MTR-B2-L1',  'PPM', 'Meter read verification',               '2024-06-11', '2024-06-11'),
  (5013, 'FP-PUMP-01', 'PPM', 'Weekly churn test',                     '2024-08-26', '2024-08-26'),
  (5014, 'FP-PUMP-01', 'PPM', 'Weekly churn test',                     '2024-09-02', '2024-09-02'),
  (5015, 'TNK-01',     'CM',  'Level probe reading erratic, probe cleaned', '2024-07-28', '2024-07-30');

-- Deliberately absent from work_order: PMP-1001A (criticality 5), FP-TANK-01
-- (criticality 5), COIL-B2-02 is present, DB-B2-L2, AHU-B2-01/02 (subsystems),
-- and every system/site row. Lesson 508 is about telling the meaningful gap
-- (PMP-1001A) apart from the rows that were never meant to carry a work order.

INSERT INTO condition_reading (reading_id, asset_tag, observed_on, score, inspector) VALUES
  (7001, 'FAN-B2-01',  '2024-02-05', 2, 'a.reyes'),
  (7002, 'FAN-B2-01',  '2024-08-12', 4, 'a.reyes'),
  (7003, 'FAN-B2-01',  '2024-09-10', 2, 'a.reyes'),
  (7004, 'COIL-B2-01', '2024-03-01', 3, 'a.reyes'),
  (7005, 'PMP-1001A',  '2024-04-10', 3, 'd.okafor'),
  (7006, 'PMP-1001A',  '2024-09-18', 4, 'd.okafor'),
  (7007, 'PMP-1001B',  '2024-04-10', 2, 'd.okafor'),
  (7008, 'PRV-1001',   '2024-05-20', 3, 'd.okafor'),
  (7009, 'FP-PUMP-01', '2024-09-02', 2, 'd.okafor'),
  (7010, 'FP-TANK-01', '2024-09-18', 4, 'd.okafor'),
  (7011, 'ACB-B2-L1',  '2024-06-11', 2, 't.novak');

-- The second register. Match quality, row by row:
--   PMP-1001A / PMP-1001B / PRV-1001 : exact tag match
--   'FAN B2 01'   : matches FAN-B2-01 only after separators are normalised
--   'coil-b2-01'  : matches COIL-B2-01 only after case folding
--   'FAN-B2-1'    : a typo for FAN-B2-02 (or FAN-B2-01) — edit distance 1 from
--                   two real tags at once, so it cannot be auto-resolved
--   'FIRE-PUMP-1' : no tag match; its serial SN-FP-4471 matches FP-PUMP-01
--   'CHW-CHILLER-01' : not in the first register at all
INSERT INTO asset_import (import_tag, import_name, import_serial) VALUES
  ('PMP-1001A',       'Booster Pump 1001A',        'SN-P-55019'),
  ('PMP-1001B',       'Booster Pump 1001B',        'SN-P-55021'),
  ('PRV 1001',        'PRV 1001',                  'SN-V-3390'),
  ('FAN B2 01',       'Supply Fan B2-01',          'SN-FAN-7741'),
  ('coil-b2-01',      'Cooling Coil B2-01',        'SN-CL-2210'),
  ('FAN-B2-1',        'Supply Fan (Block B)',      NULL),
  ('FIRE-PUMP-1',     'Fire Pump 01',              'SN-FP-4471'),
  ('CHW-CHILLER-01',  'Chiller 01',                'SN-CH-8800');

CREATE INDEX work_order_asset ON work_order (asset_tag);
CREATE INDEX condition_reading_asset ON condition_reading (asset_tag);
CREATE INDEX asset_parent ON asset (parent_id);
ANALYZE asset;
ANALYZE work_order;
ANALYZE condition_reading;
ANALYZE asset_import;
