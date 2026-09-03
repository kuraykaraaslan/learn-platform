# 452. MBTiles and PMTiles: Packaging a Tileset as One File

## What It Is
A tileset is millions of small files, and millions of small files is the worst shape almost every storage system has. Copying is slow, listing is slow, object stores charge per request, and a directory tree of that size is awkward to move between machines at all. Both formats in this lesson solve the same problem: put the pyramid in **one file**, and give it an index.

**MBTiles** is a SQLite database with an agreed schema. The `tiles` table has `zoom_level`, `tile_column`, `tile_row` and `tile_data`, plus a `metadata` key/value table carrying the format, the bounds and the zoom range. That is the whole specification, which is why it is everywhere: any tool that can open SQLite can serve tiles. The single thing to remember is that **`tile_row` is TMS** — counted up from the south edge, per Lesson 450 — while the request arriving at your server is almost certainly XYZ. The flip is one subtraction, applied in exactly one place.

**PMTiles** solves the same problem for a different deployment. It is a single flat file with a directory at the front, designed so a client can fetch tiles with HTTP range requests — no server process, no database, just an object store and a `Range` header. To make that efficient it orders tiles along a **Hilbert curve**, so tiles that are near each other on the map are usually near each other in the file, and one range request can cover several. Usually, not always: at a fold in the curve two adjacent tiles land far apart, which makes a range request an optimisation with a worst case rather than a guarantee.

Neither format is queried the way this site's SQL runtime works — MBTiles is SQLite and the runtime here is PostgreSQL — so the schema below is shown rather than executed, and the part that is genuinely computable, the addressing, runs.

```quiz
- q: "What is `tile_row` in an MBTiles file?"
  anchor: "`tile_row` is TMS"
  options:
    - text: "The XYZ row, the same as in a `{z}/{x}/{y}` URL"
      correct: false
      why: "It is TMS — counted up from the south edge. Serving it straight to an XYZ client mirrors the map."
    - text: "The TMS row, counted up from the south, so it needs the flip before serving to an XYZ client"
      correct: true
      why: "One subtraction, applied in one place, per Lesson 450."
    - text: "An arbitrary row id — the metadata table says which convention"
      correct: false
      why: "The specification fixes it. There is nothing to look up."

- q: "Why does PMTiles order its tiles along a Hilbert curve?"
  anchor: "one range request can cover several"
  options:
    - text: "To compress better, since neighbouring tiles are similar"
      correct: false
      why: "Compression is per tile. The curve is about locality in the file, not about redundancy."
    - text: "So map-adjacent tiles are usually file-adjacent, letting one HTTP range request fetch several"
      correct: true
      why: "That is what makes a server-less deployment on an object store practical."
    - text: "To guarantee that any set of neighbouring tiles is contiguous in the file"
      correct: false
      why: "Not a guarantee — two adjacent tiles either side of a fold in the curve are far apart."
```

## Key Concepts
- **The problem**: millions of small files is a bad shape for copying, listing and object-store pricing
- **MBTiles**: SQLite with an agreed schema — `tiles(zoom_level, tile_column, tile_row, tile_data)` plus `metadata`
- **`tile_row` is TMS**: flip it once, on the way out, and never again
- **`metadata` carries the contract**: format, bounds, minzoom, maxzoom, and for vector tilesets the layer descriptions
- **PMTiles**: one flat file with a leading directory, read by HTTP range requests, no server process
- **Hilbert ordering**: map-adjacent tiles are usually file-adjacent, so one range request covers several
- **"Usually" is the operative word**: a fold in the curve separates two touching tiles, so range coverage is an optimisation with a worst case
- **Both are containers**: neither changes what a tile is, only how the pyramid is stored and fetched

## Example Code
The MBTiles schema, shown and not run — this site's SQL runtime is PostgreSQL, and MBTiles is SQLite:

```sql
-- The MBTiles specification, in full. `tile_row` is the TMS row.
CREATE TABLE metadata (name text, value text);
CREATE TABLE tiles (
  zoom_level  integer,
  tile_column integer,
  tile_row    integer,
  tile_data   blob
);
CREATE UNIQUE INDEX tile_index ON tiles (zoom_level, tile_column, tile_row);

-- Serving an XYZ request means flipping the row on the way in.
-- :z, :x and :y are the numbers from the URL.
SELECT tile_data
FROM tiles
WHERE zoom_level  = :z
  AND tile_column = :x
  AND tile_row    = (1 << :z) - 1 - :y;
```

The addressing is the part that is genuinely computable, so it runs:

