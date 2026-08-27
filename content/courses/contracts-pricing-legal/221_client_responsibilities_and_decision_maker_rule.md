# 221. Client Responsibilities and the Decision-Maker Rule

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Proposal_and_Pricing/Contract_and_Scope/Legal_and_Contractor material to build out the Proposals, Contracts & Pricing course; no existing coverage data for your own practice.

## What It Is
A software project is delivered by two parties, not one, and most SOWs only document what one of them owes. Content, brand assets, timely access to accounts, consolidated feedback, written approvals, and on-time payment are the client's half of the delivery equation — and when they're missing, the timeline and the outcome are affected exactly as much as if the freelancer had missed a deadline. Naming these responsibilities explicitly, with an owner and a deadline for each, is what prevents "the client was slow" from becoming an unwinnable argument about whose fault a delay was.

The single highest-leverage clause in this category is the decision-maker rule: the client appoints one person responsible for consolidating feedback and giving approvals. Without it, a freelancer ends up serving multiple stakeholders with conflicting opinions, redoing work because the third reviewer disagreed with the first two, and absorbing the resulting delay as if it were their own scheduling failure. Stated plainly upfront — "conflicting stakeholder feedback may delay delivery and require scope or timeline adjustment" — this isn't an insult to the client's team; it's the same discipline any well-run project needs internally, just made explicit for an external relationship.

Content ownership deserves its own explicit line too, because it's one of the most commonly assumed-away responsibilities: unless a copywriting or content deliverable is specifically in scope, the client provides final text, images, legal copy, and translations, and pages remain placeholder until they do. Approvals need the same treatment — verbal "looks good" in a call is real, but it should be summarized in writing before implementation continues, both so there's a record and so a rushed verbal yes doesn't get quietly walked back later. None of this replaces having your actual client responsibilities section reviewed alongside the rest of your contract by a lawyer, especially if a dispute over delay or missing input ever becomes a payment fight.

## Key Concepts
- **Default responsibility list**: accurate requirements, content/assets/data, timely account access, one decision maker, consolidated feedback, written milestone approval, on-time payment, and review during feedback windows.
- **Decision-maker rule**: the client names one person responsible for consolidating feedback and giving approval; conflicting multi-stakeholder feedback is treated as a timeline/scope risk, not the freelancer's failure to manage it.
- **Content default**: unless explicitly scoped as a deliverable, final text, images, legal copy, product data, and translations are the client's responsibility — pages stay placeholder until provided.
- **Written approval requirement**: verbal approvals in a call are summarized in writing before implementation continues, creating a record and preventing later disputes about what was actually approved.
- **Responsibility table**: responsibility, owner, deadline/phase, and impact-if-missing, stated in the SOW rather than left as an unstated expectation.

## Example Code
```markdown
## Client Responsibilities

| Responsibility | Owner | Deadline | Impact if Missing |
|---|---|---|---|
| Brand assets & content | Client | Before UI phase | Placeholder content used |
| Domain/DNS access | Client | Before deployment | Launch date shifts |
| Consolidated feedback | Named decision maker | Within 3 business days | Milestone acceptance/timeline shifts |
| Milestone approvals | Named decision maker | Per milestone | Next phase paused until approved |

The Client will appoint one primary decision maker responsible for
consolidating feedback and giving written approval. Feedback from
multiple, uncoordinated stakeholders may delay delivery and require
scope or timeline adjustment.

Approvals must be given in writing through the agreed communication
channel. Verbal approvals given in a call will be summarized in writing
before implementation continues.
```

## When to Use
- In every SOW, as a standing section rather than an afterthought.
- At kickoff, to confirm who the actual decision maker is before the first milestone starts.
- Whenever a delay is being attributed to the freelancer and a review of client-side inputs might tell a different story.

## Common Mistakes
- Never naming a single decision maker, then absorbing the cost of conflicting feedback from multiple stakeholders.
- Assuming the client will provide content "eventually" without a stated deadline or consequence for lateness.
- Accepting a verbal "yes, looks good" as sufficient approval without ever summarizing it in writing.
- Letting the client's late input silently compress the freelancer's own timeline instead of shifting the schedule accordingly.

## Further Reading
- Mike Monteiro, *You're My Favorite Client* — on setting expectations for client-side participation from day one.
- The RACI matrix (Responsible, Accountable, Consulted, Informed) as a general framework for assigning decision ownership.
- Jonathan Stark's writing on single-decision-maker requirements in fixed-scope consulting engagements.
