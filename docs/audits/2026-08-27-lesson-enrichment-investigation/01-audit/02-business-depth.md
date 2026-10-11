# Audit 02 — Business & soft-skill depth

> Verbatim output of the `audit:business-depth` agent from the `enrich-412-lessons` workflow.
> The agent read real lesson files in `content/courses/` and ran its own measurements before answering.

## Dimension

business-depth

## Verdict

These are the best-written generic business lessons I've read in a while — the prose is disciplined, the failure modes are correctly identified, and a handful of lessons (185 outreach ethics, 187 substitution test, 189 campaign kill thresholds, 208 objection scripts, 330 pricing build-up) genuinely clear the "free blog post" bar with falsifiable rules and real numbers. But that quality is confined to roughly 5-8 lessons out of ~174. The rest gives the reader an excellent vocabulary and an accurate map of what they *should* have — a risk buffer, a change-request trigger list, a late-payment clause — while withholding every number, rate, statute and sendable sentence that would let them actually do it, and the two courses carrying the most legal and financial risk (contracts-pricing-legal, business-finance-solo-ops) are framed for a UK/US freelancer while the stated audience is Turkish. A Turkish reader who follows contracts-pricing-legal literally will invoice without e-Fatura, sign a fixed-TL retainer with no indexation, hire a subcontractor against IR35 criteria instead of SGK criteria, and have no idea they are entitled to statutory default interest. That is not "helps nobody" — it is worse than nothing in a few specific places.

## Findings (10: 3 critical, 5 major, 2 minor)

### 1. [CRITICAL] The two highest-stakes courses (tax/invoicing and contracts) are written for a UK/US freelancer, while the correct Turkish content already exists elsewhere in the repo and was never carried into them.

**Evidence**

business-finance-solo-ops/319_tax_and_accounting_readiness.md is titled "for International Freelancers" and its entire cross-border section is UK + US: "a UK business client is typically handled under B2B reverse-charge VAT rules... while a US client usually requires a W-8BEN." Zero mention of KDV, e-Fatura/e-Arşiv, serbest meslek makbuzu, geçici vergi, or GİB. Yet career-entrepreneurship/117_financial_literacy.md:14 already says "Services exported from Turkey to foreign clients are generally KDV-exempt (0%). You must still issue an invoice and document the export nature" and cites gib.gov.tr. Measured: grep -rlE 'Turkey|Turkish|Türk' returns 0/40 files in business-finance-solo-ops and 0/33 in contracts-pricing-legal.

**Affected scope**

73 lessons (all of business-finance-solo-ops + contracts-pricing-legal); the operational blast radius is every Turkish reader who invoices or signs anything

### 2. [CRITICAL] Contractor classification teaches the UK's IR35 test in detail and never mentions the Turkish SGK/İş Kanunu reclassification risk that actually applies to the reader.

**Evidence**

contracts-pricing-legal/230_contractor_classification.md names IR35 five times, links "HMRC's public guidance and the CEST (Check Employment Status for Tax) tool," and its Common Mistakes bullet is literally "Ignoring jurisdiction-specific frameworks (like IR35) that carry direct, automatic financial consequences." For a Turkish reader hiring a Turkish subcontractor the live exposure is muvazaalı hizmet akdi / SGK retroactive premium assessment — not named anywhere in the corpus. The lesson itself concedes this is "one of the more expensive mistakes in this entire course to get wrong" and then points at the wrong regulator.

**Affected scope**

1 lesson, but it is the single most expensive misdirection in the corpus; the same UK-default pattern recurs in 319 and 216

### 3. [CRITICAL] A pricing course with no prices: 124 of 174 business lessons contain no currency amount and no percentage at all, and the lesson specifically about rates ships an unfilled placeholder where the rate belongs.

**Evidence**

Measured per-course: contracts-pricing-legal 27/33 lessons have no [€$₺£]digit and no N% anywhere; client-acquisition-sales 23/24; content-seo-personal-brand 38/43. contracts-pricing-legal/205_hourly_and_day_rate_engagements.md's entire template is "**Rate:** $[X]/hour or $[Y]/day". No rate benchmark for a TR-based engineer selling into EU/US, no TL-vs-EUR invoicing decision, and no FX/inflation indexation clause — which in Türkiye makes a 12-month fixed-TL retainer (taught in 333/334) a structurally guaranteed loss.

**Affected scope**

124 of 174 business lessons; acutely 33 contracts-pricing-legal lessons

### 4. [MAJOR] An unsourced, implausibly precise conversion benchmark is used as the load-bearing justification for an entire offer design.

**Evidence**

business-finance-solo-ops/332_paid_audit_as_door_opener.md:6 — "close rates from audit to project are typically strong — commonly 70% or higher when the audit is well delivered" — restated as fact inside the client-facing template at line 45: "Typical audit-to-project close rate: 70%+." No source, no sample, no definition of the denominator. The same lesson's price band ($2,500-$5,000) sits two lines above "a $[X] remediation project", so the invented number is more specific than the real one.

**Affected scope**

