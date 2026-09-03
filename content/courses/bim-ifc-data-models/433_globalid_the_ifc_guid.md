# 433. GlobalId — IFC's 22-Character GUID, and What Breaks It

## What It Is
Every IFC entity that can be talked about from outside the file inherits from `IfcRoot`, and `IfcRoot`'s first attribute is a `GlobalId`. It is a 128-bit UUID, but it is not written as one. IFC compresses it into a 22-character string using its own 64-character alphabet — the digits, then `A-Z`, then `a-z`, then `_` and `$` — which is why a GlobalId looks like `3Xt7zPfNb2vgqR1YkEwNsq` rather than like the hyphenated form you are used to.

The compression is mechanical and worth knowing, because it explains a check you can run in one line. The 16 bytes are taken in groups of 1, 3, 3, 3, 3 and 3, and each group is written as 2, 4, 4, 4, 4 and 4 characters — 22 in total. The first group is one byte encoded into two base-64 characters, so it carries 8 bits in 12 bits of space. The leading character therefore holds only two significant bits, and **the first character of a valid GlobalId is always `0`, `1`, `2` or `3`**. Anything else in that position means the string is not a GlobalId, whatever else it might be.

What the identifier is *for* is the harder half. Within one file, uniqueness is a schema rule. Across two exports of the same model it is a promise the exporting application makes, and not all of them keep it. If a tool regenerates GlobalIds on every export, then every external system keyed on them — your asset register, your issue tracker, your diff — sees a model where every element was deleted and a new one created. That is not a bug you can fix downstream, and it is the first thing to test when you take delivery of a second export.

```quiz
- q: "A string arrives claiming to be a GlobalId and starts with `7`. What do you know?"
  anchor: "the first character of a valid GlobalId is always `0`, `1`, `2` or `3`"
  options:
    - text: "Nothing — every character of the alphabet is legal in every position"
      correct: false
      why: "Legal in the alphabet, yes. But the first character encodes only the top two bits of the first byte, so it cannot exceed 3."
    - text: "It is not a GlobalId — the leading character carries only two significant bits"
      correct: true
      why: "One byte written into two base-64 characters leaves the leading character with a value below 4."
    - text: "It came from IFC2X3 rather than IFC4"
      correct: false
      why: "The encoding is the same across schema versions. This is an encoding fact, not a version fact."

- q: "A second export of the same building shows every element as deleted and re-created. What is the most likely cause?"
  anchor: "If a tool regenerates GlobalIds on every export"
  options:
    - text: "The model really was rebuilt between exports"
      correct: false
      why: "Possible, but check the cheaper explanation first — a wholesale id change from an unchanged model is the classic signature."
    - text: "The exporter regenerated GlobalIds, so nothing on either side matches"
      correct: true
      why: "Uniqueness within a file is a schema rule; stability across exports is only a promise the exporter makes."
    - text: "Your diff is comparing entity instance numbers instead of GlobalIds"
      correct: false
      why: "That is a real bug and produces the same symptom, but it is your bug rather than the exporter's — and the fix is to key on GlobalId, which this option has already assumed you are not doing."
```

## Key Concepts
- **`IfcRoot`**: the supertype of everything externally referenceable; its first attribute is the GlobalId, so anything with one derives from it
- **22 characters, 128 bits**: a UUID compressed with IFC's own base-64 alphabet — `0-9`, `A-Z`, `a-z`, `_`, `$`
- **1+3+3+3+3+3 bytes into 2+4+4+4+4+4 characters**: the grouping that produces exactly 22 characters
- **Leading character below 4**: only two bits fit there, so `0`-`3` is the whole legal range and a cheap validity check
- **Case-sensitive**: `A` and `a` are different characters in this alphabet, so any case-folding storage or comparison merges two distinct elements
- **Uniqueness vs stability**: unique within a file is a schema rule; unchanged across two exports is an exporter behaviour you have to verify
- **Instance number is not identity**: `#42` names a line in one file; the GlobalId is what survives a re-export

## Example Code
Both directions of the encoding, with the invariant printed at the end:

```typescript run
// IFC's own 64-character alphabet, in the order the encoding assumes.
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';

// 16 bytes -> groups of 1,3,3,3,3,3 bytes -> 2,4,4,4,4,4 characters = 22.
const GROUPS = [1, 3, 3, 3, 3, 3];

function encodeGuid(hex: string): string {
  const bytes = (hex.replace(/-/g, '').match(/../g) ?? []).map((h) => parseInt(h, 16));
  let out = '';
  let at = 0;
  for (const size of GROUPS) {
    let value = 0;
    for (let i = 0; i < size; i++) value = value * 256 + bytes[at++];
    let group = '';
    for (let i = 0; i < (size === 1 ? 2 : 4); i++) {
      group = ALPHABET[value % 64] + group;
      value = Math.floor(value / 64);
    }
    out += group;
  }
  return out;
}

function decodeGuid(guid: string): string {
  const bytes: number[] = [];
  let at = 0;
  for (const size of GROUPS) {
    let value = 0;
    for (let i = 0; i < (size === 1 ? 2 : 4); i++) value = value * 64 + ALPHABET.indexOf(guid[at++]);
    for (let i = size - 1; i >= 0; i--) bytes.push((value >> (8 * i)) & 0xff);
  }
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const uuid = '2b1e0a5c-7f43-4d9e-8c11-6a2f90d4e7b3';
const guid = encodeGuid(uuid);
console.log(`UUID     ${uuid}`);
console.log(`GlobalId ${guid}  (${guid.length} characters)`);
console.log(`back     ${decodeGuid(guid)}`);
console.log('');
console.log(`first character "${guid[0]}" — only two bits fit there`);
for (const sample of ['ffffffff-ffff-ffff-ffff-ffffffffffff', '00000000-0000-0000-0000-000000000000']) {
  console.log(`  ${sample} -> ${encodeGuid(sample)}`);
}
```

The two extremes are the proof: all-ones compresses to a string starting `3`, all-zeroes to one starting `0`, and nothing can land between the two.

## When to Use
- You are joining IFC elements to rows in your own database, and need a key that survives the model being re-exported
- You are diffing two exports and need a join key that is not the instance number
- You are validating an incoming model and want a cheap, local check that a supposed identifier really is one
- You are designing a column type for a GlobalId and need to decide its width, its case sensitivity and its collation deliberately rather than by default

## Common Mistakes
- **Storing a GlobalId case-insensitively** — a `citext` column, a case-insensitive collation or an upper-casing normalizer merges two elements whose ids differ only in case, and the merge is silent
- **Sizing the column at 20 or 24 characters** — the encoding produces exactly 22; a narrower column truncates and a wider one hides trailing whitespace picked up from a spreadsheet
- **Assuming the id survives a round trip through another tool** — it survives only if that tool preserves it, and several do not, so verify it on a second export rather than assuming
- **Joining on the instance number** — `#42` is a position inside one file, not an identity, and it changes whenever the exporter renumbers
- **Treating uniqueness as guaranteed across federated models** — the schema rule is per-file, so two disciplines' models can and occasionally do collide
- **Losing the `$` character in transport** — it is legal in the alphabet but is a substitution marker in many shell and template contexts, so an unquoted id can arrive with a hole in it

## Further Reading
- [IfcGloballyUniqueId](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcGloballyUniqueId.htm) — the defined type, its length and its encoding
- [IfcRoot](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRoot.htm) — where the attribute lives and the uniqueness rule attached to it
- [Universally unique identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier) — the 128-bit value underneath, and what its variants guarantee
- [IfcOpenShell](https://github.com/IfcOpenShell/IfcOpenShell) — a reference implementation of the same compression, worth diffing your own against

```recall
- q: "Describe the compression from a UUID to a GlobalId."
  must:
    - "128 bits, 16 bytes, grouped 1+3+3+3+3+3"
    - "written as 2+4+4+4+4+4 base-64 characters, 22 in total"
    - "the alphabet is 0-9, A-Z, a-z, _ and $"

- q: "State the leading-character rule and explain where it comes from."
  must:
    - "the first character is always 0, 1, 2 or 3"
    - "the first group is one byte written into two characters, so only two bits reach the leading position"
    - "it is a cheap local check that a string really is a GlobalId"

- q: "Give two storage decisions that quietly corrupt a GlobalId, and what each one does."
  must:
    - "case-insensitive storage or comparison merges two distinct elements"
    - "a column narrower than 22 characters truncates"
    - "the identity is the GlobalId, not the instance number, which changes on re-export"
```
