# 555. BCF: An Issue as a Portable Object, Anchored to an Element

## What It Is
**BCF** — the BIM Collaboration Format — exists to move one thing between tools: an issue about a model. It is deliberately small, and the reason it is small is the design decision that makes it work: **BCF references geometry, it never contains it**. A topic is a few kilobytes of structured text plus an optional screenshot, and it means nothing on its own — it is only interpretable next to the model it points into.

A topic has three parts. The **markup** carries what a tracker would carry: a title, a status, a type, who it is assigned to, a due date, labels, and a thread of comments, each with an author and a timestamp. The **viewpoint** carries how to see it: a camera position and direction, a field of view, and — the part that matters most — a list of **components identified by their IFC GlobalId**, marking what is selected, what is coloured, and what is hidden. The **snapshot** is a picture of that viewpoint, and it is a convenience for humans, not the anchor.

That distinction is the whole lesson. A screenshot pasted into an email says *there is a problem near here*; a viewpoint says *these two elements, by identity, are the problem*. The second one can be reopened three exports later in the tool that authored the model, and the first one cannot. Element identity is what makes an issue survive time, which is why Lesson 433's GlobalId is load-bearing infrastructure rather than a detail of the file format.

It is also where BCF breaks, and it breaks quietly. **If an exporter regenerates GlobalIds instead of persisting them, every existing topic is orphaned** — the markup survives, the comments survive, the snapshot survives, and the components resolve to nothing. The topics still open, still show a picture, and no longer point anywhere. This is a property of the authoring tool and its export settings, not of BCF, and it is worth establishing before a coordination process depends on it: export twice with no changes and check whether the GlobalIds are the same, which is the check Lesson 440 builds on for a different purpose.

Two transports carry the same data model. **BCF-XML** is a zip: one folder per topic, each with a markup file, one or more viewpoint files, and any snapshots — a file you can email, commit, or diff. **BCF-API** is a REST service holding the same objects, which is what tools use when they want a live shared list rather than a file passed around. Choosing between them is choosing between a document and a service, and the data model does not change.

```quiz
- q: "What does a BCF topic actually contain?"
  anchor: "BCF references geometry, it never contains it"
  options:
    - text: "A trimmed copy of the model geometry around the issue"
      correct: false
      why: "It references geometry by identity and never carries it — that is what keeps a topic a few kilobytes."
    - text: "Markup (title, status, comments), a viewpoint (camera plus components by GlobalId), and an optional snapshot"
      correct: true
      why: "It is only interpretable next to the model it points into."
    - text: "A rendered image and a text description, which tools parse for element names"
      correct: false
      why: "The image is a convenience; the components list is the machine-readable anchor."

- q: "An exporter regenerates GlobalIds on every export. What happens to the existing BCF topics?"
  anchor: "every existing topic is orphaned"
  options:
    - text: "They are automatically re-linked by matching element names and positions"
      correct: false
      why: "Nothing re-links them. Name and position matching is a separate, lossy exercise (Lesson 440)."
    - text: "They still open and still show their snapshot, but their components resolve to nothing"
      correct: true
      why: "The failure is silent: the topic looks fine and no longer points at an element."
    - text: "They fail to load, so the problem is obvious immediately"
      correct: false
      why: "A missing component is not a parse error. The file is still valid BCF."

- q: "What is the difference between BCF-XML and BCF-API?"
  anchor: "choosing between a document and a service"
  options:
    - text: "BCF-API supports more fields, so it can express issues BCF-XML cannot"
      correct: false
      why: "They carry the same data model; the transport differs, not the content."
    - text: "One is a zip file you can email or commit, the other is a REST service holding the same objects"
      correct: true
      why: "It is a document-versus-service choice, and the schema is the same either way."
    - text: "BCF-XML is for issues, BCF-API is for model geometry"
      correct: false
      why: "Neither carries geometry — that is the format's central decision."
```

## Key Concepts
- **BCF moves an issue, not a model** — it references geometry by identity and never contains it
- **Markup**: title, status, type, assignee, due date, labels, and a comment thread with authors and timestamps
- **Viewpoint**: camera position and direction, field of view, and components listed by **IFC GlobalId**
- **The snapshot is for humans** — the components list is the machine-readable anchor
- **Identity is what survives time** — a viewpoint can be reopened after the model has changed (Lesson 433)
- **Regenerated GlobalIds orphan every topic silently** — markup and picture survive, the anchor does not
- **Two transports, one data model**: BCF-XML as a zip document, BCF-API as a REST service

## Example Code
Resolving a viewpoint against a model, which is the operation every BCF-consuming tool performs and the one that fails quietly:

