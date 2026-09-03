# 521. Sharing Data Without Losing Control: Licences, Redaction, Rate Limits

## What It Is
Once infrastructure data leaves your systems — to a partner, a regulator, an open portal — you have given up direct control of it, and the only levers left are the ones you built in before it left: the **licence** it carries, the **redaction** applied to it, and the **rate limit** and **access model** on the feed. This lesson is about the technical consequences of those choices. It is not legal advice; licence text is quoted only by its canonical URL, and the decision of which licence applies is not one a developer makes alone.

**Licence families have technical implications regardless of the legal detail.** A permissive open licence (public-domain-style, or attribution-only) means consumers can redistribute and combine your data freely — so you must assume any value you publish is permanent and public. A share-alike licence means derivatives must carry the same licence, which affects who will actually use the feed. A restricted or bilateral licence means the data is shared with named parties under terms — which means the feed needs authentication and an audit of who pulled what, because "shared with A" is only true if B cannot get it.

**Redaction is a transformation applied at the boundary** — the same boundary the quality gate sits on (Lesson 519) — **and it has to be irreversible in the published artefact.** Removing a column is easy; the traps are the ones that leak through the back: a precise coordinate that identifies a private connection, a meter id that correlates to a single household, a timestamp pattern that reveals occupancy, an aggregate over a small enough group that individuals are recoverable. Redaction is designed against a stated re-identification risk, not applied as a generic "remove names" pass.

**Rate limits and access models are what keep "public" from meaning "bulk-harvestable in a way you did not intend."** A feed meant for near-real-time dashboards and a feed meant for bulk research download are different products with different limits, and offering only one forces the other use case into scraping. The limit is also a load-shedding control: a public endpoint with no limit is a denial-of-service target by default.

## Key Concepts
- **Control ends when the data leaves** — the levers are licence, redaction, rate limit and access model, all set beforehand
- **This is technical consequence, not legal advice** — licences by canonical URL only; the choice is not the developer's alone
- **Permissive open licence** → assume every published value is permanent and public
- **Share-alike licence** → derivatives inherit the licence, which shapes who adopts the feed
- **Restricted / bilateral licence** → needs authentication and a pull audit, or "shared with A only" is not true
- **Redaction is an irreversible boundary transformation** designed against a stated re-identification risk
- **Redaction back-channels**: precise coordinates, correlatable ids, timing patterns, small-group aggregates
- **Rate limits separate feed products** — real-time vs bulk — and are also load-shedding and DoS protection

## Example Code
The shape of a publication policy as data — what each consumer tier gets, and what the boundary transformation does:

```typescript
/** A consumer tier and the feed product it receives. The policy is data so it
 *  can be reviewed and diffed, not scattered through export code. */
type FeedTier = {
  tier: 'public-open' | 'partner' | 'regulator';
  /** Canonical URL of the licence this tier's data is published under. */
  licenceUrl: string;
  auth: 'none' | 'api-key' | 'mutual-tls';
  /** Requests per minute; bulk download is a separate, slower-limited path. */
  rateLimitPerMin: number;
  /** Which redactions the boundary applies before this tier sees the data. */
  redactions: Redaction[];
};

type Redaction =
  | { field: 'location'; action: 'round'; toMetres: number }   // coordinate precision
  | { field: 'meterId'; action: 'pseudonymise' }               // stable hash, not the real id
  | { field: 'household'; action: 'drop' }
  | { field: 'value'; action: 'suppress-small-group'; minGroup: number }; // k-anonymity-style

const POLICY: FeedTier[] = [
  {
    tier: 'public-open',
    licenceUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
    auth: 'none',
    rateLimitPerMin: 60,
    redactions: [
      { field: 'location', action: 'round', toMetres: 100 },
      { field: 'meterId', action: 'pseudonymise' },
      { field: 'household', action: 'drop' },
      { field: 'value', action: 'suppress-small-group', minGroup: 5 },
    ],
  },
  {
    tier: 'regulator',
    licenceUrl: 'https://example.org/bilateral-data-sharing-agreement', // placeholder — a real agreement URL
    auth: 'mutual-tls',
    rateLimitPerMin: 600,
    redactions: [{ field: 'location', action: 'round', toMetres: 10 }],
  },
];
```

```typescript
/** Applying one redaction. The published record must not carry enough to
 *  reverse it — a rounded coordinate keeps no fractional remainder, a
 *  pseudonym is a keyed hash whose key never ships. */
function redactLocation(lat: number, lon: number, toMetres: number): { lat: number; lon: number } {
  // ~111_320 m per degree of latitude; longitude scaled by cos(lat).
  const dLat = toMetres / 111_320;
  const dLon = toMetres / (111_320 * Math.cos((lat * Math.PI) / 180));
  return {
    lat: Math.round(lat / dLat) * dLat,
    lon: Math.round(lon / dLon) * dLon,
  };
}
```

## When to Use
- Before publishing any infrastructure data outside the organisation — the licence, redaction and limits are part of the feed's first release, not a later hardening pass
- When a partner or regulator asks for a data share — to establish the access model and audit before the first export, not after
- When a redaction is proposed — to check it against a concrete re-identification scenario rather than accepting a generic pass
- When a public endpoint is being scraped — the fix is usually a proper bulk-download product with its own limit, not a block

## Common Mistakes
- **Publishing under a permissive licence without accepting permanence** — every value is now public forever, including the ones that turn out to be sensitive
- **Generic redaction** — "remove names" leaves the coordinate, the id correlation and the timing pattern that re-identify anyway
- **Reversible redaction in the published artefact** — a rounded value that kept its remainder, or a pseudonym whose mapping table also shipped
- **One feed for every use case** — real-time consumers and bulk researchers need different products, and forcing both through one endpoint invites scraping
- **No rate limit on a public endpoint** — it is a denial-of-service target and a cost risk by default
- **"Shared with the regulator" with no authentication** — if anyone can pull it, it is a public feed with extra steps

## Further Reading
- [Open Data Commons licences (PDDL, ODC-By, ODbL)](https://opendatacommons.org/licenses/) — the canonical text of the data-specific licence family and the technical obligations each imposes
- [Creative Commons licence chooser](https://creativecommons.org/choose/) — the general-content licences, their compatibility, and what share-alike means for derivatives
- [UK Anonymisation Network (UKAN) — the Anonymisation Decision-Making Framework](https://ukanon.net/framework/) — a structured method for designing redaction against a stated re-identification risk

<!-- This lesson is on scripts/stamp-verified.ts's HARM_DENYLIST: licence,
redaction and data-sharing is legal-adjacent content, so no exercises open on
it until an expert review. It carries no quiz and no recall by design, and
states technical consequences only — never legal interpretation. -->
