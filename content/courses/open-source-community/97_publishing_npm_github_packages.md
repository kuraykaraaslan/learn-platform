# 97. Publishing npm / GitHub Packages

## What It Is
Publishing to npm (Node Package Manager) means making a JavaScript or TypeScript package available to anyone in the world via `npm install`. The npm registry is the world's largest software registry, hosting over two million packages. Publishing a package does not require any approval process or review — you create an account, authenticate your CLI, and run `npm publish`. The barrier is technical, not administrative.

GitHub Packages (GitHub Container Registry / GitHub npm Registry) is an alternative registry integrated with GitHub. It hosts packages scoped to a GitHub user or organization (`@yourusername/package-name`) and is authenticated via GitHub personal access tokens. GitHub Packages is the right choice for private packages that you want to share across your own repositories without making them public on npm. It is also the right choice for packages that are tightly coupled to a specific GitHub organization.

For most utility packages you intend to make public, npm is the correct registry — it has broader tooling support, better CDN caching, and is the default for `npm install`. For internal tools you want to share across multiple client project repositories without making them public, GitHub Packages is the correct choice. The mechanics of both are nearly identical; the main difference is authentication configuration and the registry URL in your `package.json`.

## Key Concepts
- **npm account**: Required for publishing to the public registry; create at npmjs.com; enable 2FA before publishing your first package
- **Scoped packages**: `@yourusername/package-name` — scoped packages prevent name collisions and signal authorship; required for GitHub Packages, optional but recommended for npm
- **Public vs. private packages**: All packages are public by default on npm; private packages require a paid npm account; GitHub Packages provides private hosting for free within storage limits
- **`files` field in package.json**: Specifies which files are included in the published package; always use this instead of `.npmignore` — it is an allowlist (more explicit and safer than a denylist)
- **`prepublishOnly` script**: Runs before every `npm publish` — use it to build the TypeScript output and run tests; prevents publishing broken packages
- **Access tokens for CI**: Never use your personal credentials in CI; create a `publish` npm access token with automation type and store it as `NPM_TOKEN` in your GitHub repository secrets
- **Dry run**: `npm publish --dry-run` shows exactly what will be published without publishing it; run this before every real publish
- **Provenance (npm 2023+)**: `npm publish --provenance` links the published package to its source code commit via a signed attestation; enables consumers to verify the package was built from the stated source

## Example Code or Template

```bash
# ============================================================
# ONE-TIME SETUP
# ============================================================

# 1. Create npm account at npmjs.com, then authenticate
npm login
# Follow prompts for username, password, email, OTP

# 2. Enable 2FA on your npm account (security requirement for public packages)
# Do this at: npmjs.com → Account Settings → Two-Factor Authentication

# 3. Create a publish token for CI (automation type, no 2FA bypass needed)
# npmjs.com → Access Tokens → Generate New Token → Automation
# Store the token as NPM_TOKEN in GitHub repository secrets

# ============================================================
# PACKAGE SETUP
# ============================================================

mkdir my-package && cd my-package
npm init -y

# Install build tooling (tsup is the simplest TypeScript build tool for packages)
npm install --save-dev tsup typescript vitest

# Set up tsconfig for library output
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
EOF
```

```json
// package.json — critical fields for a publishable package
{
  "name": "@yourusername/your-package",
  "version": "0.1.0",
  "description": "Brief description for npm search",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
    }
  },
  "files": ["dist", "README.md", "CHANGELOG.md"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit",
    "prepublishOnly": "npm run lint && npm run build && npm test"
  },
  "keywords": ["your", "relevant", "keywords"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/your-package"
  },
  "bugs": { "url": "https://github.com/yourusername/your-package/issues" },
  "homepage": "https://github.com/yourusername/your-package#readme",
  "publishConfig": { "access": "public" }
}
```

```yaml
# .github/workflows/release.yml
# Automated publish on version tag push

name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # required for --provenance

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci

      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

```bash
# ============================================================
# PUBLISHING WORKFLOW (per-release)
# ============================================================

# 1. Update version (picks semver type: patch, minor, or major)
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.1 → 0.2.0
npm version major   # 0.2.0 → 1.0.0

# 2. Dry-run to verify what will be published
npm publish --dry-run
# Review the output: every file in dist/ should be listed; no src/ or tests/

# 3. Publish (or push the version tag to trigger CI)
npm publish --access public

# 4. Verify the published package
npm view @yourusername/your-package
# Should show version, description, and dist-tags

# ============================================================
# GITHUB PACKAGES SETUP (for private packages)
# ============================================================

# In package.json, add:
# "publishConfig": { "registry": "https://npm.pkg.github.com" }

# Create .npmrc in the project root:
# //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
# @yourusername:registry=https://npm.pkg.github.com

# Publish with a GitHub token that has packages:write permission
GITHUB_TOKEN=your_token npm publish
```

## When to Use
- When you have extracted a reusable utility that you paste between client projects — publish it as a private scoped package on GitHub Packages so you can `npm install @yourusername/util` instead of copying files
- When you have finished an OSS tool (see item 95) and want to make it installable — the npm publish workflow is the final step after writing the README and setting up CI
- When a client project requires a custom module that multiple developers on their team will use — publishing it as a private GitHub Package is cleaner than importing via file path or git submodule
- When you version your boilerplate for reuse across client engagements — semantic versioning + npm or GitHub Packages gives you `npm install @yourusername/boilerplate@2.1.0` for reproducible project setup
- When migrating from copying code between projects to a proper monorepo — npm workspaces + local packages is the first step before publishing to any registry

## Common Mistakes
- **Publishing `src/` instead of `dist/`**: The `files` field in `package.json` determines what is published; if you omit it, the entire repository is published including source, tests, and node_modules — use `"files": ["dist"]` always
- **Not building before publishing**: Forgetting to rebuild after the last code change means you publish stale compiled output; the `prepublishOnly` script that runs `build` prevents this
- **Publishing with a personal access token in CI**: Personal tokens have the permissions of your entire account; use an automation-type npm token scoped to the specific package for CI; rotate it when a workflow file changes
- **No version in the `v*` tag**: The convention is `v1.2.3` (with the `v` prefix) for release tags; the `npm version` command creates tags with the `v` prefix automatically; workflows filtering `v*` will miss tags without it

## Further Reading
- [**npm Documentation: Creating and Publishing Packages](https://docs.npmjs.com)** — The authoritative reference; the sections on package.json `exports` field and provenance attestation are worth reading even if you have published before
- [**`tsup` documentation](https://tsup.egoist.dev)** — The simplest TypeScript build tool for libraries; replaces Rollup + tsc for most package use cases; the configuration section covers dual ESM/CJS output and type declarations
- **"Publishing TypeScript Packages" — Matt Pocock (total-typescript.com)** — The most current guide to the package.json `exports` field configuration for TypeScript packages that support both ESM and CJS consumers