```typescript run
/** A BCF viewpoint's components, resolved against an index of the model it
 *  points into. The interesting case is the one that produces no error. */
type Component = { ifcGuid: string; role: 'selected' | 'coloured' | 'hidden' };
type Topic = { guid: string; title: string; status: string; components: Component[] };

// An index of what is actually in the current export, GlobalId -> label.
const modelIndex = new Map<string, string>([
  ['3Xt7zPfNb2vgQK1p9wE4mR', 'IfcBeam / B-204'],
  ['1kR9mA0sT5xhLpQ2vN7dJc', 'IfcDuctSegment / SUP-11'],
  ['2bW4cE8nZ1qtYs6uH3gVfK', 'IfcWall / W-88'],
]);

const topic: Topic = {
  guid: 'f2f47c1e-0000-4000-8000-2c3b1a9d0011',
  title: 'Supply duct passes through beam B-204',
  status: 'Open',
  components: [
    { ifcGuid: '3Xt7zPfNb2vgQK1p9wE4mR', role: 'selected' },
    { ifcGuid: '1kR9mA0sT5xhLpQ2vN7dJc', role: 'selected' },
    { ifcGuid: '9zQ0pL4rX7neVt2wD5sBhM', role: 'coloured' }, // no longer in the model
  ],
};

const resolved = topic.components.map((c) => ({ ...c, label: modelIndex.get(c.ifcGuid) ?? null }));

console.log(`topic  : ${topic.title}`);
console.log(`status : ${topic.status}`);
console.log('components:');
for (const r of resolved) {
  console.log(`  ${r.ifcGuid}  ${r.role.padEnd(9)} -> ${r.label ?? 'NOT IN THIS MODEL'}`);
}

const lost = resolved.filter((r) => r.label === null);
console.log('');
console.log(`resolved ${resolved.length - lost.length} of ${resolved.length} components.`);
console.log('');
console.log('Note what did not happen: nothing threw, nothing was reported as invalid, and');
console.log('the topic still renders its title, its status and its snapshot. A viewer that');
console.log('does not surface the unresolved count shows a coordinator an issue that looks');
console.log('entirely intact and points at one element fewer than it did last week.');
console.log('');
console.log('If every component fails to resolve, the export regenerated its GlobalIds and');
console.log('the whole issue history is decorative. Check that before the process depends');
console.log('on it: export twice with no changes and compare the ids (Lesson 440).');
```

## When to Use
- Whenever an issue about a model has to leave the tool it was found in — which is every coordination process with more than one tool
- When choosing between a shared issue service and a file exchange, where the data model is identical and only the transport differs
- Before committing to a coordination workflow, to verify that the authoring tool persists GlobalIds across exports
- When a coordinator reports that "the old issues do not go anywhere any more", which is the orphaning failure
- When building any integration that consumes issues, where the unresolved-component count is the health metric to expose

## Common Mistakes
- **Treating the snapshot as the issue** — it cannot be re-resolved against a changed model, and it is the part tools keep
- **Assuming GlobalIds are stable** — it is a property of the exporter and its settings, and it must be verified, not hoped for
- **Hiding unresolved components** — a viewer that silently drops them turns a broken anchor into an invisible one
- **Emailing viewpoints as pictures** — the components list is the whole value and it does not survive the screenshot
- **Expecting BCF to carry the model** — a topic is meaningless without the model it references, and shipping one without the other wastes a round trip
- **Using topic titles as the identifier** — the topic GUID is the identity; titles get edited and translated

## Further Reading
- [buildingSMART BCF-XML specification and schemas](https://github.com/buildingSMART/BCF-XML) — the markup and viewpoint schemas, the folder layout of the zip, and the component list's structure
- [buildingSMART BCF-API specification](https://github.com/buildingSMART/BCF-API) — the same data model as a REST service, with the endpoints and the authentication model
- [Lesson 433](/courses/bim-ifc-data-models/globalid-the-ifc-guid) — the identifier every viewpoint depends on, and how it is encoded
- [Lesson 440](/courses/bim-ifc-data-models/model-diffing) — comparing two exports, which is also how you find out whether ids are being regenerated
- [Lesson 558](/courses/model-coordination-exchange/the-clash-report-nobody-reads) — what to put in a topic once a clash query has produced four thousand candidates

```recall
- q: "What are the three parts of a BCF topic and what does each carry?"
  must:
    - "markup: title, status, type, assignee, labels and a comment thread"
    - "viewpoint: camera position and direction, plus components listed by IFC GlobalId"
    - "snapshot: a picture for humans, which is not the anchor"

- q: "Why does BCF reference geometry rather than contain it?"
  must:
    - "it keeps a topic to a few kilobytes and makes it emailable or committable"
    - "the issue is only interpretable next to the model it points into"
    - "and the reference is by element identity, so it can be re-resolved after the model changes"

- q: "How does a BCF workflow fail when an exporter regenerates GlobalIds?"
  must:
    - "every existing topic's components resolve to nothing"
    - "the markup, comments and snapshot all survive, so the topic still looks intact"
    - "nothing errors -- the check is to export twice unchanged and compare the ids"
```
