# 249. Documentation Strategy and Audience Mapping

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Documentation_and_Handover_Rules/documentation-strategy.md material to build out the Client Delivery, PM & Handover course; no existing coverage data for your own practice.

## What It Is
Documentation fails most often not because too little was written, but because it was written for the wrong reader, or for no reader in particular. A single sprawling document that mixes admin passwords, business context, API internals, and end-user instructions serves nobody well: the business owner has to wade through database schema notes to find the support boundary, and the developer inheriting the project has to hunt through screenshots meant for end users to find the environment variable list. Documentation strategy is the decision, made deliberately and early, about who needs what, in what form, and how sensitive each piece is — before any of it gets written.

There are five recurring audiences, and each wants something distinct. The business owner wants what was delivered, what's excluded, project status, and support boundaries — not implementation detail. The admin user wants how to log in, manage data, and manage roles — in plain language, not developer language. The end user wants how to complete their own workflows. The developer wants repository structure, architecture, environment variables, and database and API detail. The operator or support person wants hosting information, logs, backups, and an escalation path. Mapping content to these five before writing anything is what prevents the single-giant-document failure mode.

Sensitivity classification runs orthogonal to audience and is just as important: public, client-internal, technical-confidential, and secret are four different handling levels, and the cardinal rule underneath all of them is that secret values — real passwords, tokens, private keys — never belong in a normal markdown document, no matter how convenient that would be. Depth also has to scale with project risk: a landing page needs a README and a content guide, while a payment-processing e-commerce platform needs the full SaaS documentation set plus payment and webhook failure-handling notes. Documentation isn't a single fixed amount of effort; it's a plan sized to what could actually go wrong.

## Key Concepts
- **Five audiences, five different needs**: business owner (what/status/boundaries), admin user (how to manage), end user (how to complete workflows), developer (architecture/setup/APIs), operator/support (hosting/logs/escalation) — one document cannot efficiently serve all five
- **Never mix secrets into general documents**: passwords, tokens, and recovery codes must never sit in the same file as business scope or user instructions, regardless of how convenient that would be to write
- **A fixed set of document types**: README (dev), ARCHITECTURE (dev/technical), DEPLOYMENT (dev/operator), ADMIN_GUIDE (client), USER_GUIDE (end user), HANDOVER (client owner), CHANGELOG (client/dev), KNOWN_ISSUES (client/support), SUPPORT (client owner) — names can vary, but the content categories are non-negotiable for serious work
- **Depth scales with project risk**: a landing page needs minimal docs; a payment-processing platform needs the full documentation set plus failure-handling notes for money-moving paths
- **Four sensitivity levels**: public, client internal, technical confidential, and secret — each has different storage and access rules, and secret must never appear in a normal document
- **Documentation is written across the whole timeline, not at the end**: define deliverables at proposal stage, document major decisions during architecture, update setup notes during development, complete user-facing docs before delivery, freeze the handover package at final delivery
- **A documentation plan is itself a deliverable**: deciding audiences, sensitivity handling, and update ownership up front is planning work that prevents last-minute scrambling

## Example Code
```md
## Documentation Plan — Order Management Admin Panel

**Project type:** Admin panel (business digitizing operations)
**Audience groups:** Business owner (Tomas), Admin users (Elena + 3 staff),
Developer (future maintainer), Operator (whoever handles hosting long-term)

**Required documents:**
- README.md (developer — setup, local run)
- ARCHITECTURE.md (developer — data model, key decisions)
- DEPLOYMENT.md (developer/operator — hosting, env vars, rollback)
- ADMIN_GUIDE.md (Elena + staff — day-to-day usage)
- HANDOVER.md (Tomas — what was delivered, access, support boundary)
- KNOWN_ISSUES.md (client + future developer — disclosed limitations)
- SUPPORT.md (Tomas — post-delivery process)

**Sensitive information handling:**
Secrets (DB password, API keys) live only in the client's password manager
and hosting provider environment settings — never in any of the above files.

**Client-facing docs:** ADMIN_GUIDE.md, HANDOVER.md, SUPPORT.md, KNOWN_ISSUES.md
**Developer-facing docs:** README.md, ARCHITECTURE.md, DEPLOYMENT.md

**Update owner:** Developer through delivery; Elena for any client-side
process notes added after handover

**Delivery format:** Markdown folder in repository (`/handover`), no
separate PDF requested by client
```

## When to Use
- At the proposal or kickoff stage, before any documentation gets written, to decide which document types this specific project actually needs
- Whenever a document is about to include both sensitive values and general usage instructions — that's the signal to split it into two documents instead of one
- When scoping a new project type against the documentation depth table, to avoid either under-documenting a high-risk system or over-documenting a simple one
- At each major project stage (architecture, pre-delivery, final delivery) as scheduled checkpoints for updating documentation rather than leaving it all for the final week

## Common Mistakes
- Writing one large document that mixes passwords, business scope, API details, and user instructions, making it unsafe to share and hard to navigate for any single audience
- Writing documentation only from the developer's own point of view, leaving the client-facing audiences (business owner, admin, end user) without anything usable
- Leaving all documentation until the last day of the project, guaranteeing it's rushed exactly when it needs to be most reliable
- Relying on screenshots with no accompanying text explanation, which breaks the moment the UI changes even slightly

## Further Reading
- Write the Docs community guide, "Documentation architecture" — practical patterns for structuring docs by audience: https://www.writethedocs.org/guide/
- Divio, "The documentation system" — the tutorials/how-to/reference/explanation framework for separating documentation by reader intent: https://docs.divio.com/documentation-system/
- Anne Gentle, *Docs Like Code* — on treating documentation as a first-class, versioned deliverable rather than an afterthought
