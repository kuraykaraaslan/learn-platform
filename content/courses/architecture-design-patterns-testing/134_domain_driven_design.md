# 134. Domain-Driven Design — Bounded Contexts, Aggregates, Ubiquitous Language

## What It Is
DDD is really two separate toolkits aimed at one problem: complex business domains where the same word means different things to different stakeholders. **Strategic DDD** addresses that directly with the **bounded context** — an explicit boundary within which a term has exactly one meaning and one model. "Customer" in the billing context (has a payment method, a balance) is a different model from "customer" in the support context (has a ticket history, a satisfaction score), even though they're the same human — trying to force one unified `Customer` model across both is where a lot of accidental complexity comes from. **Ubiquitous language** is the discipline of using the domain experts' actual vocabulary in the code itself, so a conversation with a product stakeholder and a conversation about the code use the same words.

**Tactical DDD** is the set of building blocks inside a bounded context: an **entity** has identity that persists through change (a `User` is still "the same user" after their email changes); a **value object** has no identity, only its attributes (a `Money` amount, an `Address` — two with the same values are interchangeable); an **aggregate** is a cluster of entities/value objects with a single **aggregate root** that owns and enforces the invariants for the whole cluster, and is the *only* thing allowed to be referenced from outside it. This is what stops "any code anywhere can mutate any part of the domain" — invariants live in one place and are impossible to bypass.

## Key Concepts
- **Bounded context**: an explicit boundary where a term has exactly one model and meaning
- **Ubiquitous language**: domain experts and code use the same vocabulary, deliberately, everywhere
- **Entity**: has identity that persists across state changes
- **Value object**: no identity, defined entirely by its attributes, typically immutable
- **Aggregate & aggregate root**: a consistency boundary — the root enforces invariants for the whole cluster and is the only external reference point
- **Domain event**: something meaningful that happened in the domain (`OrderShipped`), decoupled from how other parts react to it (ties to #131 Message Queues, #14 Outbox Pattern)
- **Anti-corruption layer**: a translation boundary that prevents another system's (or legacy) model from leaking into your bounded context's model

## Example Code
```typescript
// A line is a value object: no identity of its own, meaningful only inside an
// Order. It is declared before the aggregate because the aggregate owns it.
type OrderLine = {
  sku: string;
  quantity: number;
  unitPrice: Money;
};

// Order aggregate: the root enforces the invariant "can't ship before payment"
// External code can never reach in and set status directly — only through methods that protect the rule.
class Order {
  private status: "pending" | "paid" | "shipped" = "pending";
  private readonly items: OrderLine[] = [];

  constructor(private readonly id: string) {}

  addItem(item: OrderLine) {
    if (this.status !== "pending") throw new Error("cannot modify a finalized order");
    this.items.push(item);
  }

  markPaid() {
    if (this.items.length === 0) throw new Error("cannot pay for an empty order");
    this.status = "paid";
  }

  ship() {
    if (this.status !== "paid") throw new Error("cannot ship an order that hasn't been paid"); // the invariant
    this.status = "shipped";
    // raise a domain event here (see #14 Outbox Pattern for reliably publishing it)
  }
}

// Money as a value object: no identity, equality is by value, immutable
class Money {
  constructor(readonly cents: number, readonly currency: "USD" | "TRY") {}
  add(other: Money): Money {
    if (other.currency !== this.currency) throw new Error("currency mismatch");
    return new Money(this.cents + other.cents, this.currency);
  }
  equals(other: Money): boolean {
    return this.cents === other.cents && this.currency === other.currency;
  }
}
```

## When to Use
- A domain with real business complexity, multiple stakeholders, and terminology that genuinely conflicts across teams
- Deciding service/module boundaries for #135 (Microservices vs Monolith) — bounded contexts are usually the right seams
- Any place invariants are currently enforced inconsistently across multiple call sites — an aggregate root centralizes them

## Common Mistakes
- Applying full DDD ceremony (aggregates, value objects, domain events) to simple CRUD domains with no real business complexity — pure overhead
- Anemic domain models — entities that are just data bags, with all logic living in separate "service" classes, defeating the point of an aggregate enforcing its own invariants
- Aggregates drawn too large, turning every write into a wide transactional lock instead of a narrow, well-justified one
- Letting a bounded context's model leak into another (e.g. passing a billing-context `Customer` object directly into support-context code) instead of translating at the boundary

## Further Reading
- "Domain-Driven Design Distilled" by Vaughn Vernon — the practical, shorter entry point
- Eric Evans — "Domain-Driven Design" (the original, denser "blue book")
- [Martin Fowler — "AggregateOrientedDatabase" and "BoundedContext" articles](https://martinfowler.com)
- [Martin Fowler on Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html) — the short definition to argue from, and the bliki entries it links
