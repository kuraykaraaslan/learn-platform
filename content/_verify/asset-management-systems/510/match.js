// Merge two asset registers. Nothing here is a hand-typed result table: the
// counts and the queue below come from running this matcher over the two
// literal registers.
//
// Determinism: both registers are literals, the matcher is pure, Levenshtein
// is exact, and the only ordering is an explicit sort by tag. No clock, no
// randomness, no I/O.

/** Register A — the one we are merging INTO. Canonical tags already. */
const REGISTER_A = [
  { tag: 'PMP-1001A', serial: 'SN-P-55019' },
  { tag: 'PMP-1001B', serial: 'SN-P-55021' },
  { tag: 'PRV-1001', serial: 'SN-V-3390' },
  { tag: 'FAN-B2-01', serial: 'SN-FAN-7741' },
  { tag: 'FAN-B2-02', serial: 'SN-FAN-7742' },
  { tag: 'COIL-B2-01', serial: 'SN-CL-2210' },
  { tag: 'FP-PUMP-01', serial: 'SN-FP-4471' },
];

/** Register B — the incoming one, tags exactly as its export wrote them. */
const REGISTER_B = [
  { tag: 'PMP-1001A', serial: 'SN-P-55019' },   // exact
  { tag: 'PMP-1001B', serial: 'SN-P-55021' },   // exact
  { tag: 'PRV 1001', serial: 'SN-V-3390' },     // exact after normalisation
  { tag: 'FAN B2 01', serial: 'SN-FAN-7741' },  // exact after normalisation
  { tag: 'coil-b2-01', serial: 'SN-CL-2210' },  // exact after case fold
  { tag: 'FIRE-PUMP-1', serial: 'SN-FP-4471' }, // tag no match; serial matches FP-PUMP-01
  { tag: 'FAN-B2-1', serial: null },            // distance 1 from FAN-B2-01 AND close to FAN-B2-02
  { tag: 'CHW-CHILLER-01', serial: null },      // nothing like it in A
];

/** Case fold, collapse separators to a single hyphen, trim. Does NOT touch
 *  numeric content — see lesson 506. */
function canonicalTag(raw) {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s_./]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

/** Classic Levenshtein edit distance, iterative two-row. */
function levenshtein(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

/** Decide one incoming row against register A. */
function classify(rowB) {
  const canonB = canonicalTag(rowB.tag);

  // 1. Exact canonical tag match — automatic.
  const exact = REGISTER_A.find((rowA) => canonicalTag(rowA.tag) === canonB);
  if (exact) return { outcome: 'auto', to: exact.tag, reason: 'exact tag after normalisation' };

  // 2. Serial equality with a different tag — automatic, and it tells you a
  //    tag was renamed between the two systems.
  if (rowB.serial) {
    const bySerial = REGISTER_A.find((rowA) => rowA.serial === rowB.serial);
    if (bySerial) return { outcome: 'auto', to: bySerial.tag, reason: 'serial match, tag differs' };
  }

  // 3. Nearest tag by edit distance. Automatic only if the best is within 1
  //    AND the second-best is clearly worse (gap >= 2); otherwise a human
  //    decides.
  const ranked = REGISTER_A
    .map((rowA) => ({ tag: rowA.tag, d: levenshtein(canonicalTag(rowA.tag), canonB) }))
    .sort((x, y) => x.d - y.d || x.tag.localeCompare(y.tag));
  const [best, second] = ranked;

  if (best.d <= 1 && (second === undefined || second.d - best.d >= 2)) {
    return { outcome: 'auto', to: best.tag, reason: `edit distance ${best.d}, next is ${second ? second.d : 'none'}` };
  }
  if (best.d <= 3) {
    return {
      outcome: 'review',
      candidates: ranked.filter((r) => r.d - best.d <= 1).map((r) => `${r.tag}(d${r.d})`),
      reason: `best edit distance ${best.d}, second ${second.d} — too close to call`,
    };
  }
  return { outcome: 'unmatched', reason: `nearest is ${best.tag} at edit distance ${best.d}` };
}

const results = REGISTER_B.map((rowB) => ({ from: rowB.tag, ...classify(rowB) })).sort((a, b) =>
  a.from.localeCompare(b.from)
);

const auto = results.filter((r) => r.outcome === 'auto');
const review = results.filter((r) => r.outcome === 'review');
const unmatched = results.filter((r) => r.outcome === 'unmatched');

console.log(`Register A: ${REGISTER_A.length} assets   Register B: ${REGISTER_B.length} incoming`);
console.log('');
console.log(`auto-accepted: ${auto.length}   review queue: ${review.length}   unmatched: ${unmatched.length}`);
console.log('');

console.log('AUTO-ACCEPTED');
for (const r of auto) console.log(`  ${r.from.padEnd(16)} -> ${r.to.padEnd(12)} (${r.reason})`);
console.log('');

console.log('REVIEW QUEUE  (a human picks, or creates a new asset)');
for (const r of review) console.log(`  ${r.from.padEnd(16)} ?  ${r.candidates.join('  ')}   — ${r.reason}`);
console.log('');

console.log('UNMATCHED  (likely a genuinely new asset for register A)');
for (const r of unmatched) console.log(`  ${r.from.padEnd(16)}    ${r.reason}`);
console.log('');

console.log('The two automatic wins that a naive exact-string join would miss: PRV 1001 and');
console.log('FAN B2 01 (separators), and FIRE-PUMP-1, which matches FP-PUMP-01 on serial alone.');
console.log('FAN-B2-1 stays in the queue: distance 1 from FAN-B2-01 but only distance 2 from');
console.log('FAN-B2-02, and a wrong auto-merge of two real fans is not worth saving one click.');
