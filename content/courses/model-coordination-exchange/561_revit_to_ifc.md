# 561. Revit to IFC: Where Your Parameters Actually Land

## What It Is
An IFC export is a **translation**, and like every translation it is governed by a mapping that somebody either configured or accepted by default. The question this lesson answers is the one that arrives as a complaint from downstream: *the parameter is in the model, so why is it not in the file?* The answer is almost never that the export is broken. It is that the export did exactly what its mapping said, and nobody read the mapping.

Three mappings run on every export. The **category mapping** decides which IFC class each authoring-tool category becomes — it lives in a text file the exporter reads, it can be replaced, and it is the reason a "Generic Model" arrives as `IfcBuildingElementProxy` and stops being findable by class. The **property mapping** decides which parameters become which properties in which property sets, and by default it exports the standard sets plus whatever the exporter's built-in mapping covers. And the **per-element overrides** are parameters the exporter itself treats as instructions — a parameter named to set an element's exported class or name changes that element's translation regardless of the category mapping.

The distinction that decides most outcomes is **shared versus project parameters** (Lesson 459). A shared parameter has a stable definition that lives outside the model, which is what lets an export mapping refer to it and what lets several projects agree on what it means. A project parameter exists only inside the file it was created in. Both look identical in the properties palette, and only one of them can be reliably named in a mapping file — so a value entered carefully by a modeller for six months can be absent from every export, with no error and no warning.

