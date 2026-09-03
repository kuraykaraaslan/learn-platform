# 442. Axis Order: The lon/lat Swap That Passes Every Schema Check

## What It Is
`[41.0, 29.0]` is valid JSON. It is valid GeoJSON. Both numbers are inside every range a validator can check. It names a point in the Zagros mountains or a point in the Sea of Marmara depending on which of two conventions the writer had in mind, and **nothing in the data says which**.

GeoJSON is explicit: RFC 7946 section 3.1.1 says a position is longitude, then latitude, then optional altitude. So is Web Mercator, and so is almost every graphics pipeline, because x comes before y. Meanwhile the human convention is latitude first — it is how coordinates are read aloud, how a `lat`/`lon` column pair is usually declared, how most consumer geocoding APIs answer, and how every "51.5, -0.1" written on a slide is meant. Both conventions are correct in their own context. The bug lives at the boundary between them.

What makes it survive is that **it is only detectable when one of the values exceeds 90**. Latitude is bounded to ±90 and longitude to ±180, so a swap is caught exactly when the longitude was above 90 or below -90 — roughly a third of the globe, and not the third most software is tested against. Everywhere else the swapped pair is a perfectly ordinary position somewhere else entirely, and it passes the schema, the type check, and the eye.

The fix is not a smarter validator, because the information is not in the data. It is naming: a type that says which convention it is in, a function that takes named fields rather than a tuple, and a conversion that happens once at each boundary rather than opportunistically wherever a map looked wrong.

```quiz
- q: "Which range check catches a lon/lat swap?"
  anchor: "it is only detectable when one of the values exceeds 90"
  options:
    - text: "Latitude between -90 and 90 — a swapped longitude usually exceeds it"
      correct: true
      why: "And only then. Any pair where both values are inside ±90 swaps silently."
    - text: "Longitude between -180 and 180 — a swapped latitude never fits"
      correct: false
      why: "A latitude is at most 90, which is comfortably inside the longitude range. That check never fires."
    - text: "Neither — both values are always valid in both slots"
      correct: false
      why: "Not always: a longitude beyond ±90 is out of range as a latitude, which is the one case that is caught."

- q: "GeoJSON, your database's lat/lon columns, and a geocoding API disagree on order. What is the fix?"
  anchor: "a conversion that happens once at each boundary"
  options:
    - text: "Normalise everything to GeoJSON order at the point of use"
      correct: false
      why: "\"At the point of use\" means at many points, and one of them will be missed. The conversion belongs at the boundary."
    - text: "Convert once at each boundary, with types that name the convention on both sides"
      correct: true
      why: "The information is not in the data, so it has to be in the type — and applied where data enters and leaves."
    - text: "Add a runtime check that rejects implausible coordinates"
      correct: false
      why: "Plausibility is exactly what a swap preserves. There is nothing implausible about the wrong answer."
```

## Key Concepts
- **RFC 7946 order**: a GeoJSON position is `[longitude, latitude]`, optionally followed by altitude
- **Human order**: latitude first — spoken coordinates, most `lat`/`lon` column pairs, most consumer geocoding responses
- **Both are correct**: neither convention is a mistake; the boundary between them is
- **Detectable only past ±90**: a swap is caught when longitude was outside ±90, and is silent otherwise
- **Plausible wrong answers**: the swapped point is a real place, so no sanity check fires
- **Convert at boundaries**: one conversion where data enters and one where it leaves, not wherever a map looked wrong
- **Name the convention in the type**: a tuple carries order by position and nothing else; named fields carry it in the name
- **EPSG:4326's own axis order is latitude first** — which is why a system that follows the registry strictly and a system that follows GeoJSON disagree while both being right

## Example Code
The two readings of one pair, and the distance between them:

