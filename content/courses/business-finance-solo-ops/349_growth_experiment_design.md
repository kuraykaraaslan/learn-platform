# 349. Designing Growth Experiments That Produce Real Signal

## What It Is
> This lesson is general education, not financial or tax advice. Directional signal from small-sample experiments should be treated as suggestive, not statistically conclusive.

A growth experiment has to test a specific hypothesis, or it produces noise and false confidence dressed up as progress. Every real experiment defines eight things before it starts: the hypothesis, the single variable being changed, the target audience or channel, the success metric, the baseline it's being measured against, the expected improvement, the duration, and — critically — the decision rule that says in advance what result leads to continuing, stopping, iterating, or scaling. "If I turn technical project posts into before-after case study posts, qualified DMs will increase because buyers understand business value faster" is an experiment. "Post more" or "try ads" or "make the website better" are initiatives, not experiments — they have no falsifiable claim and no way to know afterward whether they worked.

Because a solo operator's traffic and lead volume are inherently small, growth experiments here should not require statistically perfect A/B tests — but they must stay honest about the resulting uncertainty rather than pretending small-sample results are conclusive. Valid early signals at low volume include more qualified replies, better discovery call quality, a stronger referral response, more case-study mentions in conversation, and fewer low-budget leads — directional evidence that a future decision can actually be made from, even without a statistically significant sample.

Ideas should not live in scattered notes; they belong in a backlog where every entry is written as a hypothesis and scored with a simple ICE framework — Impact, Confidence, and Ease, each rated 1-5, summed into a single priority score. Ease matters more for a solo operator than it would for a larger team: a theoretically high-impact idea that requires 40 hours of setup is often not the right next experiment when a lower-impact, two-hour test is sitting right below it in the backlog. Prioritize experiments that improve qualified lead quality, reduce wasted calls, increase proof and trust, reuse assets that already exist, and can be tested within one to two weeks; deprioritize anything that needs a paid tool before the idea is validated manually, optimizes a vanity metric only, or requires heavy engineering before any real demand has been shown to exist.

```quiz
- q: "\"Post more\" and \"try ads\" are sitting on your growth list. What is wrong with them?"
  anchor: "they have no falsifiable claim and no way to know afterward whether they worked"
  options:
    - text: "Nothing structural — they are experiments, just broadly scoped"
      correct: false
      why: "Scope is not the problem. Neither one can be proven wrong, so neither can produce a result you could act on."
    - text: "They are initiatives, not experiments — nothing falsifiable, nothing to judge afterward"
      correct: true
      why: "An experiment names a change, a metric and a reason. \"Post more\" names none of the three."
    - text: "They become experiments once you attach a duration to them"
      correct: false
      why: "A duration on an unfalsifiable claim only fixes how long you spend not learning anything."

- q: "Of the eight required fields, which one has to be fixed before the experiment starts or the result turns into an argument?"
  anchor: "the decision rule that says in advance what result leads to continuing, stopping, iterating, or scaling"
  options:
    - text: "The success metric — everything else follows from it"
      correct: false
      why: "The metric matters, but a metric with no pre-committed threshold still leaves the debate about what the number \"really means\"."
    - text: "The decision rule — what result leads to continuing, stopping, iterating or scaling"
      correct: true
      why: "Fixed in advance, whatever comes back already has a next action attached instead of a discussion."
    - text: "The duration, since stopping early is the most common failure"
      correct: false
      why: "Stopping early is a real mistake, but what holds the duration is the decision rule — it is the thing that says a weak first week is not yet a result."

- q: "Two backlog ideas: A scores Impact 5, Confidence 4, Ease 1; B scores Impact 3, Confidence 4, Ease 5. Which one does a solo operator run next?"
  anchor: "Ease should be weighted heavily since execution time is the real constraint"
  options:
    - text: "A — impact is what actually moves the business"
      correct: false
      why: "A 40-hour setup that never gets executed has an impact of zero. At solo scale, execution time is the binding constraint."
    - text: "B — the higher ICE score (12 against 10), carried mostly by ease"
      correct: true
      why: "A lower-impact two-hour test that actually runs beats a high-impact one that sits in the backlog."
    - text: "Both, in parallel, to save calendar time"
      correct: false
      why: "Two changes at once in one low-volume channel is the multi-variable mistake in another costume — neither result stays attributable."
```

