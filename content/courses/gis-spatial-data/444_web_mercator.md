# 444. Web Mercator: The Projection Your Map Library Already Assumed

## What It Is
Every slippy map you have ever used draws in Web Mercator, EPSG:3857. You did not choose it; it came with the tile pyramid. Knowing what it does is the difference between reading a map correctly and quoting a number off it that is wrong by a factor.

Mercator's defining property is that it is **conformal**: it preserves angles, so shapes are locally correct and north is always up. It buys that by stretching, and the stretch is exactly the secant of the latitude — 1× at the equator, 2× at 60 degrees, over 11× at 85. Areas, which stretch in both directions, are off by the square of that. This is not a defect; it is the trade a navigation projection makes, and it is why the projection has survived four centuries.

Web Mercator adds two decisions on top. It **clips at ±85.05112878 degrees**, which is precisely the latitude that makes the projected world as tall as it is wide — a square, which is what a quadtree of square tiles needs. And it treats the Earth as a **sphere** while using WGS 84's ellipsoidal latitudes, a substitution no other projection makes. That mismatch is worth up to about 20 km at mid-latitudes if you compare EPSG:3857 against a proper ellipsoidal Mercator, which is why EPSG:3857 exists as its own code rather than being folded into EPSG:3395.

The practical rule is short: Web Mercator is a display system. Compute in it and your distances and areas are wrong by a latitude-dependent factor. Compute on the ellipsoid, or in an appropriate local projected system, and display the result in Web Mercator.

```quiz
- q: "Why is the world square in Web Mercator?"
  anchor: "clips at ±85.05112878 degrees"
  options:
    - text: "Because Mercator naturally produces a square"
      correct: false
      why: "Mercator is infinitely tall — the poles project to infinity. The square comes from where it is cut off."
    - text: "Because it is clipped at the latitude where height equals width, which is what a quadtree of square tiles requires"
      correct: true
      why: "±85.05112878 is chosen to make the projected extent square, not for any geographic reason."
    - text: "Because tiles are square, so the projection was designed around them"
      correct: false
      why: "The projection long predates tiles. The clipping latitude was chosen for them; the projection was not."

- q: "You compute an area from EPSG:3857 coordinates at 60 degrees north. How wrong is it?"
  anchor: "Areas, which stretch in both directions, are off by the square of that"
  options:
    - text: "About twice too large"
      correct: false
      why: "Twice is the linear stretch at 60 north. Area stretches in both directions."
    - text: "About four times too large"
      correct: true
      why: "The linear factor is 2 at 60 north, and area goes as its square."
    - text: "Correct — the projection is conformal, so it preserves measurements"
      correct: false
      why: "Conformal means it preserves ANGLES. That is a different guarantee, and it is the only one Mercator makes."
```

## Key Concepts
- **EPSG:3857**: Web Mercator, the projection under nearly every tiled web map
- **Conformal**: preserves angles and local shape; says nothing about distance or area
- **Scale factor**: the secant of the latitude — 1 at the equator, 2 at 60 degrees, over 11 at 85
- **Area error is the square of that**: a 2× linear stretch is a 4× area stretch
- **Clipped at ±85.05112878**: the latitude that makes the projected world square, so a quadtree of square tiles fits it
- **Spherical formula on ellipsoidal latitudes**: Web Mercator's own quirk, and the reason it has a separate code from ellipsoidal Mercator
- **Display, not measurement**: compute distances and areas elsewhere and project the result for drawing
- **Origin at the top-left of the square**: which is where the tile y-axis of lesson 450 comes from

## Example Code
Forward, inverse, and the cost of measuring in it:

