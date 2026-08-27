# 372. Problem Framing — Converting Vague Requests into Problem Statements

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Product_Strategy_Rules material (specifically `problem-framing.md`) to build out the Product & Technical Strategy course; no existing coverage data for your own practice.

## What It Is
Problem framing is the discipline of rewriting a request as a problem before anyone is allowed to propose a solution. Most requests arrive already dressed as solutions — "we need a dashboard," "we need an app," "we need AI" — and every one of those sentences skips the part that actually justifies building anything: who is hurting, what specifically hurts, how often, and what it costs them today. If you start designing screens from a solution-shaped sentence, you inherit whatever assumptions were baked into it, usually without realizing you've inherited them.

The discipline has a fixed output shape: *For \<target user\>, who currently struggles with \<pain\>, the product should help them \<desired outcome\>, because \<business reason\>.* This is not a formality — each blank forces a piece of evidence. "For event organizers" forces you to name a real actor rather than "users" in the abstract. "Who currently struggles with manual spreadsheet reconciliation" forces you to describe an existing, observable process rather than an imagined gap. "Because manual operations create errors and delays" forces you to state the cost of inaction, which is what will later justify the MVP's existence to a skeptical stakeholder or a budget owner.

A problem statement is testable in a way a solution pitch never is. "We need a modern platform" cannot be wrong — it has no falsifiable content. "The operations team loses several hours a week reconciling order statuses between WhatsApp, Excel, and email" can be wrong, and being wrong is useful: if it turns out the team actually loses ten minutes and doesn't care, you've saved everyone from building a solution to a problem that wasn't costing anything. The discipline of problem framing is really a discipline of making your assumptions falsifiable before they're expensive.

## Key Concepts
- **Problem statement template**: For \<user\>, who struggles with \<pain\>, the product should \<outcome\>, because \<business reason\>
- **Required problem fields**: current process, pain point, affected users, business impact, frequency, severity, existing workaround, cost of inaction, desired change
- **Problem quality test**: specific, observable, connected to a real workflow, painful enough to justify software, owned by a known user, measurable or verifiable
- **Solution-shaped requests**: "we need an app," "we need AI," "we need a dashboard," "we want something like X" — all forbidden as final problem statements because they carry no falsifiable content
- **Discovery questions over invented features**: when the required fields are unknown, the correct move is to ask, not to guess and proceed
- **Cost of inaction**: the business reason clause exists specifically to answer "why does this matter enough to build something"
- **Frequency vs severity**: a problem that happens rarely but is catastrophic (a compliance failure) needs different scoping than one that happens constantly but is mildly annoying (a slow click path)

## Example Code
```markdown
## Problem Statement — Intake

**Original request:** "We want a modern client portal, like the big agencies have."

**Target user:** Account manager (internal), client contact (external)

**Current process:** Client updates are sent as email threads and PDF attachments;
account managers manually compile status into a slide deck before each weekly call.

**Pain:** Compiling the deck takes 2-3 hours per client per week; clients frequently
ask "where are we on X" because the deck is already a week stale by the next call.

**Business impact:** ~8 account managers × 2.5 hrs/week ≈ 20 hours/week of non-billable
compilation work; at least 2 client complaints per quarter about stale status.

**Existing workaround:** A shared Google Sheet was tried and abandoned after 6 weeks —
account managers stopped updating it because it duplicated work already in email.

**Cost of inaction:** Continued non-billable hours, plus visible risk of churn from the
clients who complained.

**Desired outcome:** Client-visible, always-current status without a manual compile step.

**Evidence available:** 3 account manager interviews, 1 failed internal tool attempt (the
sheet) worth learning from.

**Unknowns:** Whether clients will actually log into a portal vs. still emailing anyway —
flagged for the Feedback and Validation step (see lesson 382), not decided here.

**Rewritten problem statement:**
"For account managers who currently compile client status manually from email threads
into a weekly slide deck, the product should surface live project status without a manual
compile step, because 20 hours/week of non-billable work and stale-status complaints are an
ongoing cost of the current process."
```

## When to Use
- The moment a stakeholder describes a product by naming a competitor ("like Airbnb," "like Notion") instead of a workflow
- Before any estimate, proposal, or architecture conversation — problem framing is upstream of all of them
- When a request contains the word "modern," "AI," "dashboard," or "platform" with no further detail
- When a team is arguing about features — the argument is often really an unresolved disagreement about what problem is being solved
- Periodically on an existing product, when a feature request doesn't obviously map to a known problem — re-derive the problem before building

## Common Mistakes
- Accepting "we need an app" or "we want something like X" as a final problem statement instead of treating it as the starting point for discovery questions
- Writing a problem statement without a business impact clause, which makes it impossible to later justify prioritization or say no to competing requests
- Inventing pain points because the real ones weren't investigated — a fabricated problem statement is more dangerous than an honest "unknown," because it looks resolved
- Framing the problem so broadly ("users need better visibility") that it can't be falsified or scoped into an MVP

## Further Reading
- Rob Fitzpatrick — "The Mom Test" (how to ask discovery questions without leading the witness)
- Clayton Christensen et al. — "Competing Against Luck" (the problem-first thinking behind Jobs to Be Done, lesson 374)
- Des Traynor (Intercom) — "First Break All the Roadmaps" talk, on separating stated requests from underlying problems
