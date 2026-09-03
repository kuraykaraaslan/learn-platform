# 523. Shipping a Design Automation Bundle: Versions, Aliases, and Rollback

## What It Is
**Mode: headless.** Lesson 460 gives the job model — AppBundle, Activity, WorkItem — and stops exactly where the next question starts: the code compiles, so what is a *deploy*?

It is not the upload. Publishing assigns the bundle the next version number and changes nothing that runs; a job posted a second later still executes what it executed before. What decides that is an **alias**: a movable pointer at exactly one version. An Activity names a bundle through one, in a **qualified id** of the form `owner.Name+alias`, and a WorkItem names an Activity the same way. So **the alias move is the deploy, and the move back is the rollback** — the same act, at the same cost, because nothing about the old version stopped existing when the new one arrived.

The artifact is a build output rather than a source tree: a zip holding one `.bundle` folder, with `PackageContents.xml` at its root and a `Contents/` folder carrying the `.addin` manifest from Lesson 457 and the compiled assemblies. The package manifest points at the `.addin` by relative path, and that line is the whole join between "a folder of files" and "something the engine agrees to load".

Two consequences follow, and they are why packaging is worth a lesson of its own. Reproducibility is free, because a version stays addressable after newer ones exist: a run from March re-runs in September by naming the version instead of the alias. And **the ability to roll back is the ability to have not deleted the old version** — a tidy-up that prunes it has deleted the undo, which is the one operation an unattended job most needs.

One decision outlives every version and alias. The `owner` in a qualified id is the account's **nickname**, a globally unique namespace claimed once; changing it later means deleting every bundle and activity that account owns. It is picked at the lifetime of the account, not of the app.

