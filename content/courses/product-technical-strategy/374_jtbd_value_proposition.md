# 374. Jobs to Be Done & Value Proposition — From User Motivation to Product Promise

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Product_Strategy_Rules material (specifically `jobs-to-be-done.md` and `value-proposition.md`) to build out the Product & Technical Strategy course; no existing coverage data for your own practice.

## What It Is
Jobs to Be Done (JTBD) reframes a feature request as a moment of progress a person is trying to make, rather than a checkbox on a spec. The format is deliberately situational: *When \<situation\>, I want to \<motivation\>, so I can \<progress\>.* The situation matters because needs are contextual — "when hundreds of attendees arrive at once" is a different problem than "when a single VIP arrives late," even though both involve "checking someone in." JTBD also separates three layers of the same job: the functional job (the practical task), the emotional job (the anxiety or confidence at stake), and the social job (how the person wants to be seen doing it). A features list built from "the competitor has it" ignores all three layers; a features list built from JTBD statements can be traced back to a specific moment of friction, which is what makes it defensible when someone asks "why are we building this instead of that."

Value proposition is the next step: once you know the job, you can state why your product is the right way to make progress on it, in contrast to what the person does today. The template — *For \<user\>, this product helps \<outcome\> by \<capability\>, unlike \<current alternative\>, it \<differentiated value\>* — forces a comparison against the actual status quo, not against an imagined competitor. Most differentiation claims fail because they assert uniqueness without substance ("a modern and innovative platform"); a value proposition grounded in JTBD instead names the specific pain reduced and gain created relative to the workaround the user has already built for themselves, which is a much higher bar and a much more honest one.

The two frameworks are sequential, not competing: JTBD tells you what progress the user is trying to make, and the value proposition tells you — and eventually the buyer — why this product is the vehicle for that progress. Skipping straight to a value proposition without doing the JTBD work first tends to produce marketing language with nothing underneath it; doing JTBD without ever converting it into a value proposition leaves you with rich user insight that never gets communicated to anyone deciding whether to fund the build.

## Key Concepts
- **JTBD statement**: When \<situation\>, I want to \<motivation/action\>, so I can \<desired progress\>
- **Three job layers**: functional (the practical task), emotional (the confidence or anxiety involved), social (how the person wants to be perceived)
- **Feature translation rule**: a feature is valid only if it visibly supports a stated job — "add notifications" is not a job; "notify the manager when an approval has waited 24 hours so delayed decisions don't block operations" is
- **Value proposition template**: For \<user\>, this helps \<outcome\> by \<capability\>, unlike \<current alternative\>, it \<differentiated value\>
- **Pain reducers vs. gain creators**: value has two directions — what friction goes away, and what new capability appears — and a strong value proposition usually names at least one of each
- **Differentiation must have substance**: "innovative and modern" is unfalsifiable; differentiation must be traceable to a specific workflow, data model, or constraint the alternative doesn't handle
- **Current alternative as the real competitor**: for most B2B and internal tools, the alternative is not another product — it's a spreadsheet, a shared inbox, or a person's memory, and the value proposition should be written against that, not against an imagined rival

## Example Code
```markdown
## Jobs Map — Crew Scheduler

| Situation | User motivation | Desired outcome | Candidate feature | Priority |
|---|---|---|---|---|
| A technician calls in sick mid-morning | Reassign their remaining jobs fast | No customer misses their appointment window | One-click reassign with availability filter | P0 |
| Two jobs get double-booked to the same tech | Resolve without calling both people | Conflict resolved in under 2 minutes | Conflict warning at assignment time | P0 |
| End of day, ops manager reviews the day | See what changed and why | Confidence nothing slipped through | Daily change log / audit view | P1 |

**Core job:**
When a technician calls in sick and I still have three jobs on their board, I want to see
who's free and reassign in one motion, so I can keep the day's schedule intact without
phoning around to check availability.

## Value Proposition — Crew Scheduler

**Target user/customer:** Dispatch coordinators at field service companies (10-50 technicians)

**Main problem:** Reassigning jobs during a live schedule conflict requires phone calls to
confirm technician availability, costing 15-20 minutes per incident.

**Current alternative:** A shared spreadsheet plus a group chat for real-time changes.

**Core product promise:**
"For dispatch coordinators managing field crews, Crew Scheduler cuts reassignment time from
20 minutes to under 2 by showing live technician availability and conflict warnings at the
moment you assign a job — unlike a spreadsheet and group chat, it never lets two jobs land
on the same technician in the first place."

**Pain reducers:** eliminates phone-call confirmation, eliminates double-booking
**Gain creators:** faster reassignment, a visible daily audit trail for ops
**Reason to believe:** conflict detection runs at assignment time, not after the fact
**Why now:** double-booking incidents are already costing ~20 hours/week in rework
```

## When to Use
- Right after role mapping (lesson 373), before writing the MVP definition — JTBD tells you which job the MVP must prove it can support
- Whenever a feature request arrives as "the competitor has this" — translate it into a JTBD statement first to see if the underlying job is even shared
- Before writing landing page copy, a sales pitch, or a proposal — the value proposition template is the source text for all of them
- When a team disagrees on priority — compare candidate features against the same JTBD statement to see which one actually advances the user's progress
- When differentiation feels vague — rewrite it against the specific current alternative (spreadsheet, inbox, memory) instead of an abstract competitor

## Common Mistakes
- Writing a feature list copied from a competitor's marketing page instead of deriving features from an actual situational job
- Stopping at the functional job and ignoring the emotional or social one, then being surprised when a technically correct feature still doesn't get adopted
- Asserting differentiation ("modern," "innovative," "AI-powered") without naming the specific workflow, constraint, or data model that makes it true
- Writing the value proposition against an imagined competitor instead of the real current alternative, which is usually a spreadsheet, an inbox, or a person's memory

## Further Reading
- Clayton Christensen, Taddy Hall, Karen Dillon, David Duncan — "Competing Against Luck" (the foundational JTBD text)
- Alexander Osterwalder et al. — "Value Proposition Design" (the pains/gains framing this lesson draws on)
- Bob Moesta — "Demand-Side Sales 101" / the Rewired Group's JTBD interview method, for turning JTBD from a template into an actual research practice
