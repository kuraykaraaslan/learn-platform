# 386. Release Strategy — Alpha, Beta, Pilot, and Rollout

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Product_Strategy_Rules material (specifically `release-strategy.md`) to build out the Product & Technical Strategy course; no existing coverage data for your own practice.

## What It Is
A release is a product decision, not a deployment event — it decides who gets access, under what conditions, and how much risk is acceptable at each stage, and it deserves the same explicitness as MVP scoping (lesson 375) or scope boundaries (lesson 377). The stage ladder runs from internal demo (verifying direction with the client, not user-ready) through stakeholder review, alpha (internal team or trusted testers, bugs expected), private beta (selected real users under close monitoring), pilot (a real business context with deliberately controlled scope), production launch (actual target users with support and rollback awareness), phased rollout, and finally public launch. Skipping stages under schedule pressure is how "let's just show it to a few real customers" quietly becomes an unmonitored production launch with no rollback plan.

Before any release, a go/no-go checklist turns "it's basically done" into an actual decision instead of a feeling: the core flow works, critical permissions are correct, critical data is safe, known blockers are resolved, a support path exists, a rollback or manual fallback exists, the client has accepted the scope being released, analytics or logging exists where it's needed, and handover notes are ready. Any "no" on that list is a reason to hold the release, not a note to fix after launch — a rollback plan invented during the first incident is not a rollback plan.

Rollout strategy is the mechanical choice that connects the release stage to real risk exposure: single launch, phased by user group, phased by location or customer, feature-flag rollout, manual invite rollout, or pilot-only release. This choice should trace directly back to the pilot context field defined during MVP scoping (lesson 375) — that field names who the first real users are; release strategy decides how they're let in, in what order, and what happens if something goes wrong for the first cohort before it reaches the next one.

## Key Concepts
- **Release stage ladder**: internal demo → stakeholder review → alpha → private beta → pilot → production launch → phased rollout → public launch
- **Stage definitions**: internal demo (direction check only), alpha (internal/trusted testers, bugs expected), private beta (real users, close monitoring), pilot (real business context, controlled scope), production launch (real target users with support/rollback readiness)
- **Go/no-go checklist**: core flow works, permissions correct, data safe, blockers resolved, support path exists, rollback/manual fallback exists, client accepted scope, analytics/logging exists, handover notes ready
- **Rollout strategy options**: single launch, phased by user group, phased by location/customer, feature-flag rollout, manual invite rollout, pilot-only release
- **Connection to pilot context (lesson 375)**: the pilot context names who the first real users are; rollout strategy decides the mechanics of exposing them and containing failure
- **Rollback as a pre-release requirement**: defined and agreed before the first release, not improvised during the first incident
- **Post-release review date**: a release strategy is incomplete without a scheduled date to review what actually happened against go-live criteria

## Example Code
```markdown
## Release Strategy — Crew Scheduler Pilot

**Release type:** Pilot

**Target users:** 1 dispatch coordinator, 8 technicians, single region
(matches the pilot context defined during MVP scoping).

**Included scope:** Job creation, technician assignment with conflict
detection, day/week calendar view, manual reassignment, SMS notification.

**Known limitations:** No route optimization; no customer-facing portal;
single coordinator only (no multi-dispatcher support yet).

**Go-live criteria:**
- [x] Conflict detection verified against 20 manually-constructed test cases
- [x] SMS delivery confirmed with the client's actual carrier
- [x] Rollback: coordinator can revert to the spreadsheet process within one day
- [x] Support path: direct Slack channel with the dev team during pilot window
- [x] Client has signed off on pilot scope and 2-week duration

**Rollout strategy:** Pilot-only release — single coordinator, manual invite,
no self-service signup during this stage.

**Support plan:** Daily check-in call for the first 3 days, then async Slack
for the remainder of the 2-week window.

**Rollback/manual fallback:** Coordinator keeps the existing spreadsheet
process available and unarchived for the full pilot duration; formal rollback
trigger is two or more missed conflict detections in the first week.

**Post-release review date:** End of week 2, before deciding on phased rollout
to a second region.
```

## When to Use
- Immediately after MVP scoping (lesson 375) defines the pilot context, to decide the mechanics of how that pilot cohort is actually exposed to the product
- Before every release stage transition — alpha to beta, beta to pilot, pilot to production — not just before the final public launch
- Whenever schedule pressure pushes toward skipping a stage ("let's just give it to a few real customers now") — check the go/no-go checklist explicitly rather than deciding by feel
- When a client asks for a broader rollout than the current stage supports — use the rollout strategy options to propose a phased path instead of an all-at-once release
- Before quoting a go-live date to a client — the go/no-go checklist is what that date is actually promising

## Common Mistakes
- Treating an informal demo to real customers as if it were a monitored pilot, with no support path or rollback plan behind it
- Skipping stages under deadline pressure and discovering the rollback plan doesn't exist only after something breaks in front of real users
- Choosing a rollout strategy that doesn't match the pilot context — for example, a single-launch release when the pilot context specifically named one region as the controlled first exposure
- Treating the go/no-go checklist as advisory rather than a genuine gate, so releases proceed on schedule regardless of what the checklist shows
- Never scheduling the post-release review, so lessons from the pilot never make it back into the next stage's plan

## Further Reading
- Marty Cagan — "Inspired" (on treating a release as a risk-managed decision rather than a milestone to hit)
- Jez Humble & David Farley — "Continuous Delivery" (on staged rollout and feature-flag mechanics as risk-reduction tools)
- Laura Klein — "Build Better Products" (on structuring beta and pilot stages around what you actually need to learn from real users)