```typescript run
// The whole integration is this one conversion, applied consistently.
type Tile = { z: number; x: number; y: number };

/** MBTiles' `tiles` table: (zoom_level, tile_column, tile_row, tile_data),
 *  and tile_row is the TMS row — flipped relative to a slippy-map y. */
type MbtilesRow = { zoom_level: number; tile_column: number; tile_row: number };

const toMbtiles = ({ z, x, y }: Tile): MbtilesRow => ({
  zoom_level: z,
  tile_column: x,
  tile_row: 2 ** z - 1 - y,
});

const fromMbtiles = ({ zoom_level, tile_column, tile_row }: MbtilesRow): Tile => ({
  z: zoom_level,
  x: tile_column,
  y: 2 ** zoom_level - 1 - tile_row,
});

const REQUESTED: Tile[] = [
  { z: 0, x: 0, y: 0 },
  { z: 4, x: 8, y: 5 },
  { z: 12, x: 2046, y: 1362 },
  { z: 14, x: 8188, y: 5448 },
];

console.log('a web request for   the MBTiles row to read      round trip');
for (const t of REQUESTED) {
  const row = toMbtiles(t);
  const back = fromMbtiles(row);
  const ok = back.z === t.z && back.x === t.x && back.y === t.y;
  console.log(
    `  ${t.z}/${t.x}/${t.y}`.padEnd(22) +
      `(${row.zoom_level}, ${row.tile_column}, ${row.tile_row})`.padEnd(28) +
      (ok ? 'ok' : 'MISMATCH')
  );
}
console.log('');

// PMTiles takes the same pyramid and orders it along a space-filling curve, so
// one HTTP range request can fetch a run of neighbouring tiles.
function hilbertId({ z, x, y }: Tile): number {
  // Every tile at a lower zoom comes first, then the Hilbert index within
  // this zoom's 2^z by 2^z grid.
  const n = 2 ** z;
  let d = 0;
  let [px, py] = [x, y];
  for (let s = n / 2; s > 0; s = s / 2) {
    const rx = (px & s) > 0 ? 1 : 0;
    const ry = (py & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    // Rotate the quadrant so the curve stays continuous across its boundary.
    if (ry === 0) {
      if (rx === 1) {
        px = n - 1 - px;
        py = n - 1 - py;
      }
      [px, py] = [py, px];
    }
  }
  return (4 ** z - 1) / 3 + d;
}

console.log('PMTiles orders the same pyramid along a Hilbert curve, so a tile that is');
console.log('near on the map is usually near in the file, and one HTTP range request can');
console.log('cover several tiles at once:');
const run: Tile[] = [
  { z: 6, x: 20, y: 21 },
  { z: 6, x: 21, y: 21 },
  { z: 6, x: 21, y: 22 },
  { z: 6, x: 22, y: 22 },
];
for (const t of run) console.log(`  ${t.z}/${t.x}/${t.y}`.padEnd(14) + `tile id ${hilbertId(t)}`);
console.log('');
console.log('Usually, not always. Two tiles that touch on the map can sit either side of a');
console.log('fold in the curve, and then they are nowhere near each other in the file:');
for (const t of [{ z: 6, x: 31, y: 21 }, { z: 6, x: 32, y: 21 }] as Tile[]) {
  console.log(`  ${t.z}/${t.x}/${t.y}`.padEnd(14) + `tile id ${hilbertId(t)}`);
}
console.log('');
console.log('So a range request is an optimisation with a worst case, not a guarantee — which');
console.log('is the thing to know before sizing one.');
```

## When to Use
- When a tileset has to be moved, versioned or shipped as an artefact rather than synced as a directory
- MBTiles: when something is going to serve the tiles — a process that can open SQLite and answer requests
- PMTiles: when nothing is going to serve them — an object store, a CDN, and a client that speaks range requests
- When storage costs are per request, where a million objects is a pricing problem before it is a performance one

## Common Mistakes
- **Serving `tile_row` straight to an XYZ client** — the map comes out mirrored, exactly as Lesson 450's proof shows, and it renders fine so nothing complains
- **Flipping the row in two places** — twice is not at all, and it works until one of the two is refactored away
- **Ignoring the `metadata` table** — format, bounds and zoom range are the tileset's contract, and a server that does not read them serves 404s it could have answered properly
- **Assuming PMTiles range requests are always contiguous** — the Hilbert curve makes locality likely, not certain, and a request plan should have a fallback for the fold
- **Treating either format as a spatial database** — they store tiles by address; there is no query beyond "give me this tile"
- **Rebuilding the whole pyramid for a small change** — both formats are containers, and updating a region means regenerating the tiles for that region, which is a generation question rather than a format one

## Further Reading
- [MBTiles specification](https://github.com/mapbox/mbtiles-spec) — the schema, the metadata keys, and the explicit statement that rows are TMS
- [PMTiles](https://github.com/protomaps/PMTiles) — the single-file layout, the directory format and the range-request design
- [Hilbert curve](https://en.wikipedia.org/wiki/Hilbert_curve) — the ordering, and why locality is a tendency rather than a guarantee
- [Slippy map tilenames](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames) — the XYZ side of the conversion these formats need

```recall
- q: "What problem do MBTiles and PMTiles both solve, and how does each solve it?"
  must:
    - "millions of small files is a bad storage shape — slow to copy, expensive per request"
    - "MBTiles: SQLite with an agreed tiles/metadata schema, served by a process"
    - "PMTiles: one flat file with a leading directory, read by HTTP range requests with no server"

- q: "State the MBTiles row convention and what goes wrong if it is ignored."
  must:
    - "tile_row is TMS, counted up from the south edge"
    - "an XYZ request needs the flip, (1 << z) - 1 - y"
    - "without it the map renders mirrored and nothing errors"

- q: "Why the Hilbert curve in PMTiles, and what does it not promise?"
  must:
    - "map-adjacent tiles are usually file-adjacent, so one range request covers several"
    - "it is not a guarantee — two touching tiles either side of a fold land far apart"
    - "so range coverage is an optimisation with a worst case"
```
