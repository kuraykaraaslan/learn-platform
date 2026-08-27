# 112. Technical Writing — Runbooks, API Docs, Decision Docs

## What It Is
Technical writing for software has three distinct audiences and purposes: runbooks tell an operator what to do when something breaks, API documentation tells a developer how to use your system, and decision documents tell future-you (or a new team member) why something was built the way it was.

The quality of these documents is tested under pressure. A runbook is read at 3am by someone who is stressed and hasn't slept. An API doc is read by a developer who is already frustrated that they can't figure something out. A decision doc is read months later by someone trying to understand why a seemingly bad decision was made. If your document fails under those conditions, it fails.

The inverted pyramid structure applies to all three: most important information first, context and detail later. A runbook step that buries "check if Redis is running" in paragraph 4 has failed its purpose.

## Key Concepts
- **Runbook**: Step-by-step operational guide for a specific scenario (service restart, database failover, incident response). Commands must be copy-paste ready. No ambiguity.
- **API documentation**: Describes endpoints, request/response schemas, auth requirements, error codes, and rate limits. OpenAPI/Swagger is the standard format.
- **Decision document**: Records what was decided, what alternatives were considered, and why this option was chosen. Not a design spec — a justification.
- **Inverted pyramid**: Lead with the action/answer, then context, then background. Readers stop when they have what they need.
- **Runbook vs playbook**: A runbook handles one specific scenario. A playbook covers a class of incidents (e.g., "all database incidents").
- **Living documents**: Runbooks rot if not updated. Each runbook execution should verify the steps still work. Add "last verified" date.
- **OpenAPI spec**: Machine-readable API contract. Can generate client SDKs, mock servers, and interactive docs (Swagger UI).

## Example / Template

````markdown
# Runbook: Auth Service — High Error Rate

**Severity:** P2  
**Last verified:** 2026-05-04  
**Owner:** @your-handle  

## Symptoms
- `/api/auth/login` returning 5xx at > 1% rate
- Alert: `auth_error_rate > 0.01` for 5 minutes

## Immediate Steps

1. Check if the service is running:
   ```bash
   curl -s https://your-app.com/api/health | jq .
   ```
   Expected: `{"status":"ok","db":"connected","redis":"connected"}`

2. Check recent error logs:
   ```bash
   tail -100 logs/$(date +%Y-%m-%d).log | grep ERROR
   ```

3. Check Redis connection (session cache):
   ```bash
   redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
   ```
   Expected: `PONG`. If timeout → proceed to Redis Runbook.

4. Check database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```
   If fails → proceed to Database Runbook.

5. If service is unreachable, restart:
   ```bash
   pm2 restart acme-web
   # or in Kubernetes:
   kubectl rollout restart deployment/acme-web
   ```

## Root Cause Categories
| Symptom | Likely cause | Next step |
|---|---|---|
| `ECONNREFUSED` on Redis | Redis down or network | Redis Runbook |
| `P1001` Prisma error | DB unreachable | DB Runbook |
| JWT errors | SECRET env var missing | Check deployment env vars |
| High latency not errors | N+1 query under load | Enable query logging |

## Escalation
If unresolved after 15 minutes: page senior on-call via PagerDuty.
````

```yaml
# OpenAPI snippet for your auth endpoints
openapi: 3.0.3
paths:
  /api/auth/login:
    post:
      summary: Authenticate with email and password
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
      responses:
        '200':
          description: Authentication successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '429':
          description: Too many requests
```

## When to Use / Apply
- Before handing a project to a client or second developer — write the runbook first, it reveals gaps in your own understanding
- After every production incident — update the runbook with what you actually did
- When your API will be consumed by someone else (client's frontend team, third-party integrator)
- When making an architectural decision you'll want to justify later — write the decision doc the same day

## Common Mistakes
- Writing runbooks after incidents instead of before — you're documenting what happened, not what to do next time
- Runbook steps that require interpretation ("check if the service is healthy") instead of commands
- API docs that describe happy path only — error codes and edge cases are what developers actually need
- Decision docs written as design proposals — a decision doc is about justification, not exploration

## Further Reading
- Google's SRE Workbook (sre.google/workbook) — Chapter 8 covers on-call and runbook best practices
- *Docs for Developers* — Bhatti et al.: practical technical writing guide aimed at engineers, not writers
- Swagger/OpenAPI docs (swagger.io/docs) — reference for writing OpenAPI 3.0 specs
