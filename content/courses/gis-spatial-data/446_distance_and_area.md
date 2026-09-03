# 446. Distance and Area on a Sphere: Haversine, Planar Error, and When Each Lies

## What It Is
"How far apart are these two points" has three common answers, and the difference between them is a factor, not a rounding.

The wrong one is subtracting degrees and calling the result a distance. It is exact on the equator and wrong everywhere else, because a degree of longitude shrinks with the cosine of the latitude while a degree of latitude does not. There is no threshold where this starts being a problem; the error grows smoothly, so a system built and tested near the equator ships and then produces nonsense for a user further north.

The cheap correct-enough one is **equirectangular with a cosine correction**: scale the longitude difference by the cosine of the mid-latitude, then take the hypotenuse. One extra multiplication, and it stays within a tenth of a percent for spans up to a few hundred kilometres. For sorting nearby results, filtering candidates, or anything where the answer feeds a comparison rather than a report, this is the right tool.

The standard one is **haversine**: the great-circle distance on a sphere. It is correct at any distance, and its remaining error is the sphere itself. WGS 84's semi-major and semi-minor axes differ by about 0.34% of the mean radius, so which radius you pick already moves the answer by that much. Below a few hundred kilometres that is smaller than the accuracy of the coordinates. Across a continent it is not, and the right tool is a geodesic on the ellipsoid — Vincenty or Karney — not a better sphere.

Area is worse than distance, because it compounds. Any planar area formula applied to degrees is wrong by roughly the square of the longitude error, and the honest answer for anything but a rough sort is to project into an equal-area system for the region and measure there.

```quiz
- q: "At what latitude does treating degrees as a flat grid start being wrong?"
  anchor: "There is no threshold where this starts being a problem; the error grows smoothly"
  options:
    - text: "Above about 45 degrees, where the cosine drops below 0.7"
      correct: false
      why: "There is no threshold. At 20 degrees it is already several percent, and it grows continuously from zero."
    - text: "It is exact only on the equator and grows continuously from there"
      correct: true
      why: "Which is what makes it dangerous: the system is never obviously broken, just increasingly wrong."
    - text: "It is never wrong for small distances, at any latitude"
      correct: false
      why: "The error is proportional, not absolute — a short distance at 70 north is wrong by the same percentage as a long one."

- q: "When does haversine stop being the right tool?"
  anchor: "the right tool is a geodesic on the ellipsoid"
  options:
    - text: "Over short distances, where floating-point cancellation dominates"
      correct: false
      why: "Haversine was formulated precisely to be stable over short distances — that is what it is for."
    - text: "Over long distances, where the difference between a sphere and the ellipsoid exceeds the accuracy you need"
      correct: true
      why: "The sphere is the assumption, and its cost is proportional to the distance."
    - text: "Near the poles, where the formula is undefined"
      correct: false
      why: "It is defined everywhere. The pole problem belongs to the projections, not to this formula."
```

## Key Concepts
- **Degrees are not metres**: a degree of longitude is worth the cosine of the latitude times a degree of latitude
- **Equirectangular with cosine scaling**: one multiplication, within a tenth of a percent up to a few hundred kilometres
- **Haversine**: great-circle distance on a sphere; correct at any distance, numerically stable at short ones
- **The sphere is the remaining assumption**: WGS 84's axes differ by about 0.34% of the mean radius, which bounds the choice
- **Geodesic on the ellipsoid**: Vincenty or Karney, for when that 0.34% matters
- **Errors are proportional**: a short distance at high latitude is wrong by the same percentage as a long one
- **Area compounds the error**: the longitude mistake enters twice, so an area is wrong by roughly the square
- **Equal-area projection for area**: project into one appropriate to the region and measure on the plane

## Example Code
Three methods, one span, every latitude:

