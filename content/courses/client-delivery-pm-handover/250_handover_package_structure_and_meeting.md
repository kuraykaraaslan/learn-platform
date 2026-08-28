# 250. Handover Package Structure and the Handover Meeting

## What It Is
The handover package is the final delivery bundle — the thing that proves a project was delivered professionally rather than just abandoned at a working state. "Here's the GitHub link," "everything is in the code," and "call me if something breaks" are not handovers; they're the absence of one, and they leave the client with a system they can't confidently operate and a future developer with a system they can't confidently inherit. A real handover package has a fixed set of components regardless of project size: a delivery summary, source location, production URL, access instructions, environment and deployment documentation, database and backup notes, a third-party service list, known issues, support terms, and a recorded acceptance signoff.

For a small project, these can live as sections within one document. For anything serious, they should be separate files in a predictable folder — a numbered `handover/` directory is a durable, low-friction pattern precisely because both a non-technical client and a future developer can navigate it without guessing. The delivery summary at the top of that package matters more than it looks: it states plainly what version was delivered, what's included, what's explicitly excluded, and who the primary contacts are, so nobody has to reconstruct project scope from memory or from the code itself months later.

The handover meeting is where this package stops being a document nobody reads and becomes a shared understanding. It's the session where the client's team actually sees the access list, understands the support boundary, and has a chance to ask "wait, what about X" while the developer is still present to answer — not three weeks later over a support ticket. Sending the package by email with no accompanying walkthrough tends to produce a package that gets skimmed once and never referenced again; walking through it live is what makes the client's team capable of finding things themselves later.

## Key Concepts
- **Eleven fixed components, regardless of scale**: delivery summary, source code location, production URL, access instructions, environment/config docs, deployment runbook, database/backup notes, third-party service list, known issues, support terms, acceptance signoff
- **Folder structure scales with project seriousness**: a small project can fold all of this into one document's sections; a serious project should split it into a numbered `handover/` folder that both a client and a future developer can navigate without guidance
- **The delivery summary is the anchor document**: version delivered, included/excluded modules, final commit or tag, and primary contacts — the one page that answers "what did we actually get" without reading anything else
- **Access and ownership listed, never with real secrets included**: document where each credential lives and who owns each account — never the actual password, token, or key value inside the package itself
- **Format follows audience**: markdown in the repository serves developer continuity best; a PDF summary or client portal export serves a business-owner audience better — pick based on who will actually reference it later
- **The final handover email has a fixed structure**: it names what's included, states the review deadline, and explicitly states what happens to new requests after signoff — this email is itself part of the package, not just a delivery notice
- **The handover meeting is not optional ceremony**: a live walkthrough of the package, while the developer can still answer questions directly, produces a client team that can actually navigate the documentation later — an emailed package alone rarely gets referenced again

## Example Code
```md
handover/
├── 00-delivery-summary.md
├── 01-admin-user-guide.md
├── 02-technical-readme.md
├── 03-architecture-overview.md
├── 04-deployment-runbook.md
├── 05-environment-config.md
├── 06-database-and-backup.md
├── 07-api-and-integrations.md
├── 08-access-and-ownership.md
├── 09-known-issues-and-limitations.md
├── 10-release-notes.md
├── 11-support-and-maintenance.md
└── 12-acceptance-signoff.md
```

```text
Subject: Order Management Admin Panel - Final Handover Package

Hi Tomas,

The final handover package for the Order Management Admin Panel is ready.

Included:
- Production URL: https://orders.meridianretail.example
- Repository: github.com/meridianretail/order-admin (transferred to your org)
- Admin/user guide (handover/01-admin-user-guide.md)
- Deployment and environment documentation
- Access and ownership list (handover/08-access-and-ownership.md)
- Known issues/limitations (large exports >5,000 rows take ~8 seconds)
- Support and maintenance terms (14-day post-launch window, ends 2026-09-25)
- Acceptance/signoff checklist

I'd like to walk through this together in a 30-minute handover call before
you sign off, so your team knows exactly where everything lives. Are you
available Thursday at 10 AM?

Please review the acceptance section by 2026-09-13. After signoff, new
requests will be handled as change requests or under a maintenance plan.

Best,
[Developer]
```

## When to Use
- Before final delivery on any project beyond the smallest scope, as the structured alternative to an informal "here's the code" handoff
- When transferring a repository, production environment, or client accounts, to make sure ownership and access are documented alongside the transfer itself
- When scheduling final signoff, pairing the package delivery with a live walkthrough meeting rather than an email-only handoff
- When a project is inherited mid-stream from another developer, as the missing artifact to reconstruct or request from the outgoing team

## Common Mistakes
- **The final message to the client is "here's the GitHub link, call me if anything breaks"** — Handing over only a repository link with no accompanying summary, guide, or access documentation
- **A serious project's entire handover lives in one long document with no folder structure to navigate it by** — Splitting a serious project's handover into a single sprawling document instead of a navigable folder structure
- **The handover package goes out by email, with no call scheduled to walk through it** — Sending the package by email with no live walkthrough, producing a document that gets skimmed once and then forgotten
- **The handover email never says what happens if the client wants something new after signing off** — Leaving the "what happens to new requests after signoff" question unstated, so post-handover expectations stay ambiguous

## Further Reading
- Divio, "The documentation system" — informs how to split a handover package by document purpose rather than one undifferentiated file: https://docs.divio.com/documentation-system/
- PMI, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* — the Closing process group addresses formal transfer of deliverables and administrative closure
- Atlassian, "Runbooks and handover documentation best practices" — practical patterns for operational handover structure: https://www.atlassian.com/incident-management/handbook/runbooks
- [GOV.UK Service Manual](https://www.gov.uk/service-manual) — a public, worked standard for running and handing over a service, useful as a reference model rather than a rulebook
