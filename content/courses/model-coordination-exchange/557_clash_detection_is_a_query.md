# 557. Clash Detection Is a Query: Broad Phase, Narrow Phase, Tolerance

## What It Is
"Clash detection" sounds like a graphics problem and is mostly not one. Stripped of the tool that usually performs it, it is **a query over a set of elements with extents**, and it has the same three-part shape as any spatial query: reduce the candidate set cheaply, decide precisely on what survives, and apply a policy to the decision.

The cheap reduction is the **broad phase**. Every element has an axis-aligned bounding box, and two boxes can only intersect if their intervals overlap on all three axes — three comparisons per axis, no geometry. Everything that fails this test is discarded without ever being examined properly. It matters because the naive alternative is every pair: a thirty-element model has 435 pairs, a thirty-thousand-element model has around 450 million, and the growth is quadratic while the number of real interferences is not.

The precise decision is the **narrow phase**, and its cost is why the broad phase exists. For real building geometry it means intersecting the actual solids, which is the part this course does not write — no meshes, no triangles, no rendering (the branch's standing rule). What is worth understanding without writing it is the output: not a boolean but a **penetration depth**, the distance one element would have to move to stop touching the other. That number is what the third part consumes.

The third part is the **tolerance**, and it is not a technical parameter — **it is a policy about what counts as a problem**. A pipe passing 2 mm into a beam's bounding volume may be a modelling artefact, an acceptable clearance, or a real collision, and no property of the geometry decides which. Setting it to zero reports everything and buries the team; setting it high suppresses real interferences. The number matters less than the fact that it must be **stated with the report**, because two teams running the same models at different tolerances produce different findings and both are correct.

One more reduction is usually applied before any of this, and it is a modelling decision rather than a geometric one — and it assumes each element's identity is settled, which is Lesson 506's subject: **pairs within the same discipline are excluded**. A structural model's beams intersecting its own columns is how the model is built, not a coordination finding. What remains is the cross-discipline pairs — and deciding which discipline pairs are even interesting is the first step of making a report readable (Lesson 558).

```quiz
- q: "What does the broad phase of a clash query do?"
  anchor: "two boxes can only intersect if their intervals overlap on all three axes"
  options:
    - text: "It intersects the element solids at low resolution, then refines"
      correct: false
      why: "It touches no geometry at all — it compares intervals on three axes."
    - text: "It discards pairs whose bounding boxes cannot overlap, using three interval comparisons"
      correct: true
      why: "Everything it discards is never examined properly, which is why the quadratic pair count is survivable."
    - text: "It sorts elements by discipline so that the narrow phase can be parallelised"
      correct: false
      why: "Discipline filtering is a separate, earlier reduction and is a modelling decision."

- q: "What does the narrow phase produce, and why does it matter?"
  anchor: "not a boolean but a **penetration depth**"
  options:
    - text: "A boolean — the elements either intersect or they do not"
      correct: false
      why: "A boolean cannot be compared against a tolerance, which is the whole point of the third step."
    - text: "A penetration depth — how far one element would have to move to stop touching the other"
      correct: true
      why: "It is the number the tolerance policy is applied to."
    - text: "A list of intersecting triangles for the viewer to highlight"
      correct: false
      why: "That is a rendering concern, and this branch does not draw anything."

- q: "Two teams run the same models and report different clash counts. What is the most likely explanation?"
  anchor: "it is a policy about what counts as a problem"
  options:
    - text: "One of the runs is wrong and should be discarded"
      correct: false
      why: "Both can be correct: the tolerance is a policy, not a measurement."
    - text: "They used different tolerances, and neither report stated the value used"
      correct: true
      why: "A clash report without its tolerance is not reproducible."
    - text: "The models were exported at different times"
      correct: false
      why: "Possible, but it is the second thing to check; the tolerance is the first."
```

## Key Concepts
- **A clash run is a query**, not a rendering operation: reduce, decide, then apply a policy
- **Broad phase**: bounding-box interval overlap on three axes — cheap, geometry-free, discards most pairs
- **The pair count is quadratic** — 30 elements give 435 pairs; 30,000 give about 450 million
- **Narrow phase** intersects real solids and yields a **penetration depth**, not a boolean
- **Tolerance is a policy** about what counts as a problem, and it must be stated with the report
- **Same-discipline pairs are excluded first** — a model intersecting itself is how it was built
- **This lesson writes no geometry engine** — solids, meshes and rendering are outside the branch

## Example Code
The broad phase in full, because it really is this small:

```typescript run
/** Boxes are [xmin, ymin, zmin, xmax, ymax, zmax] in millimetres. The whole
 *  broad phase is one function; everything expensive happens after it. */
type Element = { id: string; discipline: string; box: number[] };

const overlap1d = (aMin: number, aMax: number, bMin: number, bMax: number): number =>
  Math.min(aMax, bMax) - Math.max(aMin, bMin);

const boxesOverlap = (a: number[], b: number[]): boolean =>
  overlap1d(a[0], a[3], b[0], b[3]) > 0 &&
  overlap1d(a[1], a[4], b[1], b[4]) > 0 &&
  overlap1d(a[2], a[5], b[2], b[5]) > 0;

/** For axis-aligned boxes the smallest of the three overlaps is how far one
 *  would have to move to separate them: a stand-in for the penetration depth a
 *  real narrow phase computes on solids. */
const penetration = (a: number[], b: number[]): number =>
  Math.min(
    overlap1d(a[0], a[3], b[0], b[3]),
    overlap1d(a[1], a[4], b[1], b[4]),
    overlap1d(a[2], a[5], b[2], b[5])
  );

const elements: Element[] = [
  { id: 'STR-beam-1', discipline: 'structure', box: [0, 0, 3000, 300, 12000, 3600] },
  { id: 'STR-beam-2', discipline: 'structure', box: [3000, 0, 3000, 3300, 12000, 3600] },
  { id: 'HVA-duct-1', discipline: 'hvac', box: [0, 1200, 2610, 33000, 1800, 3010] },
  { id: 'HVA-duct-2', discipline: 'hvac', box: [0, 3600, 2650, 33000, 4200, 3050] },
  { id: 'PLU-riser-1', discipline: 'plumbing', box: [3280, 900, 0, 3480, 1100, 6000] },
];

const TOLERANCE = 25; // mm -- a policy, stated here so the run is reproducible

let examined = 0;
const hits: string[] = [];
for (let i = 0; i < elements.length; i++) {
  for (let j = i + 1; j < elements.length; j++) {
    const a = elements[i];
    const b = elements[j];
    if (a.discipline === b.discipline) continue; // not a coordination question
    examined++;
    if (!boxesOverlap(a.box, b.box)) continue;
    const depth = penetration(a.box, b.box);
    hits.push(`${a.id} x ${b.id}  depth ${depth} mm  ${depth > TOLERANCE ? 'CLASH' : 'below tolerance'}`);
  }
}

const allPairs = (elements.length * (elements.length - 1)) / 2;
console.log(`${elements.length} elements -> ${allPairs} pairs, ${examined} of them cross-discipline`);
console.log(`tolerance ${TOLERANCE} mm`);
console.log('');
for (const h of hits) console.log('  ' + h);
console.log('');
console.log(`${hits.filter((h) => h.endsWith('CLASH')).length} reported, ${hits.filter((h) => !h.endsWith('CLASH')).length} suppressed by the tolerance.`);
console.log('Change the tolerance and the second number changes without the model changing.');
```

That last sentence is the claim worth checking at a size where counting by hand stops working. The run below builds a fixed thirty-element model with deliberately graded interference depths and reports three things: how many pairs a brute-force check would examine, how many survive the broad phase, and how the clash count moves as the tolerance moves. Before reading it, predict what fraction of pairs the bounding-box test removes.

```proof sha=012842b541819a42 at=2026-09-07 commit=6c45a71
$ node clash.js
model: 30 elements (12 structure, 10 hvac, 8 plumbing)

pairs a brute-force narrow-phase check would examine : 435
pairs left after dropping same-discipline pairs      : 296
pairs left after the axis-aligned broad phase        : 124
fraction of pairs the broad phase removed            : 71.5%

clash count as the tolerance moves (penetration must exceed the tolerance):
  tolerance   clashes   by discipline pair
       0 mm       124   hvac x plumbing=6, hvac x structure=110, plumbing x structure=8
       5 mm       101   hvac x plumbing=6, hvac x structure=88, plumbing x structure=7
      10 mm        89   hvac x plumbing=6, hvac x structure=77, plumbing x structure=6
      25 mm        66   hvac x plumbing=6, hvac x structure=55, plumbing x structure=5
      50 mm        42   hvac x plumbing=6, hvac x structure=33, plumbing x structure=3
     100 mm        29   hvac x plumbing=5, hvac x structure=22, plumbing x structure=2
     250 mm         0   -

Moving the tolerance from 0 mm to 50 mm takes the count from 124 to 42.
Nothing about the model changed. The tolerance is a policy about what counts
as a problem, and a report that does not state it is not reproducible -- two
teams running the same model will disagree and both will be right.
```

The pair reduction is the reason the broad phase exists, and the tolerance column is the reason a clash count is meaningless on its own. Note also the last row: at a large enough tolerance the report is empty, and nothing about the model has changed.

## When to Use
- Whenever a coordination process needs to be understood rather than operated — the tool is a wrapper around these three steps
- When a clash run takes too long, where the broad phase and the discipline filter are the two levers
- When agreeing what a clash report means with another team, where the tolerance must be part of the agreement
- When results look wrong in bulk, since a coordinate error upstream produces confident nonsense (Lesson 556)
- When deciding which discipline pairs to run at all, which is where a readable report starts (Lesson 558)

## Common Mistakes
- **Reporting a clash count without the tolerance** — the number is not reproducible and cannot be compared to last week's
- **Running every pair** — the quadratic count is what makes a naive run intractable on a real model
- **Including same-discipline pairs** — a structural model intersects itself by design, and the noise buries everything else
- **Treating the tolerance as a technical constant** — it is a decision about acceptable conditions, and it belongs to the project
- **Believing a clash list from an unverified federation** — every result is correct arithmetic about the wrong geometry (Lesson 556)
- **Confusing a clash with a problem** — a pair is a candidate; whether it is a problem is decided by grouping and ownership (Lesson 558)

## Further Reading
- [buildingSMART IFC4.3 documentation — spatial containment and element extents](https://ifc43-docs.standards.buildingsmart.org/) — where an element's placement and geometry come from before any query touches them
- [Lesson 435](/courses/bim-ifc-data-models/containment-aggregation-voiding) — containment, aggregation and voiding: the relationships that decide which "intersections" are intentional
- [Lesson 556](/courses/model-coordination-exchange/federating-models) — why an unverified coordinate chain makes every clash result confident and wrong
- [Lesson 558](/courses/model-coordination-exchange/the-clash-report-nobody-reads) — turning a list of pairs into something a discipline can act on

```recall
- q: "Describe the three parts of a clash query."
  must:
    - "broad phase: bounding-box interval overlap on three axes, discarding most pairs with no geometry"
    - "narrow phase: intersect the real solids and produce a penetration depth"
    - "tolerance: a policy comparing that depth against what the project counts as a problem"

- q: "Why does the broad phase exist?"
  must:
    - "the pair count is quadratic -- 30 elements give 435 pairs, 30,000 give about 450 million"
    - "the narrow phase is expensive per pair"
    - "so pairs that cannot possibly intersect are removed by three cheap interval comparisons"

- q: "Why must a clash report state its tolerance?"
  must:
    - "the tolerance decides what counts as a problem and is a policy, not a measurement"
    - "the same models at different tolerances produce different counts, and both are correct"
    - "without it the report cannot be reproduced or compared with a previous run"
```
