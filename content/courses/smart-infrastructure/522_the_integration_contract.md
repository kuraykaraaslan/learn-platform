# 522. Designing the Integration Contract Before the Sensors Arrive

## What It Is
Every difficulty in this course — five ids for one asset, no shared clock, unit mismatches at the boundary, a public feed with its own duty — is cheaper to handle if it was decided *before* the first sensor was installed, and far more expensive after. The artefact that forces those decisions early is an **integration contract**: a short document, per source system, that states what the integration will receive, in what form, with what guarantees, and what happens when something is missing.

It is a contract in the sense that both sides sign up to it. The source-system owner commits to sending data that matches it; the integration commits to consuming exactly that and no more. Without it, every quirk — a naive timestamp, a renamed tag, a unit change in a firmware update — is discovered in production by whichever consumer hits it first, and the fix is a negotiation held under incident pressure.

The contract has a fixed set of sections because the failures are predictable. **Identity**: which id this source uses, whether it is stable, and how a change is communicated. **Time**: the clock, the zone, the format, and the ordering guarantee (causal, or "unknown within N seconds"). **Units and scale**: every field's unit, and whether it can change. **Delivery**: push or pull, frequency, batch size, and what a gap looks like. **Quality**: which checks the source runs before sending, and which the integration runs on receipt. **Change**: how a schema or semantic change is announced, and the notice period. **Failure**: what the integration does when the source is silent, and for how long before someone is told.

The contract is written against this course's earlier lessons — each section is one of them made concrete for one source. Writing it is the point at which "we'll integrate the SCADA system" turns into a list of specific, checkable commitments, and the point at which a missing commitment (nobody will tell us when a tag is renamed) becomes visible while it can still be fixed.

```quiz
- q: "Why write the integration contract before the sensors are installed rather than after?"
  anchor: "cheaper to handle if it was decided *before* the first sensor was installed, and far more expensive after"
  options:
    - text: "Because the contract is a legal requirement for procurement"
      correct: false
      why: "It may feature in procurement, but the reason is engineering cost: every undecided quirk is found later in production."
    - text: "Because every quirk left undecided is discovered in production by whichever consumer hits it first, and fixed under incident pressure"
      correct: true
      why: "Writing the contract forces the identity, time, unit, delivery, quality, change and failure decisions while they are cheap."
    - text: "Because sensors cannot be reconfigured once installed"
      correct: false
      why: "Some can, some cannot — but the contract is about the data interface, not the hardware."

- q: "What makes the integration contract a 'contract' rather than just documentation?"
  anchor: "both sides sign up to it"
  options:
    - text: "It is stored in a contract management system"
      correct: false
      why: "Storage is irrelevant. It is a contract because both parties commit to it."
    - text: "The source-system owner commits to sending data that matches it; the integration commits to consuming exactly that"
      correct: true
      why: "Each side has an obligation, and a change to the interface is a change to the contract, announced with notice."
    - text: "It is signed by a lawyer"
      correct: false
      why: "It is an engineering agreement between system owners, not a legal instrument."
```

## Key Concepts
- **Decide the hard things before the first sensor** — every one is cheaper early, expensive in production
- **The integration contract** is a short per-source document: what is received, in what form, with what guarantees, and the failure behaviour
- **Both sides commit** — the source sends what it says; the integration consumes exactly that
- **Without it, every quirk is found in production** by the first consumer to hit it, and fixed under pressure
- **Fixed sections, because the failures are predictable**: Identity, Time, Units and scale, Delivery, Quality, Change, Failure
- **Each section is an earlier lesson made concrete** for one source (515, 518, 516, 519, and this one)
- **Writing it turns "we'll integrate X" into checkable commitments** — and makes a missing commitment visible while it is cheap to add

## Example Code
The blank contract — one per source system:

```template
# Integration Contract — [Source System Name]

**Owner (source):** [name / team]
**Owner (integration):** [name / team]
**Version:** [n]   **Effective:** [date]   **Review:** [date]

## Identity
- **Id this source uses:** [e.g. RTU address, GIS feature id]
- **Stable?:** [yes / no — if no, describe when it changes]
- **Change notification:** [how the integration is told when an id changes, and how far ahead]
- **Canonical mapping owned by:** [the crosswalk — who maintains the rows for this source]

## Time
- **Clock:** [device / gateway / ingest — which one the timestamp marks]
- **Zone & format:** [e.g. UTC, RFC 3339 with offset]
- **Naive timestamps:** [rejected / accepted with assumed zone — state which]
- **Ordering guarantee:** [causal via Lamport/vector / none — order unknown within ___ seconds]

## Units and scale
| Field | Unit | Scale/offset | Can it change? |
|---|---|---|---|
| [field] | [unit] | [raw × ? + ?] | [yes/no] |

## Delivery
- **Direction:** [push / pull]   **Frequency:** [___]   **Batch size:** [___]
- **What a gap looks like:** [explicit "no data" marker / just absent rows]
- **Backfill:** [does the source re-send missed data, and for how long back]

## Quality
- **Checked by source before sending:** [range / completeness / none]
- **Checked by integration on receipt:** [list — see Lesson 519]
- **Failing record handling:** [withhold and flag / quarantine / reject]

## Change
- **Schema/semantic change announced via:** [channel]
- **Notice period:** [___]
- **Deprecation:** [how an old field is retired]

## Failure
- **Source silent:** integration treats values as stale after [___], alerts after [___]
- **Escalation:** [who is told, and how]
```

