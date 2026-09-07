// Two ways to ask "has the interval elapsed?", and how often the common one
// is wrong. Counted over every possible counter value, not sampled.
//
//   correct : (now - last) & MASK  >= period      // subtract, then compare
//   naive   : now >= (last + period) & MASK       // add, then compare
//
// On a counter that never wraps the two are the same expression. A tick
// counter always wraps, and then they are not: the naive form asks a question
// about an absolute deadline that the counter has already run past.
//
// Part 1 uses an 8-bit counter so that EVERY pair of (start, elapsed) can be
// enumerated -- 256 x 256 = 65536 of them, the whole space, no sampling. Part 2
// repeats the measurement at the real 32-bit width around the wrap point.
//
// Determinism: fixed widths, fixed period, fixed scan bounds, integer
// arithmetic only, and every printed number is a count or an exact quotient.
// No clock, no random, no library.

/** What firmware actually computes: subtraction truncated to the counter's
 *  width. `>>> 0` is how JavaScript models a 32-bit unsigned wrap. */
const maskedElapsed = (now, last, mask) => (now - last) & mask;

// ---------------------------------------------------------------- part 1
const BITS = 8;
const MASK8 = (1 << BITS) - 1;
const PERIOD8 = 100;

let recoveryFailures = 0;
let disagreements = 0;
let firstDisagreement = null;
const badStarts = new Set();

for (let last = 0; last <= MASK8; last++) {
  for (let elapsed = 0; elapsed <= MASK8; elapsed++) {
    const now = (last + elapsed) & MASK8;

    // Claim 1: masked subtraction recovers the true elapsed count exactly,
    // for every start and every elapsed the counter can represent.
    if (maskedElapsed(now, last, MASK8) !== elapsed) recoveryFailures++;

    // Claim 2: the naive form disagrees with the truth, and here is how often.
    const truth = elapsed >= PERIOD8;
    const correct = maskedElapsed(now, last, MASK8) >= PERIOD8;
    const naive = now >= ((last + PERIOD8) & MASK8);
    if (correct !== truth) throw new Error('the masked form disagreed with the truth');
    if (naive !== truth) {
      disagreements++;
      badStarts.add(last);
      if (!firstDisagreement) firstDisagreement = { last, elapsed, now, naive, truth };
    }
  }
}

const pairs = (MASK8 + 1) * (MASK8 + 1);
console.log(`8-bit counter, period ${PERIOD8} ticks, all ${pairs} (start, elapsed) pairs enumerated.`);
console.log('');
console.log(`masked subtraction failed to recover the elapsed count : ${recoveryFailures} of ${pairs}`);
console.log(`naive comparison gave the wrong answer                 : ${disagreements} of ${pairs}`);
console.log(`start values for which the naive form ever misfires    : ${badStarts.size} of ${MASK8 + 1}`);
console.log('');
console.log('first misfire in enumeration order:');
console.log(`  last=${firstDisagreement.last} elapsed=${firstDisagreement.elapsed} now=${firstDisagreement.now}` +
  ` -> naive says ${firstDisagreement.naive}, truth is ${firstDisagreement.truth}`);
console.log('');
console.log(`Only one start value out of ${MASK8 + 1} is safe: last=0, where the counter and the`);
console.log(`deadline can never wrap apart. The other ${badStarts.size} are wrong for some elapsed, and on a`);
console.log('free-running counter every start value comes around. The naive form is not an edge');
console.log('case that needs a big counter -- it is wrong for a quarter of all the pairs there are.');
console.log('');

// ---------------------------------------------------------------- part 2
const MASK32 = 0xffffffff;
const LAST32 = 0xffffff00; // a start close enough to the wrap that the deadline crosses it
const PERIOD32 = 1000; // ticks; with a 1 ms tick this is one second
const SCAN = 2000;

let earlyFires = 0;
let missedTicks = 0;
for (let elapsed = 0; elapsed <= SCAN; elapsed++) {
  const now = (LAST32 + elapsed) >>> 0;
  const truth = elapsed >= PERIOD32;
  const naive = now >= (((LAST32 + PERIOD32) & MASK32) >>> 0);
  if (naive && !truth) earlyFires++;
  if (!naive && truth) missedTicks++;
}

console.log(`32-bit counter, last=0x${LAST32.toString(16)}, period ${PERIOD32} ticks, scanning ${SCAN} ticks forward.`);
console.log(`  deadline last+period truncates to        : ${(LAST32 + PERIOD32) & MASK32}`);
console.log(`  ticks the naive form fires early         : ${earlyFires}`);
console.log(`  ticks the naive form stays silent late   : ${missedTicks}`);
console.log('');
const TICK_US = 1000; // a 1 ms tick, stated as the assumption it is
const wrapDays = (MASK32 + 1) / (1e6 / TICK_US) / 86400;
console.log(`A ${TICK_US / 1000} ms tick in a 32-bit counter wraps every ${wrapDays.toFixed(2)} days.`);
console.log('That is the whole problem: the naive form is correct for seven weeks of testing');
console.log('and then wrong once, in the field, on a device nobody is watching. The fix is');
console.log('not a wider counter -- it is subtracting first.');
