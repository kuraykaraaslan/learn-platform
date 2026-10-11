# Audit 06 — Voice & first-owner leftovers

> Verbatim output of the `audit:voice-context` agent from the `enrich-412-lessons` workflow.
> The agent read real lesson files in `content/courses/` and ran its own measurements before answering.

## Dimension

voice-context: third-party readability after conversion from one developer's personal study notes

## Verdict

The corpus should stay second-person — 93.6% of its 2,784 you/your tokens (measured by a sentence-level classifier over all 412 files) are legitimate instructional address ("your team", "your jurisdiction", "your accountant") and stripping them would make a teaching product worse. The damage is concentrated: ~130 tokens across 83 files (20% of the corpus) assert facts about a private codebase the reader has never seen, and those files need human rewriting, not sed. The Coverage Level deletion was structurally clean (all 412 files still open `# N.` → blank → `## What It Is`, zero orphan transitions), but it removed the section without removing the genre — 23 files still open a body paragraph with "For your <stack/SaaS/boilerplate>, ..." and 13 `## Common Mistakes` bullets still grade the reader ("you already do this correctly"). The deeper problem is that there is no voice standard at all: second-person density varies 150x across the 23 courses, Cohort B's median sentence is 64% longer than Cohort A's, and the homepage promises "interns and employees" while 186 lessons (45%) address a solo freelancer running their own business.

## Findings (10: 3 critical, 6 major, 1 minor)

### 1. [CRITICAL] The distinguishing test for 'your' is whether the sentence makes a checkable factual claim about a system the reader was never shown — by that test only ~5% of second-person usage is broken, so a blanket de-personalization pass would be the wrong remediation.

**Evidence**

Sentence-level classifier over all 412 files (scratchpad/cls.py) counted 2,784 you/your tokens: Class A generic-instructional 2,605 (93.6%) e.g. business-finance-solo-ops/319_tax_and_accounting_readiness.md:63 'an accountant familiar with your actual situation'; Class B indicative-assertion 56 (2.0%) e.g. distributed-systems-api-design/11_read_replica_routing.md:8 'In Prisma (your current ORM)... In TypeORM (which you're also adding based on your git status)'; Class C private-artifact 72 (2.6%) e.g. security/33_ssrf_server_side_request_forgery.md:135 'your inbound IP detection already handles this correctly in `UserSessionNextService`'. Mechanical signature for the bad classes: possessive/second-person inside a present-tense declarative with a stative verb (is/are/have/do/already) and NO conditional or imperative wrapper (if/when/unless/should/suppose).

**Affected scope**

83 of 412 files (20%) carry at least one Class B or C hit or a private path/name leak; the other 329 are clean or need only placeholder substitution

### 2. [CRITICAL] Coverage Level was deleted as a section but survives as a genre: the same personal-codebase audit judgment now lives inside 'What It Is' openers and 'Common Mistakes' bullets, where the parser and UI have no way to isolate it.

**Evidence**

Structural check is clean — line 3 of all 412 files is exactly '## What It Is', and grep for continuation openers (^But|So|However|As noted|This means...) in lines 1-6 returns zero. But 23 files open a body paragraph with the formula 'For your <X>,' e.g. architecture-design-patterns-testing/71_test_pyramid.md:14 'For your codebase, the highest-value first tests are integration tests on `AuthService.login`', and 13 Common Mistakes bullets grade the reader instead of naming a mistake: security/32_jwt_security_rs256_hs256_rotation.md:135 'You already do this; prevents a race condition' and :138 'use separate secrets (you already do this correctly)'; frontend-performance-scaling/27_job_queue_bullmq.md:107 'your `libs/redis/bullmq.ts` already has it, never remove it'.

**Affected scope**

23 files with 'For your X' openers + 12 files with self-audit Common Mistakes bullets (some overlap); ~30 distinct files

### 3. [CRITICAL] Two lessons are not lessons — they are consulting memos written TO the first owner about his own assets, and a buyer reading them is reading someone else's mail.

**Evidence**

open-source-community/100_creating_reference_resource.md:8 'Your specific situation — 74K lines of formalized rulesets, a production multi-tenant SaaS boilerplate in Next.js/TypeScript/PostgreSQL, three years of solo full-stack experience... is the raw material for the most comprehensive reference resource on running a solo SaaS business that currently exists' (the file repeats '74K lines' four times, incl. line 100 'Given your 74K lines of rulesets and multi-tenant SaaS boilerplate'). career-entrepreneurship/114_niche_positioning.md:8 'Your boilerplate already defines your niche. The question is whether you're communicating it.' Same pattern in process-soft-skills/85_technical_blog_conference_talk.md:6 ('your 74K lines of rulesets') and open-source-community/98_writing_stack_overflow_answers.md:8 ('For a developer with your background — multi-tenant SaaS, TypeScript, Next.js App Router, PostgreSQL, multi-provider payments').

