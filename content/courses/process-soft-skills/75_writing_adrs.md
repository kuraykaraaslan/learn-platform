# 75. Writing ADRs (Architecture Decision Records)

## What It Is
An Architecture Decision Record is a short, persistent document that captures why a significant technical decision was made — not just what was decided, but the context, constraints, alternatives considered, trade-offs, and known consequences. The "why" is the part that evaporates from memory within three months and from your codebase forever.

ADRs matter most when you return to a decision a year later and ask "why are we using HS256 for JWT signing instead of RS256? Can we switch?" Without an ADR, you have to reconstruct the reasoning from scratch, guess at the constraints that existed at the time, and risk reversing a decision that was made for a reason you have forgotten. With an ADR, the answer is three clicks away and includes the migration path.

There are two dimensions where developers with ADR practices still write weak records: **options analysis** and **consequences**. A weak ADR documents the choice but skips the rejected alternatives — which means the record is no different from a comment in code. A strong ADR documents every serious option with honest trade-offs, so a future reader can evaluate whether the original constraints still apply. Consequences are equally important: an ADR that says "we chose HS256 because it is simpler" without saying "this means the secret must be shared with all services that validate tokens, and rotation requires a deployment" has captured the decision without the operational reality.

## Key Concepts
- **Decision driver** — the constraint, requirement, or risk that made this decision non-obvious; ADRs are only needed when there were real alternatives
- **Status lifecycle** — Proposed → Accepted → (Deprecated / Superseded); ADRs are never deleted, only superseded
- **Superseded ADR** — when you reverse a decision, you write a new ADR and update the old one's status to `Superseded by ADR-00XX`; both documents remain
- **Context** — the state of the system, team, and requirements at the time of the decision; context that is obvious now may not be obvious to a future maintainer
- **Consequences** — both positive (what you gain) and negative (what you accept as a cost); a good ADR has real negatives, not just positives
- **Migration / reversal path** — how hard is it to undo this decision? This one question forces the author to think through the actual cost of the choice
- **Lightweight ADR** — 1–2 pages maximum; not a design document; focus on the decision, not a full specification
- **ADR numbering** — sequential integers in filename (`ADR-0001-jwt-signing-algorithm.md`); never reuse or delete numbers

