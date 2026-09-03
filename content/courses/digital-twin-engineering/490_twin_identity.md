# 490. Twin Identity: Stable Ids Across a Model That Gets Re-Exported

## What It Is
Every binding in a twin depends on an id surviving a re-export, and Lesson 433 established that whether IFC's `GlobalId` survives is a **promise the exporting application makes rather than a guarantee the format provides**. This lesson is what to do about that, and the answer is a preference order rather than a single choice.

**First preference: an id the organisation controls.** A shared parameter carrying an asset tag (Lesson 459) is the only identifier in the whole chain that nobody else can renumber. It is defined in your shared-parameter file, it is populated by your process, and no exporter has any reason to touch it. It also costs something real — somebody has to put it on every element — which is exactly why it is worth deciding before the model is built rather than after the first re-export.

**Second preference: `GlobalId`.** Stable when the exporter preserves it, and **whether it does is testable in advance**: export the same unchanged model twice and compare the id sets. That five-minute check is what tells you which strategy is even available, and it is the single most useful thing to do before building a twin on a model you did not produce.

**Third, and only as a recovery tool: a content fingerprint.** Hash what the element *is* — its type, its spatial container, its name — rather than what it was numbered. It survives an id change, and it has a failure mode worse than being wrong: two elements the model describes identically get the same fingerprint, so the fingerprint **pairs them arbitrarily and reports nothing**. The binding looks intact and half the readings are attributed to the wrong device. A fingerprint recovers a broken binding you did not choose; it is not an identity strategy to build on.

What a fingerprint must exclude is as important as what it includes: no instance number (renumbered freely), no ownership history (rewritten on export), and **no coordinates** — because Lesson 484's transform can move an element's numbers without the element changing.

```quiz
- q: "You are about to build a twin on a model from a tool you do not control. What is the first thing to do?"
  anchor: "export the same unchanged model twice and compare the id sets"
  options:
    - text: "Add asset tags to every element"
      correct: false
      why: "The right answer eventually and expensive to start with. First find out whether you need to."
    - text: "Export the unchanged model twice and compare the GlobalId sets"
      correct: true
      why: "Five minutes, and it tells you which identity strategy is available at all."
    - text: "Build a fingerprint index as a fallback"
      correct: false
      why: "A fingerprint is a recovery tool. Reaching for it before knowing whether ids are stable is planning for the worst case without checking."

- q: "What is the dangerous failure of a content fingerprint?"
  anchor: "pairs them arbitrarily and reports nothing"
  options:
    - text: "It changes when the element is edited"
      correct: false
      why: "True and detectable: the binding breaks and you can see it break."
    - text: "Two elements the model describes identically collide, and the pairing is arbitrary and silent"
      correct: true
      why: "The binding looks intact and half the readings go to the wrong device."
    - text: "It is expensive to compute over a large model"
      correct: false
      why: "It is a hash of a few fields. Cost is not the issue."
```

## Key Concepts
- **Every binding depends on an id surviving a re-export** (Lesson 485)
- **`GlobalId` stability is an exporter promise**, not a format guarantee (Lesson 433)
- **Preference 1: an organisation-controlled asset tag** — a shared parameter nobody else can renumber (Lesson 459)
- **Preference 2: `GlobalId`** — and whether it survives is testable in advance
- **The test**: export the unchanged model twice, compare the id sets
- **Preference 3: a content fingerprint** — a recovery tool, not a foundation
- **A fingerprint collides silently** on elements the model describes identically
- **Exclude from a fingerprint**: instance numbers, ownership history, and coordinates
- **Coordinates are excluded because Lesson 484's transform moves them** without the element changing
- **A broken binding is an absence, not an error** — which is why this is designed rather than discovered

## Example Code
The three strategies against a re-export in which every `GlobalId` changed:

