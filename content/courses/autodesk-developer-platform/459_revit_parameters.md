# 459. Revit Parameters: Built-in, Shared, Project — and Which One Survives Export

## What It Is
**Mode: add-in.** Lesson 456 said discipline data lives in parameters. This one is about the three kinds, because they behave identically in the interface and completely differently the moment data has to leave the model.

A **built-in parameter** is part of Revit itself: `Mark`, `Comments`, `Fire Rating`. It exists on every model, it has a stable enumeration value in the API, and every tool that reads Revit knows it. You cannot create one and you cannot rename one.

A **project parameter** is one you add to a project. It shows in schedules, it can be filtered on, and it lives in that project file only. Add the same parameter to a second project and you have two parameters that share a name and nothing else — which is why a project parameter is fine for a schedule and useless as an integration key.

A **shared parameter** is the one to reach for when data has to survive. It is defined in an external shared-parameter file, and its identity is a **GUID** rather than its name. That GUID is what makes the same parameter the same parameter across projects, across exports and across teams, and it is what an IFC export or a downstream database can join on. A project parameter's name is a label; a shared parameter's GUID is an identity.

This is the first link in the handover chain. When a wall's fire rating has to appear in an IFC export as a property in a set — the shape Lesson 436 describes — the export mapping is expressed against shared parameters. A project parameter does not reliably make that journey, and the failure shows up not as an error but as a property that quietly is not there.

```quiz
- q: "Two projects each have a project parameter called `AssetTag`. Are they the same parameter?"
  anchor: "two parameters that share a name and nothing else"
  options:
    - text: "Yes — the name is the identity"
      correct: false
      why: "The name is a label. Two project parameters with the same name have no relationship to each other."
    - text: "No — a project parameter lives in one project file, so these share a name and nothing else"
      correct: true
      why: "That is exactly what a shared parameter's GUID exists to fix."
    - text: "Only if both were created from the same shared-parameter file"
      correct: false
      why: "Then they would be shared parameters, not project ones — which is the distinction."

- q: "A required property is missing from an IFC export and nothing errored. What is the first thing to suspect?"
  anchor: "the export mapping is expressed against shared parameters"
  options:
    - text: "The IFC schema version does not have that property"
      correct: false
      why: "Worth checking, and it would usually be a mapping error rather than silence."
    - text: "The parameter is a project parameter rather than a shared one, so the export mapping had nothing stable to bind to"
      correct: true
      why: "The failure is a property that is simply absent, which no validator reports as an error."
    - text: "The element was not included in the export scope"
      correct: false
      why: "Then the element would be missing, not one of its properties."
```

## Key Concepts
- **Built-in parameter**: part of Revit, stable across every model, addressed in the API by an enumeration value
- **Project parameter**: added to one project; schedulable, filterable, and local to that file
- **Shared parameter**: defined in an external file and identified by a **GUID**, which is what survives export and travels between projects
- **Name is a label, GUID is an identity**: the whole distinction in one sentence
- **Instance versus type**: any of the three can be bound to instances or to types, and Lesson 436's occurrence-overrides-type rule applies here too
- **The shared-parameter file is a shared asset**: it belongs to the organisation, not to one project, and regenerating it regenerates identities
- **Export mappings bind to shared parameters** — which makes this the first link in the handover chain
- **Silence is the failure mode**: an unmapped parameter produces an export missing a property, not an error

## Example Code
Three lookups, three different identity strategies:

```csharp
// Revit 2025 API. A built-in parameter — addressed by enumeration, so no
// string can be misspelled and no rename can break it.
Parameter fireRating = wall.get_Parameter(BuiltInParameter.FIRE_RATING);

// A parameter looked up by NAME. Works for project and shared parameters
// alike, and silently returns null when someone renames it or when the
// project it was defined in is not this one.
Parameter byName = wall.LookupParameter("AssetTag");
```

```csharp
// Revit 2025 API. A shared parameter by its GUID, which is the identity that
// survives a round trip. This is the lookup an integration should use, and
// the reason a shared-parameter file is version-controlled like source.
Guid assetTagGuid = new Guid("6f4b1c2a-9d3e-4a17-8b25-1e7c0a9f5d34");
Parameter assetTag = wall.get_Parameter(assetTagGuid);
string tag = assetTag?.AsString();
```

## When to Use
- Built-in: whenever one exists for what you need, because it needs no setup and is stable everywhere
- Project: data that only ever serves a schedule or a view filter inside one file
- Shared: anything that leaves the model — an export, a database, another discipline's model, a facility system
- When defining a data requirement for a project, where "shared parameter, this GUID" is checkable and "a parameter called AssetTag" is not

## Common Mistakes
- **Using a project parameter as an integration key** — it is local to one file, so the same name in the next project is a different parameter
- **Looking parameters up by display name** — a rename or a localised Revit install returns null, and null is indistinguishable from empty
- **Regenerating the shared-parameter file** — new GUIDs mean new identities, and every mapping and every stored join breaks at once
- **Assuming an export carries every parameter** — export mappings are explicit, and an unmapped parameter is absent rather than reported
- **Ignoring the instance-versus-type binding** — the same parameter bound to types answers a different question from one bound to instances, and Lesson 436's override rule decides which value wins
- **Treating the shared-parameter file as a project artefact** — it is an organisational one, and keeping it beside a project guarantees divergence

## Further Reading
- [Revit API Developer's Guide (Revit 2025)](https://help.autodesk.com/view/RVT/2025/ENU/?guid=Revit_API_Revit_API_Developers_Guide_html) — parameter storage, binding and the shared-parameter file, version-stamped
- [Revit API documentation index](https://www.revitapidocs.com/) — `BuiltInParameter`, `DefinitionFile` and the GUID-based lookup
- [Autodesk Platform Services documentation](https://aps.autodesk.com/developer/documentation) — the cloud side, where these parameters resurface as the properties Lesson 464 reads

```recall
- q: "Name the three parameter kinds and what identifies each."
  must:
    - "built-in — part of Revit, addressed by an enumeration value, stable everywhere"
    - "project — added to one project file, identified by name, local to it"
    - "shared — defined in an external file and identified by a GUID"

- q: "Why is a project parameter the wrong integration key?"
  must:
    - "it lives in one project file only"
    - "the same name in another project is a different parameter"
    - "a name is a label; a shared parameter's GUID is an identity"

- q: "What happens when a required property does not reach an IFC export?"
  must:
    - "export mappings bind to shared parameters"
    - "an unmapped parameter is simply absent from the export"
    - "nothing errors — the failure is silence, and it surfaces downstream"
```
