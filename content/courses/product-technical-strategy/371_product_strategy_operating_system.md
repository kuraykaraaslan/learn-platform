# 371. Product Strategy Operating System — From Problem to Roadmap

## What It Is
Most software projects fail before a single line of code is written, because the sequence of decisions gets scrambled: someone hears "we need a booking system" and jumps straight to screens, a database schema, and a price quote. The Product Strategy Operating System is the fixed order of thinking that prevents that jump: Problem → User → Value Proposition → MVP → Scope Boundaries → Requirements → User Flows → Metrics → Roadmap → Risk Log → Handoff. Each step produces an artifact that the next step depends on. You cannot write a credible MVP definition without first knowing who the user is and what value proposition you are testing, and you cannot prioritize features without an MVP boundary to prioritize against.

The point of naming this as an "operating system" rather than a checklist is that it is meant to run every time, not just for greenfield products. A new feature on an existing product still benefits from a compressed pass through the same sequence: what problem does this feature solve, for which user, what is the smallest version that tests the assumption, what is explicitly excluded, and how will you know it worked. Skipping steps doesn't save time — it just moves the cost downstream, where it shows up as scope creep, a roadmap with no rationale, or a "successful" launch that nobody can prove actually helped anyone.

This lesson sits above the code-level architecture and process material elsewhere in this curriculum. Writing ADRs and RFCs (covered in Process & Soft Skills) is about how you document and socialize a decision once you're close to making it. This operating system is about the decisions that come *before* that: whether there is a real problem, who it belongs to, and what the smallest defensible response looks like. Skipping this layer is why teams end up writing beautifully documented ADRs for the wrong system.

Three roles collapse into one person on a small team, but the roles themselves don't disappear: someone has to define the direction (Product Strategist), someone has to sequence the work (Product Manager), someone has to translate business needs into requirements a builder can act on (Business Analyst), and someone has to protect the first release from bloat (MVP Scope Owner). Naming the roles explicitly is useful even solo, because it forces you to ask "which hat am I wearing right now, and did I skip one?"

## Key Concepts
- **Fixed sequence**: Problem → User → Value Proposition → MVP → Scope Boundaries → Requirements → User Flows → Metrics → Roadmap → Risk Log → Handoff; each step is an input to the next
- **Outcomes over feature piles**: a feature is only valid if it connects to a named user goal or business outcome, not to stakeholder enthusiasm
- **MVP is not a broken product**: smaller scope, not lower quality — the four MVP conditions (valuable, usable, testable, deliverable) live in lesson 375
- **Out-of-scope is a first-class artifact**: what you exclude is as important to document as what you include, because undocumented exclusions become disputed inclusions later
- **Roadmap protects relationships**: most feature requests should move to a later phase, not be rejected outright — sequencing is a diplomatic tool, not just a planning one
- **Metrics prevent fake success**: "we shipped it" and "it worked" are different claims, and only the second one requires a metric defined in advance
- **Handoff artifact**: the operating system ends in a compact summary (target users, MVP goal, scope, flows, metrics, risks) that the next function — architecture, design, delivery — can actually use
- **Readiness gating**: if the upstream artifacts (problem, user, value proposition) don't exist yet, the correct action is to produce them, not to start estimating or building

## Example Code
```template
## Product Strategy Handoff — Field Ops Scheduling Tool

**Product name:** Crew Scheduler
**Target users:** Dispatch coordinator (primary), field technician (secondary), ops manager (buyer)
**Primary problem:** Dispatch currently assigns jobs via a shared spreadsheet and a group chat;
double-bookings and missed reassignments happen 3-5x/week, costing ~6 hours of rework.
**Desired outcome:** Dispatch can assign, reassign, and confirm jobs from one screen, with
technicians seeing same-day changes without a phone call.
**MVP goal:** Prove that a single shared schedule view eliminates double-booking, without yet
solving route optimization or customer-facing notifications.
**MVP features:** job creation, technician assignment, day/week calendar view, manual reassignment,
SMS notification on assignment change.
**Out of scope:** route optimization, customer self-scheduling, payroll integration, offline mode.
**Main user flows:** create job → assign technician → technician confirms → dispatch reassigns on
conflict → technician notified.
**Success metrics:** double-booking incidents per week (target: 0), average reassignment time
(target: under 2 minutes, down from ~20).
**Major assumptions:** technicians have a smartphone with SMS reception in the field.
**Major risks:** if technicians don't check SMS promptly, reassignment latency doesn't improve —
validate with a 2-week pilot before committing to the notification channel.
**Roadmap phases:** MVP (single dispatcher, single region) → V1 (multi-dispatcher, audit log) →
V2 (route optimization).
**Ready for:** Technical Architecture / Proposal
```

## When to Use
- At the start of any new product, client engagement, or internal platform — before any technology conversation happens
- When a stakeholder describes a solution ("we need an app like X") instead of a problem — run the sequence to recover the actual problem underneath it
- Before estimating cost or timeline — estimation without scope boundaries is a guess wearing a number
- When scope is expanding mid-project — re-running the Problem → MVP steps quickly reveals whether the new request fits the original problem or is a different project
- When handing work from strategy to architecture, design, or delivery — the handoff artifact is the contract between phases

## Common Mistakes
- Treating "clone X" as a completed problem statement instead of a solution direction that still needs a problem underneath it
- Starting with a feature list instead of a problem, which produces a product that is a pile of capabilities with no coherent job to do
- Writing the roadmap before scope boundaries exist, so "later" and "not included" become the same undefined bucket
- Skipping the risk and assumption log because the project "feels simple" — simple projects still have unvalidated assumptions, they just have fewer of them

## Further Reading
- Marty Cagan — "Inspired: How to Create Tech Products Customers Love" (the product operating model this sequence compresses)
- Teresa Torres — "Continuous Discovery Habits" (on keeping the Problem → User steps alive after MVP, not just at kickoff)
- [Y Combinator's "How to Talk to Users" essay/video](https://ycombinator.com) — practical grounding for the Problem step
