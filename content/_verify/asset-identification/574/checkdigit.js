// Which typing mistakes each check-digit scheme actually catches, enumerated
// rather than remembered.
//
// Three schemes are compared against two error classes. The error classes are
// the two that dominate hand-entered identifiers: a single wrong digit, and a
// pair of adjacent digits swapped. Both are generated exhaustively over a
// fixed block of identifiers, so the percentages below are counts, not
// estimates from a paper.
//
//   plain sum : every digit weighted 1, check = sum mod 10
//   Luhn      : alternating weights 1 and 2 with digit-sum folding, mod 10
//               (the scheme ISO/IEC 7812 uses for card numbers)
//   mod-97    : the two-digit remainder scheme of ISO 7064, as used by IBAN
//
// The interesting result is not that one is best. It is that the cheapest
// scheme -- a plain sum, which is what people write when they invent one --
// is completely blind to an entire error class.
//
// Determinism: a fixed identifier range, exhaustive error generation in index
// order, integer arithmetic only. No clock, no random, no library.

const FIRST_ID = 100000;
const ID_COUNT = 1000;

const digits = (s) => [...s].map((c) => Number(c));

// --- scheme 1: plain sum ---------------------------------------------------
const plainCheck = (payload) => String(digits(payload).reduce((a, d) => a + d, 0) % 10);
const plainEncode = (payload) => payload + plainCheck(payload);
const plainValidate = (code) => plainCheck(code.slice(0, -1)) === code.slice(-1);

// --- scheme 2: Luhn --------------------------------------------------------
function luhnSum(body) {
  // Index 0 of the reversed string is the check digit, which is never
  // doubled; doubling starts at the digit immediately to its left.
  const d = digits(body).reverse();
  return d.reduce((acc, digit, i) => {
    if (i % 2 === 1) {
      const doubled = digit * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + digit;
  }, 0);
}
const luhnCheck = (payload) => String((10 - (luhnSum(payload + '0') % 10)) % 10);
const luhnEncode = (payload) => payload + luhnCheck(payload);
const luhnValidate = (code) => luhnSum(code) % 10 === 0;

// --- scheme 3: mod-97 (two check digits) -----------------------------------
const mod97Check = (payload) => String(98 - ((Number(payload) * 100) % 97)).padStart(2, '0');
const mod97Encode = (payload) => payload + mod97Check(payload);
const mod97Validate = (code) => Number(code) % 97 === 1;

const schemes = [
  { name: 'plain sum', encode: plainEncode, validate: plainValidate, checkLength: 1 },
  { name: 'Luhn', encode: luhnEncode, validate: luhnValidate, checkLength: 1 },
  { name: 'mod-97', encode: mod97Encode, validate: mod97Validate, checkLength: 2 },
];

/** Every single-digit substitution of `code`, in a fixed order. */
function* substitutions(code) {
  for (let i = 0; i < code.length; i++) {
    for (let d = 0; d <= 9; d++) {
      if (String(d) === code[i]) continue;
      yield code.slice(0, i) + d + code.slice(i + 1);
    }
  }
}

/** Every adjacent transposition of `code` that actually changes it, tagged
 *  with whether the swap reached into the check digits or stayed inside the
 *  payload -- the two cases behave differently and the difference is the
 *  lesson. */
function* transpositions(code, checkLength) {
  const payloadEnd = code.length - checkLength;
  for (let i = 0; i < code.length - 1; i++) {
    if (code[i] === code[i + 1]) continue;
    yield {
      code: code.slice(0, i) + code[i + 1] + code[i] + code.slice(i + 2),
      touchesCheck: i + 1 >= payloadEnd,
    };
  }
}

console.log(`identifiers ${FIRST_ID}..${FIRST_ID + ID_COUNT - 1}, every error of both classes generated`);
console.log('');
console.log('scheme      length   single-digit errors        adjacent transpositions');
console.log('                     caught / total             caught / total');

const results = [];
for (const scheme of schemes) {
  let subTotal = 0, subCaught = 0, trTotal = 0, trCaught = 0, length = 0;
  let payloadTotal = 0, payloadCaught = 0, inTotal = 0, inCaught = 0;
  for (let n = 0; n < ID_COUNT; n++) {
    const code = scheme.encode(String(FIRST_ID + n));
    length = code.length;
    for (const bad of substitutions(code)) {
      subTotal++;
      if (!scheme.validate(bad)) subCaught++;
    }
    for (const bad of transpositions(code, scheme.checkLength)) {
      trTotal++;
      if (bad.touchesCheck) inTotal++;
      else payloadTotal++;
      if (!scheme.validate(bad.code)) {
        trCaught++;
        if (bad.touchesCheck) inCaught++;
        else payloadCaught++;
      }
    }
  }
  results.push({ name: scheme.name, length, subCaught, subTotal, trCaught, trTotal, payloadCaught, payloadTotal, inCaught, inTotal });
  const pct = (a, b) => ((a / b) * 100).toFixed(2).padStart(6);
  console.log(
    `${scheme.name.padEnd(11)} ${String(length).padStart(4)}    ` +
      `${String(subCaught).padStart(6)} / ${String(subTotal).padStart(6)}  ${pct(subCaught, subTotal)}%   ` +
      `${String(trCaught).padStart(5)} / ${String(trTotal).padStart(5)}  ${pct(trCaught, trTotal)}%`
  );
}

const plain = results[0];
const luhn = results[1];

console.log('');
console.log('the same transpositions, split by where the swap landed:');
console.log('scheme      inside the payload      touching the check digits');
for (const r of results) {
  const pct = (a, b) => (b === 0 ? '   n/a' : ((a / b) * 100).toFixed(2).padStart(6));
  console.log(
    `${r.name.padEnd(11)} ${String(r.payloadCaught).padStart(5)} / ${String(r.payloadTotal).padStart(5)}  ${pct(r.payloadCaught, r.payloadTotal)}%   ` +
      `${String(r.inCaught).padStart(4)} / ${String(r.inTotal).padStart(4)}  ${pct(r.inCaught, r.inTotal)}%`
  );
}

console.log('');
console.log(`A plain sum catches every single wrong digit, and ${plain.payloadCaught} of the ${plain.payloadTotal} transpositions`);
console.log('that happen inside the payload -- which is the number that matters, because');
console.log('swapping two digits does not change their sum, so the check digit does not');
console.log('change either and the wrong identifier validates cleanly. The only swaps it');
console.log('notices are the ones that disturb the check digit itself.');
console.log('');
console.log(`Luhn misses ${luhn.trTotal - luhn.trCaught} transpositions out of ${luhn.trTotal}. They are not spread evenly: doubling`);
console.log('and folding gives 0 and 9 the same contribution, so a 0 next to a 9 swaps');
console.log('invisibly. Every other adjacent swap is caught.');
console.log('');
console.log('mod-97 catches both classes completely and costs one extra character. That is');
console.log('the trade -- not accuracy against speed, but one character of tag space against');
console.log('an entire class of silent wrong answers.');
