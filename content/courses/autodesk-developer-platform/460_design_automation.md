# 460. Design Automation: The Revit API Without Revit on Your Desktop

## What It Is
**Mode: headless.** The same Revit API as lessons 456-459, running on Autodesk's infrastructure with no user, no interface and no machine of yours involved.

The model is a job queue, and it has three named pieces. An **AppBundle** is your compiled add-in, uploaded. An **Activity** is a declaration of what one run does: which AppBundle to load, which engine version to run it against, and what files go in and come out. A **WorkItem** is one execution of an Activity with concrete input and output URLs. You post a WorkItem, it queues, it runs, and you collect the result from where you told it to write.

What changes about the code is smaller than people expect and larger where it matters. The API is the same, so `FilteredElementCollector` and `Transaction` work exactly as before. What is gone is everything interactive: no dialogs, no `TaskDialog`, no selection, no `ActiveUIDocument`. Anything that would wait for a person is either removed or it hangs the job until the timeout kills it. Configuration that an add-in would ask for arrives instead as a **JSON input parameter** the Activity declares.

The operational shape is a build server, and the consequences follow from that. Runs are **time-limited**, so a job that is fine interactively can be killed at a boundary you did not set. Output is files at URLs, so anything you want out has to be written to one. And the **engine version is pinned in the Activity**, which means an engine upgrade is a deliberate change to a declaration rather than something that happens to you — the pinning idea Lesson 468 generalises.

There is no proof block in this lesson, and there cannot be: running it requires Revit on Autodesk's infrastructure and a job queue, neither of which is deterministic or available to a build.

```quiz
- q: "What in a working desktop add-in has to change before it can run as a Design Automation job?"
  anchor: "What is gone is everything interactive"
  options:
    - text: "The API calls, which have headless equivalents"
      correct: false
      why: "The API is the same. That is the point of Design Automation."
    - text: "Everything interactive — dialogs, selection, ActiveUIDocument — replaced by declared JSON input"
      correct: true
      why: "Anything that waits for a person hangs until the run's time limit kills it."
    - text: "The transaction model, since there is no undo stack"
      correct: false
      why: "Transactions work unchanged; they are how the model is modified, not how undo is presented."

- q: "Where is the Revit engine version decided?"
  anchor: "the **engine version is pinned in the Activity**"
  options:
    - text: "By the service, which always runs the latest"
      correct: false
      why: "Then an engine upgrade would arrive without warning — which is what the pinning avoids."
    - text: "In the Activity, so an upgrade is a deliberate edit to a declaration"
      correct: true
      why: "The same pinning argument Lesson 468 makes for vendor APIs generally."
    - text: "In the AppBundle's manifest, alongside the entry class"
      correct: false
      why: "The bundle is the code. The Activity is the declaration of how it is run."
```

## Key Concepts
- **AppBundle**: your compiled add-in, uploaded to the service
- **Activity**: a declaration — which bundle, which engine version, which inputs and outputs
- **WorkItem**: one execution of an Activity with concrete input and output URLs
- **Same API, no interface**: `FilteredElementCollector` and `Transaction` unchanged; no dialogs, no selection, no `ActiveUIDocument`
- **Input is declared JSON**: what an add-in would ask a user for, an Activity declares as a parameter
- **Time-limited runs**: a job that is fine interactively can be killed at a limit you did not choose
- **Output is a file at a URL**: anything you want back has to be written to one
- **Engine version is pinned in the Activity**: upgrading is an edit, not an event

## Example Code
The entry point, which is the one piece of code that differs from a desktop add-in:

```csharp
// Revit 2025 API, Design Automation engine. No ActiveUIDocument and no
// TaskDialog: anything that waits for a person hangs the run until the limit.
public void HandleDesignAutomationReadyEvent(object sender, DesignAutomationReadyEventArgs e)
{
    Document doc = e.DesignAutomationData.RevitDoc;
    AuditOptions options = ReadDeclaredInput("params.json");
    using (Transaction t = new Transaction(doc, "Audit marks"))
    {
        t.Start();
        ApplyMarks(doc, options);
        t.Commit();
    }
    doc.SaveAs("result.rvt");
    e.Succeeded = true;
}
```

```typescript
// The client side, which is ordinary HTTP. Declared as types rather than
// imported from an SDK, because the shape is the lesson and an SDK version is
// a moving target.
type WorkItemStatus = 'pending' | 'inprogress' | 'success' | 'failed' | 'cancelled';

type WorkItem = { id: string; status: WorkItemStatus; reportUrl?: string };

/** The three terminal states are what a poller has to distinguish. Treating
 *  `failed` as "not yet" is how a client waits forever for a job that is over. */
export function isFinished(item: WorkItem): boolean {
  return item.status === 'success' || item.status === 'failed' || item.status === 'cancelled';
}

/** And the report URL is the only place the run's own log lives — a failed
 *  job's status says that it failed and never why. */
export function needsReport(item: WorkItem): boolean {
  return item.status === 'failed' && item.reportUrl !== undefined;
}
```

## When to Use
- Batch conversion, auditing or generation over many models, where nobody should have to open each one
- Work triggered by a system rather than a person — an upload, a schedule, a webhook (Lesson 466)
- When the organisation should not need a Revit installation per user for an automated task
- When a step in a pipeline has to be reproducible, where a pinned engine version is worth more than the latest one

## Common Mistakes
- **Leaving a dialog in the code path** — nothing shows it and nothing dismisses it, so the run consumes its whole time limit and is killed
- **Reading configuration from a file path that only exists on your machine** — input is declared on the Activity and arrives where the Activity says
- **Treating `failed` as "still running"** — a poller that only checks for `success` never stops, which is the same shape as Lesson 463's manifest trap
- **Ignoring the report URL** — the status says that a run failed and never why; the report is the only log there is
- **Assuming a desktop-length run will fit** — runs are time-limited, and the limit is not the one your workstation has
- **Letting the engine version float** — pinning it in the Activity is what makes a run today reproduce a run last month

## Further Reading
- [Design Automation overview](https://aps.autodesk.com/en/docs/design-automation/v3/developers_guide/overview/) — AppBundles, Activities and WorkItems, at the index rather than at an endpoint page
- [Revit API Developer's Guide (Revit 2025)](https://help.autodesk.com/view/RVT/2025/ENU/?guid=Revit_API_Revit_API_Developers_Guide_html) — the API that runs unchanged inside the job, version-stamped
- [Autodesk Platform Services documentation](https://aps.autodesk.com/developer/documentation) — where the surrounding services this job is usually wired into live

```recall
- q: "Name the three pieces of the Design Automation model."
  must:
    - "AppBundle — your compiled add-in, uploaded"
    - "Activity — a declaration of what a run does: bundle, engine version, inputs and outputs"
    - "WorkItem — one execution with concrete input and output URLs"

- q: "What survives from a desktop add-in and what does not?"
  must:
    - "the API survives — FilteredElementCollector and Transaction are unchanged"
    - "everything interactive goes: dialogs, selection, ActiveUIDocument"
    - "configuration arrives as declared JSON input instead of being asked for"

- q: "Give two operational consequences of the job-queue model."
  must:
    - "runs are time-limited, so a job fine interactively can be killed"
    - "output is a file at a URL — anything you want back has to be written to one"
    - "and the engine version is pinned in the Activity, so upgrading is a deliberate edit"
```
