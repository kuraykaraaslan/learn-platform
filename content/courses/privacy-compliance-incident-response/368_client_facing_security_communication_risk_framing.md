# 368. Client-Facing Security Communication — Risk Framing & Scope Boundaries

## What It Is
Every other lesson in this course covers what to *do* about security and privacy risk; this one covers how to *say it out loud* to a client without either scaring them into a bad decision or quietly letting them believe something false. Both failure modes are common and both are worse than plain language: security jargon used to pressure a sale creates distrust the moment the client learns enough to see through it, and a vague reassurance ("don't worry, it's secure") that omits a real limitation creates a false sense of coverage that surfaces at the worst possible time — usually during an incident or an audit, when it's too late to have said it earlier. The discipline is narrow and learnable: be specific about the actual risk, state it plainly, separate what engineering controls from what only a legal or privacy advisor can determine, avoid exaggerated guarantees, explain the trade-off being made, name whose responsibility a given risk is, and end with an actual recommendation rather than just a warning.

A specific vocabulary makes this easier to apply consistently. Useful phrases name what was actually done without overclaiming: "this reduces the risk of...", "this supports privacy-aware implementation...", "this is included in the engineering scope...", "this is not a formal penetration test...", "this should be reviewed by your legal/privacy advisor...". A parallel list of phrases should never appear in client-facing security communication, because each one makes a claim engineering cannot actually back: "fully secure," "100% compliant," "guaranteed unhackable," "GDPR/KVKK certified" (certification is not something an implementation achieves by itself), and "no legal review needed." The scope-boundary statement follows the same pattern in the other direction — stating clearly what security work *is* included (authentication, authorization, input validation, secure configuration, basic audit logging) and what it explicitly is *not* (formal penetration testing, legal compliance certification, 24/7 monitoring, ongoing patching) unless those are separately scoped, so a client's assumption about coverage matches what was actually delivered rather than what "secure system" implied to them.

Incident communication to a client or end user is a distinct moment with its own narrow template, and it deliberately mirrors the internal communication pattern from lesson #362's response process but is adapted for an external, less technical audience: what happened (in plain terms), what is currently known, what containment action has already been taken, what impact is suspected, and — specifically for personal-data incidents — a direct pointer to involve their legal/privacy advisor to assess notification obligations under lesson #363's jurisdiction-specific rules, rather than the engineering team making that legal call itself. The same discipline that governs routine risk communication applies here even more strictly: no speculation about scope or cause beyond what is confirmed, because a client who repeats an unconfirmed claim to their own customers and has to retract it publicly is a worse outcome than a slightly less reassuring but accurate initial statement.

```quiz
- q: "Which phrase must never appear in client-facing security communication?"
  anchor: "\"fully secure,\" \"100% compliant,\" \"guaranteed unhackable,\" \"GDPR/KVKK certified\""
  options:
    - text: "\"This is not a formal penetration test\""
      correct: false
      why: "That is on the useful list — it names what was actually done without overclaiming."
    - text: "\"100% compliant\""
      correct: true
      why: "Along with fully secure, guaranteed unhackable, GDPR/KVKK certified, and no legal review needed — each makes a claim engineering cannot back."
    - text: "\"This should be reviewed by your legal/privacy advisor\""
      correct: false
      why: "Also useful, and it is precisely the separation the discipline asks for."

- q: "Two failure modes are named, both worse than plain language. Which pair?"
  anchor: "security jargon used to pressure a sale creates distrust the moment the client learns enough to see through it"
  options:
    - text: "Too much detail, and too little detail"
      correct: false
      why: "Volume is not the axis. Pressure and false reassurance are."
    - text: "Jargon used to pressure a sale, and vague reassurance that omits a real limitation"
      correct: true
      why: "The second creates a false sense of coverage that surfaces during an incident or an audit, when it is too late to have said it earlier."
    - text: "Saying it too early, and saying it too late"
      correct: false
      why: "Timing is not what the lesson identifies as the failure."

- q: "A security note names a real risk and stops there. What is missing?"
  anchor: "end with an actual recommendation rather than just a warning"
  options:
    - text: "Nothing — naming the risk plainly is the honest thing to do"
      correct: false
      why: "Naming it is necessary and not sufficient; the discipline ends with a recommendation."
    - text: "A recommendation"
      correct: true
      why: "Along with naming whose responsibility the risk is and explaining the trade-off being made."
    - text: "A severity rating"
      correct: false
      why: "Useful elsewhere, but not what this list asks for."
```

## Key Concepts
- **Two failure modes, equally bad**: fear-mongering with jargon to pressure a decision, and vague reassurance that omits a real limitation — both erode trust, just on different timelines
- **Safe-phrase vocabulary**: "this reduces the risk of...", "this supports privacy-aware implementation...", "this is included in the engineering scope...", "this requires legal/privacy review..." — specific, bounded, honest
- **Forbidden-phrase vocabulary**: "fully secure," "100% compliant," "guaranteed unhackable," "GDPR/KVKK certified by implementation alone," "no legal review needed" — each overclaims something engineering cannot actually guarantee
- **Scope boundary statement**: explicit "included" vs. "not included unless separately scoped" list, so the client's assumed coverage matches the actual delivered coverage
- **Separating engineering control from legal compliance**: what was built vs. what a legal/privacy advisor must still determine — stated as two different sentences, never merged into one
- **Client-facing incident template**: what happened, what's known, what containment has occurred, suspected impact, and (for personal-data incidents) a direct pointer to their legal/privacy advisor for notification obligations — the external-audience counterpart to lesson #362's internal runbook
- **No public speculation before confirmation**: applies doubly to client-facing communication, since a client may relay an unconfirmed claim to their own end users and be unable to retract it cleanly

