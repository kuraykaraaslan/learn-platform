# 484. Georeferencing BIM into GIS: One Model, Two Coordinate Worlds

## What It Is
This is the most expensive quiet failure in the whole field. A building model lives in a **local Cartesian system**: metres from an origin somebody chose, with its own idea of which way is up the page. A map lives in a **coordinate reference system**: degrees on an ellipsoid, or metres on a projection, anchored to the actual Earth. Putting the first inside the second is three numbers, and getting any of the three wrong moves the entire twin without anything reporting an error.

The three numbers are a **base point** — where the model's origin sits, in the target CRS — a **rotation to true north**, and the **CRS itself**. Lesson 438 is where they live in an IFC file, as `IfcMapConversion` and `IfcProjectedCRS`; Lesson 443 is why the CRS has to be named rather than assumed. This lesson is the arithmetic in between.

The failure worth naming is **omitting the rotation**. It is a plausible omission: the base point is obviously necessary, and the angle looks like a refinement. And its signature is exactly the one that survives review — the error is **zero at the base point and grows with distance from it**. A spot check near the origin passes. The far corner of the same floor plate is out by tens of metres. The proof below prints the drift in metres, and at a realistic rotation a fifty-millimetre tolerance is exceeded about twelve centimetres from the origin, which means there is no part of a real building where the omission is within survey tolerance.

The second reason it survives is worse: a building modelled square to the grid has a rotation of zero, so **the omission costs nothing on that model**. A pipeline developed against one such model is correct, ships, and is wrong for every rotated building it meets afterwards.

```quiz
- q: "A pipeline places model elements on a map. It is checked near the building's origin and looks correct. What has that check established?"
  anchor: "zero at the base point and grows with distance from it"
  options:
    - text: "That the transform is correct"
      correct: false
      why: "Only near the origin. An omitted rotation costs nothing at the base point and grows with distance, so this is the one place the check cannot fail."
    - text: "Almost nothing — the most common error is zero exactly there"
      correct: true
      why: "The check has to be made at the far corner of the plate, where the drift is largest."
    - text: "That the CRS is right, but not the rotation"
      correct: false
      why: "It establishes neither. A wrong CRS is usually a much larger and more obvious displacement, but this check does not test for it either."

- q: "Why does an omitted rotation survive testing on a real project?"
  anchor: "a building modelled square to the grid has a rotation of zero"
  options:
    - text: "Because the drift is smaller than survey tolerance"
      correct: false
      why: "The opposite — the proof shows a 50 mm tolerance exceeded about 12 cm from the origin."
    - text: "Because a building modelled square to the grid has a zero rotation, so the omission costs nothing on that model"
      correct: true
      why: "Correct on the first project, wrong on every rotated one afterwards."
    - text: "Because most GIS tools apply the rotation themselves"
      correct: false
      why: "They apply what the file declares. If the transform never included it, there is nothing for them to apply."
```

## Key Concepts
- **Local Cartesian**: metres from a chosen origin, with its own north — what the model uses
- **Coordinate reference system**: anchored to the Earth, named by an EPSG code — what the map uses
- **Three numbers bind them**: base point, rotation to true north, and the CRS
- **Where they live in IFC**: `IfcMapConversion` and `IfcProjectedCRS` (Lesson 438)
- **Why the CRS must be named**: Lesson 443's datum argument, which this transform sits on top of
- **Omitting the rotation is the common error**, and its drift is zero at the origin
- **The drift is `2r·sin(θ/2)`** — proportional to distance and to the sine of half the angle
- **A square-to-grid model hides it entirely**, which is why the bug ships
- **Check at the far corner**, not near the origin — the only place the check can fail

## Example Code
The transform, both directions, with the drift as a function of distance and angle:

```typescript run
// into. Three inputs bind a model to a map, and all three are required.
type MapPoint = { easting: number; northing: number };
type LocalPoint = { x: number; y: number };

/** What IfcMapConversion carries, and what an authoring tool calls the survey
 *  point plus the project rotation. Named as a type so a function cannot be
 *  handed two of the three. */
type Georeference = {
  /** Where the model's origin sits, in the projected CRS. */
  base: MapPoint;
  /** Degrees from the model's +Y axis to true north, clockwise. */
  trueNorthDeg: number;
  /** The EPSG code the eastings and northings are in. Not decoration:
   *  Lesson 441's whole argument is that the numbers do not carry it. */
  epsg: number;
};

const RAD = Math.PI / 180;

const SITE: Georeference = {
  base: { easting: 431_250.0, northing: 5_712_400.0 },
  trueNorthDeg: 23.7,
  epsg: 25832,
};

function toMap(p: LocalPoint, g: Georeference): MapPoint {
  const a = g.trueNorthDeg * RAD;
  return {
    easting: g.base.easting + p.x * Math.cos(a) + p.y * Math.sin(a),
    northing: g.base.northing - p.x * Math.sin(a) + p.y * Math.cos(a),
  };
}

/** The inverse, which is the direction a click on a map has to travel. */
function toLocal(m: MapPoint, g: Georeference): LocalPoint {
  const a = g.trueNorthDeg * RAD;
  const de = m.easting - g.base.easting;
  const dn = m.northing - g.base.northing;
  return { x: de * Math.cos(a) - dn * Math.sin(a), y: de * Math.sin(a) + dn * Math.cos(a) };
}

const ASSET: LocalPoint = { x: 42.0, y: 6.0 };
const onMap = toMap(ASSET, SITE);
const back = toLocal(onMap, SITE);

console.log(`local        x ${ASSET.x.toFixed(3)}  y ${ASSET.y.toFixed(3)}`);
console.log(`EPSG:${SITE.epsg}   E ${onMap.easting.toFixed(3)}  N ${onMap.northing.toFixed(3)}`);
console.log(`back         x ${back.x.toFixed(3)}  y ${back.y.toFixed(3)}`);
console.log('');

// What omitting the rotation costs, at radius r: the chord of the angle the
// point was not turned through, 2r*sin(theta/2).
const driftAt = (radius: number, deg: number) => 2 * radius * Math.sin((deg * RAD) / 2);

console.log('drift from omitting the rotation, by distance from the base point:');
console.log('  radius     5 deg    15 deg    23.7 deg    40 deg');
for (const radius of [5, 25, 100, 250]) {
  const cells = [5, 15, SITE.trueNorthDeg, 40].map((d) => `${driftAt(radius, d).toFixed(2)} m`.padStart(9));
  console.log(`  ${String(radius).padStart(4)} m  ${cells.join(' ')}`);
}
console.log('');
console.log('The drift is proportional to distance and to the sine of half the angle. It is');
console.log('zero at the origin for every angle, which is why a spot check at the base point');
console.log('cannot detect the omission.');
console.log('');

// The third term people leave out, and the one no arithmetic here can catch.
console.log(`this transform's output is only meaningful as EPSG:${SITE.epsg}.`);
console.log('Handing these eastings and northings to something expecting a different CRS is');
console.log('the datum and projection problem of Lesson 441 and Lesson 443, on top of this one —');
console.log('and it is the reason the EPSG code is a field on the type rather than a comment.');
```

And the same arithmetic run and stamped, on one project's numbers:

```proof sha=f97ee73658389378 at=2026-09-03 commit=ce295c5
$ node georef.js
base point   E 431250.0   N 5712400.0
true north   23.7 degrees from the model's +Y axis

                            local (m)      correct map position        drift if the
                              x      y        easting     northing      angle is skipped
  base point itself           0      0     431250.00    5712400.00         0.00 m
  lift core                   4      3     431254.87    5712401.14         2.05 m
  plant room door            18     11     431270.90    5712402.84         8.66 m
  east facade corner         42      6     431290.87    5712388.61        17.42 m
  far corner of the plate    78     54     431343.13    5712418.09        38.96 m
  site boundary marker      210    140     431498.56    5712443.78       103.66 m

The drift is zero at the base point and grows with distance from it. A check
made near the origin passes. The same check at the far corner of the same
floor is out by metres, and nothing in the data says so — both coordinates are
valid, both are inside the site, and neither is flagged by any schema.

how far from the base point before the omitted angle exceeds a tolerance:
   0.05 m  ->     0.12 m from the base point
   0.25 m  ->     0.61 m from the base point
   1.00 m  ->     2.43 m from the base point
   5.00 m  ->    12.17 m from the base point

At this rotation a 50 mm tolerance is exceeded 0.12 m from the origin, so there
is no part of a real building where the omission is within survey tolerance.

the same table for a building modelled square to the grid (true north 0):
  far corner of the plate  drift 0.00 m
  site boundary marker     drift 0.00 m

Zero. So a pipeline developed against one square-to-grid model is correct, ships,
and is wrong for every rotated building it meets afterwards.
```

## When to Use
- Any time model coordinates cross into a map, a GIS layer, or a spatial database
- When two datasets that should overlap are consistently rotated relative to each other — that signature is this bug
- When accepting a model for a twin, where reading `IfcMapConversion` and checking it at the far corner is the acceptance test
- When writing the transform once, in one place, so that the three numbers are a typed record rather than three constants in different files

## Common Mistakes
- **Omitting the rotation** — plausible, invisible at the origin, and wrong everywhere else in the building
- **Checking near the base point** — the one location where the most common error is exactly zero
- **Testing on a square-to-grid model only** — the omission costs nothing there and everything on the next project
- **Treating the base point as the only input** — the transform is a rotation and a translation, and the rotation is the half that gets dropped
- **Not carrying the EPSG code with the output** — eastings and northings do not say what they are in (Lesson 441), and the next consumer will assume
- **Applying the rotation twice** — once in the export and once in your own transform; it works out to a double rotation, and the symptom looks like a wrong angle rather than a duplicated one

## Further Reading
- [IfcMapConversion](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcMapConversion.htm) — the three numbers as IFC records them, and the version boundary Lesson 438 documents
- [IfcProjectedCRS](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcProjectedCRS.htm) — how the target system is named in the file
- [EPSG registry](https://epsg.org/home.html) — where the CRS this transform outputs into is defined, and versioned
- [PROJ documentation](https://proj.org/en/9.4/operations/conversions/index.html) — the library to reach for once the transform stops being a rotation and a translation

```recall
- q: "Name the three numbers that bind a model to a map."
  must:
    - "a base point — where the model origin sits in the target CRS"
    - "a rotation to true north"
    - "the CRS itself, named by an EPSG code"

- q: "Why does omitting the rotation survive both review and testing?"
  must:
    - "the drift is zero at the base point and grows with distance"
    - "so a spot check near the origin passes"
    - "and a building modelled square to the grid has a zero rotation, so the omission costs nothing on that model"

- q: "Where should the transform be checked, and what is the drift proportional to?"
  must:
    - "at the far corner of the floor plate, the furthest point from the base"
    - "the drift is 2r·sin(θ/2) — proportional to distance and to the sine of half the angle"
```
