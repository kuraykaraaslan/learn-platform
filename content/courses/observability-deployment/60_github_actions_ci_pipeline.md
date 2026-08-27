# 60. GitHub Actions CI Pipeline — Lint, Test, Build, Deploy Automation

## What It Is
A CI (Continuous Integration) pipeline is an automated workflow that runs every time you push code: it lints for style issues, runs your test suite, builds the application, and optionally deploys it — all before anything reaches production. The value is not just automation; it is the forcing function that catches regressions immediately, when the fix is a one-line change, not three days later when you have no idea what introduced the bug.

GitHub Actions is the CI/CD platform built into GitHub. It uses YAML workflow files in `.github/workflows/` that define when to trigger (push, pull request, schedule), what runner to use (Ubuntu, macOS, Windows), and what steps to execute. You get 2,000 free minutes per month on public repos and 2,000 minutes on private repos on the free tier.

For your Next.js SaaS, a minimal but effective pipeline has four jobs that run in order: `lint` (ESLint + TypeScript type-check), `test` (unit and integration tests), `build` (ensure `next build` succeeds), and `deploy` (push Docker image, trigger Kubernetes rollout or Railway deploy). Each job is a gate: if lint fails, test and build do not run. This means you get fast feedback on cheap checks before spending time on expensive ones.

Even without a test suite today (item 71 covers this gap), setting up the pipeline now means you have infrastructure ready the moment you write your first test.

## Key Concepts
- **Workflow** — a YAML file in `.github/workflows/`; one workflow = one automated process
- **Job** — a set of steps that run on the same runner machine; jobs run in parallel by default unless you specify `needs:`
- **Step** — a single action or shell command within a job
- **`needs:`** — creates a dependency between jobs; `test` won't run until `lint` succeeds
- **`actions/cache`** — caches `node_modules` or `.next/cache` between runs; the single biggest speed improvement
- **Matrix builds** — run the same job against multiple Node.js versions or OS combinations in parallel
- **Secrets** — encrypted key-value pairs stored in GitHub repo settings; referenced as `${{ secrets.MY_SECRET }}`
- **Environments** — named deploy targets (staging, production) with approval gates and scoped secrets
- **`on: pull_request`** — triggers on every PR; never merges code that breaks the build

## Example Code
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ── Job 1: Lint and type-check ──────────────────────────────────────────────
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'  # caches node_modules based on package-lock.json hash

      - run: npm ci

      - name: TypeScript type-check
        run: npx tsc --noEmit

      - name: ESLint
        run: npm run lint

  # ── Job 2: Tests ────────────────────────────────────────────────────────────
  test:
    runs-on: ubuntu-latest
    needs: lint  # only run tests if lint passes

    services:
      # Spin up a real PostgreSQL for integration tests
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: boilerplate_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    env:
      SYSTEM_DATABASE_URL: postgresql://test:test@localhost:5432/boilerplate_test
      TENANT_DATABASE_URL: postgresql://test:test@localhost:5432/boilerplate_test
      ACCESS_TOKEN_SECRET: ci-test-secret-min-32-chars-long!!
      REFRESH_TOKEN_SECRET: ci-test-secret-min-32-chars-long!!
      CSRF_SECRET: ci-test-csrf-secret-long-enough!!
      REDIS_HOST: localhost

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage --ci  # jest or vitest

  # ── Job 3: Build ────────────────────────────────────────────────────────────
  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - name: Next.js build
        run: npm run build
        env:
          # Non-secret build-time env vars — real secrets stay out of build
          NEXT_PUBLIC_APP_URL: https://app.yourdomain.com

  # ── Job 4: Docker build and push (only on main branch) ─────────────────────
  docker:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'

    permissions:
      contents: read
      packages: write  # required to push to GitHub Container Registry

    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}  # auto-provided by Actions

      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha   # layer cache between runs
          cache-to: type=gha,mode=max
```

## When to Use
1. **Every project with more than one week of work invested** — the ROI on a 30-minute CI setup pays off on day one when it catches a typo that would have broken production.
2. **Pre-merge quality gate** — protect the `main` branch with a rule that requires the CI workflow to pass before any PR can be merged.
3. **Automated Docker builds** — instead of building images locally and pushing manually, let CI produce a deterministic image from a clean environment on every merge to main.
4. **Scheduled jobs** — use `on: schedule: cron: '0 2 * * *'` to run database backup checks, dependency audits (`npm audit`), or Lighthouse performance scans nightly.
5. **Dependency updates** — combine with Dependabot to automatically open PRs for dependency updates; CI validates them automatically.

## Common Mistakes
- **Caching `node_modules` without busting the cache** — use `actions/setup-node` with `cache: 'npm'`; it automatically invalidates the cache when `package-lock.json` changes.
- **Hardcoding secrets in the workflow file** — every secret must be in `${{ secrets.NAME }}`; workflow files are committed to the repo and visible to anyone with repo access.
- **Not pinning action versions** — `uses: actions/checkout@v4` is safer than `@main`; a malicious or accidental change to an unpinned action runs in your CI with access to your secrets.
- **Running all jobs in parallel without `needs:`** — if lint and tests fail, you waste minutes building a Docker image that should never have been built.

## Further Reading
- GitHub Actions documentation: https://docs.github.com/en/actions
- Caching dependencies in GitHub Actions: https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows
- GitHub Actions security hardening: https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions
