# 454. Rasters and DEMs: Sampling an Elevation Correctly

## What It Is
Everything so far has been vector data — points, lines, polygons, each with a position. A **raster** is the other family: a grid of cells covering a region, each holding a value. Satellite imagery is a raster of colours; a digital elevation model is a raster of heights. Asking "what is the elevation here" means sampling that grid, and there are more ways to get it wrong than the question suggests.

The first is that **a cell is an area, not a point**. A 30-metre DEM cell covers 900 square metres, and its value is one number for all of it — the mean, or the value at the centre, or something the producer chose. Which convention applies decides whether the cell's coordinate refers to its centre or its corner, and getting that wrong offsets every sample by half a cell. The georeferencing metadata says which; it is not something to infer from the numbers.

The second is **interpolation**. Nearest-neighbour sampling returns the containing cell's value, which produces visible terracing along any profile — a path across a hillside becomes a staircase. Bilinear interpolation blends the four surrounding cells and gives a smooth profile. Neither is more correct in general: nearest-neighbour is required for categorical rasters, where blending land-cover class 3 and class 5 to get 4 invents a category that means something else entirely.

The third is that **elevation has a datum too**, and it is not the one from Lesson 443. A height can be **ellipsoidal** — measured from the reference ellipsoid, which is what a GNSS receiver natively produces — or **orthometric**, measured from a geoid model approximating mean sea level. The difference between them, the geoid undulation, reaches tens of metres and varies by region. Mixing the two is the elevation equivalent of the datum mismatch, and it is larger.

And finally, **no-data is not zero**. A DEM marks cells it has no value for with a sentinel — often a large negative number — and a sampler that does not check for it returns that sentinel as an elevation. Sea level is a plausible-looking answer; -9999 metres is not, which at least fails loudly. Averaging over a window that includes one is the case that fails quietly.

```quiz
- q: "You sample a land-cover raster with bilinear interpolation. What is wrong with that?"
  anchor: "blending land-cover class 3 and class 5 to get 4 invents a category"
  options:
    - text: "Nothing — bilinear is smoother and therefore better"
      correct: false
      why: "Smoothness is meaningless for categories. The average of two class numbers is a third class."
    - text: "The values are categories, so blending them produces a category nobody measured"
      correct: true
      why: "Categorical rasters require nearest-neighbour; the choice is not a matter of quality."
    - text: "Bilinear cannot be applied to integer rasters"
      correct: false
      why: "It can be applied. That it produces a meaningless answer is the objection."

- q: "A GNSS receiver reports 112 m and the DEM says 65 m at the same place. What is the likely cause?"
  anchor: "The difference between them, the geoid undulation, reaches tens of metres"
  options:
    - text: "The receiver's horizontal error put it on a different cell"
      correct: false
      why: "Possible on a cliff, and it would not produce a consistent offset across a whole area."
    - text: "One is an ellipsoidal height and the other orthometric, and the geoid undulation between them is tens of metres"
      correct: true
      why: "It is the elevation equivalent of a datum mismatch, and larger than the horizontal one."
    - text: "The DEM's vertical resolution is too coarse"
      correct: false
      why: "Resolution is a quantisation, worth a metre or so. This gap is a different reference surface."
```

## Key Concepts
- **Raster**: a grid of cells covering a region, each holding one value
- **A cell is an area**: its single value stands for the whole cell, so the sample is already an average of something
- **Centre versus corner**: which the cell coordinate refers to, stated in the georeferencing metadata, and worth half a cell if assumed
- **Nearest neighbour**: returns the containing cell — required for categorical data, terraced for continuous
- **Bilinear**: blends the four surrounding cells — smooth for continuous data, meaningless for categories
- **Ellipsoidal height**: measured from the reference ellipsoid; what a GNSS receiver produces natively
- **Orthometric height**: measured from a geoid model approximating mean sea level; what a map usually means
- **Geoid undulation**: the difference between them — tens of metres, regionally varying
- **No-data sentinel**: a value meaning "no measurement", which is not zero and must not be averaged

## Example Code
Sampling with the four decisions made explicitly rather than by default:

