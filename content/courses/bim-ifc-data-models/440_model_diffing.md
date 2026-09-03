# 440. Model Diffing: Deciding What Actually Changed Between Two Exports

## What It Is
Two exports of the same model arrive a fortnight apart and somebody asks what changed. The question sounds like a diff and is not one, because the thing you are comparing is a graph serialized in an order nobody promised to keep.

Text diffing is out immediately. Instance numbers are positions inside one file, so a re-export can renumber every line without a single element changing; exporters reorder, reformat floats, and rewrite the header on every run. A `git diff` between two `.ifc` files routinely reports the whole file as modified, and the signal-to-noise ratio does not improve with effort.

That leaves comparison at the object level, and the first decision is the join key. **The GlobalId is the only identity IFC gives you**, so an id-keyed set difference — present in old, present in new, present in both — is the cheap and obvious approach. It is also completely dependent on the exporter preserving ids, which lesson 433 established is a promise rather than a guarantee. When ids churn, an id-keyed diff reports every element as deleted and re-created, and the report is not merely wrong but confidently wrong.

The second decision is what counts as a change for an element present in both. Attribute values, property set values, placement, geometry and type are five independent axes, and each has its own noise floor. A placement that moved by less than the model's declared precision did not move. A property whose value went from `2.5` to `2.50` did not change. Deciding this deliberately, and writing it down, is most of the work — a diff tool that reports every axis at full sensitivity produces a change list nobody reads, which is the same outcome as producing nothing.

```quiz
- q: "Why is `git diff` between two .ifc exports close to useless?"
  anchor: "Instance numbers are positions inside one file, so a re-export can renumber every line without a single element changing"
  options:
    - text: "The files are too large for a line-based diff to complete"
      correct: false
      why: "Size is not the problem. A 400 MB text file diffs fine; the output is just meaningless."
    - text: "Instance numbers, ordering and float formatting all change on re-export without anything in the model changing"
      correct: true
      why: "The serialization carries no promise of stability, so line-level differences do not correspond to model-level ones."
    - text: "IFC files are compressed, so the bytes differ even for identical models"
      correct: false
      why: "A STEP Physical File is plain, uncompressed text. The instability is in the numbering and ordering, not the encoding."

- q: "An id-keyed diff reports 4,000 deletions and 4,000 additions on a model nobody touched. What is the first thing to check?"
  anchor: "When ids churn, an id-keyed diff reports every element as deleted and re-created"
  options:
    - text: "Whether the exporter preserved GlobalIds between the two runs"
      correct: true
      why: "Wholesale churn with no other explanation is the exporter's signature, and the diff is the messenger."
    - text: "Whether the two files use the same schema version"
      correct: false
      why: "Worth knowing, but a version change does not by itself renumber identities."
    - text: "Whether your set difference is comparing the right direction"
      correct: false
      why: "A direction error gives you additions or deletions, not a symmetric doubling of both."
```

## Key Concepts
- **Instance number instability**: `#42` names a line in one file; re-export renumbers freely, so nothing at the text level is comparable
- **GlobalId as join key**: the only identity the schema offers, and the basis of every cheap diff
- **Id churn**: an exporter that regenerates ids turns any id-keyed diff into a full deletion-and-recreation report
- **Fingerprint matching**: pairing elements by type, placement and geometry when ids cannot be trusted — survives churn, costs far more, and can pair the wrong two elements
- **Change axes**: attributes, properties, placement, geometry and type change independently and need separate decisions
- **Noise floor per axis**: use the model's own `Precision` for placement, and normalise numeric strings before comparing property values
- **Ownership metadata is not a change signal**: `IfcOwnerHistory` timestamps move on export regardless, so comparing them reports everything
- **A change list nobody reads is the same as no change list**: sensitivity is a product decision, not a default

## Example Code
The two strategies, with the conditions under which each is the right one:

```tradeoff
question: "Diff two exports by GlobalId, or by geometric and attribute fingerprint?"
sides:
  - name: "Key on GlobalId"
    wins_when:
      - signal: "you can demonstrate id stability — export the same unchanged model twice and confirm the id sets are identical, before trusting any report built on them"
      - signal: "the two files come from the same tool and the same version, which is the case where preservation is most likely to hold"
      - signal: "the diff has to run on every upload, where a full pairwise comparison would not finish in the time available"
  - name: "Match on fingerprint"
    wins_when:
      - signal: "the id sets from two exports of an unchanged model already disagree — at that point ids are not identity for this pipeline, whatever the schema says"
      - signal: "the models come from different tools or a round trip through a third format, where nothing carried identity through"
      - signal: "a wrong pairing is cheaper than a missed one, because a human reviews the result before anything acts on it"
```

