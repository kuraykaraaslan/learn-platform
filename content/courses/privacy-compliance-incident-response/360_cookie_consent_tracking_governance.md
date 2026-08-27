# 360. Cookie Consent & Tracking Governance

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Security_and_Compliance_Rules material to build out the Privacy, Compliance & Incident Response course; no existing coverage data for your own practice.

## What It Is
Tracking technology creates compliance risk even on the simplest marketing site, and the risk isn't really about cookies as a technology — it's about what a script does once it loads: what data it collects, whether it identifies a person, and whether that person had a genuine choice before it ran. The first discipline is separating tracking into categories with different defaults: strictly necessary (session cookies, CSRF tokens — allowed without consent because the app cannot function without them), functional (UI preferences — generally fine to document rather than gate), analytics (page views, heatmaps — usually requires a consent decision depending on jurisdiction), marketing (ad pixels, retargeting — requires explicit opt-in almost everywhere), and third-party embeds (maps, video, chat widgets — each one needs its own data-sharing assessment since embedding someone else's script means their tracking rides along with it).

The jurisdictions differ sharply on the consent *model*, and this is the detail most implementations get wrong by defaulting to whatever a tutorial showed them. The EU, UK, and Turkey all require opt-in consent for non-essential tracking — the script must not fire until the user actively agrees — and require a "Reject all" button with the same visual prominence as "Accept all," a requirement the EU's top court (CJEU, in the Planet49 case) and the UK's ICO both enforce explicitly; a banner that makes "Accept" a bright button and hides "Reject" in a text link fails this even if a reject option technically exists. The US runs the opposite model: no federal opt-in requirement, but California and a growing list of states require an opt-out mechanism — a "Do Not Sell or Share My Personal Information" link — because their laws define "sale" broadly enough to include ordinary data-sharing with ad or analytics vendors in exchange for a service, not just a literal financial transaction. California additionally requires detecting and honoring the Global Privacy Control browser signal as a valid opt-out, which most implementations skip because it happens silently in the browser rather than through a visible UI action.

Analytics minimization is a second layer on top of consent: even with valid consent, prefer configurations that don't store full IP addresses, don't record sensitive form field values, and disable session replay on authenticated or otherwise sensitive pages by default — consent to be tracked is not the same as consent to have every keystroke on a billing page recorded. A useful edge case worth knowing: some edge-level analytics providers (Cloudflare Analytics is the common example) collect aggregate traffic data with no cookies and no personal-data storage under most interpretations, and are treated as acceptable without a consent banner in most jurisdictions — a genuinely different category from Google Analytics 4, which requires a consent banner in the EU/UK/Turkey regardless of IP-anonymization settings.

## Key Concepts
- **Cookie/tracking categories**: strictly necessary, functional, analytics, marketing, third-party embedded — each with a different default consent requirement
- **Opt-in vs. opt-out models**: EU/UK/TR require opt-in (script doesn't fire until consent given); US state laws (CCPA/CPRA and similar) use opt-out via a "Do Not Sell" mechanism
- **"Reject all" prominence rule**: EU (CJEU Planet49) and UK (ICO) both require "Reject all" to have the same visual weight as "Accept all" — a small text-link reject option fails this
- **Global Privacy Control (GPC)**: a browser-level opt-out signal that California mandates honoring automatically — distinct from a manual "Do Not Sell" click
- **Consent state persistence**: recorded consent must be honored on return visits and be revocable, not re-asked or silently ignored every session
- **Analytics minimization**: preferring settings that avoid full IP storage, avoid recording sensitive form fields, and disable session replay on authenticated/sensitive pages by default, independent of whether consent was given
- **Tracking inventory**: a documented list — provider, purpose, data collected, category, whether it loads before consent, who approved it — required before any script ships
- **Edge-analytics exception**: cookieless, aggregate edge analytics (e.g., Cloudflare Analytics) is generally acceptable without a consent banner, unlike cookie-based tools like GA4

## Example Code
```typescript
// Consent-gated script loader: nothing non-essential fires until the user
// has made a choice, and California's GPC signal is honored automatically
// without requiring a manual click.

type ConsentCategory = "necessary" | "functional" | "analytics" | "marketing";
type ConsentState = Record<ConsentCategory, boolean>;

function readGPCSignal(): boolean {
  // navigator.globalPrivacyControl is set by GPC-supporting browsers/extensions
  return (navigator as any).globalPrivacyControl === true;
}

function getStoredConsent(): ConsentState | null {
  const raw = localStorage.getItem("consent_state");
  return raw ? JSON.parse(raw) : null;
}

function resolveInitialConsent(): ConsentState {
  const stored = getStoredConsent();
  if (stored) return stored;

  // No stored choice yet: GPC signal counts as an opt-out request for
  // California visitors even before the banner is interacted with.
  const gpcOptOut = readGPCSignal();
  return {
    necessary: true, // always on — required for the app to function
    functional: false,
    analytics: !gpcOptOut,
    marketing: false, // marketing always defaults OFF regardless of GPC/region
  };
}

function loadScriptIfConsented(category: ConsentCategory, consent: ConsentState, src: string) {
  if (!consent[category]) return; // never inject the tag if consent isn't granted
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
}

function applyConsent(consent: ConsentState) {
  localStorage.setItem("consent_state", JSON.stringify(consent));
  loadScriptIfConsented("analytics", consent, "https://analytics.example.com/ga4.js");
  loadScriptIfConsented("marketing", consent, "https://ads.example.com/pixel.js");
}

// Banner "Reject all" and "Accept all" must call this with equal ease —
// no extra clicks, no nested menu, for the reject path.
document.getElementById("reject-all")?.addEventListener("click", () =>
  applyConsent({ necessary: true, functional: false, analytics: false, marketing: false })
);
document.getElementById("accept-all")?.addEventListener("click", () =>
  applyConsent({ necessary: true, functional: true, analytics: true, marketing: true })
);
```

## When to Use
- Before adding any analytics, advertising pixel, or third-party embed to a site or app — document it in the tracking inventory first
- When launching to a new region (first EU/UK/TR traffic, first California traffic) — the consent model itself needs to be reviewed, not just translated
- When a marketing or growth team wants to add a new tag manager script — verify it fires only after consent, not by default
- During a cookie/privacy audit or before a client's legal review — the tracking inventory is the artifact requested
- When choosing between a cookie-based analytics tool and a cookieless edge-analytics alternative for basic traffic reporting

## Common Mistakes
- Shipping a consent banner where "Accept all" is a prominent button and "Reject" is a small text link or buried in a preferences submenu
- Loading Google Analytics or ad pixels before the user has made a consent choice, on the assumption that IP anonymization alone makes it exempt
- Ignoring the Global Privacy Control signal because it doesn't correspond to a visible UI click, when California treats it as a mandatory opt-out
- Treating "we added a cookie banner" as proof of compliance without checking whether the underlying consent *model* (opt-in vs. opt-out) matches the visitor's jurisdiction

## Further Reading
- [ICO — Guidance on the Use of Cookies and Similar Technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/)
- [CJEU — Planet49 Judgment (C-673/17)](https://curia.europa.eu/juris/liste.jsf?num=C-673/17) — the ruling establishing that pre-ticked consent boxes are invalid under EU law
- [Global Privacy Control — globalprivacycontrol.org](https://globalprivacycontrol.org/) — the technical specification California requires sites to honor
