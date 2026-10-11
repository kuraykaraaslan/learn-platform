# Audit 03 — Pedagogy / instructional design

> Verbatim output of the `audit:pedagogy` agent from the `enrich-412-lessons` workflow.
> The agent read real lesson files in `content/courses/` and ran its own measurements before answering.

## Dimension

Pedagogy — instructional design, retrieval, sequencing, cognitive load, transfer

## Verdict

As an instructional product this is a well-written 425,627-word reference encyclopedia (35.5 hours of pure reading) with essentially zero learning architecture: no retrieval, no production, no feedback, no spacing, no progression, no capstone, and 0 of 412 lessons containing a single task the reader performs. Its 6,439 declarative bullets are delivered in the one modality — re-reading — that reliably produces the *largest* gap between felt mastery and actual retention, which is precisely the failure mode of the owner's stated goal ("kendini cidden bilgi sahibi hissetsin"): readers will feel informed and be unable to produce any of it. The fixed 6-section, ~1000-word template is both a ceiling and a floor — it gives a 10-minute topic (constant-time comparison, 1043 words) twice the space of a semester-sized one (SQL joins + 1NF–3NF + NULL logic + transactions, 552 words) — and it is enforced in three code files, so no amount of markdown authoring can add a pedagogical element. The single worst defect is not content at all: `CourseOverviewPage.tsx` sorts by experience bracket before lesson id, which shreds the authored teaching sequence in 20 of 23 courses.

## Findings (10: 5 critical, 5 major, 0 minor)

### 1. [CRITICAL] Zero retrieval practice: the corpus makes 6,439 declarative assertions and never once asks the reader to produce anything, which is the exact study modality that maximizes the illusion of knowing.

**Evidence**

Counted across all 412 files: 3,029 'Key Concepts' bullets + 1,771 'Common Mistakes' bullets + 1,639 'When to Use' bullets. grep for 'try it yourself|your turn|now try|practice this|do this now' → 0 files. 'quiz' → 1 file. The 168 question-mark sentences outside code (115 files) are all rhetorical prose, e.g. architecture-design-patterns-testing/65_hexagonal_architecture.md: "**When switching infrastructure** — migrating from TypeORM to Drizzle?" — no answer, no reader response expected.

**Affected scope**

412 / 412 lessons

### 2. [CRITICAL] No production or transfer task exists anywhere — 23 courses, 412 lessons, 0 capstones, 0 exercises; the word 'exercise' appears 31 times and never once means an exercise for the reader.

**Evidence**

All 31 hits are the ordinary English verb/noun: framework-deep-dives/402_express_testing_with_jest_and_supertest.md "Route-level integration tests exercise the whole pipeline"; security/29_owasp_top_10.md "Treating OWASP as a one-time exercise". The one '## Take-Home Exercise Brief' (process-soft-skills/84_technical_interview_design.md) is a template the reader gives to *candidates*. The 88 files matching 'checklist' are checklists to read, not to run. Transfer requires varied practice in a novel context; there is none, so the ceiling is recognition-level knowledge.

**Affected scope**

412 / 412 lessons; all 23 courses

### 3. [CRITICAL] Bracket-before-id sorting in the UI destroys the authored teaching sequence in 20 of 23 courses, with displacements up to 37 positions.

**Evidence**

modules/course_content/ui/CourseOverviewPage.tsx: `BRACKET_ORDER.filter(...).map(bracket => items.filter(i => i.bracket === bracket).sort((a,b) => a.id - b.id))`; same in course_content.service.ts getSidebarNavGroups (`bracketRank(a.bracket) - bracketRank(b.bracket) || a.id - b.id`). Result: business-finance-solo-ops opens with lesson 352 'Ethical Growth: What Not to Do' (authored 37th) instead of 316 'Cash Flow and Runway', which every later lesson depends on. framework-deep-dives renders 396, 403, 413, 397, 398... — Express lesson 401 (SSE/Socket.io) lands 27th, after every Electron lesson, severed from the Express 396→402 build sequence. ai-llm-engineering shows 140 'AI/LLM Integration' (the overview) 14th of 21.

**Affected scope**

20 / 23 courses; 397 of 412 lessons

### 4. [CRITICAL] The uniform ~1000-word template inverts the relationship between topic size and treatment depth, and the experience bracket has literally no effect on it.

**Evidence**

content/courses/fundamentals-tools/121_sql_fundamentals.md = 552 words for joins + normalization 1NF–3NF + NULL three-valued logic + transactions. content/courses/security/34_timing_attack_constant_time_comparison.md = 1043 words for one function and one Node API — and the lesson itself concedes "timing attacks on hashed token comparisons are largely theoretical for modern applications". content/courses/database-advanced/41_postgresql_mvcc_vacuum_bloat_isolation.md = 1075 words for xmin/xmax, dead tuples, autovacuum tuning, XID wraparound and four isolation levels. Median words by bracket: 0-1 = 606, 1-3 = 1020, 3-7 = 1039, 7-10 = 1025 — the three adult brackets are within 2% of each other.

**Affected scope**

412 / 412; most acute in the 15 lessons whose titles list 3+ major subtopics

### 5. [CRITICAL] The worked-example effect is half-implemented: every code example is a finished, correct solution and there is not one completion problem or faded example in the corpus.

**Evidence**