```typescript run
// that decide whether a number you computed means anything.
const RAD = Math.PI / 180;
// The sphere radius EPSG:3857 defines — the WGS 84 semi-major axis, used as if
// the Earth were a sphere. That substitution is the projection's whole trick.
const R = 6378137.0;
const MAX_LAT = 85.05112878;

function forward(lonDeg: number, latDeg: number): [number, number] {
  const x = R * lonDeg * RAD;
  const y = R * Math.log(Math.tan(Math.PI / 4 + (latDeg * RAD) / 2));
  return [x, y];
}

function inverse(x: number, y: number): [number, number] {
  return [x / R / RAD, (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) / RAD];
}

/** How much a length at this latitude is stretched by the projection. */
const scaleFactor = (latDeg: number) => 1 / Math.cos(latDeg * RAD);

const [x, y] = forward(13.4, 52.5);
console.log(`lon 13.4  lat 52.5  ->  x ${x.toFixed(1)}  y ${y.toFixed(1)}   (metres, EPSG:3857)`);
const [lon2, lat2] = inverse(x, y);
console.log(`back                ->  lon ${lon2.toFixed(6)}  lat ${lat2.toFixed(6)}`);
console.log('');

// Why the square is square: the projection is clipped so the world is as tall
// as it is wide, which is what lets a tile pyramid exist at all.
const [, yTop] = forward(0, MAX_LAT);
console.log(`clipped at latitude ${MAX_LAT}`);
console.log(`  half-width  ${forward(180, 0)[0].toFixed(1)} m`);
console.log(`  half-height ${yTop.toFixed(1)} m`);
console.log('  equal, so the world is a square and every tile is a square');
console.log('');

console.log('A metre on the map is not a metre on the ground:');
for (const lat of [0, 30, 45, 60, 71, 85]) {
  const k = scaleFactor(lat);
  console.log(`  latitude ${String(lat).padStart(2)}   scale x${k.toFixed(2)}   1000 map metres = ${(1000 / k).toFixed(0)} ground metres`);
}
console.log('');
console.log('So an area or a distance computed in EPSG:3857 is wrong everywhere except the');
console.log('equator, and the error grows with latitude. It is a projection for drawing tiles,');
console.log('not for measuring.');
```

The half-width and the half-height come out equal, which is not a coincidence — it is the clipping latitude doing its job.

## When to Use
- When drawing anything on a tiled web map, which is when the choice was already made for you
- When converting between screen or tile coordinates and geographic ones, where these two functions are the whole conversion
- When a measured value taken from a web map looks systematically large — the scale factor at that latitude is the first thing to check
- When choosing a projection for analysis, where Web Mercator is the one to rule out first

## Common Mistakes
- **Measuring distance or area in EPSG:3857** — the error is a latitude-dependent factor and it never announces itself; at 60 degrees north an area is four times too large
- **Buffering by a fixed number of metres in Web Mercator** — the buffer is the requested size only at the equator and grows with latitude, so a "500 m" radius is a kilometre at 60 north
- **Assuming the clipping latitude is a data limit** — it is a projection limit, so polar data exists and simply cannot be drawn in this system
- **Treating EPSG:3857 and EPSG:3395 as the same thing** — one applies the spherical formula to ellipsoidal latitudes and the other does not, and they differ by kilometres
- **Reading "conformal" as "accurate"** — it is a guarantee about angles only, and the projection makes no claim about anything else

## Further Reading
- [EPSG:3857](https://epsg.io/3857) — the definition, including the note about spherical formulae on ellipsoidal coordinates
- [PROJ: Mercator projection](https://proj.org/en/9.4/operations/projections/merc.html) — the forward and inverse equations, with the parameters that distinguish the variants
- [Slippy map tilenames](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames) — the same arithmetic as it appears in the tile scheme lesson 450 covers
- [EPSG registry](https://epsg.org/home.html) — for checking the version of a definition rather than trusting a cached copy

```recall
- q: "State what Web Mercator preserves and what it does not."
  must:
    - "it is conformal — it preserves angles and local shape"
    - "it does not preserve distance or area"
    - "the linear scale factor is the secant of the latitude; area error is its square"

- q: "Why is the projected world square, and at what latitude is it cut?"
  must:
    - "clipped at ±85.05112878 degrees"
    - "that is the latitude where the projected height equals the width"
    - "a quadtree of square tiles needs a square world"

- q: "Give the practical rule for using Web Mercator, and one concrete failure of ignoring it."
  must:
    - "it is a display system — compute elsewhere and project for drawing"
    - "an area computed at 60 north is about four times too large"
    - "a fixed-metre buffer is only that size at the equator"
```
