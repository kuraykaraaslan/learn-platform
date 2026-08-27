# 398. Express: Curried Auth Middleware and Typed Request Augmentation

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Code_Structure_Rules_Express material to build out the Framework Deep Dives course; no existing coverage data for your own practice.

## What It Is
Rather than writing one `authenticate` middleware and a separate `requireAdmin` middleware, this codebase uses a single curried factory: `authMiddleware(role)` returns a middleware function closed over the role it enforces. Calling `authMiddleware("GUEST")` produces a no-op pass-through, `authMiddleware("USER")` requires any valid session, and `authMiddleware("ADMIN")` additionally checks the user's role. This collapses what would otherwise be three near-duplicate middleware functions into one parameterized factory, and it makes every route's authorization requirement visible directly in the route definition — `router.get("/admin/users", apiLimiter, authMiddleware("ADMIN"), handler)` reads as a sentence.

The middleware itself contains no JWT logic. It extracts the access token cookie, delegates verification and session lookup to `UserSessionService.validateSession`, and on success attaches `user` and `userSession` to `req`. Keeping the cryptographic and Redis-lookup logic in a service rather than the middleware means that logic is unit-testable independent of Express, and it can be reused anywhere else a session needs validating (a WebSocket handshake, a background job that acts on behalf of a user).

Because plain Express's `Request` type has no `user` field, TypeScript needs to be told about it via global augmentation — a `types/express.d.ts` file that declares `Express.Request.user` and `Express.Request.userSession` as optional properties. This file is never imported anywhere; TypeScript picks it up automatically because it's inside a directory listed in `tsconfig.json`'s `typeRoots`. Once that augmentation exists, every route handler downstream of `authMiddleware("USER")` or `authMiddleware("ADMIN")` can safely write `req.user!.userId` — the non-null assertion is intentional and correct here, because the middleware guarantees `user` is set before the handler runs; TypeScript just can't see across that runtime guarantee on its own.

## Key Concepts
- **Curried factory pattern**: `authMiddleware(role: Role)` returns the actual middleware function, letting one implementation serve GUEST/USER/ADMIN tiers
- **GUEST is a no-op pass-through**: `authMiddleware("GUEST")` calls `next()` immediately with no token check — it exists to make the pipeline explicit in route definitions, not to enforce anything
- **Session validation lives in a service**: the middleware calls `UserSessionService.validateSession(token)`; it contains zero JWT/Redis logic itself
- **Global type augmentation**: `types/express.d.ts` extends `Express.Request` with `user?: SafeUser` and `userSession?: SafeUserSession`, picked up automatically via `tsconfig.json`'s `typeRoots`
- **Non-null assertion after auth**: `req.user!.userId` is correct and expected downstream of `authMiddleware("USER"|"ADMIN")` — the middleware's runtime guarantee is what TypeScript's static analysis can't otherwise see
- **Role escalation check**: `authMiddleware("ADMIN")` additionally verifies `user.userRole === "ADMIN"` and throws 403 if not, after confirming 401 authentication first
- **Route pipeline order**: rate limiter → `authMiddleware(role)` → handler, with Zod validation happening inside the handler after both
- **Tenant membership is not the middleware's job**: `:tenantId` route params are read by the handler/service, which checks membership — the middleware only proves who the caller is, not what they can access

