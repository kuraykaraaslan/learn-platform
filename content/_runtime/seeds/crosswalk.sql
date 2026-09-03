-- Seed for lessons 515, 517, 519 and 520. Four tables, because "smart
-- infrastructure" is the join between systems that were never designed to be
-- joined:
--
--   * `id_crosswalk` maps one canonical asset key to the id it carries in each
--     source system (BIM, GIS, CMMS, SCADA, the public portal), WITH validity
--     time — `valid_from` / `valid_to`, NULL `valid_to` meaning "still current".
--     Lesson 515 resolves an id through it; lesson 520 asks it "AS OF 03:00".
--   * `topo_node` / `topo_edge` are the network as data — a small distribution
--     tree with feeders, segments and meters. Lesson 517 walks it.
--   * `feed_reading` is the public-facing sensor feed, with deliberately bad
--     rows for lesson 519's quality gate to catch.
--
-- The deliberate defects, all of them ordinary in an integration:
--
--   * TWO conflicting crosswalk rows: `SCADA` maps tag `RTU-07` to canonical
--     asset `A-0003` for an overlapping period during which `GIS` already maps
--     the same canonical asset to a different external id — and separately,
--     external id `MTR-112` is claimed by two canonical assets at once.
--   * ONE broken edge: `topo_edge` references node `N-END-9`, which is not in
--     `topo_node` — a segment drawn to a point that was deleted from the node
--     table but not the edge table.
--   * `feed_reading` contains: a value far outside the sensor's stated range,
--     a NULL where the feed contract says NOT NULL, a timestamp in the future,
--     a duplicate (same sensor, same instant), and a reading against a sensor
--     id that is not in any crosswalk.
DROP TABLE IF EXISTS feed_reading;
DROP TABLE IF EXISTS topo_edge;
DROP TABLE IF EXISTS topo_node;
DROP TABLE IF EXISTS id_crosswalk;

CREATE TABLE id_crosswalk (
  xwalk_id     int PRIMARY KEY,
  asset_key    text NOT NULL,          -- the canonical identity, chosen by the integration
  system       text NOT NULL,          -- BIM | GIS | CMMS | SCADA | PORTAL
  external_id  text NOT NULL,          -- the id that system uses
  valid_from   timestamptz NOT NULL,
  valid_to     timestamptz             -- NULL = still current
);

CREATE TABLE topo_node (
  node_id   text PRIMARY KEY,
  kind      text NOT NULL,             -- source | feeder | segment | meter
  asset_key text                       -- FK-ish into the crosswalk's canonical key
);

CREATE TABLE topo_edge (
  from_node text NOT NULL,
  to_node   text NOT NULL,
  relation  text NOT NULL DEFAULT 'feeds'
);

CREATE TABLE feed_reading (
  reading_id  int PRIMARY KEY,
  sensor_id   text NOT NULL,           -- an external id, PORTAL system
  observed_at timestamptz NOT NULL,
  value       double precision,
  unit        text NOT NULL,
  -- The feed contract's stated bounds for this sensor class. A public feed
  -- publishes these so a consumer can check, and lesson 519 does.
  min_valid   double precision NOT NULL,
  max_valid   double precision NOT NULL
);

-- The canonical assets are A-0001 .. A-0006. Each appears once per system,
-- except where a defect is injected.
INSERT INTO id_crosswalk (xwalk_id, asset_key, system, external_id, valid_from, valid_to) VALUES
  (1,  'A-0001', 'BIM',    '3vB9kQ0Xr4kPZ1cLmNsq00', '2019-01-01 00:00:00+00', NULL),
  (2,  'A-0001', 'GIS',    'gis.node.5512',          '2019-01-01 00:00:00+00', NULL),
  (3,  'A-0001', 'CMMS',   'FL-PS-01',               '2019-01-01 00:00:00+00', NULL),
  (4,  'A-0001', 'SCADA',  'RTU-01',                 '2019-01-01 00:00:00+00', NULL),
  (5,  'A-0001', 'PORTAL', 'sensor-ps01-flow',       '2020-06-01 00:00:00+00', NULL),

  (6,  'A-0002', 'BIM',    '1Kd4mYpQb7vTAeZrLs9wXc', '2019-01-01 00:00:00+00', NULL),
  (7,  'A-0002', 'GIS',    'gis.node.5513',          '2019-01-01 00:00:00+00', NULL),
  (8,  'A-0002', 'CMMS',   'FL-FD-01',               '2019-01-01 00:00:00+00', NULL),
  (9,  'A-0002', 'SCADA',  'RTU-02',                 '2019-01-01 00:00:00+00', NULL),

  (10, 'A-0003', 'BIM',    '2rSuRi_lD5$O4Op8DVOCkd', '2019-01-01 00:00:00+00', NULL),
  (11, 'A-0003', 'GIS',    'gis.node.5520',          '2019-01-01 00:00:00+00', NULL),
  (12, 'A-0003', 'CMMS',   'FL-SG-07',               '2019-01-01 00:00:00+00', NULL),
  -- SCADA originally pointed RTU-06 at A-0003 ...
  (13, 'A-0003', 'SCADA',  'RTU-06',                 '2019-01-01 00:00:00+00', '2023-03-15 09:00:00+00'),
  -- ... then a re-survey re-tagged it as RTU-07 from 2023-03-15. Fine so far.
  (14, 'A-0003', 'SCADA',  'RTU-07',                 '2023-03-15 09:00:00+00', NULL),

  (15, 'A-0004', 'BIM',    '0Vb4NsHkD1EQfXpTr8wLmY', '2019-01-01 00:00:00+00', NULL),
  (16, 'A-0004', 'GIS',    'gis.node.5531',          '2019-01-01 00:00:00+00', NULL),
  (17, 'A-0004', 'CMMS',   'FL-MT-12',               '2019-01-01 00:00:00+00', NULL),
  (18, 'A-0004', 'PORTAL', 'MTR-1112',               '2021-01-01 00:00:00+00', NULL),

  (19, 'A-0005', 'GIS',    'gis.node.5540',          '2019-01-01 00:00:00+00', NULL),
  (20, 'A-0005', 'CMMS',   'FL-MT-13',               '2019-01-01 00:00:00+00', NULL),
  -- DEFECT 1a: PORTAL id MTR-1112 is also claimed by A-0005, overlapping A-0004.
  (21, 'A-0005', 'PORTAL', 'MTR-1112',               '2022-07-01 00:00:00+00', NULL),

  (22, 'A-0006', 'BIM',    '3Xt7zPfNb2vgqR1YkEwNsq', '2019-01-01 00:00:00+00', NULL),
  (23, 'A-0006', 'GIS',    'gis.node.5541',          '2019-01-01 00:00:00+00', NULL),
  -- DEFECT 1b: SCADA still has an OPEN row for RTU-07 against A-0006, which
  -- overlaps xwalk_id 14 (RTU-07 -> A-0003). One SCADA tag, two live assets.
  (24, 'A-0006', 'SCADA',  'RTU-07',                 '2022-11-01 00:00:00+00', NULL);

