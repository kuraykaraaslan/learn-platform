# Audit 04 — Example code quality

> Verbatim output of the `audit:code-quality` agent from the `enrich-412-lessons` workflow.
> The agent read real lesson files in `content/courses/` and ran its own measurements before answering.

## Dimension

code-quality (Example Code sections across all 412 lessons)

## Verdict

The systematic weakness is that "Example Code" is an illustration, not an artifact: 81% of the 412 sections are a single naked fence with zero words around it, nothing states what to run or what you should see, no example ever shows the broken version, and only 32 of 158 TypeScript snippets survive a standalone typecheck. The corpus therefore teaches recognition ("I've seen a JOIN FETCH") rather than capability ("I made one work and watched the N+1 disappear") — which is exactly the gap between the current product and "cidden bilgi sahibi." An excellent section for this corpus is a four-beat unit that scales to AI-authored + human-reviewed work: (1) the wrong version, short and compiling, that a real developer would actually write, with the symptom shown as output/log/query-plan; (2) the fix, self-contained — every identifier defined or imported from a real published package, never `@/libs/*`; (3) the observable proof — a run command plus the actual output, or 6-10 lines of a test that fails before and passes after; (4) one sentence naming what the snippet shows that the prose could not. For the 230 business lessons whose "Example Code" contains no code, the equivalent is a filled-in worked instance next to the blank form, with the numbers reconciling. The 400-series framework lessons (410, 421-430) and 128_clean_code_basics.md already do roughly beat (1)+(2); they are the internal template to scale, not a new invention.

## Findings (10: 4 critical, 5 major, 1 minor)

### 1. [CRITICAL] The Example section is a decorative fence, not a runnable exercise: 333 of 412 sections (81%) have zero prose outside the code fence, and only 8 lessons corpus-wide show what the code actually produces — so nothing tells the learner what to run, what to expect, or how to tell it worked.

**Evidence**

Measured across all 412 files: median prose-words outside the fence = 0; 352/412 have <=10 words; regex for 'expected output|// output|// =>|// prints|Result:' matches 8/412 (5/175 in technical courses). content/courses/distributed-systems-api-design/07_idempotency_key_pattern.md's entire '## Example Code' section is one 85-line ```typescript block and nothing else — no run instruction, no sample request/response, no 'send the same Idempotency-Key twice and you get the cached 201'.

**Affected scope**

333 of 412 lessons (all 23 courses)

### 2. [CRITICAL] No failure path is ever demonstrated as code. Every code fence in the corpus lives in the single 'Example Code' section — the 'Common Mistakes' section contains zero code fences in all 412 files — so every named failure mode is asserted in prose and shown nowhere.

**Evidence**

