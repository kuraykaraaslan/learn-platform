# 33. SSRF (Server-Side Request Forgery)

## What It Is
SSRF is the vulnerability class where an attacker tricks your server into making an HTTP request to a URL of the attacker's choosing. The attack is possible whenever your server accepts a URL from user input and fetches it, such as: "verify this webhook URL", "fetch a preview of this link", "import data from this endpoint", "connect to this OAuth provider URL". The danger is that your server sits inside your network, and that network likely has resources not accessible from the public internet: your database management UI (port 5432, 6379, 8080), internal metadata APIs (AWS EC2 `169.254.169.254`, GCP `metadata.google.internal`), and other services in your VPC.

A successful SSRF attack against a cloud-hosted application can retrieve the instance metadata endpoint (`http://169.254.169.254/latest/meta-data/iam/security-credentials/`), which returns temporary AWS credentials with whatever permissions your EC2/ECS role has. This has been the root cause of several major cloud data breaches including the Capital One breach in 2019.

In a multi-tenant SaaS the realistic surface areas are narrower than "anywhere you make a request", and worth enumerating explicitly: tenant-configured webhook URLs, tenant-configured OAuth/SSO endpoints, payment provider callbacks, and any import-from-URL feature. The one teams miss is domain verification — checking that a tenant's DNS record resolves correctly is an outbound request to an attacker-chosen name, and is an SSRF vector unless the name is validated before resolution.

## Key Concepts
- **SSRF** — Server makes an HTTP request to an attacker-controlled URL, potentially reaching internal services
- **Blind SSRF** — The server makes the request but does not return the response to the attacker; used for port scanning and metadata theft
- **SSRF via DNS rebinding** — The domain resolves to a public IP at validation time, then resolves to `127.0.0.1` when the actual request is made
- **Cloud metadata endpoint** — `169.254.169.254` (AWS, Azure) and `metadata.google.internal` — first targets in a cloud SSRF attack
- **URL allowlist** — Only permit requests to known, trusted domains; best defense for webhook delivery
- **Private IP blocklist** — Block requests to RFC 1918 addresses (`10.x`, `172.16-31.x`, `192.168.x`), loopback (`127.x`), link-local (`169.254.x`)
- **DNS pre-resolution check** — Resolve the hostname before making the request; check if the resolved IP is in a blocked range
- **`follow_redirects: false`** — Redirects can bypass IP blocklists by redirecting from a public IP to a private one

