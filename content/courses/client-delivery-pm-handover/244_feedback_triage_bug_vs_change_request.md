# 244. Feedback Triage: Bug vs Change Request

## What It Is
When a client says "this is broken," they are describing a symptom, not a category. The developer's job is to classify what actually happened before responding — because the response, the cost, and who owns the fix are completely different depending on whether it's a bug, a change request, an enhancement, a configuration issue, a training issue, or a third-party problem. Accepting the client's own label at face value is the single most common way scope quietly erodes: everything gets called a "bug" because bugs are free, and the developer either absorbs unpaid new work or has an uncomfortable conversation later that would have been easy earlier.

The classification itself is investigative, not diplomatic. A bug is a failure of something that was explicitly in agreed, delivered scope — the export feature throws an error when it shouldn't. A change request modifies or adds requirements that were never agreed — the export works fine, but now they want a format that was never scoped. An enhancement improves something that already functions correctly but wasn't required. A configuration issue means the system works but settings, roles, or provider accounts are wrong. A training issue means the system works but the user doesn't know how to use it. None of these are insults to the client; they're just different facts, and naming the correct one accurately is what keeps the relationship fair to both sides.

Feedback also arrives scattered — a chat message here, a call there, a screenshot in an email — and the discipline starts before classification even begins: consolidate it into one list first. Triaging feedback one item at a time as it trickles in is how a defined review round quietly turns into unlimited, unstructured revisions. The right sequence is collect, categorize, respond with the categorized breakdown, then act only on what's approved.

## Key Concepts
- **Investigate, don't accept the client's label**: a client calling something a "bug" doesn't make it one — check it against what was actually agreed and delivered before responding
- **Six categories, not two**: bug, change request, enhancement, configuration issue, training issue, and third-party issue each route to a different owner and a different cost model
- **The core test**: "was this behavior explicitly included in the accepted scope, and did it work before and then break?" — if yes to both, it's a bug; if the expectation is new, it's a change request
- **Consolidate before triaging**: ask for feedback in one list rather than triaging it as scattered messages arrive, or a defined review round becomes an open-ended stream
- **Neutral, factual language**: "I checked this against agreed scope; the current behavior matches what was delivered, and your new request is reasonable as an enhancement" states the finding without making the client wrong for asking
- **Small changes still get named**: a free small fix is logged explicitly as "one-time goodwill, not a scope precedent" — otherwise it quietly becomes the expected free service level
- **Feedback rounds are bounded**: define up front how many structured review rounds a milestone includes, so "just one more thing" has a visible edge

## Example Code
```template
## Feedback Triage — Milestone 2 Review

| Item | Category | Action | Owner | Status | Notes |
|---|---|---|---|---|---|
| Export throws 500 error on date-filtered results | bug | fix | Developer | In progress | Regression from last week's filter change — included in current milestone |
| Add a second export format for new accounting software | change request | discuss | Elena/Developer | Estimated | See CR-002, +2 days, +$400, awaiting approval |
| Status badge color hard to read on mobile | bug | fix | Developer | Fixed | Contrast ratio failed accessibility check against agreed spec |
| Staff want saved column presets | enhancement | defer | — | Logged as roadmap | Not in agreed scope; candidate for Phase 2 |
| Admin can't log in after password reset | configuration | discuss | Developer | Resolved | Email provider was rate-limiting reset emails, not a code defect |

## Request Classification
**Client request:** "The order list doesn't remember my filter settings between visits."
**Category:** enhancement
**Scope reference:** Kickoff notes list "basic search and filtering," no mention of persistence
**Reasoning:** Filtering works as specified; persisted filter state was never a stated requirement
**Included or billable:** Billable as small change request if wanted this phase
**Recommended response:** "Filtering works as agreed. Remembering filter settings between visits wasn't part of the original scope, but it's a reasonable small addition — I can estimate it as a short change request if you want it in this milestone."
**Next step:** Awaiting client decision
```

## When to Use
- Every time a client reports something as broken, missing, or "should be different" — before agreeing to fix, change, or dismiss it
- At the start of every structured review round, to consolidate scattered feedback into one triaged list instead of reacting to items as they arrive
- When a client's request uses bug language ("this is broken") but investigation shows the behavior matches what was actually agreed
- Any time a "small" request risks becoming a repeated pattern, so it gets logged explicitly as a one-time exception rather than a new baseline

## Common Mistakes
- **Every report that comes in gets logged as a bug, whether or not it's actually a defect in agreed scope** — Calling every reported issue a bug to avoid an uncomfortable scope conversation, which trains the client to expect unlimited free changes
- **A genuine defect in delivered scope gets filed as a change request instead** — Calling every reported issue a change request to dodge responsibility, even when it's a genuine defect in delivered scope
- **A new field gets added to the export "while fixing the bug support ticket," with no separate approval** — Implementing a new feature during "bug support" without separate approval, blurring the boundary the whole system exists to protect
- **Feedback shows up as a chat message, a call, and a screenshot in an email, and each gets triaged as it lands** — Accepting scattered feedback from multiple channels instead of asking for one consolidated list, making triage slower and consistency harder

## Further Reading
- Joel Spolsky, "The Joel Test" and associated writing on bug tracking discipline — on why every reported issue needs a written, classified record before action
- Atlassian, "Bug vs. feature request: how to tell the difference" — practical framing for triage in a support queue: https://www.atlassian.com/agile/product-management/bug-tracking
- David Maister, *Managing the Professional Service Firm* — on maintaining client trust by naming trade-offs honestly instead of always saying yes
