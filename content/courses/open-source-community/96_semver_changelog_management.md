# 96. Semver and Changelog Management

## What It Is
Semantic Versioning (semver) is a three-number versioning scheme (`MAJOR.MINOR.PATCH`) with a specific meaning for each number: the MAJOR version increments when you make breaking changes (existing integrations will break when they upgrade); the MINOR version increments when you add new functionality in a backwards-compatible way; and the PATCH version increments when you fix bugs in a backwards-compatible way. The scheme solves a coordination problem: it tells every downstream consumer, before they upgrade, whether upgrading is safe or requires migration work.

A changelog is a human-readable document that describes what changed in each version of your software. It is not a git log — git commit messages are written for developers who already understand the codebase; changelog entries are written for consumers who need to know whether an upgrade affects them and what they need to do if it does. A good changelog entry for a breaking change includes what changed, why it changed, and what the migration path is. A good changelog entry for a new feature includes what it does and how to use it.

For a SaaS developer, semver and changelogs apply at multiple levels: your internal API (when you version your API endpoints), your boilerplate (if you share it with clients or plan to open-source it), and any npm packages you publish. Even for internal projects, the discipline of writing a changelog entry forces you to categorize every change as breaking, additive, or a fix — which is useful information independent of publishing.


```quiz
- q: "You rename a public function and keep the old name as a deprecated alias. Which number moves?"
  anchor: "the MAJOR version increments when you make breaking changes"
  options:
    - text: "MAJOR \u2014 renaming public API is a breaking change"
      correct: false
      why: "It would be, if the old name were gone. Keeping a working alias means no existing integration breaks on upgrade."
    - text: "MINOR \u2014 new functionality, and nothing existing breaks"
      correct: true
      why: "The new name is added functionality and the old one still works, which is the backwards-compatible case MINOR is for."
    - text: "PATCH \u2014 no behaviour changed for existing callers"
      correct: false
      why: "PATCH is for bug fixes. Adding a new public name is new surface area, even when nothing breaks."

- q: "What coordination problem is semver actually solving?"
  anchor: "tells every downstream consumer, before they upgrade, whether upgrading is safe"
  options:
    - text: "It tells consumers, before upgrading, whether the upgrade needs migration work"
      correct: true
      why: "That is the entire contract: the number is a promise a consumer can act on without reading your diff."
    - text: "It gives maintainers a release cadence to plan around"
      correct: false
      why: "Semver says nothing about when you release, only about what a release means."
    - text: "It lets package managers resolve dependency trees deterministically"
      correct: false
      why: "Lockfiles do that. Semver informs the ranges, but the guarantee it makes is to a human deciding whether to upgrade."
```

## Key Concepts
- **MAJOR.MINOR.PATCH**: `1.0.0` → `2.0.0` for breaking changes, `1.1.0` for new features, `1.0.1` for bug fixes
- **Pre-release identifiers**: `1.0.0-alpha.1`, `1.0.0-beta.2`, `1.0.0-rc.1` — signal that the release is not yet stable; npm installs these only with explicit `@next` or `@alpha` tags
- **`0.x.x` pre-stable period**: All `0.MINOR.PATCH` versions are considered unstable; any minor version can break compatibility; semver's stability guarantees begin at `1.0.0`
- **What counts as a breaking change**: Removing a public API, changing a function signature, changing the shape of a response object, changing environment variable names that consumers configure
- **Keep a Changelog format (keepachangelog.com)**: The most widely adopted changelog format; sections: Added, Changed, Deprecated, Removed, Fixed, Security
- **Conventional Commits**: A commit message format that encodes semver impact — `feat:` = MINOR, `fix:` = PATCH, `feat!:` or `BREAKING CHANGE:` = MAJOR — enables automated changelog generation
- **`changesets` tool**: GitHub's recommended tooling for monorepo version management; generates changelog entries from PR descriptions and automates the publish workflow
- **API versioning vs. package versioning**: API endpoints use URL versioning (`/v1/`, `/v2/`) rather than semver; the concepts are related but the mechanics differ

## Example Code or Template