```typescript run
const RAD = Math.PI / 180;
// IUGG mean radius. Any sphere radius is a choice, and choosing one is already
// an approximation — a real ellipsoid distance uses Vincenty or Karney.
const R = 6371008.8;

type Point = { lat: number; lon: number };

function haversine(a: Point, b: Point): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** What you get when degrees are treated as a flat grid — the mistake that
 *  hides because it is almost right near the equator. */
function planarDegrees(a: Point, b: Point): number {
  const dLat = (b.lat - a.lat) * RAD * R;
  const dLon = (b.lon - a.lon) * RAD * R;
  return Math.hypot(dLat, dLon);
}

/** The cheap fix: scale longitude by the cosine of the latitude. Good to
 *  well under a percent over short spans, and it is one multiplication. */
function equirectangular(a: Point, b: Point): number {
  const mid = ((a.lat + b.lat) / 2) * RAD;
  const dLat = (b.lat - a.lat) * RAD * R;
  const dLon = (b.lon - a.lon) * RAD * R * Math.cos(mid);
  return Math.hypot(dLat, dLon);
}

const DELTA = 0.1; // degrees north AND east, at each latitude

console.log('A tenth of a degree north-east, measured three ways:');
console.log('');
console.log('  lat    haversine     flat degrees   error    cos-scaled   error');
for (const lat of [0, 20, 40, 55, 70, 80]) {
  const a: Point = { lat, lon: 0 };
  const b: Point = { lat: lat + DELTA, lon: DELTA };
  const h = haversine(a, b);
  const p = planarDegrees(a, b);
  const e = equirectangular(a, b);
  console.log(
    `  ${String(lat).padStart(3)}   ${h.toFixed(0).padStart(8)} m   ${p.toFixed(0).padStart(8)} m  ` +
      `${(((p - h) / h) * 100).toFixed(1).padStart(6)}%   ${e.toFixed(0).padStart(8)} m  ${(((e - h) / h) * 100).toFixed(3).padStart(7)}%`
  );
}

console.log('');
console.log('The cosine scaling is free only while the span is short. At 55 north:');
for (const d of [0.1, 1, 5, 20]) {
  const a: Point = { lat: 55, lon: 0 };
  const b: Point = { lat: 55 + d, lon: d };
  const h = haversine(a, b);
  console.log(
    `  ${String(d).padStart(4)} deg  ${(h / 1000).toFixed(0).padStart(5)} km   cos-scaled off by ${(((equirectangular(a, b) - h) / h) * 100).toFixed(3)}%`
  );
}

console.log('');
console.log('Flat degrees are exact on the equator and wrong by a factor at high latitude.');
console.log('There is no latitude where the error announces itself — it just grows. The');
console.log('cosine scaling costs one multiplication and holds to a tenth of a percent out');
console.log('to a few hundred kilometres, then starts costing something of its own.');
console.log('');

// Where the sphere itself stops being the right model. WGS 84's defining
// parameters, so this is arithmetic rather than a remembered rule of thumb.
const WGS84_A = 6378137.0;
const WGS84_INV_F = 298.257223563;
const WGS84_B = WGS84_A * (1 - 1 / WGS84_INV_F);
const spread = ((WGS84_A - WGS84_B) / R) * 100;
console.log(`Haversine's own limit is the sphere. WGS 84's semi-major axis is ${WGS84_A.toFixed(0)} m`);
console.log(`and its semi-minor axis is ${WGS84_B.toFixed(0)} m — a spread of ${spread.toFixed(2)}% of the mean radius.`);
const across = haversine({ lat: 0, lon: 0 }, { lat: 0, lon: 45 });
console.log(`Over ${(across / 1000).toFixed(0)} km, choosing the other radius moves the answer by ${((across * spread) / 100 / 1000).toFixed(0)} km.`);
console.log('Under a few hundred kilometres that is smaller than the positional accuracy of');
console.log('the coordinates themselves. Across a continent it is not, and the tool is a');
console.log('geodesic on the ellipsoid — Vincenty or Karney — not a bigger sphere.');
```

## When to Use
- Sorting or filtering "nearest" results, where equirectangular is enough and much cheaper
- Reporting a distance to a person, where haversine is the floor and the units should say what model produced them
- Measuring across a country or a continent, where the sphere assumption is the dominant error and a geodesic is the tool
- Reviewing any code that computes a radius, a buffer or a proximity threshold from raw degrees

## Common Mistakes
- **`Math.hypot(lat2 - lat1, lon2 - lon1)`** — the canonical form of the bug; exact at the equator, 39% too long at 80 north for a diagonal span, and it never errors
- **Picking a sphere radius without saying which** — the equatorial and polar radii differ by 0.34% of the mean, so the radius is part of the answer
- **Using haversine for area** — it is a distance formula; area on a sphere is a different computation and usually the wrong one anyway
- **Computing area in Web Mercator** — the projection that drew the map is the one that must not measure it, per lesson 444
- **Treating a proximity query as exact** — the index (lesson 447) is a filter, and the exact distance is computed afterwards on the survivors
- **Reporting more precision than the model supports** — a haversine result to the metre over a thousand kilometres implies an accuracy the sphere assumption does not have

## Further Reading
- [EPSG:4979](https://epsg.io/4979) — WGS 84's three-dimensional geographic system, and the ellipsoid parameters this lesson computes from
- [PROJ documentation](https://proj.org/en/9.4/operations/conversions/index.html) — including the geodesic operations that replace haversine when the sphere is no longer good enough
- [PostGIS: ST_Distance](https://postgis.net/docs/manual-3.4/ST_Distance.html) — how a spatial database distinguishes a planar distance from a geodesic one, and what each one costs

```recall
- q: "Rank the three distance methods and say what each one costs."
  must:
    - "flat degrees — free and wrong everywhere except the equator"
    - "equirectangular with cosine scaling — one multiplication, within a tenth of a percent to a few hundred kilometres"
    - "haversine — great-circle on a sphere, correct at any distance"

- q: "What is haversine's own remaining error, and how do you bound it?"
  must:
    - "it assumes a sphere"
    - "WGS 84's semi-major and semi-minor axes differ by about 0.34% of the mean radius"
    - "so the radius you choose already moves the answer by that much"
    - "the fix is a geodesic on the ellipsoid — Vincenty or Karney"

- q: "Why is area harder than distance, and what should you do instead?"
  must:
    - "the longitude error enters twice, so the error is roughly squared"
    - "project into an equal-area system appropriate to the region and measure there"
```
