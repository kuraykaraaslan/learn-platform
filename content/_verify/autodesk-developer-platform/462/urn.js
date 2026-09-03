// Standard base64 and base64url differ in exactly three places: `+` becomes
// `-`, `/` becomes `_`, and the `=` padding is dropped. Which of the three a
// given object id actually hits depends on its bytes — and that is the point
// this run exists to measure rather than assert.
//
// Determinism: a fixed list of object keys, pure encoding, no clock and no
// network. Node builtins only.

const PREFIX = 'urn:adsk.objects:os.object:';

const toBase64 = (s) => Buffer.from(s, 'utf8').toString('base64');
const toBase64Url = (s) => toBase64(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Object keys of the shape a real project produces: a bucket, a slash, a file.
const ASCII_KEYS = [];
for (const bucket of ['riverside-depot', 'riverside-depot-2026', 'rvsd', 'depot-federated']) {
  for (const file of [
    'depot.rvt', 'depot-l1.rvt', 'depot-l2.rvt', 'depot-struct.rvt', 'depot-mep.rvt',
    'shell-r2.rvt', 'shell-r3.rvt', 'level-01.rvt', 'level-02.rvt', 'site.rvt',
    'depot-arch-2026-03.rvt', 'depot-coordination.nwd', 'depot.ifc', 'depot-export.ifc',
  ]) {
    ASCII_KEYS.push(`${PREFIX}${bucket}/${file}`);
  }
}

let withPlus = 0;
let withSlash = 0;
let withPad = 0;
for (const key of ASCII_KEYS) {
  const b = toBase64(key);
  if (b.includes('+')) withPlus++;
  if (b.includes('/')) withSlash++;
  if (b.includes('=')) withPad++;
}

console.log(`${ASCII_KEYS.length} plausible ASCII object ids, encoded with standard base64:`);
console.log(`  contain "+"  ${withPlus}`);
console.log(`  contain "/"  ${withSlash}`);
console.log(`  contain "="  ${withPad}`);
console.log('');
console.log('So a test suite built from ASCII names exercises the padding difference and');
console.log('never the alphabet difference. The first name that does is not a test.');
console.log('');

// The names that do reach the other two substitutions. Nothing exotic: an
// accented character and a supplementary-plane one, both legal in a filename.
const AWKWARD = [
  `${PREFIX}riverside-depot/facade~r2.rvt`,
  `${PREFIX}riverside-depot/façade~r2.rvt`,
  `${PREFIX}riverside-depot/ab₿-depot.rvt`,
];

console.log('base64                                                                    url-safe');
for (const key of AWKWARD) {
  const std = toBase64(key);
  const url = toBase64Url(key);
  const hits = ['+', '/', '='].filter((c) => std.includes(c)).join(' ') || '(none)';
  console.log(`  ${key}`);
  console.log(`    standard  ${std}`);
  console.log(`    url-safe  ${url}`);
  console.log(`    differs at: ${hits}`);
}
console.log('');

// What the difference costs, in the place a URN is actually used.
const key = `${PREFIX}riverside-depot/ab₿-depot.rvt`;
const std = toBase64(key);
const url = toBase64Url(key);
console.log('A URN travels as a PATH SEGMENT, so the three characters matter differently:');
console.log(`  "/" splits the segment      -> ${std.split('/').length} segments instead of 1`);
console.log(`  "+" is a legal path char but a SPACE in a form-encoded query string`);
console.log(`  "=" is often percent-encoded to %3D by one client and not by another`);
console.log('');
console.log(`  standard, in a path:  .../designdata/${std}/manifest`);
console.log(`  url-safe, in a path:  .../designdata/${url}/manifest`);
console.log('');

// Round-tripping the url-safe form back, which is what a service does at the
// other end. Padding has to be restored before a strict decoder will accept it.
function fromBase64Url(value) {
  const restored = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = restored + '='.repeat((4 - (restored.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

console.log(`round trip: ${fromBase64Url(url) === key ? 'ok' : 'MISMATCH'}`);
console.log('');
console.log('And the failure that is worth seeing, because it does not throw: Node\'s base64');
console.log('decoder ignores characters outside the alphabet instead of rejecting them.');
const tampered = url.replace(/_/g, '/').replace(/-/g, '+') + '%3D';
// Escaped rather than printed raw: the decode produces control bytes, and a
// stamped proof body has to stay a plain sequence of text lines.
const printable = (s) => s.replace(/[\u0000-\u001f\u007f-\u009f\ufffd]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
console.log(`  decoding a URN that arrived percent-encoded:`);
console.log(`    got      ...${printable(Buffer.from(tampered, 'base64').toString('utf8').slice(-38))}`);
console.log(`    expected ...${printable(key.slice(-38))}`);
console.log('  No exception. A wrong string, quietly, which is the whole class of bug.');
