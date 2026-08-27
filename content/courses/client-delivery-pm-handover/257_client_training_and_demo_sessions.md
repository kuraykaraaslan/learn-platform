# 257. Client Training and Demo Sessions

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Documentation_and_Handover_Rules/training-and-demo-session.md material to build out the Client Delivery, PM & Handover course; no existing coverage data for your own practice.

## What It Is
A demo or training session run without structure tends to drift into whatever the developer finds most interesting to show — usually the technically impressive parts — rather than what the client's team actually needs to walk away knowing. A structured session, by contrast, has a fixed agenda that moves from delivery summary through production access, roles, core workflows, admin responsibilities, known limitations, and finally support process and next steps, ending in acceptance. The session is where a delivery starts to feel complete to the client, and it's also the single highest-leverage hour for reducing every support ticket that follows, because a well-run training session answers the questions that would otherwise arrive one at a time over the following month.

Preparation matters more than delivery style. Discovering a basic production failure during the actual client training session — a broken login, a missing demo account, stale demo data — is one of the most damaging things that can happen at this stage, because it undermines confidence in the whole delivery at the exact moment the client is forming their final impression. The pre-demo checklist exists specifically to catch this before the client is in the room: production works, demo accounts exist, demo data is safe to show, critical workflows have actually been tested that day, and the admin guide is ready to hand out.

Language matters as much as preparation. "This hits the API, creates a row in PostgreSQL, and returns JSON" tells a business stakeholder nothing useful; "when your staff creates a new order here, the system saves it, updates the admin list, and makes it available for reporting" describes the same event in terms the client can actually act on. And when a new feature request surfaces mid-session — which it often will, because seeing the finished product prompts new ideas — the discipline is to note it as a candidate for a future phase rather than letting the session quietly become unpaid scope expansion in real time.

## Key Concepts
- **A fixed eleven-point agenda**: delivery summary, production URL and access, role overview, core workflows, admin workflows, reports/exports, integrations/notifications, known limitations, support process, Q&A, and acceptance/signoff next step
- **The pre-demo checklist is non-negotiable**: production or staging works, demo accounts exist, demo data is safe, critical workflows are freshly tested, and the admin guide is ready — discovering a basic failure live in front of the client is a preventable failure of preparation
- **Business language first, technical language second**: describe what happens in terms of what the user experiences and what business outcome results, with technical detail only as a secondary aside for those who want it
- **New requests get parked, not absorbed**: "that's a good candidate for a next phase — I'll note it separately so we don't mix it with final delivery acceptance" keeps enthusiasm from quietly becoming free scope
- **Training output is a package, not just a memory of the call**: recording link (if available), the admin/user guide, a list of answered questions, open items, and a signoff reminder should all go out after the session
- **Real private data should be avoided in demos unless necessary**: showing genuine sensitive client data during a walkthrough is an avoidable risk when demo data would serve the same teaching purpose
- **The session must end with a clear next step**: an agenda that runs out of time without reaching the acceptance/signoff conversation has left the most important item for last and then dropped it

## Example Code
```md
## Demo Agenda — Order Management Admin Panel Handover Training
**Date:** 2026-09-11, 10:00–10:45
**Attendees:** Tomas Reyes, Elena Vance, 2 warehouse staff

1. Project delivery summary (5 min)
2. Production URL and login (5 min)
3. Role/permission overview: Admin vs Staff (5 min)
4. Core workflow: creating and updating an order (10 min)
5. Admin workflow: CSV export, user management (10 min)
6. Known limitations: large export timing (2 min)
7. Support and maintenance process: 14-day window, then retainer options (5 min)
8. Client questions (10 min, or as needed)
9. Acceptance/signoff next step (3 min)

## Pre-Demo Checklist
- [x] Production verified working this morning
- [x] Demo accounts created for Admin and Staff roles
- [x] Demo data is safe, non-sensitive sample orders
- [x] Full order → status → export flow tested today
- [x] Admin guide printed/linked and ready to share
- [x] Known issues list ready to disclose
- [x] Support terms document ready

## Post-Session Follow-Up (sent same day)
- Admin/User Guide: handover/01-admin-user-guide.md
- Answered questions: [list]
- Open item: accounting export format (logged as CR-002, awaiting approval)
- Signoff reminder: please confirm acceptance by 2026-09-13
- Support instructions: see handover/11-support-and-maintenance.md
```

## When to Use
- Before every significant client-facing delivery milestone, and mandatorily before final handover
- The day of the session, as a same-day pre-demo check — not the day before, since staging or production state can shift overnight
- Whenever a client raises a new feature idea mid-demo, as the trigger to log it separately rather than discussing implementation live
- Immediately after the session, to send the follow-up package while the conversation and its open items are still fresh for both sides

## Common Mistakes
- Discovering a basic production failure during the live session because the pre-demo checklist wasn't run that same day
- Explaining features in implementation-level technical language that leaves a business stakeholder unable to connect it to their actual workflow
- Letting a mid-demo feature request turn into an improvised scoping discussion that blurs into the final delivery acceptance
- Ending the session without sending a follow-up package, leaving the guide, open items, and signoff reminder to be reconstructed later from memory

## Further Reading
- Nancy Duarte, *Resonate* — on structuring a presentation around what the audience needs to walk away understanding, directly applicable to demo agenda design
- Intercom, "How to run a great onboarding call" — practical structure for training sessions that reduce future support load: https://www.intercom.com/blog/customer-onboarding/
- David Maister, Charles H. Green, Robert M. Galford, *The Trusted Advisor* — on why a well-run final session builds credibility that outlasts the project itself
