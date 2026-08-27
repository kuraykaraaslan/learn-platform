# 65. Hexagonal Architecture (Ports & Adapters)

## What It Is
Hexagonal Architecture, coined by Alistair Cockburn, organizes an application so that its core domain logic is completely isolated from infrastructure — databases, HTTP frameworks, payment providers, email services. The core (the "hexagon") knows nothing about Stripe, PostgreSQL, Redis, or Next.js. It only knows about Ports: abstract interfaces that define what it needs and what it produces. Adapters are implementations of those Ports, living outside the hexagon: one adapter talks to PostgreSQL, another to an in-memory mock, a third to a test fixture.

The two categories of Ports are **Driving Ports** (how the outside world talks to your domain — HTTP handlers, CLI commands, test fixtures) and **Driven Ports** (what your domain needs from the outside — repositories, payment gateways, email senders). Each Driven Port has at least one production Adapter and one test Adapter.

Most codebases already have one of these without naming it. A payment module where `BasePaymentProvider` is the interface and `StripeProvider` implements it is a Driven Port with a production Adapter; adding a `MockPaymentProvider` for tests completes the pattern. The usual gap is that the same discipline stops at the data layer: a service that imports `getSystemDataSource()` directly, rather than depending on an `IUserRepository` port, is coupled to the ORM. That coupling is what makes the service hard to unit test — and it is worth auditing your own code for the asymmetry, because a team that applied ports to payments and skipped them for persistence almost always did so by accident rather than by decision.

The payoff is testability and interchangeability: you can run your entire domain logic without a database, without Redis, without a payment processor. Tests become instant and deterministic.

## Key Concepts
- **Hexagon / Application Core** — pure domain and use-case logic; zero imports of infrastructure libraries
- **Driving Port** — interface that the outside world calls into (e.g., `IAuthUseCase` called by an HTTP handler)
- **Driven Port** — interface the core depends on (e.g., `IUserRepository`, `IPaymentGateway`, `IEmailService`)
- **Primary Adapter** — calls a Driving Port (e.g., Next.js route handler, CLI command, Jest test)
- **Secondary Adapter** — implements a Driven Port (e.g., `TypeORMUserRepository`, `StripeProvider`, `SendgridEmailAdapter`)
- **Dependency Rule** — dependencies only point inward; the core never imports adapters
- **Port (TypeScript)** — an `interface` or `abstract class`; the vocabulary your core uses
- **Composition Root** — the one place (app startup) where you wire Ports to Adapters; the only place that imports both