338 of 412 files have exactly one code fence, and it is always a complete solution — e.g. framework-deep-dives/399_express_centralized_error_handling.md ships the entire working `errorHandler`, `AppError`, service and route. Only 7 files contain any `TODO`/`_____`/'fill in' marker. 'Example Code' is also the *smallest* substantive section: median 108 whitespace tokens vs 302 for 'What It Is' and 183 for 'Key Concepts' — the median lesson is 58% exposition (485 of 832 section words) and 13% example. Solved-examples-only produces recognition; Sweller/Renkl fading requires the last steps be handed to the learner.

**Affected scope**

338 / 412 with a single solved fence; 405 / 412 with no completion problem

### 6. [MAJOR] 'Key Concepts' is a flat 8-bullet dump of mutually-interacting novel elements — a working-memory overload presented as a summary, with no hierarchy, segmentation, or 'you only need the first three today'.

**Evidence**

Median 8 bullets, max 10, 58% of lessons at ≥8. content/courses/database-advanced/41_postgresql_mvcc_vacuum_bloat_isolation.md lists MVCC, dead tuple, VACUUM, autovacuum, bloat, Transaction ID Wraparound, READ COMMITTED, REPEATABLE READ and SERIALIZABLE as nine coordinate peers. content/courses/security/34_timing_attack_constant_time_comparison.md runs to 8, ending on '**Practical risk calibration**' — the bullet that should have *framed* the whole lesson, buried last. High element interactivity + zero segmentation cue means the reader parses it as a glossary and retains the primacy/recency items.

**Affected scope**

239 / 412 lessons (≥8 bullets); all 412 have the section

### 7. [MAJOR] 1,771 expert-identified failure patterns — the corpus's best pedagogical asset — are delivered as an answer key with no question, producing no prediction error and therefore no correction.

**Evidence**

framework-deep-dives/399_express_centralized_error_handling.md: "**Registering `errorHandler` before other middleware or routers** — Express only routes an error to handlers registered *after* the point of failure; putting it first means it never fires." That is a ready-made diagnosis item stated as its own solution. Same shape in all 412 files (median 4 bullets, 1,771 total). Error-based learning requires the learner to commit to the wrong answer first; reading 'don't do X' generates no signal. This is the cheapest high-leverage rewrite in the corpus — the distractors already exist.

**Affected scope**

412 / 412 lessons; 1,771 bullets

### 8. [MAJOR] Prerequisites exist as prose and as 14 plain-text '#N' references, but every one points into a different course folder, none is a link, and there is no search or ID index — so the only sequencing signal in the corpus is a dead end.

**Evidence**

content/courses/fundamentals-tools/121_sql_fundamentals.md (bracket 0-1) opens: "Everything from N+1 Query Problem (#16) to PostgreSQL MVCC (#41) assumes fluency with plain SQL" and later "read the query (see #18)". Resolved: #16 and #18 → database-caching-performance, #41 → database-advanced, #13 → distributed-systems-api-design, #69 → architecture-design-patterns-testing. All 14 'see #N' refs cross a course boundary; the reader has no route to them (no search component anywhere in app/ or modules/). Only 5 of 412 files contain 'prerequisit' at all, and `ManifestItem` in course_content.types.ts has no prerequisite field.

**Affected scope**

14 explicit refs + ~113 bare #N mentions; sequencing absent for all 412

### 9. [MAJOR] No spacing or interleaving mechanism, and no way to return — despite the corpus already containing dense natural recurrence that would make distributed practice nearly free.

**Evidence**

'retry' appears in 35 lessons across 14 courses, 'rate limit' in 33 across 14, 'JWT' in 32 across 13, 'idempoten' in 27 across 12 — none cross-linked or surfaced. LessonPage.tsx renders six cards and stops: no next/prev, no 'you saw this in', no review. grep 'localStorage' across the repo returns only ThemeToggle.tsx and libs/utils/isBrowser.ts — no progress state, even though docs/adr/0001-no-backend-markdown-content.md §3 explicitly planned it: "Phase 2's progress tracking will live in `localStorage` (Zustand + persist)". Every lesson is a terminal node with no second encounter.

**Affected scope**

412 / 412 lessons; all 23 courses

### 10. [MAJOR] The 6-section shape is hard-coded in three files, so the pedagogical ceiling is structural — an unrecognized `##` heading is silently swallowed into the previous card rather than becoming a section.

**Evidence**

course_content.types.ts `LessonSections` is a fixed 6-key record; course_content.parser.ts `HEADING_RULES` maps only those prefixes and comments "an unrecognized `##` line ... is treated as ordinary content of whichever section is currently open"; LessonPage.tsx hardcodes six `<LessonSectionCard>` calls. Verified consequence: process-soft-skills/76_rfc_process.md lines 33–68 (`## Summary`, `## Problem / Motivation`, `## Alternatives Considered`, `## Open Questions`) render as h2s *inside* the Example Code card. Heading census across 412 files: What It Is 412, Key Concepts 412, Common Mistakes 412, Further Reading 412 — 100% adherence, zero lessons with an added pedagogical section. Relatedly, 271 of 412 lessons contain no http link at all and only 347 of 1,246 Further Reading bullets (28%) are clickable, so the one section that could offload elaboration is a bibliography, not a path.

**Affected scope**

412 / 412; blocks any new section until 3 code files change
