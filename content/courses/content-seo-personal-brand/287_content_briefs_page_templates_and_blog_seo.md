# 287. Content Briefs, Page Templates and Blog SEO

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' SEO_and_AEO_Rules material (content-briefs-and-page-templates.md, blog-seo-checklist.md) to build out the Content, SEO & Personal Brand course; no existing coverage data for your own practice.

## What It Is
A content brief is the document written before drafting starts, and its entire purpose is preventing unfocused writing — the single most common way SEO content fails is a writer sitting down without a clear page goal, audience, intent, or outline and producing something generic that happens to be about the right topic. A complete brief specifies the business goal, target audience, primary intent, primary query/topic, secondary questions, page type, unique angle, outline, proof/examples available, internal links in and out, schema recommendation, CTA, and success metric — enough that a writer (or an AI assistant) can produce a focused, on-strategy page without guessing any of those decisions mid-draft.

Different page types need genuinely different templates, not one generic outline stretched to fit everything. A service page needs a hero stating the service, audience, and outcome, then problem, outcome/value, what's included, what's excluded, process, proof, FAQ, and CTA. A blog guide needs a definition/short answer up front, why it matters, a framework or steps, examples, common mistakes, a checklist or summary, and a related next step. A case study needs context, problem, constraints, solution, technical approach, results, lessons, related services, and CTA. A comparison page needs a short direct answer, a comparison table, when to choose each option, risks, a recommendation, and a CTA. Using the blog-guide template for a service page (or vice versa) produces exactly the kind of vague, purpose-unclear writing the brief was supposed to prevent.

For blog content specifically, there's a sharper split between two failure modes depending on audience. Developer-facing technical posts need to state the problem, explain trade-offs, show minimal code only when it actually helps, avoid outdated snippets, and mention security/performance implications — a code-heavy post with no explanation of *why* the decisions matter teaches nothing. Buyer-facing business posts need to avoid excessive jargon, explain business impact, use practical examples, show decision criteria, and explain risk — in plain enough language that a non-technical reader can act on it. Every blog post, regardless of audience, needs the same SEO housekeeping (unique title, meta description, single H1, logical heading hierarchy, alt text, internal links to service/case-study pages, canonical URL) and the same AEO layer (a short answer block, FAQ-style subheadings where they arise naturally, a checklist or table, clear definitions). The forbidden pattern worth remembering above all others: never make the reader wait a thousand words before answering the question the title promised.

## Key Concepts
- **The complete brief fields**: business goal, audience, intent, primary/secondary queries, page type, unique angle, outline, proof, internal links, schema, CTA, success metric.
- **Page-type-specific templates**: service page, blog guide, case study, and comparison page each need a distinct structure — never reuse one template across all four.
- **Answer-first blog structure**: H1 promise → immediate answer in the intro → why it matters → framework/steps → example → common mistakes → checklist → related next step.
- **Developer vs. buyer post rules**: developer posts need trade-offs and minimal justified code; buyer posts need plain language, business impact, and decision criteria — not the same post rewritten with fewer words.
- **The AEO answer-block requirement**: any page targeting informational or commercial intent should include at least one 40-80 word direct answer under a question-shaped heading.
- **Pre-writing checklist as a gate**: primary topic, search intent, target reader, business relevance, cluster connection, unique angle, proof availability, and CTA should all be settled before drafting begins, not discovered while writing.
- **The "answer late" forbidden pattern**: burying the direct answer under a thousand words of scene-setting is the single most common way SEO blog content fails both readers and answer engines.
- **Keywords as an input, not an afterthought**: keyword decisions belong in the brief before writing, not bolted on after a draft is finished.

## Example Code
```md
# Content Brief: How to Scope a SaaS MVP Before Development

## Business Goal
Generate qualified scope-review inquiries from founders

## Target Audience
Startup founders, product managers

## Search Intent
Informational (leaning commercial — reader is close to hiring)

## Primary Query / Topic
how to scope a SaaS MVP

## Secondary Questions
What should an MVP include? MVP vs. roadmap — how to split features?

## Page Type
Blog guide

## Unique Angle
Concrete feature-sorting framework (must-have / phase-2 / roadmap), not
generic "start small" advice

## Required Sections
Definition/short answer, why scope fails, the 3-bucket framework,
worked example, common mistakes, checklist, related service link

## Answer Block
"## What should a SaaS MVP include?" — 40-80 word direct answer

## Internal Links In / Out
In: homepage, service page  |  Out: scope checklist lead magnet, case study

## Schema
Article/BlogPosting, BreadcrumbList

## CTA
Request a scope review

## Success Metric
Organic sessions to page + scope-review form submissions from this page
```

## When to Use
- Before drafting any blog post, service page, case study, or comparison page — the brief comes first, always
- When a finished draft feels unfocused or "about the right topic but not really about anything specific"
- When deciding which template (service, blog guide, case study, comparison) actually fits a new page's job
- When a technical post is getting engagement only from peers instead of buyers — usually a sign it skipped the buyer-facing rules
- When auditing whether a blog post answers its own title's question quickly enough in the opening paragraphs

## Common Mistakes
- Starting to write before the brief exists, then discovering mid-draft that the intent or audience was never actually decided
- Using the same generic outline for a service page, a blog post, and a case study
- Publishing a thousand words of preamble before answering the question the title promises
- Writing code-heavy developer content with no explanation of why the decisions matter, or business content so jargon-heavy a non-technical buyer can't follow it
- Treating keyword choice as a final polish step instead of a brief-stage decision

## Further Reading
- HubSpot's content brief templates and blog SEO guidance (blog.hubspot.com) — practical, widely used starting points for brief structure
- Google's "Helpful Content" self-assessment questions (developers.google.com/search) — a useful checklist for whether a draft actually serves the reader
- *Everybody Writes* — Ann Handley: a strong general reference for writing web content that stays clear and useful across technical and non-technical audiences