## Example Code
```typescript
// The validated environment object — one place reads process.env, everything
// else imports the parsed result. A secret typed as `string` here is a secret
// the app cannot start without.
declare const env: { ACCESS_TOKEN_SECRET: string };

// ── Domain Core — no infrastructure imports ─────────────────────────────────

// Driven Port: what AuthService needs from the user storage layer
// (a payment module with a BasePaymentProvider interface is the same shape)
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

// Driven Port: what AuthService needs from the email infrastructure
export interface IEmailService {
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
}

// Domain entity — pure TypeScript, no ORM decorators, no framework
export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public hashedPassword: string,
    public isEmailVerified: boolean,
  ) {}

  verifyEmail(): void {
    this.isEmailVerified = true;
  }
}

// Driven Port: what AuthUseCase needs from password hashing. The domain says
// "compare a plaintext against a stored hash" and refuses to know that bcrypt
// exists — which is what lets the adapter be swapped for argon2 later.
export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

// Driven Port: what AuthUseCase needs from token issuing
export interface ITokenIssuer {
  issue(userId: string): string;
  verify(token: string): { userId: string } | null;
}

// Driving Port: what the application exposes to the outside world
export interface IAuthUseCase {
  login(email: string, password: string): Promise<{ token: string }>;
  register(email: string, password: string): Promise<{ userId: string }>;
}

// Application service — the hexagon; depends ONLY on ports
export class AuthUseCase implements IAuthUseCase {
  constructor(
    private readonly users: IUserRepository,       // Driven Port
    private readonly emails: IEmailService,         // Driven Port
    private readonly passwords: IPasswordHasher,    // Driven Port
    private readonly tokens: ITokenIssuer,          // Driven Port
  ) {}

  async login(email: string, password: string): Promise<{ token: string }> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');

    const valid = await this.passwords.verify(password, user.hashedPassword);
    if (!valid) throw new Error('Invalid credentials');

    return { token: this.tokens.issue({ sub: user.id }) };
  }

  async register(email: string, password: string): Promise<{ userId: string }> {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new Error('Email already taken');

    const hashed = await this.passwords.hash(password);
    const user = new User(crypto.randomUUID(), email, hashed, false);
    await this.users.save(user);
    // sends email via port — no Nodemailer import here
    await this.emails.sendVerificationEmail(email, 'verification-token');
    return { userId: user.id };
  }
}

// ── Secondary Adapters (infrastructure layer) ────────────────────────────────

// TypeORM adapter for IUserRepository — lives outside the hexagon
import { DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';

export class TypeORMUserRepository implements IUserRepository {
  constructor(private readonly ds: DataSource) {}

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.ds.getRepository(UserEntity).findOne({ where: { email } });
    if (!entity) return null;
    return new User(entity.id, entity.email, entity.password, entity.isEmailVerified);
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.ds.getRepository(UserEntity).findOne({ where: { userId: id } });
    if (!entity) return null;
    return new User(entity.userId, entity.email, entity.password, entity.isEmailVerified);
  }

  async save(user: User): Promise<User> {
    await this.ds.getRepository(UserEntity).save({
      userId: user.id, email: user.email, password: user.hashedPassword,
    });
    return user;
  }
}

// ── Primary Adapter: Next.js route handler calls the Driving Port ───────────
// app/api/auth/login/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const result = await authUseCase.login(body.email, body.password);
  return Response.json(result);
}

// ── Composition Root: wire ports to adapters ────────────────────────────────
// libs/composition-root.ts
const userRepo   = new TypeORMUserRepository(systemDataSource);
const emailSvc   = new NodemailerEmailAdapter(smtpConfig);
const passwords  = new BcryptPasswordHasher();
const tokens     = new JwtTokenIssuer(env.ACCESS_TOKEN_SECRET);

export const authUseCase: IAuthUseCase = new AuthUseCase(userRepo, emailSvc, passwords, tokens);
// In tests, replace any of these with in-memory / mock adapters
```

## When to Use
1. **When you want unit tests that run in < 100ms** — swap TypeORM adapters for in-memory maps; no database needed.
2. **When switching infrastructure** — migrating from TypeORM to Drizzle? Rewrite one adapter; the domain core is untouched.
3. **When adding a new payment provider** — exactly what you already do: implement `BasePaymentProvider`, add no code to the domain layer.
4. **When onboarding a new developer** — the port interfaces document exactly what the system needs from infrastructure, which is clearer than reading service implementations.
5. **When building a CLI tool alongside the API** — the CLI is another Primary Adapter calling the same use cases; the domain logic does not know or care.

## Common Mistakes
- **Importing ORM entities into the domain core** — if your `User` class has `@Entity()` or `@Column()` decorators, it has leaked infrastructure into the hexagon. Keep domain entities annotation-free.
- **One adapter per use case** — do not create 30 separate Repository interfaces for 30 use cases. Group by aggregate: `IUserRepository`, `IPaymentRepository`, not `IFindUserByEmailRepository`.
- **Fat Driving Ports** — the Driving Port should be narrow (only what the adapter needs to call). If your HTTP handler uses 3 methods and your CLI uses 2 different methods, it is fine to have two separate Driving Ports.
- **Applying hexagonal to every module immediately** — start with your most-tested or most-changed module. The payment module is already there. AuthService is next. Not every 10-line utility function needs a port.

## Further Reading
- Alistair Cockburn — Hexagonal Architecture (original article): https://alistair.cockburn.us/hexagonal-architecture/
- Khalil Stemmler — "Clean Architecture in TypeScript": https://khalilstemmler.com/articles/enterprise-typescript-nodejs/clean-nodejs-architecture/
- Netflix Tech Blog — Hexagonal Architecture at scale: https://netflixtechblog.com/ready-for-changes-with-hexagonal-architecture-b315ec967749
