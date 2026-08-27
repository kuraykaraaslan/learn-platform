# 115. Productizing Services — From Hourly to Packaged Offerings

## What It Is
A productized service is a service with a fixed scope, fixed price, and repeatable delivery process. The opposite is custom work: every engagement is scoped from scratch, priced by time, and delivered differently. Custom work scales with hours worked. A productized service scales with the process you've built.

Your multi-tenant SaaS boilerplate is already the core of a productized service. You've built the hard parts (auth, billing, multi-tenancy, notifications, RBAC, audit log) once. A client who needs a SaaS MVP doesn't know or care how it's built — they care that it works, ships on time, and doesn't require them to rebuild it in a year. You can package that delivery.

The mental shift is from "I sell my time" to "I sell an outcome." The boilerplate is the mechanism that makes the outcome repeatable. The pricing is based on value to the client, not hours you'll spend.

## Key Concepts
- **Productized service**: Fixed scope + fixed price + documented delivery process. Repeatable.
- **Custom project**: Unique scope + time-based pricing + custom delivery. Every engagement starts from zero.
- **Scope buffer**: Building a defined buffer into fixed-price projects (typically 20–30%) to absorb scope ambiguity. If unused, it's margin.
- **Value-based pricing**: Price is set by the value delivered to the client, not your cost. A €3000/month SaaS replacing a €50K/year manual process is worth more than 80 hours × €50.
- **Three-tier packaging**: Starter / Growth / Scale (or equivalent). Creates anchoring — clients compare your tiers instead of your price to competitors.
- **Delivery process**: The documented, repeatable steps you follow. Makes the service consistent and trainable.
- **Productized ≠ cheap**: Productized services typically command higher prices than hourly work because they're lower risk for the client.
- **Retainer extension**: A productized delivery often ends with a support/maintenance retainer — recurring revenue from a one-time sale.

## Example / Template

**Productized Service: SaaS MVP in 8 Weeks**

```markdown
## SaaS MVP — 8-Week Delivery

**What you get:**
- Production-ready multi-tenant SaaS application
- Auth: email/password, OTP, social login (Google/GitHub), passkeys
- Billing: Stripe/Iyzico subscription with plan management
- Admin dashboard: user management, tenant management, audit log
- Notifications: email + in-app
- Deployment: Vercel + managed PostgreSQL + Redis
- Architecture documentation + runbook

**What you need to provide:**
- Your core feature requirements (the unique part of your product)
- Brand assets (logo, colors)
- Domain name

**Timeline:**
- Week 1–2: Requirements, design system, database schema
- Week 3–5: Core features (your unique product functionality)
- Week 6–7: Integration, testing, staging deployment
- Week 8: Production deployment, handover, documentation

**Investment:** €12,000 fixed price
(Payment: 40% on contract, 40% at week 4 milestone, 20% on delivery)

**Optional add-ons:**
- Mobile app (iOS + Android): +€8,000
- 3-month post-launch support retainer: €1,500/month
- Custom AI feature integration: from €3,000
```

**Three-tier packaging template:**

| | Starter | Growth | Scale |
|---|---|---|---|
| **What** | Landing page + waitlist | Full SaaS MVP | MVP + mobile app |
| **Timeline** | 2 weeks | 8 weeks | 14 weeks |
| **Price** | €3,000 | €12,000 | €22,000 |
| **Support** | 30-day bug fixes | 60-day bug fixes | 3-month retainer |

## When to Use / Apply
- When you're doing the same type of project repeatedly but scoping it from scratch each time
- When hourly billing is creating pricing anxiety for clients (fixed price removes this)
- When you want to raise rates without justifying more hours
- When you want to work on fewer, higher-value projects rather than many small ones

## Common Mistakes
- Fixed price without a defined scope — scope creep will consume all your margin
- Productizing before you've delivered the service at least 3 times — you don't know your actual delivery time yet
- Pricing based on hours × rate instead of value — leaves money on the table
- No contract clause for out-of-scope requests — "that's a small change" is how fixed-price projects become losses

## Further Reading
- *The Freelancer's Bible* — Sara Horowitz: comprehensive freelance business guide including productizing
- *Hourly Billing Is Nuts* — Jonathan Stark: short, direct argument for value-based pricing
- *The Win Without Pitching Manifesto* — Blair Enns: positioning and pricing for technical consultants
