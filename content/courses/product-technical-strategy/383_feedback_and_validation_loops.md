# 383. Feedback and Validation Loops — Testing Assumptions Before and After Launch

## What It Is
Every product plan carries assumptions, and feedback and validation loops are the discipline of testing them on purpose instead of discovering they were wrong after the money and the timeline are already spent. Validation is not a single "user testing" phase that happens once before launch — it runs continuously, from a stakeholder interview before a line of code exists, through a clickable-mockup test or a manual concierge test during MVP scoping, to a pilot rollout, and on into analytics review and support-ticket analysis months after the thing is live. Each method answers a different question at a different cost, and picking the cheapest method that can actually kill a bad assumption is the point — you don't need a pilot to learn that nobody understands your onboarding copy.

The tool that keeps this honest is the assumption record: for every uncertain product decision, name the assumption, the risk if it turns out false, the validation method, the success signal that would confirm it, and who owns following through. "Dispatch coordinators will trust an automated conflict-detection algorithm over their own manual double-check" is a real assumption sitting underneath a scheduling product's entire value proposition — if it's false, the feature gets built and ignored. The validation is cheap (watch one coordinator use it for a week and ask whether they still manually cross-check), and the success signal is concrete (they stop manually cross-checking by day 3). Without writing this down, the team ships the feature and finds out three months later, from a support ticket, that nobody trusts it.

Feedback discipline is the other half, and it matters just as much once something is live: incoming feedback has to be sorted into bug, usability issue, missing requirement, feature request, strategic insight, or personal preference before it's allowed anywhere near the backlog. This connects directly to scope boundaries (lesson 377) — an excited stakeholder's feature request is not automatically scope just because it arrived during a feedback session, and the change-request triggers defined there are exactly what decides whether validated feedback becomes new scope or gets logged for later. The questions that produce useful feedback are specific: what task were you trying to complete, where did you hesitate, what felt unnecessary, what information was missing, what would prevent you from using this regularly, what would make this clearly better than your current workaround.

## Key Concepts
- **Validation methods by cost**: stakeholder interview, user interview, prototype walkthrough, clickable mockup test, manual concierge test, landing page interest test, pilot usage, analytics review, support ticket analysis — cheapest method that can kill the assumption wins
- **Assumption record fields**: assumption, risk if false, validation method, success signal, owner, decision impact
- **Validation runs before and after launch**: pre-build validation (interviews, mockups) and post-launch validation (analytics, support tickets, pilot usage) are the same discipline applied at different stages
- **Feedback classification (six types)**: bug, usability issue, missing requirement, feature request, strategic insight, personal preference — sort before triaging, never after
- **Not all feedback is scope**: a feature request only becomes scope when it passes through the change-request triggers from scope boundaries (lesson 377), not because it arrived with enthusiasm
- **Feedback interview questions**: task attempted, point of hesitation, what felt unnecessary, missing information, what would block regular use, what would beat the current workaround
- **Decision impact field**: an assumption record is incomplete without stating what changes if the validation fails — otherwise validation becomes a formality nobody acts on

## Example Code
```template
## Validation Plan — Crew Scheduler

**Assumption:** Dispatch coordinators will trust the automated conflict-detection
check enough to stop manually cross-referencing technician schedules by hand.

**Risk if false:** Coordinators keep a shadow paper/spreadsheet process running
alongside the tool, the core value proposition (eliminate double-booking) never
materializes, and adoption stalls even if the feature works correctly.

**Validation method:** Manual concierge test — one coordinator uses the tool for
a live 2-week scheduling window while a team member observes whether they still
manually cross-check assignments before confirming.

**Participants:** 1 dispatch coordinator, 8 technicians, single region.

**Success signal:** Coordinator stops manually cross-checking by day 3 of the
pilot and reports the conflict warning as sufficient in a short debrief.

**Decision after validation:**
- If confirmed: proceed with automated-only conflict detection in V1, no manual
  override screen needed.
- If disconfirmed: add a "coordinator confirms" step before assignment is final,
  and treat trust-building UI copy as a must-have, not a nice-to-have.

---

## Feedback Log Entry — Post-Pilot Week 2

| Feedback | Category | Action |
|---|---|---|
| "Can it also do payroll?" | Feature request | Logged for roadmap; not a change-request trigger on its own |
| "I didn't notice the conflict warning color" | Usability issue | Fixed before next pilot cycle |
| "App froze when I reassigned two jobs fast" | Bug | Filed immediately, blocks pilot continuation |
| "We actually run two regions, not one" | Missing requirement | Escalated — check against MVP scope assumption |
```

## When to Use
- Before committing engineering time to any feature built on an unstated assumption about user behavior, not just user need
- During MVP scoping (lesson 375) and pilot context definition, to decide which assumptions are risky enough to need a validation method before build
- Immediately after any pilot or beta, to run feedback through the six-way classification before it reaches a backlog or a stakeholder meeting
- Whenever a stakeholder reports feedback secondhand ("a user said...") — get the actual question answered directly rather than accepting a paraphrase as validated signal
- When a feature is live but adoption is flat — check whether the original assumption was ever actually validated or just assumed true because it felt obvious

## Common Mistakes
- **A loud feature request jumps the queue ahead of a documented usability blocker nobody classified first** — Treating every piece of feedback as equally actionable instead of classifying it first, which lets one loud feature request skip the line ahead of a documented usability blocker
- **The pilot runs for two weeks, and nobody agreed in advance on what result would actually confirm the assumption** — Running validation without a stated success signal, so the team can't agree afterward on whether the assumption was confirmed or not
- Confusing a stakeholder's confidence in an assumption with evidence that it's true — the whole point of validation is that confidence isn't proof
- **A validated piece of feedback turns straight into a backlog item, skipping the change-request classification entirely** — Letting validated feedback become scope automatically instead of running it through the change-request triggers from scope boundaries (lesson 377)
- **The validation test runs, the results come in, and the plan proceeds exactly as if nothing had been learned** — Skipping the "decision after validation" step, so a validation exercise happens but nothing about the plan actually changes based on the result

## Further Reading
- Teresa Torres — "Continuous Discovery Habits" (on running lightweight validation as a continuous practice rather than a pre-launch gate)
- Rob Fitzpatrick — "The Mom Test" (on asking questions that produce real signal instead of polite agreement)
- Marty Cagan — "Inspired" (on separating validated product risk from unvalidated stakeholder opinion)
