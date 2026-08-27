# 27. Job Queue Design with BullMQ (Priority, Concurrency, Backpressure)

## What It Is
A job queue decouples the HTTP request-response cycle from work that is slow, failure-prone, or that should not run synchronously. Sending email, provisioning a tenant database, processing a Stripe webhook, generating a PDF invoice — none of these belong in an API route handler where a timeout or downstream failure would surface directly to the user. You enqueue the job, return 202 Accepted, and a worker picks it up.

BullMQ's design is built entirely on Redis. Each queue is a set of Redis sorted sets and lists. Jobs move through states: waiting → active → completed/failed. This means BullMQ is durable across process restarts (jobs persist in Redis), supports distributed workers (multiple processes pulling from the same queue), and gives you repeatable retry logic with exponential backoff. The `maxRetriesPerRequest: null` in your connection config is not optional — without it, ioredis will cancel pending commands on reconnect, which causes BullMQ workers to crash.

The three concepts you should care about next — priority, concurrency, and backpressure — are what separate a queue that works at 10 jobs/minute from one that works at 10,000. Priority lets you skip low-importance jobs when the queue is loaded. Concurrency sets how many jobs a single worker processes simultaneously. Backpressure is the harder one: it is the practice of deliberately slowing job enqueue when the queue depth exceeds a threshold, rather than letting it grow unboundedly and OOM your Redis instance.

## Key Concepts
- **Queue** — A named channel in Redis; producers add jobs, workers consume them
- **Worker** — A process that calls `new Worker(queueName, processor, options)` and pulls jobs
- **Job priority** — Lower numbers = higher priority; jobs with priority 1 run before priority 100
- **Concurrency** — `{ concurrency: N }` on a Worker lets it process N jobs in parallel; set based on whether your jobs are I/O-bound or CPU-bound
- **Backpressure** — Checking queue depth before enqueuing and rejecting or delaying when the queue is too deep
- **Rate limiting** — `{ limiter: { max: 100, duration: 1000 } }` on a Worker throttles processing rate regardless of queue depth
- **Delayed jobs** — Jobs can be scheduled with a delay in ms; useful for retry cooling, scheduled notifications, trial expiry warnings
- **Flow Producer** — BullMQ Pro / v3 feature: parent jobs that wait for child jobs to complete before advancing

## Example Code
```typescript
// libs/queues/email.queue.ts
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { getBullMQConnection } from '@/lib/redis/bullmq';
import MailService from '@/modules/notification_mail/notification_mail.service';
import Logger from '@/lib/logger';

export interface EmailJobData {
  to: string;
  subject: string;
  templateId: string;
  variables: Record<string, string>;
  tenantId?: string;
}

const EMAIL_QUEUE = 'email';
const connection = getBullMQConnection();

// --- Producer (used in your API routes / services) ---
export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE, {
  connection,
  defaultJobOptions: {
    attempts: 4,
    backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s, 16s
    removeOnComplete: { count: 500 },               // keep last 500 completed jobs
    removeOnFail: { count: 200 },
  },
});

/** Enqueue with backpressure: refuse if queue is too deep */
export async function enqueueEmail(
  data: EmailJobData,
  opts: { priority?: number } = {}
): Promise<void> {
  const waiting = await emailQueue.getWaitingCount();
  if (waiting > 5_000) {
    Logger.warn('[EmailQueue] Backpressure: queue too deep, dropping job', { waiting });
    // In production: push to a dead-letter queue or return 503 to caller
    throw new Error('Email queue is overloaded, try again later');
  }

  await emailQueue.add('send', data, {
    priority: opts.priority ?? 10,   // lower = higher priority
    jobId: `email:${data.to}:${Date.now()}`, // dedup key if needed
  });
}

// --- Worker (runs in a separate process or edge worker) ---
export function startEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE,
    async (job: Job<EmailJobData>) => {
      Logger.info(`[EmailWorker] Processing job ${job.id}`, { to: job.data.to });
      await MailService.send(job.data);
    },
    {
      connection,
      concurrency: 10,           // 10 parallel email sends (I/O-bound: safe to go high)
      limiter: { max: 100, duration: 1000 }, // max 100 emails/second
    }
  );

  worker.on('failed', (job, err) => {
    Logger.error(`[EmailWorker] Job failed after ${job?.attemptsMade} attempts`, {
      jobId: job?.id,
      error: err.message,
    });
  });

  return worker;
}

// --- Usage from an API route ---
// await enqueueEmail({ to: user.email, subject: 'Welcome', templateId: 'welcome', variables: {} });
// await enqueueEmail({ to: adminEmail, subject: 'URGENT', templateId: 'alert', variables: {} }, { priority: 1 });
```

## When to Use
- Sending transactional email or SMS — never block an HTTP handler on a mail provider
- Provisioning per-tenant databases on signup — this can take seconds; do it async
- Processing payment webhooks from Stripe/Iyzico that require DB writes and side effects
- Any work that should be retried on failure with backoff (external API calls, notifications)
- Scheduled recurring jobs (trial expiry warnings, subscription renewal reminders) via delayed jobs

## Common Mistakes
- **Running workers inside your Next.js API routes** — Workers need a persistent process; API routes are serverless/short-lived. Run workers in a separate `worker.ts` entry point
- **Not setting `maxRetriesPerRequest: null`** — BullMQ will crash on Redis reconnect without this; your `libs/redis/bullmq.ts` already has it, never remove it
- **Ignoring queue depth monitoring** — A queue that grows to millions of jobs will eventually OOM Redis or create unbounded latency; add depth alerting
- **Concurrency too high for CPU-bound work** — If your worker does image processing or crypto, `concurrency: 50` will thrash the CPU; keep it at 1–4 and add more worker processes instead

## Further Reading
- [BullMQ official docs: Workers and Concurrency](https://docs.bullmq.io/guide/workers)
- [BullMQ: Rate limiting and backpressure](https://docs.bullmq.io/guide/rate-limiting)
- [Redis best practices for queues (Upstash)](https://upstash.com/blog/bullmq-redis-best-practices)