Whichever key you choose, the comparison itself should carry its own noise floor:

```typescript
type Vec3 = [number, number, number];

type ElementSnapshot = {
  globalId: string;
  ifcType: string;
  worldOrigin: Vec3;
  /** Flattened `${pset}.${name}` -> value, already resolved through the type. */
  properties: Record<string, string>;
};

export type Change = { globalId: string; axis: 'type' | 'placement' | 'property'; detail: string };

/** `precision` is the model's own declared tolerance, in the model's own
 *  length unit — never a constant, for the reason lesson 437 gives. */
function moved(a: Vec3, b: Vec3, precision: number): boolean {
  return a.some((value, i) => Math.abs(value - b[i]) > precision);
}

/** "2.5" and "2.50" are the same value written twice. Comparing the strings
 *  reports a change on every element the exporter reformatted. */
function sameValue(a: string, b: string): boolean {
  if (a === b) return true;
  const [x, y] = [Number(a), Number(b)];
  return Number.isFinite(x) && Number.isFinite(y) && x === y;
}

export function compare(before: ElementSnapshot, after: ElementSnapshot, precision: number): Change[] {
  const changes: Change[] = [];
  if (before.ifcType !== after.ifcType) {
    changes.push({ globalId: after.globalId, axis: 'type', detail: `${before.ifcType} -> ${after.ifcType}` });
  }
  if (moved(before.worldOrigin, after.worldOrigin, precision)) {
    changes.push({ globalId: after.globalId, axis: 'placement', detail: 'moved beyond model precision' });
  }
  for (const key of new Set([...Object.keys(before.properties), ...Object.keys(after.properties)])) {
    const [old, now] = [before.properties[key], after.properties[key]];
    if (old !== undefined && now !== undefined && sameValue(old, now)) continue;
    if (old === now) continue;
    changes.push({ globalId: after.globalId, axis: 'property', detail: `${key}: ${old ?? '(absent)'} -> ${now ?? '(absent)'}` });
  }
  return changes;
}
```

## When to Use
- You are reviewing a model revision and need the change list a human will actually read
- You are building an approval or issue workflow where "what changed since last time" is the trigger
- You are tracking whether a coordination request was actually carried out in the next export
- You are auditing a handover, where the useful question is which elements gained or lost the data the contract required

## Common Mistakes
- **Diffing the text** — instance numbering, ordering and float formatting all move on re-export, so a line diff reports the whole file
- **Trusting id stability without testing it** — export the same unchanged model twice and compare the id sets; that five-minute check is what tells you which strategy is even available
- **Comparing `IfcOwnerHistory` timestamps** — they move on every export regardless of content, so including them marks every element as changed
- **Comparing property values as strings** — `2.5` and `2.50` are the same value, and an exporter reformatting numbers produces a change on every element
- **Using a fixed tolerance for placement** — the model declares its own precision, in its own unit, and a constant is wrong by a factor of a thousand between a metre model and a millimetre one
- **Reporting every axis at full sensitivity** — a change list too long to read is the same outcome as no change list, so the sensitivity per axis is a decision to make and record

## Further Reading
- [IfcRoot](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRoot.htm) — the GlobalId and the ownership history attribute, both relevant to what a diff may key on
- [IfcOwnerHistory](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcOwnerHistory.htm) — what it records, and why it is not a change signal
- [IfcOpenShell](https://github.com/IfcOpenShell/IfcOpenShell) — a toolkit with the model-level primitives a hand-rolled diff ends up rebuilding
- [IfcGeometricRepresentationContext](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcGeometricRepresentationContext.htm) — where the precision a placement comparison should use is declared

```recall
- q: "Give three reasons a text diff of two .ifc exports is not a model diff."
  must:
    - "instance numbers are positions in one file and are renumbered on re-export"
    - "exporters reorder instances and reformat floats"
    - "the header is rewritten on every run"

- q: "Compare the two joining strategies and name the test that decides between them."
  must:
    - "key on GlobalId — cheap, and dependent on the exporter preserving ids"
    - "fingerprint matching on type, placement and geometry — survives id churn, costs more, can pair the wrong elements"
    - "export the same unchanged model twice and compare the id sets"

- q: "Name two noise sources that make an unfiltered diff report unchanged elements as changed."
  must:
    - "IfcOwnerHistory timestamps move on every export"
    - "numeric property values get reformatted, so 2.5 and 2.50 compare as different strings"
    - "placement differences below the model's declared precision are not movement"
```
