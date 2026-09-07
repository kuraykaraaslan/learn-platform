# 556. Federating Models: Many Files, One Coordinate System

## What It Is
A **federated model** is several discipline models loaded together so they can be looked at, queried and checked as one thing. The word that does the work is *together*: federation is **a view, not a merge**. Each file keeps its own author, its own identifier space and its own life cycle, and nothing is written back into the combination. The moment somebody edits the federated result, the next export from any discipline destroys the edit, which is why the federated model is never a deliverable and the discipline models always are.

What has to agree for the view to mean anything is a short list, and it is entirely about numbers. **Units** must be resolved per file, because IFC states them in the file rather than assuming them, and a model in millimetres loaded beside one in metres is off by a factor of a thousand without a single error (Lesson 437). **The coordinate chain** must be resolved per file too: an element's local placement sits inside a chain of placements up to the project origin, and the project origin sits somewhere in the world through a map conversion (Lesson 438). Two files agree only when both chains are followed all the way out to shared coordinates.

The failures are geometric and they are large. A model authored around its own internal origin, loaded beside one authored in survey coordinates, lands hundreds of kilometres away — the classic symptom is a federation where one discipline is invisible because it is outside the view. A rotation mismatch is worse because it is not obviously wrong: the model appears in roughly the right place, and every clash result is nonsense. **A federation that looks plausible has not been verified**; the check is arithmetic on known points, not a visual impression.

The practical procedure is to pick shared points that exist in more than one model — a grid intersection, a survey marker, a column centre — and confirm they land at the same shared coordinate from each file. Two points establish position and rotation together, which is why one is never enough. This is the same reconciliation Lesson 484 performs between a model and a GIS coordinate system, done between two models instead, and it is worth doing once per project rather than once per coordination round.

```quiz
- q: "What is a federated model?"
  anchor: "federation is **a view, not a merge**"
  options:
    - text: "A single merged file produced from the discipline models"
      correct: false
      why: "Merging would create a fourth artefact that goes stale the moment any discipline re-exports."
    - text: "Several discipline models loaded together as a view, each keeping its own author and identifier space"
      correct: true
      why: "It is why the federated model is never a deliverable and the discipline models always are."
    - text: "The model held by the coordinator, into which other disciplines submit changes"
      correct: false
      why: "Nothing is written back into a federation; edits there are destroyed by the next export."

- q: "Two models are federated and one discipline is nowhere to be seen. What is the first thing to check?"
  anchor: "lands hundreds of kilometres away"
  options:
    - text: "Whether the file failed to load"
      correct: false
      why: "Worth ruling out, but a loaded model placed at survey coordinates is simply outside the view."
    - text: "Whether one model is authored at an internal origin and the other in survey coordinates"
      correct: true
      why: "The mismatch puts one file hundreds of kilometres from the other, with no error anywhere."
    - text: "Whether the elements were filtered out by a visibility setting"
      correct: false
      why: "Possible, but the coordinate chain is the failure that produces exactly this symptom."

- q: "Why are two shared reference points needed rather than one?"
  anchor: "Two points establish position and rotation together"
  options:
    - text: "For redundancy, in case one point was surveyed incorrectly"
      correct: false
      why: "Redundancy is a bonus; the reason is geometric."
    - text: "Because one point fixes position only — a second is what pins down rotation"
      correct: true
      why: "A rotation mismatch leaves the model roughly in place and makes every clash result nonsense."
    - text: "Because IFC requires two points in an IfcMapConversion"
      correct: false
      why: "The map conversion carries a rotation directly; the two-point check is how you verify it."
```

## Key Concepts
- **Federation is a view, not a merge** — each file keeps its author, identifiers and life cycle
- **The federated model is never a deliverable**; the discipline models are (edits to it die at the next export)
- **Units are per file** and stated in the file — millimetres beside metres is a factor of a thousand, silently (Lesson 437)
- **The coordinate chain is per file too** — local placement up to project origin, then a map conversion (Lesson 438)
- **Two files agree only when both chains are followed out to shared coordinates**
- **Origin mismatch is obvious** (one model is missing); **rotation mismatch is not** (it looks plausible and is wrong)
- **Verify with two shared points**, not with a visual impression — one fixes position, two fix rotation

## Example Code
Two models, two coordinate mappings, and the cost of getting the second one slightly wrong:

