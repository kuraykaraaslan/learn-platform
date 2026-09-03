# 435. Containment, Aggregation, Voiding: The Relationship That Puts an Element Somewhere

## What It Is
Lesson 434 showed the tree. This one is about the edges, because IFC has several ways of attaching one thing to another and they are not interchangeable. Choosing the wrong one produces a file that parses, opens, and is wrong in a way no validator reports.

`IfcRelContainedInSpatialStructure` is **spatial containment**: it places a physical element into exactly one spatial structure element, normally a storey. This is the relationship a viewer's model tree reads and the one a per-storey quantity take-off groups by. One element, one container — the "exactly one" is a schema rule, not a convention.

`IfcRelAggregates` is decomposition: a whole and its parts. It builds the spatial chain (a building aggregates its storeys) and it also decomposes elements (a curtain wall aggregates its panels and mullions). The rule that follows from it catches people out: an element that is a *part* of an aggregate is placed through its whole, so it must not also be contained in the storey directly. Do both and it appears twice in the tree and twice in the take-off.

Then there are the element-to-element relationships, which place nothing spatially at all. `IfcRelVoidsElement` says an opening subtracts from a wall. `IfcRelFillsElement` says a window occupies that opening. Neither of them puts the window on a floor — the window is still contained in the storey by its own containment relationship, exactly like the wall. `IfcRelNests` is for ordered sub-parts, and `IfcRelAssignsToGroup` gathers elements into a group or system without touching the spatial tree either.

```quiz
- q: "A curtain wall is aggregated from panels, and the panels are also contained in the storey. What happens?"
  anchor: "an element that is a *part* of an aggregate is placed through its whole, so it must not also be contained in the storey directly"
  options:
    - text: "Nothing — the two relationships describe different things and coexist"
      correct: false
      why: "They do describe different things, which is why doing both double-counts: the part reaches the storey twice, once through its whole and once directly."
    - text: "The panels appear twice in the model tree and twice in the take-off"
      correct: true
      why: "A part is placed through its whole; adding direct containment adds a second path to the same storey."
    - text: "The aggregate relationship wins and the containment is ignored"
      correct: false
      why: "Nothing arbitrates between them. Both are written, and both are read."

- q: "A window fills an opening that voids a wall. Which relationship puts the window on the ground floor?"
  anchor: "the window is still contained in the storey by its own containment relationship"
  options:
    - text: "IfcRelFillsElement, transitively through the wall"
      correct: false
      why: "Filling and voiding are element-to-element. Neither carries a spatial position, and neither is transitive into the spatial tree."
    - text: "Its own IfcRelContainedInSpatialStructure, exactly like the wall's"
      correct: true
      why: "The window is contained in the storey in its own right; voiding and filling only describe the hole."
    - text: "IfcRelVoidsElement, since the opening is what physically locates it"
      correct: false
      why: "Voiding subtracts geometry from the wall. It says nothing about which storey anything is on."
```

## Key Concepts
- **`IfcRelContainedInSpatialStructure`**: spatial containment — one physical element into exactly one spatial structure element
- **`IfcRelAggregates`**: whole-and-parts decomposition, used both for the spatial chain and for composite elements
- **Placed through the whole**: an aggregated part inherits its place from its aggregate and must not also be contained directly
- **`IfcRelVoidsElement`**: an opening subtracts from a building element; element-to-element, no spatial meaning
- **`IfcRelFillsElement`**: a window or door occupies an opening; also element-to-element
- **`IfcRelNests`**: ordered sub-parts, for things whose sequence carries meaning
- **`IfcRelAssignsToGroup`**: membership of a group or system, orthogonal to the spatial tree — an element can be in a system and in a storey at once
- **Attribute order is not uniform**: `IfcRelContainedInSpatialStructure` lists `RelatedElements` before `RelatingStructure`, the reverse of most relations

## Example Code
The spec's own failure case, and the reason this widget exists. Work out where the wall should hang before revealing:

```spatial
title: "A wall that fell out of the storey"
ask: "The bay wall is attached to the building rather than to the ground floor. Which node should it hang from, and which relationship puts it there?"
reveal: "it places a physical element into exactly one spatial structure element, normally a storey"
root:
  id: "1xS3BCk291UvhgP2a6eflL"
  type: IfcProject
  name: "Riverside Depot"
  children:
    - id: "2wLpH8dGz3nQBcVsRt1eMf"
      type: IfcBuilding
      name: "Depot"
      rel: aggregates
      children:
        - id: "2rSuRi_lD5$O4Op8DVOCkd"
          type: IfcBuildingStorey
          name: "Ground floor"
          rel: aggregates
        - id: "3Xt7zPfNb2vgqR1YkEwNsq"
          type: IfcWall
          name: "Bay wall, north"
          rel: contained
          flag: bad
```

The file parses. The wall renders. It is simply absent from every per-storey number the model produces, because the storey it should have been grouped under does not know about it.

```typescript
// The reverse index lesson 432 built, asked the two questions that matter.
type Rel = { type: 'contained' | 'aggregates'; whole: string; parts: string[] };

const RELATIONS: Rel[] = [
  { type: 'aggregates', whole: 'Depot',        parts: ['Ground floor'] },
  { type: 'contained',  whole: 'Depot',        parts: ['Bay wall, north'] },
  { type: 'contained',  whole: 'Ground floor', parts: ['Corridor partition'] },
];

/** Every element whose container is not a storey — the check worth running
 *  on delivery, because nothing else reports it. */
export function notOnAStorey(relations: Rel[], storeys: Set<string>): string[] {
  return relations
    .filter((r) => r.type === 'contained' && !storeys.has(r.whole))
    .flatMap((r) => r.parts);
}

export const misplaced = notOnAStorey(RELATIONS, new Set(['Ground floor']));
```

## When to Use
- You are writing an incoming-model check and want the one rule that catches the most real defects: every physical element contained in a storey, exactly once
- You are building a take-off or a floor-based report and need to know which relationship to follow and which to ignore
- You are reproducing a viewer's model tree and cannot work out why your tree has more nodes than theirs
- You are exporting IFC yourself and choosing how to attach a composite element

## Common Mistakes
- **Containing an aggregated part directly in the storey** — it is already placed through its whole, so the part is counted twice everywhere
- **Following `IfcRelFillsElement` to find a window's storey** — filling and voiding are element-to-element and carry no spatial position at all
- **Attaching an element to the building instead of the storey** — legal, renders correctly, and removes the element from every per-storey report in the project
- **Reading `IfcRelContainedInSpatialStructure`'s attributes in the usual relating-then-related order** — this one is the other way round, and swapping them makes every element its own container
- **Assuming a group assignment replaces containment** — `IfcRelAssignsToGroup` is orthogonal, so an element in a system still needs its place in the spatial tree
- **Allowing an element two containers** — the schema says exactly one, and a second one is the kind of defect that surfaces months later as a total that never balances

## Further Reading
- [IfcRelContainedInSpatialStructure](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelContainedInSpatialStructure.htm) — the cardinality rule and the attribute order
- [IfcRelAggregates](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelAggregates.htm) — decomposition, for both spatial levels and composite elements
- [IfcRelVoidsElement](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelVoidsElement.htm) — how an opening subtracts from an element
- [IfcRelFillsElement](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelFillsElement.htm) — and how what fills it is placed separately
- [IfcRelAssignsToGroup](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelAssignsToGroup.htm) — grouping that leaves the spatial tree alone

```recall
- q: "Distinguish containment from aggregation, and give the rule that follows when both are present."
  must:
    - "containment places a physical element into exactly one spatial structure element"
    - "aggregation is whole-and-parts decomposition"
    - "an aggregated part is placed through its whole and must not also be contained directly"
    - "doing both double-counts the part in the tree and in the take-off"

- q: "A window fills an opening that voids a wall. Say what each relationship does and does not do."
  must:
    - "voiding subtracts the opening from the wall"
    - "filling says the window occupies the opening"
    - "neither carries any spatial position"
    - "the window is contained in the storey in its own right"

- q: "Name the attribute-order trap in IfcRelContainedInSpatialStructure and its symptom."
  must:
    - "RelatedElements comes before RelatingStructure, the reverse of most relations"
    - "reading them the other way round makes every element its own container"
```
