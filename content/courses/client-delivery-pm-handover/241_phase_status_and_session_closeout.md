# 241. Phase Status and Session Close-Out Discipline

## What It Is
This is a different discipline from the client-facing weekly status report — it's an internal, per-session ritual for any project tracked as numbered phases, and it exists to answer two questions that a phase-tracked project has a specific tendency to lose track of: what actually closed, and how much is genuinely left. The failure mode isn't laziness; it's that "started" is trivially easy to count (every phase looks like it has some work landed) while "finished" requires actually checking a definition-of-done and recording the result somewhere durable — and the easy number quietly wins by default until nobody can say with confidence how much of the program is actually done.

The core honesty rule underneath this practice is that landed work is not a closed phase. A phase closes only when its definition-of-done has passed and the result is recorded wherever the project records results — anything short of that is "verification-owed," a specific and named state, not silently rounded up to done. This distinction matters enormously for AI-agent-driven or solo-developer work in particular, because there's no second person naturally checking whether "I wrote the code" quietly became "this is finished" in the retelling. A related rule: "how many left" is counted against phases that have actually closed, never against phases that have merely started — a program where every phase has begun and none has closed has, honestly, all of its phases still left.

The discipline also insists that a session which closed nothing say so plainly — "none" — rather than omit the report entirely. Most sessions legitimately close nothing, and hiding that fact is what trains everyone (human or agent) to stop reading the report at all, because it stops carrying real information. The same goes for blockers: naming them by kind ("unfunded — per-use spend" vs. "unfunded — one-off asset" vs. "unfunded — subscription") rather than lumping them into one vague bucket, because clearing one doesn't clear the others, and a report that hides that distinction hides exactly the information that would tell you what to do next.

## Key Concepts
- **Verification-owed, not done**: a phase whose code landed but whose definition-of-done hasn't been checked and recorded is verification-owed — a distinct, named state between started and closed
- **Count against closed, never against started**: "how much is left" is measured by what has actually closed against the program total, not by what has merely begun
- **"None" is a valid, required report**: a session that closed nothing must say so explicitly rather than omitting the close-out ritual
- **Blockers named by kind**: grouping distinct blockers under one vague label (e.g., "no budget") hides which one you could actually clear today
- **Touched-phases-only table**: the counter covers the whole program; the table covers only what this session touched — re-listing every phase every time stops being read
- **Reconciliation over flattery**: if your count disagrees with the project's own phase index, say so in the report rather than quietly picking the more flattering number
- **Portable enforcement**: this rule belongs in the project's own checked-in agent instructions (e.g., CLAUDE.md), not only in per-machine agent memory, which silently resets across checkouts and machines

## Example Code
```template
## Phase status — Order Management Admin Panel · 2026-08-26

**Counter:** 4 done · 1 verification-owed · 2 in progress · 5 not started  (total 12)
**Debt:** 1 verification-owed — compliant (limit 2)

| Phase | Before | After | Note |
|---|---|---|---|
| P6: Order status transitions | in progress | verification-owed | UI complete; no UAT run yet against confirmed status list |
| P7: Role-based access on order export | not started | in progress | Endpoint built, permission check not yet wired |
| **Closed this session** | | | **none** |

**Nearest blocker to the next close:** client-input — confirmed order status
transition list (Elena), needed before P6 can move from verification-owed to done.
```

## When to Use
- At the end of every working session — yours or an AI agent's — that touched a phase-tracked project, even if the session felt unremarkable
- Before telling a client or teammate "phase X is done," as a forcing function to confirm it actually passed its definition-of-done and was recorded
- When a program's phase count has started to feel unreliable or inflated, as a way to reconcile the honest count against the project's own index
- When handing a phase-tracked project to another developer or agent, so the incoming owner inherits an accurate picture instead of an optimistic one

## Common Mistakes
- Reporting "all phases started" as though breadth of activity were the same thing as progress toward completion
- Marking a phase done the moment its code ships, before its definition-of-done has actually been verified and recorded
- Omitting the close-out report entirely on a session that closed nothing, training everyone to stop reading it
- Keeping this rule only in per-machine agent memory instead of the project's checked-in instructions, so it silently disappears on a different checkout or machine

## Further Reading
- Annie Duke, *Thinking in Bets* — on the discipline of separating "I did the work" from "the outcome is confirmed," which underlies the verification-owed distinction
- Basecamp, *Shape Up* — the "hill chart" concept addresses the same problem of distinguishing real progress from activity: https://basecamp.com/shapeup/3.4-chapter-12
- Robert G. Cooper, *Winning at New Products* — the stage-gate model this close-out ritual borrows its "don't advance past an unverified gate" logic from
