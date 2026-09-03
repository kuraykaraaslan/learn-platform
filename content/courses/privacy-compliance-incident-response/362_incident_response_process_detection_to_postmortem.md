# 362. Incident Response Process — Detection Through Containment

## What It Is
> This lesson is general education, not legal advice. The intent is practical judgment — recognizing which obligations exist and when they are triggered, not carrying the compliance decision yourself. Requirements differ by jurisdiction: TR, US, UK, UAE, EU and JP do not align on lawful basis, breach notification deadlines, data residency or children's-data thresholds, so confirm the specifics for the regions you actually operate in.

A security or privacy incident is a different animal from a normal production outage, and it needs a different first response even though both eventually get written up afterward. Blameless Post-Mortem (course #79) covers the retrospective — timeline reconstruction, contributing factors, action items — for any significant failure, technical or otherwise. This lesson covers what happens *before* that retrospective is written: the specific, time-pressured flow for suspected unauthorized access, data exposure, account takeover, or any event where personal or sensitive data might be involved, where the first hour's actions determine whether evidence survives and whether the exposure gets worse. Incidents in this category include unauthorized admin access, account takeover, a data export or leak, a public storage bucket exposure, lost or deleted data, upload/malware abuse, payment or webhook manipulation, secrets committed or exposed in a repository, and third-party provider compromise — a broader list than "the site is down."

The response flow is a fixed sequence: detect, preserve evidence, contain, assess impact, eradicate the root cause, recover service and data, communicate to stakeholders, support a legal/privacy assessment, and document lessons learned. The reason evidence preservation comes second — before containment — is that the instinct to immediately fix things (delete a compromised file, roll back a database, kill a suspicious process) can destroy the exact logs, timestamps, and snapshots needed to later determine scope, and scope determination is what a breach-notification decision depends on. A first-hour checklist keeps a real incident from becoming a panic response: confirm the incident is real, capture timestamps and symptoms, avoid deleting anything, restrict the compromised account or rotate the exposed secret, block the affected endpoint or feature if needed, check logs for scope, notify the decision owner, and specifically ask whether personal data may be involved — because that single question is what triggers the separate breach-notification clock (see lesson #363).

Evidence preservation itself has a concrete checklist: logs, audit records, provider alerts, screenshots, timestamps, affected user or resource IDs, configuration snapshots, and commit/deploy history around the incident window. Communication during an active incident follows a specific, deliberately narrow pattern — what we know, what we don't know yet, what containment has already happened, what impact is suspected, what's needed from anyone else, and what happens next — because speculating publicly about scope or cause before the facts are confirmed routinely turns out to be wrong and has to be walked back. A handful of actions are flatly forbidden regardless of pressure: never delete logs to hide an error, never notify users before the facts are known unless legally required to move faster, never draw legal conclusions ("this was not a breach") without an actual investigation, and never keep using a secret that's known to be exposed while "confirming" whether it was actually misused.

```quiz
- q: "You find a compromised file and your instinct is to delete it. Why does evidence preservation come before containment?"
  anchor: "can destroy the exact logs, timestamps, and snapshots needed to later determine scope"
  options:
    - text: "It does not — containment is first, since the exposure is still growing"
      correct: false
      why: "The sequence is detect, preserve evidence, then contain. Preservation sits second deliberately."
    - text: "Fixing immediately can destroy the logs, timestamps and snapshots needed to determine scope"
      correct: true
      why: "And scope determination is what a breach-notification decision depends on."
    - text: "Because the file may be needed to restore service later"
      correct: false
      why: "Recovery is a later step, and it is not the reason preservation precedes containment."

- q: "Which single question on the first-hour checklist starts a separate clock?"
  anchor: "because that single question is what triggers the separate breach-notification clock"
  options:
    - text: "Is the incident real?"
      correct: false
      why: "First on the checklist, but it starts nothing — it only decides whether the rest runs."
    - text: "Might personal data be involved?"
      correct: true
      why: "It triggers the breach-notification clock, which runs separately from the technical response."
    - text: "Who is the decision owner?"
      correct: false
      why: "On the checklist and necessary, but notification timing does not hang on it."

- q: "How does this differ from a blameless post-mortem?"
  anchor: "This lesson covers what happens *before* that retrospective is written"
  options:
    - text: "It replaces it — a security incident does not get a retrospective"
      correct: false
      why: "It does get one. The post-mortem covers the retrospective for any significant failure; this is what happens before it is written."
    - text: "It is the time-pressured first response, where the first hour decides whether evidence survives"
      correct: true
      why: "And whether the exposure gets worse in the meantime."
    - text: "It applies only when the site is actually down"
      correct: false
      why: "The incident list is deliberately broader — account takeover, an exposed bucket, secrets in a repository, a third-party compromise."
```

## Key Concepts
- **Incident types beyond outages**: unauthorized admin access, account takeover, data export/leak, public bucket exposure, secrets exposure, third-party compromise — a broader category than a downtime incident
- **Response flow**: detect → preserve evidence → contain → assess impact → eradicate → recover → communicate → support legal/privacy assessment → document lessons learned
- **Evidence before containment**: preserve logs, timestamps, and snapshots before taking actions (deleting, rolling back) that could destroy them — scope determination depends on this evidence
- **First-hour checklist**: confirm it's real, capture timestamps, don't delete anything, restrict compromised access, rotate exposed secrets, check logs for scope, notify the decision owner, ask whether personal data is involved
- **The personal-data trigger question**: "might personal data be involved" is the single question that starts the separate, time-bound breach-notification process
- **Calm, factual communication pattern**: known facts, unknowns, containment done, suspected impact, what's needed, next step — never public speculation about cause or scope
- **Forbidden patterns during response**: deleting logs, premature notification, drawing legal conclusions without investigation, continuing to use an exposed secret
- **Incident report artifact**: summary, timeline, affected systems, data potentially affected, root cause, containment actions, recovery actions, required legal actions, residual risk — the structured record the response produces

## Example Code
```markdown
# Incident Response Runbook — Security / Privacy Incidents

## Trigger
Any suspected: unauthorized access, data exposure, account takeover, leaked
secret, public storage misconfiguration, or third-party provider compromise.

## First Hour
- [ ] Confirm the incident is real (not a false alarm / expected behavior)
- [ ] Capture exact timestamps and symptoms as first observed
- [ ] Do NOT delete logs, rows, files, or processes yet — evidence first
- [ ] Restrict/disable the compromised account or session
- [ ] Rotate any exposed secret immediately (do not wait for "full confirmation")
- [ ] Block the affected endpoint/feature if actively being abused
- [ ] Pull logs for the affected window; identify scope (which users/tenants/records)
- [ ] Notify the incident decision owner (on-call lead / eng manager)
- [ ] Ask explicitly: "Could personal data be involved?" → if yes, start the
      breach-notification clock in parallel (see lesson #363)

## Evidence to Preserve (before any remediation that could alter them)
- [ ] Application + access logs for the affected window
- [ ] Audit log entries (who did what, when)
- [ ] Provider/security alerts (hosting, WAF, email provider abuse notices)
- [ ] Screenshots of the exposure if externally visible (e.g. public bucket listing)
- [ ] Affected user/resource IDs
- [ ] Configuration snapshot at time of incident
- [ ] Commit and deploy history around the incident window

## Containment → Eradication → Recovery
- [ ] Contain: stop ongoing damage (revoke access, disable feature, isolate system)
- [ ] Eradicate: fix the root cause (patch, close misconfiguration, remove backdoor)
- [ ] Recover: restore service/data from a known-good state; verify integrity

## Communication (internal + external, as scoped)
Use only this pattern — no speculation beyond it:
1. What we know
2. What we do not know yet
3. What containment action has already been taken
4. What impact is suspected
5. What we need from you/them
6. What happens next

## Incident Report (filed after stabilization, feeds the post-mortem)
# Incident Report — [short title] — [date]
## Summary / Timeline / Affected systems / Data potentially affected
## Root cause / Containment actions / Recovery actions
## Legal/privacy actions required / Residual risk
```

## When to Use
- The moment any of the trigger conditions above is suspected — even before it's confirmed, since evidence preservation has to start immediately
- When a secret (API key, database credential, signing key) is found committed to a repository or pasted somewhere it shouldn't be
- When a customer, security researcher, or automated alert reports suspicious access patterns or a possible data exposure
- When a third-party vendor discloses their own security incident and you need to determine whether your data was affected
- As the input to the blameless post-mortem (#79) once the incident is stabilized — this runbook produces the timeline and evidence the post-mortem analyzes

## Common Mistakes
- **The compromised database gets rolled back within minutes of discovery, before anyone thought to pull the logs first** — Rushing to fix or delete the compromised state before preserving logs and evidence, destroying the ability to later determine scope
- **Containment wraps up, and it's hour three before anyone actually asks whether personal data might have been involved** — Treating "the personal data question" as an afterthought instead of asking it explicitly in the first hour, delaying the separate breach-notification clock
- **"This wasn't a data breach" goes out in a public statement an hour into the investigation, before the facts are actually confirmed** — Making public statements about cause or scope before the facts are confirmed, then having to retract or contradict an earlier statement
- **The exposed API key stays live "while we confirm whether it was actually used," instead of getting rotated immediately** — Continuing to use a secret or credential that is known or suspected to be exposed while still "investigating" whether it was actually misused

## Further Reading
- [NIST SP 800-61 Rev. 2 — Computer Security Incident Handling Guide](https://csrc.nist.gov/pubs/sp/800/61/r2/final)
- [SANS Incident Handler's Handbook](https://www.sans.org/white-papers/33901/)
- Course #79 — *Blameless Post-Mortem — Writing and Running One* (the retrospective process this runbook feeds into)

```recall
- q: "Give the response flow in order."
  must:
    - "detect"
    - "preserve evidence"
    - "contain"
    - "assess impact"
    - "eradicate the root cause"
    - "recover service and data, communicate to stakeholders, support a legal/privacy assessment, document lessons learned"

- q: "Run the first-hour checklist from memory."
  must:
    - "confirm the incident is real, capture timestamps and symptoms"
    - "avoid deleting anything"
    - "restrict the compromised account or rotate the exposed secret"
    - "block the affected endpoint or feature if needed"
    - "check logs for scope and notify the decision owner"
    - "ask specifically whether personal data may be involved"

- q: "Name incidents in this category beyond \"the site is down\"."
  must:
    - "unauthorized admin access and account takeover"
    - "a data export or leak, a public storage bucket exposure"
    - "lost or deleted data, upload or malware abuse"
    - "payment or webhook manipulation"
    - "secrets committed or exposed in a repository"
    - "third-party provider compromise"
```
