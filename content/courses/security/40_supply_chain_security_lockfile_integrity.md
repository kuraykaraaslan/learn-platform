# 40. Supply Chain Security — Lockfile, Package Integrity

## Coverage Level
**Not Covered** — You have a `package-lock.json` (good — lockfiles are essential), but there is no CI enforcement of lockfile integrity (`npm ci` vs `npm install`), no subresource integrity (SRI) for CDN scripts, no package provenance verification, and no policy around adding new dependencies.

## What It Is
Supply chain attacks target the software you import rather than your own code. The attack surface is vast: every npm package you install, every transitive dependency of that package, the npm registry itself, the CI/CD tooling that builds your deployment, and the CDN serving your frontend scripts. Several high-profile attacks have used this vector: the `event-stream` package was hijacked to steal Bitcoin wallets, `ua-parser-js` was compromised to mine cryptocurrency, and the `xz-utils` backdoor nearly made it into major Linux distributions.

For a Node.js application, the primary supply chain concern is the npm ecosystem. A compromised package can execute arbitrary code during `npm install` (via `postinstall` scripts), read your environment variables (including `STRIPE_SECRET_KEY`, `DATABASE_URL`), exfiltrate your source code, or inject malicious code into your build artifacts. None of this requires exploiting a vulnerability in your own code — it happens at the infrastructure level.

The defenses layer together: lockfiles pin exact dependency versions and their content hashes, preventing silent upgrades to compromised versions. `npm ci` enforces the lockfile in CI, refusing to install if `package.json` and `package-lock.json` are out of sync. Package provenance (SLSA) allows verifying that a package was built from a specific Git commit by a specific CI system. Two-factor authentication on your own npm packages prevents account hijacking. Minimal permissions on CI systems limit blast radius if a build tool is compromised.

## Key Concepts
- **`package-lock.json`** — Records exact resolved versions and content hashes for every package in the tree; must be committed to version control
- **`npm ci`** — "Clean install": removes `node_modules`, installs exactly what is in the lockfile, fails if lockfile is out of date; use in CI, never `npm install`
- **Content hash** — Each entry in `package-lock.json` includes `integrity: sha512-...`; npm verifies the downloaded tarball matches this hash before installation
- **Subresource Integrity (SRI)** — `<script integrity="sha384-..." src="https://cdn.example.com/lib.js">` — browser verifies the file matches the hash before executing
- **Typosquatting** — Malicious packages with names similar to popular ones (`lodahs`, `expres`, `discordd`); always verify the exact package name before installing
- **SLSA (Supply-chain Levels for Software Artifacts)** — A framework for verifying that packages were built from a specific source with a specific process; npm now supports provenance attestations
- **`npm audit`** — Checks for known CVEs; complements lockfile integrity but does not catch newly compromised packages
- **Minimal install scripts** — `npm install --ignore-scripts` prevents `postinstall` scripts from running; reduces but does not eliminate risk (some legitimate packages require install scripts)

## Example Code
```yaml
# .github/workflows/ci.yml — enforce lockfile and verify integrity in CI

name: CI

on: [push, pull_request]

jobs:
  install-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # npm ci — CRITICAL: use this in CI, never npm install
      # - Deletes node_modules and installs fresh from lockfile
      # - Fails if package.json and package-lock.json are out of sync
      # - Verifies integrity hashes for every installed package
      - name: Install dependencies (strict lockfile enforcement)
        run: npm ci

      # Fail on high/critical CVEs
      - name: Security audit
        run: npm audit --audit-level=high

      - name: Build
        run: npm run build
```

```json
// .npmrc — enforce integrity checks and prevent accidental publishing
{
  "// comment": "These settings apply to all npm commands in this project"
}
```

```ini
; .npmrc — project-level npm configuration
; Require HTTPS for all registry communication
registry=https://registry.npmjs.org/

; Verify integrity of packages (this is the default, but be explicit)
package-lock=true

; Prevent accidental publish of private packages to npm
; Remove this line if you publish packages
; private=true is in package.json, which is more reliable

; Audit on install (npm v7+)
audit=true

; Prevent postinstall scripts from running automatically during CI
; Note: some packages require this; test before enabling in production
; ignore-scripts=true
```

```typescript
// scripts/check-new-deps.ts
// Run before merging any PR that adds a new dependency.
// Checks if the package is well-maintained.

import { execSync } from 'child_process';

interface PackageInfo {
  name: string;
  version: string;
  description: string;
  time: { created: string; modified: string };
  'dist-tags': { latest: string };
  maintainers: { name: string }[];
}

async function auditNewPackage(packageName: string): Promise<void> {
  // Check npm metadata
  const output = execSync(`npm view ${packageName} --json`).toString();
  const info: PackageInfo = JSON.parse(output);

  const lastModified = new Date(info.time.modified);
  const daysSinceUpdate = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);

  console.log(`Package: ${info.name}@${info['dist-tags'].latest}`);
  console.log(`Last published: ${lastModified.toDateString()} (${Math.round(daysSinceUpdate)} days ago)`);
  console.log(`Maintainers: ${info.maintainers.map(m => m.name).join(', ')}`);

  // Flags
  if (daysSinceUpdate > 365) {
    console.warn('WARNING: Package has not been updated in over a year');
  }
  if (info.maintainers.length === 1) {
    console.warn('WARNING: Single-maintainer package — higher hijack risk');
  }

  // Check for known vulnerabilities
  execSync(`npm audit --json | node -e "
    const r=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const vuln=r.vulnerabilities?.['${packageName}'];
    if(vuln) console.error('VULNERABILITY FOUND:', JSON.stringify(vuln,null,2));
  "`, { stdio: 'inherit' });
}

// Usage: npx ts-node scripts/check-new-deps.ts lodash
auditNewPackage(process.argv[2]);
```

## When to Use
- Switch from `npm install` to `npm ci` in your CI pipeline immediately — this is a no-cost, high-value change
- Before adding any new package: check the download count, last publish date, maintainer count, and whether it has an `install` script
- When upgrading a major version of a security-critical package (jsonwebtoken, bcrypt, express): review the changelog for breaking changes in security behavior
- Add SRI to any CDN script tags in your HTML — your CSP policy (item 35) and SRI together make external scripts much harder to tamper with

## Common Mistakes
- **Not committing `package-lock.json`** — Some teams add it to `.gitignore`; this means CI installs different versions on every run and there is no integrity guarantee
- **Using `npm install` in CI** — This can silently update packages within the semver range, bypassing the lockfile's integrity guarantees; always use `npm ci`
- **Ignoring the `integrity` hash in PRs** — When a PR updates `package-lock.json`, the changed `integrity` fields are the actual security-relevant change; review them, not just the version number
- **Publishing your own packages without 2FA** — If you maintain any npm packages, enable 2FA on your npm account; a compromised npm account is a supply chain attack against your own users

## Further Reading
- [npm documentation: package-lock.json and `npm ci`](https://docs.npmjs.com/cli/v10/commands/npm-ci)
- [SLSA — Supply-chain Levels for Software Artifacts](https://slsa.dev/)
- [Socket.dev — real-time supply chain risk analysis for npm](https://socket.dev/)
