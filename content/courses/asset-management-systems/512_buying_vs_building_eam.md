# 512. Buying vs Building an EAM/CMMS: What the Data Model Decides

## What It Is
Every organisation with assets eventually asks whether to buy an EAM or CMMS product or build one. The question is usually argued on features and price, and it should be argued on the **data model** — because the register, the work-order history and the condition history outlive every application that has ever held them, and the real cost of the decision is how well the next migration goes.

An EAM (Enterprise Asset Management) product covers the whole asset lifecycle: acquisition, register, maintenance, spares, cost, disposal, often with a mobile app and an accounting integration. A CMMS (Computerised Maintenance Management System) is the maintenance slice of that — work orders, PPM schedules, a parts catalogue. The distinction matters less than what both share: an opinionated data model you adopt, and an export format you are betting your history on.

Buying wins when your asset data fits a **standard shape** — a hierarchy, tags, work orders, PPM schedules, condition scores — which is most organisations, because that shape is standard for a reason. You get a mobile app, a reporting suite and a support contract without building any of it, and the vendor's model has absorbed edge cases you have not thought of yet. The bet is on the vendor's export: can you get your register, your full work-order history and your attachments out, in a documented format, on demand and at exit.

Building wins when your assets genuinely do not fit — a linear network with dynamic segmentation, a fleet with regulatory inspection regimes no product models, assets whose identity rules are unusual (Lesson 506) — or when the asset system has to be a component of a larger platform rather than a system of record beside it. The cost is not the first version; it is the mobile app, the offline sync (Lesson 494, field course), the reporting, the permissions, and maintaining all of that for as long as the assets exist, which is decades.

The middle path most organisations actually take: **buy the CMMS, own the register**. The register — the asset list, the hierarchy, the tags, the criticality — lives in a system you control, and the CMMS consumes it. That keeps the one data set that is genuinely yours out of a vendor's model, while not rebuilding the work-order tooling that every vendor has already built well.

```quiz
- q: "On what basis should the buy-vs-build decision for an asset system primarily be argued?"
  anchor: "it should be argued on the **data model**"
  options:
    - text: "The five-year total cost of ownership"
      correct: false
      why: "Cost matters, but it is downstream of the data model — which determines migration cost, the largest and most uncertain line."
    - text: "The data model, because the asset and history data outlives every application and the real cost is the next migration"
      correct: true
      why: "Features are matched across products; the data you can get out at exit is what varies and what you live with."
    - text: "Whether the team has capacity to build it this quarter"
      correct: false
      why: "Capacity is a real constraint but a poor basis — it changes, and the data model decision does not."

- q: "When does building an asset system genuinely win over buying?"
  anchor: "when your assets genuinely do not fit"
  options:
    - text: "When the organisation wants to avoid a support contract"
      correct: false
      why: "Building creates a permanent internal support obligation that is usually larger than the contract avoided."
    - text: "When the assets do not fit a standard hierarchy/tag/work-order shape, or the asset data must be a component of a larger platform"
      correct: true
      why: "A linear network, an unusual identity regime, or a system-of-components requirement are the cases a product cannot absorb."
    - text: "Whenever the organisation has software engineers available"
      correct: false
      why: "Having builders does not make building correct — the standard shape is standard because it fits most cases well."
```

## Key Concepts
- **Argue the decision on the data model**, not the feature list — data outlives every application
- **The real cost is the next migration** — how cleanly the register and full history come out
- **EAM** covers the whole lifecycle; **CMMS** is the maintenance slice — both give you an opinionated model
- **Buy wins when the data fits the standard shape** — hierarchy, tags, work orders, PPM, condition — which is most cases
- **The buy bet is the vendor's export** — documented format, full history and attachments, available at exit
- **Build wins on genuine misfit** — linear networks, unusual inspection regimes, unusual identity rules, or a platform-component requirement
- **The build cost is not v1** — it is mobile, offline sync, reporting, permissions, maintained for the assets' whole life
- **The common middle path**: buy the CMMS, own the register in a system you control

## Example Code
No runtime here — the artefact is a checklist you run before the decision, and it is entirely about the data model:

