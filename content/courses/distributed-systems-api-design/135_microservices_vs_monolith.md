# 135. Microservices vs Monolith — Service Boundary Design

## What It Is
The monolith-vs-microservices question is really a question about where you want to pay a cost: a monolith concentrates coupling risk (a bug or a slow deploy in one module can affect everything) but keeps operational overhead low (one deployment, one set of logs, transactions that are just database transactions). Microservices push coupling risk down (a failure or slow deploy in one service is contained) but multiply operational overhead by the number of services — each one now needs its own deployment pipeline, its own observability stack (see #53–62), and cross-service calls replace what used to be free in-process function calls with network calls that can fail, time out, or arrive out of order.

The **modular monolith** is the underrated middle step: a single deployable, but with genuinely enforced internal module boundaries (no reaching across module internals, communication through defined interfaces) — it gives you most of the design discipline of service boundaries without paying the distributed-systems tax until you actually need to. The right axis to split along, when you do split, is **business capability** (bounded contexts, #134), not technical layer — "the orders service" is a defensible boundary; "the database service" is the **distributed monolith** anti-pattern, where services must still deploy together because they're actually one system wearing a network boundary as a costume.

## Key Concepts
- **Modular monolith**: one deployable, enforced internal module boundaries — often the right first step
- **Split along business capability, not technical layer**: bounded contexts (#134) are usually the right seams; "auth service," "billing service" — not "database service," "UI service"
- **Distributed monolith anti-pattern**: services that still have to deploy together because their boundaries don't actually decouple anything
- **Team topology heuristic**: a service should be ownable by one team that can deploy it independently — if two teams must coordinate every deploy, the boundary is probably wrong
- **What you gain**: independent scaling, independent deploys, fault isolation
- **What you pay**: network calls replace function calls (latency + failure modes), distributed transactions become eventual consistency problems (#1, #3, #14, #15), and the full observability stack becomes mandatory per service

## Example Code
```typescript
// BEFORE — monolith: a direct, in-process, transactional call
type PlaceOrderInput = {
  sku: string;
  quantity: number;
};

async function placeOrder(input: PlaceOrderInput) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.create({ data: input });
    await tx.inventory.decrement({ where: { sku: input.sku }, data: { qty: input.quantity } });
    return order;
  }); // atomic — either both happen or neither does, for free
}

// AFTER — split into services: the transaction is gone, replaced by an explicit,
// eventually-consistent flow. This is the real cost of the split, not a detail to gloss over.
async function placeOrder(input: PlaceOrderInput) {
  const order = await orderService.create(input);              // network call #1
  try {
    await inventoryService.decrement(input.sku, input.quantity); // network call #2, can fail independently
  } catch (err) {
    await orderService.markFailed(order.id);                    // manual compensation — see #3 Saga Pattern
    throw err;
  }
  return order;
}
```

## When to Use
- A module's deploy cadence, scaling needs, or team ownership has diverged sharply enough from the rest of the system that shipping together is actively slowing everyone down
- Team size has grown to the point where multiple teams stepping on the same deployable is the actual bottleneck, not a technical one
- Start with a modular monolith by default; extract a service only when a specific, named pain (not a hypothetical future one) justifies the operational cost

## Common Mistakes
- Adopting microservices before product-market fit, when the domain model itself is still changing weekly — service boundaries drawn too early get redrawn constantly, at much higher cost than in a monolith
- Splitting by technical layer (a "database service," a "validation service") instead of business capability, producing services that can't deploy independently anyway
- Underestimating the operational overhead — each new service needs its own CI/CD, logging, tracing, alerting; this cost is real and ongoing, not a one-time setup tax
- Treating the split as purely technical, without also splitting team ownership — a shared team maintaining "microservices" gets none of the isolation benefit and all of the coordination cost

## Further Reading
- Sam Newman — "Monolith to Migration" (the practical how, not just the theory)
- [Martin Fowler — "MonolithFirst"](https://martinfowler.com) — the case for starting with a monolith
- Team Topologies by Matthew Skelton & Manuel Pais — the organizational side of the same decision
