# 236. Project Kickoff and the First 30 Days

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Project_Management_Rules/project-kickoff.md material to build out the Client Delivery, PM & Handover course; no existing coverage data for your own practice.

## What It Is
Kickoff is the moment a sold project becomes an executable one. Before kickoff, everything about the engagement lives in a proposal, a contract, and a handful of sales conversations — all of which are optimized for winning the deal, not for building the thing. Kickoff is where you deliberately convert "we agreed to work together" into a shared, written understanding of the goal, the scope boundaries, who can approve what, and what happens the moment something is unclear. Skipping it — starting to code the day the contract is signed because momentum feels valuable — is one of the most common causes of mid-project conflict, because it lets both sides carry different mental models of the same project for weeks before anyone notices.

A good kickoff is not a courtesy call. It is a structured session that answers a fixed list of questions: what business outcome does this project need to produce, who is the actual decision maker (as opposed to the friendliest contact), what is explicitly excluded, what does the client need to provide and by when, and what does the first real deliverable look like. If the kickoff surfaces a major unresolved question — "we'll figure out the reporting requirements later" — the right move is not to shrug and start building. It's to convert that uncertainty into something trackable: an open question, a client dependency with an owner and a date, a paid discovery task, or a logged risk. Uncertainty that isn't converted into one of those four things just becomes an assumption everyone forgets they made.

The output of kickoff is a short written artifact — kickoff notes — that both sides can point back to. This matters more than it sounds: three months into a project, "what did we actually agree the MVP included?" is a question that should have a five-second answer, not a re-litigation. Kickoff notes are also the first proof point to a client that they hired someone who runs projects deliberately, which sets the tone for every status update and change request that follows.

## Key Concepts
- **Kickoff as a gate, not a courtesy**: implementation should not start until scope, exclusions, stakeholders, and the first milestone are confirmed in writing
- **Business outcome over feature list**: the first question is "what business result should this project create," not "what should we build"
- **Uncertainty conversion**: every major unknown surfaced at kickoff becomes one of: open question, client dependency, paid discovery task, or logged risk — never a silent assumption
- **Access requested just-in-time**: collect only the credentials and accounts needed for the current phase, and never over insecure channels like chat or email
- **Decision maker identification**: the person answering emails is often not the person who can approve scope or unblock payment; kickoff is where you find out which is which
- **Client responsibilities as deliverables**: content, credentials, sample data, and approvals are inputs the client owns, and they belong in the plan with the same rigor as your own tasks
- **The kickoff note as the reference document**: a single artifact that both sides can point to later instead of relying on memory of a call

## Example Code
```md
# Project Kickoff Notes

## Project
**Client:** Meridian Retail Group
**Project name:** Order Management Admin Panel
**Kickoff date:** 2026-08-26
**Primary contact:** Elena Vance (Operations Manager)
**Decision maker:** Tomas Reyes (COO) — approves scope and payment

## Goal
Replace the shared Google Sheet used for order tracking with a system that
lets 4 warehouse staff update order status concurrently without overwrites,
and gives management a same-day view of fulfillment backlog.

## Success Criteria
- Staff can update an order's status in under 10 seconds, no double-entry
- Management can see today's backlog count without asking staff
- Zero data loss incidents during the first 30 days live

## Scope Summary
Included:
- Order list, status workflow (Received → Packed → Shipped → Delivered)
- Role-based access: Admin, Warehouse Staff
- CSV export for accounting

Excluded:
- Customer-facing order tracking page (flagged as Phase 2 candidate)
- Carrier API integration (manual tracking number entry only)

## Milestones
1. Data model + auth approved (staging demo)
2. Order workflow complete (staging demo)
3. Production launch + handover

## Client Responsibilities
- Provide cleaned CSV export of last 90 days of orders by 2026-09-02
- Confirm final list of order statuses by 2026-08-29
- Assign one staff member to attend UAT session

## Communication
**Main channel:** Email for decisions/approvals, shared board for tasks
**Update cadence:** Weekly written status, Fridays
**Review cadence:** Live demo at each milestone

## Risks / Assumptions
- Assumption: existing CSV data has consistent date formatting (to verify during import)
- Risk: if carrier integration is requested mid-project, it is a change request, not scope creep absorption

## Next Actions
| Action | Owner | Due Date |
|---|---|---|
| Send cleaned order CSV | Elena | 2026-09-02 |
| Confirm order status list | Tomas | 2026-08-29 |
| Share staging environment | Developer | 2026-08-28 |
```

## When to Use
- Immediately after a proposal is signed and before any implementation work begins, regardless of project size
- When a project is being restarted after a pause, a scope renegotiation, or a change in the client-side primary contact
- When you inherit a project mid-stream from another vendor or freelancer and need to re-establish a shared baseline
- Any time you notice the client's mental model of scope diverging from yours — a mini re-kickoff on the disputed area resets the record

## Common Mistakes
- Starting implementation before the decision maker (not just the daily contact) has confirmed scope, which risks a late-stage reversal after "internal review"
- Treating kickoff as a single call with no written output, so nothing exists to point back to when memories of the call diverge weeks later
- Accepting "we'll decide later" on a scope-defining question instead of converting it into a dated dependency, open question, or risk
- Requesting all possible credentials and access up front instead of just what the current phase needs, which increases both security exposure and client friction

## Further Reading
- PMI, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* — the Initiating process group covers charter and stakeholder identification, the formal ancestor of a kickoff: https://www.pmi.org/pmbok-guide-standards
- Basecamp, *Shape Up* — the "Betting Table" and kickoff chapters describe how a small team converts an approved idea into a scoped, time-boxed piece of work: https://basecamp.com/shapeup
- David Maister, Charles H. Green, Robert M. Galford, *The Trusted Advisor* — on establishing the client relationship dynamics that a good kickoff sets in motion
