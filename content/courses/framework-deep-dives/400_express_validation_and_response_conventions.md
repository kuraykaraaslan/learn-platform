# 400. Express: Zod Validation and Response Envelope Conventions

## What It Is
Every piece of input that crosses an Express route boundary — body, query string, or route params — is validated with Zod before the service ever sees it. Services trust their arguments completely; they perform zero input validation themselves, because that job is fully discharged at the route layer. This single-validation-point rule matters because query params arrive as strings even when they represent numbers or booleans, so schemas for query input lean on `z.coerce.number()` and similar coercions, while body and param schemas can validate types directly since JSON already carries real types.

The two validation methods, `safeParse` and `parse`, are chosen deliberately per input source. Body validation always uses `safeParse` because a malformed body is a normal, expected client mistake that should produce a clean `400` with the field-level issue list — not an uncaught exception. Route params use `.parse()` (which throws) because a malformed UUID in a URL segment is unambiguously a `400` regardless of context, and letting it throw straight into `next(error)` is less code than repeating the `safeParse`-then-check dance for every param.

On the output side, responses always nest data under an entity-named key — `{ user }`, `{ projects, total, page }` — never a generic `{ data }` or `{ success: true, result }` wrapper. This convention means a client consuming `GET /users/:id` and `GET /projects/:id` doesn't need to unwrap a generic envelope differently each time; the key itself tells you what you got. Pagination metadata is spread alongside the array at the top level rather than nested in a separate `meta` object, so `{ users, total, page, pageSize, pages }` is the complete shape of a paginated list response.

## Key Concepts
- **Validate once, at the route**: services receive already-validated, already-typed data and perform no input checking of their own
- **`safeParse` for bodies**: returns a result object; failure produces an inline `400` with `parsed.error.issues` — the one case where an error response is built without going through `next(error)`
- **`.parse()` for route params**: throws on failure, which flows straight into `catch { next(error) }` — appropriate because a malformed param is unambiguously a client error
- **`z.coerce` for query strings**: query values arrive as strings even for `page=2`; `z.coerce.number().int().min(1).default(1)` converts and validates in one step
- **Sanitization via schema, not a library**: `.trim()` on every string field, `.toLowerCase()` on email — never a separate `sanitize-html` pass; strict `.max()`/enum constraints do the job
- **Entity-named response keys**: `{ user }`, `{ users, total, page, pageSize, pages }` — never `{ data }`, `{ result }`, or a naked array/primitive at the top level
- **Shared validation helpers**: common shapes (`UuidParam`, `PaginationQuery`) live in `libs/validation.ts` and are imported, not redefined per module
- **204 for bodyless success**: DELETE and other no-return-value actions send `res.status(204).send()` rather than `200` with an empty or null body

## Example Code
```typescript
// libs/validation.ts — shared shapes, imported everywhere instead of redefined
import { z } from "zod";

export const UuidParam = z.object({ id: z.string().uuid() });
export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// libs/pagination.ts
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export function paginationMeta(
  total: number,
  { page, pageSize }: { page: number; pageSize: number },
): PaginationMeta {
  return { total, page, pageSize, pages: Math.ceil(total / pageSize) };
}

// modules/project/project.dto.ts
import { z } from "zod";

export const CreateProjectDTO = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});

export const ListProjectsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});

// modules/project/project.route.ts — body (safeParse), query (safeParse+coerce), param (.parse)
import { Router } from "express";
import { UuidParam } from "@/lib/validation";
import { paginationMeta } from "@/lib/pagination";
import { CreateProjectDTO, ListProjectsQuery } from "@/modules/project/project.dto";
import ProjectService from "@/modules/project/project.service";

const router = Router();

// Body validation — safeParse, inline 400 on failure
router.post("/", async (req, res, next) => {
  try {
    const parsed = CreateProjectDTO.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

    const project = await ProjectService.create(parsed.data);
    return res.status(201).json({ project }); // entity-named key, not { data }
  } catch (error) { next(error); }
});

// Query validation — safeParse with z.coerce for string→number
router.get("/", async (req, res, next) => {
  try {
    const parsed = ListProjectsQuery.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

    const { page, pageSize, search } = parsed.data;
    const [projects, total] = await ProjectService.findAll({ page, pageSize, search });

    // entity-named array + spread pagination meta — never { data, meta }
    return res.status(200).json({ projects, ...paginationMeta(total, { page, pageSize }) });
  } catch (error) { next(error); }
});

// Param validation — .parse() throws, caught by next(error)
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = UuidParam.parse(req.params); // malformed UUID → thrown → 400 via errorHandler
    const project = await ProjectService.findById(id);
    if (!project) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ project });
  } catch (error) { next(error); }
});

// DELETE — 204, no body
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = UuidParam.parse(req.params);
    await ProjectService.delete(id);
    return res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
```

## When to Use
- Any route reading `req.body`, `req.query`, or `req.params` — pick `safeParse` for body/query and `.parse()` for params, consistently
- Designing a new list endpoint — default to offset-based pagination with `{ items, total, page, pageSize, pages }`, reserving cursor-based pagination for datasets beyond roughly 100k rows
- Writing a shared schema (a UUID param, a pagination query) used by more than one module — put it in `libs/validation.ts` instead of copy-pasting the same `z.object` per module
- Reviewing an endpoint that wraps its response in `{ success: true, data: ... }` — flag it; the house convention is an entity-named key with no wrapper

## Common Mistakes
- **Validating query params without `z.coerce`** — `page: z.number()` will fail every request because `req.query.page` is the string `"2"`, not the number `2`; use `z.coerce.number()`.
- **Returning a naked array or a generic `{ data }` wrapper** — `res.json(users)` or `res.json({ data: users })` breaks the entity-named-key convention that lets every response be typed consistently across the API.
- **Re-validating input inside the service** — if the route already ran `safeParse`, a service that also checks `if (!data.email) throw ...` is duplicating a job that's already done, and risks the two validations drifting apart.
- **Using `.parse()` on request bodies** — an uncaught throw from body validation skips the field-level `ZodIssue[]` response the frontend expects; bodies should use `safeParse` and build the 400 inline.

## Further Reading
- Zod documentation — Basic usage and coercion: https://zod.dev/
- Express — req.query and req.params: https://expressjs.com/en/api.html#req.query
- REST API pagination patterns (Microsoft REST API guidelines): https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md#9-collections
