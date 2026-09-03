# 455. The Autodesk Developer Surface: Add-in, Headless, and Cloud

## What It Is
"Writing Autodesk code" names three different jobs, and confusing them is the most common mistake a developer new to this surface makes. They share vocabulary, some of them share an API, and none of them share a runtime.

**In Revit** — a desktop add-in. Your code is a .NET assembly loaded into the running Revit process. It gets a live `Document`, it can read and modify the model, and every modification happens inside a `Transaction`. It is synchronous, it is single-threaded with respect to the model, and it only exists while Revit is open on someone's machine.

**Without Revit on your desktop** — Design Automation. The *same* Revit API, running headless on Autodesk's infrastructure as a queued job. You upload input, the job runs, you collect output. There is no user, no interface and no interactivity: the code is the same shape as an add-in and the operating model is a build server.

**About Revit, over HTTP** — Autodesk Platform Services. No Revit anywhere. You upload a file, a translation service converts it into a derivative, and you query that derivative's object tree and properties over ordinary HTTP. Nothing in the Revit API exists here; `FilteredElementCollector` is not something you can call from a web request, and the attempt to is the single clearest symptom of the confusion this lesson exists to remove.

The practical consequence is that "how do I read a parameter" has three different answers, and picking the wrong one is not a matter of style — it is code that cannot run. Every lesson in this course states which mode it is in, in its first paragraph.

*(APS was renamed at one point, and a great deal of published material still uses the former name; Lesson 465 gives it, once, for readers searching older writing.)*

```quiz
- q: "A web request needs the walls in a model. Can it call `FilteredElementCollector`?"
  anchor: "`FilteredElementCollector` is not something you can call from a web request"
  options:
    - text: "Yes, with the right authentication token"
      correct: false
      why: "Authentication is not the obstacle. That class lives in the Revit API, which needs a Revit process; a web request has none."
    - text: "No — that class needs a running Revit process, and a web request queries a translated derivative instead"
      correct: true
      why: "Three modes, three runtimes. The cloud mode never runs Revit at all."
    - text: "Only if Design Automation is enabled on the account"
      correct: false
      why: "Design Automation runs the Revit API as a queued job, not inside your request. It is a third mode, not a bridge into the second."

- q: "What does Design Automation share with a desktop add-in, and what does it not?"
  anchor: "The *same* Revit API, running headless on Autodesk's infrastructure as a queued job"
  options:
    - text: "Neither the API nor the runtime — it is a cloud service like any other"
      correct: false
      why: "It shares the API exactly. That is what makes it worth distinguishing from the HTTP services."
    - text: "The same Revit API, but no user, no interface and no interactivity — it is a queued job"
      correct: true
      why: "Same code shape, build-server operating model."
    - text: "The same runtime, but a restricted subset of the API"
      correct: false
      why: "The runtime is the difference: headless, queued, and on someone else's machine."
```

## Key Concepts
- **Add-in mode**: a .NET assembly inside the running Revit process, with a live `Document` and `Transaction`-wrapped edits
- **Design Automation**: the same Revit API, headless, on Autodesk's infrastructure, as a queued job with file input and output
- **APS (cloud) mode**: HTTP services over a translated derivative; Revit is not running anywhere
- **The API boundary is a process boundary**: Revit API types exist only where a Revit process does
- **Derivative**: what a translation produces — the thing cloud mode queries instead of the model
- **Three answers to one question**: reading a parameter is a different operation in each mode
- **C# and VB.NET only, for two of the three**: the Revit API has no other binding, which is a constraint on modes one and two and irrelevant to mode three
- **Only the cloud half needs no Revit licence**: lessons 461-468 are usable by a reader who has never installed it

## Example Code
The same question — "what is this wall's fire rating" — in each mode. None of these run here; two of them cannot run anywhere but inside Revit:

```csharp
// MODE 1 — add-in. A live Document, inside the Revit process.
// Revit 2025 API. Read-only, so no Transaction is needed.
Wall wall = doc.GetElement(wallId) as Wall;
Parameter p = wall.get_Parameter(BuiltInParameter.FIRE_RATING);
string rating = p?.AsString();
```

```typescript
// MODE 3 — cloud. No Revit, no Document. An HTTP call against a derivative
// that a translation job produced earlier, and a shape you have to declare
// yourself because there is no SDK type to import here.
type PropertyGroup = Record<string, string | number | boolean>;
type ObjectProperties = { objectid: number; name: string; properties: Record<string, PropertyGroup> };

export function fireRating(props: ObjectProperties): string | null {
  const group = props.properties['Fire Protection'];
  const value = group?.['Fire Rating'];
  return typeof value === 'string' ? value : null;
}
```

Mode 2 is mode 1's code with mode 3's operating model: the C# above, packaged as a job, run on a machine you never see.

## When to Use
- Add-in: the work is interactive, the user is in Revit, and the result belongs in the open model
- Design Automation: the work is batch, repeatable and file-shaped — convert, audit, generate — and nobody needs to watch it
- Cloud: the consumer is a web application, a database, or another system, and the model is a source rather than a workspace
- All three: when a project spans them, which is common, and the boundary between them has to be a designed interface rather than an accident

## Common Mistakes
- **Calling Revit API types from a web service** — they need a Revit process, and no amount of configuration provides one; the symptom is a type that cannot be resolved and the cause is a mode confusion
- **Treating Design Automation as an interactive API** — it is a job queue, so a request that expects a synchronous answer is designing against the wrong shape
- **Assuming the derivative is the model** — it is a translation output, which Lesson 465 is entirely about
- **Choosing a mode by what is easiest to authenticate** — the mode is decided by where the work has to happen, and authentication follows from it
- **Writing an add-in for work that has no user** — an add-in requires someone with Revit open, which is a deployment constraint disguised as a technical choice
- **Assuming all three modes see the same data** — a translated derivative carries what the translator chose to carry, which is a subset with its own rules

## Further Reading
- [Autodesk Platform Services documentation](https://aps.autodesk.com/developer/documentation) — the index for every cloud service in this course; deliberately the index rather than a deep page, because deep pages move
- [Revit API Developer's Guide (Revit 2025)](https://help.autodesk.com/view/RVT/2025/ENU/?guid=Revit_API_Revit_API_Developers_Guide_html) — the desktop API, version-stamped
- [Design Automation overview](https://aps.autodesk.com/en/docs/design-automation/v3/developers_guide/overview/) — what a headless Revit job actually is
- [C# documentation](https://learn.microsoft.com/en-us/dotnet/csharp/) — the only language the first two modes accept, alongside VB.NET

```recall
- q: "Name the three modes and what each one runs on."
  must:
    - "add-in — a .NET assembly inside a running Revit process, with a live Document and Transactions"
    - "Design Automation — the same Revit API headless, as a queued job on Autodesk infrastructure"
    - "APS cloud — HTTP over a translated derivative, with no Revit running anywhere"

- q: "Why can a web request not call FilteredElementCollector?"
  must:
    - "it is a Revit API type and needs a Revit process"
    - "cloud mode has none — it queries a derivative a translation produced"
    - "authentication is not the obstacle; the runtime is"

- q: "Which of the three modes needs no Revit licence, and what follows for this course?"
  must:
    - "the cloud half — lessons 461-468"
    - "add-in and Design Automation both need the Revit API, which is C#/VB.NET only"
    - "each lesson states its mode in the first paragraph"
```