**Affected scope**

4 files require full rewrite or removal; 2 of them (100, 114) are unsalvageable as-is

### 4. [MAJOR] The `framework-deep-dives` course (35 lessons, 8.5% of corpus) is verbatim internal engineering standards, not teaching material — it prescribes one shop's house rules as universal law and names a private component library and an internal rules document.

**Evidence**

framework-deep-dives/413_reactnative_file_organization_and_banned_patterns.md:6 'React Context and Redux are both banned for global state in favor of Zustand... because this shop standardizes on one tool everywhere'; :8 'are both flagged in review'. 425_electron_renderer_react_and_kuireact_fork.md:4 '`Code_Structure_Rules_Next` simply does not govern this process; `Common` + the TypeScript house style do' and :8 'KUIreact itself — a private, 145-component Next.js showcase library'. KUIreact appears in 4 files (424, 425, 429, 430); `_FORK.md` in 425. The course also has the lowest second-person density in the corpus (0.2 you/1k words) — it never addresses the reader at all.

**Affected scope**

35 lessons; 10 of them are on the human-rewrite list, but all 35 need a stated framing sentence

### 5. [MAJOR] Second-person density varies 150x across the 23 courses, splitting cleanly along the two authoring commits — the product has two incompatible authorial registers with no editorial rule reconciling them.

**Evidence**

Measured you+your per 1,000 words per course: career-entrepreneurship 30.3, open-source-community 25.1, observability-deployment 16.3 ... content-seo-personal-brand 2.6, client-delivery-pm-handover 1.5, privacy-compliance-incident-response 1.0, framework-deep-dives 0.2. Cohort A (145 lessons from 72d97ee) = 13.37 you/1k; Cohort B (267 lessons from 0139b05 'add 9 course clusters from internal-ai-rules') = 3.59 you/1k — a 3.7x gap. Every one of the 50 Class C private-artifact hits is in Cohort A; 36 of 39 Class B hits are too.

**Affected scope**

all 412 lessons — the inconsistency is between clusters, so a reader moving between courses feels it immediately

### 6. [MAJOR] Cohort B prose is measurably denser and harder to read than Cohort A — its median sentence is 64% longer and one sentence in five exceeds 50 words, which is the corpus's closest texture to AI filler even where the substance is good.

**Evidence**

Sentence-length measurement over prose only (code fences, bullets, tables, headings stripped): Cohort A median 22 words, p75 32, p90 45, 6.6% over 50 words (n=1,632). Cohort B median 36 words, p75 47, p90 61, 20.7% over 50 words (n=2,446). Median 'What It Is' paragraph: A 78 words, B 113 words (p90 168). Example, client-acquisition-sales/196_stakeholder_mapping...md:6 is a single 148-word sentence chain; contracts-pricing-legal/219_ndas_when_and_how_to_use_them.md:6 runs 3 paragraphs of 110-130 words each with no list, no code, no break.

**Affected scope**

247 Cohort B lessons (60% of corpus); worst in contracts-pricing-legal, client-acquisition-sales, privacy-compliance-incident-response

### 7. [MAJOR] The first owner's real name and handles are embedded inside copy-paste templates, so a reader who uses the template as intended ships the author's identity — and this is inconsistent with the corpus's own better practice elsewhere.

**Evidence**

7 files: content-seo-personal-brand/283_metadata_titles_descriptions_and_canonical_url_strategy.md:26 '**Title:** Custom SaaS MVP Development for SMEs | Kuray Karaaslan'; 286_entity_clarity_and_eeat_trust_signals.md:24 'Written by Kuray Karaaslan, a software engineer focused on...' (an author-box template); advanced-deep-dive-topics/112_technical_writing.md:26 '**Owner:** @kuray' in a runbook template; security/36_dependency_audit_automation.md:106 '- "kuraykaraaslan"' inside a GitHub Actions config; framework-deep-dives/427_...md:75 'appId: com.kuray.myapp'; plus two fabricated testimonials naming him (business-finance-solo-ops/346:58, 344:36). Contrast client-delivery-pm-handover/254_admin_and_user_guides.md:69 which correctly uses 'support@meridianretail-dev.example' — the good convention exists but is applied in only 5 files.

**Affected scope**

7 files with real-identity leaks; placeholder conventions are unstandardized corpus-wide (29 example.com, 13 yourusername, 5 meridianretail.example, 5 acme, 1 acme.yoursaas.com)

