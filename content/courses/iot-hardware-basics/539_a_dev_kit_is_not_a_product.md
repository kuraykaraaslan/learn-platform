# 539. A Dev Kit Is Not a Product: Module, Board, and What Changes at Five Hundred Units

## What It Is
A development kit — a board with an MCU, a radio, headers, a USB port and an on-board debugger — is built to make the first working prototype fast. Almost none of the reasons it is good at that survive to a product, and the gap between "works on the dev kit" and "manufacturable at 500 units" is where a lot of hardware projects stall.

There are three levels, and confusing them is the error. A **chip** is the bare silicon — you design a board around it, and you are responsible for the RF layout, the antenna, and regulatory certification. A **module** is a small pre-assembled board carrying the chip, a crystal, RF matching and often a certified antenna, sold as a component with a fixed footprint — you place it on your board and inherit its pre-certification (Lesson 541). A **dev kit** is a module or chip plus all the prototyping convenience: debug hardware, level shifters, voltage options, expansion headers, a battery charger, silkscreen labels. The convenience is the cost — it is bigger, more expensive, and draws more power than the product needs.

What changes at volume is specific. **The debugger comes off** — you do not ship the on-board J-Link; you add a small programming header and program in production. **The USB port and its protection may go** if the product does not need USB. **The voltage regulators are re-chosen** for the actual battery and the actual load, not the "runs off USB or a 9 V" flexibility of the kit (Lesson 537's regulator quiescent current suddenly matters). **The connectors change** from 0.1" headers to whatever the enclosure and the cable actually use. **The antenna** may move from the kit's chip antenna to an external one, which changes the RF layout and may re-open certification. And every one of these changes is a new board spin and a new test.

The decision this frames — and it is a real business decision, not just a technical one — is **module versus own board**. A module costs more per unit and constrains your layout, but it removes the RF design, shortens certification, and de-risks the schedule. A chip-down design is cheaper at high volume and gives you full control, at the cost of RF expertise, longer certification, and more board spins. Lesson 512's buy-versus-build logic applies here in hardware: the module is the "buy", and the reason to build is a volume or a constraint the module cannot meet.

```quiz
- q: "Your prototype works on a dev kit. What is the single biggest risk in moving to a product?"
  anchor: "the gap between \"works on the dev kit\" and \"manufacturable at 500 units\""
  options:
    - text: "The firmware will need a rewrite"
      correct: false
      why: "The firmware usually ports with modest changes. The board does not — every convenience feature of the kit is a design decision you now own."
    - text: "The dev kit's convenience features — debugger, USB, flexible regulators, headers, antenna — are all things you must re-decide and re-test on a real board"
      correct: true
      why: "Each is a board change and a new test cycle, and some (the antenna) can re-open certification."
    - text: "The chip will be obsolete by the time you ship"
      correct: false
      why: "A real supply-chain risk to check, but not the biggest one — the board redesign is."

- q: "When does a chip-down design win over using a certified module?"
  anchor: "the reason to build is a volume or a constraint the module cannot meet"
  options:
    - text: "Always — modules are just marked-up chips"
      correct: false
      why: "Modules carry RF design, matching, an antenna and pre-certification. At low-to-medium volume that is worth the markup."
    - text: "At high volume where the per-unit saving outweighs the RF design cost, or when a size/feature constraint the module cannot meet forces it"
      correct: true
      why: "The trade is the same shape as Lesson 512's buy-vs-build: the module is the buy, and build needs a concrete reason."
    - text: "Whenever the team has a hardware engineer"
      correct: false
      why: "Having the skill does not make a chip-down design the right call — the RF work, certification time and board spins are real costs regardless."
```

## Key Concepts
- **A dev kit is built for the first prototype**, and its strengths mostly do not survive to a product
- **Three levels**: chip (you own the RF and certification), module (pre-assembled, pre-certified, fixed footprint), dev kit (module/chip plus prototyping convenience)
- **The convenience is the cost** — bigger, more expensive, more power than the product needs
- **What changes at volume**: the debugger comes off, USB may go, regulators are re-chosen (Lesson 537), connectors change, the antenna may move
- **Every one of those changes is a board spin and a test cycle**
- **An antenna change can re-open certification** (Lesson 541)
- **Module vs own board is a business decision** — module = higher unit cost, lower risk; chip-down = lower unit cost, RF expertise and longer schedule
- **Same shape as Lesson 512's buy-vs-build** — the module is the buy

## Example Code
No runtime — the artefact is the trade itself:

```tradeoff
question: "Build the product around a certified radio module, or a chip-down design?"
sides:
  - name: "Certified module"
    wins_when:
      - signal: "annual volume is low-to-medium (thousands, not hundreds of thousands), so the per-unit module premium is small against the RF-design and certification cost it removes"
      - signal: "the schedule matters — the module's pre-certification (Lesson 541) removes the longest-lead, least-predictable item from the plan"
      - signal: "the team has no RF layout or antenna-matching experience, and hiring or contracting it is slower and costlier than the module premium"
  - name: "Chip-down design"
    wins_when:
      - signal: "volume is high enough that the per-unit saving over the module's life exceeds the one-time RF design and certification cost — a spreadsheet, not a feeling"
      - signal: "a size, cost or integration constraint the smallest suitable module cannot meet forces a custom board"
      - signal: "the product needs control the module does not expose — an unusual antenna, a specific power topology, a chip variant the module is not built on"
```

## When to Use
- At the transition from prototype to product — enumerate every dev-kit feature and decide keep, change, or remove
- When estimating a hardware schedule — count the board spins the dev-kit-to-product changes imply
- When choosing between a module and a chip — treat it as Lesson 512's buy-vs-build, with RF design and certification as the build cost
- When a "we already have it working" prototype is presented as near-done — the board redesign and its test cycles are still ahead
- When the antenna will change between prototype and product — flag the certification impact early (Lesson 541)
- When the unit count crosses into the hundreds — the product now needs provisioning, configuration and OTA-update infrastructure (Lesson 479), which the one hand-flashed dev kit never did

## Common Mistakes
- **Treating a working dev-kit prototype as a nearly-finished product** — the board redesign and its test cycles are the bulk of the remaining work
- **Confusing a module with a chip** — the module carries RF matching, an antenna and pre-certification; the chip does not
- **Keeping the dev kit's flexible regulator in the product** — its quiescent current wrecks the energy budget (Lesson 537)
- **Shipping the on-board debugger** — add a programming header and program in production instead
- **Changing the antenna late** — it moves the RF layout and can re-open certification (Lesson 541)
- **Choosing chip-down because the team can** — the RF work, certification lead time and board spins are real costs that a concrete volume or constraint has to justify

## Further Reading
- [Nordic: nRF52 module vs SoC selection guide](https://www.nordicsemi.com/Products/Development-hardware) — one vendor's chip / module / dev-kit split and what each level makes you responsible for
- [Adafruit: From prototype to production (learn guide)](https://learn.adafruit.com/from-0-to-1-your-guide-to-taking-a-project-from-idea-to-production) — the concrete list of things that change between a breakout-board prototype and a manufacturable board
- [Lesson 512](/courses/asset-management-systems/buying-vs-building-eam) — buy-versus-build argued on what the data model decides; the same reasoning shape applied to a radio module instead of a CMMS

```recall
- q: "Name the three levels — chip, module, dev kit — and what each makes you responsible for."
  must:
    - "chip: bare silicon — you own the RF layout, the antenna and certification"
    - "module: pre-assembled with crystal, RF matching and often a certified antenna; fixed footprint, inherits pre-certification"
    - "dev kit: a module or chip plus prototyping convenience — debugger, USB, flexible power, headers"

- q: "List the things that change moving a dev-kit prototype to a product."
  must:
    - "the debugger comes off (add a programming header), USB may go"
    - "regulators re-chosen for the real battery and load (Lesson 537), connectors change"
    - "the antenna may move, which can re-open certification (Lesson 541); each change is a board spin and a test"

- q: "When does a chip-down design win over a certified module?"
  must:
    - "high volume where the per-unit saving beats the one-time RF design and certification cost"
    - "or a size/feature constraint the smallest suitable module cannot meet"
    - "it is Lesson 512's buy-vs-build — the module is the buy, and build needs a concrete reason"
```
