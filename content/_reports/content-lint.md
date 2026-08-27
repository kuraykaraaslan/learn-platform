# Content lint report

`npx tsx scripts/content-lint` — generated file, do not edit by hand.

412 lessons · 21 findings · 4 waived

| Rule | Findings | Severity | What it means |
|---|---:|---|---|
| `sources/quota-signature` | 14 | warn | Every lesson in a course carrying the same number of Further Reading bullets is a generation artifact, not a research result. |
| `sources/bare-domain` | 6 | warn | A bare domain in parentheses looks like a citation but renders as plain grey text — remark-gfm only autolinks bare URLs, not "(zod.dev)". |
| `links/unlinked-lesson-ref` | 1 | warn | A "#N" that matches a real lesson but carries no reference cue is left as plain text by the markdown pipeline, because "rule #1" and "Top 10 #29" also exist. Parenthesise it as "(#N)" or add a cue ("see #N"). |

## Findings by rule

### `sources/quota-signature` — 14

- advanced-deep-dive-topics — all 13 lessons have exactly 3 Further Reading bullets (zero variance)
- ai-llm-engineering — all 21 lessons have exactly 3 Further Reading bullets (zero variance)
- architecture-design-patterns-testing — all 14 lessons have exactly 3 Further Reading bullets (zero variance)
- client-acquisition-sales — all 24 lessons have exactly 3 Further Reading bullets (zero variance)
- client-delivery-pm-handover — all 34 lessons have exactly 3 Further Reading bullets (zero variance)
- database-advanced — all 12 lessons have exactly 3 Further Reading bullets (zero variance)
- distributed-systems-api-design — all 18 lessons have exactly 3 Further Reading bullets (zero variance)
- frontend-performance-scaling — all 8 lessons have exactly 3 Further Reading bullets (zero variance)
- fundamentals-tools — all 12 lessons have exactly 3 Further Reading bullets (zero variance)
- observability-deployment — all 13 lessons have exactly 3 Further Reading bullets (zero variance)
- process-soft-skills — all 13 lessons have exactly 3 Further Reading bullets (zero variance)
- product-technical-strategy — all 25 lessons have exactly 3 Further Reading bullets (zero variance)
- saas-business-skills — all 8 lessons have exactly 3 Further Reading bullets (zero variance)
- security — all 13 lessons have exactly 3 Further Reading bullets (zero variance)

### `sources/bare-domain` — 6

- business-finance-solo-ops/317_invoicing_and_payment_tracking.md — bare domain renders as text, not a link: - Stripe's guide to invoicing and payment terms for freelancers and small businesses (stri
- database-caching-performance/21_cdn_cache_strategy.md — bare domain renders as text, not a link: - **"A Comprehensive Guide to HTTP Caching" by Jake Archibald (web.dev/http-cache)** — Cle
- frontend-performance-scaling/22_http2_multiplexing.md — bare domain renders as text, not a link: - **"HTTP/3 explained" (http3-explained.haxx.se)** — Free online book by Daniel Stenberg (
- frontend-performance-scaling/138_frontend_state_management.md — bare domain renders as text, not a link: - TkDodo (React Query maintainer) — "Practical React Query" blog series (tkdodo.eu/blog)
- process-soft-skills/85_technical_blog_conference_talk.md — bare domain renders as text, not a link: - **"Technical Writing for Developers" — Josh Comeau (joshwcomeau.com/blog/how-i-write)** 
- saas-business-skills/86_saas_metrics.md — bare domain renders as text, not a link: - **"The SaaS CFO" — Ben Murray (thesaascfo.com)** — Practical financial modeling for SaaS

### `links/unlinked-lesson-ref` — 1

- ai-llm-engineering/146_when_to_add_ai.md:59 — "#1" matches a lesson but has no cue, so it renders as plain text: - Google's "Rules of Machine Learning" (Martin Zinkevich) — rule #1 is "don't be
