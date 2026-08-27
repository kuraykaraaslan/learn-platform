# 399. Express: Centralized Error Handling with AppError

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Code_Structure_Rules_Express material to build out the Framework Deep Dives course; no existing coverage data for your own practice.

## What It Is
Every route handler in this stack follows the same shape: try the work, and on failure call `next(error)` — never construct an error response inline. A single global `errorHandler` middleware, registered last in the stack, is the only place that decides what status code and body an error produces. This centralization means the error-response shape is guaranteed consistent across every one of hundreds of endpoints, and changing that shape (say, adding a `requestId` field) is a one-line change instead of a search-and-replace across the codebase.

The handler distinguishes exactly two cases. If the caught value is an `AppError` — a small class carrying a `message` and a `statusCode` — it trusts that message and status completely, because the developer who threw it chose them deliberately. If the caught value is anything else (a TypeORM connection error, a null-pointer bug, an unexpected library exception), the handler logs it at `error` level and returns a generic `500 Internal server error`, deliberately withholding the real error message from the client. This split is the difference between "expected negative outcomes" (not found, wrong password, forbidden) and "something actually broke," and only the latter is worth paging someone over.

Two exceptions carve out room for pragmatism: Zod validation failures return `400` inline from the route handler, because they aren't thrown — `safeParse` returns a result object, not a promise rejection, so there's nothing to funnel through `next()`. And genuinely non-critical operations (writing to a cache, appending an audit log) use an inline `try/catch` that swallows the error after logging a warning, because failing to warm a cache should never fail the user-facing request that triggered it.

## Key Concepts
- **`errorHandler` is 4-argument and registered last**: `(error, req, res, next) => {}` — Express only treats a middleware as an error handler if it declares all four parameters, and only later-registered handlers get unhandled errors
- **`AppError` carries `message` + `statusCode`**: a small `Error` subclass; services `throw new AppError(Messages.X, 404)` and the handler trusts it completely
- **Everything else is `unknown` and gets logged**: a caught value that isn't an `AppError` is logged at `error` level and returns a generic `500` — the real message never reaches the client
- **Routes call `next(error)`, never build responses inline**: the one exception is Zod's `safeParse` failures, which return `400` directly because they're not thrown
- **Non-critical operations get a local silent catch**: cache writes and audit logs are wrapped in their own `try { } catch { /* log, don't rethrow */ }` so a side-effect failure never breaks the primary operation
- **Log once, not twice**: services `Logger.warn` an expected negative path *and* throw the `AppError` — they don't also let the (already-logged) error hit `errorHandler`'s `Logger.error` path
- **Consistent envelope shape**: every error response uses the key `message` — a string for `AppError`/500 cases, or the full Zod `issues` array for validation failures
- **Multer errors need explicit handling**: `multer.MulterError` (e.g. `LIMIT_FILE_SIZE`) is checked before the generic fallback so file-upload failures get accurate status codes (413, not 500)

## Example Code
```typescript
// libs/app-error.ts
export default class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype); // keeps instanceof working after transpilation
  }
}

// libs/middleware/error.ts — the single source of truth for error responses
import { Request, Response, NextFunction } from "express";
import multer from "multer";
import AppError from "@/libs/app-error";
import Logger from "@/libs/logger";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction, // required for Express to recognize this as an error handler
): void {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ message: "File too large" });
      return;
    }
    res.status(400).json({ message: error.message });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  Logger.error(`[errorHandler] Unhandled error: ${String(error)}`);
  res.status(500).json({ message: "Internal server error" });
}

// modules/auth/auth.service.ts — throw AppError for expected negative paths
import AppError from "@/libs/app-error";
import Logger from "@/libs/logger";
import AuthMessages from "@/modules/auth/auth.messages";

export default class AuthService {
  static async login(email: string, password: string) {
    const user = await findUserByEmail(email);
    if (!user) {
      Logger.warn(`[AuthService][login] No user for email=${email}`); // warn — expected, not a bug
      throw new AppError(AuthMessages.INVALID_EMAIL_OR_PASSWORD, 401);
    }

    // ... verify password ...

    try {
      await warmSessionCache(user.userId); // non-critical
    } catch {
      // intentional: cache unavailable, DB path still works — no rethrow, no user-facing impact
    }

    return buildAuthResponse(user);
  }
}

// modules/auth/auth.route.ts — the only two acceptable shapes for error flow
import { Router } from "express";
import AuthService from "@/modules/auth/auth.service";
import { LoginDTO } from "@/modules/auth/auth.dto";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const parsed = LoginDTO.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues }); // ✅ exception: not thrown
    }

    const result = await AuthService.login(parsed.data.email, parsed.data.password);
    return res.status(200).json(result);
  } catch (error) {
    next(error); // ✅ everything else funnels to errorHandler
  }
});

export default router;
```

## When to Use
- Any route handler in an Express app — the try/catch-then-`next(error)` shape should be the only pattern, with no per-route bespoke error formatting
- Signaling an expected negative outcome from a service (not found, forbidden, duplicate, invalid credentials) — throw `AppError` with the right status code rather than returning `null`/`false`/`undefined`
- Wrapping a genuinely optional side effect (cache warm, telemetry ping, audit log) — use a local silent catch instead of letting its failure propagate and fail the whole request
- Adding a new error-shaped exception type (e.g. from a new file-upload library) — extend `errorHandler` with an explicit `instanceof` branch before it falls through to the generic 500

## Common Mistakes
- **Building error responses inline in route handlers** — `if (error instanceof AppError) return res.status(error.statusCode).json(...)` inside every route duplicates `errorHandler`'s job and guarantees the shape will drift over time.
- **Registering `errorHandler` before other middleware or routers** — Express only routes an error to handlers registered *after* the point of failure; putting it first means it never fires.
- **Double-logging an expected error** — calling `Logger.error` and then throwing `AppError` for the same not-found case creates noisy logs for something that isn't actually a problem; use `Logger.warn` for expected paths.
- **Letting a non-critical failure crash the request** — a cache write or audit log wrapped in the outer `try/catch` (instead of its own local one) will turn a harmless side-effect failure into a 500 for the user.

## Further Reading
- Express — Error handling: https://expressjs.com/en/guide/error-handling.html
- MDN — Error object and custom error subclasses: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
- multer — Error handling: https://github.com/expressjs/multer#error-handling
