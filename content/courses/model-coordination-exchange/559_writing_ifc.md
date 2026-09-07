# 559. Writing IFC: A File Someone Else's Tool Will Accept

## What It Is
Reading IFC is forgiving, because a reader takes what it needs and ignores the rest. Writing it is not, and the asymmetry catches people out: a file that loads perfectly in the viewer you tested with can be rejected, silently truncated, or misinterpreted by the next tool it reaches. **"It opens in my viewer" is not validation** — viewers are deliberately permissive, and their tolerance is a feature for their users and a trap for producers.

What a serious consumer checks is a short, mechanical list, and it is worth writing your own checks against it rather than discovering the answers downstream. **Every rooted entity needs a GlobalId, and they must be unique within the file** — duplicates are the single most common defect, produced by generating ids per element type or by copying a template. **Every physical element must be contained somewhere in the spatial hierarchy**: project, site, building, storey, and the containment relationship that puts an element on a storey (Lessons 434 and 435). An element in no storey is not a modelling style; it is an element that disappears from every schedule, quantity take-off and space-based query downstream.

**Units must be declared**, because IFC states them in the file rather than assuming them, and a file whose unit assignment is missing or wrong is not detectably wrong — it is just off by a factor (Lesson 437). **Property sets must be attached the way the schema expects**, through the relationship that binds a set to an object rather than as free-floating entities, or they exist in the file and are invisible to every consumer (Lesson 436). And the **header and schema version** must say what the file actually is, since the consumer selects its parser from them.

The identifier deserves its own paragraph because it is where writing bites hardest. A GlobalId is a compressed 128-bit UUID (Lesson 433), and generating one is easy. Generating the *same* one for the same element on the next export is the hard part, and it is the property everything downstream depends on: issue anchoring (Lesson 555), re-run matching (Lesson 558) and version comparison (Lesson 440) all break without it. **A writer that generates fresh ids every run produces valid files and an unusable process.**

The pragmatic advice is to use a library for the serialisation and to keep your own validation independent of it. A library gets the syntax right; it cannot know whether your storey assignment is the one your project meant. The five checks below run against the model in memory, before anything is written, which is the cheapest place to find every one of these defects.

```quiz
- q: "Why is loading a file in a viewer not validation?"
  anchor: "viewers are deliberately permissive"
  options:
    - text: "Viewers only read geometry, so they cannot check data at all"
      correct: false
      why: "Many read properties too. The issue is that they tolerate what other consumers reject."
    - text: "They are built to show something rather than to reject files, so they ignore defects a consumer will not"
      correct: true
      why: "Their tolerance is a feature for their users and a trap for producers."
    - text: "Viewers use a different schema version from the one you exported"
      correct: false
      why: "That is one possible defect among many, not the reason the test is weak."

- q: "An element is not contained in any storey. What is the consequence?"
  anchor: "it is an element that disappears"
  options:
    - text: "It renders at the project origin instead of its intended location"
      correct: false
      why: "Placement and containment are separate; the element can be positioned correctly and still be uncontained."
    - text: "It vanishes from schedules, quantity take-offs and every space-based query downstream"
      correct: true
      why: "Containment is how consumers reach elements, not just how they are organised."
    - text: "The file fails to parse"
      correct: false
      why: "It parses fine, which is exactly why the defect survives to the consumer."

- q: "A writer generates fresh GlobalIds on every export. What has it broken?"
  anchor: "produces valid files and an unusable process"
  options:
    - text: "Nothing — ids only need to be unique within one file"
      correct: false
      why: "Uniqueness is the schema's requirement; stability is the process's."
    - text: "Issue anchoring, re-run matching and version comparison — everything that identifies an element across time"
      correct: true
      why: "The files are valid and the coordination process silently stops working."
    - text: "The spatial hierarchy, since containment relationships reference ids"
      correct: false
      why: "Within a single file the references are internally consistent; the loss is across files."
```

## Key Concepts
- **Reading is forgiving, writing is not** — a permissive viewer is not a test of a produced file
- **Unique GlobalIds on every rooted entity** — duplicates are the most common defect
- **Every physical element contained in the spatial hierarchy** — uncontained elements vanish downstream (Lessons 434, 435)
- **Units declared in the file** — a missing or wrong unit assignment is silently off by a factor (Lesson 437)
- **Property sets attached through the schema's relationship**, not left free-floating (Lesson 436)
- **Header and schema version must describe the file** — the consumer picks its parser from them
- **Id stability across exports is a process requirement**, not a schema one (Lessons 555, 558, 440)
- **Use a library for serialisation, keep validation independent** — syntax is not intent

## Example Code
The five checks, run against a model in memory before anything is serialised:

```typescript run
/** A minimal in-memory model, deliberately containing one instance of each
 *  defect a downstream consumer will find. */
type Entity = {
  ref: string;
  type: string;
  globalId: string | null;
  containedIn?: string | null;
  propertySets?: string[];
};

const model = {
  schema: 'IFC4',
  unitsDeclared: false, // defect: no unit assignment
  entities: [
    { ref: '#1', type: 'IfcProject', globalId: '0YvhpZ8gL4nQ2sTfR6uWbX' },
    { ref: '#2', type: 'IfcSite', globalId: '1BqK3mE7dR9tXpL0vN5sHc', containedIn: '#1' },
    { ref: '#3', type: 'IfcBuilding', globalId: '2cW8nA1sZ4qtYr6uH3gVfK', containedIn: '#2' },
    { ref: '#4', type: 'IfcBuildingStorey', globalId: '3Xt7zPfNb2vgQK1p9wE4mR', containedIn: '#3' },
    { ref: '#5', type: 'IfcBeam', globalId: '4hJ2kL9mN0pQ3rS5tU7vWy', containedIn: '#4', propertySets: ['Pset_BeamCommon'] },
    { ref: '#6', type: 'IfcDuctSegment', globalId: '4hJ2kL9mN0pQ3rS5tU7vWy', containedIn: '#4' }, // defect: duplicate id
    { ref: '#7', type: 'IfcWall', globalId: '5aB6cD7eF8gH9iJ0kL1mN2', containedIn: null }, // defect: uncontained
    { ref: '#8', type: 'IfcPipeSegment', globalId: null, containedIn: '#4' }, // defect: missing id
  ] as Entity[],
  freeFloatingPropertySets: ['Pset_ProjectSpecific'], // defect: attached to nothing
};

const PHYSICAL = new Set(['IfcBeam', 'IfcWall', 'IfcDuctSegment', 'IfcPipeSegment']);
const findings: string[] = [];

// 1. every rooted entity carries a GlobalId
for (const e of model.entities) {
  if (e.globalId === null) findings.push(`${e.ref} ${e.type}: no GlobalId`);
}

// 2. GlobalIds are unique within the file
const seen = new Map<string, string>();
for (const e of model.entities) {
  if (e.globalId === null) continue;
  const first = seen.get(e.globalId);
  if (first) findings.push(`${e.ref} ${e.type}: GlobalId duplicates ${first}`);
  else seen.set(e.globalId, e.ref);
}

// 3. every physical element is contained in the spatial hierarchy
for (const e of model.entities) {
  if (PHYSICAL.has(e.type) && !e.containedIn) findings.push(`${e.ref} ${e.type}: not contained in any spatial element`);
}

// 4. units are declared
if (!model.unitsDeclared) findings.push('project: no unit assignment declared');

// 5. no property set exists without an object to attach to
for (const ps of model.freeFloatingPropertySets) findings.push(`${ps}: property set attached to nothing`);

console.log(`schema ${model.schema}, ${model.entities.length} entities`);
console.log('');
if (findings.length === 0) console.log('no findings');
else for (const f of findings) console.log('  ' + f);
console.log('');
console.log(`${findings.length} findings, all of them in a file that would serialise and open.`);
console.log('Every one is cheaper to find here, against the model in memory, than in the');
console.log('email three weeks later explaining that half the pipework is missing from the');
console.log('quantity take-off.');
```

## When to Use
- Before the first file leaves your system, where the cost of a defect is a rewrite rather than a project process
- On every export in CI, since the checks are mechanical and the failures are silent
- When a consumer reports missing elements, where containment is the first hypothesis
- When quantities disagree between your file and theirs, where units and property-set attachment are the usual causes
- When any process depends on tracking an element across versions, which requires id stability rather than id validity

## Common Mistakes
- **Testing with a single permissive viewer** — it is the tool least likely to reject the defect you shipped
- **Generating GlobalIds per export** — the file is valid and every downstream process that spans versions breaks
- **Generating ids per element type** — the collision is inside one file and is the most common defect there is
- **Leaving elements uncontained** — they parse, they render, and they are absent from every schedule
- **Writing property sets as free-standing entities** — present in the file, invisible to every consumer (Lesson 436)
- **Trusting the library to validate intent** — it gets the syntax right and knows nothing about your storey assignment

## Further Reading
- [buildingSMART IFC4.3 documentation](https://ifc43-docs.standards.buildingsmart.org/) — the entity definitions, required attributes and the relationships a consumer expects to find
- [IfcOpenShell documentation](https://docs.ifcopenshell.org/) — an open toolkit for reading and writing the format, and a reference for what serialisation involves
- [Lesson 433](/courses/bim-ifc-data-models/globalid-the-ifc-guid) — the identifier, its encoding, and why stability matters more than validity
- [Lesson 434](/courses/bim-ifc-data-models/the-spatial-hierarchy) — the hierarchy every physical element must hang from
- [Lesson 436](/courses/bim-ifc-data-models/property-sets-and-quantity-sets) — how a property set has to be attached to be visible

```recall
- q: "Why is opening a file in a viewer a weak test of a written IFC?"
  must:
    - "viewers are deliberately permissive -- built to show something rather than to reject files"
    - "they ignore defects that a serious consumer will not"
    - "so the failure appears downstream, in another tool, with no error attached to your export"

- q: "List the mechanical checks a written IFC should pass before it ships."
  must:
    - "every rooted entity has a GlobalId, and the ids are unique within the file"
    - "every physical element is contained in the spatial hierarchy"
    - "units are declared, property sets are attached through the schema's relationship, and the header states the schema version"

- q: "What is the difference between a valid GlobalId and a usable one?"
  must:
    - "valid means unique within the file, which the schema requires"
    - "usable means the same element gets the same id on the next export"
    - "issue anchoring, clash re-run matching and version comparison all depend on stability, not validity"
```