```template
# Data-Model Due Diligence — Before the Buy-vs-Build Decision

## Getting the data out (the buy bet)
- [ ] Full asset register — hierarchy, tags, every attribute — exportable in a documented format, on demand, without vendor involvement
- [ ] Complete work-order history exportable, including closed and archived orders, not only an active window
- [ ] Exported records keep a stable key you can re-import against — not vendor-internal ids
- [ ] Attachments (photos, certificates, manuals) included in the export, not only referenced
- [ ] Condition / inspection history exportable with its dates and inspector fields intact
- [ ] Contract states the export format and an exit-assistance obligation, not only an uptime SLA

## Keeping what is yours
- [ ] The register can be maintained in a system you control and fed to the product, keeping the asset list out of the vendor model

## If you build
- [ ] Named owner and budget for the mobile app, the offline sync, the reporting suite and permissions — for the assets' whole life, not the first release
```

```tradeoff
question: "Buy an EAM/CMMS product, or build the asset system in-house?"
sides:
  - name: "Buy the product"
    wins_when:
      - signal: "the asset data fits a standard hierarchy / tag / work-order / PPM / condition shape — confirmed by mapping a real sample of your assets onto the product's model, not by demo"
      - signal: "the vendor's export produces the full register and complete work-order history in a documented format, tested during evaluation with a real extract"
      - signal: "the maintenance workflow (mobile, PPM scheduling, parts) is a large build you would otherwise carry forever, and the product's version already handles cases you have not hit"
  - name: "Build in-house"
    wins_when:
      - signal: "a real sample of assets does not map onto any evaluated product's model — a linear network, an inspection regime, or an identity rule the product cannot represent"
      - signal: "the asset system must be a component inside a larger platform, sharing identity and permissions, rather than a separate system of record"
      - signal: "the organisation can commit to maintaining the mobile app, offline sync, reporting and permissions for the assets' whole life, and has costed that rather than the first release"
```

## When to Use
- At the start of an asset-system procurement or a build proposal, before the feature comparison begins
- When a current product is being replaced — the export test on the *outgoing* system is the first task, and it tells you what the next contract must require
- When a build has been proposed — to price the whole-life obligation (mobile, sync, reporting, permissions) rather than the first version
- When deciding where the register lives, independent of the maintenance tooling — the buy-CMMS-own-register split is available even mid-contract

## Common Mistakes
- **Deciding on the feature matrix** — features converge across mature products; the export and the data model are what differ and what you live with
- **Not testing the export during evaluation** — "supports CSV export" is not the same as getting your full history out with stable keys and attachments
- **Naming products in the business case** — a product list is out of date within a year; the decision criteria are the data-model questions, which are not
- **Costing a build as its first release** — the mobile app, offline sync, reporting and permissions are the bulk of the cost and all of the ongoing cost
- **Putting the register inside the vendor model when you did not have to** — the asset list, hierarchy and criticality are the one data set that is genuinely yours
- **Treating "we have engineers" as a reason to build** — the standard shape fits most organisations, and a product has already absorbed the edge cases

## Further Reading
- [ISO 55000 catalogue page](https://www.iso.org/standard/83053.html) — what an asset management *system* is meant to do, independent of any product; number and scope only
- [buildingSMART COBie documentation](https://www.thenbs.com/knowledge/what-is-cobie) — a vendor-neutral interchange format worth requiring as an export target regardless of the product chosen
- [The Data Warehouse Toolkit — conformed dimensions](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/) — the general argument for owning your master data (here, the register) outside any one application

```recall
- q: "Why should buy-vs-build for an asset system be argued on the data model rather than features?"
  must:
    - "the register and history outlive every application that holds them"
    - "the real cost of the decision is how cleanly the next migration goes"
    - "features converge across products; the export and model are what differ"

- q: "When does buying win and when does building win?"
  must:
    - "buy: the data fits the standard hierarchy / tag / work-order / condition shape — most organisations"
    - "build: genuine misfit (linear network, unusual regime or identity) or a platform-component requirement"
    - "the build cost is the whole-life obligation — mobile, offline sync, reporting, permissions — not v1"

- q: "What is the common middle path and what does it protect?"
  must:
    - "buy the CMMS, own the register in a system you control"
    - "the asset list, hierarchy, tags and criticality stay out of the vendor model"
    - "without rebuilding the work-order tooling every vendor already has"
```
