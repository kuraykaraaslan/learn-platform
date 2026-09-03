# 457. Revit Add-ins: Commands, Applications, and the Add-in Manifest

## What It Is
**Mode: add-in.** This lesson is about how your assembly gets loaded at all, which is a deployment question before it is a coding one.

Revit loads add-ins from a **manifest**: a small XML file in a known directory, naming your assembly, the class inside it to instantiate, and a GUID that identifies the add-in. Revit does not scan for DLLs. If the manifest is missing, malformed, or points at a path that is not there, the add-in does not appear and no error surfaces where a developer is looking.

There are two entry-point shapes and choosing between them is the design decision. `IExternalCommand` is a **command**: one class, one `Execute` method, invoked when the user clicks a ribbon button. It runs, it returns a result, it is gone. `IExternalApplication` is an **application**: it gets `OnStartup` when Revit launches and `OnShutdown` when it closes, which is where a ribbon panel is built, event handlers are subscribed and long-lived state lives. Most real add-ins are one application that registers several commands.

The manifest is also where the **loading policy** lives — whether the add-in loads for every user or only the one who installed it is decided by which directory the manifest sits in, and whether it loads at all is decided by Revit's own add-in security prompt. Neither is something your code can override, which makes both a support question rather than a bug.

The last piece worth knowing before your first deployment: **the assembly is loaded into Revit's process and shares its dependencies**. Reference a library Revit already loads at a different version and you get a conflict that your development machine may not reproduce.

```quiz
- q: "Your DLL is built and copied and the add-in does not appear. What is the first thing to check?"
  anchor: "Revit does not scan for DLLs"
  options:
    - text: "That the class implements IExternalCommand correctly"
      correct: false
      why: "Worth checking second. Nothing gets as far as the class if the manifest did not point at the assembly."
    - text: "The manifest — its presence, its directory, and whether the assembly path in it resolves"
      correct: true
      why: "Revit loads from the manifest, and a missing or wrong one produces no error where you are looking."
    - text: "The Revit version, since assemblies are version-specific"
      correct: false
      why: "A real constraint and a different symptom — a version mismatch usually surfaces as a load error, not as silence."

- q: "When would you implement `IExternalApplication` rather than `IExternalCommand`?"
  anchor: "it gets `OnStartup` when Revit launches"
  options:
    - text: "When the add-in needs to modify the model, since commands are read-only"
      correct: false
      why: "Commands modify the model routinely. The distinction is lifetime, not capability."
    - text: "When you need a ribbon panel, event subscriptions, or state that outlives one invocation"
      correct: true
      why: "OnStartup and OnShutdown are what a command has no equivalent for."
    - text: "When the add-in has more than one command"
      correct: false
      why: "Usually true in practice, and it is a consequence rather than the reason — the ribbon that hosts them is what needs startup."
```

## Key Concepts
- **Add-in manifest**: an XML file in a known directory naming the assembly, the entry class and a GUID
- **No DLL scanning**: Revit loads what the manifest declares and nothing else
- **`IExternalCommand`**: one invocation, one `Execute`, no lifetime beyond it
- **`IExternalApplication`**: `OnStartup` and `OnShutdown` — ribbon construction, event subscription, long-lived state
- **`Result.Succeeded` / `Failed` / `Cancelled`**: what a command returns, and `Cancelled` is what a user-abandoned dialog should return
- **Manifest directory decides scope**: per-user or all-users installation is a path, not a setting in your code
- **Add-in security prompt**: Revit asks the user whether to load an unsigned add-in, and your code cannot answer for them
- **Shared process, shared dependencies**: a library version conflict with Revit's own is a real and machine-specific failure

## Example Code
The manifest, which is where loading actually starts:

