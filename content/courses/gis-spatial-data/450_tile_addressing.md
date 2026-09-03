# 450. Tile Addressing: z/x/y, the TMS y-Flip, and the Map That Comes Out Mirrored

## What It Is
A web map is a pyramid of square images or vector blobs, addressed by three integers: a zoom level, a column and a row. At zoom `z` there are `2^z` columns and `2^z` rows covering the whole Web Mercator square, so zoom 0 is one tile of the world and each level quarters every tile of the one above.

The columns are uncontroversial: `x` counts east from the antimeridian, everywhere. The rows are not. **The XYZ scheme counts `y` down from the north edge; the TMS scheme counts it up from the south edge.** They are related by one subtraction, `2^z - 1 - y`, and both schemes are widely deployed: XYZ is what a `{z}/{x}/{y}.png` URL template usually means, and TMS is what an OGC-era tile server, an MBTiles file (Lesson 452) and a good deal of GDAL tooling means.

A third addressing form, the **quadkey**, encodes the same tile as a single base-4 string, one digit per zoom level, by interleaving the bits of `x` and `y`. It is the same idea as the geohash from Lesson 447 — a prefix is a bounding box — and it makes a tile address sortable and hierarchical in one value.

The failure this lesson is named for is what happens when the two row conventions meet. Passing a TMS row to an XYZ server, or the reverse, returns a **valid tile**: right zoom, right column, mirrored latitude. Nothing errors, nothing is missing, and the map is upside down. The proof below runs the arithmetic and shows the box you actually get.

```quiz
- q: "What is the relationship between an XYZ row and a TMS row?"
  anchor: "The XYZ scheme counts `y` down from the north edge; the TMS scheme counts it up from the south edge"
  options:
    - text: "They are the same; TMS is just an older name for XYZ"
      correct: false
      why: "They differ by a subtraction, and both are in active use, which is what makes the mix-up possible."
    - text: "TMS counts up from the south, so the rows are related by 2^z - 1 - y"
      correct: true
      why: "One subtraction — small enough to be omitted and large enough to mirror the map."
    - text: "TMS uses a different projection, so the rows do not correspond"
      correct: false
      why: "Same projection, same pyramid, same tiles. Only the row numbering differs."

- q: "A tile server is given the wrong row convention. What does the client see?"
  anchor: "returns a **valid tile**: right zoom, right column, mirrored latitude"
  options:
    - text: "A 404, since that row does not exist"
      correct: false
      why: "The row exists — it is a legal row number at that zoom, which is exactly the problem."
    - text: "A valid tile from the mirrored latitude, so the map renders and is upside down"
      correct: true
      why: "Nothing in the response says it is the wrong tile."
    - text: "A blank tile, since the flipped row is usually ocean"
      correct: false
      why: "Sometimes it is ocean and sometimes it is land. Either way the response is a normal tile."
```

## Key Concepts
- **`2^z` by `2^z` grid**: at every zoom, covering the whole Web Mercator square from Lesson 444
- **`x` counts east** from the antimeridian, in every scheme
- **XYZ**: `y` counts down from the north edge — the usual meaning of a `{z}/{x}/{y}` URL template
- **TMS**: `y` counts up from the south edge — OGC-era servers, MBTiles, much GDAL tooling
- **`2^z - 1 - y`**: the entire conversion between them
- **Quadkey**: the same tile as one base-4 string, one digit per zoom, bits of `x` and `y` interleaved
- **A prefix of a quadkey is an ancestor tile**, the same hierarchy property the geohash has
- **The two schemes agree at zoom 0**, which is why a smoke test on the world view proves nothing

