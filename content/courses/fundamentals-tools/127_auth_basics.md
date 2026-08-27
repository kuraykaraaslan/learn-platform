# 127. Authentication Basics — Sessions vs Tokens, Password Hashing

## What It Is
Authentication answers "who is this?" — and almost every implementation reduces to two families. **Session-based auth** keeps state on the server (a session record, often in Redis) and hands the client an opaque cookie ID pointing at it; the server can revoke a session instantly by deleting the record. **Token-based auth** (typically JWT) puts the claims *in* the token itself, cryptographically signed — the server verifies the signature and trusts the contents without a database lookup, which is faster but makes instant revocation hard (see #32 for the mitigations).

Password storage is non-negotiable: passwords are **hashed**, never encrypted. Encryption is reversible by design (that's the point — you can decrypt it back); hashing is deliberately one-way, so even a full database leak doesn't directly reveal passwords. A proper password hash function (bcrypt, argon2, scrypt) is also deliberately *slow* and includes a per-password salt, which is what makes it resistant to both rainbow tables and brute-force at scale — a fast general-purpose hash like SHA-256 is the wrong tool here precisely because it's fast.

Cookie flags matter as much as the auth mechanism itself: `HttpOnly` blocks JavaScript from reading the cookie (mitigating XSS-driven theft), `Secure` blocks it from being sent over plain HTTP, and `SameSite` controls whether it's sent on cross-site requests (mitigating CSRF).

## Key Concepts
- **Session vs token**: server-held revocable state vs client-held self-contained, signed claims
- **Password hashing**: one-way, salted, deliberately slow (bcrypt/argon2) — never plain SHA-256, never reversible encryption
- **Cookie flags**: `HttpOnly` (no JS access), `Secure` (HTTPS only), `SameSite` (cross-site request control)
- **CSRF vs XSS**: CSRF tricks a browser into sending a *valid* cookie somewhere unintended; XSS runs attacker JS that can read anything the page can — different threats, different mitigations
- **Login flow**: verify credentials → hash comparison (never compare plaintext) → issue session/token → client stores/sends it on subsequent requests

## Example Code
```typescript
// Password hashing at signup — never store the plaintext, ever, even temporarily in logs
import bcrypt from "bcrypt";

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12); // cost factor 12 — deliberately slow
}

async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed); // constant-time comparison, handled internally
}

// Session-based login: server holds state, client only holds an opaque ID
async function loginSession(email: string, password: string) {
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  if (!(await verifyPassword(password, user.passwordHash))) throw new Error("invalid credentials");

  const sessionId = crypto.randomUUID();
  await redis.setex(`session:${sessionId}`, 60 * 60 * 24, JSON.stringify({ userId: user.id }));
  return { sessionId }; // set as an HttpOnly, Secure, SameSite=Lax cookie
}
```

## When to Use
- Building any login flow — decide session vs token *before* implementation, based on whether instant revocation matters more than avoiding a DB lookup per request
- Any place a password (or password-equivalent secret) is stored — always through a slow, salted hash function
- Setting cookies for auth — always set `HttpOnly` and `Secure`, and pick `SameSite` deliberately

## Common Mistakes
- Storing plaintext passwords, or "encrypted" (reversible) passwords instead of hashed ones
- Using a fast hash (MD5, SHA-256 alone) for passwords instead of a purpose-built slow hash
- Storing JWTs in `localStorage`, which is readable by any script on the page (XSS-exposed) instead of an `HttpOnly` cookie
- Rolling a custom crypto/auth scheme instead of using well-reviewed libraries (bcrypt/argon2, established JWT libraries)

## Further Reading
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org)
- OWASP Password Storage Cheat Sheet
- Auth0's "Cookies vs Tokens" comparison (vendor blog, but the tradeoff explanation is accurate and vendor-neutral)
