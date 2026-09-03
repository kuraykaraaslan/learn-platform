# 437. Units, Precision, and the Local Placement Chain

## What It Is
A coordinate in an IFC file is three bare numbers. Nothing beside them says what unit they are in or what they are measured from, and both answers live somewhere else in the file.

The unit comes from the project. `IfcProject.UnitsInContext` holds an `IfcUnitAssignment`, and inside it an `IfcSIUnit` declares the length unit — very often the millimetre, written as the metre with a `.MILLI.` prefix. So `3000.` in a coordinate is three metres, and a reader that assumes metres is out by a factor of a thousand. Imperial projects use `IfcConversionBasedUnit` instead, which names a conversion factor back to SI rather than a prefix.

The origin comes from a chain. An element's `ObjectPlacement` is an `IfcLocalPlacement`, whose `RelativePlacement` is a position and orientation *inside its parent*, and whose `PlacementRelTo` points at the parent's placement. Follow that link upward and you get storey inside building inside site, each contributing a translation and a rotation. The world coordinate of anything is the product of that whole chain. Read a raw `IfcCartesianPoint` as a world coordinate and the element lands wherever the chain would have moved it, which in a real model is tens of metres and a floor or two away.

The third number people skip is precision. `IfcGeometricRepresentationContext.Precision` is the model's own tolerance — the distance below which two points are meant to be treated as the same point. It is expressed in the project's length unit like everything else, so it moves with the unit, and any comparison you write against model geometry should use it rather than a constant you picked.

```quiz
- q: "A wall's IfcCartesianPoint reads (3000., 500., 0.). What have you learned about where the wall is?"
  anchor: "The world coordinate of anything is the product of that whole chain"
  options:
    - text: "It is 3000 units east and 500 units north of the project origin"
      correct: false
      why: "Those numbers are relative to the wall's own placement, and the placement chain above it has not been applied."
    - text: "Almost nothing until you follow the placement chain and read the unit"
      correct: true
      why: "The numbers are local, and their unit is declared once on the project. Both have to be resolved before the point means anything."
    - text: "That the project's length unit is the millimetre, since the values are large"
      correct: false
      why: "Large values are a hint and not a fact. The unit is declared explicitly in IfcUnitAssignment."

- q: "Why should a geometric comparison use the model's own Precision rather than a fixed epsilon?"
  anchor: "the distance below which two points are meant to be treated as the same point"
  options:
    - text: "Because floating-point error varies by machine"
      correct: false
      why: "It does, but that is not what Precision records. Precision is the model's declared tolerance, not a numerical-stability constant."
    - text: "Because it is the model's declared tolerance, in the model's own length unit"
      correct: true
      why: "A constant that is right for a metre-based model is a thousand times wrong for a millimetre-based one."
    - text: "Because IFC forbids hard-coded tolerances"
      correct: false
      why: "The schema forbids nothing of the sort. This is an engineering argument, not a schema rule."
```

## Key Concepts
- **`IfcUnitAssignment`**: reached from `IfcProject.UnitsInContext`; declares the units every bare number in the file is expressed in
- **`IfcSIUnit` with a prefix**: `.MILLI.` plus `.METRE.` is the common length unit, which is why coordinates are usually in the thousands
- **`IfcConversionBasedUnit`**: the imperial path — a named unit plus its conversion factor back to SI
- **`IfcLocalPlacement`**: an element's placement, holding a `RelativePlacement` and a `PlacementRelTo` link to its parent's placement
- **`IfcAxis2Placement3D`**: the position and orientation itself — a location, an axis (Z) and a reference direction (X), with unset meaning the defaults
- **Placement chain**: multiply the chain from the element up to the project context to get a world coordinate
- **`IfcGeometricRepresentationContext.Precision`**: the model's own tolerance, in the model's own length unit
- **Storey `Elevation` is relative too**: it is measured from the building, which is itself placed on the site

## Example Code
The chain, composed for real. Watch the wall's origin move as each link is applied:

