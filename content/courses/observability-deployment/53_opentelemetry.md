# 53. OpenTelemetry — Traces, Metrics, Logs Triad

## What It Is
OpenTelemetry (OTel) is the CNCF standard for instrumenting applications to produce three kinds of observability signals: **traces**, **metrics**, and **logs**. The goal is not to replace your logging library but to connect all three signals under a unified model so that when an alert fires on a metric spike, you can jump directly to the traces that caused it, and then drill into the correlated log lines.

**Traces** answer "what happened during this request?" A trace is a tree of spans — each span represents one unit of work (an HTTP handler, a database query, a Redis call). Every span carries timing, attributes, and a status. Traces are what let you see that a slow API response was caused by a specific SQL query that took 800 ms.

**Metrics** answer "how is the system performing over time?" These are numeric measurements aggregated over time: request rate, error rate, p99 latency, queue depth. They are cheap to store (just numbers) and perfect for dashboards and alerting.

**Logs** answer "what was the exact context when something went wrong?" OTel does not replace Winston; it adds a `traceId` and `spanId` to each log line so you can join logs to traces in your observability backend (Grafana, Honeycomb, Datadog, Jaeger).

For a Next.js SaaS, OTel instrumentation means: one slow database query shows up in your trace, triggers a p99 latency metric alert, and the correlated Winston log line for that request already carries the `traceId` so you find it in two clicks.

## Key Concepts
- **Span** — a single timed operation with attributes; the atomic unit of a trace
- **Trace** — a directed acyclic graph of spans representing one end-to-end request
- **TraceId / SpanId** — 128-bit and 64-bit identifiers used to correlate spans and logs across services
- **Exporter** — the component that ships telemetry to a backend (OTLP exporter → Grafana Tempo, Jaeger, Honeycomb, etc.)
- **Collector** — the OpenTelemetry Collector process; sits between your app and the backend, batches and filters signals
- **Auto-instrumentation** — OTel SDK patches `http`, `pg`, `redis`, `ioredis` automatically without code changes
- **Context propagation** — W3C `traceparent` header carries the trace across HTTP boundaries; all downstream services join the same trace
- **OTLP** — OpenTelemetry Protocol; the wire format for exporting all three signal types

## Example Code
```typescript
// instrumentation.ts — Next.js App Router registers this via next.config.js
// This file runs before your app code; set up OTel here.
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'acme-web',
    [SEMRESATTRS_SERVICE_VERSION]: process.env.APP_VERSION ?? '0.0.1',
  }),

  // Ships traces to Grafana Tempo or Jaeger via OTLP/HTTP
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
  }),

  // Ships metrics every 30 seconds
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/metrics',
    }),
    exportIntervalMillis: 30_000,
  }),

  // Auto-instruments: http, pg, ioredis, fetch, dns — no extra code needed
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
process.on('SIGTERM', () => sdk.shutdown());

// libs/tracer.ts — manual spans for domain-level tracing
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('acme-web');

// Wrap any async function in a named span
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
      throw err;
    } finally {
      span.end();
    }
  });
}

// Usage in a login service — adds a domain span on top of the auto-instrumented
// pg span.
//
// ❌ Do NOT do this:  }, { 'user.email': email });
//    Span attributes are exported to the tracing backend and retained there,
//    usually for weeks, usually in a different jurisdiction, usually readable
//    by anyone with dashboard access. An email address is personal data, so
//    that one line turns a tracing tool into an undeclared data processor and
//    puts it in scope for every access request and breach notification.
//
// ✅ Attach an identifier you can already resolve from your own database.
export async function login(email: string, password: string) {
  const userId = await lookupUserIdByEmail(email); // may be null — do not leak that either
  return withSpan('auth.login', async () => {
    // ... login logic; the pg query inside becomes a child span automatically
  }, {
    'enduser.id': userId ?? 'unknown',   // an opaque id, resolvable only by you
    'auth.method': 'password',
  });
}
```

## When to Use
1. **Diagnosing slow API endpoints** — add OTel and immediately see which DB query or Redis call is the bottleneck without adding `console.time` everywhere.
2. **Multi-service requests** — when your Next.js API calls an external webhook or microservice, `traceparent` propagation stitches the full request into one trace.
3. **Queue worker visibility** — instrument BullMQ job processors so each job becomes a root span; see job duration, retries, and errors in your trace UI.
4. **Error rate dashboards** — OTel metrics give you `http.server.request.duration` histograms and `http.server.active_requests` gauges out of the box with auto-instrumentation.
5. **Correlating logs to traces** — inject `traceId` into Winston log entries so support can go from a user-reported error ID to the exact trace in two clicks.

## Common Mistakes
- **Initializing OTel after your database connection** — the SDK must start before any instrumented library is imported; use Next.js `instrumentation.ts` which runs first.
- **Exporting every span in production** — use a sampling strategy (`ParentBasedSampler` with 10% head sampling) to avoid overwhelming your backend with millions of spans per day.
- **Not setting semantic attributes** — use OTel semantic conventions (`db.statement`, `http.method`, `user.id`) so your backend can run standard queries; arbitrary attribute names break dashboards.
- **Ignoring the Collector** — shipping directly from app to Grafana works in dev; in production use the OTel Collector for buffering, filtering, and multi-destination fan-out.

## Further Reading
- OpenTelemetry JavaScript SDK: https://opentelemetry.io/docs/instrumentation/js/
- Next.js OpenTelemetry guide: https://nextjs.org/docs/app/building-your-application/optimizing/open-telemetry
- Grafana Tempo + Loki + Prometheus (the OSS observability stack): https://grafana.com/oss/
- [OpenTelemetry specification](https://opentelemetry.io/docs/specs/otel/) — the semantic conventions section is what keeps span attributes portable between backends
