// Does a single-producer / single-consumer ring buffer really need no lock?
// Counted, not asserted.
//
// The lesson's claim has two halves. The first is that no mutual exclusion is
// required when exactly one context writes `head` and exactly one writes
// `tail`. The second is that the ORDER of the producer's two writes is not a
// style choice: the slot must be filled before the index that publishes it
// moves. This script checks both by exhaustively exploring every interleaving
// of the two contexts, at the granularity of the individual reads and writes
// a compiler is free to schedule.
//
// The model. The producer runs three micro-steps per item, the consumer three
// per item, and the scheduler may switch between them at any point -- which is
// exactly what an interrupt does. Reachable states are explored with a
// worklist and a visited set, so every interleaving is covered once.
//
//   producer            consumer
//   P0 read tail        C0 read head
//   P1 write slot       C1 read slot
//   P2 publish head     C2 publish tail
//
// An unwritten slot holds null. A consumer that reads null has read a slot the
// producer had not finished filling -- the exact corruption the ordering rule
// exists to prevent, and it is reported as a violation rather than assumed
// impossible.
//
// Determinism: the state space is enumerated in a fixed order from fixed
// constants, every printed number is a count, and the example trace is the
// first violation in that fixed order. No clock, no random, no library.

const SLOTS = 3; // one slot is left empty to tell full from empty
const ITEMS = 3; // values 1..3 are produced, then the producer stops

const key = (s) => JSON.stringify(s);

const initial = {
  buf: Array(SLOTS).fill(null),
  head: 0, // written only by the producer
  tail: 0, // written only by the consumer
  pPc: 0, // producer micro-step
  pSent: 0, // items the producer has published
  pTail: 0, // the producer's snapshot of tail
  cPc: 0, // consumer micro-step
  cGot: [], // values the consumer has taken, in order
  cHead: 0, // the consumer's snapshot of head
  cVal: null, // the value the consumer read out of the slot
};

/** One producer micro-step, or null when it cannot run yet. `publishFirst`
 *  models the reordered producer: index moved before the slot is filled. */
function stepProducer(s, publishFirst) {
  if (s.pSent === ITEMS && s.pPc === 0) return null; // producer has finished
  const n = structuredClone(s);
  if (s.pPc === 0) {
    n.pTail = s.tail; // read the consumer's index
    // full when the next head would land on the snapshotted tail
    if ((s.head + 1) % SLOTS === n.pTail) return null; // ring is full: spin
    n.pPc = 1;
  } else if (s.pPc === 1) {
    if (publishFirst) n.head = (s.head + 1) % SLOTS;
    else n.buf[s.head] = s.pSent + 1;
    n.pPc = 2;
  } else {
    if (publishFirst) n.buf[s.head] = s.pSent + 1;
    else n.head = (s.head + 1) % SLOTS;
    n.pSent = s.pSent + 1;
    n.pPc = 0;
  }
  return n;
}

/** One consumer micro-step, or null when it cannot run yet. */
function stepConsumer(s) {
  if (s.cGot.length === ITEMS && s.cPc === 0) return null; // consumer has finished
  const n = structuredClone(s);
  if (s.cPc === 0) {
    n.cHead = s.head; // read the producer's index
    if (n.cHead === s.tail) return null; // ring is empty: spin
    n.cPc = 1;
  } else if (s.cPc === 1) {
    n.cVal = s.buf[s.tail]; // read the slot the index said was published
    n.cPc = 2;
  } else {
    n.cGot = [...s.cGot, s.cVal];
    n.tail = (s.tail + 1) % SLOTS;
    n.cPc = 0;
  }
  return n;
}

/** The consumer must always hold a prefix of 1,2,3 -- in order, no gaps, no
 *  nulls. Anything else means it observed a slot the producer had not
 *  finished writing, or observed one out of order. */
function violation(s) {
  for (let i = 0; i < s.cGot.length; i++) {
    if (s.cGot[i] !== i + 1) return `consumed ${JSON.stringify(s.cGot)} -- expected the prefix ${JSON.stringify([...Array(s.cGot.length)].map((_, k) => k + 1))}`;
  }
  return null;
}

function explore(publishFirst) {
  const seen = new Map([[key(initial), null]]); // state -> the state before it
  const work = [initial];
  let terminal = 0;
  let firstBad = null;

  while (work.length > 0) {
    const s = work.shift();
    const next = [stepProducer(s, publishFirst), stepConsumer(s)].filter(Boolean);
    if (next.length === 0) terminal++;
    for (const n of next) {
      const k = key(n);
      if (seen.has(k)) continue;
      seen.set(k, key(s));
      const bad = violation(n);
      if (bad && !firstBad) firstBad = { state: n, why: bad, k };
      work.push(n);
    }
  }
  return { states: seen.size, terminal, firstBad, seen };
}

function report(title, publishFirst) {
  const r = explore(publishFirst);
  console.log(title);
  console.log(`  reachable interleavings (distinct states) : ${r.states}`);
  console.log(`  states with nothing left to run           : ${r.terminal}`);
  console.log(`  states where the consumer saw wrong data  : ${r.firstBad ? 'YES' : 'none'}`);
  if (r.firstBad) {
    console.log(`  first such state                          : ${r.firstBad.why}`);
    console.log(`  buffer at that point                      : ${JSON.stringify(r.firstBad.state.buf)}`);
  }
  console.log('');
  return r;
}

console.log(`Single-producer/single-consumer ring: ${SLOTS} slots, ${ITEMS} items, every interleaving explored.`);
console.log('The producer alone writes head; the consumer alone writes tail; there is no lock.');
console.log('');

const correct = report('Producer fills the slot, THEN publishes head:', false);
const broken = report('Producer publishes head, THEN fills the slot:', true);

console.log('Both versions are the same code with two lines swapped, and both are lock-free.');
console.log(`Explored ${correct.states} and ${broken.states} states respectively -- exhaustively, not sampled.`);
console.log('Only the ordering separates a correct ring from one that hands the consumer a');
console.log('slot the producer had not written yet. No amount of testing on a quiet bench');
console.log('finds the second one; the enumeration finds it every time.');
