# 396. Express: Two-Layer Architecture — Routes and Static Services

## What It Is
Express projects in this shop use exactly two layers: a route handler and a static service class. There is no Controller layer separate from the route, and no Repository abstraction separate from the service — the route validates input and shapes the HTTP response, and the service does everything else, including talking to TypeORM directly. This is a deliberate simplification compared to Spring Boot's three-layer model: TypeORM repositories are lightweight enough that wrapping them in a fourth abstraction buys nothing in a TypeScript codebase, whereas Java's ecosystem treats `JpaRepository` as a first-class, independently testable unit.

The route file's job is narrow: parse `req.body`/`req.query`/`req.params` with Zod, call exactly one service method, and translate the result into a status code and JSON body. Business logic — conditionals, calculations, multi-step workflows, DB writes — never lives in the route. The service is written as a class with `static async` methods rather than an instantiated object, because there is no per-request state to hold; each method is a pure entry point that takes validated arguments and returns a plain value or throws an `AppError`.

Modules are organized by domain, not by technical layer: `modules/auth/auth.route.ts` sits next to `modules/auth/auth.service.ts`, `auth.dto.ts` (Zod schemas), and `auth.messages.ts` (string constants). This module-first layout means a developer working on the auth feature opens one folder, not four scattered directories keyed by "routes", "services", "models". Two top-level routers — `systemRouter` and `tenantRouter` — aggregate every module's router under `/api/v1/system/*` and `/api/v1/tenant/:tenantId/*` respectively, giving the whole API a predictable, greppable path convention.


```quiz
- q: "Where does input validation live in this two-layer shape?"
  anchor: "the route validates input and shapes the HTTP response, and the service does everything else"
  options:
    - text: "In the service, so it is reused by every caller"
      correct: false
      why: "The service does everything else, but validation and HTTP shaping are the route's two jobs in this split."
    - text: "In the route, along with shaping the HTTP response"
      correct: true
      why: "Those are precisely the route's two responsibilities; the service holds the rest, TypeORM included."
    - text: "In a middleware layer between the two"
      correct: false
      why: "There is no third layer here \u2014 that is the simplification the lesson is arguing for."

- q: "Why does this shop skip the Repository layer that a Spring Boot project would have?"
  anchor: "wrapping them in a fourth abstraction buys nothing in a TypeScript codebase"
  options:
    - text: "TypeScript cannot express the repository pattern cleanly"
      correct: false
      why: "It expresses it fine. The argument is about value, not capability."
    - text: "TypeORM repositories are already light enough that another wrapper adds nothing"
      correct: true
      why: "Java treats JpaRepository as a first-class independently testable unit; TypeORM does not need the same scaffolding."
    - text: "Repositories make testing harder in Node"
      correct: false
      why: "They do not particularly. The claim is that the extra layer earns nothing here, not that it costs something."
```

## Key Concepts
- **Route handler**: validates input with Zod, calls one service method, maps the result to `res.status(...).json(...)` — contains zero business logic
- **Static service class**: `static async` methods hold all business logic and DB access; services never import Express types (`Request`, `Response`)
- **No Controller/Repository layers**: Express's 2-layer model differs from Spring Boot's 3-layer model because TypeORM repositories are used inline, not wrapped
- **Module folder**: `modules/[name]/[name].route.ts`, `.service.ts`, `.dto.ts`, `.messages.ts`, `entities/`, `tests/` — everything for one domain in one place
- **Top-level routers**: `systemRouter` (system-scoped) and `tenantRouter` (tenant-scoped, carries `:tenantId`) aggregate all module routers
- **Path convention**: `/api/v1/system/[resource]` and `/api/v1/tenant/:tenantId/[resource]` — predictable and greppable
- **Express 5 wildcard removal**: `router.use("*", ...)` no longer works; use `router.use(fn)` or `router.use("/", fn)` instead
- **Health check**: `GET /health` is registered before routers, with no auth and no rate limiting, and always returns `200 { status: "ok" }`

