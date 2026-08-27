# 253. Deployment Runbook and Emergency Handover

## What It Is
Deployment knowledge that lives only in the original developer's memory is a single point of failure disguised as convenience. "Deployment is automatic" tells a future maintainer nothing about what actually triggers it, where to watch it happen, or what to do when it fails — and the moment that developer is unreachable during an actual production emergency, that missing detail becomes the client's problem at the worst possible time. A deployment runbook exists to make release and recovery knowledge portable: written down completely enough that someone who wasn't there for the original build could still safely ship a fix or roll back a bad one.

The runbook has a fixed shape because production incidents don't leave time to improvise structure: hosting provider and account owner, production URLs, the branch and exact build/start commands, where environment variables live, the DNS and SSL setup, where logs actually are, what's monitored, what's backed up, and — the two sections that matter most under pressure — the rollback procedure and the emergency checklist. A rollback note that says "provider supports redeploying the previous version" is only useful paired with the actual click path and an explicit warning about database migration compatibility, because rolling back application code while a schema migration has already run forward is its own way to make an incident worse.

The emergency checklist is what turns a stressful, ambiguous moment into a mechanical sequence: check hosting status, check the latest deployment logs, check database availability, check environment variables, check DNS and SSL, roll back if the latest deploy caused it, notify the client with current status, and record incident notes. Following a checklist under pressure produces calmer, faster, more correct decisions than reasoning from scratch while the client is also messaging with rising urgency.

## Key Concepts
- **Sixteen fixed sections, not prose**: hosting, URLs, branch, build/start commands, env var location, deployment process, DNS/SSL, logs, monitoring, backup, rollback, and an emergency checklist — a runbook missing any of these has a real gap, not a stylistic omission
- **"Deployment is automatic" is never a complete answer**: it must be paired with what triggers it (a merge to a branch, a manual button, a CLI command) and where to watch the result
- **Rollback notes need the click path and a migration warning**: knowing a provider supports redeploying a previous version is useless without knowing exactly where to click, and dangerous without knowing whether the database schema is still backward-compatible with that older version
- **The smoke test is a fixed post-deploy ritual**: homepage loads, login works, admin dashboard loads, the critical create/edit flow works, and logs show no critical errors — run every time, not only when something feels risky
- **The emergency checklist is sequential, not a menu**: check hosting status, then deployment logs, then database, then env vars, then DNS/SSL, then decide on rollback, then communicate, then document — skipping ahead to "just roll back" without checking cause first can make things worse
- **Client communication is part of the runbook, not an afterthought**: "notify client with current status and next action" is a listed step, not something improvised only after the technical fire is out
- **Backup state must be stated honestly**: "what is backed up and how often" needs a real, verified answer in the runbook, not an assumed one

## Example Code
```md
# Deployment Runbook — Order Management Admin Panel

## Production URLs
- App: https://orders.meridianretail.example
- Admin: https://orders.meridianretail.example/admin

## Hosting Provider
Vercel (frontend), Railway (database). Both owned by client's organization
account.

## Repository and Branch
github.com/meridianretail/order-admin, production branch: `main`

## Build and Start Commands
```bash
npm run build
npm run start
```

## Deployment Process
1. Merge approved PR into `main`.
2. Vercel auto-deploys on push to `main` — watch the deploy in Vercel dashboard.
3. Confirm build succeeded (green checkmark, ~90 seconds typical).
4. Run smoke test (see below).
5. Monitor error logs for 10 minutes post-deploy.

## Rollback
In Vercel dashboard → Deployments → find last known-good deployment →
"Promote to Production." Takes effect immediately, no rebuild needed.
**Warning:** if a database migration ran with the deployment being rolled
back, confirm schema compatibility with the older code before assuming
rollback alone is safe — check `06-database-and-backup.md`.

## Emergency Checklist
1. Check Vercel and Railway status pages.
2. Check latest deployment logs in Vercel dashboard.
3. Check database availability in Railway dashboard.
4. Check environment variables are present and unchanged.
5. Check domain/DNS/SSL (Namecheap → Vercel).
6. Roll back if the latest deployment is the likely cause.
7. Notify client: current status, likely cause, next update time.
8. Record incident notes in `known-issues.md` or an incident log.

## Smoke Test
- [ ] Homepage loads
- [ ] Login works (staff + admin accounts)
- [ ] Order list loads with data
- [ ] Create order → status transition → export CSV all succeed
- [ ] No critical errors in logs
```

## When to Use
- Before final handover, as one of the non-negotiable documents for any project with a real production deployment
- Immediately after setting up the deployment pipeline, while the exact commands and click paths are fresh, rather than reconstructed from memory later
- During any production incident, as the first thing to open rather than reasoning about the system from scratch under pressure
- When transferring support responsibility to another developer or the client's internal team, as the primary artifact that makes the transfer safe

## Common Mistakes
- Writing "deployment is automatic" with no explanation of the trigger or where to verify it succeeded
- Omitting the database migration compatibility warning from the rollback section, risking a rollback that makes an incident worse instead of better
- Leaving backup status vague or implied rather than stated as a verified fact
- Treating client communication as something to figure out after the technical incident is resolved, instead of as a scheduled step in the same checklist

## Further Reading
- Google SRE Book, "Managing Incidents" — the canonical reference for structured incident response and the value of a fixed checklist under pressure: https://sre.google/sre-book/managing-incidents/
- Atlassian, "Incident management runbooks" — practical runbook templates and structure: https://www.atlassian.com/incident-management/handbook/runbooks
- Martin Fowler, "BlueGreenDeployment" and related deployment pattern writing — on why safe rollback requires thinking about deployment and rollback together, not as an afterthought: https://martinfowler.com/bliki/BlueGreenDeployment.html
