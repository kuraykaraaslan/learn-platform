# 353. Business Continuity Planning for a Solo Operator

## What It Is
> This lesson is general education, not financial or tax advice. SLA remedy commitments should always be checked against your actual signed contract terms before being offered to a client.

A solo operator with client SLA obligations has to accept a specific structural fact: every system, credential, and process has exactly one owner. This is called a bus factor of one, and the honest goal is mitigation, not elimination — you cannot make yourself redundant, but you can make sure no single point of failure exists without a documented fallback, that every critical path has a "degraded mode" buying 48-72 hours, and that clients are told proactively before a commitment breaks, never after. Business continuity planning is the work of naming the realistic threats in advance — illness lasting one to three days, illness beyond three days, a stolen or failed laptop, an internet outage, a power outage, a mental health day, or an extreme weather event — and having a rehearsed response ready for each one rather than improvising during the actual disruption.

The response always starts with the same question: is any client SLA at risk within the next 24 hours? If yes, the SLA breach protocol takes priority immediately — calculating how much of the response window is left, and sending a proactive notification before the window closes, not after. If no, a scenario-specific runbook takes over: a short illness triggers a limited-availability message within two hours and a check of anything due in the next 72 hours; an illness beyond three days escalates to briefing a trusted developer backup and sending daily micro-updates to affected clients; a stolen or failed laptop triggers a remote wipe, access to a pre-configured cloud dev environment, and credential rotation, with a recovery target of being productive again within 24 hours.

None of this works without backup access built in advance, not improvised during the emergency. Every critical system — production servers, cloud provider accounts, DNS, client repositories, payment accounts, email — needs at least two independent access paths, so that losing one doesn't lock you out entirely. A single trusted developer backup contact, bound by an NDA or equivalent, briefed on at least one active project's architecture annually, and given a pre-configured way to get emergency repo access, covers the scenario a solo operator genuinely cannot cover alone: an illness or emergency that lasts longer than a few days. All of this — trusted backup contact, emergency credentials, cloud dev environment, client contact list — should be reviewed and refreshed every January, not left to age silently until the year it's actually needed and doesn't work.

## Key Concepts
- **Bus factor of one, accepted as a constraint**: the mitigation goal is no single point of failure without a documented fallback, a 48-72 hour degraded mode for every critical path, and proactive client communication before any breach.
- **Threat taxonomy**: short illness (1-3 days, async buffer + templates), long illness (>3 days, trusted developer backup + client notification), laptop stolen/failed (cloud dev environment + 24h recovery target), internet outage (mobile hotspot + coworking fallback), power outage (<4h, laptop battery covers it), mental health day (async-first communication), and force majeure (advance client notice + contract clause).
- **SLA-first decision rule**: before executing any disruption response, check whether an SLA breach is likely within 24 hours — if yes, the SLA breach protocol runs first; if no, the relevant incident-runbook scenario runs.
- **Dual-path access requirement**: every critical system (production servers, cloud accounts, DNS, repos, payment accounts, email) needs at least two independent access paths, so no single failure locks you out entirely.
- **Trusted developer backup**: exactly one backup contact, under an NDA or equivalent, briefed annually on at least one active project's architecture, with pre-configured emergency repo access that doesn't require your direct involvement to activate.
- **Annual review ritual (every January)**: update the trusted backup contact, rotate emergency credentials, verify the cloud dev environment still works, confirm the client emergency contact list, and update the coworking fallback list.

## Example Code
A worked incident walkthrough for a stolen laptop, following the runbook scenario and backup access plan:

```md
## Incident Log — Laptop Stolen, 2026-08-20, 14:10

14:10 — Laptop stolen from a café. Immediate action: triggered
  remote wipe via Find My (MDM configured in advance).

14:20 — SLA check: Client B has a "respond within 4h" support SLA;
  last message was 1h ago -> 75% of window remaining -> Orange
  awareness, draft notification prepared, not yet sent.

14:35 — Accessed borrowed tablet. Opened GitHub Codespaces on
  Client B's repo (pre-configured emergency access, no local
  credentials needed).

14:50 — Credential rotation started: revoked old SSH key, generated
  new one from the emergency vault; rotated the two API keys that
  were stored in local .env files on the stolen laptop.

15:00 — Sent Client B the Orange proactive notice: "Hardware issue
  on my end — still on track to respond by 16:00 as committed."
  SLA met at 15:55 using the Codespaces environment.

16:30 — Notified all other active clients of a temporary hardware
  issue; no other deliverables were due within 72 hours.

Next 72 hours: replacement laptop ordered (day 1), dotfiles and
  tooling restored to new device from the backup repo (day 2),
  full local dev environment confirmed working (day 3).

Emergency Contact Card check: trusted developer backup contact
  was not needed this time — incident resolved solo within the
  24-hour recovery target.
```
The SLA was never at risk of an undisclosed breach — the client was told proactively at the Orange stage, and the cloud dev environment made the 24-hour recovery target achievable without waiting for replacement hardware.

## When to Use
- Immediately upon any disruption — illness, hardware failure, connectivity loss — as the first move, before doing anything else: check whether an SLA is at risk within 24 hours.
- Every January, as a non-negotiable annual ritual to rotate credentials, re-verify the cloud dev environment, and confirm the trusted backup contact is still available.
- Before onboarding any new critical system (a new client repo, a new hosting account), to add its backup access path within 24 hours rather than after the fact.
- When drafting or renewing a client contract, to confirm SLA terms have a documented internal response plan behind them, not just a promised response time.

## Common Mistakes
- **Only one account holds admin access to the production database, and nothing is written down about what happens if that account is unreachable** — Having root or sole admin access to a production system with no documented recovery path if you become unavailable.
- **The API keys for three client projects live only in the browser's saved passwords** — Storing critical credentials only in browser autofill, which a new device or browser reset destroys instantly.
- **The 4-hour SLA window closed an hour ago, and the client still hasn't heard anything** — Waiting until an SLA window has already closed to notify the client, instead of notifying proactively while time remains.
- Letting the annual review lapse — an untested cloud dev environment or an outdated backup contact is only discovered to be broken during the actual emergency.

## Further Reading
- *The E-Myth Revisited* — Michael Gerber: on building systems and documented processes into a small business so it doesn't depend entirely on improvisation by its owner.
- *Antifragile* — Nassim Nicholas Taleb: a broader framework for building systems that don't just survive disorder but are structured to handle it by design.
