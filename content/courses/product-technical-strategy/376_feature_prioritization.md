# 376. Feature Prioritization — Scoring Beyond Stakeholder Excitement

## What It Is
Once an MVP boundary exists (lesson 375), there is usually still a long list of features competing for the space inside and just outside it, and "whoever asked most recently" or "whoever is most senior" are the default prioritization mechanisms in the absence of a real one. Feature prioritization replaces that with a repeatable scoring pass across seven dimensions: user value, business value, risk reduction, learning value, effort, dependency, and urgency. None of these alone is sufficient — a feature can have high user value and still lose to something with lower value but much lower effort and a hard dependency that everything else needs first.

The output is a bucket, not just a score: P0 Core (the MVP breaks without it), P1 Important (strong value, include if timeline allows), P2 Later (useful, not required for launch), P3 Backlog (an idea with no near-term commitment), and Out (misaligned or too costly for this phase). The bucket assignment has to survive a "why" question — a feature is P0 only because removing it breaks the MVP's core outcome, not because it's popular. This is what turns prioritization from a vibe into a decision that can be defended to a stakeholder who didn't get their favorite feature into the first release.

The dependency dimension is the one teams most often skip, and it's the one that causes the most rework. Advanced analytics depends on having reliable event or order data first; automated refunds depend on a stable, already-integrated payment provider and an agreed refund policy; multi-tenant permissions depend on a settled role model. Scoring a feature high on value while ignoring that its prerequisite doesn't exist yet produces a roadmap that looks ambitious and is actually unbuildable in the order it's written — the sequencing failure shows up mid-project, at the worst possible time to discover it.

## Key Concepts
- **Seven scoring dimensions**: user value, business value, risk reduction, learning value, effort, dependency, urgency
- **Priority buckets**: P0 Core (breaks MVP without it), P1 Important (strong value, timeline permitting), P2 Later (useful, not required for launch), P3 Backlog (idea only), Out (misaligned or too costly)
- **Simple scoring formula**: value + urgency + learning + risk reduction − effort, scored 1–5 per dimension; not exact math, a forcing function for reasoning
- **P0 test**: a feature is P0 only if removing it breaks the MVP's core outcome, never because of stakeholder enthusiasm alone
- **Dependency-aware sequencing**: check whether a high-value feature's prerequisite (data, integration, role model) actually exists before scheduling it early
- **Forbidden justifications**: "all features are important," "we can add everything to MVP," "this is simple, let's include it," "the competitor has it" are not valid prioritization reasoning on their own
- **Reason-required prioritization**: every row in the priority table must carry a written reason, not just a bucket label — the reason is what makes the decision reviewable later

## Example Code
```markdown
## Feature Prioritization — Crew Scheduler (post-MVP candidates)

| Feature | User value | Business value | Effort | Risk/dependency | Priority | Reason |
|---|---:|---:|---:|---|---|---|
| Route optimization | 4 | 3 | 5 | Depends on 3+ months of assignment history data | P2 | High value, but data prerequisite doesn't exist yet — premature before MVP has run |
| Multi-dispatcher support | 5 | 5 | 3 | None | P1 | Needed once a second region onboards; no blocking dependency |
| Customer self-scheduling | 2 | 3 | 4 | None | P3 | Nice-to-have; MVP problem is internal double-booking, not customer-facing UX |
| Audit log for reassignments | 4 | 4 | 1 | None | P0 | Already part of the MVP quality floor (lesson 375); without it, disputes about "who moved this job" are unresolvable |
| Payroll integration | 1 | 2 | 5 | Depends on finalized payroll vendor selection | Out | Not aligned with the core scheduling problem this phase is solving |
```

## When to Use
- Immediately after the must-have list is settled in MVP scoping — this is where everything that didn't make P0 gets a defensible home instead of disappearing into an undifferentiated backlog
- Whenever a client, executive, or teammate presents a large feature wishlist copied from a competitor
- When a roadmap review surfaces disagreement about what ships next — re-score the disputed items together instead of arguing about the outcome directly
- Before committing engineering time to a feature whose value looks high in isolation — check the dependency column first
- Periodically (quarterly, or at each roadmap phase boundary) to re-bucket backlog items as circumstances change

## Common Mistakes
- **Every feature on the list scores a 5 out of 5 on value, because marking anything lower feels like picking a fight** — Scoring every feature as high-value because saying no feels uncomfortable, which produces a priority list that prioritizes nothing
- **Route optimization gets scheduled for next sprint, and the three months of assignment data it actually depends on doesn't exist yet** — Ignoring the dependency dimension and scheduling a feature before its prerequisite (data, integration, policy) exists, discovering the gap mid-sprint
- **"The competitor has this" is the entire justification, with nobody checking whether it's actually solving the same job** — Accepting "the competitor has it" as sufficient justification without checking whether the underlying job (see lesson 374) is even shared
- **A feature marked P3 six months ago is still sitting there, never reconsidered even though the product has changed a lot since then** — Treating the P0/P1/P2 buckets as permanent instead of periodically re-scoring backlog items as the product and its data maturity change

## Further Reading
- Itamar Gilad — "Confidence Meter" and the RICE-adjacent prioritization writing on itamargilad.com
- Intercom's "How we prioritize" engineering/product blog series (effort vs. impact frameworks in practice)
- Teresa Torres — "Continuous Discovery Habits," chapter on opportunity solution trees, for connecting prioritization back to the problem it's meant to serve
- [RICE scoring, as originally described by Intercom](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/) — the source of the framework, including the reach/confidence definitions most retellings drop
