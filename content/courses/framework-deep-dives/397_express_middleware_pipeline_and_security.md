# 397. Express: Middleware Pipeline, CORS, and Rate Limiting

## What It Is
Express middleware runs in registration order, and that order is not cosmetic — it determines whether cookies exist when auth checks them, whether preflight requests get answered before security headers reject them, and whether the error handler ever sees an error at all. The mandatory order in this house style is: cookie parser, body parser, CORS, Helmet, health check, routers (with rate limiting applied per-route or per-router), and the error handler last. Each position exists for a reason — cookie parsing must precede anything reading `req.cookies` (i.e., auth), body parsing must precede anything reading `req.body`, and the error handler's 4-argument signature only works if Express registers it after every other middleware.

CORS and Helmet are not interchangeable "security middleware" — CORS controls which browser origins may read the response, while Helmet sets response headers (CSP, `X-Frame-Options`, etc.) that protect against a different class of attacks entirely. Both are configured from environment variables, never hardcoded origins, and CORS specifically must never combine a wildcard origin (`"*"`) with `credentials: true` — browsers reject that combination outright, and even if they didn't, it would defeat the purpose of scoping cookies to a known origin.

Rate limiting in this stack is applied per-route or per-router rather than globally, because auth endpoints (login, register, forgot-password) need a much tighter limit — 10 requests per 15 minutes — than general authenticated API traffic, which gets 100 per 15 minutes. The health check endpoint is deliberately registered before any rate limiter so that uptime monitors and load balancers are never throttled, and it needs no authentication since its only job is confirming the process is alive.

## Key Concepts
- **Registration order is load-bearing**: cookie parser → body parser → CORS → Helmet → health check → routers (rate-limited) → error handler (must be last)
- **CORS vs Helmet**: CORS governs which origins can read responses; Helmet sets protective response headers (CSP, referrer policy, frame options) — they solve different problems
- **`credentials: true` requires an explicit origin**: never pair a wildcard `origin: "*"` with `credentials: true` — browsers reject it, and it would break cookie scoping anyway
- **Tiered rate limits**: `authLimiter` (10 req/15min) on login/register/forgot-password; `apiLimiter` (100 req/15min) on everything else authenticated
- **Health check exemption**: `GET /health` sits before rate limiting and auth, always returns `200 { status: "ok" }`, because monitors must never be throttled
- **Body size limits**: `express.json({ limit: "1mb" })` as a global default; file-upload routes override this locally rather than raising the global ceiling
- **`standardHeaders` on rate limiters**: emit `RateLimit-*` headers (not legacy `X-RateLimit-*`) so clients can read remaining quota programmatically
- **Environment-driven config**: `CORS_ORIGIN` always comes from `env.ts`, never a string literal in the middleware file

## Example Code
```typescript
// libs/middleware/cors.ts
import cors from "cors";
import { env } from "@/libs/env";

export const corsMiddleware = cors({
  origin: env.CORS_ORIGIN,        // from env — never a hardcoded string
  credentials: true,              // required for httpOnly cookie auth
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Idempotency-Key"],
});

// libs/middleware/helmet.ts
import helmet from "helmet";

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

// libs/middleware/rate-limit.ts
import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many auth attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// index.ts — the full pipeline, in the mandatory order
import express from "express";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "@/libs/middleware/cors";
import { helmetMiddleware } from "@/libs/middleware/helmet";
import { errorHandler } from "@/libs/middleware/error";
import systemRouter from "@/libs/router/system";
import tenantRouter from "@/libs/router/tenant";

const app = express();

app.use(cookieParser());                                   // 1. cookies, before auth reads them
app.use(express.json({ limit: "1mb" }));                    // 2. body, before req.body is read
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(corsMiddleware);                                    // 3. CORS, before security headers
app.use(helmetMiddleware);                                  // 4. security headers

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" })); // 5. before rate limiting

app.use("/api/v1/system", systemRouter);                    // 6. rate limiting applied inside routers
app.use("/api/v1/tenant", tenantRouter);

app.use(errorHandler);                                      // 7. must be last — 4-arg signature

export default app;

// modules/auth/auth.route.ts — tiered rate limits applied per-route
import { Router } from "express";
import { authLimiter } from "@/libs/middleware/rate-limit";
import AuthService from "@/modules/auth/auth.service";

const router = Router();

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body);
    return res.status(200).json(result);
  } catch (error) { next(error); }
});

export default router;
```

## When to Use
- Bootstrapping any new Express app — the middleware order checklist should be applied verbatim, not reinvented per project
- Adding a new public-facing endpoint that could be brute-forced (login, OTP verification, password reset) — always pair it with `authLimiter`, never leave it on the default `apiLimiter`
- Deploying behind a load balancer or uptime monitor — confirm `/health` sits before both auth and rate limiting so probes never get a 401 or 429
- Debugging a CORS failure — check registration order first (CORS before Helmet) before assuming the `origin` value itself is wrong

## Common Mistakes
- **Registering the error handler before other middleware** — Express treats a 4-argument function anywhere in the stack as an error handler; putting it early means later middleware errors never reach it.
- **Setting `origin: "*"` alongside `credentials: true`** — this combination is invalid per the CORS spec and browsers will reject the response even though the server sends it.
- **Applying `apiLimiter` uniformly to login endpoints** — 100 requests per 15 minutes is far too permissive for a brute-forceable auth endpoint; those need `authLimiter`'s tighter 10/15min ceiling.
- **Raising the global body size limit to accommodate one upload route** — override the limit locally on the specific route (or use `multer`) instead of loosening `express.json()` globally to 10mb+.

## Further Reading
- Express — Using middleware: https://expressjs.com/en/guide/using-middleware.html
- Helmet.js documentation: https://helmetjs.github.io/
- express-rate-limit documentation: https://express-rate-limit.mintlify.app/overview
