// A real binary search over real arrays, not a hand-typed transcript. The
// arrays are literals and every probe is derived only from them, so the output
// is byte-identical on every run — no timings, no randomness.

function binarySearch(arr, target, log) {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    log.push(`  probe index ${mid} -> ${arr[mid]}`);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

const ascending = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const descending = [...ascending].reverse();
const TARGET = 72;

for (const [label, arr] of [['ascending', ascending], ['descending', descending]]) {
  const log = [];
  const found = binarySearch(arr, TARGET, log);
  console.log(`--- searching for ${TARGET} in the ${label} array ---`);
  console.log(`  [${arr.join(', ')}]`);
  console.log(log.join('\n'));
  console.log(`  result: ${found === -1 ? 'not found (-1)' : `found at index ${found}`}`);
  console.log(`  is ${TARGET} actually in this array? ${arr.includes(TARGET)}`);
  console.log('');
}

console.log('both arrays hold the same ten numbers, and both are sorted —');
console.log('but binary search assumes ascending, so the second one silently misses.');
console.log('it returns -1 rather than raising: the precondition is never checked.');
