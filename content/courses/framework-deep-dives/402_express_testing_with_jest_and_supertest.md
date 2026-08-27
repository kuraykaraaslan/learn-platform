# 402. Express: Integration Testing with Jest and Supertest

## What It Is
Express tests in this stack are integration tests by default, not unit tests with a mocked ORM. Supertest drives real HTTP requests against the exported `app` instance, and those requests hit a real `AppDataSource` connected to a dedicated test database — never a mocked TypeORM repository. The reasoning is direct: a mocked repository proves your mock behaves the way you told it to, not that your query actually returns the right rows against a real schema, real constraints, and real cascades. Route-level integration tests exercise the whole pipeline — middleware, validation, service, database — in one assertion, which is a closer proxy for "does this endpoint actually work" than a unit test that stubs everything below the route.

Every route gets a minimum of three tests: a validation-error case (malformed input → 400 with the `ZodIssue[]` array), an auth-error case (missing or invalid token → 401), and a happy path (valid input plus valid auth → the expected 200/201 body). Not-found and forbidden cases are recommended on top of that minimum wherever the route has meaningful branches for them. This isn't exhaustive coverage of every possible input — it's coverage of the three states that recur identically across every authenticated endpoint in the API.

Authenticating in tests means minting a *real* session rather than injecting a fake `req.user`. The `createTestUserAndLogin` helper creates a genuine user row, calls the actual `/auth/login` endpoint through Supertest, and extracts the `Set-Cookie` header from the response to attach to subsequent requests. This is slightly more code than stubbing middleware, but it means the auth pipeline itself — cookie parsing, JWT verification, session lookup — is exercised by every authenticated test in the suite, not bypassed by a test-only shortcut that could silently drift from what production actually does.

## Key Concepts
- **Real `AppDataSource`, never a mocked repository**: tests connect to an actual (test) database; TypeORM repository mocks are explicitly disallowed because they only prove the mock's own behavior
- **Integration by default**: a route test exercises middleware → validation → service → DB in one request, closer to real behavior than isolated unit tests with everything stubbed
- **Minimum coverage per route**: validation error (400), auth error (401), happy path (200/201) — with not-found (404) and forbidden (403) recommended where the route branches on them
- **Real login for auth in tests**: `createTestUserAndLogin` seeds a genuine user, calls `/auth/login` through Supertest, and extracts the real `Set-Cookie` header — no fake `req.user` injection
- **Surgical `afterEach` cleanup**: delete only the specific test rows created (`.delete({ email: "test@example.com" })`), never truncate whole tables shared by parallel tests
- **`beforeAll`/`afterAll` own the connection lifecycle**: `AppDataSource.initialize()` and `.destroy()` bracket the whole test file, not each individual test
- **Test files live beside their module**: `modules/[module]/tests/[module].route.test.ts` — no `__tests__` folder convention
- **Workers are tested by outcome, not HTTP**: background job code is tested by enqueueing a job and asserting the resulting DB state, since there's no HTTP request to drive with Supertest

## Example Code
```typescript
// modules/auth/tests/helpers/auth.helper.ts — real login, not a fake req.user
import request from "supertest";
import app from "@/../index";
import { AppDataSource } from "@/lib/typeorm";
import { User } from "@/modules/user/entities/User";
import bcrypt from "bcryptjs";

export async function createTestUserAndLogin(
  overrides: Partial<{ email: string; password: string; userRole: string }> = {},
): Promise<{ cookie: string; userId: string }> {
  const email = overrides.email ?? "testuser@example.com";
  const password = overrides.password ?? "Test1234!";
  const userRole = overrides.userRole ?? "USER";

  const user = AppDataSource.getRepository(User).create({
    email,
    password: await bcrypt.hash(password, 10),
    userRole,
  });
  await AppDataSource.getRepository(User).save(user);

  const res = await request(app).post("/api/v1/system/auth/login").send({ email, password });
  const cookie = res.headers["set-cookie"][0];

  return { cookie, userId: user.userId };
}

// modules/project/tests/project.route.test.ts — the three-state minimum, plus forbidden/not-found
import request from "supertest";
import app from "@/../index";
import { AppDataSource } from "@/lib/typeorm";
import { Project } from "@/modules/project/entities/Project";
import { User } from "@/modules/user/entities/User";
import { createTestUserAndLogin } from "@/modules/auth/tests/helpers/auth.helper";

describe("POST /api/v1/tenant/:tenantId/projects", () => {
  let cookie: string;
  let userId: string;

  beforeAll(async () => {
    await AppDataSource.initialize();
    ({ cookie, userId } = await createTestUserAndLogin({ email: "project-test@example.com" }));
  });

  afterAll(async () => {
    // Surgical cleanup — only the rows this file created
    await AppDataSource.getRepository(Project).delete({ createdBy: userId });
    await AppDataSource.getRepository(User).delete({ userId });
    await AppDataSource.destroy();
  });

  it("returns 400 for a missing name", async () => {
    const res = await request(app)
      .post("/api/v1/tenant/tenant-1/projects")
      .set("Cookie", cookie)
      .send({});

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it("returns 401 without an auth cookie", async () => {
    const res = await request(app)
      .post("/api/v1/tenant/tenant-1/projects")
      .send({ name: "Roadmap" });

    expect(res.status).toBe(401);
  });

  it("returns 201 and the created project on valid input", async () => {
    const res = await request(app)
      .post("/api/v1/tenant/tenant-1/projects")
      .set("Cookie", cookie)
      .send({ name: "Roadmap" });

    expect(res.status).toBe(201);
    expect(res.body.project.name).toBe("Roadmap");
  });
});
```

## When to Use
- Writing tests for any Express route — default to a real `AppDataSource` against a test database, not a mocked repository layer
- Deciding test coverage for a new endpoint — cover validation, auth, and happy path at minimum before considering the endpoint "tested"
- Writing tests for authenticated routes — mint a real session via the login endpoint rather than injecting `req.user` directly, so the auth pipeline itself stays covered
- Cleaning up test data — always delete the specific rows the test created, keyed by a unique identifier, rather than truncating shared tables that parallel test files might also be using

## Common Mistakes
- **Mocking the TypeORM repository** — a test that stubs `userRepository.findOne` to return a canned object proves nothing about whether the real query, real indexes, or real constraints behave correctly; use the real test database.
- **Injecting `req.user` directly instead of logging in** — this bypasses cookie parsing, JWT verification, and session lookup, meaning a break in the real auth pipeline could go completely undetected by the test suite.
- **Truncating whole tables in `afterEach`** — this breaks parallel test execution and can silently delete fixtures another test file depends on; delete only the rows this test created.
- **Skipping the auth-error and validation-error cases** — testing only the happy path leaves the two most common real-world failure modes (bad input, missing token) completely unverified.

## Further Reading
- Jest documentation: https://jestjs.io/docs/getting-started
- SuperTest (npm): https://github.com/ladjs/supertest
- Martin Fowler — "TestPyramid": https://martinfowler.com/bliki/TestPyramid.html
