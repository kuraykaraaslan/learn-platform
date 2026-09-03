# 468. Designing for Vendor API Churn: Pinning, Versions, Anti-Corruption Layer

## What It Is
**Mode: cloud, and the whole course.** Every fact in lessons 461-467 is somebody else's decision, and somebody else's decisions change. This lesson is about building so that when they do, the change lands in one place you chose rather than everywhere it happens to have spread.

The mechanism is an **anti-corruption layer**: a boundary where the vendor's vocabulary stops and yours starts. Inside it, manifests, derivatives, URNs and object ids; outside it, models, translations and assets. It is (#65)'s ports-and-adapters argument applied to a dependency you cannot change and cannot see coming. The test for whether you have one is mechanical: search your codebase for the vendor's type names and see how far from the boundary they reach.

**Pinning** is the second half. Anything the service versions — an API version, an engine version in a Design Automation Activity, a viewer release — is a value you should state explicitly rather than inherit. Floating on "latest" means an upgrade happens to you, at a time you did not choose, with no diff to review. Pinned, it is a line in a file, changed deliberately, in a commit that can be reverted.

Then there is what you cannot pin: **behaviour**. A rate limit tightens, a manifest gains a field, an error response changes its message. These are not versioned and no pin protects you. What does is not depending on them in the first place — the argument Lesson 467 makes about limits, and the reason this course states mechanisms and points at documentation for values.

Finally, **write the volatility down**. Every claim you build on that belongs to the vendor gets a date and a review date. An undated assumption becomes folklore in about six months; a dated one is a work item. This phase's own specification carries exactly such a table, for exactly this reason.

```quiz
- q: "What is the mechanical test for whether you have an anti-corruption layer?"
  anchor: "search your codebase for the vendor's type names and see how far from the boundary they reach"
  options:
    - text: "Whether there is a folder called `adapters`"
      correct: false
      why: "A folder is a hope. The question is where the vendor's vocabulary actually appears."
    - text: "How far the vendor's type names spread from the boundary"
      correct: true
      why: "If they are everywhere, the boundary is decorative — and the next change is everywhere too."
    - text: "Whether the vendor SDK is behind an interface"
      correct: false
      why: "An interface whose methods take and return vendor types has moved the coupling, not removed it."

- q: "Which risk does pinning an API version NOT address?"
  anchor: "Then there is what you cannot pin: **behaviour**"
  options:
    - text: "An endpoint being removed"
      correct: false
      why: "That is exactly what versioning addresses — a removal belongs to a new version."
    - text: "A rate limit tightening, or an error message changing"
      correct: true
      why: "Behaviour is not versioned. Nothing to pin, so the answer is not to depend on it."
    - text: "A response gaining a required field"
      correct: false
      why: "A breaking schema change is a version's job. A field gaining a new optional value is the unpinnable kind."
```

## Key Concepts
- **Anti-corruption layer**: a boundary where vendor vocabulary stops and yours starts — (#65) applied to a dependency you do not control
- **The test is a search**: how far vendor type names reach from the boundary
- **An interface over vendor types is not a boundary** — it relocates the coupling
- **Pin what is versioned**: API version, engine version, viewer release — explicitly, in a file
- **"Latest" means an upgrade you did not schedule**, with no diff and no revert
- **Behaviour cannot be pinned**: rate limits, error text, new fields — so do not build on them
- **Version your own contract too**: your API's consumers deserve the same protection you want from the vendor (#9)
- **Date every borrowed assumption**: undated becomes folklore; dated becomes a work item

## Example Code
The boundary, made concrete. The types on the left of this file are theirs and the types on the right are yours, and nothing outside it sees both:

```typescript
// ---- The vendor's shapes. Declared here, in one file, so that the day a
// ---- field is renamed there is exactly one place to change.
type VendorDerivative = { outputType: string; status: string; children?: VendorDerivative[] };
type VendorManifest = { urn: string; status: string; progress: string; derivatives: VendorDerivative[] };

// ---- Your shapes. Nothing here mentions a manifest, a derivative or a urn.
export type TranslationState = 'ready' | 'failed' | 'working' | 'not-requested';
export type ModelView = { modelId: string; state: TranslationState };

/** The one function that speaks both languages. Everything the application
 *  does downstream is expressed in TranslationState — so a change to the
 *  vendor's manifest is a change to this function and nowhere else. */
export function toModelView(modelId: string, manifest: VendorManifest, wantedOutput: string): ModelView {
  const matching = flattenDerivatives(manifest.derivatives).filter((d) => d.outputType === wantedOutput);
  if (matching.length === 0) return { modelId, state: 'not-requested' };
  if (matching.some((d) => d.status === 'failed')) return { modelId, state: 'failed' };
  if (matching.every((d) => d.status === 'success')) return { modelId, state: 'ready' };
  return { modelId, state: 'working' };
}

function flattenDerivatives(nodes: VendorDerivative[]): VendorDerivative[] {
  return nodes.flatMap((d) => [d, ...flattenDerivatives(d.children ?? [])]);
}
```

And the pinning, which is a file rather than a habit:

```json
{
  "aps": {
    "authApiVersion": "v2",
    "modelDerivativeApiVersion": "v2",
    "designAutomationApiVersion": "v3",
    "viewerVersion": "7.104.0",
    "note": "Every value here is stated deliberately. Nothing floats on 'latest': an upgrade should be a commit with a diff, not an event."
  }
}
```

## When to Use
- At the start of any integration against a hosted API, when the boundary is cheap to draw and later it is not
- When a vendor change breaks something, where the size of the fix measures how good the boundary was
- When choosing a version, where explicit beats latest even when they are the same value today
- When recording an assumption you did not choose — a limit, a field name, a scope — which is what the dated table is for

## Common Mistakes
- **Letting vendor types into domain code** — the coupling then has no boundary, and the next change touches everything
- **An interface whose methods take vendor types** — that is a relocation, not a boundary, and it fails the search test
- **Floating on "latest"** — the upgrade arrives without a diff, at a time you did not choose, usually while you are doing something else
- **Pinning and never reviewing** — a pin without a review date is how a version goes out of support unnoticed
- **Building on unversioned behaviour** — error strings, timing, undocumented fields; nothing protects these, so do not depend on them
- **Keeping the volatility record in someone's head** — undated assumptions become folklore, and folklore is not reviewable

## Further Reading
- [Autodesk Platform Services documentation](https://aps.autodesk.com/developer/documentation) — the index, which is where a version is confirmed rather than remembered
- [RFC 9110 — HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc9110) — the parts of an HTTP contract that are defined, as against the parts that are just current behaviour
- [Design Automation overview](https://aps.autodesk.com/en/docs/design-automation/v3/developers_guide/overview/) — where an engine version is pinned in an Activity, the clearest example of the idea

```recall
- q: "What is an anti-corruption layer here, and how do you test for one?"
  must:
    - "a boundary where the vendor's vocabulary stops and yours starts"
    - "manifests, derivatives and urns inside; models, translations and assets outside"
    - "the test is a search: how far the vendor's type names reach from the boundary"

- q: "What does pinning protect against, and what does it not?"
  must:
    - "it protects against a versioned change arriving unscheduled — the upgrade becomes a commit with a diff"
    - "it does not protect against behaviour: rate limits, error text, new field values"
    - "behaviour is not versioned, so the answer is not to depend on it"

- q: "Why date every borrowed assumption?"
  must:
    - "an undated assumption becomes folklore in about six months"
    - "a dated one is a work item with a review date"
    - "the record is reviewable; someone's memory is not"
```
