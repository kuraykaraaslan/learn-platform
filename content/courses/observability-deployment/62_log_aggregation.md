# 62. Log Aggregation — Structured Logging + ELK or Loki

## What It Is
You already have structured logging. The next problem is: where do those log files go in production, and how do you search them when something breaks at 2 AM? Writing to `logs/2026-05-04.log` on a container that gets replaced on every deploy means you lose your logs. Worse, if you scale to multiple instances, your logs are spread across multiple ephemeral machines with no way to query them together.

Log aggregation is the practice of shipping all log streams to a central, queryable backend. Two stacks dominate:

**ELK** (Elasticsearch + Logstash/Filebeat + Kibana) is the established enterprise stack. Elasticsearch stores and indexes logs; Kibana is the query UI; Filebeat or Logstash tails your log files and ships them. It is powerful but operationally heavy and expensive to self-host.

**Grafana Loki** is the lighter, cloud-native alternative. Where Elasticsearch indexes the full content of every log line (expensive), Loki only indexes labels (e.g., `{service="acme-web", level="error"}`), and stores the log content compressed. You query with LogQL. It is designed to pair with Grafana dashboards and Grafana Tempo traces, which makes the three-pillar observability stack (logs + traces + metrics) from a single UI.

Looking at your existing Winston setup in `libs/logger/index.ts`: the `printf` formatter overrides the JSON output with a plain string, which defeats the purpose of calling `json()`. Fixing that and adding a Loki transport is two changes.

## Key Concepts
- **Structured log** — a log entry formatted as JSON with consistent fields (`level`, `message`, `timestamp`, `tenantId`, `userId`, `traceId`)
- **Label** — in Loki, a small, low-cardinality key-value tag used for indexing (e.g., `service`, `level`, `env`); high-cardinality values (like `userId`) go in the log body, not labels
- **Log stream** — in Loki, all logs sharing the same label set; efficient to query within a stream
- **LogQL** — Loki's query language; filter by labels then search log content: `{service="acme-web"} |= "error"`
- **Filebeat** — lightweight log shipper that tails files and forwards to Elasticsearch or Logstash
- **winston-loki** — Winston transport that ships logs directly to Loki's push API; no agent needed
- **Correlation ID** — a unique ID injected into each log line (often the `traceId`) that lets you find all logs for one request
- **Log retention** — how long logs are kept; production: 30–90 days; longer requires more storage or cold storage archiving

## Example Code
```typescript
// libs/logger/index.ts — revised to fix the printf override problem
// and add Loki transport for production
import winston from 'winston';
import LokiTransport from 'winston-loki';  // npm install winston-loki
import { env } from '@/libs/env';

const { combine, timestamp, json, errors } = winston.format;

// ── Core format: pure JSON, no printf override ──────────────────────────────
// The existing code calls json() then printf(), which throws away the JSON.
// Remove printf() to get actual structured JSON output.
const baseFormat = combine(
  errors({ stack: true }),        // include stack traces on Error objects
  timestamp({ format: 'ISO' }),   // ISO 8601 timestamps for easy parsing
  json(),                          // serialize the whole log entry as JSON
);

// ── Transports: console in dev, Loki in production ─────────────────────────
function buildTransports(): winston.transport[] {
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'vercel') {
    return [new winston.transports.Console({ format: baseFormat })];
  }

  const transports: winston.transport[] = [];

  // Always keep a local file as a fallback (for debugging pod startup issues)
  transports.push(
    new winston.transports.File({
      filename: '/var/log/app/app.log',
      format: baseFormat,
      maxsize: 50 * 1024 * 1024,   // rotate at 50 MB
      maxFiles: 3,
    }),
  );

  // Ship to Loki if configured
  if (env.LOKI_HOST) {
    transports.push(
      new LokiTransport({
        host: env.LOKI_HOST,            // e.g., 'http://loki:3100'
        labels: {
          service: 'acme-web',
          env: env.NODE_ENV,
        },
        // Labels are indexed — keep them low-cardinality
        // DO NOT put userId or tenantId here; they go in the log message body
        json: true,
        format: baseFormat,
        batching: true,
        interval: 5,                    // flush every 5 seconds
      }),
    );
  }

  return transports;
}

const logger = winston.createLogger({
  level: env.DEBUG ? 'debug' : 'info',
  transports: buildTransports(),
});

// ── Context-enriched logging helper ────────────────────────────────────────
// Instead of calling Logger.info(message), pass a context object.
// This adds tenantId, userId, traceId as searchable fields in Loki.
interface LogContext {
  tenantId?: string;
  userId?: string;
  traceId?: string;
  [key: string]: unknown;
}

export default class Logger {
  static info(message: string, ctx?: LogContext): void {
    logger.info(message, ctx);
  }

  static warn(message: string, ctx?: LogContext): void {
    logger.warn(message, ctx);
  }

  static error(message: string, ctx?: LogContext): void {
    logger.error(message, ctx);
  }

  static debug(message: string, ctx?: LogContext): void {
    logger.debug(message, ctx);
  }
}

// Usage — now every log line has queryable context:
// Logger.error('Login failed', { userId: user.id, tenantId: tenant.id, reason: 'bad password' });
// In Loki: {service="acme-web"} |= "Login failed" | json | userId = "abc-123"
```

## When to Use
1. **Multi-instance production** — when you have more than one app replica, logs are on different machines; aggregation is the only way to see them together.
2. **Post-incident analysis** — "find all errors for tenant X between 14:00 and 14:30" is a 5-second Loki query with structured logs; a manual grep through files is a 30-minute ordeal.
3. **Security audit trail** — ship audit log events to a separate, write-once Loki stream for tamper evidence.
4. **Alerting on log patterns** — Grafana can trigger alerts when a log query returns results (e.g., "alert when `payment_failed` appears more than 10 times in 5 minutes").
5. **Correlating logs with traces** — inject `traceId` into every log line; in Grafana, clicking a trace span jumps directly to the correlated log lines in Loki.

## Common Mistakes
- **Using `printf` after `json()`** — as in your current logger: `json()` produces a JSON object, then `printf` serializes it to a plain string and throws away the structure. Remove `printf` entirely to get actual JSON.
- **High-cardinality Loki labels** — putting `userId` or `tenantId` in Loki labels creates millions of unique label combinations and makes Loki very slow. Put them in the log body (JSON fields) instead.
- **Losing logs during pod restarts** — if you only write to local files and the container crashes, you lose recent logs. Ship to Loki in real-time so the last log lines before a crash are always captured.
- **Not logging errors as Error objects** — `Logger.error(err.message)` loses the stack trace. Use `Logger.error('DB query failed', { error: err, stack: err.stack })` and include the `errors()` format so Winston captures the full stack.

## Further Reading
- Grafana Loki documentation: https://grafana.com/docs/loki/latest/
- `winston-loki` npm package: https://github.com/JaniAnttonen/winston-loki
- ELK Stack getting started: https://www.elastic.co/guide/en/elastic-stack-get-started/current/get-started-elastic-stack.html