## Example Code
```typescript
// modules/project/project.dto.ts
import { z } from "zod";

export const CreateProjectDTO = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectDTO>;

// modules/project/project.messages.ts
export default class ProjectMessages {
  static readonly PROJECT_NOT_FOUND = "PROJECT_NOT_FOUND";
  static readonly NAME_TAKEN = "PROJECT_NAME_TAKEN";
}

// modules/project/project.service.ts — static class, no Express imports
import { AppDataSource } from "@/lib/typeorm";
import { Project } from "@/modules/project/entities/Project";
import AppError from "@/lib/app-error";
import ProjectMessages from "@/modules/project/project.messages";
import type { CreateProjectInput } from "@/modules/project/project.dto";

export default class ProjectService {
  static async create(tenantId: string, data: CreateProjectInput): Promise<Project> {
    const repo = AppDataSource.getRepository(Project);

    const existing = await repo.findOne({ where: { tenantId, name: data.name } });
    if (existing) throw new AppError(ProjectMessages.NAME_TAKEN, 409);

    const project = repo.create({ tenantId, name: data.name, description: data.description });
    return repo.save(project);
  }

  static async findAll(tenantId: string): Promise<Project[]> {
    return AppDataSource.getRepository(Project).find({ where: { tenantId } });
  }
}

// modules/project/project.route.ts — thin, validates + delegates
import { Router } from "express";
import ProjectService from "@/modules/project/project.service";
import { CreateProjectDTO } from "@/modules/project/project.dto";
import { authMiddleware } from "@/lib/middleware/auth";
import { apiLimiter } from "@/lib/middleware/rate-limit";

const router = Router({ mergeParams: true }); // mergeParams to read :tenantId from the parent

router.post("/", apiLimiter, authMiddleware("USER"), async (req, res, next) => {
  try {
    const parsed = CreateProjectDTO.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

    const project = await ProjectService.create(req.params.tenantId, parsed.data);
    return res.status(201).json({ project });
  } catch (error) { next(error); }
});

router.get("/", apiLimiter, authMiddleware("USER"), async (req, res, next) => {
  try {
    const projects = await ProjectService.findAll(req.params.tenantId);
    return res.status(200).json({ projects });
  } catch (error) { next(error); }
});

export default router;

// libs/router/tenant.ts — wires the module into the tenant-scoped top-level router
import { Router } from "express";
import projectRouter from "@/modules/project/project.route";
import { authMiddleware } from "@/lib/middleware/auth";

const tenantRouter = Router();
tenantRouter.use("/:tenantId/projects", authMiddleware("USER"), projectRouter);
export default tenantRouter;
```

## When to Use
- Building any new Express + TypeORM backend where the team already knows the 2-layer Route → Service convention from other in-house projects
- Adding a new domain feature — start by creating the module folder, not by scattering files across a `controllers/`, `services/`, `models/` split
- Deciding whether a piece of logic belongs in the route or the service — if it does more than parse input or shape a response, it belongs in the service
- Exposing the same business logic to both an HTTP route and a background worker — the static service method is the shared entry point for both

## Common Mistakes
- **Putting business logic in the route handler** — conditionals that decide pricing, permissions, or state transitions belong in the service, not sandwiched between `safeParse` and `res.json`.
- **Importing Express types into a service** — a service that imports `Request`/`Response` has leaked an HTTP concern into business logic, making it untestable without mocking Express.
- **Reaching for `router.use("*", ...)`** — this throws in Express 5; use `router.use(fn)` for "all paths in this router" instead.
- **Scattering a module's files by technical type** (`routes/project.ts`, `services/project.ts` in separate top-level folders) instead of colocating them under `modules/project/` — this makes a single feature change touch four unrelated directories.

## Further Reading
- Express official routing guide: https://expressjs.com/en/guide/routing.html
- Express 5 migration guide (wildcard route removal): https://expressjs.com/en/guide/migrating-5.html
- Martin Fowler — "PresentationDomainDataLayering": https://martinfowler.com/bliki/PresentationDomainDataLayering.html

```recall
- q: "Describe the two layers and what each owns."
  must:
    - "route \u2014 validates input and shapes the HTTP response"
    - "service \u2014 everything else, including TypeORM directly"
    - "no separate controller, no separate repository"

- q: "Why is this not simply a worse version of the three-layer model?"
  must:
    - "TypeORM repositories are already light abstractions"
    - "a fourth wrapper adds indirection without testability gains"
    - "Java's JpaRepository is a first-class unit, TypeORM's is not"

- q: "What would tell you this shape has stopped fitting?"
  must:
    - "services that only forward calls to other services"
    - "route handlers accumulating business rules"
    - "the same query logic duplicated across services"
```
