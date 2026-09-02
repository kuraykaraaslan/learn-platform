# 83. Scope Creep Management — Saying No with Alternatives

## What It Is
Scope creep is the gradual expansion of a project's requirements beyond what was contracted, without corresponding adjustments to timeline or budget. It is the single most common cause of unprofitable fixed-price projects. It almost always starts politely: "could you also just add a small thing while you're in there?" — and it ends with a developer who has worked 40% more hours than budgeted, on a project that is now late, with a client who thinks the delay is the developer's fault because they never said "this changes the timeline."

The formal change request process exists to prevent this without damaging the client relationship. It is not about being rigid — it is about being transparent. Every change that affects scope, timeline, or budget gets documented and approved before work begins. This protects both parties: the client gets visibility into what they are asking for and what it costs, and you get protection from scope that quietly expands until the project is unprofitable.

"Saying no with alternatives" is the advanced skill on top of the process. A client who hears "that is out of scope" feels rejected. A client who hears "that is out of scope for this contract, here are your three options for how to add it" feels served. The alternatives give the client agency and transform the conversation from an adversarial one (developer protecting budget) to a collaborative one (developer helping client decide how to invest). Your existing rules cover the formal process; this entry gives you the exact language, the edge cases, and the decision framework for when a small change is worth absorbing versus escalating to a formal CR.

```quiz
- q: "A client reports that something is broken. Bug, or change request?"
  anchor: "A bug is when delivered work does not meet the agreed specification; a CR is when the client wants something different from or in addition to the specification"
  options:
    - text: "A bug — the client is reporting a defect"
      correct: false
      why: "The client's label is not the test. The agreed specification is."
    - text: "Whichever the specification says: a bug fails the agreed spec, a CR asks for something different or additional"
      correct: true
      why: "And that distinction has to be clear in writing, not just understood."
    - text: "A bug if it is quick to fix, a CR if it is not"
      correct: false
      why: "Effort is not the classifier."

- q: "A client adds scope verbally during a call. What do you do?"
  anchor: "acknowledge it and commit to documenting it — never start work based on verbal additions alone"
  options:
    - text: "Start on it — the conversation was clear enough"
      correct: false
      why: "Never start work on a verbal addition alone."
    - text: "Acknowledge it, and commit to documenting it"
      correct: true
      why: "The CR log is what prevents \"but I mentioned that in the kickoff\" months later."
    - text: "Decline to discuss it until it arrives by email"
      correct: false
      why: "Acknowledging is not refusing — the commitment is to write it down yourself, not to make the client do it."

- q: "A client raises a good idea that is out of scope. What is the parking lot for?"
  anchor: "park it visibly in a \"future features\" list — this acknowledges the idea without committing to it now"
  options:
    - text: "Deflecting an idea you would rather not build"
      correct: false
      why: "It is for good ideas — the technique exists precisely because the idea has merit."
    - text: "Acknowledging the idea visibly without committing to it now"
      correct: true
      why: "Visibly is the operative word: the client can see it was heard and kept."
    - text: "Batching small changes that fall under the absorption threshold"
      correct: false
      why: "That is a separate mechanism with its own pre-defined limit."
```

## Key Concepts
- **Scope baseline**: The documented, signed-off list of deliverables from the original contract; this is your reference point for every CR conversation
- **Change request (CR) vs. bug fix**: A bug is when delivered work does not meet the agreed specification; a CR is when the client wants something different from or in addition to the specification — the distinction must be clear in writing
- **The absorption threshold**: Small changes (< X hours) that do not affect timeline may be worth absorbing to maintain relationship; define your threshold in advance (e.g., < 1 hour cumulative per month, absorbed; > 1 hour, formal CR)
- **Change request log**: Every CR, whether approved or not, is logged with date, description, decision, and reasoning — this prevents "but I mentioned that in the kickoff" disputes
- **Timeline impact vs. cost impact**: A CR might add cost (more hours) or timeline impact (dependencies shift) or both — address them separately in the CR document
- **Verbal scope additions**: When a client adds scope verbally in a call, acknowledge it and commit to documenting it — never start work based on verbal additions alone
- **The "parking lot" technique**: When a client raises a good but out-of-scope idea mid-project, park it visibly in a "future features" list — this acknowledges the idea without committing to it now
- **CR pricing model**: Some developers price CRs at a premium rate (1.25–1.5× standard) to compensate for context-switching cost and the administrative overhead

## Example Code or Template

