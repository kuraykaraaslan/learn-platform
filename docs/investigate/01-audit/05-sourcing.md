# Audit 05 — Sourcing & citation integrity

> Verbatim output of the `audit:sourcing` agent from the `enrich-412-lessons` workflow.
> The agent read real lesson files in `content/courses/` and ran its own measurements before answering.

## Dimension

Sourcing, citation integrity, and referential credibility of the 412-lesson corpus

## Verdict

The corpus does not currently meet the bar where a senior engineer would cite it in a design review — not because the sources are bad (most named books, RFCs and specs are real and correctly attributed) but because the citation layer is decorative rather than functional. 279 of 412 lessons (68%) ship with zero clickable source; only 6 inline citations exist in the entire corpus outside code fences, so no individual claim is ever anchored to evidence; and 390 of 412 lessons carry exactly three Further Reading bullets, a quota signature that reads as generated rather than assembled. Worse, a small but fatal set of citations are fabricated or misattributed ("The Business of Software — Michael Feathers and Patrick McKenzie", "*Recurring Revenue* — Roman Stanek and John Warrillow", "OWASP's guidance on sanitizing screenshots"), and a single caught fabrication invalidates the reader's trust in the other 1,240 bullets. The fix is not more references — it is making the existing correct ones followable, verified, and attached to the sentences they support.

## Findings (10: 2 critical, 5 major, 3 minor)

### 1. [CRITICAL] Fabricated and misattributed sources are present — real authors welded onto books they did not write, and invented documents attributed to real standards bodies. One caught fabrication destroys trust in all 1,246 bullets.

**Evidence**

