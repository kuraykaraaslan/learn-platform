# 222. Communication and Approval Protocols

## What It Is
Uncontrolled communication is a quieter risk than a missing contract clause, but it produces the same disputes: decisions scattered across WhatsApp, email, a call, and a voice note, with no single record of what was actually agreed. A workable communication protocol names, before the project starts, a primary written channel for official decisions, an optional secondary channel for discussion, a meeting cadence, and — critically — a definition of what actually counts as approval.

The rule worth internalizing is that calls and chats are fine for discussion but not for binding decisions: anything that affects scope, timeline, or implementation gets summarized in writing before it takes effect, even if it was first agreed verbally. This protects both sides — the client gets a record of what they approved, and the freelancer gets protection against "I never said that" later. Feedback deserves the same structure: a request without a screen name, a clear issue description, a priority, and — for anything visual — a screenshot, isn't actionable feedback, it's a starting point for a clarifying question that costs both sides time.

The silence rule is the most consequential piece of this protocol and the one most freelancers forget to state upfront: if no feedback arrives within the agreed review window, the milestone may be treated as accepted for scheduling and payment purposes. This only works if it's agreed before the project starts, in writing, not introduced for the first time when a client has gone quiet for three weeks and a milestone payment is stuck. As with every other clause in this course, whether a silence-based acceptance mechanism is actually enforceable in your specific situation depends on your contract and your jurisdiction — treat it as a strong operational default, and have your lawyer confirm the wording holds up if a real dispute is ever likely.

## Key Concepts
- **Primary written channel rule**: one channel is designated for official decisions, feedback, approvals, and scope changes; calls and informal chat are for discussion, and any resulting decision is summarized in writing before it takes effect.
- **Approval definition**: specific, tied to a deliverable or milestone, given by the named decision maker, and recorded in the project channel — "looks fine" or "okay" is not, by itself, sufficient approval.
- **Meeting cadence**: kickoff, milestone demos, and a final handover/training meeting as the default rhythm, with additional meetings beyond that cadence potentially affecting timeline or being separately charged.
- **Feedback format**: screen/page name, issue description, priority, screenshot if visual, and a note on whether it's a bug, a revision, or a new request.
- **Silence rule**: no feedback within the agreed review window may be treated as acceptance for scheduling and payment purposes — stated and agreed before the project starts, never introduced retroactively.

## Example Code
```template
## Communication Protocol

**Primary channel:** [Email thread / project tool] for all official
decisions, feedback, and approvals.
**Secondary channel:** [Calls/Slack] for discussion only — decisions made
here will be summarized in writing before they take effect.
**Meeting cadence:** Kickoff → milestone demos → final handover meeting.
Additional meetings beyond this cadence may affect timeline.

**Approval example (sufficient):**
"Approved: Milestone 1 wireframes for dashboard, user list, and order
list. Proceed to implementation."

**Approval example (not sufficient without context):**
"Looks fine." / "Okay, go ahead."

**Feedback format required:**
- Screen/page name
- Issue or request description
- Priority
- Screenshot (if visual)
- Bug / revision / new request classification

**Silence rule:** If no feedback is received within [3] business days of
milestone submission, the milestone may be treated as accepted for
scheduling and payment purposes, unless otherwise agreed in writing.
```

## When to Use
- At kickoff, to establish the channel and cadence before the first piece of feedback ever arrives.
- Whenever a decision is made verbally on a call and needs to be captured before implementation continues.
- When a client has gone silent past the review window and a milestone needs to move forward.

## Common Mistakes
- **A scope decision gets made on a call, and no written summary of it ever gets sent afterward** — Letting major decisions happen only in calls with no written summary afterward.
- **"Looks fine" is the entire sign-off on a milestone that unlocks a payment** — Accepting vague approvals ("looks fine") as sufficient sign-off for a milestone with real cost implications.
- **There's no stated review window, and Milestone 2 has been "awaiting feedback" for six weeks with no path forward** — Never stating a review window, so milestones stay in limbo indefinitely with no path to being marked accepted.
- **Feedback arrives across WhatsApp, email, a voice note, and an in-person comment, and none of it lives in one place** — Allowing feedback to scatter across every channel available (WhatsApp, email, voice notes, in-person) instead of consolidating it into one.

## Further Reading
- Camille Fournier, *The Manager's Path* — on establishing clear communication norms in ambiguous working relationships.
- Basecamp's public writing on asynchronous, written-first communication for distributed client work.
- Patrick Lencioni's writing on the cost of unclear decision ownership in team and client relationships.