```typescript
/** Everything the georeferencing metadata has to tell you before a sample
 *  means anything. `originIsCentre` is the half-cell question. */
type RasterGrid = {
  /** Longitude/easting of the first cell's reference position. */
  originX: number;
  originY: number;
  /** Cell size in the raster's own units. `sizeY` is usually negative,
   *  because raster rows run north to south while northings run the other way. */
  sizeX: number;
  sizeY: number;
  width: number;
  height: number;
  originIsCentre: boolean;
  /** The value meaning "no measurement here". Not zero, and not optional. */
  noData: number;
  /** What the height is measured from. Two rasters agreeing on every number
   *  above and disagreeing on this are tens of metres apart. */
  verticalDatum: 'ellipsoidal' | 'orthometric';
  values: Float32Array;
};

export type Sample = { value: number } | { value: null; reason: 'outside' | 'no-data' };

function cellAt(grid: RasterGrid, col: number, row: number): number | null {
  if (col < 0 || row < 0 || col >= grid.width || row >= grid.height) return null;
  const v = grid.values[row * grid.width + col];
  return v === grid.noData ? null : v;
}

/** Nearest neighbour. The only correct choice for a categorical raster, and
 *  the reason a profile across a hillside comes out as a staircase. */
export function sampleNearest(grid: RasterGrid, x: number, y: number): Sample {
  // Shift by half a cell when the origin names a centre, so the floor below
  // lands in the right cell rather than half a cell away.
  const shift = grid.originIsCentre ? 0.5 : 0;
  const col = Math.floor((x - grid.originX) / grid.sizeX + shift);
  const row = Math.floor((y - grid.originY) / grid.sizeY + shift);
  const v = cellAt(grid, col, row);
  if (v === null) {
    const outside = col < 0 || row < 0 || col >= grid.width || row >= grid.height;
    return { value: null, reason: outside ? 'outside' : 'no-data' };
  }
  return { value: v };
}

/** Bilinear. Smooth, and wrong for anything whose values are labels.
 *  One no-data neighbour makes the whole sample no-data — averaging it in
 *  would silently drag the answer towards a sentinel. */
export function sampleBilinear(grid: RasterGrid, x: number, y: number): Sample {
  const shift = grid.originIsCentre ? 0 : -0.5;
  const fx = (x - grid.originX) / grid.sizeX + shift;
  const fy = (y - grid.originY) / grid.sizeY + shift;
  const col = Math.floor(fx);
  const row = Math.floor(fy);
  const tx = fx - col;
  const ty = fy - row;

  const corners = [
    cellAt(grid, col, row),
    cellAt(grid, col + 1, row),
    cellAt(grid, col, row + 1),
    cellAt(grid, col + 1, row + 1),
  ];
  if (corners.some((c) => c === null)) return { value: null, reason: 'no-data' };
  const [v00, v10, v01, v11] = corners as number[];

  const top = v00 * (1 - tx) + v10 * tx;
  const bottom = v01 * (1 - tx) + v11 * tx;
  return { value: top * (1 - ty) + bottom * ty };
}
```

## When to Use
- When elevation, slope or aspect feeds a real decision — drainage, line of sight, a route's climb, a solar estimate
- When combining a GNSS position with a map height, where the vertical datum question has to be settled before the numbers are compared
- When sampling any raster along a path, where the interpolation choice is visible in the output profile
- When accepting a raster from a producer you did not choose, where the metadata is the contract and the pixel values are not self-describing

## Common Mistakes
- **Ignoring the centre-versus-corner convention** — every sample is offset by half a cell, which on a 30-metre DEM is 15 metres of horizontal error applied uniformly
- **Bilinear on categorical data** — averaging class 3 and class 5 gives class 4, which is a real category and the wrong one
- **Treating no-data as zero** — a sentinel read as an elevation puts a point at sea level or at -9999 metres, and only the second one is noticed
- **Averaging a window containing a no-data cell** — the sentinel drags the mean, and the result is a plausible number that is quietly wrong
- **Mixing ellipsoidal and orthometric heights** — the geoid undulation is tens of metres, larger than most horizontal datum shifts, and neither number looks wrong on its own
- **Assuming a DEM's resolution is its accuracy** — a 30-metre grid can be built from data with a much larger vertical error, and the producer's documentation is the only place that says

## Further Reading
- [Digital elevation model](https://en.wikipedia.org/wiki/Digital_elevation_model) — the family of products, and what "DEM", "DSM" and "DTM" each include
- [GDAL: GeoTIFF driver](https://gdal.org/en/stable/drivers/raster/gtiff.html) — the georeferencing metadata a raster carries, field by field
- [EPSG:4979](https://epsg.io/4979) — WGS 84 three-dimensional, and what an ellipsoidal height is measured from
- [EPSG registry](https://epsg.org/home.html) — where vertical datums are defined, versioned and distinguished from horizontal ones

```recall
- q: "Why is 'what is the elevation here' not a point lookup?"
  must:
    - "a cell is an area, not a point — one value stands for the whole cell"
    - "the cell coordinate may name its centre or its corner, and the metadata says which"
    - "assuming the wrong one offsets every sample by half a cell"

- q: "When is nearest-neighbour required rather than merely coarser?"
  must:
    - "for categorical rasters, where values are labels"
    - "blending class 3 and class 5 produces class 4, which means something else"
    - "bilinear is for continuous data, where it removes the terracing"

- q: "Name the two vertical reference surfaces and the size of the difference."
  must:
    - "ellipsoidal height, measured from the reference ellipsoid — what GNSS produces"
    - "orthometric height, measured from a geoid model approximating mean sea level"
    - "the geoid undulation between them reaches tens of metres and varies by region"
```