## Example Code
```typescript
// types/express.d.ts — global augmentation, never imported directly
import { SafeUser } from "@/modules/user/user.types";
import { SafeUserSession } from "@/modules/user_session/user_session.types";

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      userSession?: SafeUserSession;
    }
  }
}

// libs/middleware/auth.ts — the curried factory
import { Request, Response, NextFunction } from "express";
import UserSessionService from "@/modules/user_session/user_session.service";
import AppError from "@/libs/app-error";
import AuthMessages from "@/modules/auth/auth.messages";

type Role = "GUEST" | "USER" | "ADMIN";

export function authMiddleware(role: Role) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (role === "GUEST") return next(); // explicit no-op — no token required

      const accessToken = req.cookies?.accessToken;
      if (!accessToken) throw new AppError(AuthMessages.UNAUTHORIZED, 401);

      const { user, session } = await UserSessionService.validateSession(accessToken);

      if (role === "ADMIN" && user.userRole !== "ADMIN") {
        throw new AppError(AuthMessages.FORBIDDEN, 403);
      }

      req.user = user;
      req.userSession = session;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// modules/user_session/user_session.service.ts — the real logic, framework-agnostic
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "@/libs/redis";
import { hashToken } from "@/libs/crypto";
import { env } from "@/libs/env";
import AppError from "@/libs/app-error";
import AuthMessages from "@/modules/auth/auth.messages";
import type { SafeUser, SafeUserSession } from "@/modules/user_session/user_session.types";

export default class UserSessionService {
  static async validateSession(
    accessToken: string,
  ): Promise<{ user: SafeUser; session: SafeUserSession }> {
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET) as JwtPayload;
    } catch {
      throw new AppError(AuthMessages.UNAUTHORIZED, 401);
    }

    const hashedToken = hashToken(accessToken);
    const cached = await redis.get(`session:${decoded.userId}:${hashedToken}`);
    if (!cached) throw new AppError(AuthMessages.UNAUTHORIZED, 401);

    const parsed = JSON.parse(cached) as { user: SafeUser; session: SafeUserSession };
    return parsed;
  }
}

// modules/user/user.route.ts — role tiers visible directly in the route table
import { Router } from "express";
import { authMiddleware } from "@/libs/middleware/auth";
import { apiLimiter } from "@/libs/middleware/rate-limit";
import UserService from "@/modules/user/user.service";

const router = Router();

router.get("/public-info", apiLimiter, authMiddleware("GUEST"), async (_req, res) => {
  res.status(200).json({ status: "public" }); // req.user is undefined here — by design
});

router.get("/me", apiLimiter, authMiddleware("USER"), async (req, res, next) => {
  try {
    const result = await UserService.getById(req.user!.userId); // safe: USER guarantees req.user
    return res.status(200).json({ user: result });
  } catch (error) { next(error); }
});

router.get("/admin/users", apiLimiter, authMiddleware("ADMIN"), async (req, res, next) => {
  try {
    const users = await UserService.findAll(); // req.user!.userRole === "ADMIN" guaranteed
    return res.status(200).json({ users });
  } catch (error) { next(error); }
});

export default router;
```

## When to Use
- Any route that needs one of three access tiers (public, authenticated, admin-only) — reach for `authMiddleware(role)` instead of writing a bespoke check
- Adding a new authorization tier beyond USER/ADMIN (e.g. `OWNER`) — extend the `Role` union and the single factory, not a fourth parallel middleware function
- Exposing session validation to something outside HTTP routes (a WebSocket auth handshake, a scheduled job acting as a user) — call `UserSessionService.validateSession` directly, bypassing the Express-specific middleware wrapper
- Reviewing a PR that adds inline token checks inside a route handler — that logic belongs in `authMiddleware`, not duplicated per-route

## Common Mistakes
- **Reading `req.user` without the middleware in the pipeline** — if a route reads `req.user!.userId` but never applied `authMiddleware("USER"|"ADMIN")`, it will crash at runtime despite compiling fine, because the non-null assertion lied to the compiler.
- **Putting JWT verification logic inside the middleware itself** — this makes the crypto/Redis logic untestable without spinning up Express, and prevents reuse from non-HTTP entry points.
- **Forgetting `authMiddleware("GUEST")` on public routes** — while it's a no-op, omitting it makes the route's auth posture ambiguous at a glance; every route should state its tier explicitly.
- **Using `(req.user as SafeUser).userId` instead of `req.user!.userId`** — the `as` cast suppresses more type-checking than the non-null assertion and is inconsistent with the house convention.

## Further Reading
- Express — Writing middleware: https://expressjs.com/en/guide/writing-middleware.html
- TypeScript Handbook — Declaration Merging (the mechanism behind `declare global`): https://www.typescriptlang.org/docs/handbook/declaration-merging.html
- jsonwebtoken (npm) documentation: https://github.com/auth0/node-jsonwebtoken
