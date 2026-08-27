# 232. Contractor Performance Issues and Offboarding

## What It Is
Performance problems with a subcontractor rarely start as crises — they start as one missed check-in or one deliverable that's a bit below the agreed quality bar. How that first signal gets handled determines whether it stays small or becomes a legal and financial mess. The right first move is a direct, specific, written message about the actual issue and a request for a timeline update — not an immediate escalation, and not a phone call or voice message that leaves no record. One missed check-in is information, not a crisis; treating it as a crisis burns trust that might be needed for the rest of the relationship.

If the problem persists, the next step is a formal written warning — not an angry one, a documented one — that states what was agreed, what was actually delivered, the gap between them, a clear deadline to resolve it, and the consequence if it isn't resolved. This email is doing double duty: it's a genuine attempt to fix the problem, and it's the paper trail that makes a later termination for cause defensible if the problem doesn't resolve. Skipping straight to termination without this documented step weakens the hiring party's position if the subcontractor later disputes being let go or disputes withheld payment.

Termination itself splits into a few distinct shapes, each with a different fair outcome: mutual agreement (both sides agree to end it — the cleanest outcome, worth confirming with a short written exchange), termination for convenience (the hiring party ends the engagement for any reason, pays for completed and accepted work, gives the agreed notice period, and doesn't owe an explanation), termination for cause (a documented material breach justifies immediate termination and potentially withholding payment for undelivered work, though withholding payment already earned for accepted work is a step worth confirming with a lawyer before acting on), and contractor-initiated exit (the subcontractor resigns, and is owed payment for accepted work to date while owing the hiring party their in-progress files and access handback). Whatever the shape, the exit mechanics are non-negotiable and time-sensitive: revoke all access — repositories, cloud accounts, databases, shared vaults, project tools — on the same day, not "when convenient," and rotate any API keys or credentials the subcontractor could have touched. A departing subcontractor with lingering production access is a security incident waiting to happen, regardless of how amicably the engagement ended.

## Key Concepts
- **Early-signal response**: a direct, specific, written message about the actual issue, asking for a timeline update — not immediate escalation over one missed check-in.
- **Formal warning structure**: what was agreed, what was delivered, the gap, a clear resolution deadline, and the stated consequence — documented in writing as both a genuine fix attempt and a future paper trail.
- **Four termination shapes**: mutual agreement (cleanest), for convenience (no reason required, pay for accepted work, honor notice period), for cause (documented material breach, can justify immediate termination), and contractor-initiated exit (pay for accepted work, subcontractor returns files/access).
- **Same-day access revocation**: repository, cloud, database, shared vault, and project-tool access revoked the same day the engagement ends, with credential/API key rotation wherever the subcontractor had production access.
- **Knowledge transfer before exit**: a scheduled handover session, documented architecture decisions and known issues, for any subcontractor who held significant context — built into the agreement from the start, not requested as an afterthought.

## Example Code
```markdown
## Performance Issue Escalation

**Step 1 — Early signal (written):**
"Hi [Name] — I noticed [specific issue, e.g. the API milestone due Friday
hasn't been delivered]. Can you share a timeline update?"

**Step 2 — Formal warning (written, documented):**
"We agreed [deliverable] would be delivered by [date]. As of [date], I've
received [what was actually delivered / nothing]. Please deliver
[specific outcome] by [new deadline]. If this isn't resolved, we'll need
to end the engagement per our agreement's termination terms."

## Exit Checklist (same day as last day)
- [ ] Repository access revoked (GitHub/GitLab/Bitbucket)
- [ ] Cloud provider access revoked
- [ ] Database access revoked
- [ ] Shared credential vault access revoked
- [ ] Project tool / chat access removed
- [ ] API keys rotated if contractor had production access
- [ ] Final work product received and backed up
- [ ] Final payment made against accepted deliverables only
- [ ] Written confirmation of engagement end sent
```

## When to Use
- The moment a subcontractor misses a first check-in or delivers noticeably below the agreed bar.
- When deciding how to end a subcontractor engagement, whichever side is initiating it.
- On the last day of any subcontractor engagement, regardless of how it ended.

## Common Mistakes
- Escalating immediately to threats or termination over a single missed check-in, before giving a chance to course-correct.
- Terminating for cause without a documented formal warning, weakening your position if the subcontractor disputes it.
- Delaying access revocation "until we sort out the final details," leaving credentials active longer than necessary.
- Skipping API key rotation because the departure felt amicable — the risk exists independent of how the relationship ended.

## Further Reading
- The Society for Human Resource Management's (SHRM) general guidance on documented performance escalation, adapted to contractor relationships.
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html) — the technical counterpart to an offboarding checklist
- Camille Fournier, *The Manager's Path* — on giving direct, written feedback without letting a small issue become a bigger conflict than necessary.
