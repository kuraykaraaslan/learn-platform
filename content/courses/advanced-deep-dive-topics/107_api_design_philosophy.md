# 107. API Design Philosophy — REST vs GraphQL vs tRPC vs gRPC

## What It Is
API design is not just about endpoints and status codes. It's about choosing a communication contract that fits the relationship between producer and consumer, the team structure, and the evolution trajectory of the system.

REST, GraphQL, tRPC, and gRPC are not competing standards — they solve different problems. REST is a universal contract for public-facing APIs and cross-team boundaries. GraphQL gives clients control over data shape, trading simplicity for flexibility. tRPC eliminates the API layer entirely for TypeScript monorepos where client and server are developed together. gRPC is a binary, strongly-typed protocol optimized for service-to-service communication at low latency.

Choosing wrong means fighting the paradigm: a public REST API built as GraphQL (no versioning story), or tRPC used across team boundaries (loses the type safety benefit when teams use different languages). The decision is permanent at the boundary level — changing it later requires migrating all consumers.

## Key Concepts
- **REST constraints**: Stateless, uniform interface, resource-based URIs, representation (JSON/XML), HATEOAS (optional but theoretically required). Most "REST APIs" are actually HTTP/JSON APIs with REST-like naming.
- **GraphQL**: Client specifies exactly what fields it needs. Single endpoint. Solves over-fetching and under-fetching. Introduces N+1 problem (solved by DataLoader). Schema is the contract.
- **tRPC**: TypeScript RPC — no HTTP layer visible to the developer. Functions on the server become callable from the client with full type inference. Zero code generation. Only works when both sides are TypeScript.
- **gRPC**: Google's RPC framework. Uses Protocol Buffers (binary serialization, ~5-10× smaller than JSON). Strongly typed via `.proto` files. Built-in streaming. Used for service-to-service communication, not browser clients.
- **Over-fetching**: REST returns the full resource; client may only need 2 of 20 fields. Wastes bandwidth and serialization time.
- **Under-fetching / N+1**: REST requires multiple round trips to assemble related data. GraphQL batches this — but naively resolves each field separately, causing N+1 DB queries unless DataLoader is used.
- **Schema-first vs code-first**: GraphQL and gRPC are schema-first (define the contract, generate code). tRPC is code-first (the TypeScript types ARE the contract).
- **Versioning**: REST uses URL versioning (`/v1/users`) or header versioning. GraphQL deprecates fields (no versioning). tRPC has no versioning mechanism — breaking changes require coordination. gRPC uses package namespacing.

## Example Code

```typescript
// tRPC — the natural fit when the client and server share one TypeScript codebase
// server/routers/user.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import UserService from '@/modules/user/user.service';

export const userRouter = router({
  me: protectedProcedure
    .query(async ({ ctx }) => {
      // ctx.userId comes from session — type-safe
      return UserService.getById(ctx.userId);
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      displayName: z.string().min(1).max(100),
      bio: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return UserService.updateProfile(ctx.userId, input);
    }),
});

// client/hooks/useProfile.ts — full type inference, no code gen, no fetch boilerplate
import { trpc } from '@/lib/trpc';

function ProfilePage() {
  const { data: user } = trpc.user.me.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation();
  // TypeScript knows the exact shape of `user` and `input` — no manual types
}

// REST — when your API is public or consumed by non-TypeScript clients
// GET /api/v1/users/:id   → stable, versioned, language-agnostic

// GraphQL DataLoader — solving N+1 when listing users with their tenants
import DataLoader from 'dataloader';

const tenantLoader = new DataLoader(async (tenantIds: readonly string[]) => {
  const tenants = await TenantService.getByIds([...tenantIds]);
  const map = new Map(tenants.map(t => [t.tenantId, t]));
  return tenantIds.map(id => map.get(id) ?? null);
  // All N tenants fetched in ONE query, not N queries
});
```

## When to Use
| Paradigm | Use when |
|---|---|
| **REST** | Public API, multiple client types, cross-team/cross-company boundary, need versioning |
| **GraphQL** | Mobile + web clients with different data needs, complex relational data, rapid UI iteration |
| **tRPC** | Full-stack TypeScript monorepo, internal API, client and server developed together |
| **gRPC** | Service-to-service (microservices), high-throughput, streaming, non-browser clients |

## Common Mistakes
- Using GraphQL for a simple CRUD app — the complexity (schema, resolvers, DataLoader) is not justified
- Using tRPC across team boundaries or language boundaries — you lose the type-safety benefit entirely
- Building a public API with tRPC — no versioning story, non-TypeScript consumers can't use it
- Not using DataLoader with GraphQL — N+1 queries will kill performance under any real load

## Further Reading
- [tRPC docs](https://trpc.io) — especially the Next.js App Router integration guide
- *Production Ready GraphQL* — Marc-André Giroux: the definitive guide to GraphQL API design
- [Google's API Design Guide](https://cloud.google.com/apis/design) — REST best practices from Google's internal standards
