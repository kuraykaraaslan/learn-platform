// A field queue that filled up over three days, submitted twice. Nothing here
// is a hand-typed transcript: the counts below come from running both
// submitters over one fixed sequence of attempts.
//
// Determinism: the queue and the attempt log are literals, both submitters are
// pure, and nothing prints a clock, a duration or a generated id that is not
// already in the input.

/** What the app captured while the device had no network. `clientId` is
 *  generated ON THE DEVICE, at capture time, and never changes afterwards —
 *  which is the whole mechanism this proof exists to price. */
const QUEUE = [
  { clientId: 'f3a1-0001', assetTag: 'AT-0141', finding: 'corrosion on flange', capturedAt: '2026-03-01T08:12:00Z' },
  { clientId: 'f3a1-0002', assetTag: 'AT-0141', finding: 'gasket weeping', capturedAt: '2026-03-01T08:19:00Z' },
  { clientId: 'f3a1-0003', assetTag: 'AT-0155', finding: 'label illegible', capturedAt: '2026-03-01T09:41:00Z' },
  { clientId: 'f3a1-0004', assetTag: 'AT-0163', finding: 'guard missing', capturedAt: '2026-03-02T07:55:00Z' },
  { clientId: 'f3a1-0005', assetTag: 'AT-0163', finding: 'vibration audible', capturedAt: '2026-03-02T08:02:00Z' },
  { clientId: 'f3a1-0006', assetTag: 'AT-0170', finding: 'access blocked', capturedAt: '2026-03-03T11:30:00Z' },
];

/** The submission attempts, in the order they actually happened. Every one of
 *  these is an ordinary thing for a field app on a bad connection to do. */
const ATTEMPTS = [
  { index: 0, why: 'first attempt, succeeded' },
  { index: 1, why: 'first attempt, succeeded' },
  // The response never came back. The app cannot tell a lost request from a
  // lost response, so it retries — and the server already has this one.
  { index: 1, why: 'retry: response lost, server already had it' },
  { index: 2, why: 'first attempt, succeeded' },
  // The upload was cut off mid-batch. On the next window the app resends the
  // whole batch, because it does not know how far the server got.
  { index: 2, why: 'batch resent: connection dropped mid-upload' },
  { index: 3, why: 'batch resent: connection dropped mid-upload' },
  { index: 4, why: 'first attempt, succeeded' },
  // The inspector force-quit the app; on relaunch the queue was reloaded from
  // disk, including two entries that had already gone.
  { index: 3, why: 'app relaunched, queue reloaded from disk' },
  { index: 4, why: 'app relaunched, queue reloaded from disk' },
  { index: 5, why: 'first attempt, succeeded' },
];

/** Naive: the server assigns an id on arrival, so every attempt is a new row. */
function naiveSubmit(attempts) {
  const rows = [];
  let nextServerId = 1;
  for (const attempt of attempts) {
    rows.push({ serverId: nextServerId++, ...QUEUE[attempt.index] });
  }
  return rows;
}

/** Idempotent: the client's own id is the primary key, so a repeat is a
 *  no-op. The device decided the identity at capture time, offline, with
 *  nothing to ask. */
function idempotentSubmit(attempts) {
  const stored = new Map();
  let rejected = 0;
  for (const attempt of attempts) {
    const record = QUEUE[attempt.index];
    if (stored.has(record.clientId)) {
      rejected++;
      continue;
    }
    stored.set(record.clientId, record);
  }
  return { rows: [...stored.values()], rejected };
}

console.log(`${QUEUE.length} captures, ${ATTEMPTS.length} submission attempts:`);
for (const a of ATTEMPTS) {
  console.log(`  ${QUEUE[a.index].clientId}  ${QUEUE[a.index].assetTag}  ${a.why}`);
}
console.log('');

const naive = naiveSubmit(ATTEMPTS);
const idem = idempotentSubmit(ATTEMPTS);

console.log(`server-assigned ids   ${naive.length} rows stored`);
console.log(`client-generated ids  ${idem.rows.length} rows stored, ${idem.rejected} attempts rejected as already seen`);
console.log('');

// What the duplicates do to the thing a field system is for: a count of
// findings per asset, which is what somebody schedules work from.
const countBy = (rows) => {
  const counts = new Map();
  for (const r of rows) counts.set(r.assetTag, (counts.get(r.assetTag) ?? 0) + 1);
  return [...counts.entries()].sort();
};

console.log('findings per asset, from the two tables:');
console.log('  asset      server ids   client ids   truth');
const truth = countBy(QUEUE);
const naiveCounts = new Map(countBy(naive));
const idemCounts = new Map(countBy(idem.rows));
for (const [tag, real] of truth) {
  console.log(
    `  ${tag}    ${String(naiveCounts.get(tag) ?? 0).padStart(8)}   ${String(idemCounts.get(tag) ?? 0).padStart(10)}   ${String(real).padStart(5)}`
  );
}
console.log('');
console.log('AT-0163 has two real findings and the naive table reports four. Nobody typed');
console.log('anything twice and no request failed: the app retried a lost response, resent an');
console.log('interrupted batch, and reloaded its queue after a crash. All three are correct.');
console.log('');

// The property that makes this work offline, which a server-generated id
// cannot have.
console.log('Why the id has to come from the device: at capture time there is no network, so');
console.log('there is nothing to ask for an id. A server-assigned id cannot exist until the');
console.log('record reaches the server — which is exactly when the identity is needed.');
console.log('');
console.log('And the ids stay stable across everything the device does to the queue:');
console.log(`  captured offline, ids fixed at capture:  ${QUEUE.map((q) => q.clientId).join(', ')}`);
console.log(`  after ${ATTEMPTS.length} attempts, distinct records stored: ${idem.rows.length}`);
console.log(`  every stored id came from the device:    ${idem.rows.every((r) => QUEUE.some((q) => q.clientId === r.clientId))}`);
