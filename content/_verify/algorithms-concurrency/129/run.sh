#!/bin/bash
# A real interleaved race between two concurrent withdrawals, not a hand-typed
# transcript. Determinism comes from Node's timer queue: readBalance and
# writeBalance both use setTimeout with the *same* delay, and same-delay timers
# fire in the order they were scheduled. Promise.all starts A before B, so the
# schedule order — and therefore every line below — is fixed on every run. No
# clock values, durations or ids are printed, so nothing environment-specific
# leaks into the output.
set -e
WORK=$(mktemp -d)
cd "$WORK"

cat > race.js <<'EOF'
let balance = 100;

function readBalance(who) {
  return new Promise((resolve) =>
    setTimeout(() => {
      console.log(`${who}: read  balance=${balance}`);
      resolve(balance);
    }, 10),
  );
}

function writeBalance(who, value) {
  return new Promise((resolve) =>
    setTimeout(() => {
      balance = value;
      console.log(`${who}: write balance=${value}`);
      resolve();
    }, 10),
  );
}

// The shape from the lesson: a read, an await, then a write that trusts it.
async function withdraw(who, amount) {
  const current = await readBalance(who);
  if (current < amount) return `${who}: refused (insufficient funds)`;
  await writeBalance(who, current - amount);
  return `${who}: withdrew ${amount}`;
}

// The fix: no read-then-write. One atomic compare-and-set decides.
function withdrawAtomically(who, amount) {
  return new Promise((resolve) =>
    setTimeout(() => {
      if (balance < amount) return resolve(`${who}: refused (insufficient funds)`);
      balance -= amount;
      resolve(`${who}: withdrew ${amount}`);
    }, 10),
  );
}

(async () => {
  console.log('--- naive read-then-write: two concurrent withdrawals of 60 from 100 ---');
  for (const line of await Promise.all([withdraw('A', 60), withdraw('B', 60)])) {
    console.log(line);
  }
  console.log(`final balance: ${balance}`);
  console.log('120 was withdrawn from an opening balance of 100, and neither call failed');

  balance = 100;
  console.log('');
  console.log('--- atomic compare-and-set, same two concurrent withdrawals ---');
  for (const line of await Promise.all([
    withdrawAtomically('A', 60),
    withdrawAtomically('B', 60),
  ])) {
    console.log(line);
  }
  console.log(`final balance: ${balance}`);
})();
EOF

echo '$ node race.js'
node race.js

rm -rf "$WORK"
