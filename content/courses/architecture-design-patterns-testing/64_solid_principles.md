# 64. SOLID Principles — Practical Application

## What It Is
SOLID is an acronym for five object-oriented design principles that, when applied together, make code easier to change without breaking unrelated things. They are not rules to follow dogmatically — they are heuristics that, when violated, reliably produce code that is hard to test, extend, and maintain.

**S — Single Responsibility**: a class/module should have only one reason to change. Your `AuthService` currently changes when login logic changes, when email verification logic changes, when token formats change, and when password policy changes. That is four reasons.

**O — Open/Closed**: open for extension, closed for modification. Your `BasePaymentProvider` + `StripeProvider`/`PaypalProvider`/`IyzicoProvider` is a textbook example of this done correctly. Adding a new payment provider never modifies existing code.

**L — Liskov Substitution**: any subclass or implementation of an interface should be substitutable for the base without breaking the program. All your payment providers are LSP-compliant because they implement the same interface and the caller does not need to know which one it has.

**I — Interface Segregation**: do not force a class to implement methods it does not use. A fat interface with 20 methods that only 3 are ever used violates this. Your `BasePaymentProvider` is appropriately focused.

**D — Dependency Inversion**: depend on abstractions, not concretions. Right now, `AuthService.login` calls `UserService.getByEmail` directly — a static import, a concrete dependency. If you want to test `AuthService.login` in isolation, you cannot substitute a mock `UserService`. DI inverts this by injecting dependencies.

```quiz
- q: "A `ReadOnlyRepository` extends `Repository` and throws on `save()`. Which principle does that break?"
  anchor: "violated when a subclass throws on a method the parent doesn't throw on"
  options:
    - text: "SRP — the class now carries two responsibilities"
      correct: false
      why: "It carries one. What broke is that it can no longer stand in for its parent."
    - text: "LSP — a subclass throwing where the parent does not is the textbook violation"
      correct: true
      why: "Implementations are meant to be interchangeable, and every caller holding a `Repository` now breaks."
    - text: "ISP — the interface is too large for this implementation"
      correct: false
      why: "That is a fair diagnosis of the underlying design, and splitting the interface is the fix. The violation as written is still substitutability."

- q: "A fourth payment provider means a fourth branch in the same `if/else`. What does OCP ask for instead?"
  anchor: "add behavior via new classes/plugins, not via `if/else` chains in existing code"
  options:
    - text: "Extract each branch body into a private method on the same class"
      correct: false
      why: "The chain is still edited for every new provider. The shape changed; the coupling did not."
    - text: "A new class or plugin, with the existing code untouched"
      correct: true
      why: "Open for extension, closed for modification: the fourth provider should not require editing the code that handles the first three."
    - text: "A lookup table mapping provider names to booleans"
      correct: false
      why: "It replaces branching with data, but the behaviour still lives in the file that has to change."

- q: "Your `OrderService` imports `PostgresOrderRepository` directly. What does DIP say about that?"
  anchor: "high-level modules should not import low-level modules directly; both should depend on an abstraction (interface)"
  options:
    - text: "Nothing — the service has to talk to storage somehow"
      correct: false
      why: "It does, but through an abstraction both sides depend on, rather than by importing the concrete class."
    - text: "Both should depend on an interface; the high-level module must not import the low-level one"
      correct: true
      why: "Constructor injection is the idiomatic way to hand over the concrete implementation without importing it."
    - text: "Invert it — `PostgresOrderRepository` should import `OrderService`"
      correct: false
      why: "That is a different arrow, not an inverted dependency. Both are supposed to point at an abstraction, not at each other."
```

## Key Concepts
- **SRP** — one class, one axis of change; use it to decide when to extract a new module
- **OCP** — add behavior via new classes/plugins, not via `if/else` chains in existing code
- **LSP** — implementations are interchangeable; violated when a subclass throws on a method the parent doesn't throw on
- **ISP** — prefer small, focused interfaces over one large interface; clients depend only on what they use
- **DIP** — high-level modules should not import low-level modules directly; both should depend on an abstraction (interface)
- **Constructor injection** — the idiomatic DI pattern: dependencies are passed in as constructor arguments
- **Interface (TypeScript)** — the abstraction layer between caller and implementation; enables substitution and testing
- **God class** — a class that violates SRP badly; has dozens of methods and knows too much about the system

