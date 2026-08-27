# 9. API Versioning Strategies (URL vs Header vs Content Negotiation)

## What It Is
API versioning is the contract you make with API consumers: "as long as you call v1, it will behave the same way." Without explicit versioning, every breaking change — renaming a field, changing a response shape, removing a parameter — silently breaks all clients that depend on the current behavior. For a multi-tenant SaaS where tenants use your API for integrations, this matters the day you have your first external integration.

The three main strategies each have different ergonomics. **URL versioning** (`/api/v1/users`) is the most visible and most widely used. It's easy to test with curl, bookmarkable, easy to route in Next.js, and makes the version explicit in logs and monitoring. The downside is that it's technically "impure" — a URL is supposed to identify a resource, not a version of a contract. **Header versioning** (`API-Version: 2024-01-15`) keeps URLs clean and is how Stripe does it: the version is a date, and you only need to update it when you want to opt into breaking changes. This is elegant but requires every client to set a header and makes caching more complex (the `Vary` header must include the version header). **Content negotiation** (`Accept: application/vnd.myapi.v2+json`) is the most HTTP-compliant but almost never used in practice for REST APIs — too verbose and poorly supported by HTTP clients.

For a multi-tenant SaaS starting from scratch, a hybrid is reasonable: URL versioning for your public API (`/api/v1/`), header-based versioning for internal feature flags and preview features. The most important principle is to define what constitutes a "breaking change" and have a migration path and sunset timeline documented before your first external integration goes live.

## Key Concepts
- **Breaking change**: Any change that would cause an existing client to break — removing a field, changing a field type, changing required/optional status, changing authentication scheme
- **Non-breaking change**: Adding new optional fields, adding new endpoints, adding new enum values (if clients treat unknown values gracefully)
- **URL versioning**: `/api/v1/`, `/api/v2/` — visible, easy to route, most common for REST APIs
- **Header versioning**: `API-Version: 2024-01-15` — clean URLs, date-based versioning allows gradual migration, used by Stripe
- **Content negotiation**: `Accept: application/vnd.company.v2+json` — HTTP-purist approach, rare in practice
- **Sunset header**: `Sunset: Sat, 31 Dec 2025 23:59:59 GMT` — HTTP header telling clients when a version will be retired
- **Version lifetime**: How long you support an old version after releasing a new one — 6–12 months is common
- **Changelog discipline**: Every breaking change must be documented with migration instructions before deployment

## Example Code
```typescript
// URL versioning in Next.js App Router
// File structure:
//   app/api/v1/users/route.ts       → v1 handler
//   app/api/v2/users/route.ts       → v2 handler
//   libs/api/version.ts             → version detection utility

// --- libs/api/version.ts: shared versioning utilities ---

export type ApiVersion = 'v1' | 'v2';

// For header-based versioning alongside URL versioning:
// Tenant sends "API-Version: 2024-06-01" to opt into v2 behavior
// while still calling /api/v1/users
const VERSION_DATES: Record<string, ApiVersion> = {
  '2024-01-01': 'v1',
  '2024-06-01': 'v2',
};

export function resolveApiVersion(request: Request): ApiVersion {
  const headerVersion = request.headers.get('api-version');
  if (headerVersion && VERSION_DATES[headerVersion]) {
    return VERSION_DATES[headerVersion];
  }
  // Fall back to URL-based detection
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/v2/')) return 'v2';
  return 'v1';
}

// --- Sunset middleware: warn clients they're on a deprecated version ---
export function addSunsetHeaders(
  response: Response,
  version: ApiVersion
): Response {
  const sunsets: Partial<Record<ApiVersion, string>> = {
    v1: 'Sat, 31 Dec 2025 23:59:59 GMT',
  };
  const sunset = sunsets[version];
  if (sunset) {
    response.headers.set('Sunset', sunset);
    response.headers.set(
      'Deprecation',
      'true'
    );
    response.headers.set(
      'Link',
      '</api/v2/docs>; rel="successor-version"'
    );
  }
  return response;
}

// --- Version-specific response transformation ---
// Prefer transforming v1 responses from v2 logic rather than duplicating handlers
interface UserV1 { id: string; name: string; email: string }
interface UserV2 { id: string; displayName: string; emailAddress: string }

function toV1User(v2User: UserV2): UserV1 {
  return {
    id: v2User.id,
    name: v2User.displayName,        // field was renamed
    email: v2User.emailAddress,      // field was renamed
  };
}

// app/api/v1/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const v2User = await getUserV2(params.id); // Single source of truth: v2 business logic
  const v1User = toV1User(v2User);           // Downgrade for v1 clients

  let response = NextResponse.json(v1User);
  response = addSunsetHeaders(response, 'v1') as NextResponse;
  return response;
}
```

## When to Use
- As soon as you have one external integration built by a tenant or a third party — add versioning before it's needed, not after
- When you're about to change a response shape that existing clients depend on
- When you offer a public API or developer program — versioning is table stakes
- When you want to ship breaking improvements (e.g., a better data model) without forcing all clients to migrate simultaneously

## Common Mistakes
- **Adding versioning only after the first breaking change**: By then you already have clients on the "v0" implicit version; you have to version-bump everything retroactively and it's a mess
- **Maintaining separate full codebases per version**: Version-specific logic should be at the serialization/transformation layer, not duplicated business logic — one source of truth, multiple output shapes
- **No sunset dates**: A v1 that was supposed to die in January 2024 is still running in 2026 because no one set a deadline and communicated it to clients
- **Versioning every endpoint separately**: If you have `/api/v1/users` and `/api/v2/users` but `/api/v1/tenants` never got updated, the version signal is meaningless — version the API as a whole, not per-resource

## Further Reading
- [**Stripe API documentation — versioning policy](https://stripe.com/docs/upgrades)** — The gold standard for API versioning UX; their date-based versioning and changelog approach is worth emulating
- [**"RESTful API Design" by Apigee](https://cloud.google.com/apis/design)** — Google's API Design Guide covers versioning, backward compatibility, and breaking changes with concrete examples
- [**"API Versioning Has No Right Way" by Troy Hunt](https://troyhunt.com)** — An honest breakdown of tradeoffs for each approach; pragmatic and not dogmatic
