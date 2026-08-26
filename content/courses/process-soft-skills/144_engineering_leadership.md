# 144. Engineering Leadership — Team Management, 1:1s, Performance Reviews

## Coverage Level
**Not assessed** — added during the roadmap gap review. Mentorship (#80) covers guiding one person's technical growth; this is the distinct, broader skill of actually managing a team — direct reports, feedback, hiring — for the IC-to-management transition.

## What It Is
The core mistake engineers make transitioning into leadership is treating it as "mentorship, but for more people" — it isn't. Management adds responsibilities that have no individual-contributor equivalent: running **1:1s** that belong to the report, not the manager (a status update disguised as a 1:1 wastes the one regular time carved out for what the report actually needs to raise); giving **calibrated feedback** — specific, timely, aimed at a behavior rather than a personality trait, delivered close to the moment it's relevant instead of saved up for an annual review where it's too late to act on; and owning outcomes (a team's delivery, a person's growth) that can only be influenced indirectly, through other people's work, not controlled directly the way your own code always was.

**Hiring** extends past the interview design already covered in #84 — a working pipeline is sourcing (finding candidates, not just waiting for applications), structured screening, calibrated interviews (multiple interviewers reconciling their signal against the same bar, not each in isolation), and a clear-eyed offer decision. The through-line across all of it is that leadership work is evidence-based, same as engineering: feedback should point at specific, observable behavior; a hiring decision should point at specific signal from the loop; a growth plan should point at concrete next steps, not vague aspirations like "be more senior."

## Key Concepts
- **1:1s belong to the report**: the manager's job is to ask what's on their mind and remove blockers, not deliver a status readout
- **Calibrated feedback**: specific (a real instance, not a vague pattern), timely (days, not months, after the fact), behavior-focused (what happened, not who they are)
- **Growth plans tied to evidence**: concrete, observable next steps ("lead the next cross-team design review") instead of unmeasurable goals ("be more proactive")
- **Hiring funnel beyond the interview**: sourcing → screening → structured/calibrated interviews → an evidence-based offer decision
- **Calibration**: multiple interviewers' independent signal reconciled against the same bar, not one person's gut feeling deciding alone
- **Indirect influence**: outcomes now happen through other people's work — the job shifts from doing to enabling and unblocking

## Example Code
```typescript
// Not code — the deliverable of this skill is written communication.
// A 1:1 agenda template (the report drives it) vs a feedback statement rewritten to be actionable.

const oneOnOneTemplate = `
1. What's on your mind? (their agenda first, always)
2. Anything blocking you right now?
3. [Manager's items, if any room is left — kept short deliberately]
4. Anything on the growth/career front you want to talk through?
`;

// Vague, not actionable:
const vagueFeedback = "You need to be more proactive on the team.";

// Specific, timely, behavior-focused:
const calibratedFeedback =
  "In yesterday's incident, I noticed you waited for someone to assign the fix instead of " +
  "picking it up once you spotted the root cause in the logs. Next time, claiming it yourself " +
  "the moment you see it would have saved about 20 minutes.";
```

## When to Use
- Transitioning from senior IC to tech lead or engineering manager — this is the specific skill set that role requires, distinct from technical mentorship
- Running or contributing to a team's hiring loop — beyond writing good interview questions (#84), owning calibration and pipeline health
- Any performance conversation, especially a hard one — specificity and timeliness are what make it actionable instead of just uncomfortable

## Common Mistakes
- Letting 1:1s become status updates the manager delivers, instead of time that belongs to the report's actual concerns
- Saving feedback for the annual/quarterly review instead of giving it close to when it happened, when it can still change behavior
- Hiring purely on interview performance without checking whether the candidate fills a specific, named gap the team actually has
- Vague growth goals ("be more senior," "show more leadership") that give no concrete signal for either party to know if progress happened

## Further Reading
- "The Manager's Path" by Camille Fournier — the engineering-specific transition guide
- "Radical Candor" by Kim Scott — the feedback framework (care personally + challenge directly)
- "An Elegant Puzzle" by Will Larson — systems thinking applied to engineering management specifically
