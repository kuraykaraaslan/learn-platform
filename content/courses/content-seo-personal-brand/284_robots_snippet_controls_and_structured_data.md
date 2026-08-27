# 284. Robots, Snippet Controls and Structured Data

## What It Is
Robots and snippet controls and structured data are both "instruction layers" that sit on top of a page's content and tell search and AI systems how to treat it — one restricts or permits access and presentation, the other adds machine-readable meaning. They're easy to confuse but serve opposite functions: robots controls narrow what's shown or crawled, while structured data clarifies and enriches what's already visible.

There are three distinct robots-family tools, and mixing them up is the single most common technical SEO mistake: `robots.txt` controls crawl **access** (can a bot fetch this URL at all), meta robots tags control **page-level index/snippet** behavior (index vs. noindex, follow vs. nofollow, snippet vs. nosnippet), and the `X-Robots-Tag` HTTP header applies the same page-level controls to non-HTML files like PDFs. The default behavior doesn't need to be declared — a page is `index, follow` unless told otherwise. The directive with the sharpest AEO consequence is `nosnippet`: it blocks the text/video preview a search or answer engine would otherwise show, which for a technical business trying to build AI-answer visibility is usually self-defeating unless there's a specific business, legal, or privacy reason for it. Private content (admin panels, dashboards, login pages, staging sites) should never rely on robots.txt alone for privacy — a robots.txt disallow only asks crawlers not to visit; it doesn't prevent access if the URL is discovered elsewhere. Real privacy requires authentication.

Structured data (JSON-LD is the preferred format) adds explicit, machine-readable labels to content that's already visible on the page — Organization, Person, WebSite, WebPage, BreadcrumbList, Article/BlogPosting, Service, and (only when genuinely eligible) LocalBusiness or FAQPage. The one non-negotiable rule governing all of it: structured data must accurately describe what a user can actually see. Marking up services not actually offered, adding fake ratings, or using FAQPage schema for content hidden from the visible page are all violations that can trigger manual penalties, and none of them produce the AI-citation benefit people hope for — there is no such thing as "AI Overview schema," and structured data is a clarity layer, not a ranking trick. For a personal/freelance site, a reasonable baseline is Organization or Person plus WebSite at the site level, WebPage and Article/BlogPosting at the content level, and BreadcrumbList for navigational hierarchy — validated with Google's Rich Results Test and the Schema.org validator before launch.

## Key Concepts
- **Three distinct robots tools**: robots.txt (crawl access), meta robots (page-level index/snippet control), X-Robots-Tag (HTTP-header equivalent for non-HTML files) — never treat them as interchangeable.
- **Default behavior needs no declaration**: pages are `index, follow` by default; only declare directives when deviating from that.
- **The `nosnippet` AEO trade-off**: blocking snippets also blocks the summaries and quotes that AI answer engines rely on — use it only for a specific privacy/legal/business reason.
- **Robots.txt is not privacy**: it's a crawl-politeness request, not an access control; truly private pages need authentication, not just a disallow rule.
- **Structured data must match visible content**: schema that describes something a user cannot actually see on the page is a policy violation, not a growth hack.
- **JSON-LD as the preferred format**: cleanly separable from HTML markup and the format search engines document most thoroughly.
- **Baseline schema set for a solo site**: Organization/Person + WebSite site-wide; WebPage, Article/BlogPosting, and BreadcrumbList at the page level.
- **No guaranteed schema-to-ranking or schema-to-citation link**: structured data improves understanding and rich-result eligibility, but never guarantees either rankings or AI citations.

## Example Code
```md
## Robots Directive Decision Table

| Page type              | robots.txt      | meta robots           |
|-------------------------|-----------------|------------------------|
| Public service page     | allow           | index, follow          |
| Blog post                | allow           | index, follow          |
| Admin dashboard          | disallow + auth | noindex, nofollow      |
| Staging environment      | disallow + auth | noindex, nofollow      |
| Downloadable PDF proposal| n/a             | X-Robots-Tag: noindex  |

## Structured Data Plan

**Page URL:** /case-studies/appointment-platform-mvp
**Page type:** Case study / CreativeWork
**Recommended schema types:** Article (or CreativeWork), BreadcrumbList, Person (author)
**Required visible content:** author name, publish/update date, project summary text
**Entity references:** sameAs → LinkedIn profile, GitHub profile
**Validation tool:** Google Rich Results Test, Schema.org validator
**Risks:** none — all marked-up fields are visible on the page
```

## When to Use
- Whenever a private or duplicate page needs to be excluded from search — to choose the right tool (robots.txt vs. meta robots vs. auth) instead of guessing
- Before adding any `nosnippet` or aggressive snippet-restriction directive, to weigh the AEO cost against the actual privacy need
- When adding JSON-LD to a new page template, to confirm every marked-up field is genuinely visible to a human visitor
- During pre-launch QA, to check that production pages aren't accidentally noindexed and staging pages aren't accidentally indexable
- When validating structured data before a launch, using Rich Results Test and the Schema.org validator

## Common Mistakes
- Using robots.txt to try to remove already-indexed private content instead of noindex plus authentication
- Applying `nosnippet` site-wide or by default without a specific reason, quietly reducing AI/search visibility
- Marking up services, ratings, or FAQ content that isn't actually visible on the page
- Adding conflicting or duplicate Organization/Person identities across schema blocks
- Copying a competitor's schema implementation without checking whether it actually matches your own visible content

## Further Reading
- Google Search Central's "Robots Meta Tags" and "Structured Data" documentation — the definitive reference for both topics
- [Schema.org's own documentation and type hierarchy](https://schema.org) — for checking a type's exact required/recommended properties
- [Google's Rich Results Test tool](https://search.google.com/test/rich-results) — for validating markup before it ships