1 lesson directly, but it is the exact failure mode a buyer will read as AI filler; similar unsourced thresholds appear in 327/339 ("40%+ ... 60%+ ... 80%+") with no derivation

### 5. [MAJOR] Further Reading is functionally unusable in four of five business courses: 415 bullets, zero clickable URLs, and several are non-references that name no actual document.

**Evidence**

Measured across each file's '## Further Reading' section: business-finance-solo-ops 121 bullets / 0 http, contracts-pricing-legal 93 / 0, client-acquisition-sales 72 / 0, content-seo-personal-brand 129 / 0. (client-delivery-pm-handover is the outlier at 46/102.) Examples: contracts-pricing-legal/217 cites "Orrick's or similar law firms' public client alerts on cross-border IP assignment"; 202 cites "Rafael Corrales / a16z-style writing on SaaS and service pricing models is widely available"; 233 cites "Your own jurisdiction's small-claims or commercial-mediation process". 318 points at "wise.com/gb/blog" — a blog root, and the /gb/ path is again UK-defaulted.

**Affected scope**

140 lessons across 4 courses

### 6. [MAJOR] The templates are frameworks about templates, not artifacts a reader can send tomorrow — only ~40 of 174 business lessons contain any client-sendable wording.

**Evidence**

Measured (Example block containing 'Subject:', 'Hi [', or a quoted script line): business-finance-solo-ops 5/40, contracts-pricing-legal 9/33, client-delivery-pm-handover 7/34, content-seo-personal-brand 11/43. Every single Example fence in these five courses is ```md, ```markdown or ```text — 195 of 197. content-seo-personal-brand/303 is titled "Ready-to-Use Templates" but delivers one skeleton with five angle-bracket holes ("a focused internal system for <workflow>, with <roles>, <core actions>") plus a checklist telling the reader not to send it unmodified. 30 unfilled [X]/[Name]/[date] placeholders sit inside supposedly ready templates.

**Affected scope**

~134 of 174 business lessons

### 7. [MAJOR] Contract lessons stop precisely at the clause boundary where the money is, then flag the gap themselves.

**Evidence**

contracts-pricing-legal/216_payment_gates_and_milestone_enforcement.md:8 says "None of the specific numbers, interest rates, or 'days to pay' figures below are legal advice for your jurisdiction" — but the file contains no interest rate and no days figure; the clause reads "**Late payment:** If a milestone payment is more than [X] days overdue". Neither Türkiye's statutory commercial default interest (TBK 120 / avans faizi, TCMB-published) nor the EU Late Payment Directive 2011/7 (statutory interest + €40 fixed recovery cost, automatic for B2B) appears anywhere in the corpus. 222 does the same on silence-based acceptance: "whether a silence-based acceptance mechanism is actually enforceable... depends on your jurisdiction" and then names none.

**Affected scope**

33 contracts-pricing-legal lessons; the hedge sentence pattern recurs 40 times

### 8. [MAJOR] There is no lesson on business structure at all — the first question the stated audience (interns/employees going independent in Türkiye) will ask.

**Evidence**

Across all 73 finance + contracts lessons, grep for 'sole proprietor|limited company|LLC|Ltd\.|şahıs şirketi|incorporat' returns exactly one hit: business-finance-solo-ops/318:17 "even if you're a sole proprietor with no formal corporate structure." No coverage of şahıs şirketi vs. limited şirket, BAĞ-KUR, genç girişimci kazanç istisnası (the under-29 income-tax exemption that is directly relevant to an intern audience), stopaj on office rent, or defter-beyan. business-finance-solo-ops opens at 316 (cash flow) and assumes the entity already exists.

**Affected scope**

a missing lesson affecting the entry point to all 40 business-finance-solo-ops lessons

### 9. [MINOR] The same closing disclaimer is stamped verbatim on every lesson in the finance course, substituting boilerplate for the jurisdictional specificity it gestures at.

**Evidence**

grep -c 'This lesson is general education' returns 1 for all 40/40 files in business-finance-solo-ops; the exact string "This lesson is general education, not financial or tax advice" occurs 35 times corpus-wide. It sits as the last Further Reading bullet — i.e. it consumes a reference slot in a section that already has no links. Reading five files in a row makes the generation template visible, which is exactly the "reads as AI filler" risk the owner needs to avoid for a paid product.

**Affected scope**

40 lessons carry it; 35 share identical wording

### 10. [MINOR] Further Reading recycles a small pool of the same popular business books across unrelated lessons, signalling per-lesson generation rather than sourcing.

**Evidence**

Counted across the five business courses: *Influence* — Robert Cialdini ×6, *Obviously Awesome* — April Dunford ×6, *They Ask, You Answer* — Marcus Sheridan ×6, *Traction* ×5, *Profit First* ×5, *Predictable Revenue* ×5, *Building a StoryBrand* ×5. Cialdini is cited in content-seo-personal-brand/303 for proof emails and again in the sales course; Profit First is cited in both 316 (cash flow) and 318 (banking), where 318 openly admits it doesn't fit: "while focused on allocation rather than banking mechanics."

**Affected scope**

~140 lessons across the 4 link-free business courses