*(Bundle layout, the qualified-id form and the nickname rule are vendor mechanics. Checked 2026-09. What is written here is the shape; the current call names are in the service's own index, because a lesson that spells out a request body rots on someone else's release schedule — Lesson 468's argument, applied to this course.)*

```quiz
- q: "You publish version 7 of a bundle. Which jobs now run version 7?"
  anchor: "Publishing assigns the bundle the next version number and changes nothing that runs"
  options:
    - text: "Every job posted after the upload finishes"
      correct: false
      why: "Then an upload would be a deploy, and there would be nothing to stage or roll back with."
    - text: "None, until an alias is pointed at it"
      correct: true
      why: "The version is addressable, but no Activity names it yet — activities name aliases."
    - text: "Only jobs whose Activity was republished afterwards"
      correct: false
      why: "Republishing an Activity makes a new Activity version, which is also not referenced until an alias moves."

- q: "A bundle you deployed an hour ago is producing wrong output. What is the cheapest correct response?"
  anchor: "the move back is the rollback"
  options:
    - text: "Fix the code and publish a new version"
      correct: false
      why: "That is a fix-forward: it takes a build, and until it lands the wrong output keeps being produced."
    - text: "Move the alias back to the previous version"
      correct: true
      why: "It is the same act as the deploy, and the previous version is still there — unless it was deleted."
    - text: "Delete the bad version so nothing can run it"
      correct: false
      why: "Deleting breaks whatever still points at it and still leaves the alias to move; the move is the fix."

- q: "A deploy script uploads a bundle and then always points `prod` at whatever it just uploaded. What has been lost?"
  anchor: "alias that is re-pointed by the same script that uploads is a synonym for *newest*"
  options:
    - text: "Nothing — that is what continuous deployment means"
      correct: false
      why: "Continuous deployment still promotes a build that passed something; this promotes every build unconditionally."
    - text: "The upgrade decision — the alias now means \"newest\", and no staged version exists to test or fall back to"
      correct: true
      why: "The indirection is still there mechanically, but nobody is using it to decide anything."
    - text: "Reproducibility, since old versions are overwritten"
      correct: false
      why: "Old versions still exist and stay addressable. What is gone is the choice of when to move to a new one."
```

## Key Concepts
- **A bundle is a build artifact** — one `.bundle` folder, `PackageContents.xml` at its root, `Contents/` with the `.addin` and the assemblies
- **Publishing is two steps** — declare a version, then upload the zip to the target the service hands back; the version is assigned, not chosen
- **An alias is a movable pointer** at exactly one version, and every version stays addressable after it
- **The qualified id `owner.Name+alias`** is how an Activity names a bundle and a WorkItem names an Activity
- **The alias move is the deploy** — and it is the only act that changes what a job runs
- **Rollback is the same move, backwards**, which is why deleting old versions deletes the undo
- **The engine is pinned in the Activity** (Lesson 460), so an engine upgrade is a new Activity version plus an alias move — reviewable, and revertible the same way
- **The nickname is a namespace claimed once** — changing it means deleting every bundle and activity the account owns
- **Staging is an alias, not an environment**: a second pointer at the same versions is what makes a smoke run possible before production moves

## Example Code
The package manifest, which is the file that makes a zip a bundle. It is stamped for one Revit series on purpose — a bundle built against one API version and run on another fails inside a job, not at publish time:

```xml
<?xml version="1.0" encoding="utf-8"?>
<ApplicationPackage SchemaVersion="1.0" ProductType="Application"
                    Name="DepotTools" AppVersion="1.0.0">
  <CompanyDetails Name="Depot" />
  <Components Description="Revit 2025">
    <RuntimeRequirements OS="Win64" Platform="Revit" SeriesMin="R2025" SeriesMax="R2025" />
    <!-- Relative path into Contents/, and the .addin from Lesson 457 is what
         the engine actually loads. An absolute path here works on exactly one
         machine, which is never the one the job runs on. -->
    <ComponentEntry AppName="DepotTools" ModuleName="./Contents/DepotTools.addin" />
  </Components>
</ApplicationPackage>
```

And the part worth simulating, because it is a pointer structure and not an API call:

```typescript run
// The service is someone else's, so what is modelled here is only the structure
// it hands you — versions, aliases, and the qualified id that reads one. The
// version numbers below are this model's; the shape is the lesson.

type Version = number;

/** One publishable object — a bundle or an activity. Every version ever
 *  uploaded stays addressable; an alias points at exactly one of them. */
type Registry = { name: string; versions: Version[]; aliases: Record<string, Version> };

const bundle: Registry = { name: 'DepotTools', versions: [], aliases: {} };

/** Publishing appends a version and touches no alias — which is the whole
 *  point: nothing running today can notice that it happened. */
function publish(reg: Registry): Version {
  const next = (reg.versions.at(-1) ?? 0) + 1;
  reg.versions.push(next);
  return next;
}

/** The deploy. Moving an alias is the only act that changes what a job runs. */
function moveAlias(reg: Registry, alias: string, to: Version): void {
  if (!reg.versions.includes(to)) throw new Error(`no version ${to} to point ${alias} at`);
  reg.aliases[alias] = to;
}

/** What a WorkItem posted right now would execute: resolving `owner.Name+alias`
 *  is this lookup and nothing else. */
function resolve(reg: Registry, alias: string): Version | undefined {
  return reg.aliases[alias];
}

type Step = { what: string; kind: 'publish' | 'deploy'; act: () => void };

const steps: Step[] = [
  { what: 'publish', kind: 'publish', act: () => void publish(bundle) },
  { what: 'point test at v1', kind: 'deploy', act: () => moveAlias(bundle, 'test', 1) },
  { what: 'point prod at v1', kind: 'deploy', act: () => moveAlias(bundle, 'prod', 1) },
  { what: 'publish', kind: 'publish', act: () => void publish(bundle) },
  { what: 'point test at v2', kind: 'deploy', act: () => moveAlias(bundle, 'test', 2) },
  { what: 'publish', kind: 'publish', act: () => void publish(bundle) },
  { what: 'point test at v3', kind: 'deploy', act: () => moveAlias(bundle, 'test', 3) },
  { what: 'point prod at v3', kind: 'deploy', act: () => moveAlias(bundle, 'prod', 3) },
  { what: 'v3 is wrong: point prod back', kind: 'deploy', act: () => moveAlias(bundle, 'prod', 1) },
];

const COL = (what: string, versions: string, test: string, prod: string, runs: string) =>
  `${what.padEnd(31)}${versions.padStart(8)}${test.padStart(6)}${prod.padStart(6)}   ${runs}`;

console.log(COL('step', 'versions', 'test', 'prod', 'depot.DepotTools+prod runs'));
let prodMovedByAPublish = 0;
for (const step of steps) {
  const before = resolve(bundle, 'prod');
  step.act();
  const after = resolve(bundle, 'prod');
  if (step.kind === 'publish' && before !== after) prodMovedByAPublish++;
  console.log(
    COL(
      step.what,
      String(bundle.versions.length),
      String(resolve(bundle, 'test') ?? '-'),
      String(after ?? '-'),
      after === undefined ? 'nothing — no alias yet' : `v${after}`
    )
  );
}

const publishes = steps.filter((s) => s.kind === 'publish').length;
console.log('');
console.log(`${publishes} publishes and ${steps.length - publishes} alias moves later:`);
console.log(`  production changed by a publish alone: ${prodMovedByAPublish}`);
console.log(`  versions still addressable for a re-run: ${bundle.versions.join(', ')}`);

// The same three publishes, with a script that re-points prod every time it
// uploads. Mechanically identical; operationally the opposite.
const floating: Registry = { name: 'DepotTools', versions: [], aliases: {} };
let unreviewed = 0;
for (let i = 0; i < publishes; i++) {
  const before = resolve(floating, 'prod');
  moveAlias(floating, 'prod', publish(floating));
  if (before !== resolve(floating, 'prod')) unreviewed++;
}
console.log(`  same history with the alias tied to the upload: ${unreviewed} production changes,`);
console.log('  none of them decided separately from the build that caused them');

// Rollback cost, which is where the indirection pays. An Activity pins its
// engine, so a shop supporting two Revit years has one Activity per year per
// operation — and each of them either names the alias, or names a version.
const activities = ['audit@2024', 'audit@2025', 'export@2024', 'export@2025'];
console.log('');
console.log('rolling back one bad bundle version:');
console.log('  activities naming the alias:    1 move');
console.log(
  `  activities naming a version:    ${activities.length} rewrites ` +
    `(${activities.join(', ')}), each a new Activity version, each then needing its own move`
);
```

The last column is the only one an operator ever sees, and it moves three times in nine steps: three publishes went by without production moving once, because a publish is not a deploy. An alias that is re-pointed by the same script that uploads is a synonym for *newest*, and a bundle whose old versions are pruned after each release has kept the vocabulary of rollback and thrown away the mechanism.

## When to Use
- Whenever more than one person can publish, which is the point at which "what is running right now" stops being answerable from memory
- For any job that runs unattended, where a bad version is discovered by its output rather than by someone watching it run
- When an output has to be explained months later — the version behind a run is the answer, and it is only available if versions were never pruned
- As the shape of a pipeline: build, publish a version, move `test`, run one real WorkItem against it, move `prod` — the alias pair is (#57)'s blue-green cutover with the service doing the routing
- Alongside (#56) when the smoke run is a canary rather than a test fixture, and (#60) when the promotion has to happen from CI rather than a laptop

## Common Mistakes
- **Treating the upload as the deploy** — the new version is addressable, but nothing references it until an alias moves; a release that "went out" and changed nothing is usually this
- **Re-pointing the alias in the script that publishes** — the alias stops being a decision and becomes a synonym for "newest", which is exactly the floating reference Lesson 468 pins against
- **Naming a version directly in an Activity** — reproducible, but a rollback becomes one rewrite per Activity instead of one move, and each rewrite is a new version that needs promoting in turn
- **Deleting old versions after a release** — the rollback target is the old version, so this trades a one-move undo for a rebuild under pressure
- **Zipping the build output instead of the bundle layout** — the service loads one `.bundle` folder with `PackageContents.xml` at its root, and a zip of a release directory gives it nothing to find
- **Assuming publish validates the bundle against the engine** — the Activity pins the engine, nothing compares your assemblies against it at upload, and the mismatch surfaces inside a run as a failure whose only explanation is the report
- **Planning to rename the nickname later** — it is a namespace claimed once, and changing it means deleting every bundle and activity the account owns

## Further Reading
- [Aliases and IDs](https://aps.autodesk.com/en/docs/design-automation/v3/developers_guide/aliases-and-ids) — the qualified id and what an alias points at, at the concept page rather than an endpoint
- [Design Automation overview](https://aps.autodesk.com/en/docs/design-automation/v3/developers_guide/overview/) — AppBundles, Activities and WorkItems, the model this lesson deploys into
- [Revit API Developer's Guide (Revit 2025)](https://help.autodesk.com/view/RVT/2025/ENU/?guid=Revit_API_Revit_API_Developers_Guide_html) — the API the packaged assemblies are built against, version-stamped
- [Autodesk Platform Services documentation](https://aps.autodesk.com/developer/documentation) — the service index, where the current publish and alias calls are described

```recall
- q: "What actually changes what a Design Automation job runs?"
  must:
    - "moving an alias — the pointer an Activity or WorkItem names"
    - "not the upload, which only makes a new version addressable"
    - "so the deploy and the rollback are the same act in opposite directions"

- q: "Why does deleting old bundle versions cost you something?"
  must:
    - "the rollback target is the previous version"
    - "with it gone, recovering means rebuilding and republishing under pressure"
    - "and a run from months ago can no longer be reproduced by naming its version"

- q: "What is in the zip, and what joins it to the engine?"
  must:
    - "one .bundle folder with PackageContents.xml at its root"
    - "a Contents/ folder holding the .addin manifest and the compiled assemblies"
    - "and the package manifest's relative path to that .addin is what the engine loads"
```
