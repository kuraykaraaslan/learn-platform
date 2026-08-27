# 240. Client Communication Cadence and Status Reporting

## What It Is
Silence during a project reads as failure even when the work is on track. A client who hasn't heard anything in ten days has no way to distinguish "quietly making great progress" from "quietly stalled," and in the absence of information, people assume the worse story. Communication cadence is the fix: deciding, up front, which channel carries which kind of information, how often updates go out, and what the escalation path is when something urgent happens — so the client never has to wonder whether they should be worried.

The core discipline is channel separation. Decisions and approvals belong somewhere durable and written — email, a project doc, a formal message — never only in a voice note or a call with no follow-up. Quick coordination can happen in chat. Tasks live on a board. Mixing all of these into one undifferentiated stream of messages is how "we agreed to add that" disputes happen six weeks later with no record either side can point to. A written status report, sent on a predictable rhythm, is the single highest-leverage habit here: even a project with nothing dramatic to report benefits from a report that says so, because it proves someone is watching.

The status report itself follows a fixed shape for a reason: overall status (using a simple green/yellow/red signal), current milestone, what's done, what's in progress, what's blocked, what risks exist, what decisions are needed, and what happens next. The discipline that makes this honest rather than decorative is refusing to mark a project green when a major client dependency is overdue — yellow and red exist specifically so a status report can carry bad news early, while there's still time to act on it, instead of only at the deadline when it's too late to matter.

## Key Concepts
- **Channel separation by purpose**: one primary channel for decisions and approvals, a board for tasks, chat only for quick coordination — never let all three blur into one
- **Cadence scales with risk**: weekly written updates for most projects, milestone-only checkpoints for very short engagements, twice-weekly plus visible risk/decision logs for high-risk ones
- **Written approval rule**: any consequential approval (scope, design, milestone, production deploy, final signoff) must exist in writing even if it was first discussed on a call
- **RAG status honesty**: green means genuinely on track; yellow signals an at-risk dependency; red means an active issue affecting delivery — a status report that's always green stops being informative
- **Response expectation boundaries**: stating business-hours availability and routing urgent production issues to a separate agreed channel prevents chat from becoming an unmanaged, always-on obligation
- **The predictable-rhythm effect**: a status update sent on a fixed schedule, even when there's little to report, is itself reassurance — irregular updates create anxiety regardless of actual project health
- **Blockers stated explicitly**: "waiting on X from client, needed by Y" is a status line; "still working on it" is not

## Example Code
```template
## Weekly Project Update

**Project:** Order Management Admin Panel
**Period:** Aug 19 – Aug 26, 2026
**Overall status:** Yellow
**Current milestone:** Admin Workflow Demo Ready (Milestone 2 of 3)

### Completed
- Order list screen with status filter
- Role-based access control for Admin vs Staff

### In Progress
- Order detail view with status transition buttons (60% complete)

### Waiting On / Blocked
- Confirmed list of valid order status transitions — needed to finalize the
  transition UI, requested Aug 20, still outstanding

### Risks / Issues
- If the status list isn't confirmed by Aug 29, Milestone 2 demo date (Sep 2)
  is at risk of slipping by up to 3 business days

### Decisions Needed
- Should "Cancelled" orders be re-openable, or permanently locked? Blocks the
  transition logic.

### Next Actions
| Action | Owner | Due Date |
|---|---|---|
| Confirm status transition list | Elena | 2026-08-29 |
| Confirm Cancelled order behavior | Tomas | 2026-08-29 |
| Finish order detail view (pending above) | Developer | 2026-09-01 |
```

## When to Use
- On a fixed weekly (or milestone-based, for short projects) rhythm for the life of every active engagement
- Whenever a client dependency becomes overdue, so the status color reflects real risk before the milestone date arrives
- When a project has multiple client-side contacts, to establish a single channel of record for decisions
- Any time you notice communication scattering across WhatsApp, calls, email, and memory with no single source of truth

## Common Mistakes
- Sending vague updates like "working on it" instead of specific completed/in-progress/blocked items
- Marking status green when a major client-owed dependency is already overdue, hiding real risk from the report
- Treating a phone call as sufficient record for an important approval instead of following up in writing
- Letting scattered channels (chat, voice notes, calls) become the only record of a decision, with nothing durable to reference later

## Further Reading
- Tom DeMarco and Timothy Lister, *Waltzing with Bears: Managing Risk on Software Projects* — on the value of surfacing risk early and visibly rather than smoothing over status
- Atlassian, "Status report templates and guidance" — practical formats for RAG-style project status communication: https://www.atlassian.com/work-management/project-management/status-report
- PMI, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* — the Communications Management knowledge area formalizes cadence and channel planning
