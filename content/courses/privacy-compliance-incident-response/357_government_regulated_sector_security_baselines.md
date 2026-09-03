# 357. Government & Regulated-Sector Security Baselines

## What It Is
> This lesson is general education, not legal advice. The intent is practical judgment — recognizing which obligations exist and when they are triggered, not carrying the compliance decision yourself. Requirements differ by jurisdiction: TR, US, UK, UAE, EU and JP do not align on lawful basis, breach notification deadlines, data residency or children's-data thresholds, so confirm the specifics for the regions you actually operate in.

SOC 2 and ISO 27001 are the frameworks most B2B SaaS companies encounter, but they are not the frameworks that apply when the customer is a government body, a public-sector agency, or a company operating under a national-security-adjacent contract. Government and regulated-sector procurement runs on a different, often mandatory, set of certifications, and discovering one of these requirements after a contract is signed instead of during discovery turns into an expensive scramble — some of them (a certification body's assessment, a security clearance, a domestic-hosting requirement) cannot be fast-tracked no matter how much budget is thrown at them.

In the UK, **Cyber Essentials** is required for essentially any government contract touching personal data or sensitive government information, and — critically — it should be obtained proactively rather than after winning a bid, because the assessment itself takes time. It certifies five controls: firewalls and internet gateways, secure configuration, user access control, malware protection, and patch management (high-severity patches within 14 days). A self-assessed version costs roughly £300-500/year; **Cyber Essentials Plus**, which requires independent technical verification, costs more and takes longer, and some contracts specifically require the Plus tier.

In the US, delivering software to a federal agency — directly or as a subcontractor — brings NIST SP 800-53 / FISMA baseline controls into play even at the lowest impact tier: MFA on all privileged accounts, AES-256 encryption at rest, TLS 1.2+ in transit, audit logs retained a minimum of three years, no standing admin rights, and a documented, tested incident response plan. Cloud services used by a federal agency additionally require **FedRAMP** authorization, and Department of Defense work involving Controlled Unclassified Information brings **CMMC** into scope — both are substantial, separate certification programs, not checkbox items, and the applicability threshold (does this system touch CUI, is this a cloud service used by the agency directly) needs to be established during discovery, not assumed.

The common thread across jurisdictions is the same lesson data classification teaches for personal data: the classification of the client and the data determines the floor, and that floor is often non-negotiable, externally audited, and slow to obtain — which means the discovery conversation ("is this a government body, does this touch government-classified or CUI data, what's the required certification") has to happen before the SOW is signed, not after the first delivery milestone.

## Key Concepts
- **Cyber Essentials (UK)**: mandatory baseline for UK government contracts touching personal or sensitive data — five controls, self-assessed (~£300-500/yr) or Plus tier with independent verification
- **NIST SP 800-53 / FISMA (US)**: minimum control baseline for any system touching US federal agency work, even at the lowest impact tier — MFA, AES-256 at rest, TLS 1.2+, 3-year audit log retention
- **FedRAMP**: mandatory authorization for cloud services used directly by a US federal agency — a substantial, separate certification track, not a checklist add-on
- **CMMC**: required for Department of Defense work involving Controlled Unclassified Information (CUI) — has defined maturity levels with escalating control requirements
- **Certify proactively, not reactively**: certifications like Cyber Essentials and FedRAMP take real calendar time — obtaining them after winning a bid is often too late to meet a contract's start date
- **National data classification schemes**: government bodies frequently classify data outside the commercial Public/Internal/Confidential scheme (e.g., Turkey's Tasnif Dışı / Hizmete Özel / Gizli / Çok Gizli) — the classification dictates hosting and access requirements
- **Discovery-stage applicability check**: "is the client a government body, and does this system touch CUI, classified, or officially-sensitive data" must be asked before scoping, because the answer changes the entire infrastructure and certification budget

## Example Code
```markdown
# Discovery Checklist — Government / Regulated-Sector Client

## Applicability
- [ ] Is the client a government body, public-sector agency, or publicly funded institution?
- [ ] Is this a direct contract or a subcontract under a prime contractor?
- [ ] Does the system process personal data of citizens, or officially-sensitive
      government information?
- [ ] Jurisdiction: UK / US federal / EU member state / other — may be more than one

## Framework Routing (pick all that apply)
| Signal | Framework | Action |
|---|---|---|
| UK government contract + personal/sensitive data | Cyber Essentials | Certify before bid submission if possible; budget 4-8 weeks |
| UK contract explicitly requires independent verification | Cyber Essentials Plus | Budget longer lead time + higher cost |
| US federal agency (direct or subcontract) | NIST SP 800-53 / FISMA | Baseline controls in architecture from day one |
| Cloud service consumed directly by a US federal agency | FedRAMP | Treat as its own project — 6-12+ month authorization timeline |
| US DoD work touching CUI | CMMC | Identify required maturity level before scoping |
| TR government / e-government integration | Hizmete Özel classification | Apply high-risk baseline controls at minimum |

## Non-Negotiable Flag
If the required certification cannot realistically be obtained in the contract's
timeline, flag this to the client/stakeholders BEFORE signing — do not commit to
a go-live date that assumes a certification will land faster than its typical
processing time.
```

## When to Use
- During discovery/scoping for any government, public-sector, or publicly funded client, before committing to a timeline or budget
- When a commercial client's contract flows down federal requirements because they are a subcontractor to a government prime contractor
- When choosing cloud infrastructure for a system that a US federal agency will consume directly — verify FedRAMP status before committing to a provider
- When a UK client mentions "we need Cyber Essentials" — clarify immediately whether it's the self-assessed tier or Plus, since the cost and timeline differ substantially
- When pricing a proposal for regulated-sector work — certification and hosting requirements can add significant, front-loaded cost that needs to be visible in the quote

## Common Mistakes
- **The contract's signed, and that's when someone first mentions the client needs FedRAMP authorization on the hosting** — Discovering a mandatory certification requirement (Cyber Essentials, FedRAMP) after the contract is signed instead of during discovery, when it's too late to fast-track
- **The self-assessed Cyber Essentials certificate gets submitted, for a contract that specifically required the Plus tier's independent verification** — Treating Cyber Essentials and Cyber Essentials Plus as interchangeable when a contract specifically requires the Plus tier's independent verification
- **The cloud provider's SOC 2 report gets cited as proof of FedRAMP compliance, which it isn't** — Assuming a commercial cloud provider's general SOC 2 or ISO 27001 certification satisfies FedRAMP or NIST 800-53 requirements, when they are separate, non-equivalent programs
- **The government-sector quote has one line for "development," with no separate line for certification, hosting, or audit lead time** — Quoting a regulated-sector project without pricing in the certification, hosting, and audit lead time as explicit, visible line items

## Further Reading
- [NCSC Cyber Essentials](https://www.ncsc.gov.uk/cyberessentials/overview) — official UK scheme overview and control requirements
- [NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) — the full federal control catalog
- [FedRAMP.gov](https://www.fedramp.gov/) — authorization process and marketplace of already-authorized cloud services
