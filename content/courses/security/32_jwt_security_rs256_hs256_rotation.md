# 32. JWT Security: RS256 vs HS256, Token Rotation, Refresh Token Rotation

## Coverage Level
**Covered** — Your token implementation is solid: you use HS256 with separate secrets for access and refresh tokens, refresh tokens are hashed with SHA-256 before storage (raw token never persists), rotation is implemented (a new refresh token is issued on each use), and device fingerprints are embedded in the JWT payload and verified on access. This section acknowledges that HS256 is a reasonable choice for your architecture and explains the trade-off clearly, then covers the advanced patterns around token theft detection and clock skew handling.

## What It Is
JWTs (JSON Web Tokens) are base64url-encoded JSON structures with a cryptographic signature. The signature lets any party with the correct key verify that the token was issued by you and hasn't been tampered with. The algorithm choice determines what kind of key is used to produce and verify that signature.

HS256 (HMAC-SHA256) uses a single shared secret. The same secret both signs and verifies. This is symmetric: anyone who can verify a token can also forge one. In your architecture, only your server holds the secret, so this is fine. RS256 (RSA-SHA256) uses a key pair: the private key signs, the public key verifies. This is asymmetric: you can publish your public key so third parties (another service, an OAuth client, a mobile app) can verify tokens without being able to issue them. The canonical reason to use RS256 is distributed verification — when multiple services need to validate your tokens without having access to your signing secret. If all token validation happens on servers you control, HS256 is simpler and equally secure.

Refresh token rotation is the practice of issuing a new refresh token every time the old one is used and invalidating the old one immediately. This limits the window of exploitation if a refresh token is stolen: the attacker can use it once, but so can the legitimate user, and whichever one tries second will find it has been revoked. Your implementation hashes tokens before storage (`SHA-256` hash of the raw token stored in the DB) which means even if your database is breached, the attacker gets hashes that cannot be directly used to authenticate.

## Key Concepts
- **HS256** — HMAC-SHA256; symmetric; one secret both signs and verifies; correct choice when only your servers verify tokens
- **RS256** — RSA-SHA256; asymmetric; private key signs, public key verifies; correct choice for multi-service or federated authentication
- **ES256** — ECDSA-SHA256; asymmetric like RS256 but with shorter keys and faster verification; preferred over RS256 for new systems
- **Access token** — Short-lived (minutes to hours); stateless; carries claims; not stored server-side
- **Refresh token** — Long-lived (days to weeks); stored as a hash in the DB; exchanged for a new access token; rotated on each use
- **Token rotation** — Issue a new refresh token on each exchange, invalidate the old one; reduces theft window
- **Reuse detection** — If a rotated-away (invalidated) refresh token is presented again, this signals theft; invalidate the entire session family
- **Device fingerprint** — Hash of IP + User-Agent + Accept-Language embedded in the JWT payload; verified on access to detect token theft across devices

