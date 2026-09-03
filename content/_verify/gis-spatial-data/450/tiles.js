// One point, three addressing schemes, and the box a skipped y-flip hands you.
//
// Determinism: fixed input coordinate, integer tile arithmetic, fixed
// rounding. No clock, no random, no library.

const RAD = Math.PI / 180;

/** Slippy-map / XYZ tile for a coordinate at zoom z — y counts DOWN from the
 *  north edge of the Web Mercator square. */
function tileFor(lonDeg, latDeg, z) {
  const n = 2 ** z;
  const x = Math.floor(((lonDeg + 180) / 360) * n);
  const latRad = latDeg * RAD;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { z, x, y };
}

/** Geographic bounds of an XYZ tile: (west, south, east, north). */
function boundsOf({ z, x, y }) {
  const n = 2 ** z;
  const lon = (i) => (i / n) * 360 - 180;
  const lat = (j) => {
    const t = Math.PI * (1 - (2 * j) / n);
    return Math.atan(Math.sinh(t)) / RAD;
  };
  return { west: lon(x), south: lat(y + 1), east: lon(x + 1), north: lat(y) };
}

/** TMS counts y UP from the south edge. One subtraction apart from XYZ, and
 *  the two are indistinguishable by inspection at any single zoom. */
const toTms = ({ z, y }) => 2 ** z - 1 - y;

/** Bing quadkey: the same z/x/y interleaved into one base-4 string. */
function toQuadkey({ z, x, y }) {
  let key = '';
  for (let i = z; i > 0; i--) {
    const mask = 1 << (i - 1);
    key += String(((x & mask) !== 0 ? 1 : 0) + ((y & mask) !== 0 ? 2 : 0));
  }
  return key;
}

const fmt = (b) =>
  `W ${b.west.toFixed(4)}  S ${b.south.toFixed(4)}  E ${b.east.toFixed(4)}  N ${b.north.toFixed(4)}`;

const LON = -0.1;
const LAT = 51.5;
const Z = 12;

const tile = tileFor(LON, LAT, Z);
const tms = toTms(tile);

console.log(`point  lon ${LON}  lat ${LAT}   zoom ${Z}`);
console.log('');
console.log(`XYZ (slippy map)   ${tile.z}/${tile.x}/${tile.y}`);
console.log(`TMS                ${tile.z}/${tile.x}/${tms}`);
console.log(`quadkey            ${toQuadkey(tile)}`);
console.log('');
console.log('All three name the SAME square:');
console.log(`  ${fmt(boundsOf(tile))}`);
console.log('');
console.log(`Now hand the TMS row number (${tms}) to a server that speaks XYZ:`);
const wrong = { z: Z, x: tile.x, y: tms };
console.log(`  requested ${wrong.z}/${wrong.x}/${wrong.y}`);
console.log(`  ${fmt(boundsOf(wrong))}`);
console.log('');
const right = boundsOf(tile);
const got = boundsOf(wrong);
console.log(`latitude asked for : ${right.south.toFixed(4)} .. ${right.north.toFixed(4)}`);
console.log(`latitude served    : ${got.south.toFixed(4)} .. ${got.north.toFixed(4)}`);
console.log(`the tile arrives ${Math.abs(got.south - right.south).toFixed(4)} degrees of latitude away`);
console.log('');
console.log('It is still a valid tile. It renders. It is on the wrong side of the equator,');
console.log('and across a whole tileset the map reads as vertically mirrored.');

// The one zoom where the bug is invisible, which is why it survives review.
const z0 = tileFor(LON, LAT, 0);
console.log('');
console.log(`at zoom 0: XYZ y = ${z0.y}, TMS y = ${toTms(z0)} — identical, so a smoke test at zoom 0 passes`);
