// The same delivery log, ingested two ways. Nothing here is a hand-typed
// transcript: the duplicate counts below are produced by running both
// ingests over one fixed sequence of arrivals.
//
// Determinism: the arrival log is a literal, both ingests are pure, and
// nothing prints a clock, a duration or a generated id.

/** What a gateway hands the ingest. `receivedAt` is the ingest's own clock
 *  and is deliberately NOT part of the reading's identity — lesson 474's
 *  three clocks, applied. */
const ARRIVALS = [
  { deviceId: 'dev-0041', measuredAt: '2026-03-01T09:00:00Z', celsius: 21.4, receivedAt: '2026-03-01T09:00:02Z', why: 'first delivery' },
  { deviceId: 'dev-0041', measuredAt: '2026-03-01T09:10:00Z', celsius: 21.6, receivedAt: '2026-03-01T09:10:02Z', why: 'first delivery' },
  // The gateway did not see our acknowledgement, so it sent the same uplink
  // again. Same reading, later arrival.
  { deviceId: 'dev-0041', measuredAt: '2026-03-01T09:10:00Z', celsius: 21.6, receivedAt: '2026-03-01T09:10:31Z', why: 'gateway retry, ack lost' },
  { deviceId: 'dev-0041', measuredAt: '2026-03-01T09:20:00Z', celsius: 21.9, receivedAt: '2026-03-01T09:20:02Z', why: 'first delivery' },
  // Two gateways heard the same transmission. Both forwarded it.
  { deviceId: 'dev-0041', measuredAt: '2026-03-01T09:20:00Z', celsius: 21.9, receivedAt: '2026-03-01T09:20:03Z', why: 'second gateway heard the same uplink' },
  // The device buffered while its link was down and flushed on reconnect,
  // including one it had already delivered before the link dropped.
  { deviceId: 'dev-0041', measuredAt: '2026-03-01T09:20:00Z', celsius: 21.9, receivedAt: '2026-03-01T09:41:00Z', why: 'store-and-forward flush' },
  { deviceId: 'dev-0041', measuredAt: '2026-03-01T09:30:00Z', celsius: 22.2, receivedAt: '2026-03-01T09:41:00Z', why: 'store-and-forward flush' },
  { deviceId: 'dev-0041', measuredAt: '2026-03-01T09:40:00Z', celsius: 22.5, receivedAt: '2026-03-01T09:41:01Z', why: 'store-and-forward flush' },
  // A different device that happens to have measured at the same instant.
  // Identity is the PAIR, so this is not a duplicate of anything.
  { deviceId: 'dev-0042', measuredAt: '2026-03-01T09:40:00Z', celsius: 18.1, receivedAt: '2026-03-01T09:40:04Z', why: 'different device, same instant' },
];

/** Naive: every arrival becomes a row. */
function naiveIngest(arrivals) {
  return arrivals.map((a) => ({ deviceId: a.deviceId, measuredAt: a.measuredAt, celsius: a.celsius }));
}

/** Idempotent: the reading's identity is (device, measurement time). An
 *  arrival whose key is already stored is acknowledged and dropped — the
 *  same shape as an ON CONFLICT DO NOTHING, and the same argument the
 *  idempotency key pattern makes for HTTP. */
function idempotentIngest(arrivals) {
  const stored = new Map();
  let rejected = 0;
  for (const a of arrivals) {
    const key = `${a.deviceId}|${a.measuredAt}`;
    if (stored.has(key)) {
      rejected++;
      continue;
    }
    stored.set(key, { deviceId: a.deviceId, measuredAt: a.measuredAt, celsius: a.celsius });
  }
  return { rows: [...stored.values()], rejected };
}

console.log(`${ARRIVALS.length} arrivals from the gateway:`);
for (const a of ARRIVALS) {
  console.log(`  ${a.deviceId}  measured ${a.measuredAt.slice(11, 16)}  received ${a.receivedAt.slice(11, 19)}  ${a.why}`);
}
console.log('');

const naive = naiveIngest(ARRIVALS);
const distinct = new Set(naive.map((r) => `${r.deviceId}|${r.measuredAt}`)).size;
console.log(`naive ingest       ${naive.length} rows stored, ${distinct} distinct readings`);
console.log(`                   ${naive.length - distinct} duplicate rows`);

const idem = idempotentIngest(ARRIVALS);
console.log(`idempotent ingest  ${idem.rows.length} rows stored, ${idem.rejected} arrivals dropped as already seen`);
console.log('');

// What the duplicates do to the answer, which is the part that reaches a
// report rather than a log.
const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
const dev41Naive = naive.filter((r) => r.deviceId === 'dev-0041').map((r) => r.celsius);
const dev41Idem = idem.rows.filter((r) => r.deviceId === 'dev-0041').map((r) => r.celsius);
console.log('the same average over dev-0041, from the two tables:');
console.log(`  naive       ${mean(dev41Naive).toFixed(4)} C  over ${dev41Naive.length} rows`);
console.log(`  idempotent  ${mean(dev41Idem).toFixed(4)} C  over ${dev41Idem.length} rows`);
console.log('');
console.log('The duplicated reading is weighted three times, so the mean moves toward it.');
console.log('Nothing errored and no row is wrong on its own; only the answer is.');
console.log('');

// And the case that must NOT be deduplicated, to show the key is the pair.
const sameInstant = naive.filter((r) => r.measuredAt === '2026-03-01T09:40:00Z');
console.log(`readings at 09:40 across all devices: ${sameInstant.length}`);
console.log(`  kept by the idempotent ingest: ${idem.rows.filter((r) => r.measuredAt === '2026-03-01T09:40:00Z').length}`);
console.log('  Both survive. Deduplicating on measurement time alone would delete one of');
console.log('  them, which is the failure that looks like a fix.');
