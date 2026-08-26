# ADR 0001: Static, markdown-driven content — no DB/auth/backend

## Status
Accepted (2026-08-26).

## Context
The company's standard Next.js pattern (`Code_Structure_Rules_Next`,
next-boilerplate's `dynamic_page` module) models content as a Postgres +
TypeORM backed CMS, edited block-by-block from an admin UI — part of a
multi-tenant SaaS platform. This project instead serves a simple internal
course site built from 145 markdown documents (+ `learning_path_map.json`
manifest) that already exist, hand/AI-written, at `/home/kuray/internal-university`.

## Decision
1. **Content is read directly from `.md` files** — no DB, no CMS, no admin
   editor. Files are copied under `content/courses/<slug>/`, parsed at
   build time with `remark`/`rehype`, and turned into static pages via
   Next.js `generateStaticParams`.
2. **No auth, no user accounts, no backend infrastructure at all.**
   next-boilerplate's 137-module multi-tenant SaaS platform was not cloned —
   no TypeORM, no Postgres, no JWT/sessions, no SSO anywhere in this
   project. No `axios`/API routes either, because there's no backend
   service to call.
3. Two things follow naturally from the above: no `UserMenu` in the AppShell
   TopBar (there's no user identity to show), and Phase 2's progress
   tracking will live in `localStorage` (Zustand + persist) rather than
   tied to an account.

## Rationale
- The content already exists and is a small (145), hand-maintained set of
  files — the "many authors, frequently changing, admin-edited content"
  problem a CMS solves doesn't exist here.
- Without auth/DB: deployable and hostable serverlessly (static export or
  plain Vercel/Node hosting), zero infrastructure cost, zero security
  surface (no login form, no session, no authorization — none of it exists).
- Kuray's explicit decision: *"I don't feel a need for infrastructure right
  now... no auth at all."*

## Consequences
- **Gain:** a much smaller, easier-to-understand codebase; zero DB/deploy
  operational overhead; a content update is just a file change + redeploy.
- **Loss / future limitation:** no cross-device progress tracking
  (localStorage is device-local); no admin/manager visibility into who
  completed what; no multi-course/role-based access control right now.
- If these limitations become a real need later (e.g. managers want a
  progress report), the auth+DB decision gets revisited **then** — see the
  Phase 4 note in the project plan. Not built preemptively.

## Related
- `internal-ai-rules/Code_Structure_Rules_Next` — the default pattern this
  deviates from
- `internal-ai-rules/UI_Interface_Rules_Next/appshell-compliance.md` —
  TopBar exceptions (LangSwitcher, UserMenu)
- Plan: `~/.claude-avantleap/plans/bir-web-sitesinde-t-m-elegant-locket.md`
