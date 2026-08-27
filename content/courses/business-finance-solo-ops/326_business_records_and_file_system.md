# 326. Business Records and File Organization for Accountant Handoff

## What It Is
> This lesson is general education, not financial or tax advice. Confirm with your accountant or local regulations how long specific record types must legally be retained in your jurisdiction.

A business record that can't be found within a few minutes is, for practical purposes, the same as a record that doesn't exist. File organization is not administrative busywork — it's what makes accounting handoff painless, what protects you in a client dispute, and what lets future-you reconstruct exactly what happened with a project or a payment eighteen months later without relying on memory.

The fix is a predictable, hierarchical folder structure and a consistent file-naming convention applied without exception. Finance records live under a dated structure (year, then month), client records live under client-then-project folders with contract, proposal, finance, delivery, and handover subfolders, and vendor records get their own space. File names follow a fixed pattern — date, client or vendor, project, document type, and version — so that a file's identity is legible from its name alone, without opening it. "final_final_real.pdf" is the canonical failure mode this convention exists to prevent.

Security matters as much as organization: sensitive financial and client records belong in secure, backed-up storage, never in public sharing links, and never with credentials stored inside a document instead of a password manager. The test for whether the system is good enough is simple — can any invoice, contract, payment confirmation, or project financial summary be located within minutes? If not, the file system is too weak, regardless of how organized it feels day-to-day.

## Key Concepts
- **Standard folder structure**: a top-level Business_Operations tree with Finance (by year/month), Clients (by client, then project), Vendors, Subscriptions, SOPs, and Monthly_Reviews as siblings.
- **File naming convention**: `YYYY-MM-DD_client_project_document-type_v01.ext` for client files and `YYYY-MM_invoice-no_client_project.pdf` for invoices — predictable enough to sort and identify without opening.
- **Required record types**: proposals, contracts, invoices issued, payment confirmations, expense receipts, bank exports, subscription invoices, vendor agreements, client approvals, handover confirmations, support agreements, accountant notes, and monthly review summaries.
- **Access and security rules**: use secure, backed-up storage; avoid public sharing links for financial records; never store credentials inside documents — use a password manager; keep public portfolio assets separate from private financial records.
- **The retrieval test**: any invoice, contract, payment confirmation, or financial summary should be findable within minutes — if not, the system needs rework regardless of how it feels.
- **Forbidden patterns**: storing invoices only in email, mixing multiple clients in one folder, using non-descriptive filenames, and keeping payment or scope approvals only as chat screenshots with no durable record.

## Example Code
A concrete folder layout and naming pattern applied to one client engagement:

```
Business_Operations/
  Finance/
    2026/
      07_July/
        invoices_issued/2026-07-03_invoice-014_clientD_saas-mvp.pdf
        payments_received/2026-07-05_payment-confirmation_clientD.pdf
        expenses/2026-07-12_vercel_subscription_hosting_20usd.pdf
        bank_exports/2026-07-31_bank-export-july.csv
        accountant_notes.md
  Clients/
    ClientD/
      2026_SaaS-MVP/
        contract/2026-05-10_clientD_saas-mvp_contract_v01.pdf
        proposal/2026-04-28_clientD_saas-mvp_proposal_v02.pdf
        finance/2026-07-03_invoice-014_clientD_saas-mvp.pdf
        delivery/2026-07-20_clientD_saas-mvp_handover-notes.md
        handover/2026-07-22_clientD_saas-mvp_credentials-transferred.md
```
Anyone — including a future accountant or a version of you eighteen months from now — can find "the July invoice for Client D" without opening a single file, purely from the path and name.

## When to Use
- When setting up business record-keeping for the first time, before the folder chaos accumulates.
- Immediately upon receiving any invoice, contract, payment confirmation, or handover document — file it the day it arrives, not at month-end.
- Before every accountant handoff or tax filing, to confirm nothing is missing or misfiled.
- Whenever a client dispute or payment question arises and you need to reconstruct exactly what was agreed and paid.

## Common Mistakes
- Storing invoices and contracts only in email, where they're hard to search, easy to lose, and disconnected from other project records.
- Using vague or incremental filenames like "final_v2_actually_final.pdf" instead of the structured date-client-type convention.
- Mixing several clients' documents into one folder, making later retrieval and accountant handoff far slower than necessary.
- Treating a chat screenshot as sufficient proof of a scope or payment approval instead of saving a durable, dated record.

## Further Reading
- *Getting Things Done* — David Allen: the broader organizational discipline (capture everything, file predictably) applies directly to financial record-keeping.
- Most cloud storage providers (Google Drive, Dropbox) support this folder structure natively — the convention matters more than the specific tool.
