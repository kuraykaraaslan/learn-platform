# 573. What Goes on the Tag: An Identifier, Not a Payload

## What It Is
Once a tag is going on the asset, someone has to decide what it says. The decision looks small and it is the hardest one in this course to reverse, because a tag is fixed to a physical object by an adhesive or a rivet and the fleet is out there before anyone reviews it. **A tag is written once and read for twenty years**, which is a different design problem from anything in a database.

The rule that follows from that lifetime is simple to state and constantly broken: **put an identifier on the tag, not data**. A model number, an install date, a capacity, a room name — every one of them is true today and will be wrong at some point, and none of them can be corrected without visiting the asset. The register is the place where facts about an asset live and are updated; the tag's only job is to say *which row*. Anything else on it is a copy that will diverge and be believed.

The interesting version of the argument is about URLs. Encoding `https://cmms.example.com/a/FAN-B2-01` instead of `FAN-B2-01` is attractive: any phone camera resolves it, no app is needed, and it works for a visitor. It is also a **coupling decision with a twenty-year horizon** — the domain, the path scheme, the hosting arrangement and the vendor all become properties of a physical label. Organisations that did this in 2010 have tags pointing at hostnames that no longer exist. The middle position, and the one worth defaulting to, is a URL whose path contains the bare identifier so that a scanner which cannot reach the network can still extract it, and a domain you are prepared to keep resolving for as long as the assets exist.

Two smaller decisions ride along. **Human readability**: the identifier should be printed in text next to the code, because codes get damaged and a person can still type what they can read — which is what makes Lesson 574's check digit worth having. And **what identity to use**: the functional location, not the serial number. A pump is replaced and the functional location stays; the serial goes with the old pump. Lesson 506 argues this fully, and it is the reason a tag saying `SN-FAN-7741` becomes a lie the first time the fan is swapped.

```quiz
- q: "Why should a tag carry an identifier rather than facts about the asset?"
  anchor: "A tag is written once and read for twenty years"
  options:
    - text: "Because facts take more space than an identifier"
      correct: false
      why: "Space is a constraint (Lesson 575) but not the reason."
    - text: "Because facts change and cannot be corrected without visiting the asset, while the register can be updated freely"
      correct: true
      why: "Anything printed on the tag is a copy that will diverge and still be believed."
    - text: "Because scanners cannot decode long payloads"
      correct: false
      why: "They can. The problem is the payload's accuracy over the tag's lifetime."

- q: "What is the real cost of encoding a full URL on the tag?"
  anchor: "a **coupling decision with a twenty-year horizon**"
  options:
    - text: "The code becomes physically larger"
      correct: false
      why: "It does, and that is a secondary concern next to the coupling."
    - text: "The domain, path scheme, hosting and vendor become properties of a physical label you cannot edit"
      correct: true
      why: "Tags printed a decade ago point at hostnames that no longer resolve."
    - text: "Phones cannot open URLs without an app"
      correct: false
      why: "They can, which is exactly the attraction."

- q: "Why should a tag carry the functional location rather than the serial number?"
  anchor: "the functional location stays; the serial goes with the old pump"
  options:
    - text: "Serial numbers are longer and harder to encode"
      correct: false
      why: "Length is incidental; the problem is what happens when the equipment is replaced."
    - text: "The functional location survives replacement of the equipment; the serial leaves with the old unit"
      correct: true
      why: "A tag carrying a serial becomes a lie the first time the asset is swapped (Lesson 506)."
    - text: "Serial numbers are assigned by the manufacturer and may repeat"
      correct: false
      why: "Repetition across manufacturers is a real problem, but not the one that matters here."
```

## Key Concepts
- **A tag is written once and read for twenty years** — a different design problem from a database field
- **Put an identifier on it, not data** — facts change and cannot be corrected without a site visit
- **The register holds the facts**; the tag says which row
- **A URL is a coupling decision** binding a domain, path scheme, host and vendor to a physical label
- **Middle position**: a URL whose path contains the bare identifier, on a domain you will keep resolving
- **Print the identifier in human-readable text too** — a damaged code can still be typed (Lesson 574)
- **Carry the functional location, not the serial** — the serial leaves with the replaced equipment (Lesson 506)