```typescript run
/** Local -> shared coordinates, as an IfcMapConversion does it: scale, rotate
 *  by a direction vector, then translate. Metres throughout. */
type MapConversion = { eastings: number; northings: number; xAxisAbscissa: number; xAxisOrdinate: number; scale: number };

function toShared(local: { x: number; y: number }, m: MapConversion): { x: number; y: number } {
  // The direction vector (abscissa, ordinate) IS the rotation; normalise it.
  const len = Math.hypot(m.xAxisAbscissa, m.xAxisOrdinate);
  const cos = m.xAxisAbscissa / len;
  const sin = m.xAxisOrdinate / len;
  return {
    x: m.eastings + m.scale * (local.x * cos - local.y * sin),
    y: m.northings + m.scale * (local.x * sin + local.y * cos),
  };
}

// The architectural model: authored in survey coordinates already.
const arch: MapConversion = { eastings: 428000, northings: 4370000, xAxisAbscissa: 1, xAxisOrdinate: 0, scale: 1 };
// The structural model: authored around its own origin, mapped in afterwards.
const struct: MapConversion = { eastings: 428000, northings: 4370000, xAxisAbscissa: 1, xAxisOrdinate: 0, scale: 1 };
// The same structural mapping, entered with a 2-degree rotation error.
const rad = (2 * Math.PI) / 180;
const structWrong: MapConversion = { ...struct, xAxisAbscissa: Math.cos(rad), xAxisOrdinate: Math.sin(rad) };

// Two shared points that exist in both models: grid intersections A1 and G8.
const points = [
  { name: 'A1', local: { x: 0, y: 0 } },
  { name: 'G8', local: { x: 90, y: 42 } },
];

console.log('shared point   from arch model        from struct model      offset (m)');
for (const p of points) {
  const a = toShared(p.local, arch);
  const b = toShared(p.local, struct);
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  console.log(`  ${p.name.padEnd(11)}  ${a.x.toFixed(2)}, ${a.y.toFixed(2)}   ${b.x.toFixed(2)}, ${b.y.toFixed(2)}   ${d.toFixed(3)}`);
}

console.log('');
console.log('now the same check with a 2-degree error in the structural mapping:');
for (const p of points) {
  const a = toShared(p.local, arch);
  const b = toShared(p.local, structWrong);
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  console.log(`  ${p.name.padEnd(11)}  offset ${d.toFixed(3)} m`);
}

console.log('');
console.log('The origin point is unmoved -- a one-point check passes -- and the far corner');
console.log('is out by metres. That is the shape of a rotation error: it hides at the point');
console.log('everybody checks and grows with distance from it. Every clash result computed');
console.log('in that federation is about a building that does not exist (Lesson 557).');
```

## When to Use
- Once per project, when the federation is first assembled, and again whenever a discipline changes its coordinate setup
- Before any clash run, since a coordinate error turns every result into noise that still looks like findings
- When a discipline model is invisible in the federation — check the chain before checking the file
- When agreeing an exchange requirement, where "georeferenced" has to become a checkable statement (Lesson 562)
- When the same models also have to reach a GIS, where the chain continues one step further out (Lesson 484)

## Common Mistakes
- **Editing the federated model** — the change is destroyed by the next discipline export and was never a deliverable
- **Checking with one shared point** — it fixes position and says nothing about rotation
- **Trusting a visual impression** — a model in roughly the right place can still be rotated, and the error grows with distance
- **Assuming units** — IFC states them per file, and a millimetre/metre mismatch produces no error at all (Lesson 437)
- **Resolving the chain partway** — a placement resolved to the project origin but not through the map conversion agrees with nothing
- **Federating first and coordinating immediately** — an unverified federation produces a clash report that costs a week of everyone's time

## Further Reading
- [buildingSMART IFC4.3 documentation — IfcMapConversion and IfcProjectedCRS](https://ifc43-docs.standards.buildingsmart.org/) — the entities that carry the map conversion, its rotation vector and its scale
- [Lesson 438](/courses/bim-ifc-data-models/georeferencing-a-model) — the single-model version of this chain, and what "georeferenced" has to mean to be checkable
- [Lesson 437](/courses/bim-ifc-data-models/units-precision-local-placement) — units per file and the placement chain each element hangs from
- [Lesson 484](/courses/digital-twin-engineering/georeferencing-bim-into-gis) — the same reconciliation carried one step further, into a geographic coordinate system

```recall
- q: "Why is a federated model a view rather than a merge?"
  must:
    - "each discipline file keeps its own author, identifier space and life cycle"
    - "nothing is written back into the combination -- an edit there dies at the next export"
    - "so the federation is never a deliverable and the discipline models always are"

- q: "What must agree between two files before a federation means anything?"
  must:
    - "units, which IFC states per file rather than assuming"
    - "the coordinate chain: local placement up to the project origin, then the map conversion out to shared coordinates"
    - "both chains have to be followed all the way, for both files"

- q: "How is a federation verified, and why is one reference point not enough?"
  must:
    - "pick points that exist in more than one model -- a grid intersection, a survey marker"
    - "confirm they land at the same shared coordinate from each file"
    - "one point fixes position only; a rotation error hides there and grows with distance, so two points are needed"
```
