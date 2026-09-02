# 251. Access, Credentials, and Environment Handover

## What It Is
Access handover has one rule that overrides everything else: document ownership and location, never document the actual secret. A markdown file, a chat message, and a shared spreadsheet with open access are all unsafe places for a real password, API token, or private key — not because they're inconvenient, but because they create a durable, searchable, easily-leaked record of something that should be rotatable and revocable. The client needs to know what they own, what the developer can still access after handover, and which credentials should be rotated the moment ownership changes hands — and all three of those facts can be documented completely without ever writing down a real secret.

Ownership has three common models, and they carry very different risk profiles. Client-owned-from-the-start is the best default: the client owns the domain, hosting, repository, and payment accounts, and the developer is invited with only the access the current phase needs. Freelancer-created-then-transferred is acceptable when documented honestly — temporary accounts existed during development and get transferred or recreated at handover. Freelancer-owned-long-term is only legitimate when there's an actual maintenance agreement backing it; otherwise it quietly becomes an unpaid, unbounded obligation and a single point of failure if the developer becomes unreachable.

Environment and configuration documentation is the technical half of this same problem. Every project needs an `.env.example`, a variable table separating required from optional and public from secret, and explicit rotation notes — because a project without this cannot be safely deployed, debugged, or transferred by anyone who isn't the original developer. The public/secret distinction matters specifically because public variables are safe to expose in browser-side code and secret ones are catastrophic to expose there; conflating the two is a security defect, not a documentation nicety.

```quiz
- q: "You are writing the access handover doc and the client will need the database password. What goes in the document?"
  anchor: "document ownership and location, never document the actual secret"
  options:
    - text: "The password itself, so nobody is blocked at 2am"
      correct: false
      why: "A markdown file, a chat message or a shared spreadsheet creates a durable, searchable record of something that is supposed to stay rotatable and revocable."
    - text: "Who owns it, where it lives, and that it must be rotated at handover"
      correct: true
      why: "All three facts the client actually needs can be documented completely without a real secret ever being written down."
    - text: "The password in a separate file, deleted right after the handover meeting"
      correct: false
      why: "\"Deleted afterwards\" is a promise, not a control — the record existed, was copyable and was searchable for as long as it did."

- q: "The developer will keep owning the hosting account after handover. When is that legitimate?"
  anchor: "only legitimate when there's an actual maintenance agreement backing it"
  options:
    - text: "Whenever the client would rather not deal with infrastructure"
      correct: false
      why: "Preference is not an agreement. Without one it quietly becomes an unpaid, unbounded obligation."
    - text: "Only when a real maintenance agreement backs it"
      correct: true
      why: "Absent that, it is also a single point of failure the moment the developer becomes unreachable."
    - text: "Never — client-owned-from-the-start is the only defensible model"
      correct: false
      why: "There are three models. Client-owned is the best default, but freelancer-created-then-transferred is fine when documented honestly."

- q: "Why does the variable table separate public from secret rather than just listing every variable?"
  anchor: "public variables are safe to expose in browser-side code and secret ones are catastrophic to expose there"
  options:
    - text: "It makes the documentation tidier to read"
      correct: false
      why: "The lesson calls conflating the two a security defect, not a documentation nicety."
    - text: "Public values are safe in browser-side code and secret ones are catastrophic there"
      correct: true
      why: "The split governs where a value is allowed to appear at all, which is why getting it wrong is a defect rather than a style issue."
    - text: "Only secret variables need rotation notes"
      correct: false
      why: "Rotation notes are their own explicit requirement. The public/secret split answers a different question."
```

## Key Concepts
- **Document ownership and location, never the value**: an access inventory lists what system, which provider, who owns it, and how it's accessed — the actual password or token never appears in the document
- **Three ownership models, one clearly preferred**: client-owned-from-start (best), freelancer-created-then-transferred (acceptable if documented), freelancer-owned-long-term (only with a maintenance agreement backing it)
- **Secure transfer channels only**: password manager shared items, provider team invites, or client-owned account creation — never plain email, public chat, a repository commit, or a shared open spreadsheet
- **Post-handover security checklist**: rotate passwords, rotate API keys, remove unnecessary freelancer access, enable 2FA, and review admin users and repository/hosting collaborators once ownership transfers
- **Public vs. secret environment variables**: `NEXT_PUBLIC_*`-style values are safe for browser exposure; `DATABASE_URL`, signing secrets, and payment keys are never safe there — this line must be drawn explicitly, not assumed
- **`.env.example` plus a variable table is the minimum bar**: every required and optional variable explained, with fake or sanitized example values, so a new developer can configure the project without guessing
- **Admin account lifecycle is a named risk**: who owns the first admin account, whether temporary admins exist, and how to create or disable admins must be documented — a permanent admin password must never appear in any document