## Example Code
```typescript
// lib/ssrf/safe-fetch.ts
// A wrapper around node-fetch / axios that blocks SSRF vectors

import { isIP } from 'net';
import dns from 'dns/promises';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// RFC 1918 private ranges + loopback + link-local + CGNAT.
// Two of these are easy to get subtly wrong; both mistakes are marked.
const BLOCKED_IP_PATTERNS = [
  /^127\./,                            // loopback
  /^10\./,                             // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,        // RFC 1918
  /^192\.168\./,                       // RFC 1918
  /^169\.254\./,                       // link-local — AWS IMDS, Azure IMDS
  /^0\./,                              // "this network"
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // CGNAT 100.64.0.0/10
  // ❌ /^100\.64\./ covers only 100.64.x — 100.65 through 100.127 are also CGNAT
  /^::1$/,                             // IPv6 loopback
  /^f[cd][0-9a-f]{2}:/i,               // IPv6 unique-local fc00::/7
  // ❌ /^fc|fd/ is (^fc)|(fd): the anchor binds tighter than the alternation,
  //    so it matches "fd" ANYWHERE — it blocks the public 2606:4700:fd00::1
  //    and would silently break a legitimate webhook.
  /^fe[89ab][0-9a-f]:/i,               // IPv6 link-local fe80::/10 — was missing
];

/**
 * ::ffff:127.0.0.1 is loopback wearing an IPv6 costume. Without this the whole
 * IPv4 list above is bypassable in one step, including the metadata endpoint.
 */
function normalizeIp(ip: string): string {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  return mapped ? mapped[1] : ip;
}

function isPrivateIP(ip: string): boolean {
  const addr = normalizeIp(ip);
  return BLOCKED_IP_PATTERNS.some((pattern) => pattern.test(addr));
}

// Worth knowing what you do NOT have to handle: Node's URL parser normalises
// the decimal-encoded form, so `new URL('http://2130706433/').hostname` is
// already "127.0.0.1" by the time this code sees it.

async function resolveAndValidate(hostname: string): Promise<void> {
  // Pre-resolve DNS to check if it points to a private IP
  // This is not a complete SSRF defense (DNS rebinding can bypass it),
  // but it stops the most common attacks
  let addresses: string[];
  try {
    addresses = await dns.resolve4(hostname);
  } catch {
    // Also try IPv6
    try {
      const result = await dns.resolve6(hostname);
      addresses = result;
    } catch {
      throw new Error(`SSRF: Cannot resolve hostname: ${hostname}`);
    }
  }

  for (const addr of addresses) {
    if (isPrivateIP(addr)) {
      throw new Error(`SSRF: Hostname ${hostname} resolves to private IP ${addr}`);
    }
  }
}

export async function safeFetch(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('SSRF: Invalid URL');
  }

  // Only allow HTTP/HTTPS
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`SSRF: Protocol ${parsed.protocol} not allowed`);
  }

  // Block direct IP addresses pointing to private ranges
  if (isIP(parsed.hostname) !== 0) {
    if (isPrivateIP(parsed.hostname)) {
      throw new Error(`SSRF: Direct private IP address not allowed: ${parsed.hostname}`);
    }
  } else {
    // Resolve hostname and check
    await resolveAndValidate(parsed.hostname);
  }

  // axios.request, NOT axios.get: `get` pins the method, so the documented
  // usage below — safeFetch(url, { method: 'POST', data: payload }) — would be
  // silently downgraded to a GET and the webhook body would never be sent.
  return axios.request({
    ...config,
    url,
    method: config.method ?? 'GET',
    maxRedirects: 0,            // a redirect is a second, unvalidated request
    timeout: 5000,              // fail fast
    validateStatus: () => true, // don't throw on non-2xx; let the caller decide
  });
}

// ─── Usage: webhook delivery ───────────────────────────────────────────────
// Instead of: await axios.post(tenant.webhookUrl, payload)
// Use:        await safeFetch(tenant.webhookUrl, { method: 'POST', data: payload })

// ─── Stronger: allowlist for known-good domains ───────────────────────────
const ALLOWED_WEBHOOK_DOMAINS = new Set(['webhook.site', 'hooks.slack.com', 'discord.com']);

function isAllowedWebhookUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    // Check if hostname ends with an allowed domain
    return [...ALLOWED_WEBHOOK_DOMAINS].some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}
```

## When to Use
- Any feature where users can configure a URL your server will request: webhook endpoints, OAuth provider URLs, import sources, avatar URL fetching
- Domain verification features: checking DNS TXT records for tenant domain ownership
- Any proxy-like endpoint that fetches external resources on behalf of a user
- Payment provider configuration (though reputable providers use fixed IP ranges; still validate the base URL)

## Common Mistakes
- **Validating the URL format but not the resolved IP** — `https://evil.com/` passes a URL format check but the DNS record could point to `10.0.0.1`; you must check the resolved IP, not just the URL
- **Checking IP at validation time, not request time (DNS rebinding)** — The DNS response can change between your check and the actual request; for high-security use cases, use the pre-resolved IP directly in the request rather than the hostname
- **Not blocking `file://` and `gopher://` schemes** — These can reach local files and services even without a network call
- **Trusting `127.0.0.1` from `X-Forwarded-For` headers** — This is a different class of header spoofing, but worth noting: your inbound IP detection already handles this correctly in `UserSessionNextService`

## Further Reading
- [PortSwigger SSRF Guide](https://portswigger.net/web-security/ssrf)
- [AWS: Mitigating SSRF in cloud applications](https://aws.amazon.com/blogs/security/defense-in-depth-open-firewalls-reverse-proxies-and-ssrf-vulnerabilities-in-aws/)
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