**A parameter that is not in the mapping does not produce a warning; it produces nothing.** That is the whole failure mode, and it is why the review step is to export and then read the file (Lesson 432's parsing techniques are enough) rather than to export and assume. The property set a value lands in matters as much as whether it arrives, since a consumer looking in `Pset_WallCommon` will not find a value the mapping placed in a custom set — it is present in the file and invisible to the query (Lesson 436).

```quiz
- q: "A parameter is filled in for every element and does not appear in the exported IFC. What is the most likely cause?"
  anchor: "it produces nothing"
  options:
    - text: "The exporter failed and should be re-run"
      correct: false
      why: "Nothing failed. The export did what its mapping said."
    - text: "The parameter is not in the export mapping, and an unmapped parameter produces no output and no warning"
      correct: true
      why: "Which is why the review step is to export and then read the file."
    - text: "The IFC schema has no property that can hold that value"
      correct: false
      why: "Property sets are extensible; the schema is rarely the limitation."

- q: "Why does shared versus project parameter matter for export?"
  anchor: "only one of them can be reliably named in a mapping file"
  options:
    - text: "Project parameters are read-only during export"
      correct: false
      why: "Both are readable; the difference is whether the definition exists outside the model."
    - text: "A shared parameter has a stable definition outside the model, so a mapping can refer to it; a project parameter exists only inside its file"
      correct: true
      why: "They look identical in the properties palette, which is why the failure is so common."
    - text: "Shared parameters are exported automatically and project parameters never are"
      correct: false
      why: "Neither is automatic — both depend on the mapping."

- q: "A value arrives in the file but the consumer's query does not find it. What happened?"
  anchor: "present in the file and invisible to the query"
  options:
    - text: "The value was exported as text rather than a number"
      correct: false
      why: "A type mismatch is a real defect, but the query would still locate the property."
    - text: "It landed in a different property set from the one the consumer looks in"
      correct: true
      why: "Where a value lands matters as much as whether it arrives."
    - text: "The element was not contained in a storey"
      correct: false
      why: "That defect hides the element itself, not one of its properties (Lesson 559)."
```

## Key Concepts
- **An export is a translation governed by a mapping** — configured or accepted by default, never absent
- **Category mapping**: which IFC class each category becomes, held in a replaceable text file
- **Property mapping**: which parameters become which properties, in which property sets
- **Per-element overrides**: parameters the exporter treats as instructions for that element's class or name
- **Shared parameters have a stable definition outside the model**; project parameters do not (Lesson 459)
- **They look identical in the palette**, which is why the wrong one is used and nobody notices
- **An unmapped parameter produces no output and no warning** — silence is the failure mode
- **Where a value lands matters**: the right value in the wrong property set is invisible to a query (Lesson 436)

## Example Code
The same element, exported twice. The authoring model is identical in both halves — the modeller filled in `Asset Tag` (a shared parameter), `Fire Rating` (shared) and `Commissioned On` (a project parameter). Only the mapping differs:

```typescript
type ExportedElement = {
  ifcClass: string;
  name: string;
  propertySets: Record<string, Record<string, string | number>>;
};

// ── broken ──
// Default mapping: standard sets only. Neither custom parameter is named in
// it, so neither appears. Nothing warns, and the export "succeeded".
const exported: ExportedElement = {
  ifcClass: 'IfcBuildingElementProxy', // the category was a Generic Model
  name: 'M_AHU:Rooftop 40kW:284915',
  propertySets: {
    Pset_ElementCommon: { Reference: 'Rooftop 40kW' },
  },
};
console.log(exported.ifcClass, '|', Object.keys(exported.propertySets).join(', '));
console.log('AssetTag and FireRating are absent, and so is CommissionedOn.');

// ── fixed ──
// A category mapping giving the family a real class, and a property mapping
// naming the two shared parameters. "Commissioned On" is still missing: it is
// a project parameter and no mapping can name it reliably (Lesson 459).
const exported: ExportedElement = {
  ifcClass: 'IfcUnitaryEquipment',
  name: 'AHU-01',
  propertySets: {
    Pset_ElementCommon: { Reference: 'Rooftop 40kW' },
    Pset_UnitaryEquipmentTypeCommon: { FireRating: '120' },
    CustomPset_AssetHandover: { AssetTag: 'AHU-01' },
  },
};
console.log(exported.ifcClass, '|', Object.keys(exported.propertySets).join(', '));
console.log('CommissionedOn is still absent -- the fix for that one is upstream.');
```

The three differences have three different fixes, and it is worth naming them separately. The class changed because the **category** mapping changed. `FireRating` appeared because the **property** mapping named a shared parameter. `AssetTag` landed in a custom set, which is fine only if the consumer has been told to look there. And `Commissioned On` is missing in both halves, because no mapping can rescue a project parameter — that fix is in the model, not in the export.

## When to Use
- Before the first coordinated export on a project, where the mapping is cheap to fix and expensive to retrofit
- When a downstream consumer reports missing data, where the mapping is the first place to look rather than the exporter
- When agreeing an exchange requirement, since a requirement that names a property is a statement about the mapping (Lesson 562)
- When choosing how a value will be authored, where "shared parameter" is a technical decision with export consequences
- After any export, as a review step — export, then read the file (Lesson 432) rather than assuming

## Common Mistakes
- **Assuming an authored value will be exported** — the mapping decides, and by default it covers the standard sets
- **Using a project parameter for data that must leave the model** — it cannot be named reliably in a mapping
- **Not reading the exported file** — the only evidence of what a mapping did is in the output
- **Putting values in a custom property set and not telling the consumer** — present in the file, invisible to their query
- **Treating the category mapping as fixed** — a Generic Model exporting as a proxy is a mapping choice, not a limitation
- **Blaming the exporter** — it did exactly what the mapping said, silently and correctly

## Further Reading
- [Autodesk Revit help: exporting to IFC and the export setup](https://help.autodesk.com/view/RVT/2024/ENU/) — where the category and property mappings live and how a project replaces them
- [buildingSMART IFC4.3 documentation — property sets](https://ifc43-docs.standards.buildingsmart.org/) — the standard sets a consumer expects to find a value in, and what a custom set costs
- [Lesson 459](/courses/autodesk-developer-platform/revit-parameters) — shared versus project parameters, and why only one has a definition that outlives its model
- [Lesson 436](/courses/bim-ifc-data-models/property-sets-and-quantity-sets) — where a value has to land to be found by a query
- [Lesson 432](/courses/bim-ifc-data-models/parsing-ifc-without-a-library) — enough parsing to check what an export actually produced

```recall
- q: "Name the three mappings that govern an IFC export."
  must:
    - "the category mapping, deciding which IFC class each category becomes"
    - "the property mapping, deciding which parameters become which properties in which sets"
    - "per-element overrides, where a parameter instructs the exporter about that element's class or name"

- q: "Why can a project parameter not be relied on in an export?"
  must:
    - "it exists only inside the model it was created in and has no definition outside it"
    - "a shared parameter has a stable external definition a mapping can name"
    - "both look identical in the properties palette, so the wrong one is chosen and nothing warns"

- q: "What happens to a parameter that is not in the mapping?"
  must:
    - "nothing is exported for it and no warning is produced"
    - "silence is the failure mode, so the review step is to export and then read the file"
    - "and a value that lands in an unexpected property set is present but invisible to the consumer's query"
```
