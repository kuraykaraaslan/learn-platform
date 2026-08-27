# 95. Publishing and Maintaining Your Own Open Source Tool

## What It Is
Publishing your own open source tool means taking something you built for your own use, extracting it into a reusable form, and releasing it publicly under an open source license. The "tool" does not have to be ambitious — a well-documented npm package that solves one specific problem well is more impactful than a poorly-documented framework that attempts to solve ten. The goal is not to build the next React; it is to be visible and credible in the specific technical niche you occupy.

Maintaining an OSS project means handling incoming issues, reviewing PRs from the community, keeping dependencies updated, publishing new versions with changelogs, and communicating clearly when the project is being actively maintained versus archived. Maintenance is where most developers underestimate the commitment: the initial release is 10% of the total effort; keeping it useful over two years is the remaining 90%. This is why scoping your first OSS project tightly is critical — maintain one small package well rather than abandoning a large one.

The strategic value for a solo developer running a software company is significant. A well-maintained open source tool in your niche is the most durable form of content marketing: it is indexed by search engines, linked from StackOverflow answers, referenced in conference talks, and discovered by exactly the kind of technical decision-maker who can become your next client. "Built by the author of X" is a more powerful signal than "three years of full-stack experience."

## Key Concepts
- **Extraction candidate**: Any module in your codebase that solves a problem generic enough to be useful outside your specific application — tenant isolation patterns, webhook signature verification, multi-provider email abstraction
- **Repository structure for an npm package**: `src/`, `dist/`, `README.md`, `CHANGELOG.md`, `LICENSE`, `package.json`, `.github/workflows/` for CI — have these before the first release
- **License choice**: MIT (permissive, most widely adopted for libraries), Apache 2.0 (permissive with patent protection), or AGPL (copyleft — forces commercial users to open source their changes); MIT is correct for most utility libraries
- **Semantic versioning (semver)**: `MAJOR.MINOR.PATCH` — breaking changes increment MAJOR; new backwards-compatible features increment MINOR; bug fixes increment PATCH; this is covered in detail in item 96
- **npm publication workflow**: `npm publish` from a clean working tree after bumping the version and building the `dist/` output
- **GitHub Actions for CI**: Automated test runs on push/PR, automated release on tag — these are expected by the community and take 30 minutes to set up
- **Health indicators**: Stars, downloads/week (npm), open issues, time since last release, and whether the README answers "what does this do and how do I use it in 60 seconds" — these determine whether a new user adopts your tool or finds an alternative
- **Sponsorship and sustainability**: GitHub Sponsors and Open Collective let users fund your maintenance time; if a tool gets significant adoption, add a sponsor button early

## Example Code or Template

````markdown
# Publishing Checklist — npm Package Release

## Before Writing the First Line of Code

- [ ] Name check: `npm search [your-package-name]` — is the name available?
- [ ] Scope decision: scoped package (`@yourusername/package-name`) or global?
  → Scoped is better for personal packages; global names must be unique across npm
- [ ] License decided: MIT for utility libraries
- [ ] Problem statement written in one sentence:
  > "This package does X for developers who Y."

---

## Repository Structure

```
your-package/
├── src/
│   └── index.ts          # main entry point
├── dist/                 # built output (gitignored, published to npm)
├── tests/
│   └── index.test.ts
├── .github/
│   └── workflows/
│       ├── ci.yml        # run tests on PR
│       └── release.yml   # publish on tag push
├── README.md             # the most important file
├── CHANGELOG.md          # keep this from day one
├── LICENSE               # MIT
├── package.json
└── tsconfig.json
```

---

## package.json Essentials

```json
{
  "name": "@yourusername/your-package",
  "version": "0.1.0",
  "description": "One sentence description",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "test": "vitest run",
    "prepublishOnly": "npm run build && npm test"
  },
  "keywords": ["typescript", "saas", "your-specific-niche"],
  "license": "MIT",
  "repository": { "type": "git", "url": "https://github.com/you/your-package" }
}
```

---

## README Structure (the most important file)

```markdown
# package-name

One sentence: what it does. One sentence: who it's for.

## Install

\`\`\`bash
npm install @yourusername/your-package
\`\`\`

## Quick Start

[The 10-line example that shows the most important use case.
This is what developers copy-paste to decide if they want to use your package.]

## API Reference

[One section per exported function/class. Signature + example + description.]

## Why This Exists

[One paragraph: what alternatives exist, why they were insufficient, what you built instead.
This section earns credibility and filters for the right audience.]

## Contributing

[Link to CONTRIBUTING.md or 2-sentence instructions]

## License

MIT
```

---

## First Release Steps

```bash
# 1. Create npm account and authenticate
npm login

# 2. Build and verify the dist output
npm run build
ls dist/  # should contain index.js, index.mjs, index.d.ts

# 3. Dry-run to see what will be published
npm publish --dry-run

# 4. Publish
npm publish --access public   # required for scoped packages

# 5. Create GitHub release with tag
git tag v0.1.0
git push origin v0.1.0
# Create a release on GitHub with the CHANGELOG content for this version
```

---

## Maintenance Cadence (minimum viable maintenance)

| Task                              | Frequency  |
|-----------------------------------|-----------|
| Respond to issues (even to triage)| Weekly     |
| Review and merge valid PRs        | Bi-weekly  |
| Security audit of dependencies    | Monthly    |
| Minor/patch releases              | As needed  |
| Major version with migration guide| Quarterly  |
| Archive notice if unmaintained    | When needed (don't ghost) |
````

## When to Use
- When you find yourself copy-pasting the same module across multiple client projects — the extraction point is when you paste it the second time, not the fifth
- When you have written an internal RFC or blog post about a technical pattern you use — the post audience and the package audience are the same people; publish both together
- When a client project ends and leaves you with a general-purpose module that is not proprietary — extract it before the context fades
- When you want to establish credibility in a specific niche (multi-tenant SaaS, TypeScript tooling, Next.js middleware) — one well-maintained package in that niche is more credible than any amount of self-description
- When you are between client projects and have 2–3 weeks of slack time — channel that time into an extraction and initial release rather than side projects that never ship

## Common Mistakes
- **Building a framework instead of a tool**: A framework requires users to structure their application around it; a tool has a clear input and output and fits into any structure; start with a tool — frameworks require adoption at a level that takes years
- **Publishing without a README**: A package with no documentation gets no adoption; write the README before the code (README-driven development is legitimate) so you are clear on the interface before you implement it
- **Not setting expectations about maintenance**: A repository with open issues and no response for 6 months looks abandoned even if you check in occasionally; add an explicit maintenance badge (`maintained: yes/limited/no`) and close issues that are out of scope
- **Scope expansion under community pressure**: When your small, well-focused tool starts getting stars, community members will open issues requesting features that expand the scope; it is healthy to say "that is out of scope for this package — here is why" in the issue

## Further Reading
- [**"Small, Sharp Software Tools" — Mike Perham](https://mikeperham.com)** — Essay on the philosophy of building focused, well-maintained tools rather than ambitious frameworks; the reference for thinking about scope
- [**`tsup` documentation](https://tsup.egoist.dev)** — The fastest way to build a TypeScript npm package with ESM and CJS output and type declarations; used by the majority of new TypeScript packages in 2024–2025
- **"Maintainer's Guide to Staying Positive" — Josh Comeau and others** — Resources on handling the psychological load of public-facing OSS maintenance; important before you release something that gets significant adoption
