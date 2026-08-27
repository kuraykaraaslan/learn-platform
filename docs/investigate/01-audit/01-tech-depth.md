# Audit 01 — Technical depth

> Verbatim output of the `audit:tech-depth` agent from the `enrich-412-lessons` workflow.
> The agent read real lesson files in `content/courses/` and ran its own measurements before answering.

## Dimension

tech-depth

## Verdict

These are competent glossaries with a decorative code sample stapled on: they reliably teach the vocabulary and the shape of each pattern, and will carry a reader through the first ten minutes of a design conversation. They do not teach mechanism. Five of the thirteen technical lessons I read in full contain code that will not compile or that silently does the wrong thing — in three cases the exact failure the lesson warns about — and the ambiguous-outcome case that defines each of these patterns in production is absent everywhere. The corpus is also almost entirely non-quantitative (p99 in 5/412 files, EXPLAIN ANALYZE in 4, "requests per second" in 1, and zero mentions of lock_timeout, SQLSTATE 40001, idle-in-transaction, or replication slots), so a reader finishes able to say "sagas use compensating transactions" but cannot run one, debug one at 3am, or defend orchestration over choreography with anything but an aesthetic argument.

## Findings (10: 3 critical, 6 major, 1 minor)

### 1. [CRITICAL] The flagship code examples were never executed or type-checked: five of the thirteen technical lessons I read contain code that fails to compile or silently does the wrong thing, and a reader who copies them ships the bug.

**Evidence**

/home/kuray/learn/content/courses/database-advanced/41_postgresql_mvcc_vacuum_bloat_isolation.md: `import { DataSource, IsolationLevel } from 'typeorm'` then `IsolationLevel.REPEATABLE_READ` — TypeORM exports IsolationLevel as a string-union TYPE, not an enum value, so this is a TS2693 compile error. Same file: `tenant?.subscription?.seatLimit ?? 5` where `tenant` was loaded by `findOne({where:{tenantId}, lock:{mode:'pessimistic_write'}})` with no `relations`, so `subscription` is always undefined and every tenant silently gets a seat limit of 5. /home/kuray/learn/content/courses/security/33_ssrf_server_side_request_forgery.md: `safeFetch` ends in `return axios.get(url, {...config, ...})` while its own documented usage is `safeFetch(tenant.webhookUrl, { method: 'POST', data: payload })` — axios.get forces `method:'get'`, so the webhook POST is silently downgraded to a GET. Same file: `/^fc|fd/` in BLOCKED_CIDR_PATTERNS — alternation binds looser than the anchor, so this is `(^fc)|(fd)` and matches 'fd' anywhere in any address; it also misses IPv4-mapped IPv6 (`::ffff:127.0.0.1`) and decimal-encoded IPs (`http://2130706433/`), the two textbook bypasses. /home/kuray/learn/content/courses/distributed-systems-api-design/03_saga_pattern.md: `SEND_WELCOME_EMAIL` is declared in the `SagaStep` union but has no `case` in the orchestrator switch, so the saga silently no-ops and never reaches the `COMPLETED` state its own Key Concepts diagram promises. Corpus: ~1024 fence markers, 30 files import unrunnable private aliases (`from '@/libs`), 0 files contain 'you should see' or 'how to verify'.

**Affected scope**

5 of the 13 technical lessons read in full; ~500 code blocks across the corpus, none of which shows evidence of ever having been run — realistically 150+ of the ~250 technical lessons

### 2. [CRITICAL] The ambiguous-outcome failure — the one case that makes each of these patterns hard in production — is never taught; the saga lesson's own example loses the customer's money in it.

**Evidence**

/home/kuray/learn/content/courses/distributed-systems-api-design/03_saga_pattern.md, CHARGE_CARD: `} catch { await sagaQueue.add('saga', { ...state, step: 'COMPENSATE_TENANT' }); }` — a bare catch treats 'the charge failed' and 'the charge request timed out but Stripe committed it' identically, deletes the tenant, and never issues a refund. That is the canonical 3am saga incident and it is not mentioned anywhere in the file. The same example passes no idempotency key to `chargeCard` while its own Common Mistakes says 'if `chargeCard` is not idempotent, you charge twice' and lesson 07 in the same course builds the exact mechanism — with no link between them. Also absent from the file: what happens when a COMPENSATE step itself fails (`refundCharge` throws → BullMQ retries → double refund), saga timeouts, and Richardson's compensatable/pivot/retriable step classification from the very chapter it cites in Further Reading.

**Affected scope**

every pattern lesson in distributed-systems-api-design (17), database-advanced (12) and security (13) that I sampled; ~60 mechanism lessons

### 3. [CRITICAL] Security lessons state incorrect mitigations as authoritative rules, including in the Common Mistakes section where a reader is least likely to question them.

**Evidence**

