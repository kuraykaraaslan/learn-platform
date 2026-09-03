// Putting a building on a map. Two coordinate worlds, one transform, and the
// cost of leaving one term out of it.
//
// Determinism: fixed inputs, pure trigonometry, fixed rounding. No clock, no
// random, no library, no network.

const RAD = Math.PI / 180;

// The three numbers that bind a model to a map. In an IFC file these come from
// IfcMapConversion; in an authoring tool they are the survey point and the
// project's rotation to true north.
const BASE_EASTING = 431_250.0;   // metres, in the project's projected CRS
const BASE_NORTHING = 5_712_400.0;
// The angle from the model's +Y axis to true north, measured clockwise. A
// building is almost never modelled square to the grid it sits on.
const TRUE_NORTH_DEG = 23.7;

/** Local model metres -> projected CRS metres. Rotate about the base point,
 *  then translate. Both terms are required; the next function shows what the
 *  second one alone produces. */
function toMap(x, y) {
  const a = TRUE_NORTH_DEG * RAD;
  return {
    e: BASE_EASTING + x * Math.cos(a) + y * Math.sin(a),
    n: BASE_NORTHING - x * Math.sin(a) + y * Math.cos(a),
  };
}

/** The same transform with the rotation left out — the mistake this proof
 *  exists to price. It is a plausible thing to write: the base point is
 *  obviously needed and the angle looks like a detail. */
function toMapWithoutRotation(x, y) {
  return { e: BASE_EASTING + x, n: BASE_NORTHING + y };
}

const dist = (a, b) => Math.hypot(a.e - b.e, a.n - b.n);

// Points across one floor plate, at increasing distance from the base point.
const POINTS = [
  ['base point itself', 0, 0],
  ['lift core', 4, 3],
  ['plant room door', 18, 11],
  ['east facade corner', 42, 6],
  ['far corner of the plate', 78, 54],
  ['site boundary marker', 210, 140],
];

console.log(`base point   E ${BASE_EASTING.toFixed(1)}   N ${BASE_NORTHING.toFixed(1)}`);
console.log(`true north   ${TRUE_NORTH_DEG} degrees from the model's +Y axis`);
console.log('');
console.log('                            local (m)      correct map position        drift if the');
console.log('                              x      y        easting     northing      angle is skipped');
for (const [name, x, y] of POINTS) {
  const right = toMap(x, y);
  const wrong = toMapWithoutRotation(x, y);
  console.log(
    `  ${name.padEnd(24)} ${x.toString().padStart(4)}  ${y.toString().padStart(5)}   ` +
      `${right.e.toFixed(2).padStart(11)}  ${right.n.toFixed(2).padStart(12)}   ` +
      `${dist(right, wrong).toFixed(2).padStart(10)} m`
  );
}
console.log('');
console.log('The drift is zero at the base point and grows with distance from it. A check');
console.log('made near the origin passes. The same check at the far corner of the same');
console.log('floor is out by metres, and nothing in the data says so — both coordinates are');
console.log('valid, both are inside the site, and neither is flagged by any schema.');
console.log('');

// The same arithmetic the other way round: how far out is a given tolerance?
console.log('how far from the base point before the omitted angle exceeds a tolerance:');
for (const tolerance of [0.05, 0.25, 1.0, 5.0]) {
  // Skipping a rotation of theta displaces a point at radius r by
  // 2*r*sin(theta/2) — the chord of the angle it was not turned through.
  const radius = tolerance / (2 * Math.sin((TRUE_NORTH_DEG * RAD) / 2));
  console.log(`  ${tolerance.toFixed(2).padStart(5)} m  ->  ${radius.toFixed(2).padStart(7)} m from the base point`);
}
console.log('');
console.log('At this rotation a 50 mm tolerance is exceeded 0.12 m from the origin, so there');
console.log('is no part of a real building where the omission is within survey tolerance.');
console.log('');

// And the case that makes the omission survive review: a rotation of zero.
console.log('the same table for a building modelled square to the grid (true north 0):');
for (const [name, x, y] of [['far corner of the plate', 78, 54], ['site boundary marker', 210, 140]]) {
  const a = 0;
  const right = {
    e: BASE_EASTING + x * Math.cos(a) + y * Math.sin(a),
    n: BASE_NORTHING - x * Math.sin(a) + y * Math.cos(a),
  };
  const wrong = toMapWithoutRotation(x, y);
  console.log(`  ${name.padEnd(24)} drift ${dist(right, wrong).toFixed(2)} m`);
}
console.log('');
console.log('Zero. So a pipeline developed against one square-to-grid model is correct, ships,');
console.log('and is wrong for every rotated building it meets afterwards.');