```typescript run
// them depends on an id surviving a re-export, and Lesson 433 established that
// whether GlobalId survives is a promise rather than a guarantee. This is what
// to do when it does not.
type Element = {
  /** The model's own id. Ideally stable; verify rather than assume. */
  globalId: string;
  ifcType: string;
  /** The spatial container's id — Lesson 435's containment relationship. */
  storeyId: string;
  /** A shared-parameter value the organisation controls (Lesson 459). This is
   *  the only id in this record that nobody else can renumber. */
  assetTag: string | null;
  name: string;
};

/** Three strategies, in the order you should prefer them. */
type Strategy = 'asset-tag' | 'global-id' | 'fingerprint';

const mix = (n: number): number => {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
};

/** A content fingerprint: derived from what the element IS rather than from
 *  what it was numbered. Deliberately excludes anything an exporter rewrites
 *  — no instance number, no ownership history, no coordinates, because
 *  Lesson 484's transform can move those without the element changing. */
function fingerprint(e: Element): string {
  const material = `${e.ifcType}|${e.storeyId}|${e.name}`;
  let hash = 0;
  for (const ch of material) hash = (Math.imul(hash, 31) + ch.charCodeAt(0)) | 0;
  return `fp-${(mix(hash) >>> 0).toString(36).padStart(7, '0')}`;
}

function keyFor(e: Element): { key: string; strategy: Strategy } {
  // An organisation-controlled tag is the only id nobody else can renumber.
  if (e.assetTag !== null) return { key: e.assetTag, strategy: 'asset-tag' };
  // GlobalId next: stable when the exporter keeps it, which is testable.
  if (e.globalId !== '') return { key: e.globalId, strategy: 'global-id' };
  // And a fingerprint last, because it is the one that silently re-pairs when
  // two elements genuinely are alike.
  return { key: fingerprint(e), strategy: 'fingerprint' };
}

const BEFORE: Element[] = [
  { globalId: '3Xt7zPfNb2vgqR1YkEwNsq', ifcType: 'IfcAirTerminal', storeyId: 'L01', assetTag: 'AT-0141', name: 'Supply diffuser 1' },
  { globalId: '1MvQ7cRkT4vAWmDpLs2nXe', ifcType: 'IfcAirTerminal', storeyId: 'L01', assetTag: null, name: 'Supply diffuser 2' },
  { globalId: '2Kd9WpYbn0OQAzUcRt6mLh', ifcType: 'IfcSensor', storeyId: 'L01', assetTag: 'AT-0142', name: 'Room sensor A' },
  { globalId: '0Vb4NsHkD1EQfXpTr8wLmY', ifcType: 'IfcSensor', storeyId: 'L01', assetTag: null, name: 'Room sensor B' },
];

// The second export. The exporter regenerated every GlobalId — the failure
// Lesson 433 describes — and nothing else about the building changed.
const AFTER: Element[] = BEFORE.map((e, i) => ({
  ...e,
  globalId: `re-${(mix(i + 991) >>> 0).toString(36)}`,
}));

console.log('bindings that survive a re-export in which every GlobalId changed:');
console.log('');
console.log('  element               strategy      key before      key after       same?');
for (let i = 0; i < BEFORE.length; i++) {
  const b = keyFor(BEFORE[i]);
  const a = keyFor(AFTER[i]);
  console.log(
    `  ${BEFORE[i].name.padEnd(20)} ${a.strategy.padEnd(13)} ${b.key.slice(0, 13).padEnd(15)} ${a.key.slice(0, 13).padEnd(15)} ${b.key === a.key ? 'yes' : 'NO'}`
  );
}
console.log('');
console.log('The two elements with an asset tag survived. The two without it did not, and');
console.log('their live-data bindings are now pointing at nothing — silently, because a');
console.log('binding to a missing element is an absent reading rather than an error.');
console.log('');

// The fallback, and its own failure mode, which is worse than being wrong.
const withFingerprints = BEFORE.map((e) => ({ ...e, assetTag: null, globalId: '' }));
console.log('the same four elements keyed by fingerprint only:');
for (const e of withFingerprints) console.log(`  ${e.name.padEnd(20)} ${fingerprint(e)}`);

// Two elements that are genuinely alike. A fingerprint cannot tell them apart,
// and it does not report that it could not.
const TWINS: Element[] = [
  { globalId: '', ifcType: 'IfcSensor', storeyId: 'L01', assetTag: null, name: 'Room sensor' },
  { globalId: '', ifcType: 'IfcSensor', storeyId: 'L01', assetTag: null, name: 'Room sensor' },
];
console.log('');
console.log('and two elements the model describes identically:');
for (const e of TWINS) console.log(`  ${e.name} on ${e.storeyId}   ${fingerprint(e)}`);
console.log(`  collide: ${fingerprint(TWINS[0]) === fingerprint(TWINS[1])}`);
console.log('');
console.log('A fingerprint pairs them, arbitrarily, and reports nothing. That is worse than');
console.log('failing: the binding looks intact and half the readings are attributed to the');
console.log('wrong device. So a fingerprint is a recovery tool for a re-export you did not');
console.log('control, not an identity strategy to build on.');
console.log('');
console.log('The order to prefer, and the reason:');
console.log('  1. an asset tag the organisation controls — nobody else can renumber it');
console.log('  2. GlobalId — stable when the exporter keeps it, which is testable in advance');
console.log('  3. a content fingerprint — recovers a broken binding, and can pair the wrong two');
```

## When to Use
- Before building a twin on any model, where the two-export test decides the strategy
- When specifying a model requirement, where "an asset tag on every element, as a shared parameter with this GUID" is checkable and "stable ids" is not
- After a re-export, where a fingerprint is how bindings that broke are recovered — with the collisions reviewed rather than trusted
- When a twin reports plausible values for the wrong location, where a fingerprint collision is a likely cause

## Common Mistakes
- **Assuming `GlobalId` is stable** — it is stable when the exporter preserves it, and several do not
- **Not running the two-export test** — five minutes that determines which strategy is available at all
- **Building on fingerprints** — they collide silently, which is worse than breaking loudly
- **Including coordinates in a fingerprint** — a georeferencing change moves them without the element changing (Lesson 484)
- **Including the instance number** — `#42` is a position in one file and is renumbered freely (Lesson 431)
- **Treating a broken binding as an error** — it surfaces as an absent reading, so nothing raises unless something is looking for absences
- **Adding asset tags after the first re-export** — the elements that needed them are the ones whose old ids are already gone

## Further Reading
- [IfcGloballyUniqueId](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcGloballyUniqueId.htm) — the defined type, its uniqueness rule, and what the rule does and does not say about exports
- [IfcRoot](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRoot.htm) — where the id lives, alongside the ownership history a fingerprint must ignore
- [Revit API Developer's Guide (Revit 2025)](https://help.autodesk.com/view/RVT/2025/ENU/?guid=Revit_API_Revit_API_Developers_Guide_html) — the shared-parameter GUID that makes preference one possible, on the authoring side

```recall
- q: "Give the three identity strategies in preference order, with the reason for the order."
  must:
    - "an organisation-controlled asset tag — a shared parameter nobody else can renumber"
    - "GlobalId — stable when the exporter preserves it, and testable in advance"
    - "a content fingerprint — a recovery tool only, because it collides silently"

- q: "What is the test that decides which strategy is available?"
  must:
    - "export the same unchanged model twice"
    - "compare the GlobalId sets"
    - "five minutes, and it should happen before a twin is built on someone else's model"

- q: "What must a content fingerprint exclude, and why the coordinates?"
  must:
    - "instance numbers, which are renumbered freely"
    - "ownership history, which is rewritten on export"
    - "coordinates, because a georeferencing change moves them without the element changing"
```