## Key Concepts
- **Eight required experiment fields**: hypothesis, variable changed, target audience/channel, success metric, baseline, expected improvement, duration, and decision rule.
- **Hypothesis format**: "If I [change], then [metric] will improve because [reason]" — a claim specific enough to be proven wrong.
- **Solo-scale constraint**: statistically perfect A/B testing is not required at low traffic volumes, but uncertainty must be stated honestly rather than treated as a confirmed result.
- **Valid low-volume signals**: more qualified replies, better discovery call quality, stronger referral response, more case-study mentions, fewer low-budget leads.
- **ICE backlog scoring**: Impact (1-5) + Confidence (1-5) + Ease (1-5) = priority score; for a solo operator, Ease should be weighted heavily since execution time is the real constraint.
- **Prioritization filter**: favor experiments that improve lead quality, reduce wasted calls, build trust, reuse existing assets, and can run in 1-2 weeks; deprioritize anything needing a paid tool or heavy engineering before demand is proven.

## Example Code
A filled experiment definition plus its backlog entry with ICE scoring:

```md
# Experiment: Case-Study-Style LinkedIn Posts

## Hypothesis
If I rewrite technical project recaps as before/after case-study
posts (problem -> approach -> result), then qualified DM replies
will increase, because buyers understand business value faster than
they understand technical detail.

## Target
LinkedIn audience of SME founders and ops leads (current ICP).

## Variable
Only the post format changes (case-study structure vs. technical
recap) — posting frequency and topic selection stay constant.

## Baseline
Last 8 technical-recap posts: average 1.2 qualified DMs per post.

## Success Metric
Qualified DMs per post (must meet the qualified-lead definition
from the growth model, not just any reply).

## Duration
4 weeks, 2 posts per week (8 posts total).

## Decision Rule
Scale (make this the default format) if average qualified DMs per
post rise to 2+ across the 8 posts. Iterate if it rises to 1.5-2.
Stop and revert to technical recaps if it stays at or below 1.2.

---

## Backlog Entry

ID: GR-014
Title: Case-study-format LinkedIn posts
Area: Content
Hypothesis: (as above)
Channel: LinkedIn
Target ICP: SME founders / ops leads
Impact: 4   Confidence: 3   Ease: 4   ICE Score: 11
Status: Running
Start date: 2026-08-04   End date: 2026-09-01
```
The decision rule was fixed before the first post went out — so whatever the result, there's a pre-committed next action instead of a debate about what the numbers "really mean."

## When to Use
- Before changing any offer, landing page, CTA, outbound message, pricing anchor, referral ask, or newsletter flow — write the hypothesis first, not after the change is already live.
- When a new growth idea occurs mid-week — capture it as a backlog entry with an ICE score rather than acting on it immediately or forgetting it.
- During the weekly or monthly growth review, to check the status and current signal of any experiment currently running.
- When choosing what to test next from a backlog with more ideas than available time — use the ICE score, prioritizing ease at solo scale.

## Common Mistakes
- **The post format, the posting time, and the call-to-action all changed at once, and the results get credited to the new format** — Changing multiple variables at once (new format, new CTA, new posting time) and then claiming the result proves one specific change worked.
- **The new outreach script is being tested, and nobody wrote down what the old response rate actually was** — Running an experiment with no baseline, making it impossible to know afterward whether anything actually improved.
- **The first week of the four-week test came in weak, and the experiment gets shelved the same day** — Stopping an experiment after one disappointing result without letting it run the full planned duration.
- **Engagement on the new post format is way up, and that's the reason it's being made the default going forward** — Scaling a tactic based on a vanity metric (likes, impressions) rather than the qualified-lead-connected success metric defined up front.

## Further Reading
- *Testing Business Ideas* — David J. Bland and Alexander Osterwalder: a structured catalog of experiment types matched to the strength of evidence they produce.
- *The Lean Startup* — Eric Ries: the build-measure-learn loop that underlies treating growth tactics as testable hypotheses rather than permanent commitments.

```recall
- q: "Name the eight things an experiment defines before it starts."
  must:
    - "the hypothesis and the single variable being changed"
    - "the target audience or channel"
    - "the success metric"
    - "the baseline"
    - "the expected improvement and the duration"
    - "the decision rule"

- q: "Give the hypothesis format and say what makes it a hypothesis rather than an intention."
  must:
    - "If I [change], then [metric] will improve because [reason]"
    - "it is specific enough to be proven wrong"

- q: "At solo volumes a statistically clean A/B test is off the table. What counts as valid early signal instead?"
  must:
    - "more qualified replies"
    - "better discovery call quality"
    - "a stronger referral response"
    - "more case-study mentions in conversation"
    - "fewer low-budget leads"
    - "the uncertainty is stated honestly rather than treated as conclusive"

- q: "What gets deprioritized in the backlog whatever its ICE score says?"
  must:
    - "anything needing a paid tool before the idea is validated manually"
    - "anything optimizing a vanity metric only"
    - "anything requiring heavy engineering before real demand has been shown"
```
