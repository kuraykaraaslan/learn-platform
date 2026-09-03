# 443. EPSG Codes and Datums: What "WGS 84" Does Not Tell You

## What It Is
"It's in WGS 84" is the answer people give when asked what reference system their coordinates are in, and it is usually true and rarely sufficient. WGS 84 names a **datum**: an ellipsoid, plus a decision about where that ellipsoid sits relative to the actual Earth. It is the second half that matters, because two datums can use ellipsoids of almost the same size and still place the same latitude and longitude a hundred metres apart.

An **EPSG code** is how you say which system precisely, without prose. EPSG:4326 is the geographic system on the WGS 84 datum. EPSG:3857 is Web Mercator. EPSG:4277 is OSGB36, a British datum built on the Airy 1830 ellipsoid, which was surveyed for one country and fits it better locally than a global ellipsoid does. Codes are what let a database column, a file header and an API response agree on something checkable rather than on a phrase.

Moving between datums is a **transformation**, and unlike a projection it is not exact. The relationship between two datums is measured, so it comes with published parameters and a stated accuracy — EPSG:1314, the transformation the proof below runs, states 2 metres. That number is part of the answer: a pipeline that transforms datums cannot be more accurate than the transformation it used, however many decimal places it prints.

The trap is that datum mismatch produces **no error at all**. The numbers stay in range, the JSON stays valid, the points render. They are simply about a hundred metres from where they should be, which is larger than most positional requirements and smaller than anything a person notices on a zoomed-out map.

```quiz
- q: "Two datasets both say WGS 84 and do not line up. What has that phrase not told you?"
  anchor: "two datums can use ellipsoids of almost the same size and still place the same latitude and longitude a hundred metres apart"
  options:
    - text: "Nothing is missing — if both say WGS 84, one of them is mislabelled"
      correct: true
      why: "That is the likeliest cause, and finding out which one means asking what system the data was actually captured in — which is the point: the label is a claim, not a measurement."
    - text: "The projection, which WGS 84 does not specify"
      correct: false
      why: "True but not the misalignment: a projection change moves the numbers visibly, not by a quiet hundred metres."
    - text: "The units, which could be degrees or metres"
      correct: false
      why: "A unit mismatch is a factor-of-thousands error, not an offset."

- q: "A datum transformation states an accuracy of 2 metres. What does that constrain?"
  anchor: "a pipeline that transforms datums cannot be more accurate than the transformation it used"
  options:
    - text: "Nothing, if your input coordinates are more accurate than that"
      correct: false
      why: "The transformation's own uncertainty is added to whatever the input had. Precise input through an approximate transform is approximate output."
    - text: "The accuracy of everything downstream of it, no matter how precise the input was"
      correct: true
      why: "It is a published property of the relationship between two datums, and it does not improve by being ignored."
    - text: "Only the height component, since horizontal transforms are exact"
      correct: false
      why: "No part of a datum transformation is exact — the relationship between two datums is measured, not defined."
```

## Key Concepts
- **Datum**: an ellipsoid plus its position and orientation relative to the real Earth
- **Ellipsoid**: defined by a semi-major axis and an inverse flattening — published, exact, and the easy half
- **EPSG code**: a registry identifier for a whole system, so "which system" becomes checkable instead of prose
- **EPSG:4326 / EPSG:3857 / EPSG:4277**: WGS 84 geographic, Web Mercator, and OSGB36 — three codes that name three different things
- **Transformation vs conversion**: a projection is exact arithmetic; a datum transformation is measured, approximate, and comes with a stated accuracy
- **Helmert 7-parameter**: three translations, three rotations and a scale — the common shape of a datum transformation
- **Stated accuracy is a ceiling**: 2 metres of transformation uncertainty is 2 metres in everything downstream
- **A local datum can fit its own country better** than a global one, which is why national datums exist and persist

## Example Code
Every constant here is a published EPSG value. The distances are computed, not asserted:

