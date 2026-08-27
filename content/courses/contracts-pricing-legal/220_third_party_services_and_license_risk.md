# 220. Third-Party Services, Licenses, and Dependency Risk

## What It Is
Almost no modern software project is built from scratch — it's assembled from hosting providers, payment processors, email services, open-source packages, and paid plugins, each with its own costs, limits, approval delays, and legal terms. Two separate risk categories hide inside "we'll just use a few third-party services": commercial risk (who pays, who owns the account, what happens when a provider changes pricing or has an outage) and license risk (whether the freelancer is legally allowed to ship a given open-source package inside a client's proprietary product at all).

On the commercial side, the default that protects a freelancer is simple and worth stating in every SOW: third-party fees, subscriptions, transaction costs, and provider approvals belong to the client unless explicitly included in the price, and the freelancer isn't responsible for outages, rejected accounts, API deprecations, or policy changes caused by a provider they don't control. A dependency table — service, purpose, account owner, cost owner, and risk notes — turns this from an assumption into a document both sides can point to later.

On the license side, the risk is invisible until it isn't: open-source licenses range from essentially no-obligation (MIT, BSD, Apache with a notice file) through copyleft licenses that impose real constraints. GPL-licensed code bundled into a client's proprietary product can force the client's own code to be released under GPL terms; AGPL is even stricter and effectively incompatible with closed-source SaaS. A package with no stated license at all defaults, legally, to "all rights reserved" — meaning it isn't actually free to use commercially, whatever its GitHub star count suggests. Running an automated license audit (tools exist for essentially every major stack) before delivering a client's codebase is a cheap, mechanical step that catches this before it becomes an IP claim against the client, which is exactly the kind of problem that lands back on the freelancer's desk with far higher stakes. None of this is legal advice about whether a specific license is safe for a specific product — for anything commercially significant, a lawyer or a paid license-compliance review is worth the cost.

## Key Concepts
- **Dependency ownership table**: for every third-party service, name the account owner, the cost owner, and the risk if it's delayed, rejected, or changes — don't leave any of the three implicit.
- **Provider limitation clause**: the freelancer isn't responsible for outages, approval delays, pricing changes, or policy changes caused by a third-party provider outside their control.
- **Default cost assignment**: hosting, domain, payment processor fees, premium plugins/themes, and paid APIs are the client's cost unless the SOW explicitly includes them in the price.
- **License risk tiers**: permissive (MIT/BSD/Apache — safe, sometimes needs attribution), weak copyleft (LGPL/MPL — usage constraints, generally manageable), strong copyleft (GPL/AGPL — can force the client's own code open, especially dangerous in closed-source or SaaS products), and unlicensed (legally "all rights reserved" by default, not free to use).
- **Pre-delivery license audit**: running an automated dependency/license scanner before handing a codebase to a client, so a licensing problem is caught before it becomes the client's legal exposure.

## Example Code
```markdown
## Third-Party Dependency Table
| Service | Purpose | Account Owner | Cost Owner | Risk/Notes |
|---|---|---|---|---|
| Domain registrar | Domain/DNS | Client | Client | DNS access needed before launch |
| Hosting provider | Deployment | Client | Client (unless included) | Outage is outside contractor control |
| Payment provider | Checkout | Client | Client | KYC/approval delay may affect launch date |
| External API | Integration | Client/provider | Client | Rate limits or API changes may affect scope |

## Provider Limitation Clause (illustrative)
Contractor is not responsible for outages, approval delays, rejected
accounts, pricing changes, or policy changes caused by third-party
service providers.

## License Risk Checklist (run before delivery)
- [ ] Automated license scan run against the full dependency tree
- [ ] No GPL/AGPL packages bundled into closed-source deliverables without
      the client's informed, written consent
- [ ] Any package with no stated license replaced or explicitly flagged
- [ ] Apache 2.0 NOTICE file included where required
```

## When to Use
- When scoping any project that will use hosting, payment processing, or third-party APIs — essentially every project.
- Before delivering a codebase to a client, as a standard pre-handover step.
- Whenever a client or contractor proposes using a package or plugin you haven't personally vetted.

## Common Mistakes
- Letting third-party costs go unassigned in the SOW, so hosting or API fees quietly become the freelancer's ongoing expense.
- Promising that a provider's approval (payment processor KYC, app store review) will complete on a guaranteed date.
- Bundling a GPL- or AGPL-licensed package into a client's proprietary product without checking the license or telling the client.
- Treating "it's on GitHub with a lot of stars" as equivalent to "it's safe to use commercially."

## Further Reading
- [The Open Source Initiative's license list and comparison guide](https://opensource.org) for understanding license categories.
- The Software Freedom Law Center's practical guides on open-source license compliance for commercial products.
- [Snyk documentation](https://docs.snyk.io/) — automated license and dependency scanning in a CI pipeline; FOSSA documents an equivalent workflow
