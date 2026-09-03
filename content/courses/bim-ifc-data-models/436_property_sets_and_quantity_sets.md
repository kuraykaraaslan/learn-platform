# 436. Property Sets and Quantity Sets: Where a Value Actually Lives

## What It Is
IFC does not give a wall a `fireRating` field. Entity attributes are the small fixed set the schema declares — name, description, placement, representation — and everything else a discipline wants to record travels in a **property set**: an `IfcPropertySet` holding named properties, attached to elements by an `IfcRelDefinesByProperties` instance. That indirection is what lets a schema with a few hundred entity types carry the thousands of data points a real project needs.

Standard property sets are published by buildingSMART and are named with a `Pset_` prefix — `Pset_WallCommon` carries `IsExternal`, `LoadBearing`, `FireRating` and the rest for every wall. That prefix is reserved: your own project's properties belong in a set with your own prefix, because a custom set called `Pset_something` will eventually collide with a published one. Measured quantities get their own parallel mechanism, `IfcElementQuantity`, with a `Qto_` prefix — `Qto_WallBaseQuantities` is where a wall's length, height and areas live when the exporter was configured to write them at all.

The part that decides where you look for a value is **type versus occurrence**. An `IfcWallType` can carry property sets of its own, and every wall of that type inherits them. An individual wall can also carry its own, and a value on the occurrence overrides the value inherited from its type. So "the fire rating is wrong" has two possible homes and two very different fixes: change the type and every wall of that type moves, change the occurrence and exactly one does.

```quiz
- q: "Where does a wall's FireRating live in an IFC file?"
  anchor: "everything else a discipline wants to record travels in a **property set**"
  options:
    - text: "As an attribute of IfcWall, in the schema's fixed slot list"
      correct: false
      why: "Entity attributes are the small fixed set the schema declares. Discipline data does not live there."
    - text: "In a property set attached to the wall by a separate relationship instance"
      correct: true
      why: "IfcPropertySet plus IfcRelDefinesByProperties — the indirection that lets a few hundred entity types carry thousands of data points."
    - text: "In the wall's representation, alongside its geometry"
      correct: false
      why: "The representation holds shape. Properties are a separate structure entirely."

- q: "You need every wall of one construction to change fire rating at once. What do you edit?"
  anchor: "change the type and every wall of that type moves, change the occurrence and exactly one does"
  options:
    - text: "The property set on the type, provided no occurrence overrides it"
      correct: true
      why: "Occurrences inherit from the type, and an occurrence-level value wins where one exists."
    - text: "The property set on each occurrence, since the type is only a label"
      correct: false
      why: "The type is a real carrier of property sets, not a label — which is exactly why editing it moves every occurrence."
    - text: "Neither — FireRating is a quantity, so it lives in Qto_WallBaseQuantities"
      correct: false
      why: "A fire rating is a property, not a measured quantity. Quantity sets hold lengths, areas and volumes."
```

## Key Concepts
- **`IfcPropertySet`**: a named bag of properties, attached to elements through an `IfcRelDefinesByProperties` instance rather than being a field on the element
- **`Pset_` prefix**: reserved for buildingSMART's published sets; a custom set with that prefix is a future collision
- **`IfcElementQuantity` and the `Qto_` prefix**: measured quantities — lengths, areas, volumes — kept separate from descriptive properties
- **Type versus occurrence**: an `IfcWallType` carries property sets that every wall of that type inherits, through `IfcRelDefinesByType`
- **Occurrence wins**: a value on the occurrence overrides the value inherited from its type, so a lookup has to check both and know which it found
- **Property value kinds**: single value, enumerated, list, bounded and table — a property is not always one scalar
- **Quantities are optional output**: whether `Qto_` sets are exported at all is an exporter setting, so their absence is a configuration fact, not a model defect

## Example Code
Two walls of the same type, on the same storey. One rating is inherited and one is not:

```spatial
title: "Two fire ratings, two different homes"
ask: "Both walls are the same wall type. Editing the type would change one of these two fire ratings and not the other. Which one moves, and why?"
reveal: "a value on the occurrence overrides the value inherited from its type"
root:
  id: "2rSuRi_lD5$O4Op8DVOCkd"
  type: IfcBuildingStorey
  name: "Ground floor"
  children:
    - id: "3Xt7zPfNb2vgqR1YkEwNsq"
      type: IfcWall
      name: "Bay wall, north"
      rel: contained
      props:
        - set: Pset_WallCommon
          name: FireRating
          value: "REI 60"
          inherited: true
        - set: Pset_WallCommon
          name: IsExternal
          value: "true"
          inherited: true
    - id: "1MvQ7cRkT4vAWmDpLs2nXe"
      type: IfcWall
      name: "Plant room wall"
      rel: contained
      flag: focus
      props:
        - set: Pset_WallCommon
          name: FireRating
          value: "REI 120"
        - set: Pset_WallCommon
          name: IsExternal
          value: "false"
```

Resolving a property therefore means merging two sources in the right order:

```typescript
type PropertyValue = { pset: string; name: string; value: string };

type Element = {
  globalId: string;
  /** Sets written on the element itself. */
  own: PropertyValue[];
  /** Sets reached through IfcRelDefinesByType, already flattened. */
  fromType: PropertyValue[];
};

export type Resolved = { value: string; source: 'occurrence' | 'type' } | null;

/** Occurrence first, type second — the order is the whole rule. Returning the
 *  source alongside the value is what lets a caller answer "and where do I go
 *  to change it", which is the question that actually gets asked. */
export function resolveProperty(element: Element, pset: string, name: string): Resolved {
  const match = (p: PropertyValue) => p.pset === pset && p.name === name;
  const own = element.own.find(match);
  if (own) return { value: own.value, source: 'occurrence' };
  const inherited = element.fromType.find(match);
  if (inherited) return { value: inherited.value, source: 'type' };
  return null;
}
```

## When to Use
- You are pulling a specific data point out of a model and need to know both where to look and which of two answers wins
- You are writing an export and deciding whether a value belongs on the type or on each occurrence
- You are specifying what a model has to contain on delivery, where naming the property set and property is the difference between a checkable requirement and a wish
- You are debugging a value that is right in the authoring tool and missing in the export, which is almost always a type-versus-occurrence or an exporter-setting question

## Common Mistakes
- **Looking for discipline data in the entity's own attributes** — those are the schema's fixed slots; everything else is in a property set reached through a relationship
- **Reading the occurrence and stopping** — a missing value on the occurrence may be present on the type, and a lookup that does not follow `IfcRelDefinesByType` reports it as absent
- **Reading the type and stopping** — the opposite error, and the worse one: the occurrence may have overridden the value you just reported
- **Naming a custom set with the `Pset_` prefix** — that namespace belongs to buildingSMART's published sets, and the collision arrives later, in someone else's tool
- **Treating a missing `Qto_` set as a broken model** — whether quantities are exported is an exporter setting, so its absence is a configuration fact to check rather than a defect to report
- **Assuming a property is a scalar** — enumerated, list, bounded and table values all exist, and a reader that only handles single values silently drops the rest

## Further Reading
- [IfcPropertySet](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcPropertySet.htm) — the container and the naming convention for published sets
- [Pset_WallCommon](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/Pset_WallCommon.htm) — every property in the set this lesson uses, with its type
- [IfcRelDefinesByProperties](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelDefinesByProperties.htm) — how a set reaches an element
- [IfcRelDefinesByType](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelDefinesByType.htm) — the inheritance path an occurrence lookup has to follow
- [Qto_WallBaseQuantities](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/Qto_WallBaseQuantities.htm) — the quantities a wall carries when they are exported at all

```recall
- q: "Explain why a wall has no fireRating attribute, and where the value goes instead."
  must:
    - "entity attributes are the small fixed set the schema declares"
    - "discipline data travels in a property set, an IfcPropertySet"
    - "attached to the element by an IfcRelDefinesByProperties instance"

- q: "State the type-versus-occurrence rule and what each edit changes."
  must:
    - "a type carries property sets that every occurrence of that type inherits"
    - "a value on the occurrence overrides the inherited one"
    - "editing the type moves every occurrence; editing the occurrence moves exactly one"

- q: "What do the Pset_ and Qto_ prefixes mean, and what should you never do with the first one?"
  must:
    - "Pset_ marks buildingSMART's published property sets"
    - "Qto_ marks quantity sets — measured lengths, areas and volumes"
    - "never use the Pset_ prefix for a custom set; that namespace is reserved and will collide"
```