## Example Code
```typescript run
// subtraction, which is why the bug survives review.
const RAD = Math.PI / 180;

type Tile = { z: number; x: number; y: number };

/** XYZ / slippy map: y counts DOWN from the north edge. */
function tileFor(lon: number, lat: number, z: number): Tile {
  const n = 2 ** z;
  const latRad = lat * RAD;
  return {
    z,
    x: Math.floor(((lon + 180) / 360) * n),
    y: Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n),
  };
}

/** TMS: y counts UP from the south edge. */
const toTms = ({ z, y }: Tile) => 2 ** z - 1 - y;

function toQuadkey({ z, x, y }: Tile): string {
  let key = '';
  for (let i = z; i > 0; i--) {
    const mask = 1 << (i - 1);
    key += String(((x & mask) !== 0 ? 1 : 0) + ((y & mask) !== 0 ? 2 : 0));
  }
  return key;
}

function bounds({ z, x, y }: Tile) {
  const n = 2 ** z;
  const lat = (j: number) => Math.atan(Math.sinh(Math.PI * (1 - (2 * j) / n))) / RAD;
  return {
    west: (x / n) * 360 - 180,
    east: ((x + 1) / n) * 360 - 180,
    south: lat(y + 1),
    north: lat(y),
  };
}

const tile = tileFor(-0.1, 51.5, 12);
const tms = toTms(tile);

console.log(`XYZ      ${tile.z}/${tile.x}/${tile.y}`);
console.log(`TMS      ${tile.z}/${tile.x}/${tms}`);
console.log(`quadkey  ${toQuadkey(tile)}`);
console.log('');
const b = bounds(tile);
console.log(`all three name  N ${b.north.toFixed(4)}  S ${b.south.toFixed(4)}`);
console.log('');

const served = bounds({ z: tile.z, x: tile.x, y: tms });
console.log(`hand the TMS row to an XYZ server and you get  N ${served.north.toFixed(4)}  S ${served.south.toFixed(4)}`);
console.log('Same longitude, mirrored latitude. The tile is valid, it renders, and the map');
console.log('is upside down.');
console.log('');

// The reason this reaches production: the two schemes agree exactly where a
// smoke test looks.
console.log('zoom  XYZ y  TMS y  agree?');
for (const z of [0, 1, 2, 8]) {
  const t = tileFor(-0.1, 51.5, z);
  const m = toTms(t);
  console.log(`  ${String(z).padStart(2)}  ${String(t.y).padStart(6)} ${String(m).padStart(6)}   ${t.y === m ? 'yes' : 'no'}`);
}
console.log('');
console.log('At zoom 0 there is one tile and both schemes call it 0. A test that loads the');
console.log('world view passes. The mirror only appears once you zoom in.');
```

And the same arithmetic, run for real and stamped, with the box each address resolves to:

```proof sha=90d920a57d260f23 at=2026-09-03 commit=0f4c9d0
$ node tiles.js
point  lon -0.1  lat 51.5   zoom 12

XYZ (slippy map)   12/2046/1362
TMS                12/2046/2733
quadkey            031313131130

All three name the SAME square:
  W -0.1758  S 51.4540  E -0.0879  N 51.5087

Now hand the TMS row number (2733) to a server that speaks XYZ:
  requested 12/2046/2733
  W -0.1758  S -51.5087  E -0.0879  N -51.4540

latitude asked for : 51.4540 .. 51.5087
latitude served    : -51.5087 .. -51.4540
the tile arrives 102.9627 degrees of latitude away

It is still a valid tile. It renders. It is on the wrong side of the equator,
and across a whole tileset the map reads as vertically mirrored.

at zoom 0: XYZ y = 0, TMS y = 0 — identical, so a smoke test at zoom 0 passes
```

## When to Use
- When integrating any tile source whose documentation says "TMS" or shows an OGC-era URL, which is where the flip lives
- When serving tiles out of an MBTiles file, where the stored row is TMS and the request is usually XYZ (Lesson 452)
- When building a cache key or a storage path for tiles, where a quadkey is one sortable value instead of three
- When a map looks right at low zoom and wrong once you zoom in — the exact signature of a row-convention mismatch

## Common Mistakes
- **Assuming `{z}/{x}/{y}` means XYZ** — it usually does and not always, and the only way to know is the source's documentation or one visual check at a zoom where the two differ
- **Smoke-testing at zoom 0** — both schemes call that single tile row 0, so the test passes under either convention
- **Applying the flip in the URL template and again in the code** — two flips are no flip, and it works, until someone removes one of them
- **Storing a tile cache under one convention and reading it under the other** — every entry is a cache hit for the wrong tile, which is worse than a miss
- **Treating a mirrored map as a projection problem** — the projection is fine; it is one subtraction, and looking at the projection wastes the afternoon
- **Assuming quadkeys and TMS mix** — a quadkey is built from the XYZ row, so feeding it a TMS row produces a valid-looking key for a different tile

## Further Reading
- [Slippy map tilenames](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames) — the XYZ scheme's arithmetic, and the note about TMS
- [MBTiles specification](https://github.com/mapbox/mbtiles-spec) — states explicitly that `tile_row` is TMS, which is where most encounters with the flip begin
- [EPSG:3857](https://epsg.io/3857) — the square the pyramid subdivides, and why it is square

```recall
- q: "Give the two row conventions and the conversion between them."
  must:
    - "XYZ counts y down from the north edge"
    - "TMS counts y up from the south edge"
    - "they are related by 2^z - 1 - y"

- q: "What does a client see when the row convention is wrong, and why is that the hard case?"
  must:
    - "a valid tile with the right zoom and column but mirrored latitude"
    - "nothing errors and nothing is missing — the map just renders upside down"
    - "and the two schemes agree at zoom 0, so a world-view smoke test passes"

- q: "What is a quadkey, and what property does it share with a geohash?"
  must:
    - "the same tile as one base-4 string, one digit per zoom level"
    - "built by interleaving the bits of x and y"
    - "a prefix is an ancestor tile, so a prefix is a bounding box"
```
