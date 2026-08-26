# 58. Dockerfile Best Practices — Multi-Stage Build, Minimal Image

## Coverage Level
**Not Covered** — No Dockerfile exists in the project. Containerizing this Next.js boilerplate is the next natural step toward reproducible deploys.

## What It Is
A Dockerfile is a recipe for turning your application code into a portable, reproducible image that runs identically on your laptop, a CI runner, and a production server. Knowing how to write a good Dockerfile — not just any Dockerfile — is what separates a 2 GB image that takes 10 minutes to build from a 150 MB image that builds in 90 seconds.

The two most important techniques are **multi-stage builds** and **layer caching**. Multi-stage builds let you use a full Node.js image with build tools to compile your TypeScript and Next.js app, then copy only the compiled output into a slim runtime image that has no compiler, no devDependencies, and no source code. The final image is small and has a minimal attack surface.

Layer caching means Docker reuses previously built layers if the inputs have not changed. The critical rule: copy `package.json` and `package-lock.json` first and run `npm ci` before copying your source code. That way, the expensive `npm ci` step is only re-executed when your dependencies change, not on every code change.

For your Next.js boilerplate specifically, Next.js has a `standalone` output mode that packages everything needed to run the server into a single self-contained directory — no `node_modules` folder needed at runtime. Combined with a multi-stage build, this produces very small images.

## Key Concepts
- **Multi-stage build** — multiple `FROM` statements in one Dockerfile; only the final stage ends up in the image
- **Build stage** — installs all dependencies, compiles TypeScript, runs `next build`; discarded after copying artifacts
- **Runtime stage** — starts from `node:alpine` or `node:slim`, copies only compiled output; runs `node server.js`
- **Layer caching** — each `RUN`, `COPY`, `ADD` creates a layer; Docker reuses cached layers when inputs are unchanged
- **`.dockerignore`** — lists files to exclude from the build context (like `.gitignore` but for Docker); always exclude `node_modules`, `.next`, `.git`
- **`node:alpine`** — Alpine Linux-based Node image, ~50 MB; smaller attack surface but uses musl libc (occasional native module issues)
- **Non-root user** — run the application as a non-root user inside the container for security
- **Next.js `output: 'standalone'`** — Next.js bundles the minimal server with all dependencies; enables ultra-small images
- **Build arguments (`ARG`)** — pass environment variables at build time (e.g., `NEXT_PUBLIC_API_URL`) without baking secrets into the image

## Example Code
```dockerfile
# ── Stage 1: deps — install only production dependencies ───────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat  # required by some native modules on Alpine
WORKDIR /app

# Copy manifests first — Docker caches this layer until package files change
COPY package.json package-lock.json ./
RUN npm ci --omit=dev  # only production deps; skip devDependencies

# ── Stage 2: builder — compile TypeScript and run next build ───────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Need ALL deps (including devDeps) to build
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code — invalidates cache only when source changes
COPY . .

# next.config.js must have: output: 'standalone'
RUN npm run build

# ── Stage 3: runner — minimal production image ─────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy the standalone build — includes server.js and its bundled dependencies
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# next.config.js output:'standalone' produces this server.js
CMD ["node", "server.js"]
```

```
# .dockerignore — critical for fast builds and not leaking secrets
node_modules
.next
.git
.env
.env.local
.env*.local
coverage
*.md
```

```typescript
// next.config.ts — enable standalone output mode
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',  // <-- this is what makes the minimal image possible
  // ... rest of your config
};

export default nextConfig;
```

## When to Use
1. **Reproducible production deploys** — "works on my machine" stops being an excuse; the Docker image is the artifact.
2. **Deploying to Fly.io, Railway, or AWS ECS** — all of these accept Docker images; a Dockerfile is the universal deploy format.
3. **CI/CD pipelines** — GitHub Actions builds the image, pushes to a registry, and the deploy step pulls it; no code runs on the server directly.
4. **Local development parity** — run `docker compose up` to spin up your app, PostgreSQL, and Redis together with one command, matching production topology.
5. **Security audits** — a minimal image with non-root user and no source code reduces the blast radius of a container escape.

## Common Mistakes
- **Copying `node_modules` from the host into the image** — always run `npm ci` inside the Docker build; host `node_modules` may contain platform-specific binaries incompatible with Alpine Linux.
- **Forgetting `.dockerignore`** — without it, `COPY . .` sends your entire `node_modules` (often > 500 MB) to the Docker daemon as build context, making every build slow.
- **Baking secrets into the image** — never `COPY .env` into the Dockerfile. Pass secrets at runtime via environment variables or a secrets manager. They end up in image layers permanently.
- **Using `node:latest` as the runtime image** — `latest` changes without warning and includes compilers and tools you do not need. Pin to a specific minor version: `node:20.12-alpine`.

## Further Reading
- Next.js Docker deployment guide: https://nextjs.org/docs/app/building-your-application/deploying#docker-image
- Docker multi-stage builds: https://docs.docker.com/build/building/multi-stage/
- Snyk — 10 Docker Security Best Practices: https://snyk.io/blog/10-docker-image-security-best-practices/