## Example Code
```md
## Access Inventory — Order Management Admin Panel

| System | Provider | Owner | Access method | Freelancer access after handover | Notes |
|---|---|---|---|---|---|
| Repository | GitHub | Client | Team invite | Removed | Transferred to client org 2026-09-10 |
| Hosting | Vercel | Client | Team invite | Removed | |
| Database | Railway | Client | Team invite | Removed | Production DB |
| Domain | Namecheap | Client | Client login | None | DNS controlled here |
| Email (SMTP) | Resend | Client | Env secrets | None | Order notifications |

## Post-Handover Security Actions
- [x] Database password rotated 2026-09-10
- [x] API keys regenerated under client-owned accounts
- [x] Freelancer removed from all hosting/repo team access
- [ ] 2FA enabled on client's GitHub org admin account (client action)
```

```template
## Environment Variables — Order Management Admin Panel

| Variable | Required | Environment | Description | Example |
|---|---|---|---|---|
| `DATABASE_URL` | Yes | all | PostgreSQL connection string | `postgresql://...` |
| `NEXT_PUBLIC_SITE_URL` | Yes | all | Public application URL | `https://orders.meridianretail.example` |
| `RESEND_API_KEY` | Yes | production | Email provider key | `re_xxxxxxxx` |
| `NEXT_PUBLIC_ANALYTICS_ID` | Optional | production | Analytics tag | `G-XXXXXXX` |

**Secret variables** (never client-side, never in this doc's real form):
`DATABASE_URL`, `RESEND_API_KEY`, `SESSION_SECRET`

**Public variables** (safe for browser exposure):
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ANALYTICS_ID`

**Provider ownership:** All production values stored in Railway/Vercel
environment settings, owned by client account. Local `.env.local` is
gitignored and never committed.

**Rotation note:** To replace a compromised key, generate a new value in the
provider dashboard, update the hosting environment variable, and redeploy.
```

## When to Use
- At project kickoff, to decide the ownership model up front rather than defaulting into freelancer-owned-long-term by accident
- Throughout development, whenever a new environment variable or third-party credential is introduced, to keep the variable table current instead of reconstructing it at the end
- At final handover, without exception, to walk through the access inventory and confirm every account transfer and rotation has actually happened
- Whenever a project is inherited, transferred to another vendor, or a support relationship ends, as the checklist for what access must be revoked or rotated

## Common Mistakes
- **The database password gets sent over in a chat message so the client can log in right away** — Sending real production credentials over plain email or chat instead of a password manager or provider invite
- **The project handed over months ago, and the developer's account still has full production access** — Leaving freelancer access active indefinitely after handover with no stated reason or agreement
- **The handover markdown file includes the real API key, pasted straight from the `.env`** — Committing a real `.env` file or pasting real secret values into a markdown handover document
- **The client nodded along during the access review, so the rotation checklist gets marked complete without actually checking each item** — Treating "the client seemed to understand the access list" as equivalent to having actually verified every rotation and revocation happened

## Further Reading
- OWASP, "Secrets Management Cheat Sheet" — foundational guidance on how credentials should be stored, rotated, and never embedded in documentation or code: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- 1Password, "Team vaults and sharing best practices" — practical patterns for secure credential handover between organizations
- The Twelve-Factor App, "Config" — the canonical case for strict separation of configuration/secrets from code: https://12factor.net/config
- [GOV.UK Service Manual](https://www.gov.uk/service-manual) — a public, worked standard for running and handing over a service, useful as a reference model rather than a rulebook

```recall
- q: "State the one rule that overrides everything in access handover, and the three facts the client still gets."
  must:
    - "document ownership and location, never the actual secret"
    - "what the client owns"
    - "what the developer can still access after handover"
    - "which credentials should be rotated the moment ownership changes hands"

- q: "Name the three ownership models and the risk each carries."
  must:
    - "client-owned-from-the-start — the best default, developer invited with only the access the current phase needs"
    - "freelancer-created-then-transferred — acceptable when documented honestly, transferred or recreated at handover"
    - "freelancer-owned-long-term — only legitimate with a real maintenance agreement behind it"
    - "otherwise an unpaid unbounded obligation, and a single point of failure if the developer is unreachable"

- q: "What must environment documentation contain, and why is none of it optional?"
  must:
    - "an .env.example"
    - "a variable table separating required from optional and public from secret"
    - "explicit rotation notes"
    - "without it the project cannot be safely deployed, debugged or transferred by anyone but the original developer"
```