The same contract, filled for one source — the SCADA system feeding pump-station telemetry:

```template
# Integration Contract — SCADA Historian (Pump Stations)

**Owner (source):** Controls team
**Owner (integration):** Data platform team
**Version:** 3   **Effective:** 2026-01-15   **Review:** 2026-07-15

## Identity
- **Id this source uses:** RTU address (e.g. RTU-07)
- **Stable?:** No — re-survey and equipment swaps re-tag RTUs; last change March 2023
- **Change notification:** Controls team files a change ticket 10 working days ahead; integration closes the old crosswalk row and opens the new one on the effective date
- **Canonical mapping owned by:** Data platform team, in id_crosswalk

## Time
- **Clock:** Gateway time (the historian stamps on receipt, not the RTU)
- **Zone & format:** UTC, RFC 3339 with explicit offset
- **Naive timestamps:** Rejected at the boundary
- **Ordering guarantee:** None across RTUs — order unknown within 5 seconds; within one RTU the historian sequence number is authoritative

## Units and scale
| Field | Unit | Scale/offset | Can it change? |
|---|---|---|---|
| flow | l/s | raw × 1 | No |
| pressure | bar | raw × 0.1 | Only via a firmware change, which triggers a contract review |
| run_hours | h | raw × 1 | No |

## Delivery
- **Direction:** Pull (integration polls the historian API every 60 s)   **Batch size:** up to 5000 points
- **What a gap looks like:** Absent rows — no explicit marker; a gap is inferred from the expected cadence
- **Backfill:** Historian retains 400 days; integration may re-pull any window in that range

## Quality
- **Checked by source before sending:** Range (historian clamps to instrument span)
- **Checked by integration on receipt:** completeness, range (post-normalisation), timeliness, referential, duplicate
- **Failing record handling:** Withhold and flag; daily withheld-count published with the feed

## Change
- **Schema/semantic change announced via:** #data-integrations channel + change ticket
- **Notice period:** 10 working days; breaking changes 30
- **Deprecation:** Old field kept alongside the new one for one review cycle, then removed

## Failure
- **Source silent:** values marked stale after 5 minutes, on-call alerted after 15
- **Escalation:** Data platform on-call, then Controls team lead if the historian itself is down
```

## When to Use
- At the start of any integration, before implementation and before hardware procurement where possible
- Once per source system — a new source is a new contract, not an appendix to an existing one
- As the review artefact when an integration keeps breaking — the failures usually map to a section that was left vague
- When onboarding a new consumer of the integration, so they inherit the guarantees rather than rediscovering the quirks

## Common Mistakes
- **No contract at all** — every quirk is found in production and fixed under incident pressure
- **A contract with prose instead of the fixed sections** — the predictable failure classes get skipped because nothing prompts for them
- **Leaving "ordering guarantee" blank** — consumers assume causal order they are not getting (Lesson 518)
- **Not stating what a gap looks like** — the integration cannot tell "no measurement" from "delivery failed"
- **No notice period for schema changes** — a firmware update changes a unit and the first warning is a wrong dashboard
- **One contract for many sources** — each source's identity, clock and units differ, and a merged contract hides which is which

## Further Reading
- [Pact — consumer-driven contract testing](https://docs.pact.io/) — the software-testing analogue: a machine-checkable contract between a data producer and consumer
- [RFC 3339 — Date and Time on the Internet](https://datatracker.ietf.org/doc/html/rfc3339) — the timestamp format the Time section should require
- [data.gov / DCAT — dataset description vocabulary](https://www.w3.org/TR/vocab-dcat-3/) — a standard vocabulary for describing a published dataset's distribution, licence and update frequency, which the contract's Delivery section mirrors

```recall
- q: "What is an integration contract and why does it exist?"
  must:
    - "a short per-source document: what is received, in what form, with what guarantees, and the failure behaviour"
    - "both sides commit — the source sends what it says, the integration consumes exactly that"
    - "without it, every quirk is discovered in production and fixed under incident pressure"

- q: "Name the contract's fixed sections and why the set is fixed."
  must:
    - "Identity, Time, Units and scale, Delivery, Quality, Change, Failure"
    - "the failure classes are predictable, so the sections prompt for each one"
    - "each section is an earlier lesson made concrete for one source"

- q: "Give three specific commitments a good contract pins down that are otherwise assumed."
  must:
    - "the ordering guarantee — causal, or 'unknown within N seconds'"
    - "what a delivery gap looks like — explicit marker or just absent rows"
    - "the notice period for a schema or semantic change"
```
