# 67. Design Patterns — Knowing When NOT to Use Them

## What It Is
Design patterns are named, reusable solutions to recurring structural problems in code. The GoF (Gang of Four) book catalogued 23 of them in 1994. The problem with learning patterns is that many developers learn them and then look for excuses to use them. A service class wrapped in a Facade wrapped in a Proxy wrapped in a Decorator for a simple CRUD operation is not "applying design patterns" — it is over-engineering.

The genuine skill is pattern recognition in the negative: knowing that you do not need the Command pattern for a 15-line function, that the Observer pattern is not worth its complexity for a notification that only fires in one place, and that a simple conditional is more readable than a Chain of Responsibility for three cases.

The patterns that actually recur in your stack — Strategy, Repository, Factory, Decorator, Observer, Command — are worth knowing well. The others are worth knowing by name so you recognize them when you see them and can reach for them when the problem is exactly right.

## Key Concepts
- **Strategy** — swap algorithms/behaviors at runtime; you already use this for payment providers; also useful for auth strategies, export formats
- **Repository** — abstract the data access layer behind an interface; pairs naturally with DI (items 65–66)
- **Factory / Factory Method** — delegate object creation to a subclass or function; use when the creation logic is complex or needs to vary
- **Decorator** — add behavior to an object without modifying it; useful for wrapping functions with logging, caching, or timing
- **Observer / Event Emitter** — publish events, let subscribers react; Node.js `EventEmitter` is this; use for loosely coupled side effects
- **Command** — encapsulate an action as an object; useful for undo, queuing, audit logs of operations
- **Singleton** — one instance per process; valid for DB connections and loggers; overused everywhere else
- **Registry** — a central store of named instances; you use this to select payment providers by name
- **YAGNI** — "You Aren't Gonna Need It"; the single most useful design principle for knowing when NOT to apply a pattern

## Example Code
```typescript
// ── Strategy (a payment provider interface is the textbook case) ─────────────
// Extended example: Strategy for notification channels
interface NotificationStrategy {
  send(to: string, subject: string, body: string): Promise<void>;
}

class EmailNotification implements NotificationStrategy {
  async send(to: string, subject: string, body: string) { /* Nodemailer */ }
}

class SlackNotification implements NotificationStrategy {
  async send(to: string, _subject: string, body: string) { /* Slack webhook */ }
}

// The context — picks strategy based on user preference
class NotificationService {
  constructor(private readonly strategy: NotificationStrategy) {}
  async notify(to: string, subject: string, body: string) {
    return this.strategy.send(to, subject, body);
  }
}

// ── Decorator — add logging/timing to any async function ────────────────────
function withTiming<T extends unknown[], R>(
  name: string,
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      console.log(`[TIMING] ${name} completed in ${Date.now() - start}ms`);
      return result;
    } catch (err) {
      console.error(`[TIMING] ${name} failed after ${Date.now() - start}ms`);
      throw err;
    }
  };
}

// Apply decorator without touching original function
const timedLogin = withTiming('AuthService.login', AuthService.login.bind(AuthService));

// ── Command — wrap operations for BullMQ queuing and audit logging ───────────
interface Command<TPayload, TResult> {
  execute(payload: TPayload): Promise<TResult>;
}

// One command = one queue job type + one audit log entry
class SendVerificationEmailCommand implements Command<{ userId: string; email: string }, void> {
  constructor(private readonly emailService: IEmailService) {}

  async execute({ userId, email }: { userId: string; email: string }): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    await this.emailService.sendVerificationEmail(email, token);
    // Every Command implementation naturally produces an audit entry
    console.log(`[AUDIT] SendVerificationEmail executed for userId=${userId}`);
  }
}

// ── When NOT to use patterns: the over-engineering counter-examples ──────────

// ❌ Overkill: Factory Method for something that only ever creates one thing
class UserFactory {
  static create(email: string): User {
    return new User(email); // just write `new User(email)` — this factory adds nothing
  }
}

// ❌ Overkill: Observer for a side effect that only happens in one place
// If sendWelcomeEmail() is only called after register(), do not build an event system for it.
// Just call it directly. Build the event system when you have 3+ subscribers.

// ❌ Overkill: Chain of Responsibility for 3 validation rules
// Just write three if-statements. CoR adds cognitive overhead with no benefit under ~10 handlers.

// ✓ Right fit: Observer when you have 4+ independent side effects on user registration
import { EventEmitter } from 'events';
const userEvents = new EventEmitter();

userEvents.on('user.registered', async ({ userId, email }) => sendWelcomeEmail(email));
userEvents.on('user.registered', async ({ userId }) => initializeUserSettings(userId));
userEvents.on('user.registered', async ({ userId }) => sendSlackNotification(userId));
userEvents.on('user.registered', async ({ userId }) => provisionFreeTrial(userId));

// At 4 side effects, Observer starts paying off: adding a 5th never touches registration code.
```

## When to Use
1. **Strategy** — you have 3+ implementations of the same operation that are interchangeable; payment providers, export formats, auth methods are perfect fits.
2. **Repository** — any time your service talks to a database directly; abstract it so tests can swap a real DB for an in-memory map.
3. **Decorator** — you want to add cross-cutting concerns (logging, caching, rate limiting, retries) without modifying the original function; function wrappers are the TypeScript-idiomatic form.
4. **Observer / EventEmitter** — a single action (user registered, payment confirmed) triggers 3+ independent side effects; an event bus decouples the trigger from the reactions.
5. **Command** — you need to queue, log, retry, or undo operations; each command is a self-contained unit of work with a clear name.

## Common Mistakes
- **Using a pattern for its name** — "I'm using the Builder pattern" is not a reason. The reason is "constructing this object requires 8 optional parameters and complex validation logic." If that is not your situation, `new MyClass(a, b)` is fine.
- **Singleton for everything** — Singletons make testing hard because they carry state across tests. Use dependency injection with a singleton scope in your container rather than a class-level `static instance`.
- **Observer for synchronous control flow** — if you emit an event and immediately need the result, use a direct function call. Events are for fire-and-observe, not request/response.
- **Treating all 23 GoF patterns as equally important** — in a TypeScript web app, you will use Strategy, Repository, Decorator, Factory, and Observer constantly. Flyweight and Visitor almost never.

## Further Reading
- Refactoring Guru — pattern catalog with TypeScript examples: https://refactoring.guru/design-patterns
- Khalil Stemmler — Design Patterns in TypeScript: https://khalilstemmler.com/articles/software-design-architecture/design-patterns/
- "Head First Design Patterns" (Freeman & Robson) — the most accessible intro to GoF patterns
