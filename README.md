# learn.kuray.dev

An internal course platform for interns and employees. First set of courses:
145 concepts a 10-year software engineer should know, split into **15
category-based roadmaps** (Security, Distributed Systems & API Design,
AI & LLM Engineering, ...), each concept tagged with an experience bracket
(0-1 / 1-3 / 3-7 / 7-10 years) — rendered statically straight from markdown
files.

Scaffolded as a Next.js App Router project per `Code_Structure_Rules_Next` +
`Code_Structure_Rules_TS` (`internal-ai-rules/Project_Scaffolder --generate`).
UI is copy-pasted from `kui-react` (see `modules/shared/ui/kui/PROVENANCE.md`).

**This project deliberately deviates from the company's standard backend
patterns** — see `docs/adr/0001-no-backend-markdown-content.md`.

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript (strict)
- Tailwind CSS v4 (CSS-config-driven, no `tailwind.config.js`)
- Zustand + persist (Phase 2: local progress tracking, not yet implemented)
- `AppShell` / `AppSidebar` / `AppTopBar` copied from kui-react (`@kui/*` alias)
- next-themes (dark mode), FontAwesome 7 (icons)
- Zod (manifest validation), unified/remark/rehype + rehype-highlight
  (markdown → syntax-highlighted HTML, section-split into What It Is /
  Key Concepts / Example Code / When to Use / Common Mistakes /
  Further Reading)

**Standard pieces deliberately removed:** TypeORM, Postgres, auth, `axios`,
`next-intl` — this is a backend-less, account-less, fully static content
site. See the ADR for the full rationale.

## Content tooling

The corpus is 412 markdown lessons, so every change to it is a bulk change. These
guard it:

```bash
npm run content:check        # lint + code verification + tests
npm run content:lint         # 12 rules over all lessons and manifests
npm run content:verify-code  # typechecks every TS/TSX fence in the corpus
npm test                     # parser, ordering, cross-reference tests
npm run content:snapshot     # regenerate the render snapshot (intended changes only)
```

- **`content/_reports/parse-snapshot.json`** hashes the rendered HTML of all 412
  lessons. Any mechanical pass over the corpus must leave it unchanged;
  regenerate it only when a render change is intended, and say so in the commit.
- **`content/_reports/code-verification.md`** lists every code fence that does
  not typecheck. It uses the TypeScript compiler API per file, because the `tsc`
  CLI suppresses all semantic errors whenever any file in the program has a
  syntax error — which hid 120 broken snippets behind 19 mislabeled fences.
- **`content/_waivers.json`** waives one rule for one file, with a reason, an
  owner and an expiry. An expired waiver is itself an error.

Rules ship as `warn` and are promoted to `error` once the corpus is clean of
them, so the gate never blocks on a backlog it did not create.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next dev server (http://localhost:3000). |
| `npm run build` | Production build (includes static page generation). |
| `npm start` | Run built app. |
| `npm run lint` | ESLint via `next lint`. |
| `npm test` | Vitest. |

## Repository Structure

```
content/courses/<slug>/       ← one folder per course: lesson .md files + manifest.json
                                 (15 courses today, split by category — see split_courses
                                 script history; more can be added the same way)
libs/                          ← thin infra wrappers (cn, isBrowser, icons)
modules/
  shared/ui/
    kui/                       ← components copied from kui-react (@kui/* alias)
    DashboardShell.tsx         ← THE shell component — appshell-compliance.md
    ThemeToggle.tsx
  course_content/               ← manifest reading, markdown→HTML pipeline, section
                                   parsing, lesson/course service, UI (CourseOverviewPage,
                                   LessonPage, LessonSectionCard)
app/
  layout.tsx / providers.tsx / globals.css
  (frontend)/                  ← course catalog only (no DashboardShell — landing page)
  courses/[courseSlug]/        ← DashboardShell is set up HERE (sibling of (frontend),
                                   NOT nested under it — the two need different chrome)
    [lessonSlug]/               ← lesson page, generateStaticParams covers every
                                   (courseSlug, lessonSlug) pair across all courses
  api/health/route.ts
```

## Notes (documented rule deviations)

- **No DB, no auth, no `axios`/API calls** — content is read from the
  filesystem at build time; there's no server-side state at all. See ADR 0001.
- **No LangSwitcher in the TopBar** — single-language project exception
  (English-only, UI chrome and lesson content alike).
- **No UserMenu in the TopBar** — there's no auth, so there's no user
  identity to show (not one of appshell-compliance.md's named exceptions
  verbatim, but documented here in the same spirit).
- No Server Actions (there are no mutations to begin with); no React
  Query/SWR (there are no API calls to begin with).

## Branch and Commit Workflow

Follow `Development_Delivery_Rules/branch-and-commit-workflow.md`:
`feature/<scope>`, `fix/<scope>`, `refactor/<scope>`, `hotfix/<scope>`, `chore/<scope>`, `docs/<scope>`.