## Example Code
```typescript
// Demonstrating DIP + ISP + SRP applied to AuthService

// The validated environment object — one place reads process.env, everything
// else imports the parsed result. A secret typed as `string` here is a secret
// the app cannot start without.
declare const env: { ACCESS_TOKEN_SECRET: string };

// ── Define interfaces (abstractions) ────────────────────────────────────────

// The two shapes the repository port trades in. `UserRecord` is what storage
// returns — note it carries the hash, never the password — and `CreateUserDto`
// is what a caller may supply. Keeping them separate is ISP applied to data:
// a create call has no business being able to set an id.
type UserRecord = {
  id: string;
  email: string;
  hashedPassword: string;
};

type CreateUserDto = {
  email: string;
  password: string;
};

// ISP: UserRepository only has what AuthService actually needs
import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
interface IUserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(data: CreateUserDto): Promise<UserRecord>;
}

// ISP: separate interface for password operations
interface IPasswordService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

interface ITokenService {
  generateAccessToken(userId: string): string;
  generateRefreshToken(userId: string): string;
}

// ── SRP: split AuthService into focused classes ──────────────────────────────

// This class has ONE reason to change: login/logout flow business logic
class AuthService {
  constructor(
    // DIP: depend on abstractions, not on UserService.getByEmail() static call
    private readonly users: IUserRepository,
    private readonly passwords: IPasswordService,
    private readonly tokens: ITokenService,
  ) {}

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');

    const valid = await this.passwords.compare(password, user.hashedPassword);
    if (!valid) throw new Error('Invalid credentials');

    return { accessToken: this.tokens.generateAccessToken(user.id) };
  }
}

// ── Concrete implementations ─────────────────────────────────────────────────

// SRP: PasswordService only knows about hashing — not tokens, not users
class BcryptPasswordService implements IPasswordService {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 12);
  }
  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}

// TypeORM concrete implementation of IUserRepository
class TypeORMUserRepository implements IUserRepository {
  constructor(private readonly ds: DataSource) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.ds.getRepository(UserEntity).findOne({ where: { email } });
  }

  async create(data: CreateUserDto): Promise<UserRecord> {
    const entity = this.ds.getRepository(UserEntity).create(data);
    return this.ds.getRepository(UserEntity).save(entity);
  }
}

// OCP: to test AuthService, substitute a mock — no framework needed
class MockUserRepository implements IUserRepository {
  private users: UserRecord[] = [];

  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async create(data: CreateUserDto) {
    // `data` is a CreateUserDto, so it carries `password`, not `hashedPassword` —
    // a straight cast is rejected, and rightly so. Building the record explicitly
    // is also the honest version: a fake repository still has to hash.
    const user: UserRecord = {
      id: 'mock-id',
      email: data.email,
      hashedPassword: `hashed:${data.password}`,
    };
    this.users.push(user);
    return user;
  }

  // Test helper: seed a user
  seed(user: UserRecord) { this.users.push(user); }
}

// Wiring (composition root — do this once at app startup, not scattered everywhere)
const authService = new AuthService(
  new TypeORMUserRepository(dataSource),
  new BcryptPasswordService(),
  new JwtTokenService(env.ACCESS_TOKEN_SECRET),
);

// LSP: in tests, swap real implementations for mocks — AuthService never knows the difference
const testAuthService = new AuthService(
  new MockUserRepository(),
  new BcryptPasswordService(),
  new StaticTokenService('test-token'),
);
```

## When to Use
1. **SRP** — when you find yourself saying "and also..." while describing what a class does; that "and also" is a second responsibility to extract.
2. **OCP** — when adding a new variant (new payment provider, new notification channel, new auth strategy) requires editing existing code rather than adding new code.
3. **DIP** — when you want to write unit tests but cannot mock a dependency because it is a static import; DI is the cure.
4. **ISP** — when a class implementing an interface has methods that always throw `NotImplementedError` or are left empty; the interface is too fat.
5. **LSP** — when you have `if (provider instanceof StripeProvider)` in the calling code; that is a smell that substitution is broken.

## Common Mistakes
- **Applying SOLID to every single function** — these principles are for class and module design, not for every 3-line utility function. Over-engineering small code hurts readability.
- **Creating interfaces for everything immediately** — create an interface only when you have two implementations or when you need to test in isolation. Premature interface creation adds noise.
- **Confusing SRP with "one method per class"** — a class can have 10 methods and still have a single responsibility. The test is: does it have more than one reason to change?
- **Static methods everywhere** — static methods are not inherently wrong, but they cannot be injected, mocked, or replaced. Lean toward instance methods when the class holds state or when testing matters.

## Further Reading
- Robert C. Martin — "Clean Architecture" (the definitive SOLID reference)
- SOLID principles in TypeScript: https://blog.logrocket.com/solid-principles-typescript/
- Khalil Stemmler — SOLID in Domain-Driven Design: https://khalilstemmler.com/articles/solid-principles/

```recall
- q: "State SRP and ISP, and what each one is used to decide."
  must:
    - "SRP — one class, one axis of change; it decides when to extract a new module"
    - "ISP — prefer small, focused interfaces over one large one, so clients depend only on what they use"

- q: "What is constructor injection, and what does the interface buy?"
  must:
    - "dependencies are passed in as constructor arguments — the idiomatic DI pattern"
    - "the interface is the abstraction layer between caller and implementation"
    - "it enables substitution and testing"

- q: "What is a god class?"
  must:
    - "a class that violates SRP badly"
    - "dozens of methods, and it knows too much about the system"
```
