# 37. Secrets Management — Vault / SSM / KMS Instead of Env Files

## What It Is
An `.env` file is a perfectly reasonable place to start, and your `libs/env.ts` Zod validation layer is genuinely better than most teams' setups. The problem is operational: `.env` files sit on disk, get copied to servers during deploys, end up in CI/CD environment variable stores with no expiry, and occasionally get committed to version control. When a developer leaves, rotating secrets requires finding every `.env` file on every server and in every pipeline. When your database password leaks, you have no audit trail showing who accessed which secret and when.

A secrets manager (HashiCorp Vault, AWS Systems Manager Parameter Store, AWS Secrets Manager, GCP Secret Manager) is a centralized service that stores secrets encrypted at rest, controls access via IAM-style policies, provides an audit log of every secret read, and supports automatic rotation. Your application requests secrets at startup (or at read time), the secrets manager returns them over an encrypted connection, and they live in memory only — never on disk. Access is controlled by the deployment environment's identity (IAM role, service account) rather than a shared credential.

The operational improvement is most noticeable in three scenarios: (1) secret rotation — update in one place and all running instances pick it up on next request; (2) per-environment isolation — development, staging, and production have separate secret sets under the same naming hierarchy, and a compromise of the dev environment does not expose production secrets; (3) off-boarding — when a developer leaves, revoke their IAM access to the secrets manager and no secrets need to be rotated (assuming they didn't export them, which the audit log would show).

```quiz
- q: "A small team on AWS needs somewhere to keep a JWT secret and a DB password. Where do they start?"
  anchor: "simpler than Vault for most cases"
  options:
    - text: "HashiCorp Vault — the most feature-rich of the three"
      correct: false
      why: "And the heaviest operational overhead. Feature count is not the constraint a small team is under."
    - text: "SSM Parameter Store — free for standard parameters, IAM-integrated, simpler than Vault"
      correct: true
      why: "Secrets Manager is the paid step up, for automatic RDS rotation, first-class versioning or cross-account sharing."
    - text: "Environment variables in the deploy config, validated by `libs/env.ts`"
      correct: false
      why: "Validation is not storage. Nothing there is rotatable or auditable."

- q: "What makes a dynamic secret stronger than a rotated static one?"
  anchor: "generates a short-lived credential on demand"
  options:
    - text: "It is rotated more often, so the exposure window is shorter"
      correct: false
      why: "Close, but the mechanism differs: the credential is generated per request and expires, rather than one shared value being replaced on a schedule."
    - text: "The credential is generated on demand and expires — a DB user good for an hour"
      correct: true
      why: "There is no long-lived shared value to leak in the first place."
    - text: "It never enters the application's memory"
      correct: false
      why: "The app receives and uses it like any other credential. What changes is its lifetime."

- q: "What does envelope encryption actually buy you?"
  anchor: "compromise of the data key alone is insufficient"
  options:
    - text: "Two independent ciphertexts, so one decryption failure is recoverable"
      correct: false
      why: "It is not a redundancy scheme. The two keys are layered, not parallel."
    - text: "A data key encrypted under a KMS master key — the data key alone is not enough"
      correct: true
      why: "An attacker needs the master key as well, and that one never leaves KMS."
    - text: "Encryption in transit on top of encryption at rest"
      correct: false
      why: "Separate concerns. Envelope encryption is about how the key at rest is itself protected."
```

## Key Concepts
- **Secrets manager** — A dedicated service for storing, rotating, and auditing access to credentials (API keys, DB passwords, JWT secrets)
- **AWS SSM Parameter Store** — Free for standard parameters; hierarchical naming (`/app/production/JWT_SECRET`); integrates with IAM; simpler than Vault for most cases
- **AWS Secrets Manager** — Paid; adds automatic rotation for RDS passwords, first-class versioning, and cross-account sharing
- **HashiCorp Vault** — Self-hosted or cloud; most feature-rich; dynamic secrets (generates a new DB credential per request); heavy operational overhead
- **Dynamic secrets** — Vault generates a short-lived credential on demand (e.g., a DB user that expires in 1 hour); more powerful than static rotation
- **Secret injection at startup** — Your app starts, requests secrets from the manager, loads them into memory (or environment); `libs/env.ts` still validates them
- **Envelope encryption** — Secrets are encrypted with a data key, which is itself encrypted with a master key (KMS); compromise of the data key alone is insufficient
- **Audit log** — Every secret read is logged with timestamp, requester identity, and secret name; critical for compliance (SOC 2, GDPR)

## Example Code
```typescript
// libs/secrets/aws-ssm.ts
// Load secrets from AWS SSM Parameter Store at application startup
// Retains your Zod validation layer — the source changes, not the validation

import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';
import { z } from 'zod';

const ssm = new SSMClient({ region: process.env.AWS_REGION ?? 'eu-west-1' });

// Parameter names follow a hierarchy: /app/{environment}/{name}
const ENV = process.env.NODE_ENV === 'production' ? 'production' : 'staging';

const PARAMETER_NAMES = [
  `/app/${ENV}/SYSTEM_DATABASE_URL`,
  `/app/${ENV}/REDIS_PASSWORD`,
  `/app/${ENV}/ACCESS_TOKEN_SECRET`,
  `/app/${ENV}/REFRESH_TOKEN_SECRET`,
  `/app/${ENV}/CSRF_SECRET`,
  `/app/${ENV}/STRIPE_SECRET_KEY`,
] as const;

type ParameterName = typeof PARAMETER_NAMES[number];
type SecretName = ParameterName extends `/app/${string}/${infer N}` ? N : never;

// Schema mirrors the app's own env schema — same validation
const SecretsSchema = z.object({
  SYSTEM_DATABASE_URL: z.string().min(1),
  REDIS_PASSWORD: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  CSRF_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
});

export type Secrets = z.infer<typeof SecretsSchema>;

let cachedSecrets: Secrets | null = null;

/**
 * Load secrets from SSM at startup. Call once in your app bootstrap.
 * Results are cached in memory for the lifetime of the process.
 * WithDecryption: true is required for SecureString parameters.
 */
export async function loadSecrets(): Promise<Secrets> {
  if (cachedSecrets) return cachedSecrets;

  const command = new GetParametersCommand({
    Names: [...PARAMETER_NAMES],
    WithDecryption: true, // SSM SecureString — KMS decrypts on your behalf
  });

  const response = await ssm.send(command);

  if (response.InvalidParameters?.length) {
    throw new Error(
      `Missing SSM parameters: ${response.InvalidParameters.join(', ')}`
    );
  }

  const rawSecrets: Record<string, string> = {};
  for (const param of response.Parameters ?? []) {
    // Extract the last segment: /app/production/ACCESS_TOKEN_SECRET → ACCESS_TOKEN_SECRET
    const name = param.Name!.split('/').pop() as SecretName;
    rawSecrets[name] = param.Value!;
  }

  // Same Zod validation you already do in libs/env.ts — just a different source
  cachedSecrets = SecretsSchema.parse(rawSecrets);
  return cachedSecrets;
}

// ─── Integration with the app's env schema ─────────────────────────────────
// Option A: Override env vars after loading (minimal code change)
// In your app bootstrap (e.g., instrumentation.ts in Next.js):
//
// import { loadSecrets } from '@/lib/secrets/aws-ssm';
// const secrets = await loadSecrets();
// Object.assign(process.env, secrets); // env.ts Zod validation then reads these

// Option B: Replace env.ts with a secrets-aware singleton (cleaner)
// Replace: const env = EnvSchema.parse(process.env)
// With:    const env = { ...EnvSchema.parse(process.env), ...await loadSecrets() }

// ─── Secret rotation without downtime ─────────────────────────────────────
// SSM supports versioning. Your app runs with version N.
// Ops team pushes version N+1 of the secret.
// Rolling restart: new instances start with N+1, old instances expire with N.
// No manual .env file updates on servers required.
```

## When to Use
- Before your first paying enterprise customer: many enterprise security reviews require a secrets manager, not `.env` files
- When you have more than one environment (dev/staging/prod) and need strict isolation between them
- When you add team members: `.env` files shared over Slack or email is an immediate secret exposure
- When you need an audit trail for compliance (SOC 2 Type II requires evidence of secret access controls)

## Common Mistakes
- **Committing `.env` to version control** — Even `.env.example` with real values is a security incident; use `.env.example` with placeholder values only
- **Long-lived static secrets with no rotation policy** — Even with a secrets manager, secrets that never rotate are a liability; set a rotation schedule for DB passwords and JWT secrets
- **Putting secrets in Docker image build args** — Build args are visible in the image layer history; inject secrets at runtime, not build time
- **Over-engineering before you have the problem** — Vault's full feature set (dynamic secrets, leasing) has real operational overhead; start with SSM Parameter Store and graduate to Vault when the need justifies it

## Further Reading
- [AWS SSM Parameter Store for storing secrets](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [HashiCorp Vault: Getting Started](https://developer.hashicorp.com/vault/tutorials/getting-started)
- [OWASP: Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

```recall
- q: "What is a secrets manager, and what does it hold?"
  must:
    - "a dedicated service for storing, rotating and auditing access to credentials"
    - "API keys, DB passwords, JWT secrets"

- q: "Compare SSM Parameter Store, Secrets Manager and Vault."
  must:
    - "SSM Parameter Store — free for standard parameters, hierarchical naming, IAM integration, simpler than Vault"
    - "Secrets Manager — paid; automatic rotation for RDS passwords, first-class versioning, cross-account sharing"
    - "Vault — self-hosted or cloud, most feature-rich, dynamic secrets, heavy operational overhead"

- q: "What does the audit log record, and why does it matter?"
  must:
    - "every secret read, with timestamp, requester identity and secret name"
    - "it is critical for compliance — SOC 2, GDPR"
```
