# 34. Timing Attack — Constant-Time String Comparison

## What It Is
A timing attack is a side-channel attack that extracts secret information by measuring how long a computation takes. For string comparison, the attack works because most equality implementations short-circuit: they compare character by character and return `false` as soon as a mismatch is found. This means comparing `"aaaa"` against `"bbbb"` is faster than comparing `"aaab"` against `"aaaa"`, because the first mismatch happens at position 0 vs position 3. By sending thousands of candidate strings and measuring response times, an attacker can statistically determine the correct string one character at a time.

In practice, measuring HTTP response times at the millisecond granularity needed to exploit this requires either being on the same network as the server (low network jitter) or making thousands of samples to average out noise. For tokens that are already hashed, the attack becomes even harder because the attacker would need to find a value that produces a hash with a specific prefix — which requires breaking SHA-256. For this reason, timing attacks on hashed token comparisons are largely theoretical for modern applications. The real value of constant-time comparison is in comparing values that are not hashed: HMAC digests, CSRF tokens, API keys that are stored in plaintext or with reversible encoding.

Constant-time comparison algorithms compare every byte of both strings regardless of where a mismatch is found, taking the same amount of time whether the strings match at position 0 or position 63. Node.js provides `crypto.timingSafeEqual(Buffer, Buffer)` for this purpose. The practical rule: any comparison involving a secret value that an attacker might be trying to guess should use constant-time comparison.

## Key Concepts
- **Short-circuit comparison** — `===` returns false at the first mismatched character; leaks information about how many characters match
- **Constant-time comparison** — Compares all bytes regardless of mismatches; takes the same time for any pair of equal-length inputs
- **`crypto.timingSafeEqual`** — Node.js built-in; requires both buffers to be the same length; throws if lengths differ
- **bcrypt.compare timing** — Not vulnerable because the work factor (bcrypt's intentional slowness) dominates any timing difference in string comparison
- **HMAC verification** — Comparing HMAC digests (e.g., webhook signatures, CSRF tokens) must use constant-time comparison
- **Pre-image resistance** — A SHA-256 hash of a token cannot be reversed; timing comparison of hashes leaks less information than comparing raw tokens
- **Length leakage** — Even constant-time comparison leaks the length of strings if you use `Buffer.from(a).length !== Buffer.from(b).length` as an early exit
- **Practical risk calibration** — Timing attacks on server-side comparisons over HTTPS require network proximity and many samples; more realistic vectors are webhook signature verification and CSRF token comparison

## Example Code
```typescript
// lib/crypto/constant-time.ts
import crypto from 'crypto';

// ❌ The version almost everyone writes first, and why it does not work:
//
//   if (bufA.length !== bufB.length) {
//     crypto.timingSafeEqual(bufA, bufA);  // "burn the same time"
//     return false;
//   }
//
// The guard exists because crypto.timingSafeEqual throws on a length mismatch,
// so it has to be there. The dummy comparison is the part that is wrong: the
// work it does still scales with a buffer whose length the attacker chose, and
// Buffer.from() above it already allocated proportionally to that input. The
// length difference is still measurable — it just moved.
//
// You cannot hide a length by comparing carefully. You hide it by removing it.

/**
 * Constant-time comparison for secrets of any length.
 *
 * Both sides are HMAC'd to a fixed 32 bytes first, so the comparison always
 * examines exactly 32 bytes and the caller's input length is no longer
 * observable. The key is random per process: without it an attacker could
 * precompute digests offline and compare those instead.
 */
const COMPARISON_KEY = crypto.randomBytes(32);

function fixedLengthDigest(value: string): Buffer {
  return crypto.createHmac('sha256', COMPARISON_KEY).update(value, 'utf8').digest();
}

export function timingSafeEqual(a: string, b: string): boolean {
  return crypto.timingSafeEqual(fixedLengthDigest(a), fixedLengthDigest(b));
}

// ─── Where this belongs ───────────────────────────────────────────────────

// 1. Webhook signature verification (Stripe, GitHub, etc.)
function verifyStripeWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  // ❌ Don't: return signature === expected
  // ✅ Do:
  return timingSafeEqual(`sha256=${expected}`, signature);
}

// 2. CSRF token comparison
function validateCSRFToken(incoming: string, stored: string): boolean {
  // ❌ Don't: return incoming === stored
  // ✅ Do:
  return timingSafeEqual(incoming, stored);
}

// 3. API key comparison (if you store unhashed API keys)
function validateApiKey(incoming: string, stored: string): boolean {
  return timingSafeEqual(incoming, stored);
}

// ─── Where you DON'T need it (already safe) ───────────────────────────────

// Password comparison — bcrypt.compare is safe because the work factor
// (12 rounds ≈ ~200ms) dominates any timing difference in the final comparison
const isValid = await bcrypt.compare(plainPassword, hashedPassword);

// Hashed token lookup — you compare SHA-256 hashes, not raw tokens.
// The query is: WHERE refreshToken = hashToken(incoming)
// This is effectively safe because:
//   a) The hash is computed before the DB query (attacker can't guess the hash)
//   b) Database query timing is dominated by I/O, not string comparison
//   c) SHA-256 pre-image resistance means guessing the hash prefix is infeasible
// However, if you compare hashes in application code (not DB), use timingSafeEqual.
const hashedIncoming = crypto.createHash('sha256').update(rawToken).digest('hex');
const session = await repo.findOne({ where: { refreshToken: hashedIncoming } }); // safe

// ─── The risky pattern to audit for ──────────────────────────────────────
// grep your codebase for:
//   - HMAC digest comparisons using ===
//   - CSRF token comparisons using ===
//   - Any `signature === expected` pattern
```

## When to Use
- Webhook signature verification (Stripe, PayPal, GitHub): always use constant-time comparison
- CSRF token validation: use constant-time comparison when comparing cookie value to header value
- API key validation when keys are stored in plaintext or with reversible encoding
- Any comparison where the value being compared is a secret that an attacker is trying to guess by probing

## Common Mistakes
- **Trying to hide a length difference with a dummy comparison** — running `timingSafeEqual(a, a)` before returning `false` feels like it burns matching time, but the work still scales with attacker-controlled input and the buffer allocation above it already did. Hash both sides to a fixed length instead; that is the only version where the length genuinely stops being observable.
- **Reaching for a raw `===` on a digest** — `signature === expected` short-circuits on the first differing byte, which is exactly the signal an attacker measures
- **Using constant-time comparison for non-secrets** — You don't need it for comparing user IDs, email addresses, or other non-secret data; it adds no security value there and adds unnecessary code complexity
- **Forgetting that `crypto.timingSafeEqual` throws on length mismatch** — The built-in throws a `TypeError` if buffers have different byte lengths; always handle length differences before calling it
- **Treating bcrypt hashes as needing constant-time comparison** — bcrypt's verification is already timing-safe by design; adding `timingSafeEqual` on top is redundant and signals a misunderstanding

## Further Reading
- [Node.js `crypto.timingSafeEqual` documentation](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) — the comparison and key-handling sections
- [OWASP: Don't use string equality to compare secrets](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
