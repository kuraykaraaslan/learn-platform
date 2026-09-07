# 574. Check Digits: Making a Mistyped Identifier Fail Loudly

## What It Is
Codes get damaged, and when a code cannot be scanned somebody types the identifier from the printed text beside it. That is the fallback, it is used constantly, and it introduces a failure the scanner never had: **a mistyped identifier that happens to be another real asset**. `FAN-B2-01` and `FAN-B2-02` are both in the register, so a typing slip does not produce an error — it produces a reading attached to the wrong machine (Lesson 572).

A **check digit** closes most of that gap. It is one or two extra characters computed from the rest of the identifier, so that a typo makes the whole string arithmetically invalid rather than merely wrong. The identifier stops being a bare label and becomes a label that can verify itself, with no network and no catalogue lookup — which matters precisely in the situation where the fallback is being used.

Two error classes dominate hand entry and they are not equally easy to catch. A **single wrong digit** is the obvious one, and almost any scheme catches it. An **adjacent transposition** — typing `21` for `12` — is the one that separates the schemes, because the naive design everybody reaches for is blind to it. If the check is the sum of the digits, swapping two of them changes nothing at all: the sum is the same, the check is the same, and the wrong identifier validates cleanly.

That claim is countable rather than arguable, so the proof below counts it over every possible error in a block of identifiers. The three schemes compared are the plain sum, **Luhn** (the alternating-weight scheme of ISO/IEC 7812, familiar from card numbers) and the two-digit remainder scheme of **ISO 7064**, familiar from IBANs. What the numbers show is that the difference between them is not accuracy in general — it is that one of them has an entire blind class.

A note on scope before the arithmetic: a check digit detects **accidental** errors, not deliberate ones, and it says nothing about whether the identifier exists. A code can be arithmetically valid and refer to no asset, which is Lesson 578's problem, and it can be valid and refer to the wrong asset if the whole identifier was misread rather than mistyped, which is Lesson 577's.

```quiz
- q: "Why does a typo in a hand-entered identifier not simply produce an error?"
  anchor: "a mistyped identifier that happens to be another real asset"
  options:
    - text: "Because the system trims and normalises input"
      correct: false
      why: "Normalisation is real but incidental; the problem is that neighbouring identifiers exist."
    - text: "Because neighbouring assets have neighbouring identifiers, so the typo names a different real asset"
      correct: true
      why: "The record is then attached to the wrong machine and nothing downstream can tell (Lesson 572)."
    - text: "Because check digits are usually disabled in field apps"
      correct: false
      why: "Most identifiers have no check digit at all — that is what this lesson adds."

- q: "Why is a plain digit sum a poor check digit?"
  anchor: "swapping two of them changes nothing at all"
  options:
    - text: "It is too short to be unique"
      correct: false
      why: "A check digit is not meant to be unique — it is a function of the payload."
    - text: "Transposing two digits leaves the sum unchanged, so the check passes and the wrong identifier is accepted"
      correct: true
      why: "The proof counts this: zero of the payload-internal transpositions are caught."
    - text: "It is easy to compute, so people can forge it"
      correct: false
      why: "Check digits are not a security mechanism — they detect accidents, not attackers."

- q: "What does a valid check digit NOT tell you?"
  anchor: "it says nothing about whether the identifier exists"
  options:
    - text: "Nothing further — a valid check means the identifier is correct"
      correct: false
      why: "It means the string is internally consistent, which is a much weaker claim."
    - text: "That the asset exists, or that it is the asset in front of you"
      correct: true
      why: "Existence is Lesson 578's problem and misreading the right-shaped code is Lesson 577's."
    - text: "That the code was scanned rather than typed"
      correct: false
      why: "True but unimportant — both paths produce the same string."
```

## Key Concepts
- **The fallback is typing** — a damaged code sends somebody to the printed text, constantly
- **A typo names another real asset** rather than producing an error (Lesson 572)
- **A check digit makes the string verify itself**, offline, with no catalogue lookup
- **Two error classes dominate**: a single wrong digit, and an adjacent transposition
- **A plain sum is blind to transpositions** — swapping two digits leaves the sum unchanged
- **Luhn** (ISO/IEC 7812) catches all single-digit errors and nearly all transpositions
- **ISO 7064's mod-97** catches both classes completely, for one more character
- **A valid check digit does not mean the asset exists** (Lesson 578) or is the right one (Lesson 577)

## Example Code
The three schemes, computed on one identifier, so the arithmetic is visible before it is counted:

```typescript run
/** The three schemes, applied to one payload. Each returns the check
 *  characters that get appended to the printed identifier. */
const digits = (s: string): number[] => [...s].map((c) => Number(c));

const plainCheck = (payload: string): string =>
  String(digits(payload).reduce((a, d) => a + d, 0) % 10);

function luhnSum(body: string): number {
  // Reversed: index 0 is the check digit and is never doubled.
  return digits(body)
    .reverse()
    .reduce((acc, digit, i) => {
      if (i % 2 === 1) {
        const doubled = digit * 2;
        return acc + (doubled > 9 ? doubled - 9 : doubled);
      }
      return acc + digit;
    }, 0);
}
const luhnCheck = (payload: string): string => String((10 - (luhnSum(payload + '0') % 10)) % 10);

const mod97Check = (payload: string): string =>
  String(98 - ((Number(payload) * 100) % 97)).padStart(2, '0');

const payload = '100472';
console.log(`payload            : ${payload}`);
console.log(`plain sum          : ${payload}${plainCheck(payload)}`);
console.log(`Luhn               : ${payload}${luhnCheck(payload)}`);
console.log(`mod-97 (ISO 7064)  : ${payload}${mod97Check(payload)}`);
console.log('');

// The transposition the plain sum cannot see.
const swapped = '100427';
console.log(`now transpose the last two payload digits: ${payload} -> ${swapped}`);
console.log(`  plain sum check for ${payload} : ${plainCheck(payload)}`);
console.log(`  plain sum check for ${swapped} : ${plainCheck(swapped)}`);
console.log(`  same check digit? ${plainCheck(payload) === plainCheck(swapped) ? 'YES -- the error is invisible' : 'no'}`);
console.log('');
console.log(`  Luhn check for ${payload} : ${luhnCheck(payload)}`);
console.log(`  Luhn check for ${swapped} : ${luhnCheck(swapped)}`);
console.log(`  same check digit? ${luhnCheck(payload) === luhnCheck(swapped) ? 'YES' : 'no -- the error is caught'}`);
console.log('');
console.log('One example is an anecdote. The run below turns it into a count.');
```

