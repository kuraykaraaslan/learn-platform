# Proposals 04 — Content operations

> Verbatim output of the `ideate:content-ops` agent. It received all six audit reports as input.

## Lens

CONTENT-OPS. The corpus's problem is not that 412 lessons are thin — it is that nothing in the repo can *tell* you which lessons are thin, nothing prevents a new batch from being thin in the same way, and nothing stops a fabricated citation or an uncompilable snippet from shipping. Enrichment at this scale is therefore a build-system problem before it is a writing problem. The operating system I propose has one spine (Zod-validated frontmatter, from which manifests are generated instead of hand-maintained), one gate (`content:lint` + `verify:code` + `sources:check` in CI, failing the Vercel build), one standard (six hand-written gold lessons + a rubric whose dimensions are pass/fail on artifacts, not on prose), and one queue (harm x entry-point x concept-centrality, batched by concept cluster across courses, never by course). Everything AI-authored lands as `status: drafted` and stays unbadged until a human bumps `review.at` — the body_sha check makes "an LLM edited it and nobody read it" a build failure. Three facts about this specific repo shape the plan: (1) the parser drops every line before the first recognized `##` heading (`if (currentField) buffer.push(line)`), so YAML frontmatter can land on all 412 files in one commit with literally zero render change — verified; (2) fenced code inside `## Common Mistakes` already parses and renders correctly today, so the single highest-value pedagogical addition (show the failure as runnable code) needs no parser change at all; (3) there are currently zero test files in the repo though vitest is wired — so a 412-lesson parse-snapshot test is the cheap safety net that makes every mechanical pass safe. WHAT NOT TO ENRICH: do not lengthen the 0-1 bracket lessons (median 606 words is right for them; the 1030-word uniformity is the disease, not the cure); do not add code to the 230 business "Example" sections — they need a *filled-in worked instance with reconciling numbers*, not a fence; do not chase the 894 unlinkable Further Reading bullets — delete the ~40 unverifiable ones outright rather than rescue them, since one caught fabrication costs more than forty missing sources; do not add quizzes/progress/search as a first move (they make an unfixed corpus more navigable, not more trustworthy); do not enrich `framework-deep-dives` beyond a one-sentence house-style framing (35 lessons of one shop's standards are *good* precisely because they are opinionated and internally consistent — genericizing them destroys their only advantage); and do not touch the 4 memo-lessons (100, 114, 85, 98) with generation — cut or rewrite by hand. WHERE HUMAN WRITING MUST BEAT GENERATION: anything jurisdictional (Turkish tax/e-Fatura/SGK/genç girişimci istisnası — the reason 319 and 230 are the corpus's only actively dangerous lessons); every security mitigation (34's HMAC-then-compare fix cannot be safely LLM-drafted, since the current wrong answer is exactly what a model would produce); every number a reader will quote in a negotiation (the invented "70%+ close rate" is the archetypal failure); the six gold lessons; and the *ambiguous-outcome* paragraph of each mechanism lesson (timeout-but-committed, compensate-step-fails) — that is the paragraph that separates this product from a blog, and it is written from scar tissue, not from a prompt.

## Proposals (8)

### 04.1 The Frontmatter Spine · effort M

**Zod-validated YAML frontmatter on all 412 files — invisible to the current parser, so it ships in one commit with a byte-identical render — and the 23 manifest.json files become generated artifacts instead of a second hand-maintained copy of the truth.**

**What changes**