/home/kuray/learn/content/courses/security/34_timing_attack_constant_time_comparison.md: `crypto.timingSafeEqual(bufA, bufA); return false;` commented 'This prevents leaking length information via timing' — it does not; comparing a 10-byte buffer to itself takes measurably less time than comparing a 64-byte buffer, so length still leaks. The Common Mistakes bullet then codifies the error: '**Length check before constant-time comparison** — `if (a.length !== b.length) return false` leaks whether the lengths match; include the length check inside the constant-time logic as shown above.' The actual fix (HMAC both sides to a fixed length before comparing) is never mentioned. /home/kuray/learn/content/courses/distributed-systems-api-design/07_idempotency_key_pattern.md: the Prisma model is `key String @unique` — globally unique, not scoped to the caller — and the middleware looks it up with `findUnique({ where: { key: idempotencyKey } })`, so any client that sends another user's idempotency key receives that user's cached `responseBody`. The lesson also never mentions request-body fingerprinting (returning 422 when a key is reused with different parameters), while citing Stripe as 'the best real-world description... shows exactly what to store and return' — those two things are precisely what Stripe does and this implementation omits both.

**Affected scope**

the 13-lesson security course plus the auth/idempotency/webhook lessons in other clusters; ~20 lessons where a wrong mitigation has direct security consequences

### 4. [MAJOR] There are essentially no numbers in the corpus, so no trade-off can be defended in a design review — costs are asserted as adjectives, never measured.

**Evidence**

Corpus-wide over all 412 files: 'p99' or 'p95' in 5 files, 'EXPLAIN ANALYZE' in 4, 'requests per second/qps/rps' in 1, 'benchmark' in 7, pgbench 0, wrk 0, k6 1, 'load test' 1, flamegraph 0. /home/kuray/learn/content/courses/database-advanced/41_postgresql_mvcc_vacuum_bloat_isolation.md says SERIALIZABLE has 'significant performance cost' with no number, no measurement method, and no serialization-failure rate. /home/kuray/learn/content/courses/database-advanced/42_optimistic_vs_pessimistic_locking.md decides between the two strategies on 'conflicts are rare and retries are cheap' without ever giving the reader a way to measure their conflict rate. /home/kuray/learn/content/courses/distributed-systems-api-design/05_rate_limiting_strategies.md describes sliding-window-counter as a 'fast approximation' without stating its error bound, and never derives the 2x boundary burst it opens with.

**Affected scope**

all 412 lessons; acutely damaging in the ~150 performance/scale/database/distributed lessons

### 5. [MAJOR] There is no operational layer: nothing about how you observe the mechanism running, what the failure looks like in logs, or what knob you turn when it misbehaves at 3am.

**Evidence**

Corpus-wide across 412 files: 'lock_timeout' 0, 'statement_timeout' 0, 'could not serialize' / '40001' 0, 'idle in transaction' 0, 'replication slot' 0, 'Retry-After' 1, 'dead-letter' 3, 'jitter' 2, 'you should see' 0, 'how to verify' 0, 'expected output' 3. Concretely: /home/kuray/learn/content/courses/database-advanced/41_postgresql_mvcc_vacuum_bloat_isolation.md teaches bloat diagnosis but never mentions the xmin horizon — a long-running transaction, an abandoned replication slot, or a prepared transaction holding dead tuples unreclaimable — which is the actual reason autovacuum tuning fails in production, so a reader will tune scale factors forever while the real cause sits in pg_stat_activity. The same lesson recommends REPEATABLE READ + `pessimistic_write` together without warning that PostgreSQL then raises SQLSTATE 40001 on the blocked transaction, which the shown code has no retry for.

**Affected scope**

the ~250 technical lessons; every one of them stops at 'here is the code' and none reaches 'here is what it looks like when it breaks'

### 6. [MAJOR] Several load-bearing technical claims are simply false, and one lesson contradicts itself two lines apart.

**Evidence**

/home/kuray/learn/content/courses/database-advanced/43_zero_downtime_database_migration.md: 'Naive approach (BAD): ALTER TABLE tenants ADD COLUMN slug VARCHAR NOT NULL DEFAULT ''; This rewrites the entire table' — false since PostgreSQL 11, which the same file acknowledges nine lines later with '(no lock, instant in PostgreSQL 11+)'. That same comment, 'ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug VARCHAR; -- No lock required', is also wrong: it takes ACCESS EXCLUSIVE briefly, and the real outage mechanism — that lock queuing behind one long-running SELECT blocks every subsequent query on the table — is never mentioned, nor is the standard mitigation (`SET lock_timeout` plus retry; 0 hits corpus-wide). The file also puts `CREATE INDEX CONCURRENTLY` inside a numbered migration file without noting that it cannot run inside a transaction block (so Prisma/TypeORM migration runners will reject it) or that a failed CIC leaves an INVALID index needing manual cleanup.

