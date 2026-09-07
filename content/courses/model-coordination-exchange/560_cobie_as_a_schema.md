# 560. COBie: The Handover Spreadsheet as a Schema

## What It Is
COBie is what a building's asset data looks like when it has to survive being emailed. It is a set of related sheets — Facility, Floor, Space, Zone, Type, Component, System, Job, Spare, Resource, Document, Attribute — delivered as a spreadsheet, and it is best understood not as a document but as **a relational schema that happens to be shipped as tabs**. Lesson 511 covers what an operations team does with one at handover; this lesson is about the schema itself, because that is where the failures live.

The structure is straightforward once the two levels are separated. **Type** rows describe a product — a model of air handling unit, a door type — carrying manufacturer, model number, warranty terms and expected life. **Component** rows describe individual installed instances, each pointing at its Type and at the Space it sits in. That split is the same type/occurrence distinction IFC makes with property sets (Lesson 436), and it is the reason a warranty period is stated once rather than four hundred times.

Then comes the part that decides whether a delivery is usable: **COBie's foreign keys are names**. That is the same decision, one layer down, that Lesson 573 makes about what a physical tag carries — and it has the same consequence when a name is edited. A Component's `TypeName` must match a Type's `Name` exactly; its `Space` must match a Space's `Name` exactly; a Space's `FloorName` must match a Floor's `Name`. Not an identifier, not a GUID — the human-readable name, matched as a string. Everything downstream is a string join, which means a renamed type breaks four hundred rows, a trailing space breaks one, and a delivery can be structurally complete and semantically empty.

Two consequences follow directly. First, **validation is not optional and it is cheap**: every name-key relationship in the delivery can be checked mechanically, and the check finds problems no visual review will. Second, **COBie is not a binding to the model**. Lesson 511 makes this point from the operations side; from the data side it means that if you need to go from a register row back to the element in the model, you need the GlobalId, and COBie does not carry it as a key — it is at best an attribute somebody remembered to include. A handover that intends to support a digital twin has to add that link deliberately (Lessons 485 and 511).

```quiz
- q: "What are COBie's foreign keys?"
  anchor: "COBie's foreign keys are names"
  options:
    - text: "GUIDs carried over from the model"
      correct: false
      why: "A GlobalId may appear as an attribute, but the relationships are keyed on names."
    - text: "Human-readable names, matched exactly as strings"
      correct: true
      why: "Which is why a rename breaks hundreds of rows and a trailing space breaks one."
    - text: "Row numbers within each sheet"
      correct: false
      why: "Row order carries no meaning and cannot survive a re-export."

- q: "Why do Type and Component exist as separate sheets?"
  anchor: "a warranty period is stated once rather than four hundred times"
  options:
    - text: "Because types are authored by the designer and components by the contractor"
      correct: false
      why: "Often true in practice, but the split is a data-modelling one, not an authorship one."
    - text: "Because a product's shared facts belong on the product, and installed instances point at it"
      correct: true
      why: "The same type/occurrence distinction IFC makes with property sets."
    - text: "Because components change during construction and types do not"
      correct: false
      why: "Both change; the separation is about where a shared fact is stated."

- q: "A COBie delivery has every required sheet and column filled in. What can still be wrong?"
  anchor: "structurally complete and semantically empty"
  options:
    - text: "Nothing — completeness is what the format asks for"
      correct: false
      why: "Completeness is per cell; the relationships between sheets are separate and unchecked."
    - text: "The name keys may not match, so components point at types and spaces that do not exist"
      correct: true
      why: "It is a mechanical check, and it finds what no visual review will."
    - text: "The spreadsheet may be in the wrong file format"
      correct: false
      why: "A format problem is immediately visible; a broken name join is not."
```

## Key Concepts
- **COBie is a relational schema shipped as spreadsheet tabs** — Facility, Floor, Space, Type, Component, System and the rest
- **Type describes a product**, Component describes an installed instance pointing at its Type and Space
- **The split states shared facts once** — the same type/occurrence distinction as IFC property sets (Lesson 436)
- **Foreign keys are names, matched exactly** — `Component.TypeName` to `Type.Name`, `Component.Space` to `Space.Name`
- **A rename breaks hundreds of rows; a trailing space breaks one**, and neither is visible in review
- **Validation is mechanical and cheap** — every name join in the delivery can be checked
- **COBie is not a binding to the model** — the GlobalId is at best an attribute, never a key (Lesson 511)

## Example Code
The joins, and what they do when a name is one character off:

