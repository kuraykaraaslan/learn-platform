# 66. Dependency Injection Container — Build from Scratch

## Coverage Level
**Not Covered** — The project uses static class methods throughout and wires dependencies via direct imports. There is no DI framework or manual injection pattern in use.

## What It Is
A Dependency Injection (DI) container is a registry that knows how to create objects and automatically provide their dependencies. Instead of writing `new AuthService(new UserRepository(db), new EmailService(smtp), ...)` everywhere, you register each class once with its dependencies and let the container build the full object graph on demand.

You probably know what DI is conceptually — injecting dependencies instead of hard-coding them. A DI container automates the wiring. Popular TypeScript containers include `inversify`, `tsyringe`, and NestJS's built-in IoC container. But understanding how to build a minimal one from scratch is more useful than learning any specific library's API, because it demystifies what all of them are doing.

The core idea is a `Map<Token, Factory>`. You register a token (usually a string or a `Symbol`) with a factory function that creates the instance. When code asks for a token, the container calls the factory, resolves any transitive dependencies, and returns the instance — optionally caching it as a singleton.

For your boilerplate, the immediate gap is not necessarily "install a DI framework" — it is "move from static methods to instance methods so dependencies can be injected at all." A minimal hand-rolled container gives you most of the benefit with none of the decorator-metadata complexity.

## Key Concepts
- **Token** — a key used to identify a dependency (string, Symbol, or class constructor reference)
- **Factory** — a function that creates a new instance of the dependency; called by the container
- **Singleton scope** — the container creates one instance and caches it; subsequent requests return the same object
- **Transient scope** — the container creates a new instance on every request
- **Registration** — telling the container how to build a particular dependency
- **Resolution** — asking the container to give you a dependency (and it builds the full graph)
- **Circular dependency** — class A needs B, B needs A; containers detect and error on this; the fix is to extract a third class or use lazy injection
- **Composition root** — the single place where all registrations happen; usually at app startup

## Example Code
```typescript
// libs/container.ts — a minimal DI container from scratch

type Factory<T> = (c: Container) => T;

class Container {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private registrations = new Map<string | symbol, Factory<any>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private singletons      = new Map<string | symbol, any>();

  // Register a factory with singleton scope (default)
  register<T>(token: string | symbol, factory: Factory<T>): this {
    this.registrations.set(token, factory);
    return this;  // fluent API — allows chaining
  }

  // Resolve a dependency — creates it if not yet cached
  resolve<T>(token: string | symbol): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }

    const factory = this.registrations.get(token);
    if (!factory) {
      throw new Error(`[Container] No registration for token: ${String(token)}`);
    }

    const instance = factory(this);  // pass container so factory can resolve sub-deps
    this.singletons.set(token, instance);
    return instance as T;
  }

  // Resolve as transient (new instance every time)
  resolveTransient<T>(token: string | symbol): T {
    const factory = this.registrations.get(token);
    if (!factory) throw new Error(`[Container] No registration: ${String(token)}`);
    return factory(this) as T;
  }
}

// ── Tokens — use Symbols for type safety and collision avoidance ─────────────
export const TOKENS = {
  UserRepository:     Symbol('UserRepository'),
  PasswordService:    Symbol('PasswordService'),
  TokenService:       Symbol('TokenService'),
  AuthService:        Symbol('AuthService'),
  PaymentService:     Symbol('PaymentService'),
  SystemDataSource:   Symbol('SystemDataSource'),
} as const;

// ── Composition root — the one place that knows about concrete classes ───────
// libs/composition-root.ts
import { Container } from './container';
import { TypeORMUserRepository } from '../modules/user/typeorm-user.repository';
import { BcryptPasswordService } from '../modules/auth/bcrypt-password.service';
import { JwtTokenService } from '../modules/auth/jwt-token.service';
import { AuthService } from '../modules/auth/auth.service';
import { getSystemDataSource } from './typeorm';

export async function buildContainer(): Promise<Container> {
  const ds = await getSystemDataSource();
  const container = new Container();

  container
    .register(TOKENS.SystemDataSource, () => ds)
    .register(TOKENS.UserRepository, (c) =>
      new TypeORMUserRepository(c.resolve(TOKENS.SystemDataSource)))
    .register(TOKENS.PasswordService, () => new BcryptPasswordService())
    .register(TOKENS.TokenService, () => new JwtTokenService(process.env.ACCESS_TOKEN_SECRET!))
    .register(TOKENS.AuthService, (c) =>
      new AuthService(
        c.resolve(TOKENS.UserRepository),
        c.resolve(TOKENS.PasswordService),
        c.resolve(TOKENS.TokenService),
      ));

  return container;
}

// ── Usage in a Next.js route handler ────────────────────────────────────────
// app/api/auth/login/route.ts
let container: Container;

async function getContainer(): Promise<Container> {
  if (!container) container = await buildContainer();
  return container;
}

export async function POST(req: Request) {
  const c = await getContainer();
  const authService = c.resolve<AuthService>(TOKENS.AuthService);
  const body = await req.json();
  const result = await authService.login(body.email, body.password);
  return Response.json(result);
}

// ── Test: override one registration without touching others ─────────────────
async function buildTestContainer(): Promise<Container> {
  const c = await buildContainer();
  // Override just the UserRepository with an in-memory mock
  c.register(TOKENS.UserRepository, () => new InMemoryUserRepository());
  return c;
}
```

## When to Use
1. **When you start writing integration tests** — a container makes swapping real infrastructure for test doubles trivial.
2. **When a module needs more than 3 dependencies** — instead of passing them through multiple layers manually, let the container wire it.
3. **When scaling to a multi-person team** — containers make dependency graphs explicit and documented; no hidden `import` chains buried in files.
4. **When you need different configurations per environment** — the container can register different adapters based on `NODE_ENV` without changing any service code.
5. **When evaluating frameworks like NestJS** — NestJS's `@Injectable()` and `@Module()` are a DI container; understanding manual DI first means you understand what NestJS is doing automatically.

## Common Mistakes
- **Making every utility go through the container** — stateless helpers with no dependencies (a date formatter, a string sanitizer) do not need DI; just import and call them.
- **Circular dependencies** — if A depends on B and B depends on A, your container will throw a stack overflow. Fix by extracting shared logic into a third dependency, or using a lazy resolver.
- **Not building the composition root eagerly** — if you create the container lazily during a request, a misconfiguration only surfaces at runtime. Build and validate the container at app startup.
- **Skipping interfaces** — a DI container without interface contracts is just a service locator. Always pair DI with interfaces (see item 65) so you can actually swap implementations.

## Further Reading
- Martin Fowler — Inversion of Control Containers: https://martinfowler.com/articles/injection.html
- tsyringe (Microsoft's lightweight DI for TypeScript): https://github.com/microsoft/tsyringe
- InversifyJS (full-featured TypeScript DI): https://inversify.io/