**Affected scope**

verified in 3 of 13 files read; a reader has no way to tell which of the 412 lessons are trustworthy, so the credibility damage is corpus-wide

### 7. [MAJOR] The rigid ~1030-word single-code-block template caps every topic at one page regardless of intrinsic difficulty, making depth structurally impossible rather than merely absent.

**Evidence**

The 13 technical lessons I read range 913–1194 words: CAP theorem (913) gets the same budget as PostgreSQL MVCC/vacuum/isolation (1075) and the Spring Security filter chain (987). Prose-vs-code split measured on five of them: saga 704 prose / 273 code; Spring filter chain 777 prose / 210 code; SSRF 622 prose / 400 code. 338 of 412 files have exactly one code fence. In /home/kuray/learn/content/courses/framework-deep-dives/407_springboot_security_filter_chain.md that budget buys a config listing and no explanation of what a servlet Filter actually is relative to Spring's FilterChainProxy, why `addFilterBefore(x, UsernamePasswordAuthenticationFilter.class)` positions rather than replaces, or how SecurityContextHolder's ThreadLocal breaks under @Async — i.e. everything a 7-10 year engineer would be asked in a review.

**Affected scope**

all 412 lessons — the shape itself is the ceiling

### 8. [MAJOR] Lessons are audit notes on one private codebase rather than instruction, so a paying third-party reader is repeatedly told they already do things they have never done.

**Evidence**

/home/kuray/learn/content/courses/security/32_jwt_security_rs256_hs256_rotation.md: '// Your current approach (HS256) — correct for your architecture' and Common Mistakes bullets ending '(you already do this correctly)' twice, plus When to Use: '**`notBefore: 5` on refresh tokens** — You already do this'. /home/kuray/learn/content/courses/security/33_ssrf_server_side_request_forgery.md: 'your inbound IP detection already handles this correctly in `UserSessionNextService`' — a class the reader has never seen. /home/kuray/learn/content/courses/distributed-systems-api-design/03_saga_pattern.md: 'For a solo developer on a SaaS... Your BullMQ setup is a natural place'. Measured: 37 files contain audit residue ('you already' / 'your current' / 'your implementation'), 256 contain 'your ', 30 import `@/libs`-style private aliases. The consequence is technical, not just tonal: the JWT lesson's decision framing ('correct for your architecture') removes the reader's ability to reason about their own architecture.

**Affected scope**

37 files with explicit audit residue, 256 with second-person codebase assumptions; ~60% of the corpus

### 9. [MAJOR] Concepts are named and then abandoned — the lesson introduces the mechanism's primitives in Key Concepts and never uses them again, so the reader learns the label without the model.

**Evidence**

/home/kuray/learn/content/courses/database-advanced/41_postgresql_mvcc_vacuum_bloat_isolation.md defines '`xmin` (transaction that created it) and `xmax`' in Key Concepts and then never mentions either again — no query that selects them, no walk-through of a visibility decision, no snapshot example. /home/kuray/learn/content/courses/distributed-systems-api-design/01_cap_theorem.md defines linearizability in a Key Concepts bullet ('Strong = linearizability (PostgreSQL with `SERIALIZABLE`)' — which conflates serializability with linearizability) and its Example Code is two cache-vs-DB helper functions that demonstrate caching policy, not a partition. /home/kuray/learn/content/courses/distributed-systems-api-design/05_rate_limiting_strategies.md names 'Redis MULTI/EXEC required for atomic increment' and then ships `redis.pipeline()` in the sliding-window function, which is not atomic — the exact race the bullet warns about.

**Affected scope**

most conceptual lessons; the Key Concepts section functions as a glossary appendix rather than a spine in essentially all 412

### 10. [MINOR] Further Reading is an unnavigable bibliography with at least one fabricated-looking citation, so the reader has no route to the depth the lessons themselves lack.

**Evidence**

Corpus: 1246 bullets, ~347 with a URL. /home/kuray/learn/content/courses/security/34_timing_attack_constant_time_comparison.md cites '[Cryptographic timing attacks explained (Paul Kehrer)](https://crypto.io/timing_attacks/)' — crypto.io is not Kehrer's site nor a crypto-education domain; this reads as a hallucinated reference in a security lesson. Elsewhere the pointers are untargeted: /home/kuray/learn/content/courses/ai-llm-engineering/157_building_eval_pipeline.md cites 'Chip Huyen — "Designing Machine Learning Systems" and her AI Engineering writing on eval-driven development (huyenchip.com)' with no chapter, no URL, and no statement of what to take from it. Nothing anywhere links to another lesson in the corpus (0 cross-lesson links), so the saga lesson cannot send a reader to the idempotency lesson that completes it.

**Affected scope**

all 412 Further Reading sections; ~900 of the 1246 bullets carry no link at all
