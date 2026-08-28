# 291. SEO QA and Launch Checklist

## What It Is
Most SEO damage doesn't come from bad strategy — it comes from basic, avoidable mistakes made at launch: an accidental site-wide noindex, a staging robots.txt shipped to production, broken redirects after a URL change, missing metadata on key pages, a duplicate canonical, or private data left exposed. SEO QA exists specifically to catch these before they cost weeks of visibility, and it applies to every kind of launch — a brand-new site, a redesign, a domain migration, or even a single new landing page or blog post.

The per-page checklist is the same regardless of launch size: confirm a 200 status, confirm the page is indexable if intended, confirm it isn't blocked by robots.txt, confirm the canonical is correct, confirm a unique title and meta description exist, confirm there's exactly one H1 with a logical heading hierarchy under it, confirm the main content is actually visible/rendered (not trapped behind a client-only fetch), confirm internal links work, confirm images are optimized with alt text, confirm any schema validates, confirm a CTA is present, and confirm the page is mobile-usable with acceptable performance. Site-wide QA adds another layer: robots.txt reviewed, XML sitemap generated and containing only indexable canonical URLs, HTTPS working, www/non-www and trailing-slash handling consistent, a working 404 page, tested redirects, analytics installed, and both Search Console and Bing Webmaster Tools verified.

Migrations and redesigns need their own dedicated pass, because URL changes are the single highest-risk SEO event a site goes through: export every old URL, map each one to its new equivalent, create and test 301 redirects for the full mapping, update internal links to point directly at the new URLs (not through the redirect chain), update the sitemap, and then monitor Search Console closely in the days and weeks after launch for 404 spikes or unexpected indexing drops. Content QA and AEO QA run alongside the technical checks: does the page actually answer its target intent, is the intro free of generic filler, are the claims accurate, is outdated information removed, is there at least one answer block where relevant, are FAQ-style headings natural rather than forced, and are snippet restrictions like `nosnippet` applied intentionally rather than by accident. The list of forbidden launch mistakes is short and worth memorizing precisely because each one is completely avoidable and completely costly: site-wide noindex, a staging robots.txt in production, broken canonicals, missing redirects, exposed private data, empty metadata on key pages, and a sitemap full of redirected or noindexed URLs.

## Key Concepts
- **QA catches basic mistakes, not strategy problems**: most launch-related SEO damage is avoidable technical error, not a flawed content plan.
- **The universal per-page checklist**: status code, indexability, robots, canonical, title/description, single H1 with logical hierarchy, rendered content, working internal links, optimized images, valid schema, present CTA, mobile usability, performance.
- **Site-wide checklist**: robots.txt, clean sitemap, HTTPS, www/non-www and trailing-slash consistency, working 404 page, tested redirects, Search Console and Bing Webmaster Tools verified.
- **Migration is the highest-risk event**: URL exports, full old-to-new mapping, tested 301s, direct internal-link updates, sitemap regeneration, and close post-launch monitoring are all mandatory, not optional, for any URL change.
- **Content QA runs alongside technical QA**: intent match, accurate claims, removed outdated info, and a present CTA matter just as much as status codes.
- **AEO QA layer**: answer blocks present where relevant, natural (not forced) FAQ headings, entities clear, and snippet restrictions applied intentionally.
- **Post-launch monitoring window**: inspect key URLs, submit the sitemap, watch indexing reports and 404s, and validate structured data within the first days and weeks after any launch.
- **The forbidden launch list**: site-wide noindex, staging robots.txt in production, broken canonicals, missing redirects, exposed private data, empty metadata, and a sitemap full of bad URLs — each one fully preventable with this checklist.

## Example Code
```md
## Pre-Launch QA — Per Page

- [ ] 200 status
- [ ] Indexable if intended, not blocked by robots.txt
- [ ] Correct, self-referencing (or deliberate) canonical
- [ ] Unique title and meta description
- [ ] Single H1, logical heading structure below it
- [ ] Main content visible/rendered without JS-only dependency
- [ ] Internal links working
- [ ] Images optimized, alt text present
- [ ] Schema valid if used
- [ ] CTA present
- [ ] Mobile usable, performance acceptable

## Migration Checklist

1. Export full list of existing URLs
2. Map every old URL → new URL
3. Create 301 redirects for the full mapping
4. Test every redirect
5. Update internal links to point directly at new URLs
6. Regenerate and submit the sitemap
7. Monitor Search Console daily for the first 1-2 weeks post-launch

## Forbidden at Launch

- Site-wide noindex
- Staging robots.txt shipped to production
- Broken or conflicting canonical tags
- Missing redirects after a URL change
- Private data exposed on a public page
- Empty metadata on key pages
- Sitemap containing redirected/noindexed URLs
```

## When to Use
- Before any launch — new site, redesign, domain migration, or even a single new landing page
- Immediately after a redesign or URL-structure change, during the highest-risk monitoring window
- When something changes unexpectedly in Search Console right after a deploy, to check the launch checklist for what might have slipped
- When handing off a launch to someone else (or an AI agent), so the QA pass doesn't depend on memory
- Periodically on an already-live site, as a health check independent of any specific launch event

## Common Mistakes
- **A redesign ships with no export or redirect plan for the old URLs** — Launching a redesign without exporting and redirecting the old URL structure
- **Traffic has already collapsed by the time anyone notices the site is still noindexed** — Discovering a site-wide noindex only after traffic has already collapsed
- **The staging robots.txt (which blocks everything) makes it to production unchanged** — Shipping a staging robots.txt (which typically blocks everything) to the production environment
- **A pre-launch QA pass checks content and calls it done** — Treating QA as a content-only review and skipping the technical and AEO layers
- **Search Console goes unchecked for the first week after a launch** — Not monitoring Search Console closely in the days immediately following a launch, missing an early warning sign

## Further Reading
- Google Search Central's "Launch Checklist" and "Site Moves" documentation — the primary, current source on migration-specific risk
- Search Engine Journal's SEO launch/migration checklists — practical, frequently updated field guides that track current tooling
- Google Search Console Help's "URL Inspection Tool" documentation — for confirming a page's real indexing state directly rather than guessing from checklist inference
