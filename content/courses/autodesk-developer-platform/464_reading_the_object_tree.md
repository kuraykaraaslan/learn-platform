# 464. Reading the Object Tree and Properties Out of a Derivative

## What It Is
**Mode: cloud.** A translated derivative gives you two things, and keeping them apart is the lesson: an **object tree** and a **properties** document.

The object tree is the hierarchy a model browser shows — a model containing categories, categories containing families, families containing instances — with each node carrying an id and a name. It answers "what is in this model and how is it organised". It is the same shape as the IFC spatial structure from Lesson 434 and it is not the same tree: this one is what the *translator* produced, grouped the way the source application grouped it.

Properties are fetched separately, keyed by object id, and arrive grouped into named groups — the same parameters Lesson 459 was about, surfaced as data. A wall's `Fire Rating` appears under a `Fire Protection` group; its mark appears under `Identity Data`. Which groups and which properties are present is decided by what the source model carried and what the translation kept, and that is the sentence this lesson turns on: **the object tree is an output of the translation, so what is on a node is what the translator chose to carry.**

Two consequences follow. First, an absent property is ambiguous — it may not have been in the model, or it may not have survived translation, and the derivative cannot tell you which. Second, the object id is **derivative-scoped**: re-translate the model and the ids can change, so an object id is a handle for this derivative and never a key to store against a business record. The identity that survives is the shared parameter GUID from Lesson 459, carried in the properties as data.

*(Property group names are a vendor-surfaced data model. Checked 2026-09; a group name is what the source application called it, so it also changes when the source does.)*

```quiz
- q: "A property you expect is missing from an object's properties. What does that tell you?"
  anchor: "an absent property is ambiguous"
  options:
    - text: "That the model does not have it"
      correct: false
      why: "Possible, and equally possible is that it was not carried through translation. The derivative cannot distinguish the two."
    - text: "Either it was not in the model or it did not survive translation, and the derivative cannot say which"
      correct: true
      why: "Which is why the answer is to look at the source model, not to reread the derivative."
    - text: "That the object id is wrong"
      correct: false
      why: "A wrong id returns nothing at all, rather than a document with a gap in it."

- q: "Can you store an object id as the key linking a model element to a database record?"
  anchor: "the object id is **derivative-scoped**"
  options:
    - text: "Yes — it identifies the element in the model"
      correct: false
      why: "It identifies a node in one derivative. Re-translate and the ids can change."
    - text: "No — it is scoped to the derivative, so it is a handle and not an identity"
      correct: true
      why: "The identity that survives is a shared parameter GUID, carried in the properties as data."
    - text: "Only if the model is never re-translated"
      correct: false
      why: "Designing on the assumption that a model is never re-translated is the same as having no key."
```

## Key Concepts
- **Object tree**: the model's hierarchy as the translator produced it — model, category, family, instance
- **Properties**: fetched separately, keyed by object id, grouped into named groups
- **Groups mirror the source application's own grouping** — `Identity Data`, `Fire Protection` and the rest are Revit's names, surfaced
- **The tree is an output of translation** — what is on a node is what the translator chose to carry
- **Absence is ambiguous**: not in the model, or not carried, and the derivative cannot distinguish them
- **Object ids are derivative-scoped**: a handle for this derivative, not a key to store
- **The durable key is in the data**: a shared parameter GUID from Lesson 459, carried as a property
- **Fetching properties for a whole model is a large document** — page or filter by node rather than pulling everything

## Example Code
Part of one model's object tree, with properties on the node the question is about:

```spatial
title: "The object tree a derivative gives you"
ask: "The wall below shows a Fire Rating. A colleague says the same wall has no fire rating at all. Both of you are looking at real data — what could each of you be looking at, and which one settles it?"
reveal: "the object tree is an output of the translation, so what is on a node is what the translator chose to carry"
root:
  id: "1"
  type: Model
  name: "depot-l1.rvt"
  children:
    - id: "2"
      type: Category
      name: "Walls"
      rel: aggregates
      children:
        - id: "3"
          type: Family
          name: "Basic Wall"
          rel: aggregates
          children:
            - id: "4"
              type: Instance
              name: "Bay wall, north"
              rel: aggregates
              flag: focus
              props:
                - set: Identity Data
                  name: Mark
                  value: "W-042"
                - set: Fire Protection
                  name: Fire Rating
                  value: "REI 60"
    - id: "5"
      type: Category
      name: "Doors"
      rel: aggregates
      children:
        - id: "6"
          type: Family
          name: "Single-Flush"
          rel: aggregates
          children:
            - id: "7"
              type: Instance
              name: "D-011"
              rel: aggregates
              props:
                - set: Identity Data
                  name: Mark
                  value: "D-011"
```

Reading it, with the ambiguity made explicit rather than flattened away:

```typescript
type PropertyGroups = Record<string, Record<string, string | number | boolean>>;

type TreeNode = { objectid: number; name: string; objects?: TreeNode[] };

type ObjectProperties = { objectid: number; name: string; properties: PropertyGroups };

/** Three answers, not two. "The derivative does not carry it" is a different
 *  fact from "the model does not have it", and only the first one is something
 *  this document can actually report. */
export type Lookup =
  | { found: true; value: string | number | boolean }
  | { found: false; reason: 'no-such-object' | 'group-absent' | 'property-absent' };

export function lookup(
  docs: readonly ObjectProperties[],
  objectId: number,
  group: string,
  property: string
): Lookup {
  const doc = docs.find((d) => d.objectid === objectId);
  if (!doc) return { found: false, reason: 'no-such-object' };
  const values = doc.properties[group];
  if (!values) return { found: false, reason: 'group-absent' };
  if (!(property in values)) return { found: false, reason: 'property-absent' };
  return { found: true, value: values[property] };
}

/** Every node in the tree, flattened — the tree is a tree, and the properties
 *  document is a flat list keyed by the ids in it. */
export function flatten(node: TreeNode): TreeNode[] {
  return [node, ...(node.objects ?? []).flatMap(flatten)];
}
```

## When to Use
- Building a model browser, a search, or any interface over a translated model
- Extracting a schedule or a quantity report from a model without opening the source application
- Joining model elements to records in another system — where the object id is the handle for this derivative and the shared parameter GUID is the key
- Diagnosing "the data is not there", where the tree and the properties document narrow it to translation or to the source model

## Common Mistakes
- **Storing an object id as a foreign key** — it is scoped to a derivative and can change on re-translation, so the join silently stops matching
- **Reading an absent property as an absent value** — the model may carry it and the translation may not, and only the source model settles it
- **Fetching every property for a whole model** — it is a large document, and the useful call is scoped to the nodes you are asking about
- **Assuming the tree mirrors the source's own hierarchy exactly** — it is a translation output, grouped as the translator chose
- **Hard-coding a group name as a fact** — it is what the source application called it, so it changes when the source does
- **Treating the derivative as the model** — which is Lesson 465's entire subject

## Further Reading
- [Model Derivative overview](https://aps.autodesk.com/en/docs/model-derivative/v2/developers_guide/overview/) — the object tree and properties documents, at the service index
- [Autodesk Platform Services documentation](https://aps.autodesk.com/developer/documentation) — where the current shape of both documents is described
- [Revit API Developer's Guide (Revit 2025)](https://help.autodesk.com/view/RVT/2025/ENU/?guid=Revit_API_Revit_API_Developers_Guide_html) — the parameters these properties came from, version-stamped

```recall
- q: "Name the two documents a derivative gives you and what each one answers."
  must:
    - "an object tree — the model's hierarchy as the translator produced it"
    - "a properties document, fetched separately and keyed by object id, grouped into named groups"
    - "the tree answers what is in the model; the properties answer what an object carries"

- q: "Why is a missing property ambiguous?"
  must:
    - "it may not have been in the source model"
    - "or it may not have survived translation"
    - "the derivative cannot distinguish them — only the source model settles it"

- q: "What is an object id good for, and what is it not?"
  must:
    - "a handle for this derivative"
    - "not a key to store, because re-translating can change the ids"
    - "the durable key is a shared parameter GUID carried in the properties as data"
```
