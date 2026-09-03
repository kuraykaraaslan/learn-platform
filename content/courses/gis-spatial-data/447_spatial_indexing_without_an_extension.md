# 447. Spatial Indexing Without a Spatial Extension: Bounding Boxes, Geohash, Quadkeys

## What It Is
"Find everything near here" is the query that makes people install a spatial extension. It is worth knowing what you can do without one, because a great deal of production spatial search is still ordinary btree indexes and string prefixes — and because the two techniques below are what an R-tree is doing underneath anyway.

The first is the **bounding box pre-filter**: convert "within 500 metres" into a latitude range and a longitude range, let the index narrow the candidates, then compute the exact distance on the survivors. This is not an approximation of the answer, it is a two-stage answer — a cheap filter that is allowed false positives but no false negatives, followed by an exact test. Every spatial index in existence has this shape.

The second is **turning the position into a sortable string** so that nearby points share a prefix. A geohash interleaves longitude and latitude bits five at a time into a base-32 alphabet; a quadkey does the same thing in base 4, one digit per zoom level, which is also the address of a map tile. Either way, a prefix is a bounding box, and `LIKE 'prefix%'` on a btree with `text_pattern_ops` is a range scan.

Both techniques have failures that are not obvious and are not rare. A bounding box in degrees is a box on the ground only at the equator, it needs a cosine correction on the longitude side, and it is simply wrong across the antimeridian, where the naive `BETWEEN` selects the whole world minus your neighbourhood. A prefix search misses neighbours that fall on the other side of a cell boundary, which is why real geohash search queries a cell **and its eight neighbours**. Knowing those two limits is most of what separates this technique from a bug.

```quiz
- q: "What is the bounding-box stage allowed to get wrong?"
  anchor: "a cheap filter that is allowed false positives but no false negatives"
  options:
    - text: "Nothing — if it is wrong, the answer is wrong"
      correct: false
      why: "It may return extra candidates: the exact test that follows removes them. What it may never do is drop a real one."
    - text: "It may return points that are not actually within range, but must never miss one that is"
      correct: true
      why: "That asymmetry is what lets the filter be cheap, and it is the shape of every spatial index."
    - text: "It may miss points, since the exact stage will find them"
      correct: false
      why: "The exact stage only sees what the filter passed. A missed candidate is gone."

- q: "Two assets 8 metres apart have geohashes that differ in the fifth character. Why?"
  anchor: "A prefix search misses neighbours that fall on the other side of a cell boundary"
  options:
    - text: "One of them was encoded at a different precision"
      correct: false
      why: "Precision is the length of the string. These differ in a character both strings have."
    - text: "They sit either side of a cell boundary, and proximity in space does not guarantee a shared prefix"
      correct: true
      why: "Which is why a real prefix search queries the cell and its eight neighbours."
    - text: "Geohash loses precision below about 10 metres"
      correct: false
      why: "A nine-character geohash resolves to a few metres. The issue is boundaries, not resolution."
```

## Key Concepts
- **Two-stage query**: an index filter that over-selects, then an exact test on the survivors
- **Bounding box in degrees**: needs the longitude half divided by the cosine of the latitude, or the box is too narrow east-west
- **The antimeridian**: a `BETWEEN` across ±180 selects the complement of what you meant, so the condition has to become an `OR`
- **Geohash**: longitude and latitude bits interleaved, five per base-32 character; each character narrows the cell
- **Quadkey**: the same idea in base 4, one digit per zoom, and identical to a tile address
- **A prefix is a bounding box**: which makes `LIKE 'prefix%'` a range scan, not a scan
- **`text_pattern_ops`**: the operator class that makes a prefix `LIKE` index-usable in PostgreSQL
- **Cell-boundary misses**: search the cell and its eight neighbours, or accept that neighbours across an edge are invisible
- **Two btree indexes are not a composite index**: the planner picks one and filters on the other, which the plan below shows

## Example Code
The encoders, and the two failures, worked out rather than asserted:

```typescript run
// can answer "what is near here". Neither needs a spatial extension.

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'; // i, l, o and a removed

/** Geohash: interleave longitude and latitude bits, five bits per character. */
function geohash(lat: number, lon: number, chars: number): string {
  let [latLo, latHi, lonLo, lonHi] = [-90, 90, -180, 180];
  let isLon = true;
  let bits = 0;
  let value = 0;
  let out = '';
  while (out.length < chars) {
    if (isLon) {
      const mid = (lonLo + lonHi) / 2;
      if (lon > mid) { value = value * 2 + 1; lonLo = mid; } else { value *= 2; lonHi = mid; }
    } else {
      const mid = (latLo + latHi) / 2;
      if (lat > mid) { value = value * 2 + 1; latLo = mid; } else { value *= 2; latHi = mid; }
    }
    isLon = !isLon;
    if (++bits === 5) { out += BASE32[value]; bits = 0; value = 0; }
  }
  return out;
}

/** Quadkey: the same idea in base 4, one digit per zoom level, and the address
 *  a tile pyramid already uses. */
function quadkey(lat: number, lon: number, zoom: number): string {
  const n = 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  let key = '';
  for (let i = zoom; i > 0; i--) {
    const mask = 1 << (i - 1);
    key += String(((x & mask) !== 0 ? 1 : 0) + ((y & mask) !== 0 ? 2 : 0));
  }
  return key;
}

const HERE = { lat: 41.0214, lon: -123.8094 };
console.log(`lat ${HERE.lat}  lon ${HERE.lon}`);
console.log(`  geohash(9)  ${geohash(HERE.lat, HERE.lon, 9)}`);
console.log(`  quadkey(16) ${quadkey(HERE.lat, HERE.lon, 16)}`);
console.log('');

console.log('Each character narrows the cell, so a prefix IS a bounding box:');
for (const chars of [3, 4, 5, 6, 7]) {
  console.log(`  ${chars} chars  ${geohash(HERE.lat, HERE.lon, chars)}`);
}
console.log('');
console.log('That is the whole trick: `WHERE geohash LIKE \'9prcq%\'` is a range scan on an');
console.log('ordinary btree, and no extension was installed to get it.');
console.log('');

// The two failures worth knowing before you rely on it.
const RAD = Math.PI / 180;
const R = 6371008.8;
const metresEast = (lat: number, dLon: number) => Math.abs(dLon) * RAD * R * Math.cos(lat * RAD);

console.log('Failure 1 — neighbours can sit either side of a cell edge.');
// Found by walking, not asserted: step west until the 5-character cell changes.
const lat = HERE.lat;
let lon = HERE.lon;
const startCell = geohash(lat, lon, 5);
while (geohash(lat, lon, 5) === startCell) lon -= 0.0001;
console.log(`  ${geohash(lat, lon + 0.0001, 5)}   lon ${(lon + 0.0001).toFixed(4)}`);
console.log(`  ${geohash(lat, lon, 5)}   lon ${lon.toFixed(4)}   ${metresEast(lat, 0.0001).toFixed(0)} m apart`);
console.log('  A prefix search finds one and not the other. The fix is to search the cell');
console.log('  AND its eight neighbours, which is a different query from the one you wrote.');
console.log('');

const west = { lat: -60, lon: 179.996 };
const east = { lat: -60, lon: -179.998 };
console.log('Failure 2 — the antimeridian:');
console.log(`  ${geohash(west.lat, west.lon, 6)}   lon ${west.lon}`);
const seamGap = 360 - west.lon + east.lon;
console.log(`  ${geohash(east.lat, east.lon, 6)}   lon ${east.lon}   ${metresEast(east.lat, seamGap).toFixed(0)} m apart`);
console.log('  Not one character in common. A prefix search, a bounding box and a BETWEEN');
console.log('  all fail here, and only the bounding box fails loudly enough to notice.');
```

Now the same two techniques against real Postgres. Ten thousand asset points in a hundred clusters, with btree indexes on `lat`, `lon` and `geohash`:

```sql run seed=asset_points
-- The bounding-box filter. Watch which index the planner picks — and what
-- happens to the other condition.
EXPLAIN ANALYZE
SELECT count(*) FROM asset_points
WHERE lat BETWEEN 41.015 AND 41.028
  AND lon BETWEEN -123.816 AND -123.803;