### 8. [MAJOR] The stated audience and the actual audience contradict each other: the site sells to interns and employees while nearly half the lessons address a solo operator running their own business.

**Evidence**

app/(frontend)/page.tsx:11 and app/layout.tsx:13: 'A course platform for interns and employees.' But 186 lessons (45%) sit in courses written for a freelancer — business-finance-solo-ops (40), content-seo-personal-brand (43), client-delivery-pm-handover (34), contracts-pricing-legal (33), client-acquisition-sales (24), open-source-community (7), career-entrepreneurship (5). 122 files carry explicit solo-operator framing ('solo operator/developer/founder', 'freelanc*', 'your client', 'as a solo'), led by contracts-pricing-legal (26 files, 80 hits) and business-finance-solo-ops (24 files, 45 hits). An intern reading contracts-pricing-legal/222 ('most freelancers forget to state upfront') is being addressed as someone they are not.

**Affected scope**

186 lessons in 7 courses vs. a one-line homepage claim — resolvable by editing one line or by re-framing the courses, but not by leaving both

### 9. [MINOR] Legal/financial disclaimer practice uses three different conventions across the three courses that most need one, with the highest-risk course carrying none in the standard slot.

**Evidence**

business-finance-solo-ops: 38/40 lessons carry a footer bullet in '## Further Reading', 35 of them the identical string 'This lesson is general education, not financial or tax advice.' (e.g. 351_weekly_monthly_business_review.md:83) — uniform enough to read as a stamp. contracts-pricing-legal: only 11/33, and inline in prose rather than as a footer (219_ndas...md:8 'it is general education, not a legal opinion'). privacy-compliance-incident-response: 0/13 footers — it instead embeds routing advice in the body (359_privacy_by_design...md:10 'belong to legal/privacy counsel, not to the person writing the code'), which is good content but a third convention. Same corpus, three rules.

**Affected scope**

86 lessons across the three legal-adjacent courses; also 9 files carry untranslated Turkish (366_health_data_compliance...md:1 title reads 'HIPAA, NHS & KVKK Sağlık Verileri'; 359:51 'KVKK açık rıza not required')

### 10. [MAJOR] There is no voice standard document and no lint, so every fix applied now will re-drift on the next authoring batch; the remediation must ship a written standard plus a CI deny-list, not just edits.

**Evidence**

No docs/voice.md, no style guide, and no content lint in the repo (docs/adr/0001 covers storage, not voice). Cross-references already show the drift: '(#NN)' style in 16 files (fundamentals-tools/122_oop_data_structures_basics.md:4 'SOLID Principles (#64) assumes'), 'Lesson NN' in 30 files (product-technical-strategy uses it 22 times), and vague 'covered earlier/elsewhere' in 33 — none of them links, since there is no cross-lesson linking. PROPOSED STANDARD: (1) second person stays; (2) second person may appear ONLY in a conditional, imperative, or hypothetical frame — never a present-tense assertion about the reader's system; (3) every concrete file path, class name, or stack fact belongs to a named fictional running example introduced per course, never to 'you'; (4) one placeholder registry corpus-wide (one persona name, *.example domains, `acme` org, `lib/` not `libs/`); (5) first person only inside quoted practitioner scripts (already the de-facto practice in Cohort B); (6) median sentence <=28 words, hard cap 45 outside code, paragraph <=100 words; (7) one audience line, matched by the content. REMEDIATION AT SCALE: Pass 0 = scripts/voice-lint.ts in CI with deny-list /kuray|avantleap|KUIreact|Code_Structure_Rules|next-boilerplate|74K|your boilerplate|com\.kuray/ (fails build, catches the 7 identity files). Pass 1 = scripted sed with the placeholder registry, ~30 diffs to spot-check. Pass 2 = LLM rewrite of the 83-file list under one instruction — 'rewrite every sentence asserting a fact about the reader's system into a conditional the reader can test or a statement about the named example; never claim the reader has, does, or already did anything' — with human review of each diff (~83 reviews, the only expensive step). Pass 3 = full rewrite or cut of open-source-community/100 and career-entrepreneurship/114. Pass 4 = one framing sentence prepended to all 35 framework-deep-dives lessons ('these conventions are one house standard, chosen for X; the reasoning transfers even where you would pick differently') and 'banned' -> 'banned in this ruleset'. Pass 5 = re-run the classifier as a regression check; target Class B+C = 0.

**Affected scope**

all 412 lessons and all future authoring; the 83-file human-review pass is the only step that does not scale mechanically
