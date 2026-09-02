# 105. Cryptography Fundamentals — Beyond bcrypt

## What It Is
Most application developers use cryptography through libraries: bcrypt for passwords, JWT for tokens, TLS for transport. This works until you need to make a decision the library doesn't make for you: Should I use HS256 or RS256? Should I sign or encrypt this value? Why is my token vulnerable to length extension? Why does the IV matter?

Cryptography has two layers: the primitives (hash functions, ciphers, key exchange algorithms) and the protocols built from them (TLS, JWT, WebAuthn, SSH). Understanding the primitives doesn't mean implementing them — you should never implement primitives yourself. It means understanding the properties they provide so you can choose and combine them correctly.

For an application developer, the practical goal is: know enough to not make a catastrophic mistake when the library leaves a decision to you, and know enough to read a security audit report without needing it translated.

```quiz
- q: "Your AES-GCM code uses one fixed IV so ciphertext is reproducible across runs. What did that cost?"
  anchor: "nonce reuse breaks confidentiality entirely"
  options:
    - text: "Nothing, as long as the key stays secret"
      correct: false
      why: "Nonce reuse under the same key breaks GCM's confidentiality entirely, secret key or not."
    - text: "Confidentiality, entirely — GCM does not survive nonce reuse"
      correct: true
      why: "The IV exists so the same plaintext encrypts to different ciphertext each time; fixing it removes that outright."
    - text: "Only tamper detection — the authentication tag becomes forgeable"
      correct: false
      why: "The damage to authenticity is real, but confidentiality is the loss named here."

- q: "Third parties must verify your tokens without being able to mint them. HS256 or RS256?"
  anchor: "Asymmetric — sign with private key, verify with public key. Anyone can verify without knowing the secret"
  options:
    - text: "HS256 — HMAC proves both integrity and authenticity"
      correct: false
      why: "It does, but verification needs the same secret that signs, so anyone who can verify can also mint."
    - text: "RS256 — sign with the private key, verify with the public one"
      correct: true
      why: "Asymmetric signing is exactly the case where verifying must not confer the ability to sign."
    - text: "Either — give verifiers a read-only copy of the HMAC secret"
      correct: false
      why: "There is no read-only HMAC secret. The key that verifies is the key that signs."

- q: "You are storing user passwords. Salted SHA-256, or a KDF?"
  anchor: "Argon2id is current best practice; PBKDF2 is acceptable"
  options:
    - text: "Salted SHA-256 — the salt defeats rainbow tables"
      correct: false
      why: "It does, and then the attacker brute-forces at billions of hashes a second. Deliberate cost is what a KDF adds on top."
    - text: "A KDF — Argon2id, with PBKDF2 as an acceptable fallback"
      correct: true
      why: "bcrypt counts here too: it is a KDF, not a general-purpose hash."
    - text: "SHA-3, since SHA-256 is the weaker of the two"
      correct: false
      why: "Both are fast one-way hashes, and the speed is the problem here, not the hash's strength."
```

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
- [Node.js `crypto`](https://nodejs.org/api/crypto.html) — the API reference for every primitive used above
- [*Cryptopals Challenges*](https://cryptopals.com) — hands-on exercises that break bad cryptography to teach correct usage
- [RFC 8446 — TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html) — the handshake, and why the primitives above are combined the way they are

```recall
- q: "What is a hash function for, and what is it not for?"
  must:
    - "one-way, deterministic, fixed output size, collision-resistant"
    - "used for integrity, not secrecy"
    - "never MD5 or SHA-1 for security purposes"

- q: "Why AES-GCM rather than AES-CBC?"
  must:
    - "AES-GCM provides authenticated encryption — it detects tampering"
    - "never use AES-CBC without a separate MAC"

- q: "What does elliptic curve cryptography buy, and where does P-256 appear?"
  must:
    - "smaller keys for the same security as RSA"
    - "P-256 (secp256r1) is the standard for WebAuthn and JWT ES256"

- q: "What is constant-time comparison for, and how do you get it in Node?"
  must:
    - "it takes the same time regardless of where the first mismatch occurs"
    - "it prevents timing attacks"
    - "`crypto.timingSafeEqual()`"
```