## Example Code
```markdown
# Client Communication Templates — Security & Privacy

## Risk Warning (before proceeding with a feature)
"I want to flag one risk before we proceed: this feature processes personal
data and sends it to a third-party provider. Technically, I can implement the
integration securely, but the provider choice, privacy notice, legal basis,
and data retention policy should be reviewed by your legal/privacy advisor."

## Scope Boundary (in a proposal or SOW)
"This project includes security-conscious implementation for the scoped
features: authentication, authorization, input validation, secure
configuration, and basic audit logging.

It does not include formal penetration testing, legal compliance
certification, 24/7 monitoring, or ongoing vulnerability patching unless
added as a separate service."

## Security Upgrade Recommendation
"Because this system includes admin access and customer records, I recommend
adding MFA readiness for admin users, audit logs for sensitive changes,
backup/restore documentation, and a basic security acceptance checklist
before production."

## Incident Communication (client-facing, mirrors lesson #362's internal
## pattern but adapted for a non-technical, external audience)
"We detected an issue affecting <system/feature> on <date>. Current known
impact is <known impact, stated plainly>. We have taken <containment action>
to stop further exposure. We are still verifying <what remains unknown> and
will update you by <specific time>. If personal data may be involved, please
involve your legal/privacy advisor to assess notification obligations —
we can provide the technical facts (what data, how many records, what
timeframe) needed to make that determination quickly."

## Acceptance Check (before sending any security-related client message)
- [ ] The risk described is specific, not generic
- [ ] The recommendation is actionable, not just a warning
- [ ] Legal/compliance boundaries are stated separately from engineering scope
- [ ] No absolute security guarantee appears anywhere in the message
- [ ] Client's own responsibility (legal review, account ownership, etc.) is named where relevant
- [ ] Tone is calm and professional, not alarmist or dismissive
```

## When to Use
- Whenever writing a proposal, SOW, or scope document that touches security or privacy — the scope-boundary template prevents a client's assumed coverage from silently exceeding what's actually delivered
- Before flagging any risk that involves a third-party vendor, a compliance gap, or a legal gray area — use the risk-warning template rather than an ad hoc explanation
- The moment an incident is confirmed to potentially involve a client's data or users — the client-facing template should go out promptly, built from the facts lesson #362's internal process is already producing
- When a client uses absolute language ("make it fully secure," "make sure we're 100% compliant") — this is the moment to introduce the safe-phrase vocabulary and correct the framing before it becomes a written commitment
- During a security-focused sales conversation — using the safe-phrase vocabulary from the start avoids having to walk back an overclaim later

## Common Mistakes
- Using absolute language ("fully secure," "100% compliant") in a proposal or sales conversation because it sounds more confident, creating a commitment that can't actually be honored
- Hiding a known risk or limitation from a client to avoid an uncomfortable conversation or a possible delay in signing
- Making a legal determination ("this is GDPR compliant," "this isn't a reportable breach") in client communication instead of routing that call to legal/privacy counsel
- Sending an incident update that speculates about root cause or full scope before it's confirmed, forcing a public or client-facing retraction later
- Discussing an active incident publicly or with end users without the client's approval, when the client — not the development team — usually owns that external communication decision

## Further Reading
- [ICO — Communicating Privacy Information to People](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/right-to-be-informed/) — plain-language communication standards applicable to client-facing privacy messaging
- Course #362 — *Incident Response Process — Detection Through Containment* (the internal runbook and fact set this lesson's client-facing template draws from)
- Course #363 — *Breach Notification Requirements Across Jurisdictions* (what the client's legal/privacy advisor is being asked to assess)

```recall
- q: "Name the elements of the discipline."
  must:
    - "be specific about the actual risk and state it plainly"
    - "separate what engineering controls from what only a legal or privacy advisor can determine"
    - "avoid exaggerated guarantees"
    - "explain the trade-off being made"
    - "name whose responsibility a given risk is"
    - "end with an actual recommendation rather than just a warning"

- q: "Give phrases that are useful, and phrases that must never appear."
  must:
    - "useful: \"this reduces the risk of...\", \"this supports privacy-aware implementation...\""
    - "useful: \"this is included in the engineering scope...\", \"this is not a formal penetration test...\""
    - "useful: \"this should be reviewed by your legal/privacy advisor...\""
    - "never: fully secure, 100% compliant, guaranteed unhackable"
    - "never: GDPR/KVKK certified, no legal review needed"

- q: "State the scope boundary in both directions, and why it matters."
  must:
    - "included: authentication, authorization, input validation, secure configuration, basic audit logging"
    - "not included: formal penetration testing, legal compliance certification, 24/7 monitoring, ongoing patching"
    - "unless those are separately scoped"
    - "so the client's assumption about coverage matches what was actually delivered"
```
