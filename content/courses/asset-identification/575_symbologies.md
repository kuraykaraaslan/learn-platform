# 575. Symbologies: 1D, 2D, and What Actually Fits on the Tag

## What It Is
A **symbology** is the rule for turning characters into a printed pattern, and choosing one is mostly a question about physical space rather than about data. The identifier is short — that was Lesson 573's whole argument — so capacity is rarely the constraint. What constrains you is the **module**: the smallest black or white element the printer can produce and the scanner can resolve, and every symbol's size is a multiple of it.

The families divide cleanly. A **linear (1D) code** encodes characters along one axis, so its width grows with the number of characters while its height carries no data at all — height exists only so a scanner sweeping across it finds a complete line. Code 128 (ISO/IEC 15417) is the general-purpose member. A **two-dimensional code** encodes in both axes, so it stays roughly square and grows much more slowly with content: QR (ISO/IEC 18004) and Data Matrix (ISO/IEC 16022) are the two you will meet. **On a small tag, a 2D code carrying the same identifier is smaller than the 1D equivalent**, and that is usually the whole decision.

Two-dimensional codes also carry **error correction**, which is not a detail on an asset tag. A code that spends part of its area on redundancy can still be read with a corner missing, a scratch across it, or grease over part of it — which describes most tags after two years in a plant room. The trade is direct: more correction means fewer data modules in the same area, or the same data in a larger symbol. On an outdoor or industrial tag the higher correction level is usually correct, and it is a decision to make deliberately rather than accept from a default.

Then there is the constraint everybody discovers after printing: the **quiet zone**. Every symbology requires a margin of blank space around it, specified in modules, and a symbol printed to the edge of a label does not scan. It is the single most common reason a freshly printed batch fails, and it is a layout problem rather than an encoding one.

Finally, and against instinct: **print at the largest module size that fits**, not the smallest that works. Module size is what buys tolerance against a dirty lens, a low-resolution camera, an oblique angle and a wet surface. A code that scans perfectly on a bench at 4 mils fails in a riser at arm's length.

```quiz
- q: "Why is a 2D code usually smaller than a 1D code carrying the same identifier?"
  anchor: "its width grows with the number of characters while its height carries no data at all"
  options:
    - text: "Because 2D codes compress their content"
      correct: false
      why: "Neither family compresses in any meaningful sense; the difference is geometric."
    - text: "Because a 1D code only encodes along one axis, so its height is wasted area, while a 2D code uses both"
      correct: true
      why: "Which is why the 2D symbol stays roughly square and grows more slowly with content."
    - text: "Because 2D codes use smaller modules"
      correct: false
      why: "Module size is set by the printer and the scanner, not by the symbology family."

- q: "What does error correction cost, and why is it worth it on an asset tag?"
  anchor: "more correction means fewer data modules in the same area"
  options:
    - text: "It costs nothing — it is a property of the decoder"
      correct: false
      why: "The redundancy occupies modules; it is paid for in area or in capacity."
    - text: "Fewer data modules in the same area, in exchange for still reading with a scratch or a missing corner"
      correct: true
      why: "Which describes most tags after a couple of years in service."
    - text: "It costs scan time, which matters when scanning many assets"
      correct: false
      why: "Decoding time is negligible next to the physical handling."

- q: "A freshly printed batch of tags will not scan. What is the first thing to check?"
  anchor: "a symbol printed to the edge of a label does not scan"
  options:
    - text: "The encoding — the identifier may contain unsupported characters"
      correct: false
      why: "That would have failed at print time, not at scan time."
    - text: "The quiet zone — the blank margin every symbology requires around the symbol"
      correct: true
      why: "It is a layout mistake and the most common cause of a whole batch failing."
    - text: "The scanner's firmware version"
      correct: false
      why: "A plausible last resort, and rarely the cause of a batch-wide failure."
```

## Key Concepts
- **The module is the constraint** — the smallest element the printer can make and the scanner can resolve
- **1D codes grow in width with content**; their height carries no data and exists for the sweep
- **2D codes use both axes**, stay roughly square, and are usually smaller for the same identifier
- **Code 128** is ISO/IEC 15417; **QR** is ISO/IEC 18004; **Data Matrix** is ISO/IEC 16022
- **Error correction is area** — more redundancy means fewer data modules or a bigger symbol
- **The quiet zone is required** and is the most common reason a printed batch fails
- **Print at the largest module that fits** — module size buys tolerance for dirt, distance and angle

