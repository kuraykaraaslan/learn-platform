# 282. Technical SEO Foundations: Crawl, Render, Index

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' SEO_and_AEO_Rules material (technical-seo-foundations.md, crawl-index-rendering.md) to build out the Content, SEO & Personal Brand course; no existing coverage data for your own practice.

## What It Is
Every page has to pass three gates in sequence before it can rank or get cited at all: it has to be **crawled** (a search engine's bot can discover and fetch the URL), **rendered** (the page's actual content is extractable, not hidden behind client-only JavaScript that never runs for the crawler), and **indexed** (the search engine decided the rendered content is worth storing and serving). Skipping ahead to content quality or metadata work before confirming these three gates pass is a common and completely avoidable way to waste effort — no amount of good writing rescues a page the crawler never rendered correctly.

Crawlability depends on discoverability: important pages need to be reachable through internal links, sitemap, and normal navigation, not only through a search box, a form submission, or a client-side event. For a modern Next.js/React site specifically, this means using SSR or SSG for public pages that matter for search, generating metadata and canonical URLs per route on the server, injecting structured data as JSON-LD, and never hiding the main heading, primary text, links, or pricing/service descriptions behind a client-only fetch that a crawler might not execute. A page that looks complete in a browser can still be functionally empty to a crawler if its content only appears after JavaScript hydration finishes in a way the crawler doesn't wait for.

Indexing is a deliberate choice, not a default outcome: admin pages, login/register screens, cart/checkout private states, internal search-results pages, thin tag pages, duplicate filter pages, and staging environments should usually be noindexed, while service pages, portfolio/case studies, expert blog posts, tutorials, and offer pages should be indexed. Status codes carry meaning that search systems trust literally — a "not found" page that still returns HTTP 200 confuses crawlers into treating broken content as valid, a 301 should be used for genuinely permanent moves, and 302/307 should be reserved for content that really is temporary. The XML sitemap should contain only canonical, indexable, important URLs — including noindexed, redirected, or 404'd URLs in a sitemap actively wastes crawl attention and signals sloppiness.

When a page mysteriously isn't showing up in search, the debugging path is always the same sequence: check the status code, then robots.txt, then meta robots, then the X-Robots-Tag header, then the canonical tag, then whether any page actually links to it internally, then sitemap inclusion, then whether the rendered content is actually visible, then whether it's a duplicate of something else, then overall page quality, then server errors, and finally Search Console's own URL inspection tool for a direct answer. Working this checklist in order finds the actual blocker far faster than guessing.

## Key Concepts
- **The three gates**: Crawl → Render → Index, each a hard prerequisite for the next — a page failing any gate cannot perform regardless of content quality.
- **Discoverability requirement**: important URLs must be reachable via internal links, sitemap, and navigation — never rely solely on search boxes, forms, or client-side-only events to expose a URL.
- **Rendering discipline for modern frameworks**: use SSR/SSG for public pages, generate per-route metadata and canonicals server-side, and never hide primary content behind client-only fetches.
- **Deliberate indexability**: decide index vs. noindex per page type — admin, login, cart, staging, and thin filter pages default to noindex; service, portfolio, blog, and offer pages default to index.
- **Status code discipline**: 200 for valid pages, 301 for permanent moves, 302/307 only for truly temporary redirects, 404/410 for removed content, never a fake-200 "not found" page.
- **Clean sitemap principle**: the sitemap should contain only canonical, indexable, important URLs — no noindexed, redirected, or 404 URLs.
- **URL structure hygiene**: short, readable, lowercase, hyphen-separated, stable, intent-aligned URLs beat parameter-based or version-numbered ones.
- **The indexing debug sequence**: status code → robots.txt → meta robots → X-Robots-Tag → canonical → internal links → sitemap → rendered content → duplication → quality → server errors → Search Console inspection.
- **Migration discipline**: before any URL change, prepare an old-URL export, an old-to-new mapping, tested 301 redirects, updated internal links, an updated sitemap, and post-launch Search Console monitoring.

## Example Code
```md
## Technical SEO Pre-Launch Checklist

**URL structure examples**
Good: /services/saas-mvp-development, /blog/how-to-scope-a-saas-mvp
Bad:  /page?id=123, /blog/post_2026_final_v3

**Per-page checklist**
- [ ] Publicly accessible URL, returns 200
- [ ] Indexable if intended (no accidental noindex)
- [ ] Self-referencing canonical unless a deliberate alternative exists
- [ ] Unique title, single H1 matching intent
- [ ] Main content present in server-rendered/renderable HTML (not client-fetch-only)
- [ ] Internal links from at least one relevant page
- [ ] Included in XML sitemap if indexable

**Migration checklist (for redesigns / URL changes)**
1. Export the full list of existing URLs.
2. Map every old URL to its new equivalent.
3. Create and test 301 redirects for each mapping.
4. Update all internal links to point at new URLs directly (not through the redirect).
5. Regenerate the sitemap with new URLs only.
6. Monitor Search Console for 404 spikes and indexing drops after launch.
```

## When to Use
- Before writing a single word of new content, to confirm the site's crawl/render/index plumbing actually works
- When a page has been live for weeks with zero impressions in Search Console and something more fundamental than content quality is suspected
- When building or reviewing a Next.js/React route that matters for SEO, to confirm content isn't trapped behind a client-only fetch
- Before any domain migration, redesign, or bulk URL-structure change
- When deciding whether a new page type (admin dashboard, internal tool, staging preview) should be indexable at all

## Common Mistakes
- Relying on client-side-only rendering for the main heading, body text, or links on a page that needs to rank
- Returning HTTP 200 for a broken or "not found" page instead of a proper 404/410
- Including noindexed, redirected, or 404 URLs in the XML sitemap
- Letting staging or development environments accidentally become crawlable and indexed
- Skipping URL redirect planning before a redesign, causing an avoidable traffic and ranking collapse

## Further Reading
- Google Search Central's "Crawling and Indexing" documentation (developers.google.com/search/docs/crawling-indexing) — the authoritative technical reference
- web.dev's guidance on rendering strategies for JavaScript frameworks — practical detail on SSR/SSG/hydration trade-offs for SEO
- Next.js's own Metadata and rendering documentation — for confirming framework-specific implementation details stay current
