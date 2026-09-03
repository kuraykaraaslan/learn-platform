# 463. Model Derivative: Translation Jobs, Polling, and the Manifest

## What It Is
**Mode: cloud.** A model in storage is a file. Making it queryable means asking the translation service to produce **derivatives** from it, and everything after that is reading one document carefully.

Translation is a **job**, not a request. You post a job naming the source URN and the output formats you want, the service accepts it, and it works asynchronously. What you get back immediately is an acknowledgement, not a result. You then poll the **manifest** for that URN until the outputs you need are ready.

The manifest is where the care is needed, because it is a **tree with a summary on top**. Each requested output is a derivative, each derivative can have children, and each node carries its own status. The top-level `status` summarises the job, and a job whose overall status reads as finished can contain a derivative that failed. Reading only the top-level field is how a broken output ships as a good one — the run below demonstrates it on a literal manifest.

Polling has a second trap, and it is about the question being asked. "Is the job done" and "is the output I need ready" are different questions, and the second one has **more than two answers**: ready, failed, still working, and never requested. A poller with a boolean return collapses "failed" and "never requested" into "not yet" and waits for something that will never happen.

*(The manifest's field names are a vendor data model and can change. Checked 2026-09; the current shape is in the service documentation, and Lesson 468 is about designing so a change is absorbed in one place.)*

```quiz
- q: "A manifest's top-level status reads `success`. Is every requested output usable?"
  anchor: "a job whose overall status reads as finished can contain a derivative that failed"
  options:
    - text: "Yes — that is what the top-level status means"
      correct: false
      why: "It summarises the job. The run below shows a `success` manifest containing a failed derivative."
    - text: "No — it is a summary, and per-derivative status has to be checked"
      correct: true
      why: "The manifest is a tree, and the failure is per node."
    - text: "Only if `progress` also reads `complete`"
      correct: false
      why: "Progress is about completion, not about correctness. Both can read finished with a failed child underneath."

- q: "Why is a boolean the wrong return type for 'is my output ready'?"
  anchor: "**more than two answers**: ready, failed, still working, and never requested"
  options:
    - text: "It is not — the caller only needs to know whether to proceed"
      correct: false
      why: "The caller also needs to know whether to keep waiting, and a boolean cannot say."
    - text: "Because `failed` and `never requested` both collapse into `false`, and a poller then waits forever"
      correct: true
      why: "Four states, one of which means stop and one of which means you asked the wrong question."
    - text: "Because the manifest is a tree and a boolean cannot represent one"
      correct: false
      why: "A boolean can summarise a tree. What it cannot do is distinguish the reasons for `false`."
```

## Key Concepts
- **Translation is a job**: posted, acknowledged, worked asynchronously
- **Derivative**: one requested output — the queryable artefact everything downstream reads
- **Manifest**: the job's status document, addressed by the source URN
- **It is a tree**: derivatives have children, and every node carries its own status
- **Top-level status is a summary**: a finished job can contain a failed derivative
- **Four readiness states**: ready, failed, pending, never requested
- **Polling needs a stop condition on failure**, not just on success
- **Re-translating replaces the derivatives** for that URN, which matters when something downstream cached them

## Example Code
A literal manifest, and the two ways of reading it:

```typescript run
// the lesson is about is how to READ this document, and reading it is the part
// that goes wrong.
type Derivative = {
  outputType: string;
  status: string;
  progress?: string;
  role?: string;
  children?: Derivative[];
};

type Manifest = {
  type: 'manifest';
  urn: string;
  status: string;
  progress: string;
  derivatives: Derivative[];
};

const MANIFEST: Manifest = {
  type: 'manifest',
  urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6cml2ZXJzaWRlLWRlcG90L2RlcG90LWwxLnJ2dA',
  status: 'success',
  progress: 'complete',
  derivatives: [
    {
      outputType: 'svf2',
      status: 'success',
      children: [
        { outputType: 'svf2', role: 'graphics', status: 'success' },
        { outputType: 'svf2', role: 'thumbnail', status: 'success' },
      ],
    },
    {
      outputType: 'obj',
      status: 'failed',
      children: [{ outputType: 'obj', role: 'graphics', status: 'failed' }],
    },
  ],
};

/** Every derivative in the tree, parents before children. A manifest is a
 *  TREE, and the top-level status is a summary of it — not a substitute. */
function flatten(nodes: Derivative[]): Derivative[] {
  return nodes.flatMap((d) => [d, ...flatten(d.children ?? [])]);
}

const all = flatten(MANIFEST.derivatives);

console.log(`top-level status: ${MANIFEST.status} (${MANIFEST.progress})`);
console.log('');
console.log('per derivative:');
for (const d of all) {
  console.log(`  ${(d.role ?? '(root)').padEnd(10)} ${d.outputType.padEnd(6)} ${d.status}`);
}
console.log('');

const failed = all.filter((d) => d.status === 'failed');
console.log(`derivatives that failed: ${failed.length}`);
console.log(`  ${failed.map((d) => `${d.outputType}/${d.role ?? 'root'}`).join(', ') || '(none)'}`);
console.log('');
console.log('The manifest says "success" at the top and carries a failed derivative below it.');
console.log('A caller that reads only the top-level status ships a broken output as a good one.');
console.log('');

/** The question worth asking: is the ONE output I need ready? Not "is the job
 *  done", which is a different and less useful question. */
function isReady(manifest: Manifest, outputType: string): boolean {
  return flatten(manifest.derivatives).some(
    (d) => d.outputType === outputType && d.status === 'success' && (d.children ?? []).every((c) => c.status === 'success')
  );
}

for (const want of ['svf2', 'obj', 'stl']) {
  console.log(`ready for "${want}": ${isReady(MANIFEST, want)}`);
}
console.log('');
console.log('"stl" is false because it was never requested — which is a different situation');
console.log('from "obj", which was requested and failed. A boolean cannot tell them apart,');
console.log('and a caller that treats both as "not yet" polls forever.');

/** So the honest return type distinguishes the three states the manifest can
 *  actually be in for a given output. */
type Readiness = 'ready' | 'failed' | 'pending' | 'not-requested';

function readiness(manifest: Manifest, outputType: string): Readiness {
  const matches = flatten(manifest.derivatives).filter((d) => d.outputType === outputType);
  if (matches.length === 0) return 'not-requested';
  if (matches.some((d) => d.status === 'failed')) return 'failed';
  if (matches.every((d) => d.status === 'success')) return 'ready';
  return 'pending';
}

console.log('');
for (const want of ['svf2', 'obj', 'stl']) {
  console.log(`readiness("${want}") = ${readiness(MANIFEST, want)}`);
}
```

The `readiness` function is four lines longer than the boolean and it is the difference between a poller that terminates and one that does not.

## When to Use
- Any workflow that turns an uploaded model into something queryable — which is every cloud workflow in this course
- When designing the polling loop, where the stop condition is "reached a terminal state" and not "succeeded"
- When a downstream consumer reports a missing output, where the manifest says whether it failed, is pending, or was never asked for
- When deciding what to request, since each output format is work the service does and time you wait for

## Common Mistakes
- **Reading only the top-level status** — it is a summary, and a failed child under a successful job ships as a good output
- **Polling for success only** — a failed job never becomes successful, so the loop runs until something else stops it
- **Treating "never requested" as "not yet"** — the job is finished and the output is not coming; the fix is to request it, not to wait
- **Polling on a tight interval** — the job takes as long as it takes, and the rate limits from Lesson 467 apply to the poll as much as to anything else
- **Caching a derivative reference across a re-translation** — re-translating replaces the derivatives, and a stored pointer to the old one goes stale silently
- **Assuming the manifest's field names are permanent** — they are a vendor data model, which is what Lesson 468's anti-corruption layer exists for

## Further Reading
- [Model Derivative overview](https://aps.autodesk.com/en/docs/model-derivative/v2/developers_guide/overview/) — the job model and the manifest, at the index rather than at an endpoint page
- [Autodesk Platform Services documentation](https://aps.autodesk.com/developer/documentation) — the service index, including the current output format list
- [RFC 9110 — HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc9110) — what an accepted-but-not-done response means, and why polling is the shape here

```recall
- q: "Describe the translation job model."
  must:
    - "you post a job naming the source URN and the output formats"
    - "the response is an acknowledgement, not a result — the work is asynchronous"
    - "you poll the manifest for that URN until the outputs you need are ready"

- q: "Why is the manifest's top-level status not enough?"
  must:
    - "the manifest is a tree — derivatives have children, each with its own status"
    - "the top-level status is a summary"
    - "a job reading `success` can contain a failed derivative, which then ships as a good output"

- q: "Name the four readiness states and the bug a boolean causes."
  must:
    - "ready, failed, pending, never requested"
    - "a boolean collapses failed and never-requested into 'not yet'"
    - "so the poller waits for something that will never happen"
```