## Example Code
The sizing arithmetic. Take the symbol's module count from the standard for the version and correction level you have chosen, and the rest is division:

```calc
inputs:
  - { id: modules,     label: "Symbol size in modules per side (from the symbology's spec)", type: number, default: 33, min: 1 }
  - { id: quiet_zone,  label: "Quiet zone required, in modules per side", type: number, default: 4, min: 0 }
  - { id: printer_dpi, label: "Printer resolution (dots per inch)", type: number, default: 300, min: 1 }
  - { id: dots_module, label: "Printer dots per module (never fewer than 2)", type: number, default: 4, min: 1 }
  - { id: tag_width,   label: "Usable tag width (mm)", type: number, default: 40, min: 1 }
outputs:
  - { label: "Module size (mm)", expr: "25.4 / printer_dpi * dots_module", format: number }
  - { label: "Symbol width including quiet zone (mm)", expr: "(modules + quiet_zone * 2) * (25.4 / printer_dpi * dots_module)", format: number }
  - { label: "Fraction of the tag width used", expr: "(modules + quiet_zone * 2) * (25.4 / printer_dpi * dots_module) / tag_width", format: percent }
  - { label: "Largest whole dots per module that still fits", expr: "round(tag_width / ((modules + quiet_zone * 2) * 25.4 / printer_dpi) - 0.5)", format: number }
```

The last output is the one to act on. Having decided a symbology, a version and a correction level, the remaining freedom is how many printer dots to spend per module — and the answer should be the largest number that fits the tag, not the smallest that decodes. A symbol that occupies 40% of the tag is not efficient; it is a symbol printed at half the tolerance it could have had, on a tag whose remaining area is doing nothing.

## When to Use
- When specifying tags for an estate, where the symbology, version, correction level and module size are four separate decisions
- When a batch of tags will not scan, where the quiet zone and the module size are the first two suspects
- When tags will live outdoors or in a plant room, which pushes the correction level up
- When tag area is genuinely scarce, which is when the 1D/2D difference stops being a preference
- When choosing what to encode, since a URL's extra characters land directly in this arithmetic (Lesson 573)

## Common Mistakes
- **Printing at the smallest module that decodes on the bench** — the field has dirt, distance and angle
- **Ignoring the quiet zone** — the most common batch-wide failure, and it is a layout bug
- **Accepting the default error-correction level** — it is a deliberate trade between area and survivability
- **Choosing 1D out of habit** — for a short identifier on a small tag, a 2D symbol is usually smaller
- **Treating capacity as the constraint** — the identifier is short; the module and the tag area are the constraints
- **Deciding the symbology before deciding what goes on the tag** — the payload sets the module count (Lesson 573)

## Further Reading
- [ISO/IEC 18004 — QR Code bar code symbology specification](https://www.iso.org/standard/83389.html) — versions, module counts and the four error-correction levels; catalogue reference, the clause text is paid
- [ISO/IEC 16022 — Data Matrix bar code symbology specification](https://www.iso.org/standard/44230.html) — the symbology usually chosen for small industrial marks; catalogue reference
- [ISO/IEC 15417 — Code 128 bar code symbology specification](https://www.iso.org/standard/43896.html) — the general-purpose linear symbology; catalogue reference
- [Lesson 573](/courses/asset-identification/what-goes-on-the-tag) — what is being encoded, which sets the module count before any of this arithmetic runs

```recall
- q: "What actually constrains the size of a code on a tag?"
  must:
    - "the module -- the smallest element the printer can produce and the scanner can resolve"
    - "not capacity, because the identifier is short"
    - "every symbol's dimensions are a multiple of the module, plus a required quiet zone"

- q: "What is the difference between a 1D and a 2D symbology in practice?"
  must:
    - "a 1D code encodes along one axis, so width grows with content and height carries no data"
    - "a 2D code uses both axes, stays roughly square and grows more slowly"
    - "for a short identifier on a small tag the 2D symbol is usually smaller"

- q: "Why print at the largest module size that fits?"
  must:
    - "module size buys tolerance against dirt, distance, angle and a poor camera"
    - "a code that decodes at the smallest size on a bench fails in a riser at arm's length"
    - "and unused tag area is not efficiency -- it is tolerance that was available and not taken"
```
