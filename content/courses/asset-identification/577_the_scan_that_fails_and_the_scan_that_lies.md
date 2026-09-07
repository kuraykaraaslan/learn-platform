# 577. The Scan That Fails and the Scan That Lies

## What It Is
Two things can go wrong at the moment of reading, and only one of them is a problem you will hear about. A **scan that fails** produces nothing: the code is damaged, the light is wrong, the angle is bad, the lens is dirty. It is annoying, it is visible, and the technician does something about it — usually by typing the identifier instead, which is why Lesson 574's check digit exists.

A **scan that lies** produces a valid identifier for the wrong asset, and nobody notices. The label from the unit next to it was picked up in the frame. A radio reader energised the tag on the shelf behind (Lesson 576). A spare part still carries the tag of the assembly it was pulled from. The scan succeeded, the code was well-formed, the check digit was correct, and the record is now attached to another machine. **Every mechanism in this course so far protects against the first failure and none of them protects against the second.**

What does protect against it is a set of cheap checks at the moment of the scan, all of which run offline on data the device already has. **Expected shape**: does the identifier match the prefix pattern for the kind of work being done — a technician on a fan survey scanning something whose tag begins `DB-` has scanned a distribution board. **Location plausibility**: is this asset in the building, floor or system the session is for? A register with a hierarchy makes that a parent lookup (Lesson 505). **Recent history**: was this asset already scanned two minutes ago, or eleven times today? And **change plausibility**: does the reading being recorded make sense against the asset's last known state (Lesson 507)?

None of those is conclusive and that is not their job. They are cheap, they run with no network, and each one converts a silent wrong attribution into a question on the screen while the technician is still standing in front of the machine — which is the only moment when the answer is free. **After that moment the cost of finding the error rises by orders of magnitude**, which is Lesson 579's subject.

One boundary: server-side validation of a submitted record is Lesson 503's, and it is not a substitute. By the time the record reaches a server the technician is in another building, and the server cannot see what they were standing in front of.

```quiz
- q: "Why is a failed scan the less serious of the two failure modes?"
  anchor: "It is annoying, it is visible"
  options:
    - text: "Because it happens less often"
      correct: false
      why: "It happens far more often — it is just self-announcing."
    - text: "Because it produces nothing, so somebody notices and acts on it"
      correct: true
      why: "Usually by typing the identifier, which is why the check digit matters."
    - text: "Because the app retries automatically"
      correct: false
      why: "Retrying a damaged code produces the same nothing."

- q: "Which of these checks catches a scan of the tag on the unit next door?"
  anchor: "is this asset in the building, floor or system the session is for"
  options:
    - text: "The check digit, since a neighbouring tag has a different check"
      correct: false
      why: "The neighbouring tag is a real identifier with a correct check digit."
    - text: "Location plausibility — whether the asset belongs to the building, floor or system this session is about"
      correct: true
      why: "A register with a hierarchy makes it a parent lookup, offline (Lesson 505)."
    - text: "Nothing at the moment of the scan; it can only be found later"
      correct: false
      why: "Later is Lesson 579 and is far more expensive. Several cheap checks apply now."

- q: "Why must these checks run on the device rather than on the server?"
  anchor: "the only moment when the answer is free"
  options:
    - text: "Because the server may be unavailable"
      correct: false
      why: "It often is, but that is not the main reason."
    - text: "Because only at the moment of the scan is the technician standing in front of the asset and able to resolve it"
      correct: true
      why: "By the time a record reaches a server they are in another building."
    - text: "Because server validation is slower"
      correct: false
      why: "Latency is irrelevant next to the person having left the site."
```

## Key Concepts
- **A scan that fails is visible** and gets handled — usually by typing, which needs a check digit (Lesson 574)
- **A scan that lies succeeds** and attaches the record to another asset, silently
- **Sources**: the neighbouring label in frame, an RF tag in range (Lesson 576), a part carrying its old assembly's tag
- **Four cheap offline checks**: expected shape, location plausibility, recent history, change plausibility
- **None is conclusive** — their job is to raise a question while the technician is still there
- **The moment of the scan is the only free moment** to resolve it (Lesson 579 is the expensive alternative)
- **Server-side validation is Lesson 503's** and cannot see what the technician was standing in front of

## Example Code
The four checks, run over one technician's session:

```typescript run
/** A fan survey on Block B, level 2. Everything here is available offline:
 *  the session's context and a slice of the register the device already holds
 *  (Lesson 578). */
type Asset = { tag: string; parent: string; assetClass: string };
type Scan = { tag: string; atMinute: number };

const localRegister: Record<string, Asset> = {
  'FAN-B2-01': { tag: 'FAN-B2-01', parent: 'AHU-B2-01', assetClass: 'component' },
  'FAN-B2-02': { tag: 'FAN-B2-02', parent: 'AHU-B2-02', assetClass: 'component' },
  'DB-B2-L2': { tag: 'DB-B2-L2', parent: 'SYS-POWER-B2', assetClass: 'component' },
  'PMP-1001A': { tag: 'PMP-1001A', parent: 'SYS-WATER', assetClass: 'component' },
};

const session = { expectedPrefix: 'FAN-', expectedSystems: ['AHU-B2-01', 'AHU-B2-02'] };

const scans: Scan[] = [
  { tag: 'FAN-B2-01', atMinute: 0 },
  { tag: 'DB-B2-L2', atMinute: 4 }, // wrong kind of asset for this survey
  { tag: 'FAN-B2-02', atMinute: 9 },
  { tag: 'FAN-B2-02', atMinute: 10 }, // scanned again, one minute later
  { tag: 'PMP-1001A', atMinute: 15 }, // real asset, different system entirely
  { tag: 'FAN-B2-99', atMinute: 21 }, // well-formed, not in the register
];

const seen = new Map<string, number>();

console.log('scan        shape   location   recent   known    verdict');
for (const scan of scans) {
  const asset = localRegister[scan.tag];
  const shapeOk = scan.tag.startsWith(session.expectedPrefix);
  const knownOk = asset !== undefined;
  const locationOk = knownOk && session.expectedSystems.includes(asset.parent);
  const last = seen.get(scan.tag);
  const recentOk = last === undefined || scan.atMinute - last > 5;
  seen.set(scan.tag, scan.atMinute);

  const flags = [shapeOk, locationOk, recentOk, knownOk];
  const verdict = flags.every(Boolean) ? 'accept' : 'ASK THE TECHNICIAN';
  const mark = (b: boolean) => (b ? ' ok ' : 'FAIL');
  console.log(
    `${scan.tag.padEnd(11)} ${mark(shapeOk)}    ${mark(locationOk)}     ${mark(recentOk)}    ${mark(knownOk)}    ${verdict}`
  );
}

console.log('');
console.log('Every failing row is a real identifier or a well-formed one -- none of them');
console.log('would be caught by a check digit, and none of them would be rejected by a server');
console.log('that only sees the finished record. The distribution board and the pump are');
console.log('assets somebody is entitled to scan, just not on this survey; the repeat is');
console.log('probably a double-press and is worth one confirmation rather than two records.');
console.log('');
console.log('Note that none of these is an error. They are questions, asked while the person');
console.log('who can answer them is still in the room.');
```

## When to Use
- In every field app at the moment of the scan, since all four checks are local and cheap
- When a survey has a known scope — a system, a floor, an asset class — which makes location and shape checkable
- When an RF reader is in use, where reading without aiming makes the wrong-tag case routine (Lesson 576)
- When the same asset can legitimately be scanned twice, where the check is a confirmation rather than a rejection
- When designing the session model, since these checks need the session to know what it is for

## Common Mistakes
- **Protecting only against failed scans** — the check digit and retry logic do nothing for a successful wrong read
- **Treating a check failure as an error** — it is a question; blocking legitimate work trains people to bypass it
- **Deferring the checks to the server** — by then the technician is somewhere else (Lesson 503)
- **Skipping the "already scanned" check** — a double-press produces two records and no evidence of which is real
- **Assuming a valid check digit means the right asset** — it means a well-formed identifier, nothing more (Lesson 574)
- **Not giving the session a scope** — with no expected system or asset class, two of the four checks cannot run

## Further Reading
- [Lesson 503](/courses/field-data-collection/validating-field-data) — server-side validation of a submitted record, and why it cannot replace these checks
- [Lesson 505](/courses/asset-management-systems/asset-hierarchies) — the parent relationship that makes location plausibility a local lookup
- [Lesson 576](/courses/asset-identification/rfid-and-nfc) — reading without aiming, which turns these checks from good practice into a requirement
- [Lesson 579](/courses/asset-identification/finding-the-mis-scan-after-the-fact) — what it costs to find the same error later
- [Lesson 574](/courses/asset-identification/check-digits) — the check that makes the typed fallback safe, and what it still cannot see

```recall
- q: "What are the two failure modes at the moment of reading?"
  must:
    - "a scan that fails and produces nothing -- visible, and handled by typing the identifier"
    - "a scan that lies and produces a valid identifier for the wrong asset -- silent"
    - "every mechanism up to this point protects against the first and none against the second"

- q: "Name the four cheap checks available at the moment of the scan."
  must:
    - "expected shape -- does the identifier match the pattern for this kind of work"
    - "location plausibility -- is the asset in the building, floor or system this session is for"
    - "recent history -- was it already scanned moments ago; and change plausibility against its last known state"

- q: "Why must these checks run on the device rather than the server?"
  must:
    - "the moment of the scan is the only time the technician is in front of the asset"
    - "a question asked then is free to answer; the same question later needs another site visit"
    - "and the checks need no network, so they work in the conditions field capture actually happens in"
```