-- The network: one source, two feeders, four segments, three meters.
INSERT INTO topo_node (node_id, kind, asset_key) VALUES
  ('N-SRC',   'source',  NULL),
  ('N-FD-1',  'feeder',  'A-0001'),
  ('N-FD-2',  'feeder',  'A-0002'),
  ('N-SG-1',  'segment', 'A-0003'),
  ('N-SG-2',  'segment', NULL),
  ('N-SG-3',  'segment', NULL),
  ('N-MT-1',  'meter',   'A-0004'),
  ('N-MT-2',  'meter',   'A-0005'),
  ('N-MT-3',  'meter',   'A-0006');

INSERT INTO topo_edge (from_node, to_node, relation) VALUES
  ('N-SRC',  'N-FD-1', 'feeds'),
  ('N-SRC',  'N-FD-2', 'feeds'),
  ('N-FD-1', 'N-SG-1', 'feeds'),
  ('N-FD-1', 'N-SG-2', 'feeds'),
  ('N-FD-2', 'N-SG-3', 'feeds'),
  ('N-SG-1', 'N-MT-1', 'feeds'),
  ('N-SG-2', 'N-MT-2', 'feeds'),
  ('N-SG-3', 'N-MT-3', 'feeds'),
  -- DEFECT 2: this segment feeds a node that is not in topo_node.
  ('N-SG-3', 'N-END-9', 'feeds');

-- The public feed. Good rows first, then one of each defect class.
INSERT INTO feed_reading (reading_id, sensor_id, observed_at, value, unit, min_valid, max_valid) VALUES
  (1001, 'sensor-ps01-flow', '2024-03-01 03:00:00+00', 42.1, 'l/s', 0, 200),
  (1002, 'sensor-ps01-flow', '2024-03-01 03:05:00+00', 41.8, 'l/s', 0, 200),
  (1003, 'sensor-ps01-flow', '2024-03-01 03:10:00+00', 44.0, 'l/s', 0, 200),
  (1004, 'MTR-1112',         '2024-03-01 03:00:00+00', 3.2,  'm3/h', 0, 50),
  (1005, 'MTR-1112',         '2024-03-01 03:15:00+00', 3.4,  'm3/h', 0, 50),
  -- out of range: 9999 l/s against a 0..200 bound
  (1006, 'sensor-ps01-flow', '2024-03-01 03:20:00+00', 9999, 'l/s', 0, 200),
  -- NULL value where the feed contract says NOT NULL
  (1007, 'sensor-ps01-flow', '2024-03-01 03:25:00+00', NULL, 'l/s', 0, 200),
  -- timestamp in the future relative to the feed's "now" (2024-03-01 04:00)
  (1008, 'MTR-1112',         '2025-01-01 00:00:00+00', 3.1,  'm3/h', 0, 50),
  -- exact duplicate of reading 1002 (same sensor, same instant, same value)
  (1009, 'sensor-ps01-flow', '2024-03-01 03:05:00+00', 41.8, 'l/s', 0, 200),
  -- sensor id that is in no crosswalk row at all
  (1010, 'ghost-sensor-x',   '2024-03-01 03:30:00+00', 12.0, 'l/s', 0, 200);

CREATE INDEX id_crosswalk_asset  ON id_crosswalk (asset_key);
CREATE INDEX id_crosswalk_system ON id_crosswalk (system, external_id);
CREATE INDEX topo_edge_from      ON topo_edge (from_node);
CREATE INDEX feed_reading_sensor ON feed_reading (sensor_id, observed_at);
ANALYZE id_crosswalk;
ANALYZE topo_node;
ANALYZE topo_edge;
ANALYZE feed_reading;
