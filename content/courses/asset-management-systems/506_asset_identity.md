# 506. Asset Identity: Tags, Serials, and Surviving a Replacement

## What It Is
An asset has two identifiers and they answer different questions. The **serial number** identifies a physical unit — this exact pump, built by this manufacturer, with this warranty. The **functional-location tag** identifies a position in the plant — "the booster pump on set 01", whatever unit is currently bolted there. When the pump fails and is replaced, the serial changes and the tag does not, and that is the entire point of having both.

The register keys on the tag, because the thing it is tracking is the **function**: how often does this position fail, what does its downtime cost, when is it due. A register keyed on the serial restarts every asset's history at every replacement, which is exactly when the history was about to become useful. The serial still belongs in the register — as an attribute of the row, the unit installed right now — it is just not the identity.

The operational problem is that tags are written by people, in the field, onto equipment and into three different systems, and they drift. `PMP-1001A`, `PMP 1001A`, `pmp-1001a`, `PMP1001A` and `P-1001-A` are one asset to a human and five to a database. Before two registers can be compared (Lesson 510), or a field capture matched to a register row, tags have to be **normalised** to a canonical form — and normalisation has to be conservative, because collapsing `FAN-B2-1` and `FAN-B2-01` into one when they are actually two assets is worse than leaving them apart.

Replacement also raises a smaller question: what happens to the old unit's history. The work orders and readings stay under the tag, because they describe the function. If the organisation needs per-unit history — a warranty claim, a fleet reliability study — that is a separate `installed_unit` record keyed on serial, with a fitted and removed date, joined to the tag. Most registers do not need it until they do.

```quiz
- q: "Why does the register key on the functional-location tag rather than the serial number?"
  anchor: "the thing it is tracking is the **function**: how often does this position fail, what does its downtime cost, when is it due"
  options:
    - text: "Serials are not unique across manufacturers"
      correct: false
      why: "That is a real nuisance but not the reason. Even globally-unique serials would be the wrong key."
    - text: "The register tracks the function, so its history must be continuous across the units that fill the position over time"
      correct: true
      why: "Keying on the serial restarts the history at every replacement, losing exactly the trend the register exists to show."
    - text: "Tags are shorter and easier to type"
      correct: false
      why: "Incidental. A longer stable key would still be preferable to a short one that changes."

- q: "Why must tag normalisation be conservative?"
  anchor: "collapsing `FAN-B2-1` and `FAN-B2-01` into one when they are actually two assets is worse than leaving them apart"
  options:
    - text: "Because normalisation is slow and over-matching wastes CPU"
      correct: false
      why: "Cost is not the issue. The issue is a wrong merge."
    - text: "Because merging two genuinely distinct assets into one destroys both histories, which is harder to undo than a missed match"
      correct: true
      why: "A missed match sits in a review queue; a wrong merge has already combined two histories before anyone looks."
    - text: "Because the database will reject a duplicate key"
      correct: false
      why: "It will — but by then the normalisation has already decided the two tags are the same, which is the error."
```

## Key Concepts
- **Two identifiers, two questions**: serial identifies the unit, tag identifies the position
- **A replacement changes the serial and keeps the tag** — that is why both exist
- **The register keys on the tag** because it tracks the function, not the hardware
- **The serial is an attribute of the row**, the unit installed now — not the key
- **Tags drift** — separators, case, zero-padding, prefixes — one asset becomes several to a database
- **Normalisation must be conservative** — a missed match is recoverable, a wrong merge is not
- **Work orders and readings stay under the tag** through a replacement, because they describe the function
- **Per-unit history is a separate `installed_unit` record** keyed on serial, added only when a warranty or reliability question needs it

## Example Code
A tag normaliser. It folds case and collapses separators to produce a canonical key, but it **does not** touch zero-padding or numeric content, because that is where distinct assets get merged:

```typescript run
/** Canonical form of a functional-location tag: upper-case, single hyphen as
 *  the only separator, no leading/trailing separators. Deliberately does NOT
 *  normalise numbers — `FAN-B2-1` and `FAN-B2-01` stay different. */
function canonicalTag(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s_./]+/g, '-') // spaces, underscores, dots, slashes -> hyphen
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

const asWritten = [
  'PMP-1001A',
  'PMP 1001A',
  'pmp-1001a',
  'PMP_1001A',
  ' PMP-1001A ',
  'PMP1001A', // no separator at all — a different string, left alone
  'FAN-B2-1', // NOT the same as FAN-B2-01
  'FAN-B2-01',
];

const groups = new Map<string, string[]>();
for (const tag of asWritten) {
  const key = canonicalTag(tag);
  groups.set(key, [...(groups.get(key) ?? []), tag]);
}

console.log('canonical key      <- source spellings');
for (const [key, sources] of groups) {
  console.log(`${key.padEnd(18)} <- ${sources.join(' | ')}`);
}

console.log('');
console.log(`${asWritten.length} written forms collapsed to ${groups.size} canonical keys.`);
console.log('PMP1001A stayed separate: removing a missing separator is a guess, not a fold.');
console.log('FAN-B2-1 and FAN-B2-01 stayed separate: they may be two real assets.');
```

The `installed_unit` record, for when per-unit history is actually needed:

```typescript
type InstalledUnit = {
  /** The functional-location tag — the position. Stable. */
  tag: string;
  /** The manufacturer's serial of this specific unit. */
  serial: string;
  fittedOn: string;
  /** null while this is the unit currently installed. */
  removedOn: string | null;
};

/** The unit installed at `tag` on a given date — the join a warranty claim or
 *  a reliability study needs, and which a tag-keyed register cannot answer. */
function unitAt(history: InstalledUnit[], tag: string, on: string): InstalledUnit | undefined {
  return history.find(
    (u) => u.tag === tag && u.fittedOn <= on && (u.removedOn === null || on < u.removedOn)
  );
}
```

## When to Use
- When designing the register key — always the tag, with the serial as a column
- Before comparing two registers or matching field data to the register, where normalisation is the first step (Lesson 510)
- When a replacement happens, to confirm the work-order and reading history stays attached and only the serial column moves
- When a warranty claim or a fleet-reliability question arrives and the tag-keyed register cannot answer it — the trigger to add `installed_unit`

## Common Mistakes
- **Keying the register on the serial** — every replacement starts a new asset and the failure history you needed is now split across two keys
- **Normalising numeric content** — folding `-1` to `-01` merges two assets whenever the site actually has both
- **Aggressive separator removal** — dropping all separators turns `PMP-1001A` and `P-M-P-1001-A` into a match and also collides unrelated tags
- **Discarding the serial entirely** — it is not the key, but a warranty claim, a recall notice and a reliability study all need it
- **Rewriting historical work orders to a new tag on rename** without keeping the old tag as a recorded alias — the trail breaks at the rename
- **Treating a replacement as a new asset row** — the position's history should be continuous; a new row for the same location fragments every report

## Further Reading
- [ISO/TS 16952-10 catalogue page](https://www.iso.org/standard/41850.html) — reference designation / functional-location tagging for technical products; number and scope only
- [KKS / RDS-PP overview (VGB)](https://www.vgb.org/en/) — the power-industry designation systems that formalise what a functional-location tag encodes
- [Unicode TR15: Normalization Forms](https://unicode.org/reports/tr15/) — why "fold then compare" needs a defined canonical form, and the traps in string equality generally

```recall
- q: "State what the serial number and the functional-location tag each identify."
  must:
    - "the serial identifies a physical unit — this exact pump, its warranty"
    - "the tag identifies a position in the plant, whatever unit fills it"
    - "a replacement changes the serial and keeps the tag"

- q: "Why must tag normalisation be conservative, and what does that rule out?"
  must:
    - "a missed match goes to a review queue and is recoverable"
    - "a wrong merge has already combined two histories"
    - "so normalisation folds case and separators but not zero-padding or numbers"

- q: "Where does a unit's history go after it is removed at replacement?"
  must:
    - "work orders and readings stay under the tag — they describe the function"
    - "per-unit history needs a separate installed_unit record keyed on serial"
    - "with fitted and removed dates, added only when a warranty or reliability question needs it"
```
