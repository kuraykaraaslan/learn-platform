# 255. Known Issues and Troubleshooting Disclosure

## What It Is
Every real system ships with some limitations, and the choice a developer actually has is not whether limitations exist but whether they're disclosed. Hiding a known limitation to avoid an uncomfortable conversation at handover doesn't make the limitation go away — it just guarantees the client discovers it themselves, at a less convenient moment, with less trust in the relationship than they had before. Known-issues documentation is the professional alternative: naming limitations, non-critical unresolved issues, and common errors plainly, alongside their severity, their workaround if one exists, and who owns eventually resolving them.

The severity classification matters because it tells the reader how urgently to react: a blocker means the system is unusable, high means a critical workflow is broken, medium means something important has a workaround, and low is cosmetic. A known issue entry without a stated severity leaves the reader unable to distinguish "ignore this for now" from "escalate this immediately," which defeats the purpose of writing it down at all. A workaround, when one exists, should be written as concretely as the fix itself — "export one month at a time until pagination-based export is implemented" is something a client's staff member can actually act on; "there's a known export issue" is not.

Troubleshooting documentation extends this same instinct forward to the client's own team: for common categories like login problems, email delivery, and payment or webhook failures, a short list of possible causes and a numbered set of diagnostic steps lets non-technical staff self-serve the easy cases, and tells them explicitly when to escalate instead. This isn't about delivering broken work — it's about being honest about deferred items and operational realities so the people relying on the system are never blindsided by something the developer already knew about.

## Key Concepts
- **Disclosure over concealment**: a known limitation named at handover is a manageable fact; the same limitation discovered independently by the client later is a trust cost
- **Four severity levels, always stated**: blocker (system unusable), high (critical workflow broken), medium (workaround exists), low (cosmetic) — every entry needs one of these, not just a description
- **A workaround must be concrete and actionable**: "export in monthly batches until pagination ships" is usable guidance; "there's a known issue with large exports" is not
- **Known issues are not the same as new feature requests**: a limitation that was always part of the agreed scope is different from a client wishing the system did something it was never built to do — conflating the two hides which is which
- **Troubleshooting entries follow a fixed shape**: possible causes, numbered diagnostic steps, and an explicit "escalate if" condition — so non-technical staff know both what to try and when to stop trying and ask for help
- **Common troubleshooting categories are predictable**: login/access, email delivery, file upload, payment/webhook, import/export, slow pages, domain/SSL, database connection, and permission errors recur across almost every project type
- **Critical issues always need an owner and a plan, never just a label**: a severe unresolved issue documented as "known issue" with no owner or next step is a disclosure failure, not a disclosure success

## Example Code
```template
## Issue: Large CSV Export Is Slow

**Area:** Order export
**Severity:** medium
**Status:** known / accepted
**Description:** Exporting more than 5,000 rows takes approximately 8 seconds,
during which the export button appears unresponsive.
**Impact:** No data loss; user may click export multiple times, generating
duplicate downloads.
**Workaround:** Wait for the download to complete before clicking again, or
filter by date range to reduce row count.
**Planned resolution:** Add a loading indicator and disable the button during
export — scheduled for the Growth Care retainer's first sprint.
**Owner:** Developer
```

```md
## Problem: Order Status Change Not Saving

### Possible causes
- Network interruption during save
- Session expired (logged in too long)
- Attempted an invalid transition (e.g., trying to reopen a Cancelled order)

### Steps
1. Refresh the page and confirm you're still logged in.
2. Check whether the attempted transition is a valid one (see Data Rules
   in the Admin Guide — Cancelled orders cannot be reopened by design).
3. Try the status change again and watch for an error message.
4. If it still fails on a valid transition, note the order ID and timestamp.

### Escalate if
- Multiple orders across multiple staff members show the same failure.
- A valid transition (e.g., Packed → Shipped) fails repeatedly.
```

## When to Use
- Before final handover, as a required document alongside the admin guide and deployment runbook — never treated as optional
- Immediately when a limitation is deliberately accepted rather than fixed (a scope trade-off, a deferred optimization), so it's disclosed at the moment the decision is made
- When a support pattern repeats — the same question or error arriving more than once is the signal to add a troubleshooting entry rather than answering it individually each time
- Whenever a serious production issue is resolved but a residual risk remains, so "known issue" always comes with an owner and a plan rather than becoming an indefinite label

## Common Mistakes
- **The slow export issue never made it into the handover doc — easier not to bring it up** — Hiding a known limitation at handover to avoid an uncomfortable conversation, guaranteeing the client discovers it independently later
- **The known-issues list has a description of the export bug and no severity attached to it** — Listing an issue without a stated severity, leaving the reader unable to judge how urgently to react
- **A feature the client always wanted but was never scoped gets filed as a "known issue" instead of a change request** — Classifying a genuinely new feature request as a "known issue" to avoid framing it as a change request
- **A serious unresolved bug sits in the known-issues doc with no owner and no plan attached** — Leaving a critical, unresolved production issue documented only as a passive "known issue" with no owner or resolution plan

## Further Reading
- Google SRE Workbook, "Postmortem Culture: Learning from Failure" — on the value of honest, blameless disclosure over concealment: https://sre.google/workbook/postmortem-culture/
- Atlassian, "How to write a good bug report" and adjacent troubleshooting-doc guidance — practical structure for severity and reproducibility: https://www.atlassian.com/software/jira/guides/issues/bug-tracking
- Michael Nygard, *Release It!: Design and Deploy Production-Ready Software* — on designing for and documenting known failure modes rather than assuming a system is failure-free