content/courses/process-soft-skills/83_scope_creep_management.md:150 — `**"The Business of Software" — Michael Feathers and Patrick McKenzie (various essays)**` (that book is Michael Cusumano's; Feathers wrote *Working Effectively with Legacy Code*; McKenzie writes at kalzumeus.com). content/courses/business-finance-solo-ops/333_retainers_vs_maintenance.md:55 — `*Recurring Revenue* — Roman Stanek and John Warrillow (concepts drawn from *The Automatic Customer*)` — no such co-authored book exists. content/courses/content-seo-personal-brand/310_visual_proof_screenshots_and_demo_videos.md — `OWASP's guidance on sanitizing screenshots and redacting sensitive data (owasp.org)`; OWASP publishes no such document. content/courses/saas-business-skills/93_ab_test_infrastructure.md:171 — `**"Statistical Significance and the Peeking Problem" — Evan Miller (evanmiller.org)**`; Miller's actual piece is "How Not To Run An A/B Test". content/courses/contracts-pricing-legal/211 — `Ivan Rutar / Free & Fair Contracts resources` (unverifiable).

**Affected scope**

~7 confirmed in a sample of ~180 bullets read; extrapolating, plausibly 15-40 of 1,246 bullets across the corpus — concentrated in the 11 zero-URL business/soft-skill courses where nothing is checkable

### 2. [CRITICAL] 68% of lessons (279 of 412) contain no followable source at all — Further Reading is a list of names a reader cannot act on.

**Evidence**

Measured: 1,246 Further Reading bullets, of which 352 (28.3%) contain an http(s) URL; only 133 distinct lesson files have ≥1 URL in Further Reading, leaving 279 with none. 11 of 23 courses have literally zero URLs anywhere in Further Reading: ai-llm-engineering (0/63 bullets), business-finance-solo-ops (0/121), content-seo-personal-brand (0/129), contracts-pricing-legal (0/93), client-acquisition-sales (0/72), product-technical-strategy (0/75), distributed-systems-api-design (0/54), algorithms-concurrency, career-entrepreneurship, open-source-community, saas-business-skills.

**Affected scope**

279 of 412 lessons

### 3. [MAJOR] The corpus never cites a source where a claim is made. There are exactly 6 inline prose citations in 412 lessons — every reference is deferred to an end-of-lesson list that is not tied to any specific sentence.

**Evidence**

Measured by stripping fenced code and truncating at `## Further Reading`: 6 lines corpus-wide contain a URL in body prose. Two of those six are in one file — content/courses/open-source-community/96_semver_changelog_management.md: `Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).` and `[Semantic Versioning](https://semver.org/spec/v2.0.0.html)`. Meanwhile content/courses/security/33_ssrf_server_side_request_forgery.md asserts `This has been the root cause of several major cloud data breaches including the Capital One breach in 2019` with no citation on the sentence. Only 15 RFC mentions exist across all 412 lessons, 6 of them linked.

**Affected scope**

406 of 412 lessons have no inline citation whatsoever

### 4. [MAJOR] Further Reading is filled to a fixed quota of three bullets, which is the single most legible AI-filler signature in the corpus.

**Evidence**

Bullet-count distribution across all 412 lessons: 390 lessons have exactly 3 bullets, 16 have 4, 6 have 2. Zero lessons have 1, 5, or more. A genuinely researched 43-lesson course and a 2-lesson course both average 3.0 sources per lesson.

**Affected scope**

390 of 412 lessons

### 5. [MAJOR] The corpus's dominant "we gave you a source" gesture — a bare domain in parentheses — renders as plain grey text, not a link, under the repo's own remark-gfm pipeline. 150 bullets look sourced and are not.

**Evidence**

Verified by running the repo's actual pipeline (modules/course_content/course_content.markdown.ts: remarkParse → remarkGfm → remarkRehype → rehypeStringify). Input `- Zod official documentation (zod.dev) — schema definition` outputs `<li>Zod official documentation (zod.dev) — schema definition</li>` — no `<a>`. GFM autolink literals fire only on a protocol or `www.` prefix. 150 non-URL bullets use this form, e.g. `(developers.google.com/search)` ×7, `(blog.hubspot.com)` ×7, `(cloud.google.com/apis/design)`, `(cheatsheetseries.owasp.org)`, `(anthropic.com/pricing)`, `(huyenchip.com)`, `(stripe.com/docs/webhooks)`.

**Affected scope**

150 bullets across roughly 120 lessons

### 6. [MAJOR] Among the 318 unique URLs that do exist, at least 17 point at documentation that has since been restructured or shut down — including Next.js doc paths that this very Next.js 15 repo's own framework has moved, and a dead link in the ADR lesson of a repo that itself keeps ADRs.

**Evidence**

content/courses/process-soft-skills/75_writing_adrs.md:156 — `Michael Nygard — "Documenting Architecture Decisions" (the original article): https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions` (Cognitect was absorbed into Nubank; that blog is gone). Four `https://nextjs.org/docs/app/building-your-application/...` URLs (CSP, Docker, OpenTelemetry, streaming) — a path prefix Next.js retired in the v15 docs reorg. `https://opentelemetry.io/docs/instrumentation/js/` (moved to /docs/languages/js/). `https://about.gitlab.com/handbook/style-guide/` (moved to handbook.gitlab.com). `https://docs.microsoft.com/en-us/azure/architecture/patterns/sharding` (docs.microsoft.com retired 2022). Four `https://typeorm.io/<page>` and three `https://www.prisma.io/docs/(concepts|guides)/...` paths, both restructured in 2024. Also stale in prose: `Pieter Levels (@levelsio) on Twitter` (content/courses/career-entrepreneurship/118_building_in_public.md:97), and `Voyage AI ... is Anthropic's recommended embedding partner` (content/courses/ai-llm-engineering/152:83), which stopped being true after Voyage was acquired.

**Affected scope**

~17 of 318 unique URLs, in ~15 lessons — but the pattern implies no link has ever been re-verified

### 7. [MAJOR] Sourcing quality is a per-course lottery rather than a corpus standard: adjacent courses differ by 100 percentage points in link rate, so a buyer's experience of "is this thing sourced" depends entirely on which course they open.

**Evidence**

URL rate per course, measured: framework-deep-dives 119/119 bullets (100%), database-advanced 34/36 (94%), security 36/39 (92%), observability-deployment 32/39 (82%) — versus ai-llm-engineering 0/63, distributed-systems-api-design 0/54, product-technical-strategy 0/75, contracts-pricing-legal 0/93 (all 0%). The 0% courses are not unsourceable: content/courses/ai-llm-engineering/162 cites `Model Context Protocol specification (modelcontextprotocol.io)` and content/courses/distributed-systems-api-design/06 cites `**"Distributed Locks with Redis" (redis.io/docs/manual/patterns/distributed-locks)**` — canonical, URL-able sources, deliberately written without the URL.

**Affected scope**

the 11 zero-URL courses ≈ 250+ lessons

### 8. [MINOR] 207 bullets name a source whose canonical URL is stable, famous, and one search away, and simply omit it — so the gap is authoring discipline, not source availability, and is mechanically fixable.

**Evidence**

Measured: 207 URL-less bullets mention MDN, OWASP, W3C, an RFC number, or "official documentation"/"spec". Examples: `- OWASP Password Storage Cheat Sheet` (content/courses/fundamentals-tools/127_auth_basics.md), `- MDN: HTTP overview and methods reference` (119_http_fundamentals.md), `- RFC 9110 — HTTP Semantics (the current spec, replacing 7231)` (same file), `- W3C WAI-ARIA — aria-live regions and role="alert" specification` (ai-llm-engineering/161). Contrast the best in the corpus, content/courses/security/32_jwt_security_rs256_hs256_rotation.md, which does it right: `[RFC 7519 — JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519)` and `[OAuth 2.0 Security Best Current Practice (RFC 9700)](https://datatracker.ietf.org/doc/html/rfc9700)` — primary, current, followable.

**Affected scope**

207 bullets; the single highest-leverage mechanical pass available

### 9. [MINOR] The Further Reading section is polluted with content that is not a reference: 40 legal disclaimers and 4 pointers to a first-owner artifact that does not exist in this repo.

**Evidence**

All 40 disclaimer bullets are in business-finance-solo-ops, e.g. content/courses/business-finance-solo-ops/319_tax_and_accounting_readiness.md — `- This lesson is general education, not tax or legal advice...`. Four lessons cite a nonexistent internal asset: `grep -rc Offer_Library content/courses` returns hits only in 331, 332, 333, 336, e.g. `- The Offer_Library monthly-retainers and maintenance-packages tier examples are directly usable as starting templates`. content/courses/business-finance-solo-ops/333_retainers_vs_maintenance.md is the corpus's worst section end-to-end: its three Further Reading bullets are (1) the fabricated *Recurring Revenue* book, (2) the dead Offer_Library pointer, (3) a legal disclaimer — zero real sources, presented as a reading list.

**Affected scope**

44 bullets across ~40 lessons, all in business-finance-solo-ops

### 10. [MINOR] Where primary sources exist, the corpus often cites a vendor's content-marketing page or an unofficial mirror instead — the exact substitution a senior reviewer flags first.

**Evidence**

Zero EUR-Lex citations exist in the corpus; GDPR is instead sourced to `https://gdpr.eu/right-to-be-forgotten/` (a vendor-run marketing site) and `https://gdpr-info.eu/art-28-gdpr/` (an unofficial mirror). 12 of the 46 URL-bearing bullets in client-delivery-pm-handover (26%) point at Atlassian lead-gen pages — `https://www.atlassian.com/agile/project-management/work-breakdown-structure`, `.../risk-register`, `.../acceptance-criteria` — as the authority for PM concepts that have formal PMI/BABOK treatments the same course name-drops elsewhere. content/courses/database-advanced/47_audit_log_design_application_level.md mislabels its own link: `[Hash chains and tamper evidence in audit logs](https://csrc.nist.gov/publications/detail/sp/800-92/final)` — SP 800-92 is "Guide to Computer Security Log Management" and does not cover hash chains.

**Affected scope**

~30 bullets, concentrated in client-delivery-pm-handover and privacy-compliance-incident-response