NEW `modules/course_content/course_content.frontmatter.ts` exporting `LessonFrontmatterSchema` (Zod, `.strict()`), plus `gray-matter` in package.json. `course_content.parser.ts`: `parseLessonMarkdown` returns `{ title, frontmatter, sections }`; the fence branch is fixed from `buffer.push(line)` to `if (currentField) buffer.push(line)` (today a ``` before the first `##` would flip `inFence`, swallow every later heading and collapse the whole lesson into one section — currently 0 files trigger it, which is exactly why it should be nailed down before 412 files gain a header). `course_content.types.ts`: `Lesson = ManifestItem & { frontmatter: LessonFrontmatter; sections: LessonSections }`; `ManifestItem` untouched so `CourseOverviewPage` / `getSidebarNavGroups` keep compiling. NEW `scripts/build-manifests.ts` regenerates each `content/courses/<slug>/manifest.json` from that directory's frontmatter; NEW `scripts/parse-snapshot.ts` writes a SHA per lesson over the six rendered HTML strings into `content/_reports/parse-snapshot.json`. NEW `modules/course_content/course_content.parser.test.ts` (the repo's first test — vitest is installed, zero test files exist) asserting all 412 snapshots are unchanged and that a stray fence in an intro no longer collapses a lesson. `npm run content:check` fails CI when a committed manifest differs from the generated one. New keys: `archetype`, `status`, `teaches[]`, `requires[]`, `unlocks[]`, `sources[]`, `code`, `volatility`, `review`.

**Example snippet**

```
# content/courses/distributed-systems-api-design/07_idempotency_key_pattern.md
---
id: 7
title: Idempotency Key Pattern
bracket: "3-7"
category: Distributed Systems & API Design
archetype: mechanism          # mechanism | house-style | template | jurisdictional | process
status: needs-work            # needs-work | drafted | reviewed | verified
teaches: [idempotency-key, at-least-once-delivery, unique-constraint-dedup]
requires: []
unlocks:
  - distributed-systems-api-design/saga-pattern      # 03's CHARGE_CARD is unsafe without this
  - ai-llm-engineering/mcp-server-auth-error-idempotency
sources: [stripe-idempotent-requests, ietf-idempotency-key-header, aws-sqs-reprocessing-dlq]
code:
  verify: content/_verify/distributed-systems-api-design/07
  status: failing            # `key String @unique` is global, not per-caller
volatility: stable
review: { by: null, at: null, body_sha: "8f1c2a94" }
---

# 7. Idempotency Key Pattern

## What It Is
...unchanged...

// modules/course_content/course_content.frontmatter.ts
export const LessonFrontmatterSchema = z.object({
  id: z.number().int().positive(),
  bracket: z.enum(['0-1', '1-3', '3-7', '7-10']),
  archetype: z.enum(['mechanism', 'house-style', 'template', 'jurisdictional', 'process']),
  status: z.enum(['needs-work', 'drafted', 'reviewed', 'verified']).default('needs-work'),
  teaches: z.array(ConceptSlug).min(1),
  requires: z.array(LessonRef).default([]),   // "<course-slug>/<lesson-slug>", resolved at build
  sources: z.array(SourceSlug).default([]),   // must exist in content/_sources/sources.yml
  review: z.object({ by: z.string().nullable(), at: z.string().date().nullable(), body_sha: z.string() }),
}).strict();
```

**Why it makes them feel knowledgeable**

`requires`/`unlocks` are what convert 412 terminal nodes into a graph. Today the saga lesson (03) warns 'if chargeCard is not idempotent, you charge twice' while lesson 07 builds that exact mechanism four files away with no route between them — so the reader acquires two labels instead of one model. Knowing where a piece sits (what it assumes, what it makes possible) is the difference between recalling a term and reasoning from it. Secondarily, generated manifests kill sequence drift, which is the precondition for the authored teaching order to survive at all.

**Risk**

A 412-file mechanical edit against a parser with no tests. Mitigation is strictly ordered: land the snapshot test FIRST on the current corpus, then the parser change (snapshots must not move), then the frontmatter (snapshots must not move again). Second risk is schema over-reach — every key added now is a key 412 files must eventually fill, so ship only the nine above and add fields per wave.

### 04.2 content:lint — Fourteen Rules and One Waiver File · effort M

**A rule pack that turns every finding in the six audits into a build failure, each rule shipping as a warning for one wave before it is promoted to an error.**

**What changes**

NEW `scripts/content-lint/rules/*.ts`, each exporting `{ id, severity, check(file: LessonFile): Finding[] }`, run over 412 lessons + 23 manifests by `npm run content:lint`, wired ahead of `next build` in vercel.json. NEW `content/_waivers.yml` (rule id + file + reason + owner + expiry — an expired waiver fails). Rules: `shape/six-sections` (order + presence; catches process-soft-skills/76_rfc_process.md, whose `## Summary` / `## Problem / Motivation` / `## Alternatives Considered` are silently swallowed into the Example Code card); `shape/template-heading` (the 9 `## Example / Template` files must declare `archetype: template`, letting LessonPage stop hardcoding the card title "Example Code"); `voice/deny` (/kuray|avantleap|KUIreact|Code_Structure_Rules|next-boilerplate|74K|com\.kuray|@\/(libs|modules|stores)\//); `voice/asserted-second-person` (second person inside a present-tense stative declarative with no if/when/unless/suppose wrapper — the Class B/C classifier, target 0); `sources/bare-domain` (parenthesised domain with no scheme — verified against this repo's own remark-gfm pipeline to render as grey text, 150 bullets); `sources/unresolved-slug`; `sources/quota-signature` (course-level warning when Further Reading bullet counts have zero variance at 3 — the 390-file tell); `sources/disclaimer-not-a-source` (the 40 finance disclaimers move to a `disclaimer: finance` frontmatter key rendered as its own UI band, freeing the slot); `code/fence-lang` (JSX in a `typescript` fence — 19 files; `md`/`markdown` fence inside `archetype: template` — 226 files currently rendering `##` and `**` as monospace and 66 tables as pipe soup); `code/unverified` (a `mechanism` lesson with a TS fence and no `verify` target); `template/unfilled-placeholder`; `jurisdiction/undeclared`; `review/stale-hash`; `xref/plain-text-ref` (the 14 `see #N` and ~113 bare `#NN` / `Lesson NN` mentions must become resolved links or be deleted).

**Example snippet**

````
$ npm run content:lint

content/courses/business-finance-solo-ops/333_retainers_vs_maintenance.md
  55:3  error  sources/fabricated-shape        "*Recurring Revenue* — Roman Stanek and John Warrillow" — two authors welded to a title with no ledger slug
  57:3  error  sources/dead-internal-ref       Offer_Library is not a file in this repo (also 331, 332, 336)
  59:3  warn   sources/disclaimer-not-a-source move to frontmatter `disclaimer: finance`
  --> 0 of 3 Further Reading bullets are sources

content/courses/contracts-pricing-legal/205_hourly_and_day_rate_engagements.md
  27:1  error  code/fence-lang                 ```markdown inside archetype:template renders ** and ## as monospace
  29:12 error  template/unfilled-placeholder   "**Rate:** $[X]/hour or $[Y]/day" — the one number this lesson exists to give
  36:1  warn   jurisdiction/undeclared         net-7 terms, no `jurisdictions:` key, audience is TR

content/courses/security/33_ssrf_server_side_request_forgery.md
  135:1 error  voice/asserted-second-person    "your inbound IP detection already handles this correctly in `UserSessionNextService`"
  12:1  error  code/unverified                 archetype:mechanism, 100-line TS fence, no verify target

39 errors, 118 warnings across 412 lessons (7 waived) — build failed
````

**Why it makes them feel knowledgeable**

Trust in a corpus is global, not per-lesson: a reader who hits one unfillable template, one dead reference, or one 'you already do this correctly' about a class they have never seen retroactively discounts the 411 lessons they already read, including the good ones. Lint converts consistency from an authoring virtue that decays across batches into a build invariant that cannot decay. The xref and fence-lang rules additionally make the corpus navigable and its 230 templates legible, which is a direct comprehension gain, not just hygiene.

**Risk**

Over-linting produces waiver spam and authors routing around the gate. Discipline: a rule ships at `warn` and is promoted to `error` only after one wave shows a false-positive rate under 2%. `voice/asserted-second-person` is the dangerous one — 93.6% of the corpus's 2,784 you/your tokens are legitimate instructional address, so a blunt version of this rule would wreck the teaching voice.

### 04.3 Six Gold Standards and a Falsifiable Rubric · effort L

**Hand-write one perfect lesson per archetype, then score all 412 against a rubric whose dimensions are pass/fail on artifacts rather than on prose — so a score cannot be talked up by adding words.**

**What changes**

NEW `content/_standards/` holding six gold lessons (kept out of `content/courses/`, so they are not published and cannot be graded by their own rubric) plus `rubric.yml`. Golds: mechanism = 07 idempotency taken to gold by hand; house-style = 399 Express error handling, already ~80% there (its course is the only one at a 100% Further-Reading link rate and its Common Mistakes already names the wrong way); template = a rebuilt 205 hourly/day-rate with real TR-and-EU numbers; jurisdictional = a rewritten 319 tax readiness; process = 76 RFC process once its swallowed sub-headings are fixed; ai-volatile = 153 model selection. NEW `scripts/score.ts` runs the mechanical half of the rubric locally and sends only the ambiguous dimensions to one LLM grader call with the archetype's gold lesson in context as the 3-point anchor; writes `content/_reports/scores.json` and stamps `status` back into frontmatter. Eight dimensions, each with mechanical evidence: 1 executable proof, 2 failure shown as code, 3 quantified trade-off with a stated measurement method, 4 operational tell, 5 ambiguous-outcome case, 6 sourced claims, 7 reader address, 8 concept follow-through.

**Example snippet**

```
# content/_standards/rubric.yml (excerpt)
dim8_concept_follow_through:
  question: "Is every primitive named in Key Concepts actually USED later in the lesson?"
  check: mechanical      # a bold-lead term from Key Concepts must recur outside that section
  0: "named once, never used again"
  2: "used in prose"
  3: "the reader watches it decide something — a query, a trace, a diff"

# content/_reports/scores.json (excerpt)
"database-advanced/41_postgresql_mvcc_vacuum_bloat_isolation.md": {
  "archetype": "mechanism", "total": 9,
  "dim1_executable_proof":       { "score": 0, "evidence": "IsolationLevel imported as a value from typeorm — TS2693" },
  "dim2_failure_as_code":        { "score": 0, "evidence": "0 fences in Common Mistakes (corpus-wide: 0/412)" },
  "dim3_quantified":             { "score": 0, "evidence": "'significant performance cost' — no number, no method" },
  "dim4_operational_tell":       { "score": 0, "evidence": "no xmin horizon, no pg_stat_activity, no lock_timeout" },
  "dim5_ambiguous_outcome":      { "score": 0, "evidence": "REPEATABLE READ + pessimistic_write shown with no 40001 retry" },
  "dim6_sourced":                { "score": 2, "evidence": "3 bullets, 2 URLs, 0 inline citations" },
  "dim7_reader_address":         { "score": 3, "evidence": "no Class B/C hits" },
  "dim8_concept_follow_through": { "score": 1, "evidence": "'xmin'/'xmax' defined in Key Concepts, 0 later occurrences" },
  "tier": 1, "queue_rank": 6
}
```

**Why it makes them feel knowledgeable**

The eight dimensions ARE the operational definition of 'kendini cidden bilgi sahibi hissetsin' — they name the specific things a reader can do after a good lesson and cannot do after a glossary: run it, recognise its failure, defend the trade-off with a number, spot it in a log, survive the ambiguous case, follow the claim to its source, and use the primitives rather than the labels. And authors imitate examples far more reliably than they follow specs: a gold lesson per archetype is what stops every future batch from regressing to 1,030 words and one decorative fence.

**Risk**

A rubric becomes a checklist and a checklist becomes filler. The guard is that dims 1, 2 and 5 are pass/fail on artifacts (a passing CI run, a fence inside Common Mistakes, a named ambiguous case) and cannot be satisfied by prose. Second risk: six hand-written gold lessons is genuinely a week of the owner's own writing, and delegating it defeats the purpose.

### 04.4 content/_verify — the Examples Become a Repo That Runs · effort XL

**Every mechanism lesson's snippet is extracted into a real workspace that CI typechecks and tests, and the actual pass/fail output is injected back into the lesson between machine-owned markers — including a failing run of the wrong version.**

**What changes**

NEW npm workspace root `content/_verify/<course-slug>/<id>/` with a real package.json per lesson cluster (typeorm, prisma, express, @anthropic-ai/sdk installed for real). Fence meta gains `file=` and `verify`. NEW `scripts/verify-code.ts` extracts fences to files, runs `tsc --noEmit` + `vitest run` for changed dirs only, rewrites the lesson between `<!-- run:begin -->` / `<!-- run:end -->` HTML comments with the real terminal output, and stamps `code.status` into frontmatter. NEW `.github/workflows/verify-code.yml`. UI: `LessonSectionCard` accepts an optional `badge`; LessonPage passes it only when `code.status === 'passing'`. NO PARSER CHANGE IS NEEDED for the biggest win here: a fenced block inside `## Common Mistakes` already parses and renders correctly today (the fence tracker is section-agnostic), so the 1,771 expert-identified failure patterns — currently an answer key with no question — can each gain a six-line broken snippet plus its symptom, in place, this week. Corpus-wide this closes 'Common Mistakes contains 0 code fences in all 412 files' and '0 files contain "you should see"'.

**Example snippet**

````
// content/_verify/security/33/safe-fetch.test.ts — extracted from lesson 33, run by CI
import { describe, it, expect } from 'vitest';
import { isPrivateIP, safeFetch } from './safe-fetch';

it('blocks the cloud metadata service',      () => expect(isPrivateIP('169.254.169.254')).toBe(true));
it('blocks IPv4-mapped IPv6 loopback',       () => expect(isPrivateIP('::ffff:127.0.0.1')).toBe(true));
it('blocks decimal-encoded loopback', async () => await expect(safeFetch('http://2130706433/')).rejects.toThrow(/SSRF/));
it('does not block a public host containing "fd"', () => expect(isPrivateIP('64.233.fd.1')).toBe(false));

<!-- written back into 33_ssrf_server_side_request_forgery.md by scripts/verify-code.ts -->
## Common Mistakes
- **An unanchored alternation in the blocklist.** `/^fc|fd/` parses as `(^fc)|(fd)` — the anchor binds to
  the first branch only, so it over-blocks any address containing "fd" and still misses the two textbook
  bypasses. Run the shipped version against the four cases above:

<!-- run:begin verify=security/33 rev=broken -->
```text
$ npx vitest run safe-fetch.test.ts
 ✓ blocks the cloud metadata service
 × blocks IPv4-mapped IPv6 loopback              → ::ffff:127.0.0.1 matched no pattern, request allowed
 × blocks decimal-encoded loopback               → threw ENOTFOUND, not SSRF: 2130706433 was never parsed as an IP
 × does not block a public host containing "fd"  → returned true; /fd/ matched mid-string
 1 passed | 3 failed
```
<!-- run:end -->

The fix is three lines — anchor each branch, normalise with `net.isIP` after `URL` parsing, and reject an
all-digits hostname — and the same command then reports `4 passed`.
````

**Why it makes them feel knowledgeable**

This is the four-beat unit (broken version → symptom → fix → observable proof) and it is the only enrichment here that produces prediction error, which is the mechanism that actually writes something into memory. A reader who has watched an SSRF blocklist let `::ffff:127.0.0.1` through, and watched the anchored version turn red-to-green, recognises that class of bug in a code review five years later. It is also self-policing in a way prose never is: if a lesson lies about its own code, CI goes red.

**Risk**

Highest cost in the plan, and it only applies to the ~175 technical lessons — forcing a `_verify` dir onto business lessons produces theater. CI time is managed by per-cluster workspaces and changed-path filters. The real hazard is verified code drifting from the prose around it, so the `run:begin` markers must be machine-owned — a human editing inside them is a lint error.

### 04.5 One Source Ledger, Cited by Slug · effort L

**Replace 1,246 free-text bullets with `[[src:slug]]` references into a single Zod-validated ledger where every row carries a resolving URL, a human verifier, and one sentence saying what to take from it — making fabrication structurally impossible.**

**What changes**

NEW `content/_sources/sources.yml` (~450 unique works after dedupe — *Influence* is cited 6x, *Obviously Awesome* 6x, *They Ask You Answer* 6x; one row each). NEW `modules/course_content/remark-source-refs.ts`, inserted into `course_content.markdown.ts` between `remarkGfm` and `remarkRehype`, expanding `[[src:slug]]` into a link node with the `why` line as its title attribute; an unresolved slug throws at build time. `sources[]` in frontmatter is validated against the ledger keys. NEW `scripts/sources-check.ts` (HEAD every URL, follow one redirect, record `checked_at`, flag 404/moved) + `.github/workflows/sources-freshness.yml` weekly, opening one issue — this catches the ~17 already-dead URLs including the Cognitect ADR link in 75_writing_adrs.md and the four retired `nextjs.org/docs/app/building-your-application/...` paths. Lint rule `sources/prefer-primary` warns when a `kind: vendor-doc` row is cited where a `kind: spec` row exists for the same concept (gdpr.eu → EUR-Lex; Atlassian → PMI). Seeding is scripted from the 352 existing URL-bearing bullets; the remaining 894 are triaged by hand, with the ~40 unverifiable ones deleted rather than rescued.

**Example snippet**

```
# content/_sources/sources.yml
stripe-idempotent-requests:
  kind: primary-doc
  title: "Idempotent requests"
  publisher: Stripe
  url: https://docs.stripe.com/api/idempotent_requests
  why: "States the two rules this lesson's implementation breaks: keys are scoped to the API key that created them, and a key replayed with a different request body is rejected rather than served from cache."
  checked_at: 2026-08-27
  checked_by: kuray
ietf-idempotency-key-header:
  kind: spec
  title: "The Idempotency-Key HTTP Header Field"
  url: https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/
  why: "Defines the header name, the 409-vs-422 semantics, and the request-fingerprint requirement — read §3 before exposing a public API."
  checked_at: 2026-08-27
  checked_by: kuray

# 07_idempotency_key_pattern.md — inline, on the load-bearing sentence
Scope the key to the caller, never globally: a `key String @unique` column lets any client that
replays another tenant's key receive that tenant's cached response body
([[src:stripe-idempotent-requests]]). Stripe additionally fingerprints the request body and returns
an error rather than the cached result when a key is reused with different parameters
([[src:ietf-idempotency-key-header]], §3).

## Further Reading
- [[src:stripe-idempotent-requests]] — start here; the scoping rule this lesson simplifies.
- [[src:ietf-idempotency-key-header]] — §3 only, if you expose a public API.
- [[src:aws-sqs-reprocessing-dlq]] — the consumer-side argument, transferable to BullMQ.
```

**Why it makes them feel knowledgeable**

A bibliography tells the reader that depth exists somewhere and gives no route to it — 68% of lessons currently offer no followable source at all. A ledger row's `why` line turns each reference into a specific next action ('§3 only, if you expose a public API'), which is what makes elaboration actually happen rather than being nominally available. And because a citation must resolve to a ledger key that a named human dated, 'The Business of Software — Michael Feathers and Patrick McKenzie' can never enter the corpus — which matters because one caught fabrication invalidates the reader's trust in the other 1,245 bullets, and that trust is the whole product.

**Risk**

The ledger is a chokepoint: 894 URL-less bullets need human triage, and that is exactly where the fabrications hide, so it cannot be delegated to generation (a model asked to 'find the URL for this citation' will cheerfully invent one for a book that does not exist). Budget it as a deletion pass first and a research pass second.

### 04.6 The First 40: a Computed Queue, Batched by Concept · effort S

**A scored priority queue — harm x entry-point x concept-centrality — plus a batching rule that groups lessons by recurring concept across courses rather than by course, because the recurrence is what makes cross-links and terminology consistent.**

**What changes**

NEW `scripts/triage.ts` reading `content/_reports/scores.json` + lint findings, writing `content/_reports/queue.md` and stamping `tier` into frontmatter. Score = 3x harm (ships a wrong security mitigation, uncompilable code, or wrong-jurisdiction legal advice) + 2x entry-point (the lowest-id lesson of each course — meaningless until the two-line sort fix in `CourseOverviewPage.tsx` and `getSidebarNavGroups`, so that ships first) + centrality (count of other lessons whose `teaches` intersects: retry 35, rate-limit 33, JWT 32, idempotency 27) + audit-residue flag. Batching rule enforced by a CI check on PR contents: one concept cluster, 8-12 lessons max, one archetype, one reviewer. Wave 1 (40) = 12 actively harmful (33 SSRF, 34 timing, 32 JWT, 07 idempotency, 03 saga, 41 MVCC, 43 zero-downtime migration, 410 Spring JPA duplicate method, 53 OTel PII-in-span, 230 contractor classification, 319 tax readiness, 216 payment gates) + 4 not-lessons (100, 114, 85, 98 — cut or hand-rewrite) + 23 course entry points + the 6 golds (overlapping). Wave 2 = the five highest-centrality clusters (~60). Wave 3 = the tail, LLM-drafted against gold, ADDITIVE ONLY (add sources, add a failure snippet, add the ambiguous case — never rewrite prose already scoring 2+), spot-reviewed 1-in-4.

**Example snippet**

```
# content/_reports/queue.md — generated, do not edit

## Wave 1 · cluster: retry-and-exactly-once (5 lessons, 1 PR, reviewer: kuray)
| rank | lesson | score | why it ranks here |
|---|---|---|---|
| 1  | distributed-systems-api-design/07_idempotency_key_pattern      | 34 | harm: global `@unique` key serves one caller's cached response to another · centrality 27 · becomes the mechanism gold |
| 2  | distributed-systems-api-design/03_saga_pattern                 | 31 | harm: bare `catch` deletes the tenant on a Stripe timeout and never refunds · `SEND_WELCOME_EMAIL` has no case arm |
| 4  | distributed-systems-api-design/04_circuit_breaker_bulkhead_retry | 22 | centrality 35 · owns 'jitter' (2 corpus hits) and 'Retry-After' (1) |
| 9  | ai-llm-engineering/163_mcp_server_auth_error_idempotency       | 18 | same concept, different course — terminology gets decided once, here |
| 14 | frontend-performance-scaling/27_job_queue_bullmq               | 15 | at-least-once consumer; also carries a Class C hit ('your `libs/redis/bullmq.ts` already has it') |

## Wave 1 · cluster: entry points (23 lessons, 3 PRs)
blocked-by: sort fix (CourseOverviewPage.tsx + getSidebarNavGroups). Until it lands,
business-finance-solo-ops opens on 352 'Ethical Growth: What Not to Do' (authored 37th)
instead of 316 'Cash Flow and Runway', so 'entry point' is not yet a real column.
```

**Why it makes them feel knowledgeable**

Batching by concept rather than by course is the load-bearing choice: 'retry' appears in 35 lessons across 14 courses, so a course-shaped batch decides the same terminology 14 times, differently, and authors zero cross-links. A concept-shaped batch produces one vocabulary, one worked mechanism, and bidirectional `requires`/`unlocks` edges in a single sitting — which is exactly the spaced second encounter the corpus currently has none of. And prioritising by harm x entry point means the first two lessons a reader opens in any course are enriched ones, which is where their judgment of the whole product is formed.

**Risk**

The queue inherits the scores' errors, so a bad rubric ranks the wrong 40 — cheap correction is to hand-audit the top 10 rows before Wave 1 starts. The larger risk is Wave 3: 'additive only' must be enforced by a diff check (no deletion of existing prose lines in a Wave 3 PR), or the tail gets quietly rewritten into uniform AI voice, which is precisely the failure the owner cannot afford.

### 04.7 Provenance and the Human Gate · effort M

**Every lesson records which prompt version and model drafted it, which human reviewed it, and a hash of its own body — so 'an LLM edited this and nobody read it' becomes a build failure, and a bad prompt can be re-run over exactly the batch it poisoned.**

**What changes**

Frontmatter gains `provenance: { authored, prompt, model, reviewed_by, reviewed_at }` and `review.body_sha`. NEW `docs/content/PROMPTS/<archetype>@vN.md` — versioned authoring prompts that embed the archetype's gold lesson verbatim and the rubric, so 'the prompt' is a reviewable artifact under git rather than chat history. NEW `docs/content/STYLE.md` (the voice standard: second person stays, but only inside a conditional/imperative/hypothetical frame, never a present-tense assertion about the reader's system; every concrete path or class name belongs to a named per-course fictional example; one placeholder registry corpus-wide — the corpus currently mixes 29 example.com, 13 yourusername, 5 meridianretail.example, 5 acme). NEW `.github/pull_request_template.md` with gates that cannot be satisfied by reading. NEW lint rule `review/stale-hash`: body changed and `reviewed_at` not bumped = error. NEW `docs/content/HUMAN_ONLY.md` listing what generation may never touch (TR jurisdictional, security mitigations, any quotable number, the six golds, the ambiguous-outcome paragraph), enforced by a lint rule rejecting `provenance.authored: llm-drafted` on those files.

**Example snippet**

```
# content/courses/security/34_timing_attack_constant_time_comparison.md
---
id: 34
archetype: mechanism
status: verified
provenance:
  authored: human-only          # HUMAN_ONLY.md §2 — security mitigations
  prompt: null
  reviewed_by: kuray
  reviewed_at: 2026-09-04
review: { body_sha: "c41a77e2" }
code: { verify: content/_verify/security/34, status: passing }
changelog:
  - 2026-09-04: "Removed the `timingSafeEqual(bufA, bufA)` decoy and the Common Mistakes bullet that
      codified it — comparing a 10-byte buffer to itself is measurably faster than 64 bytes, so length
      still leaks. Replaced with HMAC-both-sides-to-fixed-length before comparison; added the timing
      histogram of the broken version to Common Mistakes."
---

# .github/pull_request_template.md (content PRs)
- [ ] One concept cluster, <= 12 lessons (CI enforces)
- [ ] `npm run content:lint` clean, or a waiver row with an owner and an expiry
- [ ] For each mechanism lesson: `npm run verify:code -- <lesson>` — the pasted output is the output I actually got
- [ ] For each new source: I opened the URL, and the `why:` line describes what I read there
- [ ] No sentence claims the reader has, does, or already did anything
- [ ] reviewed_by / reviewed_at bumped (CI rejects a changed body_sha without it)
```

**Why it makes them feel knowledgeable**

Two mechanisms. First, the reader cannot audit 412 lessons, so the corpus must audit itself — and a mitigation the reader can see was human-reviewed and CI-verified is one they will actually carry into an argument at work, which is the application event where learning consolidates. Second, the anti-slop effect is measurable: reading five business lessons in a row currently makes the generation template visible (identical 3-bullet quota, identical closing disclaimer, a recycled pool of seven books), and once a reader notices the template they retroactively discount everything they have already read. Versioned prompts plus provenance are what let the owner detect and re-run a poisoned batch instead of re-reading the corpus.

**Risk**

Process weight. If the gate costs more than the writing, it gets bypassed — so it applies only to the `status: verified` transition; drafts flow freely and are simply not badged. `body_sha` also needs a canonicalisation rule (strip trailing whitespace, exclude frontmatter) or formatting-only commits will fire false alarms.

### 04.8 The Freshness Contract · effort S

**Per-lesson volatility drives a review-by date, a single monthly staleness issue, and a visible 'last verified' line that is rendered only when CI actually verified it.**

**What changes**

Frontmatter `volatility: stable | annual | quarterly` → derived `review_by`; `superseded_by` and `deprecates` so a lesson can be retired without breaking a static route (the route stays and renders a banner). NEW `scripts/stale.ts` joining three signals: `review.at + volatility`, `sources.yml.checked_at`, and `code.status`. NEW `.github/workflows/content-freshness.yml` (monthly cron) opening ONE issue listing due lessons, dead URLs and failing verify dirs — a single issue, never one per lesson, or the signal drowns. UI: `LessonPage.tsx` gains a footer line below the six cards, fed strictly from frontmatter and rendered only when `status: verified` and `code.status !== 'failing'` (never hand-settable — a badge that lies is worse than no badge). `CourseOverviewPage` shows a per-course verified count so a buyer sees coverage honestly rather than being told everything is fine.

**Example snippet**

```
# content/courses/ai-llm-engineering/153_model_selection_strategy.md
---
volatility: quarterly        # model ids, prices and context windows move
review: { by: kuray, at: 2026-08-27 }
code: { verify: content/_verify/ai-llm-engineering/153, status: passing }
sources: [anthropic-model-overview, anthropic-pricing]
---

$ npm run content:stale
DUE (quarterly, review_by passed)
  ai-llm-engineering/153_model_selection_strategy       due 2026-11-27
  ai-llm-engineering/152_advanced_rag_chunking...       OVERDUE — prose asserts "Voyage AI is Anthropic's
                                                         recommended embedding partner" (stale since the acquisition)
FAILING VERIFY (suppresses the verified line on 5 lessons)
  ai-llm-engineering/{147,152,153,158,164}              model: 'claude-haiku-4-5-20251001' rejected by the API
                                                         — date-suffixed id; the current id is 'claude-haiku-4-5'
DEAD SOURCE URLS (4)
  process-soft-skills/75_writing_adrs                   cognitect.com/blog/2011/11/15/... → 404

<!-- rendered by LessonPage.tsx, only when status: verified -->
Last verified 27 Aug 2026 by kuray · code run in CI (5 tests) · 3 sources re-checked 27 Aug 2026
```

**Why it makes them feel knowledgeable**

Confidence is calibrated by dating: a reader treats an undated technical claim as background reading and a dated, verified one as something they can act on today — and acting on it is the only thing that converts reading into knowledge. Concretely, five lessons currently hand the reader a model id the API rejects, so their very first attempt to USE the corpus fails, which teaches them the corpus is decorative. The decay job is also what stops the whole enrichment programme from sliding back to its current state six months after launch — the difference between a product and a one-time push.

**Risk**

The verified line is a liability the moment it is wrong, so it must be machine-written only, never hand-set. Second, quarterly volatility on the ~25 AI/LLM lessons is a real recurring maintenance cost the owner is signing up for; if that is not affordable, the honest move is to keep the marker and let the UI show an old verification date rather than to pretend those lessons are stable.
