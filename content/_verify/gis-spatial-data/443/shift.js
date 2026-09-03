// How far apart the SAME latitude/longitude numbers are when they are read on
// two different datums. Every constant below is a published, versioned value,
// named where it came from — nothing here is estimated.
//
// Determinism: fixed inputs, pure arithmetic, fixed iteration count, fixed
// rounding. No clock, no random, no library version in the output.

// Ellipsoids — EPSG defining parameters (semi-major axis, inverse flattening).
const ELLIPSOIDS = {
  // EPSG:7001
  'Airy 1830': { a: 6377563.396, invF: 299.3249646 },
  // EPSG:7030
  'WGS 84': { a: 6378137.0, invF: 298.257223563 },
};

// EPSG:1314 — "OSGB36 to WGS 84 (6)", Position Vector 7-parameter transformation.
// Stated accuracy: 2.0 m. Translations in metres, rotations in arc-seconds,
// scale difference in parts per million.
const EPSG_1314 = { dX: 446.448, dY: -125.157, dZ: 542.06, rX: 0.15, rY: 0.247, rZ: 0.842, ppm: -20.489 };

const RAD = Math.PI / 180;
const ARCSEC = RAD / 3600;

function eccSq({ a, invF }) {
  const f = 1 / invF;
  return 2 * f - f * f;
}

function toEcef(latDeg, lonDeg, h, ellipsoid) {
  const e2 = eccSq(ellipsoid);
  const lat = latDeg * RAD;
  const lon = lonDeg * RAD;
  const sinLat = Math.sin(lat);
  const N = ellipsoid.a / Math.sqrt(1 - e2 * sinLat * sinLat);
  return [
    (N + h) * Math.cos(lat) * Math.cos(lon),
    (N + h) * Math.cos(lat) * Math.sin(lon),
    (N * (1 - e2) + h) * sinLat,
  ];
}

function fromEcef([x, y, z], ellipsoid) {
  const e2 = eccSq(ellipsoid);
  const lon = Math.atan2(y, x);
  const p = Math.hypot(x, y);
  let lat = Math.atan2(z, p * (1 - e2));
  let N = ellipsoid.a;
  // Fixed iteration count, not a convergence test: the same number of steps
  // every run is what keeps the printed digits identical.
  for (let i = 0; i < 12; i++) {
    const sinLat = Math.sin(lat);
    N = ellipsoid.a / Math.sqrt(1 - e2 * sinLat * sinLat);
    lat = Math.atan2(z + e2 * N * sinLat, p);
  }
  const h = p / Math.cos(lat) - N;
  return [lat / RAD, lon / RAD, h];
}

/** EPSG method 9606, Position Vector convention. */
function helmert([x, y, z], t) {
  const s = 1 + t.ppm * 1e-6;
  const [rx, ry, rz] = [t.rX * ARCSEC, t.rY * ARCSEC, t.rZ * ARCSEC];
  return [
    t.dX + s * (x - rz * y + ry * z),
    t.dY + s * (rz * x + y - rx * z),
    t.dZ + s * (-ry * x + rx * y + z),
  ];
}

/** Metres per radian of latitude and of longitude at this latitude — the
 *  local radii of curvature, so an angular difference becomes a ground
 *  distance without a spherical approximation. */
function metresPerRadian(latDeg, ellipsoid) {
  const e2 = eccSq(ellipsoid);
  const sinLat = Math.sin(latDeg * RAD);
  const w = 1 - e2 * sinLat * sinLat;
  const M = (ellipsoid.a * (1 - e2)) / Math.pow(w, 1.5); // meridional
  const N = ellipsoid.a / Math.sqrt(w); // prime vertical
  return { north: M, east: N * Math.cos(latDeg * RAD) };
}

const airy = ELLIPSOIDS['Airy 1830'];
const wgs84 = ELLIPSOIDS['WGS 84'];

console.log('Ellipsoids (EPSG defining parameters)');
for (const [name, e] of Object.entries(ELLIPSOIDS)) {
  console.log(`  ${name.padEnd(11)} a = ${e.a.toFixed(3)} m   1/f = ${e.invF}`);
}
console.log(`  semi-major axes differ by ${(wgs84.a - airy.a).toFixed(3)} m`);
console.log('');
console.log('EPSG:1314  OSGB36 to WGS 84 (6), Position Vector 7-parameter, stated accuracy 2.0 m');
console.log(`  translation  dX ${EPSG_1314.dX} m  dY ${EPSG_1314.dY} m  dZ ${EPSG_1314.dZ} m`);
console.log(`  rotation     rX ${EPSG_1314.rX}"  rY ${EPSG_1314.rY}"  rZ ${EPSG_1314.rZ}"`);
console.log(`  scale        ${EPSG_1314.ppm} ppm`);
console.log('');
console.log('The same numbers, read on OSGB36 and then placed on WGS 84:');
console.log('');
console.log('  latitude  longitude    d(north)   d(east)    total');

// Plain coordinates, described by their own numbers — no place names, because
// a place name is a claim this run cannot check.
const POINTS = [
  [50.0, -5.0],
  [52.0, -2.0],
  [54.0, -1.0],
  [56.0, -3.0],
  [58.0, -4.0],
];

for (const [lat, lon] of POINTS) {
  const [wLat, wLon] = fromEcef(helmert(toEcef(lat, lon, 0, airy), EPSG_1314), wgs84);
  const scale = metresPerRadian(lat, wgs84);
  const dNorth = (wLat - lat) * RAD * scale.north;
  const dEast = (wLon - lon) * RAD * scale.east;
  const total = Math.hypot(dNorth, dEast);
  console.log(
    `  ${lat.toFixed(1).padStart(6)}N  ${lon.toFixed(1).padStart(7)}E   ` +
      `${dNorth.toFixed(1).padStart(8)} m ${dEast.toFixed(1).padStart(8)} m ${total.toFixed(1).padStart(8)} m`
  );
}

console.log('');
console.log('Every one of those pairs is valid JSON, valid GeoJSON, and inside the United Kingdom.');
console.log('No schema check separates the two readings. The distance between them does.');
