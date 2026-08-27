# Proposals 03 — Product / UX

> Verbatim output of the `ideate:product-ux` agent. It received all six audit reports as input.

## Lens

product-ux — everything outside the lesson body. My read of this repo: the content is 412 terminal nodes with no edges. `LessonPage.tsx` renders six cards and stops; `CourseOverviewPage.tsx` and `getSidebarNavGroups` both sort bracket-before-id, which shreds the authored order in 20 of 23 courses (business-finance-solo-ops opens on 352 "Ethical Growth" instead of 316 "Cash Flow", which every later lesson depends on); there is no search, no next/prev, no progress, no cross-link, and the 26 `(#N)` refs already written into the prose are dead text even though lesson ids are globally unique across the whole corpus (verified: 412 items, ids 1–430, zero duplicates — `#41` resolves unambiguously to database-advanced/41). `zustand@^5` is in package.json with zero imports, and ADR 0001 §3 already promised "Phase 2's progress tracking will live in localStorage (Zustand + persist)". `DashboardShell` even ships an unused `topbarExtra` slot commented "(e.g. search)". So the highest-leverage product work is not new chrome — it is wiring the graph the content already implies. The proposals are ordered so the cheap structural fixes (order, refs, vitals) land first and become the substrate for search, progress, and capstones. Two of them (Failure Drill, Concept Spine) turn assets the corpus already has — 1,771 mistake bullets, 27 lessons mentioning idempotency across 12 courses — into retrieval and spaced re-encounter without authoring a single new paragraph, which is the only way anything here scales to 412 lessons.

## Proposals (8)

### 03.1 Concept Spine · effort M

**A curated global glossary that auto-links concept terms and live `(#N)` refs inside lesson prose at build time, so every lesson becomes a node in a graph instead of a dead end.**

**What changes**

NEW `content/concepts.json` (~120 curated entries: `{slug, term, aliases[], oneLine, canonicalLessonId, kind}`). NEW `modules/course_content/course_content.concepts.ts` — Zod-validates the file, builds an alias→slug map, and at build time scans all 412 parsed lessons to compute `appearsIn[]`. CHANGE `course_content.markdown.ts`: insert two plugins into the existing unified pipeline between `remarkRehype` and `rehypeStringify` — `rehypeConceptLinks` (links the FIRST occurrence per section only, skips `<code>`, `<pre>`, `<a>`, `<h*>`, caps at 4 links/lesson) and `rehypeLessonRefs` (rewrites `(#41)`/`#16` → `/lessons/41`). NEW `app/lessons/[id]/page.tsx` — 412 static id→canonical-URL redirect pages, valid because ids are globally unique. NEW `app/concepts/page.tsx` (A–Z) and `app/concepts/[slug]/page.tsx`. CHANGE `LessonPage.tsx`: a `ConceptRail` under the badges splitting concepts this lesson *defines* from ones it *assumes*. `markdownToHtml()` gains an optional `{lessonId}` arg so a lesson never self-links.

**Example snippet**

```
// content/concepts.json — one entry
{
  "slug": "idempotency-key",
  "term": "idempotency key",
  "aliases": ["idempotent", "idempotency", "Idempotency-Key header"],
  "oneLine": "A client-supplied unique id on a mutating request; the server returns the cached response of the first execution instead of re-running the operation.",
  "canonicalLessonId": 7,
  "kind": "mechanism"
}

<!-- Effect inside content/courses/distributed-systems-api-design/03_saga_pattern.md.
     Source markdown is UNTOUCHED; the rehype pass rewrites the first hit in the
     Key Concepts section only: -->
- <a href="/concepts/idempotency-key" class="concept-ref">Idempotency</a>: Each saga
  step must be idempotent — if retried due to a crash, it must not double-charge

<!-- /concepts/idempotency-key renders, all counts computed at build time: -->
IDEMPOTENCY KEY   mechanism
"A client-supplied unique id on a mutating request; the server returns the
cached response of the first execution instead of re-running the operation."

Defined in  → 7. Idempotency Key Pattern  (Distributed Systems & API Design)
Appears in  → 27 lessons across 12 courses
  Distributed Systems & API Design  3. Saga Pattern · 4. Circuit Breaker, Bulkhead, Retry
  Security                          32. JWT Security
  AI & LLM Engineering              147. Anthropic API Client Architecture
  … 23 more

<!-- and this line in fundamentals-tools/121_sql_fundamentals.md, dead today, becomes a link: -->
Everything from N+1 Query Problem (<a href="/lessons/16">#16</a>) to PostgreSQL
MVCC (<a href="/lessons/41">#41</a>) assumes fluency with plain SQL
```

