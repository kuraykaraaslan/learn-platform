# 538. The Enclosure Is Part of the Product: IP Codes, Glands, Condensation

## What It Is
A sensor node that works on the bench and fails in the field usually fails for a physical reason, and the enclosure is where those reasons live. The box is not packaging around a finished product — it is part of the product, and its failures are as real as a firmware bug and much harder to patch remotely.

**IP codes** describe how well an enclosure keeps solids and water out. An IP rating is two digits — `IP65`, `IP67` — defined by **IEC 60529** (the edition matters; cite it). The first digit is protection against solid objects and dust, on a 0–6 scale, where 5 means "dust protected" and 6 means "dust tight". The second digit is protection against water, on a 0–9 scale: 4 is splashing, 5 is jets, 6 is powerful jets, 7 is temporary immersion, 8 is continuous immersion. `IP65` and `IP67` are common targets, and note the second digit is not cumulative in the obvious way — an IP67 (immersion) enclosure is not automatically IP65 (jets), because the sealing that survives a static dunk can fail under a directed jet. And **IP is not NEMA**: the American NEMA enclosure ratings cover things IP does not (corrosion, ice, gasketing detail) and do not map one-to-one, which is a frequent purchasing-specification error.

**Cable glands** are where sealed enclosures leak. Every wire entering the box is a hole, and the gland is the fitting that seals around the cable. It has to match the cable's outside diameter — a gland sized for a 6 mm cable does not seal a 4 mm one — and unused entries need blanking plugs, not tape. A cable that moves or is pulled needs strain relief so the motion is not transmitted to the gland seal or the internal joint.

**Condensation** is the failure that defeats a perfectly sealed box. Seal warm humid air inside an enclosure, let the enclosure cool overnight, and the water vapour condenses on the coldest surface — often the circuit board. A fully sealed enclosure with no way for that moisture to leave will corrode from the inside. The countermeasures are a **breather vent** (a membrane that passes water vapour but not liquid water or dust, which lets the box equalise without flooding), assembling in dry conditions, and sometimes a desiccant pack with a service interval.

```quiz
- q: "A purchasing spec asks for 'IP67 or NEMA 4X, whichever the vendor offers'. What is wrong with this?"
  anchor: "IP is not NEMA"
  options:
    - text: "Nothing — they are equivalent ratings from different regions"
      correct: false
      why: "They are not equivalent. NEMA covers corrosion, ice and construction details IP does not, and there is no exact mapping."
    - text: "IP and NEMA do not map one-to-one; 'whichever' lets a vendor supply an enclosure that meets neither of the properties you actually needed"
      correct: true
      why: "Specify the environmental exposures (dust, jets, immersion, corrosion) and the standard, not an either/or between two non-equivalent codes."
    - text: "IP67 is always stricter than NEMA 4X, so the spec is redundant"
      correct: false
      why: "Neither is uniformly stricter — they measure partly different things."

- q: "A sealed IP67 enclosure with electronics inside is corroding from the inside after a few months outdoors. It has never been submerged. Why?"
  anchor: "the water vapour condenses on the coldest surface"
  options:
    - text: "The IP67 seal has failed and water is getting in"
      correct: false
      why: "Possible, but 'never submerged' and 'corroding from the inside' points at moisture that was sealed in, not water coming in."
    - text: "Humid air sealed in at assembly condenses on the board each time the box cools, and a fully sealed enclosure gives that water no way out"
      correct: true
      why: "A breather vent, dry assembly and sometimes a desiccant are the countermeasures. A perfect seal makes this worse, not better."
    - text: "The electronics are running too hot and outgassing"
      correct: false
      why: "Outgassing is a minor effect. The corrosion pattern and the seasonality point at condensation."
```

## Key Concepts
- **The enclosure is part of the product** — its failures are physical, real, and not remotely patchable
- **IP codes (IEC 60529)** — two digits: solids/dust (0–6), water (0–9); cite the edition
- **First digit 5 = dust protected, 6 = dust tight**; second digit 4 = splash, 5–6 = jets, 7 = temporary immersion, 8 = continuous
- **IP67 does not imply IP65** — immersion sealing can fail under a directed jet
- **IP is not NEMA** — different properties, no one-to-one mapping; a common spec error
- **Cable glands seal each wire entry** — match the cable diameter, blank unused entries, add strain relief
- **Condensation defeats a perfect seal** — sealed-in humid air condenses on the board when the box cools
- **Countermeasures**: a breather vent (passes vapour, not liquid or dust), dry assembly, sometimes a desiccant with a service interval

