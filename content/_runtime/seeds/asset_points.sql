-- Seed for lesson 447's spatial-index queries. Ten thousand asset points,
-- built so the two techniques the lesson compares actually discriminate:
--
--   * the points are CLUSTERED, not spread evenly — real asset estates are,
--     and a geohash prefix only means anything when neighbours share one;
--   * there are enough rows for the planner to prefer an index over a scan,
--     which a hundred hand-written rows would never trigger;
--   * every position is derived from the row number by fixed arithmetic, so
--     the same table appears for every reader, on every run;
--   * `geohash` is computed by the encoder below rather than typed in, so the
--     column really is the geohash of the lat/lon beside it.
--
-- No random(): a seeded generator would still leave the reader wondering
-- whether their numbers matched the lesson's.
DROP TABLE IF EXISTS asset_points;
DROP FUNCTION IF EXISTS geohash_encode(double precision, double precision, int);

-- The standard geohash: interleave longitude and latitude bits, five bits per
-- character, base 32 with i, l, o and a removed. Lesson 447 walks through the
-- same algorithm in TypeScript.
CREATE FUNCTION geohash_encode(lat double precision, lon double precision, chars int)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  b32 text := '0123456789bcdefghjkmnpqrstuvwxyz';
  lat_lo double precision := -90;  lat_hi double precision := 90;
  lon_lo double precision := -180; lon_hi double precision := 180;
  is_lon boolean := true;
  bit int := 0; ch int := 0; out text := '';
  mid double precision;
BEGIN
  WHILE length(out) < chars LOOP
    IF is_lon THEN
      mid := (lon_lo + lon_hi) / 2;
      IF lon > mid THEN ch := ch * 2 + 1; lon_lo := mid; ELSE ch := ch * 2; lon_hi := mid; END IF;
    ELSE
      mid := (lat_lo + lat_hi) / 2;
      IF lat > mid THEN ch := ch * 2 + 1; lat_lo := mid; ELSE ch := ch * 2; lat_hi := mid; END IF;
    END IF;
    is_lon := NOT is_lon;
    bit := bit + 1;
    IF bit = 5 THEN out := out || substr(b32, ch + 1, 1); bit := 0; ch := 0; END IF;
  END LOOP;
  RETURN out;
END $$;

CREATE TABLE asset_points (
  id      int PRIMARY KEY,
  name    text NOT NULL,
  lat     double precision NOT NULL,
  lon     double precision NOT NULL,
  geohash text NOT NULL
);

-- 100 clusters of 100 points. The cluster centre comes from a low-discrepancy
-- sequence of the cluster number, so centres spread over the whole globe
-- without repeating; the offset inside a cluster is a fixed function of the row
-- number and stays within about half a kilometre, which is what makes a whole
-- cluster fit inside one 5-character geohash cell.
INSERT INTO asset_points (id, name, lat, lon, geohash)
SELECT
  i,
  'asset-' || lpad(i::text, 5, '0'),
  lat,
  lon,
  geohash_encode(lat, lon, 9)
FROM (
  SELECT
    i,
    round(lat_raw, 6)::double precision AS lat,
    -- Wrapped back into [-180, 180]. Without this the seed would hold
    -- longitudes no schema allows; with it, one cluster's points land on BOTH
    -- sides of the antimeridian — the case lesson 447's bounding box gets wrong.
    round(((lon_raw + 180.0) % 360.0 + 360.0) % 360.0 - 180.0, 6)::double precision AS lon
  FROM (
    SELECT
      i,
      (-60.0 + 130.0 * (((i % 100) * 0.6180339887) - floor((i % 100) * 0.6180339887))
        + 0.005 * sin(i * 2.399963))::numeric AS lat_raw,
      (-180.0 + 360.0 * (((i % 100) * 0.7548776662) - floor((i % 100) * 0.7548776662))
        + 0.005 * cos(i * 2.399963))::numeric AS lon_raw
    FROM generate_series(1, 10000) AS i
  ) AS raw
) AS p;

-- The two index shapes lesson 447 compares. `text_pattern_ops` is what makes
-- a `LIKE 'prefix%'` search an index range scan rather than a filter.
CREATE INDEX asset_points_lat ON asset_points (lat);
CREATE INDEX asset_points_lon ON asset_points (lon);
CREATE INDEX asset_points_geohash ON asset_points (geohash text_pattern_ops);

ANALYZE asset_points;