**Why it makes them feel knowledgeable**

Recurrence is the corpus's most underused asset and it is currently invisible: 'idempotency' appears in 27 lessons across 12 courses, 'retry' in 35 across 14, 'JWT' in 32 across 13. Today each of those is a first encounter. Linked, each is a *second* encounter — unplanned spaced retrieval, at zero authoring cost. The concept page's "appears in 27 lessons across 12 courses" also teaches something the lessons never say out loud: that idempotency is not a distributed-systems trivia item but a load-bearing primitive recurring in payments, AI clients and webhooks. That cross-domain recognition — 'I keep meeting this, and now I see why' — is what separates someone who read a topic from someone who holds a model of the field.

**Risk**

Over-linking turns prose into blue soup, and generic terms are landmines ('index' appears in 66 files, 'cache' in 49). Mitigations must be hard rules, not judgement: a curated 120-term list (never auto-extracted), first-occurrence-per-section only, a hard cap of 4 links per lesson, a denylist for words with a common non-technical sense, and a vitest snapshot asserting the link count for three fixture lessons so a concepts.json edit cannot silently carpet-bomb the corpus.

### 03.2 Authored Order, Vitals, and Learning Paths · effort M

**Fix the bracket-before-id sort that currently scrambles 20 of 23 courses, then add per-lesson vitals (time, depth, prerequisites) and cross-course Paths so a buyer sees a curriculum with a start and an end.**

**What changes**

CHANGE `CourseOverviewPage.tsx`: drop the `BRACKET_ORDER.filter(...).map(...)` grouping; render one `id`-ordered list with the bracket as a right-aligned `Badge`, plus a 'Group by experience' toggle preserving the old view. CHANGE `course_content.service.ts` `getSidebarNavGroups`: `sort((a,b) => a.id - b.id)` — delete `bracketRank`. CHANGE `course_content.types.ts` `ManifestItem` and `ManifestItemSchema` in `course_content.manifest.ts`: add optional `prereqs?: number[]`, `depth?: 'orientation'|'mechanism'|'reference'`, `minutes?: number` — Zod `z.object` strips unknown keys today, so manifest edits are silently dropped until the schema changes, which is the actual blocker. NEW `CourseContentService.getLessonVitals()` computing `minutes` from word count / 220 when absent. CHANGE `LessonPage.tsx`: a vitals strip under the h1. NEW `content/paths.json`, `app/paths/[pathSlug]/page.tsx`, `modules/course_content/ui/PathPage.tsx`. CHANGE `app/(frontend)/page.tsx`: a Paths section above the 23-card course grid.

**Example snippet**

```
// content/courses/fundamentals-tools/manifest.json — 121 gains structure that its
// own prose already asserts ("Everything from N+1 (#16) to MVCC (#41) assumes
// fluency with plain SQL"), inverted into a prereq edge:
{ "id": 121, "file": "121_sql_fundamentals.md",
  "title": "SQL Fundamentals — Joins, Normalization, Core CRUD",
  "bracket": "0-1", "category": "Fundamentals",
  "depth": "orientation", "minutes": 4, "prereqs": [] }

// …and 41 declares what it assumes:
{ "id": 41, "file": "41_postgresql_mvcc_vacuum_bloat_isolation.md",
  "depth": "mechanism", "prereqs": [121, 17] }

<!-- Vitals strip on /courses/database-advanced/postgresql-mvcc-vacuum-bloat-isolation -->
41. PostgreSQL MVCC, VACUUM, Bloat & Isolation
[3-7 yrs] [mechanism] [~5 min read] [1 code block]
Assumes: SQL Fundamentals (#121) · Database Indexing (#17)
Builds toward: Optimistic vs Pessimistic Locking (#42)

// content/paths.json
{ "slug": "backend-engineer-0-3",
  "title": "Backend Engineer, 0→3 years",
  "blurb": "38 lessons, ~4h reading, ending in the Postgres Correctness capstone.",
  "stages": [
    { "title": "Fluency",        "lessonIds": [119,120,121,122,125,127] },
    { "title": "Making it work", "lessonIds": [124,128,16,17,18] },
    { "title": "Making it safe", "lessonIds": [29,32,7,41,42] }
  ],
  "capstoneCourse": "database-advanced" }
```