Two digits, one swap, and one of the three schemes shrugs. The question worth answering is how general that is — so every single-digit error and every adjacent transposition over a block of a thousand identifiers is generated and checked. Before reading it, predict what fraction of transpositions inside the payload a plain sum catches:

```proof sha=101305a9b56180fb at=2026-09-07 commit=3bd50b8
$ node checkdigit.js
identifiers 100000..100999, every error of both classes generated

scheme      length   single-digit errors        adjacent transpositions
                     caught / total             caught / total
plain sum      7     63000 /  63000  100.00%     800 /  4600   17.39%
Luhn           7     63000 /  63000  100.00%    4440 /  4600   96.52%
mod-97         8     72000 /  72000  100.00%    5517 /  5517  100.00%

the same transpositions, split by where the swap landed:
scheme      inside the payload      touching the check digits
plain sum       0 /  3700    0.00%    800 /  900   88.89%
Luhn         3560 /  3700   96.22%    880 /  900   97.78%
mod-97       3700 /  3700  100.00%   1817 / 1817  100.00%

A plain sum catches every single wrong digit, and 0 of the 3700 transpositions
that happen inside the payload -- which is the number that matters, because
swapping two digits does not change their sum, so the check digit does not
change either and the wrong identifier validates cleanly. The only swaps it
notices are the ones that disturb the check digit itself.

Luhn misses 160 transpositions out of 4600. They are not spread evenly: doubling
and folding gives 0 and 9 the same contribution, so a 0 next to a 9 swaps
invisibly. Every other adjacent swap is caught.

mod-97 catches both classes completely and costs one extra character. That is
the trade -- not accuracy against speed, but one character of tag space against
an entire class of silent wrong answers.
```

The zero in that table is the number to remember. It is not a weakness in the plain sum's strength; it is a whole class of error it cannot represent, and it is the class produced by the most common typing mistake there is.

## When to Use
- On any identifier that a human will ever type, which includes every identifier printed beside a code
- When designing an identifier scheme, where adding the check digit later means re-tagging the estate (Lesson 580)
- When choosing between schemes, where the question is whether one extra character is worth closing the transposition class
- In the field app's input box, where the check runs offline and rejects before anything is queued (Lesson 494)
- When accepting identifiers from another system, where a check digit turns a silent mismatch into a rejected row

## Common Mistakes
- **Inventing a check digit as a digit sum** — it is the natural first idea and it is blind to transpositions
- **Treating a check digit as validation** — it says the string is consistent, not that the asset exists (Lesson 578)
- **Treating it as security** — it detects accidents; anyone can compute a valid check
- **Adding it after the estate is tagged** — the scheme has to be decided before the tags are printed
- **Validating only on the server** — the value of the check is that it works offline, at the moment of entry
- **Omitting the check from the printed text** — the check exists for the typed path, so it has to be visible to type

## Further Reading
- [NIST/SEMATECH e-Handbook — the arithmetic of error detection is well covered in ISO 7064](https://www.iso.org/standard/31531.html) — the mod-97 scheme's definition and its guarantee, by catalogue reference; the clause text is paid
- [ISO/IEC 7812-1 — identification cards, numbering system](https://www.iso.org/standard/70484.html) — where the Luhn check digit is specified; catalogue reference
- [Lesson 572](/courses/asset-identification/the-wrong-asset-problem) — why a mistyped identifier that names a real asset is the failure that matters
- [Lesson 578](/courses/asset-identification/offline-resolution) — what happens next: a valid code that resolves to nothing
- [Lesson 577](/courses/asset-identification/the-scan-that-fails-and-the-scan-that-lies) — the checks that catch what a check digit cannot: a well-formed code for the wrong asset

```recall
- q: "Why does an identifier that people type need a check digit?"
  must:
    - "a typo usually names another real asset rather than producing an error"
    - "neighbouring assets have neighbouring identifiers"
    - "the check makes a mistyped string arithmetically invalid, offline and with no lookup"

- q: "Which error class separates the schemes, and why is a plain sum blind to it?"
  must:
    - "adjacent transposition -- typing two digits in the wrong order"
    - "a sum is unchanged by swapping two of its terms, so the check digit is unchanged too"
    - "the wrong identifier then validates cleanly; the proof counts zero payload-internal transpositions caught"

- q: "What does a valid check digit not tell you?"
  must:
    - "that the asset exists -- a valid code can refer to nothing"
    - "that it is the asset in front of you"
    - "and it detects accidents rather than deliberate forgery, since anyone can compute a valid check"
```