```xml
<?xml version="1.0" encoding="utf-8"?>
<RevitAddIns>
  <AddIn Type="Application">
    <Name>Depot Tools</Name>
    <Assembly>C:\ProgramData\Autodesk\Revit\Addins\2025\DepotTools\DepotTools.dll</Assembly>
    <AddInId>9c9f1b7e-4c1a-4f3f-9a1d-6a6f1d2b8a41</AddInId>
    <FullClassName>DepotTools.DepotApplication</FullClassName>
    <VendorId>DEPOT</VendorId>
  </AddIn>
</RevitAddIns>
```

The application entry point, which builds the ribbon the commands live on:

```csharp
// Revit 2025 API. OnStartup runs once, before any document is open — so it
// must not assume one exists.
public class DepotApplication : IExternalApplication
{
    public Result OnStartup(UIControlledApplication app)
    {
        RibbonPanel panel = app.CreateRibbonPanel("Depot Tools");
        panel.AddItem(new PushButtonData("AuditMarks", "Audit Marks",
            Assembly.GetExecutingAssembly().Location, "DepotTools.AuditMarksCommand"));
        return Result.Succeeded;
    }

    public Result OnShutdown(UIControlledApplication app) => Result.Succeeded;
}
```

And the command the button points at:

```csharp
// Revit 2025 API. Cancelled, not Failed, when the user backs out — Failed
// puts an error dialog in front of someone who did nothing wrong.
public class AuditMarksCommand : IExternalCommand
{
    public Result Execute(ExternalCommandData data, ref string message, ElementSet elements)
    {
        Document doc = data.Application.ActiveUIDocument.Document;
        if (!Confirm(doc)) return Result.Cancelled;
        message = Audit(doc);
        return Result.Succeeded;
    }
}
```

## When to Use
- Every desktop add-in, since the manifest is not optional and there is no other loading path
- When choosing an entry-point shape: a command for a single action, an application for anything with a ribbon or an event subscription
- When packaging for other people, where the manifest directory decides who gets it and the security prompt decides whether they can use it
- When a dependency is needed, where "does Revit already load this, and at what version" comes before "does it do what I want"

## Common Mistakes
- **Assuming Revit will find the assembly** — it loads exactly what a manifest names, and a missing manifest fails silently
- **Hard-coding a development path in a shipped manifest** — it works on the machine that built it and nowhere else
- **Returning `Result.Failed` when the user cancelled** — that puts an error dialog in front of someone who did nothing wrong; `Cancelled` exists for this
- **Assuming a document is open in `OnStartup`** — it runs before any model is loaded, so anything touching a document belongs elsewhere
- **Reusing an `AddInId` GUID across add-ins** — it identifies the add-in, and a duplicate makes two of them one as far as Revit is concerned
- **Referencing a library Revit already loads** — the versions have to agree in one process, and the conflict may not reproduce on your machine

## Further Reading
- [Revit API Developer's Guide (Revit 2025)](https://help.autodesk.com/view/RVT/2025/ENU/?guid=Revit_API_Revit_API_Developers_Guide_html) — the add-in manifest schema, entry-point interfaces and loading rules, version-stamped
- [Revit API documentation index](https://www.revitapidocs.com/) — `IExternalCommand`, `IExternalApplication` and the ribbon classes
- [C# documentation](https://learn.microsoft.com/en-us/dotnet/csharp/) — assembly loading and the reflection call the ribbon button uses to find a command class

```recall
- q: "How does Revit decide what to load, and what happens when that goes wrong?"
  must:
    - "from an add-in manifest — an XML file in a known directory"
    - "it names the assembly, the entry class and a GUID; Revit does not scan for DLLs"
    - "a missing or wrong manifest produces silence rather than an error"

- q: "Distinguish the two entry-point interfaces."
  must:
    - "IExternalCommand — one Execute per invocation, no lifetime beyond it"
    - "IExternalApplication — OnStartup and OnShutdown, for ribbons, events and long-lived state"
    - "OnStartup runs before any document is open"

- q: "Name two deployment facts your code cannot override."
  must:
    - "the manifest's directory decides per-user versus all-users scope"
    - "Revit's add-in security prompt is answered by the user, not by the add-in"
    - "and the assembly shares Revit's process, so a dependency version conflict is real"
```
