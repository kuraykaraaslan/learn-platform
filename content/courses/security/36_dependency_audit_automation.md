# 36. Dependency Audit Automation (npm audit, Snyk, Dependabot)

## What It Is
Your application's security posture is not just about the code you write — it is also about the code you import. npm packages have CVEs (Common Vulnerabilities and Exposures) published against them just like operating systems and databases do. A vulnerability in `jsonwebtoken` (CVE-2022-23529, authentication bypass in certain configurations) or in a transitive dependency can be just as exploitable as a bug you wrote yourself. The difference is that dependency vulnerabilities are fixed by the upstream maintainer, and your job is to stay current.

Dependency audit automation means: (1) continuously checking whether any of your dependencies have published CVEs, (2) automatically opening PRs to update vulnerable dependencies, and (3) blocking deployments when critical vulnerabilities are found and unpatched. This is a category that takes one afternoon to set up and then runs itself, but the setup is almost never done until something goes wrong.

The tool landscape is: `npm audit` is the built-in, free, runs locally and in CI, uses the npm advisory database. Snyk adds more intelligence (it can detect vulnerabilities that npm audit misses, and it provides fix advice), has a free tier, and integrates with GitHub as a PR check. GitHub Dependabot is integrated directly into GitHub repositories and automatically opens PRs to update vulnerable packages — this is the lowest-friction option if you are on GitHub.

## Key Concepts
- **CVE** — Common Vulnerabilities and Exposures; a numbered, publicly documented security vulnerability in a specific software version
- **`npm audit`** — Scans `package-lock.json` against the npm vulnerability database; outputs severity levels (info/low/moderate/high/critical)
- **`npm audit fix`** — Automatically updates packages to the nearest non-vulnerable version that satisfies your semver range
- **`npm audit fix --force`** — Updates to the latest version even if it requires breaking semver; use with caution and test thoroughly
- **Snyk** — Commercial tool with a free tier; broader vulnerability database than npm, license risk detection, detailed fix guidance
- **Dependabot** — GitHub service; monitors your dependency graph and opens PRs when new versions are released or CVEs are published
- **Lockfile integrity** — `package-lock.json` pins exact versions and hashes; CI should run `npm ci` (not `npm install`) to enforce the lockfile
- **Transitive vulnerability** — A CVE in a dependency of your dependency; these are harder to control and require `npm audit fix` or manual resolution overrides

## Example Code
```jsonc
// package.json — add audit scripts
{
  "scripts": {
    "audit:check": "npm audit --audit-level=high",
    "audit:fix": "npm audit fix",
    "audit:report": "npm audit --json > audit-report.json"
  }
}
```

```yaml
# .github/workflows/security.yml
# Runs on every push and PR; blocks merge on high/critical CVEs

name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Run daily at 08:00 UTC to catch newly published CVEs
    - cron: '0 8 * * *'

jobs:
  npm-audit:
    name: npm audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # Use npm ci — installs EXACTLY what is in package-lock.json
      # Fails if lock file is out of sync with package.json
      - run: npm ci

      # Fail the build on high or critical severity CVEs
      - run: npm audit --audit-level=high
        # To get a JSON report for archiving:
        # run: npm audit --json > audit-report.json || true

  snyk:
    name: Snyk vulnerability scan
    runs-on: ubuntu-latest
    # Only run if SNYK_TOKEN is available (not on forks)
    if: ${{ secrets.SNYK_TOKEN != '' }}
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

```yaml
# .github/dependabot.yml — automatically open PRs for security updates

version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"       # Check every week; use "daily" for high-risk projects
      day: "monday"
      time: "09:00"
      timezone: "Europe/Istanbul"
    # Only security updates to keep PR noise low
    open-pull-requests-limit: 10
    # Group all non-security updates into one PR to reduce review burden
    groups:
      all-non-security:
        update-types:
          - "minor"
          - "patch"
    labels:
      - "dependencies"
      - "automated"
    reviewers:
      - "your-github-username"
```

```typescript
// scripts/audit-check.ts — programmatic audit check for pre-deploy hooks
import { execSync } from 'child_process';

try {
  execSync('npm audit --audit-level=high', { stdio: 'inherit' });
  console.log('[Audit] No high/critical vulnerabilities found');
} catch {
  console.error('[Audit] High or critical vulnerabilities detected. Deployment blocked.');
  process.exit(1);
}
```

## When to Use
- Set up Dependabot (5-minute YAML file) immediately — there is no reason not to have it
- Add `npm audit --audit-level=high` to your CI pipeline before your next deploy
- Run `npm audit` manually whenever you `npm install` a new package
- Set up the `schedule` trigger in CI to catch CVEs published after your last dependency update

## Common Mistakes
- **`npm install` in CI instead of `npm ci`** — `npm install` can update the lockfile silently; `npm ci` enforces it and is reproducible
- **Ignoring moderate-severity findings indefinitely** — Most breaches involve CVEs that were "only" moderate at first; review and triage regularly
- **Not pinning exact versions for security-critical packages** — Use `~` or `^` conservatively for packages like `jsonwebtoken` and `bcrypt`; Dependabot handles the updates
- **Bulk-dismissing Dependabot PRs** — Each PR represents a real published patch; auto-merge patch updates after tests pass rather than closing them

## Further Reading
- [npm audit documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [GitHub Dependabot documentation](https://docs.github.com/en/code-security/dependabot)
- [Snyk for Node.js / Next.js](https://docs.snyk.io/products/snyk-open-source/language-and-package-manager-support/snyk-for-nodejs)