## Example Code
```markdown
# ADR-0001: JWT Signing Algorithm — HS256 over RS256

## Status
Accepted — 2026-03-15

## Context

The authentication system issues JWTs for both access tokens and refresh tokens.
These tokens are currently validated only within the Next.js application itself
(same process that issues them). The system is a monolith: there is no separate
resource server, microservice, or third-party service that needs to validate JWTs
independently.

The two practical signing algorithm families for JWTs are:

- **HS256 (HMAC-SHA256)**: symmetric — same secret used to sign and verify
- **RS256 (RSA-SHA256)**: asymmetric — private key signs, public key verifies

The team is currently 1 developer. Key rotation and PKI infrastructure add
operational complexity that is not justified by the current architecture.

## Decision

Use **HS256** with a single shared secret, stored in `ACCESS_TOKEN_SECRET`
and `REFRESH_TOKEN_SECRET` environment variables. Tokens are only validated
by the Next.js application that issued them.

## Options Considered

### Option A: HS256 (Symmetric HMAC)
**Pros:**
- Simple: one secret, no key pair management
- Fast: HMAC-SHA256 is computationally cheaper than RSA signature verification
- Zero infrastructure: no key generation, certificate management, or rotation ceremony
- Standard library support: `jsonwebtoken` with a string secret

**Cons:**
- If the secret leaks, all issued tokens can be forged
- Secret must be shared with every service that validates tokens — if you add
  a microservice that needs to validate JWTs, it must have the secret, which
  increases the attack surface
- Secret rotation requires a coordinated deployment (old tokens become invalid)

### Option B: RS256 (Asymmetric RSA)
**Pros:**
- Public key can be distributed freely (JWKS endpoint) — any service can verify
  tokens without access to the signing secret
- Private key compromise only affects signing, not verification (public key can
  stay the same)
- Industry standard for federated identity and multi-service architectures
- Enables JWKS-based key rotation without re-distributing secrets

**Cons:**
- Requires RSA key pair generation and secure storage of the private key
- More complex configuration: PEM files or base64-encoded keys in env vars
- Slower: RSA signature verification is ~100× slower than HMAC (negligible at
  low scale, measurable at high throughput)
- Overkill for a monolith where the issuer and validator are the same process

### Option C: EdDSA (Ed25519)
**Pros:**
- Faster than RSA, smaller signatures, same asymmetric trust model as RS256

**Cons:**
- Less library support in 2024 (some `jsonwebtoken` versions require extra flags)
- Same operational complexity as RS256 with no benefit for a monolith

## Consequences

**Positive:**
- Token issuance and validation require no file system access or PKI setup
- Development and staging environments need only an env var, not a key pair
- Simpler CI/CD: no secret rotation ceremony for key pairs

**Negative:**
- `ACCESS_TOKEN_SECRET` must be at least 256 bits of entropy (32 bytes) and stored
  securely; it is a single point of compromise for all sessions
- If a future architecture requires a separate token validation service
  (e.g., an API gateway), it will need access to the secret, violating the
  principle of minimal exposure
- Token rotation (if secret is compromised) requires: (1) generating new secret,
  (2) deploying, (3) all current sessions are immediately invalidated (users must re-login)

**Operational:**
- `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` must be stored in a secrets
  manager (AWS Secrets Manager / HashiCorp Vault), not committed to source control
- Secret must be at minimum 256-bit random; use `openssl rand -base64 32` to generate
- The `env.ts` Zod schema enforces minimum length; this ADR documents the rationale

## Risks

- Secret leakage through log output, error messages, or environment variable dumps
- Short-lived access tokens (15 minutes) mitigate session hijacking exposure
- Mitigation: secrets are validated at startup via Zod, never logged, and rotated
  if there is any indication of compromise

## Reversal / Migration Path

**Difficulty: Medium**

To migrate from HS256 to RS256:
1. Generate RSA-2048 or Ed25519 key pair
2. Update `auth.service.ts` to sign with private key
3. Update `user_session.token.service.ts` to verify with public key
4. Expose JWKS endpoint at `/.well-known/jwks.json`
5. Deploy: old HS256 tokens will be rejected immediately; all users must re-login
   (or run dual-validation during a transition window)
6. Update `env.ts` schema: remove `ACCESS_TOKEN_SECRET` string, add PEM env vars

The migration is straightforward but causes a forced logout for all users.
Plan it as a maintenance window event. If zero forced-logout migration is required,
run HS256 and RS256 validation in parallel for one access-token TTL cycle (15 min).

## Related Rules / Documents
- `Technical_Architecture_Rules/security-rules.md` — token security requirements
- `libs/env.ts` — environment variable validation including token secret minimum length
- `modules/user_session/user_session.token.service.ts` — token issuance implementation
- ADR-0002 (future): Session storage strategy — JWT stateless vs Redis-backed sessions
```

## When to Use
1. **Any decision where you will question your past self** — "why did we use TypeORM instead of Prisma everywhere?" If you cannot answer from memory six months later, it needed an ADR.
2. **When onboarding a new developer** — ADRs are the first thing to share; they explain the architecture without a two-hour explanation session.
3. **Before reversing a previous decision** — write an ADR for the reversal that references the original; preserve the full decision trail.
4. **Technology selection** — every dependency that becomes load-bearing (database, queue, auth mechanism, payment provider) deserves an ADR.
5. **When a trade-off has ongoing operational cost** — HS256 means secret rotation causes forced logouts; documenting this in an ADR ensures future you does not rotate secrets carelessly during a normal deploy.

## Common Mistakes
- **ADRs without real negatives** — if every consequence is positive and there are no trade-offs documented, the ADR is marketing, not engineering. Every real decision has costs; document them.
- **Options section with only the chosen option** — the value of an ADR is the rejected alternatives. If you only document what you chose, a future maintainer cannot evaluate whether the constraints have changed.
- **Updating an ADR when a decision changes** — never edit an accepted ADR's Decision section. Write a new ADR, mark it Superseded, and link both. The history of the decision is as valuable as the current decision.
- **One massive ADR per component** — one ADR per decision, not per component. A database ADR, a caching ADR, a session strategy ADR, and a migration strategy ADR are four separate records, not one "data layer" ADR.

## Further Reading
- Michael Nygard — "Documenting Architecture Decisions" (the original article): https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- Joel Parker Henderson — ADR GitHub templates: https://github.com/joelparkerhenderson/architecture-decision-record
- adr-tools — CLI for creating and managing ADRs: https://github.com/npryce/adr-tools
