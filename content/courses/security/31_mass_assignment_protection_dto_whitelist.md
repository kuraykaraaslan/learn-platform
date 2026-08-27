# 31. Mass Assignment Protection — DTO Whitelist

## What It Is
Mass assignment is the vulnerability where a server takes a user-supplied object and directly assigns it to a database model without filtering which fields are allowed. If your registration endpoint does `await userRepo.save(req.body)` and your user model has a `userRole` field, an attacker who POSTs `{"email":"x@x.com","password":"pw","userRole":"ADMIN"}` has just made themselves an admin. This is not a theoretical attack — it has been exploited against GitHub (2012), GitLab, and dozens of SaaS products.

The protection is to explicitly declare which fields are accepted for each operation. This is a whitelist approach (declare what is allowed) rather than a blacklist approach (declare what is forbidden). Blacklists fail when you add a new sensitive field and forget to add it to the blocklist. Whitelists fail only if you explicitly add a sensitive field to the allowed DTO — a much harder mistake to make accidentally.

Your Zod DTOs accomplish this in a particularly clean way. `z.object({ email: z.string(), password: z.string() }).parse(body)` produces an object that provably contains only `email` and `password`, regardless of what was in the original `body`. Zod strips unknown keys by default in `.parse()` (when combined with `.strip()`, which is the default mode). This means even if the attacker sends extra fields, they are silently dropped before the data reaches your service layer.

## Key Concepts
- **Mass assignment** — Binding a user-supplied object directly to a database entity without field filtering
- **DTO (Data Transfer Object)** — A plain object that defines exactly what shape of data is accepted for a given operation
- **Whitelist approach** — Declare allowed fields explicitly; everything else is rejected or stripped
- **Blacklist approach (anti-pattern)** — Declare forbidden fields; fails when new sensitive fields are added without updating the blocklist
- **Zod `.strip()` (default)** — Unknown keys in the input are silently removed from the parsed output; the parsed object is safe to pass to the ORM
- **Zod `.strict()`** — Unknown keys throw a `ZodError`; useful when you want to detect clients sending unexpected fields (useful for debugging protocol mismatches)
- **Partial DTOs** — `UpdateUserDto = RegisterDto.partial()` makes all fields optional for PATCH operations while preserving the whitelist
- **Nested object injection** — Mass assignment can happen inside nested objects too; your Zod schema must cover the full shape including nested structures

## Example Code
```typescript
// modules/user/user.dto.ts
import { z } from 'zod';

// --- Registration: only these fields are accepted from the client ---
export const RegisterDto = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  phone: z.string().optional(),
});

// Fields deliberately NOT in RegisterDto:
//   userRole      — assigned by the system, not the client
//   userStatus    — assigned by the system
//   emailVerifiedAt — set by verification flow, not registration
//   createdAt     — database default

export type RegisterDtoType = z.infer<typeof RegisterDto>;

// --- Profile update: a separate DTO with different allowed fields ---
export const UpdateProfileDto = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  // notice: email is NOT here — changing email goes through a separate verified flow
  // notice: phone is NOT here — same reason
});

// --- Admin-only update: extended set of fields, only used in admin routes ---
export const AdminUpdateUserDto = z.object({
  userRole: z.enum(['USER', 'ADMIN']),
  userStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  emailVerifiedAt: z.date().nullable().optional(),
});

// ─── Service layer: always parse before touching the ORM ──────────────────

export class UserService {
  static async register(rawBody: unknown) {
    // .parse() strips unknown keys and validates types
    // rawBody could contain { email, password, userRole: 'ADMIN' }
    // after parse, dto only has { email, password }
    const dto = RegisterDto.parse(rawBody);

    // Safe to pass to ORM — dto cannot contain userRole
    return await prisma.user.create({ data: dto });
  }

  static async updateProfile(userId: string, rawBody: unknown) {
    const dto = UpdateProfileDto.parse(rawBody);
    // dto can only contain name and/or avatarUrl — nothing else
    return await prisma.userProfile.update({
      where: { userId },
      data: dto,
    });
  }

  // Admin route — uses extended DTO, but only reachable with ADMIN role guard
  static async adminUpdate(userId: string, rawBody: unknown) {
    const dto = AdminUpdateUserDto.parse(rawBody);
    return await prisma.user.update({ where: { userId }, data: dto });
  }
}

// ─── What failure looks like WITHOUT DTOs ─────────────────────────────────

// NEVER DO THIS:
async function unsafeRegister(req: Request) {
  const body = await req.json();
  // body = { email: 'x@x.com', password: 'pw', userRole: 'ADMIN' }
  await prisma.user.create({ data: body }); // mass assignment: attacker is now ADMIN
}

// ─── Strict mode for debugging protocol mismatches ────────────────────────

export const StrictRegisterDto = RegisterDto.strict();
// Throws ZodError if client sends unknown fields — useful in development
// to catch frontend/backend schema drift early
```

## When to Use
- Every API endpoint that accepts user input and writes to a database — without exception
- When adding a new field to a database model: the question "should clients be able to set this directly?" determines whether it goes in the DTO
- When building admin vs. user endpoints for the same resource: use separate DTOs with different allowed fields, not the same DTO with conditional logic
- When reviewing PRs: any direct spread of `req.body` onto an ORM call is a mass assignment vulnerability

## Common Mistakes
- **Partial update with full DTO** — Using `UserDto.partial()` for a PATCH endpoint is correct, but if `UserDto` includes `userRole`, admins would be settable via PATCH. Create dedicated update DTOs that explicitly exclude sensitive fields
- **Validating at the route layer but not the service layer** — If your service is called from multiple places (API route, worker job, admin script), the service itself must validate, not just the route handler
- **TypeScript type assertions bypassing Zod** — `const dto = body as RegisterDtoType` skips runtime validation entirely; always call `.parse()` or `.safeParse()`, never cast
- **Forgetting nested objects** — If your DTO accepts a `preferences: {}` object and that object maps to a database column, the nested Zod schema must also be a strict whitelist

## Further Reading
- [Zod documentation — `.strip()` vs `.strict()` vs `.passthrough()`](https://zod.dev/?id=unknown-keys)
- [OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- [GitHub mass assignment vulnerability (2012) postmortem analysis](https://homakov.blogspot.com/2012/03/how-to.html)
