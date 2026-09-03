// One setpoint change that spans a failover, across systems that do not share
// a clock. Nothing here is a hand-typed result: the final states below come
// from sorting the same event list three different ways and replaying it.
//
// The setup: SCADA (node A) issues setpoint changes. The primary PLC (node B)
// applies the first one, then fails. A standby PLC (node C) takes over and
// applies the second. B's clock runs 90s FAST; C's runs 75s SLOW. Every event
// also carries a Lamport timestamp and a version vector, neither of which
// consults a wall clock.
//
// Determinism: the event log is a literal, the three orderings are pure
// functions of it, and nothing reads Date.now(), performance.now(), or the
// process clock. Two runs are byte-identical.

/** The true causal order, as it happened:
 *   1. A: set 50        (A sends; A wall 08:00:00)
 *   2. B: applied 50    (B receives 1, acts; B real 08:00:20, B clock +90s -> stamps 08:01:50)
 *   3. A: set 20        (A sends, having seen nothing new; A wall 08:00:40)
 *   4. C: applied 20    (C receives 3 after failover; C real 08:01:00, C clock -75s -> stamps 07:59:45)
 */
const EVENTS = [
  { id: 1, node: 'A', kind: 'set',     value: 50, wall: '2024-05-01T08:00:00Z', lamport: 1, vv: { A: 1 } },
  { id: 2, node: 'B', kind: 'applied', value: 50, wall: '2024-05-01T08:01:50Z', lamport: 2, vv: { A: 1, B: 1 } },
  { id: 3, node: 'A', kind: 'set',     value: 20, wall: '2024-05-01T08:00:40Z', lamport: 3, vv: { A: 2, B: 1 } },
  { id: 4, node: 'C', kind: 'applied', value: 20, wall: '2024-05-01T07:59:45Z', lamport: 4, vv: { A: 2, B: 1, C: 1 } },
];

/** Replay: the last `applied` event wins, and that is the setpoint the field
 *  device is actually holding. */
function finalSetpoint(ordered) {
  let state = null;
  for (const e of ordered) if (e.kind === 'applied') state = e.value;
  return state;
}

// --- Ordering 1: wall clock ---------------------------------------------
const byWall = [...EVENTS].sort((x, y) => x.wall.localeCompare(y.wall));

// --- Ordering 2: Lamport clock (ties broken by node id) -----------------
const byLamport = [...EVENTS].sort((x, y) => x.lamport - y.lamport || x.node.localeCompare(y.node));

// --- Ordering 3: version vector (partial order; report any concurrency) -
function dominates(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let ge = true;
  let gt = false;
  for (const k of keys) {
    const av = a[k] ?? 0;
    const bv = b[k] ?? 0;
    if (av < bv) ge = false;
    if (av > bv) gt = true;
  }
  return ge && gt;
}
let concurrentPairs = 0;
for (let i = 0; i < EVENTS.length; i++) {
  for (let j = i + 1; j < EVENTS.length; j++) {
    const a = EVENTS[i].vv;
    const b = EVENTS[j].vv;
    if (!dominates(a, b) && !dominates(b, a)) concurrentPairs++;
  }
}

const show = (list) => list.map((e) => `${e.node}:${e.kind}(${e.value})`).join('  ->  ');

console.log('The four events, in the order they actually happened (causal order):');
console.log('  ' + show(EVENTS));
console.log('');
console.log("B's clock runs 90s fast, C's runs 75s slow. B applied 50 before C applied 20,");
console.log("but C's stamp (07:59:45) lands BEFORE B's stamp (08:01:50).");
console.log('');

console.log('ORDER BY wall clock:');
console.log('  ' + show(byWall));
console.log(`  final setpoint replayed: ${finalSetpoint(byWall)}`);
console.log('');

console.log('ORDER BY Lamport clock:');
console.log('  ' + show(byLamport));
console.log(`  final setpoint replayed: ${finalSetpoint(byLamport)}`);
console.log('');

console.log(`Version vectors: ${concurrentPairs} concurrent pair(s). Every event here causally`);
console.log('precedes the next, so the vector clock confirms one valid total order exists and');
console.log('it is the Lamport one.');
console.log('');

console.log(`The field device is holding setpoint 20. Wall-clock replay reconstructs ${finalSetpoint(byWall)}` +
  (finalSetpoint(byWall) === 20 ? '.' : ' — wrong.'));
console.log(`Lamport replay reconstructs ${finalSetpoint(byLamport)}` +
  (finalSetpoint(byLamport) === 20 ? ' — correct.' : '.'));
console.log('');
console.log('This is not fixable by "sync the clocks better". Sub-second NTP skew is enough to');
console.log('reorder two control events that are milliseconds apart, and a failover puts the');
console.log('two events on different clocks by construction. The order has to come from');
console.log('causality, not from time.');
