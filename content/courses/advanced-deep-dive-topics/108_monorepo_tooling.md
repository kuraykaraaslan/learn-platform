# 108. Monorepo Tooling — Turborepo and Nx

## What It Is
A monorepo is a single repository containing multiple packages or applications that can share code, configuration, and tooling. The alternative — polyrepo — means each project is independent, which works until you have shared code that diverges across repos, configuration that needs to be kept in sync, or a change that touches multiple projects simultaneously.

Turborepo (by Vercel) and Nx are the two dominant monorepo tools for JavaScript/TypeScript. Both add a build pipeline with caching: if nothing changed in a package, the cached build output is used instead of rebuilding. Turborepo is simpler and integrates naturally with Next.js. Nx is more powerful with a richer plugin ecosystem and code generation.

The main benefit is not the caching — it's colocation. When your UI component library (`01_NextJS_Components`) and your application (`next-boilerplate`) are in the same repo, a change to a component and the application that uses it is a single atomic commit. No publish → update version → install cycle. No version drift.

## Key Concepts
- **Workspace**: A package within the monorepo. Each has its own `package.json`. npm/pnpm/yarn workspaces link them together.
- **Task pipeline**: The dependency graph of build tasks. Turborepo's `turbo.json` defines that `build` in app A must wait for `build` in package B (because A depends on B).
- **Remote cache**: Turborepo can cache build artifacts in Vercel's cloud (or self-hosted). A clean CI machine hits the cache and skips rebuilding unchanged packages.
- **Affected**: Nx can determine which packages are affected by a change — only run tests for those. Critical for large monorepos.
- **Internal packages**: Shared code (`@myapp/ui`, `@myapp/utils`) published internally within the monorepo. No npm publish needed — workspaces resolve them directly.
- **Boundary enforcement**: Nx can enforce that `ui` packages don't import from `api` packages. Prevents accidental coupling.
- **Code generation**: Nx generators scaffold new modules/packages to match your conventions. Similar to `generate-modules.ts` you already have.

## Example Code

```
my-company/
├── apps/
│   ├── next-boilerplate/          # your main SaaS app
│   └── ejs-components/            # your EJS/Express app
├── packages/
│   ├── ui/                        # shared React components (from 01_NextJS_Components)
│   │   ├── package.json           # name: "@company/ui"
│   │   └── src/
│   ├── config-eslint/             # shared ESLint config
│   └── config-typescript/         # shared tsconfig base
├── turbo.json
└── package.json                   # root workspace config
```

```json
// turbo.json — defines the build pipeline
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],   // build dependencies before this package
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,            // never cache dev server
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

```json
// packages/ui/package.json
{
  "name": "@company/ui",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

```json
// apps/next-boilerplate/package.json (relevant part)
{
  "dependencies": {
    "@company/ui": "*"   // workspace:* in pnpm — resolves to local package
  }
}
```

```bash
# Run commands across all packages
npx turbo build          # build everything, in dependency order, with caching
npx turbo dev            # start all dev servers
npx turbo test --filter=next-boilerplate  # only test one app
npx turbo build --filter=...[HEAD^1]      # only build what changed since last commit
```

## When to Use
- You have shared UI components used by multiple apps (your exact situation)
- A change frequently touches multiple repos simultaneously
- You want unified CI that only runs what changed
- You want to enforce architectural boundaries between packages

## When NOT to Use
- Truly independent projects with different teams and deployment cadences — the coupling is a feature, not a bug, so don't force it
- Projects in different languages (monorepos work best within one ecosystem)
- Very early stage — one app, no shared packages yet

## Common Mistakes
- Putting everything in one giant `src/` instead of separate packages — that's not a monorepo, that's a large repo
- Not using pnpm workspaces — npm workspaces work but pnpm is faster and handles peer dependencies better
- Circular dependencies between packages — Turborepo will detect and error; fix the architecture, don't work around it
- Skipping the `^build` dependency notation — causes non-deterministic build order

## Further Reading
- Turborepo docs (turbo.build/repo) — quickstart is well-written, 30-minute setup
- *Monorepo.tools* — comparison of all monorepo tools with feature matrix
- Nx docs (nx.dev) — choose Nx over Turborepo if you need code generation and strict boundary enforcement
