# 511. Handover Data: Turning a Model Into a Register Without Losing the Link

## What It Is
At handover, a project delivers a model and a data set — often a COBie spreadsheet — and an operations team has to turn that into a live asset register. The register is populated once, from this delivery, and then it diverges from the model forever: the register gains work orders and condition history, the model gets re-exported for the next project phase. **The link between a register row and the model element it came from is made once, at handover, and it is the most expensive thing to lose.**

It is expensive to lose because of what it is worth later. With the link intact, a defect logged against a register asset can be shown in the model, a model change can be checked against what is actually installed, and a future refurbishment can start from "here is every asset in this zone and its condition". Without it, the register and the model are two descriptions of the same building that can only be re-associated by someone walking the site with both.

The link has to be carried by something **stable across the model's re-exports**, and Lesson 433 is the reason the obvious choice is wrong: the IFC `GlobalId` (`#433`) is unique within a file but only stable across exports if the authoring tool chooses to keep it, and many do not. The candidates that actually survive are an **organisation-controlled asset tag** written into the model as a shared parameter (nobody else can renumber it), or a **separate binding table** that maps tag to the current export's GlobalId and is reconciled on every model import — the same mechanism the twin course builds for live data.

COBie itself helps and does not solve this. It gives a structured delivery — a `Component` sheet that becomes register rows, a `Type` sheet that becomes the asset-class catalogue, `Space` and `Floor` that become the location tree — but COBie's own keys are names, and a name is not a durable link to a geometric element. The handover process has to add the tag-to-element binding on top of what COBie provides, and verify it before the modelling team moves on.

```quiz
- q: "Why is the link between a register row and its model element the most expensive thing to lose at handover?"
  anchor: "The link between a register row and the model element it came from is made once, at handover, and it is the most expensive thing to lose."
  options:
    - text: "Because model files are large and re-downloading them is slow"
      correct: false
      why: "File size is irrelevant. The cost is that the association cannot be recreated without physically walking the site."
    - text: "Because it is made only once, and without it the register and model can only be re-associated by someone on site with both"
      correct: true
      why: "Every later use — showing a defect in the model, checking a change against what is installed — depends on that link."
    - text: "Because the register is legally required to match the model"
      correct: false
      why: "There may be contractual handover requirements, but the expense is operational, not legal."

- q: "Why is the IFC GlobalId a poor choice for carrying the handover link?"
  anchor: "unique within a file but only stable across exports if the authoring tool chooses to keep it, and many do not"
  options:
    - text: "It is too long to store in a register column"
      correct: false
      why: "It is 22 characters — storage is not the issue. Stability across re-export is."
    - text: "It is unique only within one file and is often regenerated on re-export, so the register's key would break every time the model is reissued"
      correct: true
      why: "Lesson 433's point exactly: a re-export with new GlobalIds looks like every element was deleted and recreated."
    - text: "It cannot be read without the authoring application"
      correct: false
      why: "It is in the IFC file as plain data. The problem is whether it is the same value next time."
```

## Key Concepts
- **The register is populated once, from the handover delivery**, then diverges from the model permanently
- **The register-to-element link is made once and is the costliest thing to lose**
- **With the link**: defects shown in the model, model changes checked against what is installed, refurbishment starts from real condition data
- **Without it**: two descriptions of one building, re-associated only by walking the site
- **The link must ride on something stable across re-exports** — the `GlobalId` (`#433`) usually is not
- **Durable carriers**: an organisation-controlled tag as a shared parameter, or a tag-to-GlobalId binding table reconciled on every import
- **COBie structures the delivery** — `Component`, `Type`, `Space`, `Floor` map to register rows, classes and the tree
- **COBie's keys are names**, not a durable link to geometry — the binding is added on top
- **Verify the binding before the modelling team leaves** — it cannot be reconstructed cheaply afterwards

## Example Code
The handover produces three things that have to stay connected. This is the shape of the mapping, and the field that does the connecting:

```typescript
/** One row of a COBie Component sheet, as delivered. */
type CobieComponent = {
  name: string;          // COBie's key — a name, not a durable element link
  typeName: string;      // -> the Type sheet, becomes asset_class
  space: string;         // -> the Space/Floor tree, becomes parent
  serialNumber?: string;
  installationDate?: string;
  /** Present only if the delivery was set up to carry it — the shared
   *  parameter the organisation controls, written into the model. This is
   *  what the register keys on. */
  assetTag?: string;
};

/** The binding table — the fallback when the model does not carry the tag as
 *  a parameter. Maps the stable tag to whatever the current export's GlobalId
 *  happens to be, and is rebuilt on every model import (Lesson 490, twin course). */
type ElementBinding = {
  assetTag: string;
  globalId: string;
  /** Which model export this binding was reconciled against. */
  modelVersion: string;
};

function toRegisterRow(c: CobieComponent, binding: ElementBinding | undefined) {
  const tag = c.assetTag ?? binding?.assetTag;
  if (!tag) {
    // The failure this lesson is about: a component with no durable link to
    // its element. It still becomes a register row — but the connection to
    // the model is now a manual job.
    return { tag: null, name: c.name, assetClass: c.typeName, parent: c.space, linkStatus: 'unlinked' as const };
  }
  return {
    tag,
    name: c.name,
    assetClass: c.typeName,
    parent: c.space,
    globalId: binding?.globalId,
    linkStatus: 'linked' as const,
  };
}
```

```tradeoff
question: "Carry the handover link as an asset tag written into the model, or as a separate tag-to-GlobalId binding table?"
sides:
  - name: "Tag as a shared parameter in the model"
    wins_when:
      - signal: "the organisation can mandate the parameter in the project's BIM execution plan and check it on delivery — it is contractually enforceable before handover"
      - signal: "the model will be handed back to the same organisation for future phases, so the parameter is maintained by whoever edits the model"
      - signal: "downstream tools (the viewer, the twin) can read a property but cannot easily consume an external mapping table"
  - name: "Separate binding table, reconciled on import"
    wins_when:
      - signal: "the authoring tool or the modelling supplier will not reliably carry a custom parameter, measured by inspecting two actual exports"
      - signal: "the register already runs a model-import reconciliation job for live data, so the binding table is one more output of a process that exists"
      - signal: "the organisation does not control the model and cannot mandate anything inside it"
```

## When to Use
- At every project handover, as the step that turns the delivered data set into register rows
- When writing a BIM execution plan or employer's information requirements — the tag-carrying mechanism is decided here, before modelling starts
- When a register was populated from a handover with no element link, and the cost of reconnecting it is now being estimated
- Before a refurbishment or a twin project, which both assume the register-to-model link exists and is current

## Common Mistakes
- **Keying the register on the `GlobalId`** — the next model re-export regenerates them and the register's key is now orphaned (`#433`)
- **Trusting COBie names as the link** — a name is not a durable reference to a geometric element, and names get edited
- **Deferring the binding until after the modelling team has left** — it is the one artefact that cannot be reconstructed without them
- **No model version on the binding** — after a re-export nothing can say which model a given tag-to-GlobalId pair was true of
- **Assuming the model and register stay in sync** — they diverge from handover onward by design; the link is what lets them be compared, not kept identical
- **One-way population with no verification pass** — a register built from a handover with unlinked rows looks complete and is missing exactly the connection that made the model worth delivering

## Further Reading
- [buildingSMART COBie documentation](https://www.thenbs.com/knowledge/what-is-cobie) — the sheet structure (`Component`, `Type`, `Space`, `Floor`) a register is populated from, with the version stated
- [Lesson 433](/courses/bim-ifc-data-models/433_globalid_the_ifc_guid) — why the `GlobalId` is unique-in-file but not export-stable, and how to test a given exporter
- [ISO 19650-1 catalogue page](https://www.iso.org/standard/68078.html) — the information-management framework that places handover data requirements in the project lifecycle; number and scope only

```recall
- q: "What link is made at handover, and why can it not be recreated cheaply later?"
  must:
    - "the link between each register row and the model element it came from"
    - "it is made once, from the delivery, then the register and model diverge permanently"
    - "recreating it means someone walking the site with both in hand"

- q: "Why is the GlobalId a poor carrier for that link, and what are the alternatives?"
  must:
    - "the GlobalId is unique within a file but often regenerated on re-export (Lesson 433)"
    - "an organisation-controlled tag written into the model as a shared parameter"
    - "or a tag-to-GlobalId binding table reconciled on every model import"

- q: "What does COBie provide for handover, and what does it not?"
  must:
    - "a structured delivery — Component, Type, Space, Floor mapping to rows, classes and the tree"
    - "its keys are names, which are not a durable link to a geometric element"
    - "the tag-to-element binding has to be added on top and verified before the modelling team leaves"
```