```proof sha=7da6c2af3f022b24 at=2026-09-03 commit=0f4c9d0
$ node shift.js
Ellipsoids (EPSG defining parameters)
  Airy 1830   a = 6377563.396 m   1/f = 299.3249646
  WGS 84      a = 6378137.000 m   1/f = 298.257223563
  semi-major axes differ by 573.604 m

EPSG:1314  OSGB36 to WGS 84 (6), Position Vector 7-parameter, stated accuracy 2.0 m
  translation  dX 446.448 m  dY -125.157 m  dZ 542.06 m
  rotation     rX 0.15"  rY 0.247"  rZ 0.842"
  scale        -20.489 ppm

The same numbers, read on OSGB36 and then placed on WGS 84:

  latitude  longitude    d(north)   d(east)    total
    50.0N     -5.0E       68.9 m    -72.0 m     99.6 m
    52.0N     -2.0E       47.3 m    -96.9 m    107.8 m
    54.0N     -1.0E       22.9 m   -105.6 m    108.1 m
    56.0N     -3.0E       -6.8 m    -90.5 m     90.8 m
    58.0N     -4.0E      -35.0 m    -83.3 m     90.4 m

Every one of those pairs is valid JSON, valid GeoJSON, and inside the United Kingdom.
No schema check separates the two readings. The distance between them does.
```

About a hundred metres, from a mislabel no validator can see. The tolerance in a positional accuracy requirement is almost always tighter than that.

```typescript
/** What a coordinate has to carry for any of the above to be checkable.
 *  The EPSG code is not decoration: it is the difference between a position
 *  and two numbers that resemble one. */
export type Position = {
  epsg: number;
  lat: number;
  lon: number;
  /** Metres. Where it came from, so a downstream consumer can add its own
   *  uncertainty to it rather than inheriting a false precision. */
  accuracy: number;
};

/** A transformation's own stated accuracy joins the budget; it never shrinks
 *  it. EPSG:1314 publishes 2.0 m, so nothing downstream of it is better. */
export function transformed(from: Position, toEpsg: number, transformAccuracy: number, lat: number, lon: number): Position {
  return {
    epsg: toEpsg,
    lat,
    lon,
    accuracy: Math.hypot(from.accuracy, transformAccuracy),
  };
}
```

## When to Use
- When two datasets that should overlap are consistently offset by tens of metres in the same direction
- When accepting coordinates from a source whose datum you did not choose — survey data, national open data, an older archive
- When writing down what a system stores, where an EPSG column makes the claim checkable
- When a positional accuracy requirement exists at all, since the transformation's stated accuracy is part of the budget

## Common Mistakes
- **Treating "WGS 84" as a complete specification** — it is a datum, and the phrase is often a label someone applied rather than a system someone measured in
- **Transforming datums without recording which transformation was used** — several exist between any two datums, with different parameters and different accuracies, and the answer differs by metres
- **Printing more precision than the transformation supports** — six decimal places of latitude is about ten centimetres, and a 2-metre transformation cannot support it
- **Assuming a national datum is obsolete** — national mapping, cadastral records and utility data are still published on them, and converting is the integration, not a legacy detail
- **Confusing a projection change with a datum change** — reprojecting is exact and reversible; transforming datums is neither, and only one of them needs an accuracy budget

## Further Reading
- [EPSG:1314 — OSGB36 to WGS 84 (6)](https://epsg.io/1314) — the seven parameters and the stated 2 m accuracy this lesson's proof runs on
- [EPSG:4277 — OSGB36](https://epsg.io/4277) — the datum and the Airy 1830 ellipsoid it is built on
- [EPSG registry](https://epsg.org/home.html) — the authority, where a code resolves to a definition with a version
- [PROJ: Helmert transform](https://proj.org/en/9.4/operations/transformations/helmert.html) — the same seven parameters as a library operation, with both rotation conventions spelled out
- [Lesson 497](/courses/field-data-collection/gps-accuracy) — the datum question from the other end: a phone reports WGS 84, and what its accuracy field does and does not mean

```recall
- q: "What does a datum add on top of an ellipsoid, and why does it matter?"
  must:
    - "where the ellipsoid sits relative to the real Earth — its position and orientation"
    - "two datums with near-identical ellipsoids can place the same lat/lon about a hundred metres apart"
    - "the mismatch produces no error: valid numbers, valid JSON, wrong place"

- q: "Contrast a projection with a datum transformation."
  must:
    - "a projection is exact arithmetic and reversible"
    - "a datum transformation is measured, approximate, and published with a stated accuracy"
    - "several transformations can exist between the same two datums, giving answers metres apart"

- q: "A transformation states 2 m accuracy. What follows for the rest of the pipeline?"
  must:
    - "nothing downstream can be more accurate than that"
    - "it joins the accuracy budget rather than being replaced by precise input"
    - "printing six decimal places of latitude claims a precision the transform does not support"
```
