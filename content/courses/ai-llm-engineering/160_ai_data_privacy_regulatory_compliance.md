# 160. AI Data Privacy and Regulatory Compliance

## What It Is
Every call to a third-party model API is a data-sharing event with a named legal category: you are transmitting content to a sub-processor, and if that content includes personal data, KVKK, GDPR, CCPA, and a growing list of other regimes all have something specific to say about it before you're allowed to ship. This is easy to miss because the mechanics feel identical to calling any other internal API — same fetch, same JSON — but the party on the other end is now a separate legal entity processing your users' data under its own terms, and "we didn't think about it" is not a defense that survives a regulator's questions. The baseline obligations are concrete and checkable: your privacy policy must disclose AI processing, you need a signed Data Processing Agreement with the model provider, and you must apply data minimization — sending only the fields a feature actually needs, never a whole user record because it was convenient to serialize.

Data minimization has a direct engineering counterpart: PII filtering before the prompt is constructed. Treat name, email, phone, national ID, address, date of birth, IP address, session tokens, and any photo or recording of a person as PII by default, and strip or redact it from user-supplied content unless the feature specifically requires that field to function. When you do need to store AI output that was derived from a user's personal data — a generated summary, a classification, an extracted field — tag that stored record with the user ID, the same way you'd tag any other user-owned data, so it surfaces correctly in a data export and can be deleted on an erasure request. Special category data — health, biometric, political, religious, ethnic, or criminal-record information — carries a materially higher bar: do not send it to a model without explicit legal review regardless of how routine the feature seems, because the penalties for mishandling special categories are structured to be more severe across nearly every relevant regime.

The EU AI Act adds a second, independent axis on top of privacy law: a risk-based classification of the AI system itself, not just the data it touches. Unacceptable-risk uses (social scoring, real-time biometric surveillance, manipulation exploiting a vulnerable group) are prohibited outright — if a request maps to one of these, the answer is "we don't build this," full stop. High-risk uses (CV screening, credit scoring, medical triage, employment or education decisions) require a conformity assessment, a human oversight mechanism, decision logging, and registration in an EU database before deployment. Limited-risk uses — the category most product AI features fall into, especially any customer-facing chatbot or AI-generated content — carry a transparency obligation: the user must be told they're interacting with an AI system, and AI-generated content should be labeled as such. One detail that changes the calculus significantly: if you self-host an open-source model instead of calling a hosted API, you become the GPAI provider yourself, not just a deployer, which is a substantially heavier compliance burden than using Claude or another hosted API where the provider carries that role.

## Key Concepts
- **Third-party sub-processor relationship**: any user data sent to a model API is being processed by an external legal entity — this requires a signed DPA and privacy policy disclosure before production use
- **PII by default**: treat name, email, phone, national ID, address, DOB, IP, session tokens, and photos/recordings of people as PII unless proven otherwise; strip or redact before the content reaches a prompt
- **Data minimization**: send only the specific fields a feature needs, never a serialized user object "just in case" the model wants more context
- **Erasure and export linkage**: any AI output stored that was derived from a user's personal data must be tagged with that user's ID so it appears in exports and is deleted on request
- **Special category data requires explicit legal review**: health, biometric, political, religious, ethnic, and criminal-record data carry a higher bar and steeper penalties than general PII
- **EU AI Act risk tiers**: unacceptable (prohibited outright) → high (conformity assessment + registration) → limited (transparency disclosure) → minimal (no specific obligation)
- **Transparency obligation for limited-risk features**: any customer-facing chatbot or AI-generated content must disclose that AI is involved, in the UI, without requiring the user to dig for it
- **Self-hosting shifts your role**: hosting an open-source model yourself makes you the GPAI provider under the EU AI Act, not just a deployer — a materially heavier compliance burden than calling a hosted API

## Example Code
```typescript
// libs/ai/compliance/pii-filter.ts
const PII_PATTERNS: [RegExp, string][] = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]'],
  [/\b(\+?90|0)?[- ]?5\d{2}[- ]?\d{3}[- ]?\d{2}[- ]?\d{2}\b/g, '[PHONE]'],
  [/\b\d{11}\b/g, '[ID_NUMBER]'], // e.g. TC Kimlik No — adapt per jurisdiction
];

export function stripPII(text: string): string {
  return PII_PATTERNS.reduce((t, [pattern, placeholder]) => t.replace(pattern, placeholder), text);
}

// Storing AI output derived from PII — always linkable for erasure/export
async function saveAiSummary(userId: string, summary: string, model: string) {
  await db.aiSummary.create({
    data: { userId, content: summary, model, createdAt: new Date() }, // userId is mandatory, not optional
  });
}

// A minimal EU AI Act risk gate to run at feature-scoping time
interface AiFeatureRiskInput {
  influencesEmploymentCreditHealthOrEducation: boolean;
  isCustomerFacingChatOrGeneratesVisibleContent: boolean;
  targetsVulnerableGroupBehavior: boolean;
}

function classifyEuAiActRisk(input: AiFeatureRiskInput): 'unacceptable' | 'high' | 'limited' | 'minimal' {
  if (input.targetsVulnerableGroupBehavior) return 'unacceptable'; // do not build
  if (input.influencesEmploymentCreditHealthOrEducation) return 'high'; // conformity assessment required
  if (input.isCustomerFacingChatOrGeneratesVisibleContent) return 'limited'; // transparency disclosure required
  return 'minimal';
}
```

## When to Use
- At feature-scoping time for any AI feature that touches user-supplied or user-associated data — before the first prompt is written, not after
- Before sending any feature to production that will process data from EU, UK, or California-resident users
- Whenever storing AI-generated output that was derived even partially from personal data
- Before deciding to self-host an open-source model for a client or product with EU exposure — flag the heavier compliance role at scoping, not after build-out
- When a PM proposes a customer-facing chatbot or AI-generated content feature — the transparency disclosure requirement needs to be in the UI spec from day one

## Common Mistakes
- Sending a full database row or serialized user object to the model when the feature only needs one or two fields
- Shipping an AI feature to production without a signed DPA or without updating the privacy policy and data inventory
- Storing AI-generated content derived from PII without linking it to the user, breaking data export and erasure flows
- Treating the EU AI Act as identical to GDPR — it classifies the AI system's risk level independently of whether personal data is involved at all
- Assuming a hosted API and a self-hosted open-source model carry the same compliance role — self-hosting makes you the GPAI provider

## Further Reading
- EU AI Act (Regulation 2024/1689) — official text and the European Commission's phased enforcement timeline
- GDPR Article 28 (processor obligations) and Article 17 (right to erasure) — the core mechanics behind the DPA and deletion-cascade requirements
- [Anthropic Trust Center](https://trust.anthropic.com/) — confirm current data-use and sub-processor terms directly rather than relying on a summary