**Why it makes them feel knowledgeable**

Two mechanisms. First, sequence: business-finance-solo-ops currently opens on 352 'Ethical Growth' (bracket 0-1, authored 37th) instead of 316 'Cash Flow and Runway', which every later lesson builds on, and framework-deep-dives puts Express 401 twenty-seven positions after its own 396→402 build sequence. A reader taking the course in the order shown is being taught the dependencies backwards, which is the difference between a subject cohering and a subject feeling like trivia. Second, prerequisites make the reader's own gaps legible: 'Assumes: SQL Fundamentals (#121)' on the MVCC lesson tells someone honestly whether they are ready, and finishing a Path tells them what they now hold. 'I completed the Backend 0→3 track' is a claim about coverage; '412 lessons exist' is not.

**Risk**

Authoring 412 prereq edges by hand is the real cost and would stall the whole thing. Scope it: `prereqs` stays optional in the schema, seed only the ~60 spine lessons (seeded free from the 26 existing `(#N)` refs plus the Concept Spine's co-occurrence data), leave the rest empty, and render the strip without the Assumes line when the array is absent. The sort fix is a two-line change and should ship on its own the same day — it is a correctness bug today, not a feature.

### 03.3 Portable Progress · effort M

**localStorage progress, next-lesson continuation, and a downloadable progress file that gives a no-account static site the one thing accounts were for.**

**What changes**

NEW `modules/progress/progress.store.ts` — Zustand + `persist` (key `learn.progress.v1`), shape `{completed: Record<lessonId, isoDate>, lastVisited: {courseSlug, lessonSlug}, streak: {days, lastDay}}`. `zustand@^5` is already a declared dependency with zero imports anywhere, and ADR 0001 §3 explicitly planned this. NEW `modules/progress/ui/LessonFooterNav.tsx`, `CourseProgressRing.tsx`, `StreakChip.tsx`, `ProgressFileControls.tsx` (all client). NEW `app/me/page.tsx` — static shell that hydrates client-side. CHANGE `course_content.service.ts`: add `getLessonNeighbors(courseSlug, lessonSlug)` returning prev/next in authored id order (depends on the sort fix). CHANGE `LessonPage.tsx`: render `<LessonFooterNav>` after the six cards. CHANGE `app/(frontend)/page.tsx`: a `<CourseProgressRing>` on each catalog card. CHANGE `app/courses/[courseSlug]/layout.tsx`: pass `topbarExtra={<StreakChip />}` into the existing unused `DashboardShell` slot. Every progress component renders a neutral skeleton until `isBrowser` + mount, to avoid hydration mismatch.

**Example snippet**

```
// modules/progress/progress.store.ts (excerpt)
export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      completed: {},
      streak: { days: 0, lastDay: '' },
      markComplete: (lessonId: number) => {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
        const { streak } = get();
        set({
          completed: { ...get().completed, [lessonId]: new Date().toISOString() },
          streak:
            streak.lastDay === today ? streak
            : { days: streak.lastDay === yesterday ? streak.days + 1 : 1, lastDay: today },
        });
      },
    }),
    { name: 'learn.progress.v1', version: 1 }
  )
);

<!-- Footer of /courses/security/jwt-security-rs256-hs256-rotation -->
┌──────────────────────────────────────────────────────────────┐
│ [✓ Mark complete]        Security  ▓▓▓▓▓▓▓░░░░░░  6/13        │
│ ← 31. Secrets Management        33. SSRF (Server-Side …) →   │
└──────────────────────────────────────────────────────────────┘

<!-- /me -->
5-day streak · 47 of 412 lessons · last read: 32. JWT Security
Security                    ▓▓▓▓▓▓▓░░░░░░  6/13
Distributed Systems & API   ▓▓▓▓▓▓▓▓▓░░░░  9/18
Database — Advanced         ▓░░░░░░░░░░░░  1/12
[ Download progress file ]   learn-progress-2026-08-27.json
[ Import a progress file ]   drag & drop
```

**Why it makes them feel knowledgeable**

Completion state converts an undifferentiated 412-file wall into a shrinking remainder, which is the strongest 'I own a curriculum' signal available without a backend. The next-lesson button matters more than it looks: every lesson is a terminal node today, so a session ends whenever a page ends. Continuation is what turns 412 reads into a course. And the download/import file is the honest answer to the ADR's own listed Loss ('no cross-device progress tracking') — the reader owns their record as a file rather than renting it from an account that does not exist.

**Risk**

localStorage is per-device and one cleared-site-data away from zero; losing six weeks of ticks makes a paid product feel cheap. The export file is therefore not optional — it must sit above the fold on `/me` and be offered automatically at every 25-lesson milestone. Second risk: streaks can become guilt mechanics. Keep it a quiet count — no notifications, no loss animation, no 'you broke your streak' copy.

### 03.4 ⌘K Corpus Search · effort M

**A build-time static search index over all 412 lessons that searches Key Concepts and Common Mistakes, not just titles, and deep-links straight to the section that answers you.**

**What changes**

NEW `scripts/build-search-index.ts`, wired as `"prebuild"` in package.json, reusing `CourseContentService` + `parseLessonMarkdown` to write `public/search-index.json` (412 records × ~350 B ≈ 150 KB raw, ~40 KB gzipped). NEW `modules/search/search.rank.ts` (field-weighted token scoring, no new dependency) and `modules/search/ui/CommandPalette.tsx` + `SearchTrigger.tsx` (client; lazy-`fetch`es the index on first open, caches in module scope). CHANGE `app/courses/[courseSlug]/layout.tsx` to pass `topbarExtra={<SearchTrigger />}` — the `DashboardShell` prop already exists and its comment literally reads '(e.g. search)'. CHANGE `app/(frontend)/layout.tsx` header to mount the same trigger. CHANGE `LessonSectionCard.tsx` to accept an `anchorId` and render `<section id={anchorId}>` so results deep-link to `#common-mistakes`. CHANGE `.gitignore`: the index is generated, never committed.

**Example snippet**

```
// one record in public/search-index.json, generated from
// content/courses/distributed-systems-api-design/07_idempotency_key_pattern.md
{
  "i": 7,
  "c": "distributed-systems-api-design",
  "s": "idempotency-key-pattern",
  "t": "Idempotency Key Pattern",
  "b": "3-7",
  "k": ["Idempotency key", "Idempotency store", "Natural idempotency",
        "At-least-once delivery", "Exactly-once semantics",
        "Concurrent duplicate handling", "Key expiry", "Response caching"],
  "m": ["Using Redis as the idempotency store",
        "Not handling the concurrent case",
        "Key scope too broad",
        "Not returning the original response"]
}

<!-- ⌘K, typing "double charge" -->
COMMON MISTAKES
  Non-idempotent saga steps                     3. Saga Pattern           3-7
  "…if chargeCard is not idempotent, you charge twice"
  Not handling the concurrent case              7. Idempotency Key        3-7
KEY CONCEPTS
  Exactly-once semantics                        7. Idempotency Key        3-7
LESSONS
  4. Circuit Breaker, Bulkhead, Retry           Distributed Systems       3-7

<!-- Enter → /courses/distributed-systems-api-design/saga-pattern#common-mistakes -->
```

**Why it makes them feel knowledgeable**

Searching by *symptom* rather than by topic name is what makes a reference feel like it belongs to you. Weighting Common Mistakes highly is the key decision: 1,771 of those bullets are phrased as real-world failures, so 'double charge', 'N+1', 'lock timeout' land the reader on the exact paragraph naming their problem. That is the moment a course stops being something read once and becomes something returned to under pressure — and returning under pressure is retrieval practice with the highest possible motivation. It also makes breadth felt: one query surfacing hits across four different courses is the reader discovering the material is deeper than the course they happened to open.

**Risk**

Two failure modes. A stale index if someone builds without the prebuild step — guard with a vitest test asserting index record count equals `CourseContentService` lesson count, so CI fails rather than shipping a half-empty search. And thin results, because a title+bullets index has no full text: that is a deliberate trade (full text would be ~2 MB). If bullet-only proves too narrow in real use, add a third field holding only the first sentence of `What It Is` (412 × ~180 B) before ever considering full text.

### 03.5 Failure Drill · effort M

**Turn the existing Common Mistakes section into predict-then-reveal cards, so the corpus's 1,771 expert failure patterns become 1,771 retrieval prompts without writing a single new lesson.**

**What changes**

CHANGE `course_content.parser.ts`: after the section split, run a new `parseMistakes()` over the raw Common Mistakes block, producing `{lead, bodyHtml}[]` by matching `- \*\*(lead)\*\*\s*[—:-]\s*(body)`, falling back to `{lead: firstClause, bodyHtml: rest}` and finally to the whole bullet as `lead` with empty body. CHANGE `course_content.types.ts`: `Lesson` gains `mistakes: LessonMistake[]`; the `commonMistakes` HTML string stays so nothing else breaks. NEW `modules/course_content/ui/FailureDrillCard.tsx` (client) — each lead is a button, the body is hidden until clicked, plus a 'Reveal all' escape hatch and a predicted-count written to the progress store as `drills[lessonId]`. CHANGE `LessonPage.tsx`: swap the `<LessonSectionCard title="Common Mistakes">` line for `<FailureDrillCard mistakes={lesson.mistakes} />`. CONTENT: 609 of 1,771 bullets already carry the `**bold lead** — explanation` shape (all in the 145-lesson first cohort); the other 1,162 are plain sentences and get a bolded lead prepended by one mechanical AI pass, validated by a regex check in a new `scripts/content-lint.ts`.

**Example snippet**

```
<!-- content/courses/security/32_jwt_security_rs256_hs256_rotation.md is UNCHANGED.
     Its bullets already parse: -->
- **Not verifying `iss` and `aud` claims** — A token from your staging environment
  signed with the same secret as production is technically valid without these
  checks; always verify issuer and audience

<!-- rendered by FailureDrillCard: -->
COMMON MISTAKES — 4 failures. Predict each before revealing.        [Reveal all]

┌ 1 ▸ Using the same secret for access and refresh tokens ────────── what breaks? ┐
└────────────────────────────────────────────────────────────────────────────────┘
┌ 2 ▸ Storing raw refresh tokens ─────────────────────────────────── what breaks? ┐
└────────────────────────────────────────────────────────────────────────────────┘
┌ 3 ▾ Not verifying `iss` and `aud` claims ──────────────────────────── revealed ─┐
│ A token from your staging environment signed with the same secret as           │
│ production is technically valid without these checks; always verify issuer     │
│ and audience.                                                                  │
└────────────────────────────────────────────────────────────────────────────────┘
                                                          1 of 4 revealed

<!-- The mechanical content pass, on the other cohort. Before, in
     content/courses/business-finance-solo-ops/316_cash_flow_and_runway.md: -->
- Treating an issued invoice as if it were collected cash, and spending against
  it before it clears.
<!-- After — same sentence, a lead extracted so it can be a prompt: -->
- **Spending against an issued invoice** — treating an issued invoice as if it
  were collected cash, and spending against it before it clears.
```

**Why it makes them feel knowledgeable**

This is the cheapest real learning intervention available here, because the distractors already exist. Reading 'don't register errorHandler before your routes' produces no prediction error and therefore no correction — the reader nods and forgets. Showing only the lead and asking 'what breaks?' forces a commitment; a wrong guess makes the reveal land as a correction rather than a fact, which is the difference between recognising a mistake and being able to diagnose it. Four drills per lesson × 412 lessons is 1,771 acts of production in a corpus that currently contains zero. It is also the honest antidote to the exact failure the owner wants to avoid: a reader who predicts 4 of 4 has earned the feeling of knowing; one who gets 1 of 4 finds out immediately, which no amount of re-reading would have told them.

**Risk**

Interaction friction — nobody wants four clicks on a page they were skimming; mitigate with a prominent 'Reveal all' and by persisting the reader's preference in the progress store, so drill mode is opt-in-and-sticky rather than imposed. And some leads give the answer away ('Using Redis as the idempotency store' half-answers itself) — the lint pass should flag leads over 8 words or containing 'because / so that / which means', for a human to trim in review.

### 03.6 Course Pack · effort S

**Two extra static routes per course — a full printable pack and a one-page cheat sheet — so a buyer walks away with a physical artifact instead of a bookmark.**

**What changes**

NEW `app/courses/[courseSlug]/pack/page.tsx` — one static page rendering every lesson of a course in authored id order with a generated ToC and per-lesson anchors. NEW `app/courses/[courseSlug]/cheatsheet/page.tsx` — Key Concepts bullets + the single code fence + Common Mistakes *leads only* (reusing `parseMistakes` from the Failure Drill proposal), about two printed pages per twelve lessons. NEW `modules/course_content/ui/PrintButton.tsx` (client, `window.print()`) and `CoursePackPage.tsx`. CHANGE `app/globals.css`: a `@media print` block hiding the `AppShell` `<aside>` and `<header>`, forcing the light token set regardless of `.dark`, `pre { white-space: pre-wrap; page-break-inside: avoid }`, `section { break-inside: avoid-page }`, and `a[href^="http"]::after { content: " (" attr(href) ")" }`. CHANGE `CourseOverviewPage.tsx`: a 'Take it with you' row linking both routes. No PDF library and no backend — the browser's print-to-PDF does the work.

**Example snippet**

```
<!-- /courses/security/cheatsheet — 13 lessons, prints to 3 pages -->
SECURITY — CHEAT SHEET                          learn.kuray.dev · 13 lessons

32. JWT SECURITY (RS256/HS256, ROTATION)                            [3-7 yrs]
  · HS256 = shared secret, symmetric — signer and verifier are the same party
  · RS256 = private key signs, public key verifies — needed once verification
    happens outside the issuing service
  · Rotation via `kid` header + a published key set; retired keys stay
    verifiable for one access-token TTL
  ─ verify: { algorithms: ['RS256'], issuer, audience }  ← never omit `algorithms`
  ✗ same secret for access + refresh   ✗ raw refresh tokens stored
  ✗ long access TTL as revocation      ✗ unverified `iss` / `aud`
  → RFC 7519 · RFC 9700 (OAuth 2.0 Security BCP)

33. SSRF (SERVER-SIDE REQUEST FORGERY)                              [3-7 yrs]
  · Attacker controls a URL your server fetches; the target is the internal
    network, not the internet
  · Block at resolve time, not parse time — DNS rebinding defeats string checks
  ✗ allowlisting by hostname instead of by resolved IP
  …

/* @media print in app/globals.css */
@media print {
  aside, header, .no-print { display: none !important; }
  :root, .dark { --surface-base:#fff; --surface-raised:#fff;
                 --text-primary:#111827; --border:#d1d5db; }
  pre { white-space: pre-wrap; page-break-inside: avoid; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 9px; }
}
```

**Why it makes them feel knowledgeable**

Ownership is physical. A 30-page pack on a desk is a different object from a URL, and it is the clearest refutation of 'this is a folder of notes'. The cheat sheet does separate work: forcing thirteen ~1,029-word lessons down to three pages produces the hierarchy the corpus lacks — the median lesson is eight coordinate Key Concepts bullets with no signal about which three matter today, and compression supplies exactly that signal. Re-reading a cheat sheet a week later is also the only cheap spaced review a static site can offer, and the print stylesheet's `attr(href)` expansion quietly fixes the reference problem: 150 bullets that render as unclickable grey text on screen print with their domain visible.

**Risk**

The 43-lesson content-seo-personal-brand pack is ~45k words in one static route — roughly 600 KB of HTML, slow on mobile; cap the pack route at courses under 25 lessons, paginate the four large ones by bracket, or drop the syntax-highlight classes from pack output (they are most of the markup). And a bad cheat sheet is worse than none, because compression that drops the wrong bullet teaches the wrong hierarchy — so selection must follow an explicit mechanical rule (Key Concepts + mistake leads only), never an AI re-summarisation that could invent.

### 03.7 Capstone + Rubric · effort L

**One buildable project per course with a self-graded rubric drawn from that course's own Common Mistakes — the transfer task the corpus has zero of.**

**What changes**

NEW `content/courses/<slug>/capstone.md` with its own shape (`## Brief / ## Deliverable / ## Rubric / ## What Good Looks Like / ## Reference Walkthrough`). NEW `parseCapstoneMarkdown()` in `course_content.parser.ts` — a separate function, leaving the rigid 6-section lesson parser and its `HEADING_RULES` untouched. NEW `Capstone` type in `course_content.types.ts` and `CourseContentService.getCapstone(slug)` returning null when the file is absent. NEW `app/courses/[courseSlug]/capstone/page.tsx`, `modules/course_content/ui/CapstonePage.tsx`, `RubricChecklist.tsx` (client; each rubric row is a checkbox persisted to the progress store, and a course counts complete only when every lesson is ticked AND the rubric is ≥80%). NEW `app/certificate/page.tsx` — client-only, reads `?d=` (base64url of `{name, courseSlug, date, rubricScore}`) so the URL is shareable, rendered print-ready. CHANGE `CourseOverviewPage.tsx`: pin the capstone as the terminal item in the list.

**Example snippet**

```
<!-- content/courses/distributed-systems-api-design/capstone.md -->
# Capstone — Onboarding Saga That Survives a Stripe Timeout

## Brief
Build the tenant-onboarding saga from lesson 3 (create tenant → charge card →
allocate seats → send welcome email) as a runnable BullMQ project. Then break
it on purpose: make `chargeCard` time out *after* Stripe has committed the
charge. Lesson 3's example deletes the tenant and never refunds. Yours must not.

## Deliverable
A repo with `docker-compose.yml` (Redis + Postgres), `npm run saga:happy`,
`npm run saga:timeout`, `npm run saga:compensate-fails`, and a `RUNBOOK.md`
naming the three log lines you would grep at 3am.

## Rubric — tick what your code actually does
[ ] SEND_WELCOME_EMAIL has a real `case` (lesson 3's example declares it in the
    union and never handles it — the saga silently never reaches COMPLETED)
[ ] `chargeCard` receives an idempotency key wired to the saga id (lesson 7)
[ ] A timed-out charge is *reconciled*, not assumed failed — you query Stripe
    by idempotency key before compensating
[ ] A failing compensation step cannot double-refund on BullMQ retry
[ ] Saga state survives `docker kill` mid-run and resumes from the last step
[ ] `npm run saga:timeout` prints the customer's balance, and it is zero

## What Good Looks Like
Six ticked, and you can answer out loud: "what does my system do when the charge
outcome is unknown?" Four or fewer — re-read 3 and 7 together; they are one
mechanism split across two lessons.

## Reference Walkthrough
[ …the corrected orchestrator, with the ambiguous-outcome branch… ]
```

**Why it makes them feel knowledgeable**

There are 0 exercises across 412 lessons and 'exercise' never once means an exercise for the reader, so today's ceiling is recognition. A capstone is the only element that produces what the owner actually wants: someone who has *run* a saga, watched it lose money, and fixed it. The rubric does the harder job of calibration — a reader who ticks 2 of 6 discovers the gap between feeling informed and being able to produce, which is precisely the illusion re-reading creates and nothing else in this product punctures. Building the rubric from the course's own Common Mistakes also closes the loop: the failures the lessons assert become the criteria the reader is measured against, making those bullets consequential rather than decorative.

**Risk**

23 good capstones is real authoring work and a weak one damages credibility more than a missing one does. Ship five where the payoff is largest (distributed-systems-api-design, security, database-advanced, business-finance-solo-ops, contracts-pricing-legal), gate the route on file existence, and show nothing where there is no file. Separate risk: the certificate is self-issued and unverifiable, and dressing it as an accreditation would cheapen everything around it — label it exactly what it is ('self-issued record of completion, generated from your own progress file') or cut it and keep only the rubric score.

### 03.8 Türkçe Katman · effort XL

**A locale segment plus per-lesson translation files, so the Turkish intern this platform is actually for reads the fundamentals in Turkish and never hits a dead page when a translation is missing.**

**What changes**

CHANGE routing: move `app/(frontend)` and `app/courses` under `app/[locale]/`, with `generateStaticParams` returning `['en','tr']` — 824 lesson pages instead of 412, still trivially static. NEW `content/courses/<slug>/tr/NN_title.md`, optional per lesson. CHANGE `course_content.manifest.ts`: `readLessonMarkdown(courseSlug, file, locale)` tries `tr/` first, falls back to English, and returns `{raw, servedLocale}`. CHANGE `LessonPage.tsx`: when `servedLocale !== requested`, render a `<Badge variant="warning">` marking the lesson as the English original. NEW `modules/shared/i18n/strings.ts` (~40 chrome strings only — section titles, brackets, nav, progress copy) and `modules/shared/ui/LangSwitcher.tsx` mounted through `DashboardShell`'s `topbarExtra`. CHANGE `DashboardShell.tsx`'s header comment and `app/layout.tsx`'s hardcoded `lang="en"` — the file currently documents 'No LangSwitcher: single-language project' as an intentional deviation, so this needs `docs/adr/0002-bilingual-content.md` superseding it. CHANGE `scripts/content-lint.ts`: compare a `sourceHash` in each TR file against the English file's hash and fail the build on a stale translation.

**Example snippet**

```
<!-- content/courses/fundamentals-tools/tr/121_sql_fundamentals.md -->
<!-- source: 121_sql_fundamentals.md  sourceHash: 9f3c1a2e -->
# 121. SQL Temelleri — Join'ler, Normalizasyon, Temel CRUD

## What It Is
N+1 Sorgu Problemi'nden (#16) PostgreSQL MVCC'ye (#41) kadar her şey düz SQL
akıcılığını varsayar — ORM, üstüne kurulmuş bir kolaylık katmanıdır, hangi
sorguyu ürettiğini anlamanın yerine geçmez.

NULL özel dikkat ister: "bilinmiyor" demektir, "boş" ya da "sıfır" değil, ve
karşılaştırmalarda insanı ilk seferinde şaşırtacak şekilde yayılır
(`NULL = NULL` sonucu `true` değil, `NULL`'dur).

<!-- The `##` headings stay ENGLISH on purpose: HEADING_RULES in
     course_content.parser.ts matches those exact prefixes, and the localized
     card title comes from strings.ts, not from the file. That is why the
     parser needs no change at all. -->

// modules/shared/i18n/strings.ts
export const strings = {
  en: { whatItIs: 'What It Is', keyConcepts: 'Key Concepts',
        commonMistakes: 'Common Mistakes', lessons: (n: number) => `${n} lessons` },
  tr: { whatItIs: 'Nedir',      keyConcepts: 'Temel Kavramlar',
        commonMistakes: 'Sık Yapılan Hatalar', lessons: (n: number) => `${n} ders` },
} as const;

<!-- /tr/courses/database-advanced/postgresql-mvcc-vacuum-bloat-isolation -->
[⚠ Bu ders henüz İngilizce — çeviri bekliyor]
```

**Why it makes them feel knowledgeable**

Comprehension is not a translation nicety at the fundamentals level. A 0-1 bracket intern reading 'three-valued logic' in a second language spends working memory on the language instead of on NULL semantics — and working memory is exactly what lesson 121 already overloads with nine coordinate concepts in 552 words. Turkish on the entry-level lessons removes a load that has nothing to do with the subject. On the business side the switch forces the jurisdiction fix as a side effect: you cannot write `319_tax_and_accounting_readiness` in Turkish and leave it about W-8BEN and UK reverse-charge VAT — translating it surfaces that KDV, e-Fatura and geçici vergi are missing, which is the content defect the graders called the most expensive in the corpus.

**Risk**

Genuinely dangerous to maintainability: 412 translations doubles the surface, and a stale Turkish lesson contradicting a corrected English one is worse than no Turkish at all. Hard rules — English stays canonical and always ships first; TR files carry `sourceHash` and CI fails on drift; rollout is staged and small (chrome strings only → the 12 `fundamentals-tools` lessons → the business courses). Do not start until the Concept Spine's link rewriting is settled, because concept terms need a per-locale alias table and retrofitting that across 412 TR files later would be miserable.
