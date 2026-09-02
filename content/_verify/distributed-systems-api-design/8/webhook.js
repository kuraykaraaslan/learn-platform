// Real HMAC-SHA256 verification, node:crypto only — no dependencies, no mock.
// Byte-stable output: the secret, the body and both timestamps are fixed
// literals, and "now" is a fixed constant rather than Date.now(), so the
// freshness check produces the same result on every run.
const { createHmac, timingSafeEqual } = require('node:crypto');

const SECRET = 'whsec_example_shared_secret';
// Spaced exactly as it arrived on the wire. Providers do not promise canonical
// JSON, and that is the whole point of the third case below.
const RAW_BODY = '{"id": "evt_1", "type": "payment.succeeded", "amount": 4200}';
const SENT_AT = 1767225600; // 2026-01-01T00:00:00Z, as the provider signed it
const NOW = SENT_AT + 42; // 42 seconds later
const MAX_AGE = 300; // the lesson's 5 minutes

const sign = (ts, body) => createHmac('sha256', SECRET).update(`${ts}.${body}`).digest('hex');

function verify(label, ts, body, header, now = NOW) {
  const expected = sign(ts, body);
  const a = Buffer.from(header, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  const sigOk = a.length === b.length && timingSafeEqual(a, b);
  const age = now - ts;
  const fresh = age <= MAX_AGE;
  console.log(`${label}`);
  console.log(`  signature ${sigOk ? 'matches' : 'does NOT match'}, age ${age}s ${fresh ? 'within' : 'beyond'} the ${MAX_AGE}s window`);
  console.log(`  -> ${sigOk && fresh ? 'ACCEPTED' : 'REJECTED'}`);
}

const header = sign(SENT_AT, RAW_BODY);
console.log('--- the signature the provider actually sends ---');
console.log(`X-Signature: ${header}`);
console.log('');

verify('a genuine delivery', SENT_AT, RAW_BODY, header);
console.log('');

const tampered = RAW_BODY.replace('4200', '9900');
verify('the same event with the amount edited', SENT_AT, tampered, header);
console.log('');

// The parsed object is equal; the bytes are not. This is why the HMAC has to
// be computed over the raw body a body parser has not touched.
const reserialized = JSON.stringify(JSON.parse(RAW_BODY));
console.log('--- re-serializing an equal object changes the bytes ---');
console.log(`raw  : ${RAW_BODY}`);
console.log(`again: ${reserialized}`);
const sameObject = JSON.stringify(JSON.parse(RAW_BODY)) === JSON.stringify(JSON.parse(reserialized));
console.log(`same object: ${sameObject}   same bytes: ${RAW_BODY === reserialized}`);
verify('verified against the re-serialized body', SENT_AT, reserialized, header);
console.log('');

verify('the same genuine delivery, replayed 5 hours later', SENT_AT, RAW_BODY, header, SENT_AT + 5 * 3600);
console.log('  the signature is still perfectly valid — only the timestamp window stops it');