## Example Code
No runtime — the artefact is an enclosure specification, read and checked against the deployment:

```text
Enclosure requirement — outdoor pole-mounted sensor node
--------------------------------------------------------
Environment      : outdoor, unshaded, coastal (salt), -20 to +55 degC
                   wind-driven rain; hosed down during pole maintenance
Ingress target   : IP66 minimum (dust tight + powerful jets)
                   NOT specified as "IP66 or NEMA 4X" — exposures listed instead
Standard         : IEC 60529:1989+AMD1:1999+AMD2:2013
Corrosion        : salt-mist exposure — enclosure and every external fastener
                   in 316 stainless or a rated polymer; NEMA 4X-style corrosion
                   requirement stated explicitly because IP does not cover it
Cable entries    : 2x M16 gland for 5-9 mm cable (rated to the enclosure IP)
                   1x M16 blanking plug (spare entry)
                   strain relief on both cables, 8 mm free play at the gland
Condensation     : breather vent (Gore or equivalent membrane), one per box
                   assembled and sealed in <40% RH conditions
                   desiccant sachet, replaced at each 12-month service visit
UV               : polymer enclosures UV-stabilised and rated for the install life
```

Every line is a physical failure that has happened to a field deployment: a gland sized for the wrong cable, a spare entry taped over, a stainless enclosure with plated-steel screws that rusted, a sealed box that grew water inside.

## When to Use
- At design start, not at the end — the enclosure, glands and venting are chosen with the electronics, not fitted around them
- When writing a purchasing specification — list the environmental exposures and the standard edition, not a code either/or
- When a fielded unit fails and the board looks corroded or wet — condensation and gland sealing before firmware
- When cables will move or be pulled — strain relief, sized so the motion never reaches the seal or the joint
- When the deployment is coastal, industrial or high-UV — IP does not cover salt, chemicals or sunlight; state those separately

## Common Mistakes
- **Treating the enclosure as an afterthought** — it is a source of field failures equal to the electronics
- **Specifying "IPxx or NEMA yy"** — the two are not equivalent and the vendor will pick the cheaper interpretation
- **Assuming a higher second IP digit covers the lower ones** — an immersion seal is not automatically a jet seal
- **Using a gland that does not match the cable diameter** — it will not seal, and neither will tape over a spare hole
- **Sealing the box perfectly with humid air inside** — with no breather, the condensation has nowhere to go and the board corrodes
- **Ignoring corrosion and UV** — IP60000-series ratings say nothing about salt mist, chemicals, or a polymer going brittle in the sun

## Further Reading
- [IEC 60529 — Degrees of protection provided by enclosures (IP Code)](https://webstore.iec.ch/publication/2452) — the standard, its two-digit structure and the test conditions; catalogue reference, the clause text is paid
- [NEMA 250 / enclosure type ratings overview](https://www.nema.org/standards/view/enclosures-for-electrical-equipment-1000-volts-maximum) — what NEMA covers that IP does not, and why the two do not translate
- [W. L. Gore: Why enclosures need to breathe (application note)](https://www.gore.com/products/gore-protective-vents) — the condensation mechanism and the membrane vent that addresses it

```recall
- q: "What does an IP code describe, and what are the two digits?"
  must:
    - "how well an enclosure keeps solids and water out, per IEC 60529 (cite the edition)"
    - "first digit: solids/dust, 0–6 (5 = dust protected, 6 = dust tight)"
    - "second digit: water, 0–9 (4 splash, 5–6 jets, 7 temporary immersion, 8 continuous)"

- q: "Why is 'IP67 or NEMA 4X' a bad purchasing specification?"
  must:
    - "IP and NEMA measure partly different things and do not map one-to-one"
    - "NEMA covers corrosion, ice and construction detail that IP does not"
    - "specify the environmental exposures and the standard, not an either/or of two non-equivalent codes"

- q: "Why does a perfectly sealed enclosure sometimes corrode from the inside?"
  must:
    - "humid air sealed in at assembly condenses on the coldest surface (often the board) when the box cools"
    - "a fully sealed box gives that moisture no way out"
    - "countermeasures: a breather vent that passes vapour but not liquid or dust, dry assembly, a desiccant with a service interval"
```
