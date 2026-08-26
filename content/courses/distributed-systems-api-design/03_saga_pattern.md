# 3. Saga Pattern (Orchestration vs Choreography)

## Coverage Level
**Not Covered** — Your boilerplate handles multi-step operations (e.g., user registration + tenant creation + email send) as sequential awaits in a single service method, with no compensation logic if a later step fails.

## What It Is
A Saga is a pattern for managing distributed transactions — sequences of local transactions where each step produces a side effect and, if a later step fails, previously completed steps are undone using compensating transactions. The classic example: a user upgrades their subscription, which triggers a charge, which triggers a seat allocation, which triggers a welcome email. If the seat allocation fails after the charge succeeds, you need to issue a refund. A Saga makes that compensation explicit and reliable.

There are two implementation styles. **Choreography** has each service listen for events and react independently — no central coordinator. Service A completes, emits `OrderPlaced`; Service B listens, charges the card, emits `PaymentSucceeded`; Service C listens, allocates seats. Compensation works the same way in reverse via failure events. This is decentralized and scales well, but the overall flow is implicit and hard to trace. **Orchestration** has a central Saga orchestrator (a state machine) that explicitly calls each service in sequence and knows the full compensation plan. The flow is visible in one place, which makes debugging and observability much easier — at the cost of a central component.

For a solo developer on a SaaS, orchestration is almost always the right choice to start. Your BullMQ setup is a natural place to implement a saga orchestrator: each saga step is a job, the saga state machine lives in a dedicated queue, and compensating jobs are added on failure. The benefit isn't just correctness — it's that you finally have a single place where "what is the system doing right now for tenant X's signup?" has a definitive answer.

## Key Concepts
- **Local transaction**: A single atomic operation within one service or database; sagas compose these
- **Compensating transaction**: The undo operation for a completed step — not a rollback, but a new forward-moving transaction that reverses the effect
- **Choreography**: Saga steps are triggered by events; each participant reacts independently; no central coordinator
- **Orchestration**: A central saga orchestrator calls each step explicitly and manages compensation; the flow is visible in one place
- **Saga state machine**: The orchestrator's representation of where a saga is in its lifecycle (e.g., `STARTED → CHARGED → SEATS_ALLOCATED → COMPLETED`)
- **Idempotency**: Each saga step must be idempotent — if retried due to a crash, it must not double-charge or double-allocate
- **Durability**: Saga state must be persisted — if the orchestrator crashes mid-saga, it must be able to resume from the last known step

## Example Code
```typescript
// Orchestrated saga for tenant onboarding using BullMQ
// Steps: create tenant → charge card → allocate seats → send welcome email
// Each step can compensate if a later step fails

import { Queue, Worker, Job } from 'bullmq';

type SagaStep =
  | 'CREATE_TENANT'
  | 'CHARGE_CARD'
  | 'ALLOCATE_SEATS'
  | 'SEND_WELCOME_EMAIL'
  | 'COMPENSATE_CHARGE'
  | 'COMPENSATE_TENANT';

interface OnboardingSagaState {
  sagaId: string;
  tenantId?: string;
  chargeId?: string;
  step: SagaStep;
  input: { ownerId: string; planId: string; paymentMethodId: string };
}

const sagaQueue = new Queue<OnboardingSagaState>('tenant-onboarding-saga');

// --- Orchestrator worker: one step at a time, persisting state between steps ---
const orchestrator = new Worker<OnboardingSagaState>(
  'tenant-onboarding-saga',
  async (job: Job<OnboardingSagaState>) => {
    const state = job.data;

    switch (state.step) {
      case 'CREATE_TENANT': {
        const tenant = await createTenant(state.input.ownerId);
        // Persist progress then move to next step
        await sagaQueue.add('saga', {
          ...state,
          tenantId: tenant.id,
          step: 'CHARGE_CARD',
        });
        break;
      }

      case 'CHARGE_CARD': {
        try {
          const charge = await chargeCard(state.input.paymentMethodId, state.input.planId);
          await sagaQueue.add('saga', {
            ...state,
            chargeId: charge.id,
            step: 'ALLOCATE_SEATS',
          });
        } catch {
          // Charge failed — compensate by deleting the tenant
          await sagaQueue.add('saga', { ...state, step: 'COMPENSATE_TENANT' });
        }
        break;
      }

      case 'ALLOCATE_SEATS': {
        try {
          await allocateSeats(state.tenantId!, state.input.planId);
          await sagaQueue.add('saga', { ...state, step: 'SEND_WELCOME_EMAIL' });
        } catch {
          // Seat allocation failed — compensate charge first, then tenant
          await sagaQueue.add('saga', { ...state, step: 'COMPENSATE_CHARGE' });
        }
        break;
      }

      case 'COMPENSATE_CHARGE':
        await refundCharge(state.chargeId!);
        await sagaQueue.add('saga', { ...state, step: 'COMPENSATE_TENANT' });
        break;

      case 'COMPENSATE_TENANT':
        await deleteTenant(state.tenantId!);
        // Saga ends in a compensated state — log and alert
        break;
    }
  }
);

// Kick off a saga
async function startOnboardingSaga(input: OnboardingSagaState['input']) {
  await sagaQueue.add('saga', {
    sagaId: crypto.randomUUID(),
    step: 'CREATE_TENANT',
    input,
  });
}
```

## When to Use
- Any multi-step operation that spans more than one service or has side effects that cannot be atomically rolled back (payments, emails, third-party API calls)
- Tenant onboarding flows: create account → provision database schema → charge card → send email
- Subscription lifecycle events: upgrade → prorate charge → update seat limits → notify members
- Any workflow where "we need to know exactly where this got stuck" is a support or ops requirement

## Common Mistakes
- **Using a single try/catch for multi-step flows**: If step 3 throws, steps 1 and 2 have already committed; you need explicit compensation, not just a rollback
- **Non-idempotent saga steps**: If the orchestrator crashes after step 2 succeeds but before it records the progress, step 2 will be retried; if `chargeCard` is not idempotent, you charge twice
- **Choosing choreography for complex flows**: Choreography looks elegant for 3 steps; for 7 steps with branching compensation paths, the implicit flow becomes untraceable — start with orchestration
- **Not persisting saga state durably**: In-memory saga state is lost on process restart; use a database or a durable queue like BullMQ backed by Redis persistence (AOF/RDB)

## Further Reading
- **"Microservices Patterns" by Chris Richardson** — Chapter 4 is the canonical treatment of the Saga pattern with detailed orchestration and choreography examples
- **"Saga: How to Implement Complex Business Transactions Without Two-Phase Commit" — Hector Garcia-Molina & Kenneth Salem (1987 paper)** — The original paper; surprisingly readable and short
- **BullMQ documentation — "Job Dependencies" and "Flows"** — BullMQ's flow producer is a ready-made tool for orchestrated sagas in a Node.js stack; worth reading before building a custom orchestrator
