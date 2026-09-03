# 289. Internal Linking, Information Architecture and Rich Media SEO

## What It Is
Internal linking is how both users and search systems understand the relationships between pages, and it's also how authority flows from strong pages toward the pages that need to convert. The working model is hub-and-spoke: a pillar or service page is the hub, blog posts and guides are educational spokes, case studies are proof spokes, FAQ/checklist pages are answer spokes, and a CTA page is the conversion endpoint everything eventually points toward. Anchor text carries real weight in this system — descriptive anchors ("SaaS MVP development service," "admin panel case study") tell both readers and crawlers what the destination is about, while generic anchors ("click here," "read more") waste the opportunity entirely. The single most damaging and most avoidable internal-linking failure is the orphan page: a page that exists in the sitemap but that no other page actually links to, reachable only through an external or social link, disconnected from any cluster. No important page — least of all a portfolio or case study, which exists specifically to convert — should ever be orphaned; the fix is always the same, link to it from the relevant hub, a related blog post, or the main navigation.

Rich media — images, screenshots, diagrams, and video — does more for a technical solo business than decoration: screenshots and demos are proof assets, and how they're handled affects both SEO and trust. Every meaningful image needs a descriptive filename (`appointment-booking-admin-dashboard.png`, not `IMG_4821.png`), useful alt text that actually describes what's shown and why it matters, a compressed modern format, defined dimensions, and a caption when it adds context that the image alone doesn't convey. Screenshots specifically carry a confidentiality risk that pure decoration doesn't: they need to show a real workflow, interface state, or before/after improvement while never exposing private data, credentials, client secrets, internal URLs, or confidential user information — the same discipline that governs anonymized case studies applies here. Videos need a clear title, short description, a transcript or summary (both for accessibility and because answer engines still need text context — video content is invisible to most crawlers without one), chapters for anything longer than a couple of minutes, and a CTA placed after the video, not just floating nearby.

Architecture diagrams are worth a specific caution: they should show system components, data flow, external services, and security/deployment boundaries with a short accompanying explanation — a diagram with no explanatory text is decoration, not proof, and a decorative diagram with no explanatory value should simply be cut.

```quiz
- q: "Your best article sits in the sitemap with no internal links pointing at it. How does it do?"
  anchor: "is invisible in practice regardless of its own content quality"
  options:
    - text: "Fine — the sitemap guarantees discovery"
      correct: false
      why: "Discovery is not visibility. An orphan page is invisible in practice whatever its quality."
    - text: "Poorly — that is an orphan page"
      correct: true
      why: "No internal links means nothing on the site signals that the page matters."
    - text: "Fine, as long as it has external backlinks"
      correct: false
      why: "Reachable only externally is one of the two orphan cases named."

- q: "Should every internal link to your service page use identical anchor text?"
  anchor: "natural variation is fine, unnatural exact-match repetition is not"
  options:
    - text: "Yes — consistency reinforces the keyword"
      correct: false
      why: "Unnatural exact-match repetition is the case explicitly ruled out."
    - text: "No — descriptive, with natural variation"
      correct: true
      why: "\"SaaS MVP development service\" beats \"click here\"; repeating one string verbatim everywhere is the opposite extreme."
    - text: "It does not matter — anchor text is no longer a ranking input"
      correct: false
      why: "It serves both crawler understanding and reader clarity."

- q: "A screenshot from a client project, used as a proof asset. What is required?"
  anchor: "they need to show a real workflow while stripping private data, credentials, and internal URLs"
  options:
    - text: "Blur the whole interface so nothing identifiable survives"
      correct: false
      why: "Then it proves nothing. It still has to show a real workflow."
    - text: "Show the real workflow, and strip private data, credentials and internal URLs"
      correct: true
      why: "The same discipline as an anonymized case study."
    - text: "Written client permission is the only requirement"
      correct: false
      why: "Permission is not a substitute for stripping credentials out of the image."
```

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
- **Every page links to every other page with no real structure behind it** — Linking randomly from every page to every other page instead of following a deliberate hub-and-spoke structure
- **A new case study goes live with no link to it from any hub or nav menu** — Leaving new case studies or portfolio pages unlinked from any hub or navigation, making them effectively invisible
- **A link's anchor text just says "click here"** — Using generic anchor text ("click here," "read more") on links that matter for both users and crawlers
- **A published screenshot has real client data or credentials visible in the background** — Publishing screenshots with real client data, credentials, or internal URLs visible
- **A video or diagram is embedded with no surrounding text explaining what it shows** — Embedding video or diagrams with no surrounding text explanation, leaving both crawlers and skimming readers without context

## Further Reading
- [Google Search Central's "Site Structure" and "Internal Linking" guidance](https://developers.google.com/search) — the primary source on how crawlers use internal links
- Nielsen Norman Group's research on information architecture and navigation — practical, evidence-based guidance on structuring a site for real users
- [web.dev's image and video optimization guides](https://web.dev) — current, framework-agnostic detail on formats, compression, and accessible media

```recall
- q: "Describe the hub-and-spoke model."
  must:
    - "the pillar or service page is the hub"
    - "blogs and guides are educational spokes, case studies are proof spokes, FAQ and checklists are answer spokes"
    - "one CTA page is the conversion endpoint"

- q: "State the click-depth rule, and say where breadcrumbs go."
  must:
    - "important pages should be reachable within three to four clicks of the homepage, not buried in a footer link"
    - "breadcrumbs on blog posts, case studies and service subpages, with BreadcrumbList schema where appropriate"

- q: "Why do video and diagrams need text context?"
  must:
    - "transcripts, summaries and explanatory captions"
    - "answer engines and many crawlers still rely on the surrounding text, not the media itself"
```
