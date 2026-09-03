# 367. Security Handover & Access Transition Checklist

## What It Is
> This lesson is general education, not legal advice. The intent is practical judgment — recognizing which obligations exist and when they are triggered, not carrying the compliance decision yourself. Requirements differ by jurisdiction: TR, US, UK, UAE, EU and JP do not align on lawful basis, breach notification deadlines, data residency or children's-data thresholds, so confirm the specifics for the regions you actually operate in.

A project is not securely delivered just because the code is secure — it also has to be securely *handed over*, and the handover moment is where a surprising amount of long-term risk gets created silently. The failure mode isn't usually dramatic: it's a repository the client can't access without pinging the original developer, a database credential that was rotated once at launch and never again, an admin account the freelancer still technically controls a year later, or a vendor bill the client didn't know they were paying because the account was never transferred. None of these show up in a code review. They show up eighteen months later when the original team is unreachable and something needs to change.

The handover package has a fixed shape: repository link, production and staging URLs, hosting/DNS/database/storage/email/SMS/payment provider list (which overlaps directly with the vendor inventory from lesson #364), an environment-variable *list* — names only, never values, in a document — the admin-account process, the backup plan, the deployment process, and a named set of known security limitations. That last item is not optional and not a liability admission to be avoided: every handover should state its residual risks plainly — no formal penetration test was performed, ongoing dependency patching isn't included unless a maintenance agreement says so (the exact boundary lesson #361 defines for vulnerability handling), legal/privacy text was supplied by the client and not independently validated, backups are configured but restore testing wasn't performed unless separately agreed. Only true statements belong in this list, but every true one belongs there — a handover that omits a known gap to look cleaner is worse than one that states it.

Credential transfer has its own narrow set of rules: raw passwords never go into a handover document, secrets move through a secure channel or the client's own password manager, temporary credentials get rotated once the transfer is complete, and shared admin accounts get replaced with individual ones wherever the platform supports it. The access review that accompanies this — who currently has access to the repository, hosting, production database, object storage, DNS, each third-party provider, and the admin panel itself — is the point where dormant access gets found and closed; a contractor who left the project four months ago but still has a valid database credential is a much more common finding than any exotic vulnerability. Finally, the maintenance boundary has to be stated as one explicit sentence, not implied: no ongoing maintenance, a fixed-length bug-fix warranty, an active monthly retainer, and specifically whether security patching, monitoring, and incident response are included or excluded — because an unstated assumption here is exactly how a production system quietly ends up unmonitored and unpatched a year after everyone stopped thinking about it.

```quiz
- q: "The handover document covers environment variables. What goes in it?"
  anchor: "an environment-variable *list* — names only, never values, in a document"
  options:
    - text: "Names and values, so the client can redeploy without you"
      correct: false
      why: "Values never go into a document. The list is names only."
    - text: "Names only"
      correct: true
      why: "The same discipline as access handover: document what exists and who owns it, never the secret itself."
    - text: "Only the ones the client is likely to change"
      correct: false
      why: "The list is the inventory; trimming it hides what the system depends on."

- q: "You know no penetration test was performed. Does that belong in the handover?"
  anchor: "a handover that omits a known gap to look cleaner is worse than one that states it"
  options:
    - text: "No — it reads as an admission that the work was weak"
      correct: false
      why: "The lesson addresses this directly: the known-limitations list is not a liability admission to be avoided."
    - text: "Yes — every true residual risk belongs in the stated limitations"
      correct: true
      why: "Only true statements belong there, but every true one does."
    - text: "Only if the client asks about testing"
      correct: false
      why: "The list exists so the client's assumption matches what was delivered, without their having to know which question to ask."

- q: "What kind of failure does a bad handover actually produce?"
  anchor: "They show up eighteen months later when the original team is unreachable and something needs to change"
  options:
    - text: "An outage at launch"
      correct: false
      why: "The failure mode is not dramatic — nothing breaks on the day."
    - text: "Silence now, then a wall eighteen months later when the original team is unreachable"
      correct: true
      why: "A repository nobody can access, a credential never rotated, an admin account the freelancer still controls, a vendor bill nobody knew about."
    - text: "A failed code review"
      correct: false
      why: "None of these show up in a code review, which is exactly why handover needs a checklist of its own."
```

## Key Concepts
- **Handover package contents**: repo, prod/staging URLs, provider list, env-var names (no values), admin process, backup plan, deploy process, known limitations
- **Overlap with the vendor inventory (#364)**: the provider list in a handover is the same artifact as the vendor inventory — one document, reused, not two separately maintained lists that drift apart
- **Residual risk disclosure**: state every true limitation plainly (no pentest performed, patching excluded absent a retainer, legal text not independently validated, restore untested) — omission looks cleaner but is the actual risk
- **Credential transfer rules**: no raw passwords in documents; secure transfer channel or client's password manager; rotate temporary credentials after transfer; replace shared admin accounts with individual ones
- **Access review at handover**: enumerate everyone with access to repo, hosting, database, storage, DNS, each vendor, and the admin panel — this is where dormant/forgotten access gets closed
- **Explicit maintenance boundary**: one clear statement — none / fixed-length warranty / active retainer — plus whether patching, monitoring, and incident response are specifically included
- **Account ownership transfer**: production accounts should end up owned by the client; freelancer/agency access removed or reduced absent an active agreement (mirrors lesson #364's vendor account-ownership rule)

## Example Code
```markdown
# Security Handover Checklist — [Project Name] — [Date]

## Access
- [ ] Client owns the production hosting account (or transfer is scheduled with a date)
- [ ] Client has a working admin account (tested, not assumed)
- [ ] All temporary/setup credentials have been rotated post-transfer
- [ ] Shared admin accounts replaced with individual accounts where the platform allows it

## Access Review (who currently has access — enumerate each)
| System | Current access holders | Action needed |
|---|---|---|
| Repository | dev-team-github-org | Transfer to client org or add client admins |
| Production hosting | Freelancer personal account | Transfer ownership before final invoice |
| Production database | Freelancer + 1 contractor (left project) | Revoke contractor; rotate credential |
| Object storage | Client + freelancer | Remove freelancer post-handover (no retainer) |
| DNS/domain | Client only | No action |
| Admin panel | Client (2 accounts) + freelancer (debug account) | Remove debug account |

## Configuration
- [ ] Environment variable names documented (values excluded from any document)
- [ ] Production and staging environments are clearly separated
- [ ] Vendor inventory (see lesson #364) is current and attached

## Operations
- [ ] Backup plan documented (what, where, how often, retention)
- [ ] Restore process documented; restore-test status stated (tested / not tested)
- [ ] Monitoring/logging setup documented, including what is NOT monitored

## Residual Risk Note (state only what is true for this project)
- No formal penetration test was performed on this system.
- Ongoing dependency/vulnerability patching is not included post-handover
  unless the maintenance retainer below is active (see lesson #361).
- Privacy policy and legal text were supplied by the client and have not been
  independently validated by the development team.
- Backups are configured; a restore test was [performed on DATE / not performed].

## Maintenance Boundary (state exactly one)
- [ ] No ongoing maintenance included after final delivery
- [ ] 30-day bug-fix warranty included for scoped delivery defects only
- [ ] Monthly maintenance retainer active — includes: [patching / monitoring / incident response — list explicitly]
```

## When to Use
- At every project handover or go-live milestone, regardless of project size — the checklist scales down for small projects but the categories don't disappear
- When a maintenance agreement is ending or changing — re-run the access review, since access granted under an old agreement often outlives it
- When a contractor or team member rotates off a project — this is the same access-review discipline as full handover, applied mid-project
- Before sending a final invoice or closing a contract — the handover package and residual risk note should exist before the engagement is considered closed
- When a client asks "what happens if you disappear tomorrow" — the handover package is the direct answer, and building it as you go is easier than reconstructing it at the end

## Common Mistakes
- **The engagement ends, and production hosting is still under your personal login** — Leaving production hosting, domain, or vendor accounts under a freelancer's personal login after the engagement ends, with no transfer plan
- **Credentials get sent over in a plain chat message** — Sending credentials in a plain document or chat message instead of a secure transfer channel or the client's password manager
- **The handover doc doesn't mention that no pentest or restore test was ever run** — Omitting a known limitation (no pentest, no restore test) from the handover to make the delivery look more complete than it is
- **A former team member's access is still active weeks after they left the project** — Leaving a contractor's or former team member's access active because no one performed the access review at the point they left
- **A handover conversation ends with "I'll keep an eye on it," no maintenance contract behind that** — Implying ongoing security support ("I'll keep an eye on it") without a contracted maintenance agreement backing that statement — an informal promise nobody is actually resourced to keep

## Further Reading
- [OWASP — Secure Software Deployment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Deployment_Cheat_Sheet.html) — deployment and handover hygiene from a technical-controls angle
- Course #364 — *Third-Party Vendor Risk & Data Processing Agreements* (the vendor inventory this handover's provider list reuses)
- Course #361 — *Vulnerability Management Lifecycle & Patch SLAs* (the maintenance-boundary language this checklist's patching line depends on)

```recall
- q: "Give the fixed shape of the handover package."
  must:
    - "repository link, production and staging URLs"
    - "the hosting/DNS/database/storage/email/SMS/payment provider list"
    - "an environment-variable list — names only, never values"
    - "the admin-account process"
    - "the backup plan and the deployment process"
    - "a named set of known security limitations"

- q: "Name the residual risks a handover should state plainly."
  must:
    - "no formal penetration test was performed"
    - "ongoing dependency patching is not included unless a maintenance agreement says so"
    - "legal/privacy text was supplied by the client and not independently validated"
    - "backups are configured but restore testing was not performed unless separately agreed"

- q: "What are the quiet failure modes a bad handover creates?"
  must:
    - "a repository the client cannot access without the original developer"
    - "a credential rotated once at launch and never again"
    - "an admin account the freelancer still controls a year later"
    - "a vendor bill the client did not know they were paying"
```