```template
# Change Request Form — CR-[NUMBER]

**Project**: [Project Name]
**Client**: [Client Name]
**CR Number**: CR-[sequential number, e.g., CR-003]
**Submitted by**: [Client name / you]
**Date Submitted**: YYYY-MM-DD
**Status**: Pending Client Approval | Approved | Rejected | Withdrawn

---

## Change Description

### What is being requested?
[Clear description of the new requirement or modification. Be specific enough
that both parties would agree on whether the work has been completed.]

### Why is this being requested? (client fills this in or you capture it verbally)
[Business context — what problem does this solve or what opportunity does it enable?]

---

## Scope Impact Analysis

### Is this in scope of the original contract?
☐ **No** — The original scope document (Section X) does not include this.
☐ **Partial** — The original scope includes [related item], but not [specific addition].
☐ **Disputed** — See notes below.

### Original scope reference:
> [Quote the relevant section of the original scope document]

---

## Estimate for this Change Request

| Component | Optimistic | Most Likely | Pessimistic | Expected |
|-----------|-----------|-------------|-------------|---------|
| [Task 1]  | Xh        | Xh          | Xh          | Xh      |
| [Task 2]  | Xh        | Xh          | Xh          | Xh      |
| **Total** |           |             |             | **Xh**  |

**Cost at [rate] per hour**: $[amount]
**Timeline impact**: [+N days to current delivery date OR "no impact on delivery"]
**Dependencies affected**: [List any milestones or deliverables that shift]

---

## Options for the Client

### Option A: Full Change Request (Recommended)
Approve this CR and add [expected hours]h at $[rate]/h = $[total].
Timeline adjusts to [new delivery date].

### Option B: Descope and Add to Phase 2
Park this item for the next project phase. No cost or timeline impact now.
This item goes on the Phase 2 backlog with a rough estimate of $[range].

### Option C: Modified Scope (if applicable)
A reduced version of this change — [describe reduced scope] — would cost
$[reduced amount] with [reduced] timeline impact.

---

## Decision

**Client selection**: ☐ Option A   ☐ Option B   ☐ Option C   ☐ Reject entirely

**Client signature / written approval**: ________________________________

**Date approved**: YYYY-MM-DD

---

## Notes
[Any additional context, assumptions, or risks relevant to this CR]
```

---

```markdown
# Verbal Scope Addition — Response Script

When a client adds scope verbally (in a call or meeting), use this exact language:

"That's a great addition — I want to make sure we handle it properly so it
doesn't affect [the current delivery date / the budget we agreed on]. Let me
add it to our change request log and send you a quick estimate before we
start on it. Does that work?"

---

# Absorption Decision Framework

Before deciding whether to absorb a small request or issue a CR:

1. Is the cumulative absorbed time this month still < [your threshold]?
   → If yes, consider absorbing with a note: "I'm including this as a courtesy
     this time — future additions at this scope will go through a formal CR."

2. Does this request affect any other deliverable's timeline or quality?
   → If yes, always issue a CR regardless of size.

3. Is there ambiguity about whether this is a bug or a feature?
   → Issue a CR with a note: "I've classified this as a new requirement because
     the original spec described [X], not [Y]. Happy to discuss if you see it
     differently."

4. Has the client previously pushed back on CR pricing?
   → Document the absorption explicitly in writing to establish the pattern
     and prevent normalizing free scope additions.
```

## When to Use
- Every time a client mentions "one small addition" during a project — log it immediately, even if you plan to absorb it
- When a client says "I thought this was included" — compare the request to the scope baseline in writing before responding verbally
- When a project is running over budget due to accumulated small changes — issue a retrospective CR summary showing all absorbed changes with their estimated cost; this resets expectations without blame
- When finalizing a fixed-price contract — include a CR process clause explicitly (how CRs are submitted, priced, and approved) so the process is pre-agreed
- When a client is happy and asking about "phase 2" features mid-project — use the parking lot technique to capture their ideas and turn them into a next-project pipeline

## Common Mistakes
- **Starting work before written approval**: Verbal agreement on a CR is not a CR — a client who approved verbally and then disputes the cost will point to the lack of written record; never start CR work without written confirmation
- **Issuing a CR without options**: "This is out of scope, it will cost $X" is a wall; "here are your three options and my recommendation" is a service — clients approve CRs faster when they feel they have agency
- **Not distinguishing bug from CR**: If you deliver something that does not meet the specification, that is a bug and you fix it at your cost; if the client wants something different from the specification, that is a CR and they pay for it — conflating these is expensive
- **Absorbing without documenting**: If you absorb a change, send an email noting that you are including it as a courtesy and that future similar additions will go through the formal CR process — undocumented absorptions create an expectation that all small additions are free

## Further Reading
- **"The Business of Software" — Michael Feathers and Patrick McKenzie (various essays)** — Practical writing on managing client expectations and contract scope in consulting/freelance software work
- **PMBOK Guide (Project Management Body of Knowledge)** — Section on Change Control; the formal framework that change request processes are derived from; useful as a reference for formal client engagements
- **"Freelance Isn't Free" — creative legalese** — Practical guide to scope and contract management for independent contractors; includes worked examples of CR conversations and templates

```recall
- q: "What is the scope baseline, and what is it for?"
  must:
    - "the documented, signed-off list of deliverables from the original contract"
    - "it is the reference point for every change-request conversation"

- q: "Define the absorption threshold, and give the shape of one."
  must:
    - "small changes that do not affect timeline may be worth absorbing to maintain the relationship"
    - "define the threshold in advance"
    - "for example under 1 hour cumulative per month absorbed, above that a formal CR"

- q: "What goes in the change request log, and why is every CR logged?"
  must:
    - "date, description, decision and reasoning"
    - "every CR, whether approved or not"
    - "it prevents \"but I mentioned that in the kickoff\" disputes"

- q: "Separate the two impacts a change request can carry."
  must:
    - "cost impact — more hours"
    - "timeline impact — dependencies shift"
    - "a CR may carry either or both, addressed separately in the CR document"
```