```typescript run
type Pair = [number, number];

const RAD = Math.PI / 180;
const EARTH_RADIUS_M = 6371008.8; // IUGG mean radius

function haversineMetres(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// GeoJSON says position is [longitude, latitude]. Most human-facing APIs,
// most databases' lat/lon columns, and every "41.0, 29.0" written on a slide
// say the other one.
const PAIR: Pair = [41.0, 29.0];

const asGeoJson = { lon: PAIR[0], lat: PAIR[1] };
const asLatLon = { lat: PAIR[0], lon: PAIR[1] };

console.log(`the pair as written           [${PAIR[0]}, ${PAIR[1]}]`);
console.log(`read as GeoJSON [lon, lat]    lon ${asGeoJson.lon}  lat ${asGeoJson.lat}`);
console.log(`read as [lat, lon]            lat ${asLatLon.lat}  lon ${asLatLon.lon}`);
console.log('');
console.log(`distance between the two readings: ${(haversineMetres(asGeoJson, asLatLon) / 1000).toFixed(0)} km`);
console.log('');

// Both readings pass every check a schema can express.
const isValidPosition = (lon: number, lat: number) =>
  lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
console.log(`GeoJSON reading in range?     ${isValidPosition(asGeoJson.lon, asGeoJson.lat)}`);
console.log(`[lat, lon] reading in range?  ${isValidPosition(asLatLon.lon, asLatLon.lat)}`);
console.log('');

// The one range where the swap IS detectable, and why it is not a defence.
const OUT_OF_RANGE: Pair = [120.0, 24.0];
console.log(`[${OUT_OF_RANGE[0]}, ${OUT_OF_RANGE[1]}] as [lat, lon]: latitude ${OUT_OF_RANGE[0]} is out of range — caught`);
console.log('A swap is only detectable when one value exceeds 90. Every coordinate between');
console.log('-90 and 90 in both slots swaps silently, which is most of the inhabited world.');
```

Seventeen hundred kilometres, from a pair that every layer of the stack accepted.

## When to Use
- At every boundary where coordinates enter or leave: an HTTP handler, a file reader, a queue consumer, a database mapper
- When reviewing a schema that stores positions as an array rather than as named fields
- When a map renders points in the sea, in a mirrored arrangement, or rotated ninety degrees — the classic signatures
- When integrating a geocoding API, where the response order is a documentation fact and not a guess

## Common Mistakes
- **Passing coordinates as a bare tuple across a boundary** — the order is carried by position alone, so the first mismatched reader is silently wrong
- **Trusting a range check to catch it** — it fires only when longitude was outside ±90, which is the minority of cases and never the ones under test
- **Fixing it at the point where the map looked wrong** — that swaps one call site and leaves every other reader of the same data disagreeing
- **Assuming EPSG:4326 means longitude first** — the registry's own axis order for that system is latitude first, and GeoJSON deliberately fixed the opposite order; both are documented, and only one is in your code
- **Testing with a coordinate whose values are both under 90** — the entire class of bug is invisible there, so a passing test proves nothing

## Further Reading
- [RFC 7946 — The GeoJSON Format](https://datatracker.ietf.org/doc/html/rfc7946) — section 3.1.1 states the order and section 4 explains the decision
- [EPSG:4326](https://epsg.io/4326) — including the axis order the registry defines for it, which is the other half of the confusion
- [PROJ documentation](https://proj.org/en/9.4/operations/conversions/index.html) — how a library that has to satisfy both conventions handles the question
- [EPSG registry](https://epsg.org/home.html) — where axis order is a property of the system, recorded rather than assumed

```recall
- q: "State both axis-order conventions and where each one is normal."
  must:
    - "GeoJSON, RFC 7946 section 3.1.1: longitude then latitude"
    - "human and most lat/lon column pairs: latitude first"
    - "EPSG:4326's own registry axis order is latitude first"
    - "neither is a mistake; the boundary between them is"

- q: "Explain why range validation is not a defence against a swap."
  must:
    - "a swap is only detectable when longitude was outside ±90"
    - "any pair with both values inside ±90 is valid in either reading"
    - "the swapped point is a real place, so nothing implausible shows up"

- q: "Where does the conversion belong, and why not at the point of use?"
  must:
    - "once at each boundary where data enters or leaves"
    - "the point of use is many points, and one will be missed"
    - "the convention should be named in the type, since it is not in the data"
```
