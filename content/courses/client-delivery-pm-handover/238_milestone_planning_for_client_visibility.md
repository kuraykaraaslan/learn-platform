# 238. Milestone Planning for Client Visibility

## What It Is
A milestone is not a sprint boundary or an internal checkpoint — it is a meaningful state of the project that a non-technical client can understand and react to. "Week 1 coding" tells a client nothing; "Admin workflow demo ready" tells them exactly what they're about to see and what they should be evaluating. The distinction matters because milestones are the primary mechanism by which a client experiences progress on a project they can't read the code of. A project that only ever reports "still working on it" between kickoff and delivery feels, from the client's side, indistinguishable from a project that has stalled — even if the engineering is going fine.

Every milestone needs five things to function as a real checkpoint rather than decoration: a business-readable name, a goal, a list of deliverables, acceptance criteria, and a review method (demo, staging test, written approval). If milestone payments are tied to the plan — common in freelance and agency work — each payment must map to an objective, verifiable state ("30% after staging version of core workflows is reviewable"), never to a vague sense of progress or client mood. This protects both sides: the freelancer isn't waiting on a subjective "when do you feel like paying," and the client isn't paying for something they haven't been able to see.

Sizing matters too. A small project needs 2–4 milestones; a large one, 7–12. Beyond that, the plan itself becomes unmanageable and should be split into phases or separate contracts. And every milestone review should answer the same five questions regardless of size: what was delivered, what should the client look at, what isn't ready yet, what decisions are needed, and what happens next. That last one is easy to skip and is exactly the one that prevents a milestone review from ending in ambiguous silence.

## Key Concepts
- **Business-readable milestone names**: "Payment sandbox flow ready" over "Backend part 2" — the name alone should tell a client what state the project is in
- **The five required fields**: goal, deliverables, acceptance criteria, client dependencies, and review method — a milestone missing any of these isn't a real checkpoint
- **Milestone-to-payment mapping**: when payments are tied to milestones, each one must correspond to an objectively verifiable delivery state, not a subjective sense of progress
- **Sizing bands**: 2–4 milestones for a small project, 4–7 for medium, 7–12 for large — beyond 12, split into phases or separate engagements
- **Review method as a commitment**: demo, written approval, staging test, or checklist — decided up front, not improvised when the milestone arrives
- **The five review questions**: what was delivered, what to review, what isn't ready, what decisions are needed, what happens next
- **Client dependencies live inside the milestone**: a milestone that depends on client-provided content or approval names that dependency explicitly rather than assuming it will simply appear

## Example Code
```template
## Milestone: Admin Workflow Demo Ready

**Goal:** Staff can process an order from received to shipped using only the admin panel
**Deliverables:**
- Order list with status filter
- Order detail view with status transition buttons
- Email notification on status change to "Shipped"

**Acceptance Criteria:**
- Staff can change an order's status without page reload errors
- Status history is visible on the order detail view
- Shipped notification email arrives within 1 minute of status change

**Client Dependencies:**
- Confirmed list of valid status transitions (received by 2026-08-29)
- Sample order data for demo (received by 2026-09-01)

**Risks:**
- Email deliverability depends on client's domain DNS records being correctly configured before demo

**Review Method:** Live demo, followed by written approval within 3 business days
**Payment Link:** 30% milestone payment due on written approval
```

## When to Use
- When translating an approved scope-to-work breakdown into a client-facing delivery plan with review points
- Whenever milestone-based payments are part of the commercial agreement, so payment triggers are objective rather than negotiated after the fact
- When a client asks "how will I know it's going well" — the milestone plan is the direct answer
- Any time a project has gone more than two weeks without a client-visible checkpoint, which is itself a signal the plan needs a milestone inserted

## Common Mistakes
- Naming milestones after internal work structure ("Frontend part," "Bug fixing week") instead of the business state they represent
- Calling a milestone complete without a client review or internal quality gate, which erodes the entire purpose of having checkpoints
- Tying a payment to vague progress instead of a specific, demonstrable delivery state, which invites disputes about whether the milestone was really reached
- Cramming too many unrelated features into a single milestone, making it impossible for the client to give focused, useful feedback on any one of them

## Further Reading
- Robert G. Cooper, *Winning at New Products* — the origin of the stage-gate model that milestone-based delivery borrows its review-and-decide structure from
- Basecamp, *Shape Up* — the "appetite" and cycle chapters describe scoping work into fixed, demonstrable checkpoints rather than open-ended progress: https://basecamp.com/shapeup
- PMI, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* — milestone scheduling is covered under the Schedule Management knowledge area