Parsed all 412 files with the repo's own heading rules: '```' appears in a Common Mistakes section 0 times (and in Key Concepts once). content/courses/architecture-design-patterns-testing/134_domain_driven_design.md lists 'Anemic domain models — entities that are just data bags, with all logic living in separate service classes' as a mistake, while its Example shows only the correct `Order` aggregate; content/courses/distributed-systems-api-design/07_idempotency_key_pattern.md warns 'Two simultaneous requests with the same key both see not-found' with no snippet of the losing race. Corpus-wide only 60/412 examples contain any `throw`/`Error(` and 41/412 any `catch`.

**Affected scope**

all 412 lessons; the wrong-way/right-way pair exists in only 61

### 3. [CRITICAL] TypeScript examples are fragments, not copy-pasteable code: 126 of 158 fail a standalone typecheck for reasons beyond missing npm packages, and 85 of 158 reference identifiers that are never defined or imported anywhere in the snippet.

**Evidence**

Extracted every ```typescript fence in an Example section to a file and ran `tsc --noEmit --skipLibCheck` per file: 19 clean, 32 clean-or-only-TS2307 (uninstalled module), 85 with TS2304/TS2552 'Cannot find name'. content/courses/architecture-design-patterns-testing/64_solid_principles.md yields 20 errors — `UserRecord`, `CreateUserDto`, `bcrypt`, `DataSource`, `UserEntity`, `dataSource`, `env`, `JwtTokenService`, `StaticTokenService` are all used and none is defined or imported, including in the wiring block a reader would paste first.

**Affected scope**

158 TypeScript lessons; 85 with undefined identifiers

### 4. [CRITICAL] 46 of 158 TypeScript examples import from the first owner's private boilerplate (`@/libs/*`, `@/modules/*`, `@/stores/*`), modules that do not exist in this repo and are not a public package — a third-party learner gets an unresolvable import and no definition of the symbol anywhere in the corpus.

**Evidence**

`grep -oh "from ['\"]@/" snips/*.ts`: `@/libs/logger` x7, `@/libs/redis` x6, `@/libs/app-error` x5, `@/libs/db` x4, `@/libs/typeorm` x7, `@/libs/middleware/auth` x4, `@/stores/authStore` x4, `@/modules/auth/auth.service` x5. `find . -name 'logger*'` in the repo returns nothing; tsconfig.json maps `@/*` to `./*`, where `libs/` contains only `icons.ts` and `utils`. content/courses/ai-llm-engineering/147_anthropic_api_client_architecture.md throws `new AppError('AI returned no text content', 502)` imported from `@/libs/errors`, and `AppError` is never defined in any of the 412 lessons.

**Affected scope**

46 TypeScript lessons across ai-llm-engineering, security, database-advanced, distributed-systems, observability

### 5. [MAJOR] Tests are a subject, never a habit: 22 of 412 lessons contain any test code, and 5 of those are the lessons literally about testing — so nothing in the security, distributed-systems, database, or architecture examples is verifiable by the learner.

**Evidence**

Regex for `describe|it\(|test\(|expect\(|@Test|jest|vitest` inside Example fences matches 22/412 (14/175 technical). The hits include 71_test_pyramid.md, 72_property_based_testing.md, 73_contract_testing_pact.md, 74_tdd_cycle.md, 124_unit_testing_basics.md. content/courses/security/33_ssrf_server_side_request_forgery.md ships a 100-line `safeFetch` with nine block conditions and not one assertion showing that `http://169.254.169.254/latest/meta-data/` is actually rejected.

**Affected scope**

390 of 412 lessons have no test in the example

### 6. [MAJOR] 230 of 412 'Example Code' sections contain no code at all, and wrapping the template in a fence makes it render worse than plain prose: 226 examples show literal `##`/`**` in a monospace block and 66 turn a markdown table into raw pipe characters.

**Evidence**

Fence-language census of Example sections: markdown 116, md 103, text 35, unlabeled 49 vs typescript 158; 230 lessons have only non-code fences. modules/course_content/course_content.markdown.ts pipes everything through `rehype-highlight`, so a ```md fence becomes `<pre><code class="language-md">` with the markdown escaped. content/courses/contracts-pricing-legal/203_scope_to_price_mapping.md's 8-row `| Module | Included? | Notes |` table renders as pipe soup, and LessonPage.tsx hardcodes the card title `"Example Code"` even for the 9 files that use `## Example / Template`.

**Affected scope**

230 lessons (business + process courses); 66 with broken tables

### 7. [MAJOR] In business lessons the 'example' frequently restates Key Concepts as an empty form — same field names, no filled-in values — so it teaches nothing the prose did not already say.

**Evidence**

Vocabulary overlap between the Example section and What-It-Is+Key-Concepts is a median 0.43 in business courses and 0.94 in content/courses/content-seo-personal-brand/304_segmentation_crm_automation_and_sales_handoff.md, whose entire Automation block is `**Trigger:** / **Conditions:** / **Actions/emails:** / **Delay:** / **Exit condition:** / **CRM update:** / **Owner/follow-up rule:**` — verbatim the Key Concepts bullet 'trigger, conditions, actions, delay, exit condition, CRM update, and owner/follow-up rule', with every value blank. content/courses/contracts-pricing-legal/209_proposal_structure_and_follow_up.md's Example is 16 bare `##` headings ('## Context / ## Business Problem / ## Project Goals ...') with no body text.

**Affected scope**

237 business lessons; 10 templates are >=80% empty fields, ~40 restate Key Concepts closely

### 8. [MAJOR] Snippets contain defects that break on first paste, proving they were never compiled or run — including a duplicate Java method, a JPA query against a field the entity does not have, and a model ID the Anthropic API rejects.

**Evidence**

content/courses/framework-deep-dives/410_springboot_jpa_entities_and_n_plus_one.md declares `List<UserSummary> findByUserStatus(String status);` at line 61 and `List<UserEntity> findByUserStatus(String status);` at line 76 in the same interface (javac: duplicate method, erasure-identical signature), and both that derived query and the JOIN FETCH `WHERE u.userStatus = 'ACTIVE'` (line 70) reference `userStatus`, which the `UserEntity` shown 30 lines above does not declare — its only status-like field is `private String userRole` (line 41), so Spring Data fails at context startup. Separately, 5 lessons (153, 158, 152, 164) hardcode `model: 'claude-haiku-4-5-20251001'`; the current API rejects date-suffixed IDs — the ID is `claude-haiku-4-5`.

**Affected scope**

at least 24 lessons carry a demonstrable compile/runtime/API defect; 158 TS + 10 java examples are unverified

### 9. [MAJOR] Examples teach practices the corpus's own lessons forbid, because no example is reviewed against the rest of the corpus.

**Evidence**

content/courses/observability-deployment/53_opentelemetry.md ends with `return withSpan('auth.login', async () => {...}, { 'user.email': email })` — writing a user's email address into a span attribute exported to Tempo/Jaeger, in a repo that also ships content/courses/privacy-compliance-incident-response/ and content/courses/database-advanced/48_data_retention_gdpr_kvkk_deletion_flow.md. The same file names the service `'next-boilerplate'`, one of 24 Example sections still carrying first-owner context ('your existing payment BasePaymentProvider follows this exact pattern' in 65_hexagonal_architecture.md).

**Affected scope**

24 lessons with owner leakage inside the example; cross-lesson contradiction unmeasured but systemic (no cross-links exist)

### 10. [MINOR] 19 lessons put JSX inside fences tagged `typescript` instead of `tsx`, which mis-highlights the block in the published page and is direct evidence the snippet was never fed to a compiler.

**Evidence**

Per-file `tsc` on extracted fences returns TS1005/TS1109/TS1128/TS1161 (JSX-in-.ts parse errors) for 19 files, e.g. content/courses/frontend-performance-scaling/23_react_server_components.md (69 parse errors), content/courses/framework-deep-dives/414_reactnative_expo_router_navigation.md (73), content/courses/security/35_content_security_policy_csp_headers.md (12). Corpus fence-language census shows only 3 `tsx` fences total against 158 `typescript`.

**Affected scope**

19 lessons in frontend-performance-scaling, framework-deep-dives, ai-llm-engineering, security, saas-business-skills