```template
# CHANGELOG.md — Keep a Changelog Format

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]
Changes staged for the next release are listed here.

### Added
- Tenant-level locale settings (language, timezone, currency)

### Changed
- `notification_mail` service now checks email suppression list before every send

---

## [2.1.0] — 2025-04-15

### Added
- Webhook event deduplication table to prevent double-processing on retry
- `POST /api/webhooks/stripe` now handles `charge.dispute.created` events
- Automatic dispute evidence collection from session logs

### Changed
- Improved error messages when Stripe signature verification fails
- `tenant_session.service` now requires explicit tenant ID parameter (previously inferred)

### Fixed
- Fixed race condition in session token rotation that could issue two valid tokens
- Corrected timezone offset calculation in audit log timestamps

---

## [2.0.0] — 2025-03-01

### BREAKING CHANGES

#### `user_session.token.service` — signature change
**Before:**
\`\`\`typescript
createToken(userId: string): Promise<string>
\`\`\`
**After:**
\`\`\`typescript
createToken(userId: string, tenantId: string): Promise<string>
\`\`\`
**Migration:** Pass the tenant ID as the second argument in all call sites.
Run `grep -r "createToken" src/` to find all locations that need updating.

#### Environment variable renamed
`STRIPE_SECRET` renamed to `STRIPE_SECRET_KEY` to match Stripe's official naming.
Update your `.env` and deployment environment variables.

### Added
- Multi-provider payment abstraction (Stripe, PayPal, Iyzico)
- Formal change request process and CR numbering system

### Removed
- Removed deprecated `getUserByToken()` function (use `getUserSession()` instead)

---

## [1.0.0] — 2025-01-10

Initial stable release.
```

```bash
# Conventional Commits + automated changelog workflow
# with the 'conventional-changelog-cli' tool

# Install
npm install -g conventional-changelog-cli

# Generate changelog from conventional commits since last tag
conventional-changelog -p angular -i CHANGELOG.md -s

# Commit message format for conventional commits:
# feat(auth): add email MFA support
# ^--- type(scope): description
#
# fix(webhook): handle null customer ID in dispute handler
#
# feat!: rename STRIPE_SECRET to STRIPE_SECRET_KEY
# BREAKING CHANGE: environment variable renamed — update all deployments

# Types and their semver impact:
# feat     → MINOR version bump
# fix      → PATCH version bump
# feat!    → MAJOR version bump
# refactor → PATCH (no public API change)
# docs     → no version bump
# chore    → no version bump
# test     → no version bump
```

## When to Use
- When publishing any npm package — semver and a CHANGELOG are prerequisites for the package to be usable by the ecosystem; npm users check changelogs before upgrading
- When versioning your API — add `/v1/` prefix to all routes and maintain the previous version for at least 6 months after deprecating it; the CHANGELOG is your deprecation notice mechanism
- When releasing your boilerplate to clients — even if not on npm, a versioned CHANGELOG tells clients what changed between the version they are running and the current version, enabling them to upgrade safely
- When a breaking change is unavoidable — the MAJOR version bump is the contract; it tells consumers "this requires migration work" before they `npm update`
- When setting up a new project you intend to maintain long-term — initialize `CHANGELOG.md` with `## [Unreleased]` on day one and add entries as you work; retroactively writing a changelog is painful and incomplete

## Common Mistakes
- **Using git tags as a changelog substitute**: `git log v1.0.0..v1.1.0 --oneline` is not a changelog; it contains implementation details written for developers, not adoption decisions written for consumers
- **MAJOR version fear**: Some developers increment MINOR for breaking changes to avoid the scary `2.0.0` number; this breaks the semver contract — downstream consumers who trust semver will have silent breakage; increment MAJOR without hesitation for breaking changes
- **Inconsistent commit messages that prevent automation**: If you adopt Conventional Commits, enforce them with a commit-msg hook (`commitlint`) from day one; a mix of conventional and non-conventional messages makes automated changelog generation produce incomplete output
- **Not documenting the migration path for breaking changes**: A CHANGELOG entry that says "removed X" without explaining what to use instead or how to migrate is worse than no changelog — it tells users something broke without helping them fix it

## Further Reading
- **semver.org** — The full semver specification; short and worth reading completely; the FAQ section addresses edge cases like "what counts as a public API" for libraries
- **keepachangelog.com** — The standard for human-readable changelogs; includes the full format, a manifesto for why automated git log changelogs are insufficient, and examples
- [**Conventional Commits specification](https://conventionalcommits.org)** — The commit message format that enables automated semver calculation and changelog generation; includes examples of all commit types and the BREAKING CHANGE footer syntax

```recall
- q: "State what each of MAJOR, MINOR and PATCH means to a consumer."
  must:
    - "MAJOR \u2014 breaking; existing integrations need migration work"
    - "MINOR \u2014 new functionality, backwards compatible"
    - "PATCH \u2014 bug fix, backwards compatible"

- q: "Why does the scheme exist at all?"
  must:
    - "it is a coordination signal to downstream consumers"
    - "it answers 'is upgrading safe' before anyone reads the diff"
    - "without it every upgrade is an unbounded investigation"

- q: "What belongs in a changelog entry that the version number alone cannot say?"
  must:
    - "what actually changed, in the consumer's language"
    - "what a consumer has to do about it on upgrade"
    - "a link to the migration path for anything breaking"
```
