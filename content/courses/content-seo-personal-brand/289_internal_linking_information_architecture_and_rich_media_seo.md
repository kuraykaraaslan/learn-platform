# 289. Internal Linking, Information Architecture and Rich Media SEO

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' SEO_and_AEO_Rules material (internal-linking-and-information-architecture.md, image-video-and-rich-media-seo.md) to build out the Content, SEO & Personal Brand course; no existing coverage data for your own practice.

## What It Is
Internal linking is how both users and search systems understand the relationships between pages, and it's also how authority flows from strong pages toward the pages that need to convert. The working model is hub-and-spoke: a pillar or service page is the hub, blog posts and guides are educational spokes, case studies are proof spokes, FAQ/checklist pages are answer spokes, and a CTA page is the conversion endpoint everything eventually points toward. Anchor text carries real weight in this system — descriptive anchors ("SaaS MVP development service," "admin panel case study") tell both readers and crawlers what the destination is about, while generic anchors ("click here," "read more") waste the opportunity entirely. The single most damaging and most avoidable internal-linking failure is the orphan page: a page that exists in the sitemap but that no other page actually links to, reachable only through an external or social link, disconnected from any cluster. No important page — least of all a portfolio or case study, which exists specifically to convert — should ever be orphaned; the fix is always the same, link to it from the relevant hub, a related blog post, or the main navigation.

Rich media — images, screenshots, diagrams, and video — does more for a technical solo business than decoration: screenshots and demos are proof assets, and how they're handled affects both SEO and trust. Every meaningful image needs a descriptive filename (`appointment-booking-admin-dashboard.png`, not `IMG_4821.png`), useful alt text that actually describes what's shown and why it matters, a compressed modern format, defined dimensions, and a caption when it adds context that the image alone doesn't convey. Screenshots specifically carry a confidentiality risk that pure decoration doesn't: they need to show a real workflow, interface state, or before/after improvement while never exposing private data, credentials, client secrets, internal URLs, or confidential user information — the same discipline that governs anonymized case studies applies here. Videos need a clear title, short description, a transcript or summary (both for accessibility and because answer engines still need text context — video content is invisible to most crawlers without one), chapters for anything longer than a couple of minutes, and a CTA placed after the video, not just floating nearby.

Architecture diagrams are worth a specific caution: they should show system components, data flow, external services, and security/deployment boundaries with a short accompanying explanation — a diagram with no explanatory text is decoration, not proof, and a decorative diagram with no explanatory value should simply be cut.

## Key Concepts
- **Hub-and-spoke model**: pillar/service page as hub, blogs/guides as educational spokes, case studies as proof spokes, FAQ/checklists as answer spokes, one CTA page as the conversion endpoint.
- **Descriptive anchor text**: "SaaS MVP development service" beats "click here" for both crawler understanding and reader clarity — natural variation is fine, unnatural exact-match repetition is not.
- **The orphan page problem**: any page with no internal links pointing to it — reachable only externally or via sitemap — is invisible in practice regardless of its own content quality.
- **Click-depth discipline**: important pages should be reachable within three to four clicks of the homepage, not buried only in a footer link.
- **Breadcrumbs for hierarchy**: use them for blog posts, case studies, and service subpages, with BreadcrumbList schema when appropriate.
- **Descriptive filenames and alt text**: filenames and alt text should describe the actual content and its purpose, never generic placeholders like "image1" or "screenshot."
- **Screenshots as proof assets with confidentiality risk**: they need to show a real workflow while stripping private data, credentials, and internal URLs — the same discipline as anonymized case studies.
- **Text context for video and diagrams**: transcripts, summaries, and explanatory captions matter because answer engines and many crawlers still rely on surrounding text, not the media itself.

## Example Code
```md
## Hub and Spoke Example

/services/saas-mvp-development                (hub)
  → /blog/how-to-scope-a-saas-mvp              (educational spoke)
  → /blog/saas-mvp-technical-risks             (educational spoke)
  → /case-studies/appointment-platform-mvp     (proof spoke)
  → /contact/project-review                    (conversion endpoint)

## Image and Caption Example

Filename: appointment-booking-admin-dashboard.png
Alt text: Admin dashboard showing appointment slots, booking status, and
          capacity controls.
Caption: Admin view for managing daily appointment capacity and reviewing
         booking status across locations.

## Video Metadata Template

Title: Admin panel walkthrough — approval workflow
Description: A 90-second walkthrough of how requests move from submission
             to approval in the admin panel.
Transcript: [full text transcript below the embed]
CTA (post-video): If your team handles approvals manually, start by
                  mapping the workflow before building software.
```

## When to Use
- When publishing any new page, to plan which hub it connects to and which spokes should link to it before launch
- When auditing a site and finding pages that technically exist but receive no internal links from anywhere
- When adding screenshots or demo videos to a case study, to run the confidentiality check before publishing
- When a page ranks for its target query but conversion is weak, to check whether internal links actually guide the reader toward a CTA
- When creating an architecture diagram, to confirm it has an accompanying explanation rather than standing alone

## Common Mistakes
- Linking randomly from every page to every other page instead of following a deliberate hub-and-spoke structure
- Leaving new case studies or portfolio pages unlinked from any hub or navigation, making them effectively invisible
- Using generic anchor text ("click here," "read more") on links that matter for both users and crawlers
- Publishing screenshots with real client data, credentials, or internal URLs visible
- Embedding video or diagrams with no surrounding text explanation, leaving both crawlers and skimming readers without context

## Further Reading
- Google Search Central's "Site Structure" and "Internal Linking" guidance (developers.google.com/search) — the primary source on how crawlers use internal links
- Nielsen Norman Group's research on information architecture and navigation — practical, evidence-based guidance on structuring a site for real users
- web.dev's image and video optimization guides (web.dev) — current, framework-agnostic detail on formats, compression, and accessible media
