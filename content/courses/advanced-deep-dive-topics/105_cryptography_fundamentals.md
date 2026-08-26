# 105. Cryptography Fundamentals — Beyond bcrypt

## Coverage Level
**Partial** — You use bcrypt, JWT (HS256), WebAuthn, and `crypto.createHash`. You apply the tools correctly but the underlying primitives are a blind spot — which matters when you need to design something new or audit what you've built.

## What It Is
Most application developers use cryptography through libraries: bcrypt for passwords, JWT for tokens, TLS for transport. This works until you need to make a decision the library doesn't make for you: Should I use HS256 or RS256? Should I sign or encrypt this value? Why is my token vulnerable to length extension? Why does the IV matter?

Cryptography has two layers: the primitives (hash functions, ciphers, key exchange algorithms) and the protocols built from them (TLS, JWT, WebAuthn, SSH). Understanding the primitives doesn't mean implementing them — you should never implement primitives yourself. It means understanding the properties they provide so you can choose and combine them correctly.

For an application developer, the practical goal is: know enough to not make a catastrophic mistake when the library leaves a decision to you, and know enough to read a security audit report without needing it translated.

## Key Concepts
- **Hash function (SHA-256, SHA-3)**: One-way, deterministic, fixed output size. Collision-resistant. Used for integrity, not secrecy. Never use MD5 or SHA-1 for security purposes.
- **HMAC**: Hash-based Message Authentication Code. Proves both integrity and authenticity — the sender has the secret key. This is what JWT HS256 uses.
- **Digital signature (RS256, ES256)**: Asymmetric — sign with private key, verify with public key. Anyone can verify without knowing the secret. JWT RS256/ES256 use this.
- **Symmetric encryption (AES-GCM)**: Same key encrypts and decrypts. Fast. AES-GCM provides authenticated encryption — detects tampering. Never use AES-CBC without separate MAC.
- **Key Derivation Function (KDF)**: Derives a cryptographic key from a password. Argon2id is current best practice; PBKDF2 is acceptable. bcrypt is a KDF, not a general-purpose hash.
- **IV / Nonce**: Initialization vector — random value that ensures the same plaintext encrypts to different ciphertext each time. Must never be reused with the same key (especially in GCM mode: nonce reuse breaks confidentiality entirely).
- **Elliptic Curve Cryptography (ECC)**: Smaller keys, same security as RSA. P-256 (secp256r1) is the standard for WebAuthn and JWT ES256.
- **Constant-time comparison**: String comparison that takes the same time regardless of where the first mismatch occurs. Prevents timing attacks. Node.js: `crypto.timingSafeEqual()`.

## Example Code

```typescript
import crypto from 'crypto';

// --- Hashing for integrity (not passwords) ---
function hashForIntegrity(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// --- HMAC for authentication (prove you know the secret) ---
function createHmac(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function verifyHmac(data: string, secret: string, untrustedHmac: string): boolean {
  const expected = Buffer.from(createHmac(data, secret), 'hex');
  const received = Buffer.from(untrustedHmac, 'hex');
  // Constant-time comparison — prevents timing attacks
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

// --- Authenticated encryption (AES-256-GCM) ---
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits

function encrypt(plaintext: string, key: Buffer): { ciphertext: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12); // 96-bit nonce for GCM — never reuse with same key
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag(); // Authentication tag — detects tampering
  return {
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

function decrypt(ciphertext: string, iv: string, tag: string, key: Buffer): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex')); // Will throw if tampered
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

// Usage
const key = crypto.randomBytes(KEY_LENGTH);
const { ciphertext, iv, tag } = encrypt('sensitive data', key);
const recovered = decrypt(ciphertext, iv, tag, key);
```

## When to Use
- Choosing between HS256 and RS256 for JWT: use HS256 for single-service, RS256 when external services need to verify tokens without sharing the secret
- Storing anything reversible (API keys, webhook secrets): AES-GCM, not bcrypt
- Verifying webhook payloads from Stripe/GitHub: HMAC-SHA256 with `timingSafeEqual`
- Generating secure random tokens: `crypto.randomBytes(32).toString('hex')`, not `Math.random()`
- Comparing secrets in request handlers: always `timingSafeEqual`, never `===`

## Common Mistakes
- Using `===` to compare tokens or HMACs — vulnerable to timing attacks
- Reusing IVs with AES-GCM — catastrophic: reveals the XOR of the two plaintexts
- Using bcrypt for non-password data (e.g., API key storage) — it's too slow and has a 72-byte input limit
- Storing encryption keys in the same database as encrypted data — defeats the purpose; use env vars or a secrets manager

## Further Reading
- *Serious Cryptography* — Jean-Philippe Aumasson: best practical cryptography book for developers, no math degree required
- Node.js `crypto` docs — covers all primitives used above with API reference
- *Cryptopals Challenges* (cryptopals.com) — hands-on exercises that break bad cryptography to teach correct usage