## Example Code
```typescript
// Your current approach (HS256) — correct for your architecture.
// This section shows how to upgrade to RS256 if you add external services,
// and how to implement reuse detection (the gap in your current implementation).

// ─── Option A: RS256 upgrade (when you add external service verification) ──
import jwt from 'jsonwebtoken';
import fs from 'fs';

// Generate keys once: openssl genrsa -out private.pem 2048
//                     openssl rsa -in private.pem -pubout -out public.pem
const PRIVATE_KEY = fs.readFileSync('./secrets/private.pem');
const PUBLIC_KEY = fs.readFileSync('./secrets/public.pem');

function signAccessTokenRS256(payload: TokenPayload): string {
  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: '1h',
    issuer: 'your-saas.com',
    audience: 'web',
  });
}

function verifyTokenRS256(token: string): TokenPayload {
  // Any service with the PUBLIC_KEY can verify — without knowing the private key
  return jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256'],
    issuer: 'your-saas.com',
    audience: 'web',
  }) as TokenPayload;
}
// Practical note: your current HS256 is perfectly fine until you need
// a third-party service (mobile app backend, microservice) to verify tokens
// without sharing the signing secret.

// ─── Refresh token rotation with reuse detection ──────────────────────────

export class TokenRotationService {
  /**
   * Exchange a refresh token for a new access + refresh token pair.
   * Implements reuse detection: if a previously-rotated token is presented,
   * the entire session family is invalidated (signals theft).
   */
  static async rotate(rawRefreshToken: string): Promise<{
    rawAccessToken: string;
    rawRefreshToken: string;
  }> {
    const hashedIncoming = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const session = await sessionRepo.findOne({
      where: { refreshToken: hashedIncoming },
    });

    if (!session) {
      // Token not found — could mean it was already rotated away.
      // Check if this hash appears in the rotation history.
      const isReused = await rotationHistoryRepo.exists({
        where: { refreshTokenHash: hashedIncoming },
      });

      if (isReused) {
        // REUSE DETECTED: this token was already rotated.
        // The legitimate user should have a newer token.
        // Invalidate ALL sessions for this user — a breach is likely.
        const history = await rotationHistoryRepo.findOne({
          where: { refreshTokenHash: hashedIncoming },
        });
        await sessionRepo.delete({ userId: history!.userId });
        throw new Error('Refresh token reuse detected — all sessions invalidated');
      }

      throw new Error('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      throw new Error('Refresh token expired');
    }

    // Issue new tokens
    const newAccessToken = generateAccessToken({ userId: session.userId, userSessionId: session.userSessionId });
    const newRawRefresh = crypto.randomBytes(40).toString('hex');
    const newHashedRefresh = crypto.createHash('sha256').update(newRawRefresh).digest('hex');

    // Store rotation history for reuse detection
    await rotationHistoryRepo.save({
      userId: session.userId,
      refreshTokenHash: hashedIncoming, // remember the old hash
      rotatedAt: new Date(),
    });

    // Update session with new refresh token hash
    await sessionRepo.update(session.userSessionId, {
      refreshToken: newHashedRefresh,
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { rawAccessToken: newAccessToken, rawRefreshToken: newRawRefresh };
  }
}

// ─── Clock skew handling ───────────────────────────────────────────────────

// JWT verification accepts a clockTolerance to handle servers with slight
// time drift — important in distributed deployments
jwt.verify(token, SECRET, {
  clockTolerance: 30, // accept tokens up to 30 seconds off system clock
});
```

## When to Use
- **HS256** — Your current setup; correct when all token verification happens on your own servers
- **RS256/ES256** — When you need to share token verification with a third party (mobile app backend, external microservice, webhook receiver) without sharing the signing secret
- **Rotation history / reuse detection** — When refresh token theft is a concern for your user base; adds DB overhead but enables breach detection
- **Short access token TTL (≤15 min)** — When you want to limit the window of a stolen access token without requiring re-login
- **`notBefore: 5` on refresh tokens** — You already do this; prevents a race condition where a refresh token is used before the access token has had time to propagate

## Common Mistakes
- **Using the same secret for access and refresh tokens** — If the signing secret leaks, both token types are compromised; use separate secrets (you already do this correctly)
- **Storing raw refresh tokens** — If your database is breached, stored raw refresh tokens are immediately usable; store hashes only (you do this correctly)
- **Long access token TTL as a substitute for refresh tokens** — A 7-day access token that cannot be revoked is equivalent to no revocation; keep access tokens short and use revocable refresh tokens
- **Not verifying `iss` and `aud` claims** — A token from your staging environment signed with the same secret as production is technically valid without these checks; always verify issuer and audience

## Further Reading
- [RFC 7519 — JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519)
- [Auth0: Refresh Token Rotation](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)
- [OAuth 2.0 Security Best Current Practice (RFC 9700)](https://datatracker.ietf.org/doc/html/rfc9700)
