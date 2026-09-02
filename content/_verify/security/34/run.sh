#!/bin/bash
# Real crypto.timingSafeEqual calls, not a hand-typed transcript. The output is
# byte-stable because nothing random or environment-specific is ever printed:
# COMPARISON_KEY is randomBytes(32), but only the *lengths* of the digests it
# produces and the *booleans* of the comparisons are echoed — never a digest
# itself. The RangeError message is Node's own; if a future Node reworded it,
# stamp-verify.ts --check would catch the drift and this block gets re-stamped,
# which is the mechanism working, not a flake.
set -e
WORK=$(mktemp -d)
cd "$WORK"

cat > timing.js <<'EOF'
const crypto = require('crypto');

const secret = 'super-secret-api-key'; // 20 chars

console.log('--- crypto.timingSafeEqual refuses unequal lengths outright ---');
try {
  crypto.timingSafeEqual(Buffer.from(secret), Buffer.from('wrong'));
  console.log('compared without throwing');
} catch (err) {
  console.log(`${err.constructor.name}: ${err.message}`);
}
console.log('so a length guard is not optional — the call throws without one');

console.log('');
console.log('--- but the guard itself answers the attacker\'s question ---');
const passesGuard = (guess) => Buffer.from(secret).length === Buffer.from(guess).length;
console.log(`5-char guess  reaches the comparison: ${passesGuard('wrong')}`);
console.log(`20-char guess reaches the comparison: ${passesGuard('aaaaaaaaaaaaaaaaaaaa')}`);
console.log('one bit of the secret — its length — leaked before any byte was compared');

console.log('');
console.log('--- HMAC both sides to a fixed 32 bytes first: the length is gone ---');
const COMPARISON_KEY = crypto.randomBytes(32);
const digest = (v) => crypto.createHmac('sha256', COMPARISON_KEY).update(v, 'utf8').digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

console.log(`digest of the 5-char guess:  ${digest('wrong').length} bytes`);
console.log(`digest of the 20-char secret: ${digest(secret).length} bytes`);
console.log(`safeEqual(secret, 'wrong'): ${safeEqual(secret, 'wrong')}`);
console.log(`safeEqual(secret, secret):  ${safeEqual(secret, secret)}`);
console.log('every comparison now examines exactly 32 bytes, whatever the caller sent');
EOF

echo '$ node timing.js'
node timing.js

rm -rf "$WORK"