```

Postgres uses one of the two indexes and applies the other column as a `Filter`. Two single-column btree indexes are not a spatial index; they are one index and a scan of what it returned. That is the ceiling this technique has.

```sql run seed=asset_points
-- The prefix search. `text_pattern_ops` turns LIKE 'prefix%' into a range:
-- look at the Index Cond, which is a >= and a < on the string.
EXPLAIN ANALYZE
SELECT count(*) FROM asset_points WHERE geohash LIKE '9prcq%';
```

```sql run seed=asset_points
-- And the two failures, as row counts rather than as claims.
-- One cluster of 100 points straddles a 5-character cell boundary:
SELECT
  count(*) FILTER (WHERE geohash LIKE 'bbtfw%') AS one_cell,
  count(*) FILTER (WHERE geohash LIKE 'bbtf%')  AS parent_cell
FROM asset_points;

-- And one cluster sits on the antimeridian. The naive box misses the points
-- on the far side of the seam; the OR form finds them.
SELECT
  count(*) FILTER (WHERE lon BETWEEN 179.993 AND 180.003)        AS naive_box,
  count(*) FILTER (WHERE lon >= 179.993 OR lon <= -179.997)      AS wrapped_box
FROM asset_points
WHERE lat BETWEEN -60.005 AND -59.995;
```

## When to Use
- When proximity search is a small part of a system and a spatial extension is a large dependency to add for it
- When the database is not PostgreSQL, or is a managed service where extensions are not yours to install
- When the query is "which cell is this in" rather than "what is the exact geometry" — tiles, clustering, aggregation
- As the pre-filter stage even when a spatial extension is available, because that is what it is doing anyway

## Common Mistakes
- **A bounding box in raw degrees** — the longitude half needs dividing by the cosine of the latitude, or the box is too narrow east-west by exactly that factor
- **`lon BETWEEN` across the antimeridian** — it selects the whole world except your neighbourhood, and the row count is wrong in the direction that looks like "no results"
- **Prefix search without the neighbouring cells** — two points metres apart can differ in the character you are matching on, and the miss is silent
- **`LIKE 'prefix%'` without `text_pattern_ops`** — in a non-C collation the index cannot be used for the range, so the query is a sequential scan wearing an index's clothes
- **Expecting two single-column indexes to act as one spatial index** — the planner uses one and filters with the other, which is visible in every plan and surprising every time
- **Skipping the exact stage** — the box is a filter, and its corners are further away than its edges, so the results include points outside the radius you asked for

## Further Reading
- [PostgreSQL index types](https://www.postgresql.org/docs/current/indexes-types.html) — what a btree can and cannot answer, which is the constraint this whole lesson works inside
- [PostgreSQL operator classes](https://www.postgresql.org/docs/current/indexes-opclass.html) — `text_pattern_ops` and why a prefix search needs it
- [Geohash](https://en.wikipedia.org/wiki/Geohash) — the encoding, its cell sizes per character, and the neighbour problem stated in general
- [Slippy map tilenames](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames) — the quadkey's other life as a tile address, which Lesson 450 picks up

```recall
- q: "Describe the two-stage shape of a spatial query and the asymmetry the first stage must obey."
  must:
    - "an index filter that over-selects, then an exact test on the survivors"
    - "the filter may return false positives"
    - "it must never produce a false negative, because the exact stage only sees what it passed"

- q: "How does a prefix search become an index range scan, and what does it miss?"
  must:
    - "each geohash character narrows the cell, so a prefix is a bounding box"
    - "LIKE 'prefix%' with text_pattern_ops becomes a >= and < range on the btree"
    - "neighbours across a cell boundary have a different prefix, so real searches query the cell and its eight neighbours"

- q: "Name two ways a degrees-based bounding box is wrong, and the fix for each."
  must:
    - "the longitude half needs dividing by the cosine of the latitude"
    - "a BETWEEN across the antimeridian selects the complement — it has to become an OR"
    - "and two single-column btree indexes are one index plus a filter, not a spatial index"
```
