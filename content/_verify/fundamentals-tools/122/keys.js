// Real V8 behaviour, not a hand-typed transcript. Nothing timing- or
// environment-dependent is printed — only key orders, which are fixed by the
// ECMAScript spec (integer-like own keys are enumerated in ascending numeric
// order before string keys, whatever order you inserted them in).

const insertion = [[30, 'thirty'], [4, 'four'], [100, 'hundred'], [4.5, 'four-point-five']];

console.log('inserted in this order: ' + insertion.map(([k]) => k).join(', '));

console.log('');
console.log('--- plain object as a lookup table ---');
const obj = {};
for (const [k, v] of insertion) obj[k] = v;
console.log('Object.keys(obj): ' + JSON.stringify(Object.keys(obj)));
console.log('the integer-like keys were sorted numerically; "4.5" is not integer-like, so it kept its slot');

console.log('');
console.log('--- Map with the same insertions ---');
const map = new Map(insertion);
console.log('[...map.keys()]: ' + JSON.stringify([...map.keys()]));
console.log('insertion order preserved, and the keys are still numbers, not strings');

console.log('');
console.log('--- and the key type is not the same either ---');
console.log(`typeof Object.keys(obj)[0]: ${typeof Object.keys(obj)[0]}`);
console.log(`typeof [...map.keys()][0]:  ${typeof [...map.keys()][0]}`);
console.log(`obj[4] and obj["4"] are the same slot: ${obj[4] === obj['4']}`);
console.log(`map.get(4) is a hit, map.get("4") is: ${map.get('4')}`);
