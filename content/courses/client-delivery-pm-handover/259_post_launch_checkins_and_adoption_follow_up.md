# 259. Post-Launch Check-Ins and Adoption Follow-Up

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Customer_Success_and_Support_Rules/adoption-and-usage-follow-up.md material to build out the Client Delivery, PM & Handover course; no existing coverage data for your own practice.

## What It Is
A project can be technically complete, pass every quality gate, and still fail — not because anything is broken, but because the people it was built for never actually adopted it. Deployment is not the same claim as adoption, and measuring success only by "is it live" misses the entire category of failure where a system works perfectly and sits mostly unused while staff quietly keep updating the old spreadsheet on the side. Adoption follow-up exists to check the thing quality gates can't check: is this actually producing value for real users doing real work.

The check has a specific shape, and it happens on a schedule rather than only when something goes visibly wrong: a basic usability check three to seven days after launch, a fuller adoption review two to four weeks out, and a business-value review at two to three months. Each stage asks concrete questions — who is actually using the system regularly, which workflow gets used the most, which one gets avoided, where do people get confused, is any manual workaround still quietly happening in parallel. The risk signals worth watching for are specific too: only the owner logging in, the team still keeping a shadow spreadsheet, the same support question recurring, an admin visibly avoiding a particular feature — each of these is informative in a different way, and none of them show up in an uptime dashboard.

The harder discipline is diagnosing why adoption is weak when it is, because not every adoption problem is a software bug. It might be poor training, a genuinely confusing part of the interface, a missing feature, client-side process confusion, internal resistance to change, or a data-quality problem upstream of the system entirely. Assuming it's always a bug leads to unnecessary rework; assuming it's always the client's fault leads to a client who feels blamed instead of helped. The job is figuring out which one it actually is before proposing a fix.

## Key Concepts
- **Deployment is not adoption**: a live system with nobody using its core workflow has not succeeded just because it shipped and passed QA
- **A fixed follow-up cadence**: 3–7 days post-launch for a basic usability check, 2–4 weeks for an adoption review, 2–3 months for a business-value review — shortened for faster-moving systems
- **Concrete adoption questions, not a general "how's it going"**: who uses it regularly, which workflow is avoided, where do users get confused, is any manual workaround still happening
- **Named risk signals**: only-the-owner-uses-it, parallel spreadsheets still running, a repeated support question, a feature an admin visibly avoids, inconsistent data entry — each implies a different next action
- **Not every adoption problem is a software bug**: poor training, unclear UI, a genuinely missing feature, client-side process confusion, internal resistance, or data quality can each be the real cause, and the right fix depends on correctly identifying which
- **Adoption evidence beats assumption**: login signals, workflow completion, actual support ticket themes, and direct business-owner feedback are the real signal — "it's live, so it must be working" is not evidence
- **Expansion should wait for confirmed value**: proposing new paid work before adoption is actually verified risks selling growth on top of a foundation that isn't actually being used yet

## Example Code
```md
# Adoption Follow-Up — Order Management Admin Panel
**Check-in:** 3 weeks post-launch (2026-10-02)

## Active Users
4 of 4 warehouse staff logging in daily. Tomas checks the dashboard weekly.

## Workflows Used
Order status transitions (daily, all staff). CSV export (weekly, Elena only).

## Workflows Avoided
None reported — full adoption of the core order workflow.

## Support Themes
2 questions this month, both about the "Cancelled orders can't be reopened"
rule — already documented in the admin guide, but staff missed it during
training. Recommend adding an inline UI note.

## Manual Work Still Remaining
None reported for order tracking. Elena mentioned inventory counts are still
tracked in a separate spreadsheet — out of current scope, flagged as a
possible future phase.

## Recommended Improvements
- Add an inline warning on the Cancelled status option, since this is the
  most repeated point of confusion
- Revisit inventory tracking as a Phase 2 conversation once current system
  is fully bedded in

## Next Action
Send the inline-warning fix as a small goodwill change (low effort, high
support-reduction value). Schedule a 3-month business-value review for
2026-11-27.
```

## When to Use
- On a fixed schedule after every launch — 3–7 days, 2–4 weeks, and 2–3 months out — regardless of whether the client raises any concerns themselves
- Whenever support requests repeat the same question, as the trigger to check whether it's a training gap, a UI clarity issue, or a genuine defect
- Before proposing any expansion, upsell, or new phase, to confirm the current system is actually adopted and delivering value first
- When a client seems quiet after launch, since silence can mean smooth sailing or quiet non-adoption, and only a direct check-in tells you which

## Common Mistakes
- Assuming the project succeeded because it deployed successfully, without ever checking whether real users adopted the core workflows
- Treating user confusion as user error rather than investigating whether training, UI clarity, or documentation was the actual cause
- Letting the same support question repeat multiple times without recognizing it as an adoption signal worth acting on
- Proposing new paid features or an upsell before confirming the delivered system is actually being used and valued

## Further Reading
- Lincoln Murphy, "Customer Success" writing on defining and measuring 'appropriate experience' as the real measure of product success, not deployment status
- Intercom, "The New Customer Onboarding Playbook" — practical guidance on adoption checkpoints after go-live: https://www.intercom.com/blog/customer-onboarding/
- Nielsen Norman Group, "Diagnosing usability problems" — on distinguishing genuine usability defects from training or process gaps: https://www.nngroup.com/articles/
