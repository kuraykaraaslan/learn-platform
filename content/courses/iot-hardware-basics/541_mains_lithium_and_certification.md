# 541. Mains, Lithium, and Certification: Where an Engineer Stops

## What It Is
This lesson is a boundary, not a how-to. Everything before it in this course is low-voltage, low-energy work a software engineer can reasonably learn to do and verify. Three things are not: mains-voltage wiring, lithium-cell charging and pack design, and the certification a product must pass before it is sold. Getting any of them wrong does not produce a bug — it produces a fire, an explosion, or an electrocution, and the person who gets hurt is often not the engineer. So there are **no circuit diagrams, no wiring instructions, no charger designs and no cell-balancing schemes in this lesson.** What it teaches is which work belongs to whom, and when a project has crossed a line that needs a different kind of person.

**Mains voltage** (the 120 V or 230 V AC from a wall socket) is lethal on contact and starts fires through bad connections. Anything that connects to it — a power supply, a relay switching a mains load, an enclosure with a mains entry — is work for a **licensed electrician or a qualified power-electronics engineer**, done to the local electrical code, and in a product it is a certified module or supply that someone else has taken responsibility for. The software engineer's job is to stay on the low-voltage side of an isolation barrier that a qualified person designed and rated.

**Lithium cells** (Li-ion and Li-polymer) store a lot of energy in a small space and fail violently when abused: overcharged, over-discharged, shorted, punctured, or charged below freezing. A safe lithium-powered product uses a **protection circuit and a charger designed and tested by people who do this specifically**, plus a cell from a reputable manufacturer with its own protection, plus a mechanical design that cannot crush or puncture the cell. Designing the charge circuit or the battery-management system yourself, or using unbranded cells, is how a product ends up on a recall list. The boundary: choose a pre-made, protected battery solution; do not design the pack.

**Certification** is the set of tests a product must pass before it can legally be sold, and it is not optional or a formality. Radio emissions (FCC Part 15 in the US, the RED in the EU), electrical safety, and — for anything mains-connected or battery-powered — product-safety standards, are checked by an accredited **test laboratory**. A pre-certified radio module (Lesson 539) carries part of this; the finished product still needs its own testing, and changing the antenna or the enclosure can invalidate what the module gave you. Certification takes months and costs real money, and it is the item most often left off a project schedule.

## Key Concepts
- **This lesson is a boundary** — it contains no circuit diagrams, wiring instructions, charger designs or balancing schemes, on purpose
- **The three things past the line**: mains-voltage wiring, lithium charging and pack design, product certification
- **Wrong here is an injury, not a bug** — and often to someone other than the engineer
- **Mains voltage** is a licensed electrician's or qualified power engineer's work, to local code; in a product, a certified supply someone else is responsible for
- **The software engineer stays on the low-voltage side** of an isolation barrier a qualified person rated
- **Lithium cells** fail violently when abused — use a pre-made protected battery solution and a branded cell; do not design the pack, the charger or the BMS
- **Certification** — radio emissions, electrical safety, product safety — is done by an accredited test lab, is not optional, and takes months
- **A pre-certified module helps but does not finish the job** — the product needs its own testing, and antenna or enclosure changes can invalidate the module's coverage (Lesson 539)
- **Who to ask**: an electrician for mains, a power-electronics or battery specialist for lithium, an accredited test lab (and often a compliance consultant) for certification — the same "hand it to the right expert" posture as Lesson 478

## Example Code
No runtime, and no schematic — deliberately. The artefact is the referral, not a design.

| Work | Who owns it | What you request from them |
|---|---|---|
| Anything connected to mains AC | Licensed electrician / qualified power-electronics engineer | A certified supply or design, rated to local code, with a documented isolation barrier and its rating |
| Lithium charging, protection, pack | Battery / power-electronics specialist; use an off-the-shelf protected solution | A pre-made protected battery + charger IC combination, cells from a named manufacturer, a mechanical review that the cell cannot be crushed or punctured |
| Radio emissions certification | Accredited EMC test laboratory | A test plan and a quote; confirmation of what a pre-certified module covers and what the finished product still needs |
| Electrical / product safety | Accredited product-safety test laboratory; compliance consultant | The applicable standards for the product's market and use, and the test schedule |
| Mechanical safety of the enclosure | Mechanical engineer for anything load-bearing, high-temperature, or that a person could contact | A review against the deployment (mounting, temperature, accessibility) |

The pattern is Lesson 478's: the moment the failure mode is "someone gets hurt" and you cannot verify the mitigation yourself, the work is handed to a qualified person and you specify what you need from them.

## When to Use
- The moment a design touches mains AC, a lithium cell you would charge yourself, or a product that will be sold — stop and bring in the right specialist
- At project planning — certification is months and real budget; put it on the schedule before it is a surprise
- When a pre-certified module is chosen — confirm exactly what its certification covers and what the finished product still needs
- When the antenna or enclosure changes late (Lesson 539) — check whether it invalidates the module's certification
- When someone proposes designing the charge circuit or using unbranded cells "to save cost" — that saving is a recall risk

## Common Mistakes
- **Designing a mains interface without a qualified person** — the failure mode is fire or electrocution, and it may hurt a bystander
- **Designing your own lithium charger or BMS** — abuse-tolerant battery design is a specialty, and getting it wrong is a violent failure
- **Using unbranded lithium cells** — they may lack internal protection and their capacity and safety claims are unverifiable
- **Leaving certification off the schedule** — it is months of lead time and cannot be compressed near a launch date
- **Assuming a pre-certified module certifies the product** — it covers the radio; the product needs its own EMC and safety testing
- **Changing the antenna or enclosure after certification** — it can invalidate the result and force a retest

## Further Reading
- [FCC: Equipment Authorization (Part 15) overview](https://www.fcc.gov/engineering-technology/laboratory-division/general/equipment-authorization) — what radio-emissions certification requires in the US, and what a modular approval covers
- [EU: Radio Equipment Directive (2014/53/EU) overview](https://single-market-economy.ec.europa.eu/sectors/electrical-and-electronic-engineering-industries-eei/radio-equipment-directive-red_en) — the equivalent EU framework and the conformity-assessment routes
- [UL 2054 / IEC 62133 — battery safety standard scope](https://www.iec.ch/) — the product-safety standards a lithium-powered product is tested against; catalogue references, the work belongs to a test lab

<!-- This lesson is on scripts/stamp-verified.ts's HARM_DENYLIST: mains
voltage, lithium cells and certification are subjects where a wrong lesson
produces an injury, not a bug. It is written as a boundary — no circuit
diagrams, no wiring or charger instructions — and carries no quiz and no
recall by design. An expert pass can revisit it. -->
