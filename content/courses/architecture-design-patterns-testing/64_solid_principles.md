# 64. SOLID Principles — Practical Application

## What It Is
SOLID is an acronym for five object-oriented design principles that, when applied together, make code easier to change without breaking unrelated things. They are not rules to follow dogmatically — they are heuristics that, when violated, reliably produce code that is hard to test, extend, and maintain.

**S — Single Responsibility**: a class/module should have only one reason to change. Your `AuthService` currently changes when login logic changes, when email verification logic changes, when token formats change, and when password policy changes. That is four reasons.

**O — Open/Closed**: open for extension, closed for modification. Your `BasePaymentProvider` + `StripeProvider`/`PaypalProvider`/`IyzicoProvider` is a textbook example of this done correctly. Adding a new payment provider never modifies existing code.

**L — Liskov Substitution**: any subclass or implementation of an interface should be substitutable for the base without breaking the program. All your payment providers are LSP-compliant because they implement the same interface and the caller does not need to know which one it has.

**I — Interface Segregation**: do not force a class to implement methods it does not use. A fat interface with 20 methods that only 3 are ever used violates this. Your `BasePaymentProvider` is appropriately focused.

**D — Dependency Inversion**: depend on abstractions, not concretions. Right now, `AuthService.login` calls `UserService.getByEmail` directly — a static import, a concrete dependency. If you want to test `AuthService.login` in isolation, you cannot substitute a mock `UserService`. DI inverts this by injecting dependencies.

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

// ── Define interfaces (abstractions) ────────────────────────────────────────

// ISP: UserRepository only has what AuthService actually needs
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
    const user = { id: 'mock-id', ...data } as UserRecord;
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