## Example Code
The decision, with the conditions under which each side is right:

```tradeoff
question: "Encode a bare identifier on the tag, or a resolvable URL?"
sides:
  - name: "Bare identifier"
    wins_when:
      - signal: "the tags will outlive at least one system migration, and nothing about the estate's future hosting, domain or vendor can be promised for the tag's physical lifetime"
      - signal: "everyone who scans them is using your own application, which already knows how to resolve an identifier against a local catalogue (Lesson 578)"
      - signal: "tag space is tight — a bare identifier is a fraction of the characters, which means a smaller code or more error correction in the same area (Lesson 575)"
      - signal: "the estate is being tagged once, at scale, and the cost of a decision that has to be reversed is a site visit per asset"
  - name: "Resolvable URL"
    wins_when:
      - signal: "people without your app have to get something useful from the tag — contractors, visiting engineers, a tenant reporting a fault from their own phone"
      - signal: "the organisation controls a domain it is prepared to keep resolving for as long as the assets exist, and can commit to redirecting rather than retiring the path scheme"
      - signal: "the path is structured so the bare identifier is extractable from it without a network, so an offline scanner degrades to the first option rather than failing"
      - signal: "the alternative in practice is no tag at all, because the organisation will not deploy an app to the people who need to scan"
```

Note what the second column's third bullet is doing: it converts the choice from either/or into a default. A URL ending in the identifier is a superset — an app can strip it, a browser can follow it — and the residual cost is the extra characters and the promise about the domain.

## When to Use
- Before the first tag is printed, since the decision is fixed in adhesive across the whole estate
- When choosing between the functional location and the serial, where Lesson 506's distinction decides it
- When a vendor's tagging scheme is offered, where the question is what happens to those tags when the vendor is replaced (Lesson 512)
- When re-tagging an estate, which is the only cheap moment to change the encoding (Lesson 580)
- When a code has to be readable by people outside your systems, which is what pushes toward a URL

## Common Mistakes
- **Printing the model, capacity or install date on the tag** — every one becomes wrong and none can be corrected remotely
- **Encoding a full URL with no identifier in the path** — an offline scanner gets a string it cannot resolve to anything
- **Binding a vendor's domain into the physical estate** — the tags outlive the contract
- **Omitting the human-readable text** — a damaged code becomes an unidentifiable asset rather than a typed one
- **Tagging with the serial number** — the tag lies the first time the equipment is replaced (Lesson 506)
- **Deciding this in the field** — tags printed in two schemes across one estate cost more than either scheme

## Further Reading
- [Lesson 506](/courses/asset-management-systems/asset-identity) — functional location versus serial number, and which one survives a replacement
- [Lesson 575](/courses/asset-identification/symbologies) — what the extra characters of a URL cost in physical tag area
- [Lesson 578](/courses/asset-identification/offline-resolution) — what a scanner does with the identifier when it cannot reach the network
- [Lesson 512](/courses/asset-management-systems/buying-vs-building-eam) — the vendor-lock argument, applied here to a label you cannot edit

```recall
- q: "State the rule for what a tag carries, and why."
  must:
    - "an identifier, not data about the asset"
    - "because the tag is written once and read for many years, and facts change"
    - "a fact printed on a tag cannot be corrected without visiting the asset, and will be believed while it is wrong"

- q: "What is the real cost of encoding a URL rather than a bare identifier?"
  must:
    - "it binds a domain, path scheme, host and vendor to a physical label for the tag's lifetime"
    - "tags printed years ago point at hostnames that no longer resolve"
    - "the middle position is a URL whose path contains the bare identifier, so an offline scanner can still extract it"

- q: "Why does the tag carry the functional location rather than the serial number?"
  must:
    - "the functional location survives replacement of the equipment"
    - "the serial number leaves with the unit that was replaced"
    - "so a tag carrying a serial becomes wrong the first time the asset is swapped"
```