```typescript run
/** Three COBie sheets as delivered, with two realistic defects: a component
 *  whose TypeName was renamed after the type sheet was produced, and one whose
 *  Space carries a trailing space. */
type TypeRow = { Name: string; Manufacturer: string; WarrantyDurationParts: number };
type SpaceRow = { Name: string; FloorName: string };
type ComponentRow = { Name: string; TypeName: string; Space: string };

const types: TypeRow[] = [
  { Name: 'AHU-Rooftop-40kW', Manufacturer: 'Acme Air', WarrantyDurationParts: 24 },
  { Name: 'VAV-Terminal-Std', Manufacturer: 'Acme Air', WarrantyDurationParts: 12 },
];

const spaces: SpaceRow[] = [
  { Name: 'L03-Plant-01', FloorName: 'Level 03' },
  { Name: 'L03-Office-14', FloorName: 'Level 03' },
];

const components: ComponentRow[] = [
  { Name: 'AHU-01', TypeName: 'AHU-Rooftop-40kW', Space: 'L03-Plant-01' },
  { Name: 'AHU-02', TypeName: 'AHU-Rooftop-40 kW', Space: 'L03-Plant-01' }, // renamed type
  { Name: 'VAV-114', TypeName: 'VAV-Terminal-Std', Space: 'L03-Office-14 ' }, // trailing space
  { Name: 'VAV-115', TypeName: 'VAV-Terminal-Std', Space: 'L03-Office-14' },
];

const typeByName = new Map(types.map((t) => [t.Name, t]));
const spaceByName = new Map(spaces.map((s) => [s.Name, s]));

console.log('component   type join        space join       warranty (months)');
let broken = 0;
for (const c of components) {
  const t = typeByName.get(c.TypeName);
  const s = spaceByName.get(c.Space);
  if (!t || !s) broken++;
  console.log(
    `${c.Name.padEnd(11)} ${(t ? 'ok' : 'BROKEN').padEnd(16)} ${(s ? 'ok' : 'BROKEN').padEnd(16)} ${t ? String(t.WarrantyDurationParts) : '-'}`
  );
}

console.log('');
console.log(`${broken} of ${components.length} components do not resolve.`);
console.log('');
console.log('Neither defect is visible in a spreadsheet: "AHU-Rooftop-40 kW" reads correctly');
console.log('to a person, and a trailing space is invisible by definition. Both produce an');
console.log('asset with no warranty, no manufacturer and no location in the register that');
console.log('gets built from this delivery (Lesson 504) -- and the register will not say so.');
console.log('');
console.log('The whole check is two Map lookups per row. Run it on receipt, not after the');
console.log('data has been imported and the source spreadsheet has been archived.');
```

## When to Use
- On receipt of any COBie delivery, before import — the name-join check takes minutes and decides whether the data is usable
- When specifying a handover, where "a COBie file" is not a requirement and "a COBie file whose name joins all resolve" is (Lesson 562)
- When populating an asset register from a handover, where broken joins become assets with no type and no location (Lesson 504)
- When deciding whether a handover can support a digital twin, which needs a model binding COBie does not carry (Lesson 485)
- When reconciling a delivery against the model, where the GlobalId has to have been included deliberately as an attribute

## Common Mistakes
- **Treating COBie as a document** — it is a schema with relationships, and the relationships are the part that breaks
- **Reviewing it visually** — a trailing space and a renamed type both look correct to a reader
- **Accepting completeness as validity** — every cell can be filled while every join is broken
- **Expecting a link back to the model** — the GlobalId is not a COBie key and is often absent entirely
- **Importing before validating** — after import the broken rows look like missing data rather than a join failure
- **Renaming types after the type sheet is issued** — it silently orphans every component that referenced the old name

## Further Reading
- [NBS: what COBie is and what it delivers](https://www.thenbs.com/knowledge/what-is-cobie) — the sheet structure and the intent of the handover deliverable
- [buildingSMART IFC4.3 documentation — type objects and occurrences](https://ifc43-docs.standards.buildingsmart.org/) — the type/occurrence split COBie's Type and Component sheets mirror
- [Lesson 511](/courses/asset-management-systems/handover-data) — the handover process this format serves, and turning a delivery into a live register
- [Lesson 504](/courses/asset-management-systems/the-asset-register) — what the rows become, and what a broken join costs there

```recall
- q: "How is a COBie delivery structured?"
  must:
    - "a set of related sheets -- Facility, Floor, Space, Type, Component and others -- shipped as a spreadsheet"
    - "Type rows describe a product, Component rows describe installed instances pointing at their Type and Space"
    - "it is a relational schema rather than a document"

- q: "What are COBie's foreign keys and why does that matter?"
  must:
    - "they are human-readable names, matched exactly as strings"
    - "a renamed type breaks every component that referenced it, and a trailing space breaks one row"
    - "so a delivery can be structurally complete and semantically empty"

- q: "Why is COBie not a binding to the model?"
  must:
    - "its keys are names, not GlobalIds"
    - "the GlobalId appears at best as an attribute somebody chose to include"
    - "a handover meant to support a twin has to add that link deliberately"
```