```typescript run
// One IfcLocalPlacement link: where this object sits inside its parent, plus
// the rotation of its own X axis. RefDirection is a direction in IFC; a plain
// angle about Z is the case that covers a building model.
type Placement = { of: string; x: number; y: number; z: number; rotationDeg: number };

// The chain as it is written in the file: each entry's PlacementRelTo is the
// entry above it. Coordinates are in the project's length unit, and
// IfcUnitAssignment says that unit is the millimetre here.
const CHAIN: Placement[] = [
  { of: 'IfcSite',           x:     0, y:    0, z:    0, rotationDeg:  0 },
  { of: 'IfcBuilding',       x: 12000, y: 4000, z:    0, rotationDeg: 30 },
  { of: 'IfcBuildingStorey', x:     0, y:    0, z: 7200, rotationDeg:  0 },
  { of: 'IfcWall',           x:  3000, y:  500, z:    0, rotationDeg: 90 },
];

/** Rows of a 3x4 affine transform: rotation about Z, then translation. */
type Matrix = number[];

function toMatrix(p: Placement): Matrix {
  const a = (p.rotationDeg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, -s, 0, p.x, s, c, 0, p.y, 0, 0, 1, p.z];
}

function multiply(m: Matrix, n: Matrix): Matrix {
  const out: Matrix = new Array(12).fill(0);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      let sum = col === 3 ? m[row * 4 + 3] : 0;
      for (let k = 0; k < 3; k++) sum += m[row * 4 + k] * n[k * 4 + col];
      out[row * 4 + col] = sum;
    }
  }
  return out;
}

function apply(m: Matrix, p: number[]): number[] {
  return [
    m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3],
    m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7],
    m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11],
  ];
}

const MILLIMETRE_TO_METRE = 0.001;
const round = (v: number) => Math.round(v * 100) / 100;

let world: Matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
for (const link of CHAIN) {
  world = multiply(world, toMatrix(link));
  const origin = apply(world, [0, 0, 0]).map(round);
  console.log(`${link.of.padEnd(18)} origin in world coordinates: (${origin.join(', ')}) mm`);
}

// A point two metres along the wall's own X axis — the kind of number that
// sits in an IfcCartesianPoint inside the wall's representation.
const world2m = apply(world, [2000, 0, 0]);
console.log('');
console.log('Local  (2000, 0, 0) mm inside the wall');
console.log(`World  (${world2m.map(round).join(', ')}) mm`);
console.log(`World  (${world2m.map((v) => round(v * MILLIMETRE_TO_METRE)).join(', ')}) m`);
console.log('Skip the chain and the wall lands twelve metres and a storey away from where it is.');
```

## When to Use
- You are computing anything positional from a model — distances, bounding boxes, clash candidates, a map pin
- You are exporting model coordinates to another system, where getting the unit wrong is a factor-of-a-thousand error that looks plausible on a chart
- You are comparing geometry between two models and need a tolerance that means something in that model
- You are debugging an element that renders correctly in a viewer but lands in the wrong place in your own code — almost always an unapplied placement chain

## Common Mistakes
- **Assuming metres** — the common length unit is the millimetre declared as `.MILLI.` plus `.METRE.`, and a metre assumption is out by a factor of a thousand in a direction that still looks like a plausible building
- **Reading an `IfcCartesianPoint` as a world coordinate** — every coordinate in a representation is local to its element's placement, and the chain above it has not been applied
- **Stopping the chain at the storey** — `PlacementRelTo` continues to the building and the site, and each link contributes both a translation and a rotation
- **Composing translations and ignoring rotations** — a building rotated on its site moves every element in it along an arc, not a straight offset
- **Hard-coding a tolerance** — `Precision` is declared per model, in that model's own unit, and a constant right for one model is wrong for the next by the same factor of a thousand
- **Reading `IfcBuildingStorey.Elevation` as height above ground** — it is relative to the building, which is placed on the site, which may itself sit at a non-zero height

## Further Reading
- [IfcLocalPlacement](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcLocalPlacement.htm) — `PlacementRelTo` and how the chain is meant to be walked
- [IfcAxis2Placement3D](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcAxis2Placement3D.htm) — location, axis and reference direction, and what an unset value defaults to
- [IfcSIUnit](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcSIUnit.htm) — prefixes, and the enumeration a length unit is drawn from
- [IfcGeometricRepresentationContext](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcGeometricRepresentationContext.htm) — where `Precision` is declared

```recall
- q: "Two facts are missing from a bare IFC coordinate. Name both and say where each is declared."
  must:
    - "the unit, declared once on the project through IfcUnitAssignment"
    - "the origin, which comes from the IfcLocalPlacement chain above the element"
    - "the world coordinate is the product of the whole chain"

- q: "Why is the millimetre assumption worth checking explicitly rather than inferring from magnitudes?"
  must:
    - "the unit is stated in IfcUnitAssignment, usually as .MILLI. plus .METRE."
    - "guessing wrong is a factor-of-a-thousand error"
    - "imperial models use IfcConversionBasedUnit with a factor instead of a prefix"

- q: "What is Precision, and why should a comparison use it?"
  must:
    - "the model's declared tolerance, on IfcGeometricRepresentationContext"
    - "the distance below which two points count as the same point"
    - "it is in the model's own length unit, so a hard-coded epsilon is wrong by the same factor of a thousand"
```
