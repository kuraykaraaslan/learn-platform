# 526. Reading a Datasheet: Absolute Maximum Is Not a Specification

## What It Is
The corpus refers a reader to a datasheet twice — Lesson 481 says a figure "comes from Lesson 472's calculation, not from a datasheet's headline", and Lesson 504 warns that a vendor "does not know what this asset's failure costs" — but it never shows how to read one. A datasheet is a legal and engineering document with a fixed structure, and the structure is what tells you which numbers you can build on.

The first distinction is the one the title names. **Absolute Maximum Ratings** are the stresses beyond which the part may be permanently damaged. They are not an operating range — running a part continuously at its absolute maximum is a design error even though the number is "in the datasheet". The **Recommended Operating Conditions** are where the part is guaranteed to behave as specified. The gap between the two is deliberate margin, and it is yours to keep, not to spend.

The second distinction is **typ / min / max**. A "typical" value is what a representative part does at 25 °C with a nominal supply; it is not guaranteed and it is not what your worst part in a hot enclosure will do. Design against **min and max**, and if a parameter only has a "typ" column, that parameter is not guaranteed — treat it as informational. Every guaranteed number also has **test conditions** attached (supply voltage, temperature, load), and the number is only valid under those conditions; the same parameter at a different temperature is a different number, often on a graph later in the document.

The third thing to find is the parts you are not looking for: the **note references** (superscript numbers next to values, pointing at conditions or caveats that change the meaning), the **package thermal data** (which sets how much power the part can actually dissipate in your layout), and the **revision history** (so a quoted value can be pinned to a document version, the same discipline Lesson 468 applies to an API).

```quiz
- q: "A part's Absolute Maximum supply voltage is 6.0 V. Your supply is a regulated 5.0 V. Is that a good design?"
  anchor: "running a part continuously at its absolute maximum is a design error"
  options:
    - text: "Yes — 5.0 V is below the 6.0 V absolute maximum"
      correct: false
      why: "The absolute maximum is a damage threshold, not an operating limit. The number to check is Recommended Operating Conditions."
    - text: "Only if 5.0 V is within the Recommended Operating Conditions; the absolute maximum is a damage threshold, not an operating range"
      correct: true
      why: "The gap between recommended-operating and absolute-max is margin you keep. A 5 V supply with a 5.5 V recommended max and 6 V abs max is fine; against a 5 V abs max it is not."
    - text: "No — you should never exceed 80% of any datasheet number"
      correct: false
      why: "There is no universal 80% rule. The recommended operating conditions already contain the margin the manufacturer guarantees."

- q: "A datasheet lists a sensor's accuracy only in a 'typ' column, with no min/max. What does that mean for your design?"
  anchor: "if a parameter only has a \"typ\" column, that parameter is not guaranteed"
  options:
    - text: "The typical value is the guaranteed worst case"
      correct: false
      why: "Typical is a representative part at nominal conditions — it is explicitly not a guarantee."
    - text: "That accuracy is not guaranteed by the manufacturer — you cannot rely on it and may need per-device calibration"
      correct: true
      why: "An un-bounded parameter is informational. Lesson 534's per-device calibration exists for exactly this case."
    - text: "You should assume the accuracy is twice the typical value"
      correct: false
      why: "There is no defined relationship. An unspecified parameter has no bound you can derive."
```

## Key Concepts
- **Absolute Maximum Ratings** = damage thresholds, never an operating range
- **Recommended Operating Conditions** = where the part is guaranteed to work as specified
- **The gap between them is margin** — yours to keep, not to spend
- **typ** is a representative part at 25 °C and nominal supply — not guaranteed
- **Design against min and max**; a parameter with only a "typ" is not guaranteed
- **Every guaranteed number has test conditions** — supply, temperature, load — and is only valid under them
- **Temperature-dependent parameters live on graphs** later in the document, not in the table
- **Note superscripts, thermal data, and revision history** are where the meaning-changing detail hides
- **Pin a quoted value to a document revision and date** (Lesson 468's discipline)

## Example Code
No runtime — the exercise is to read one. A worked reading of a datasheet table row for a hypothetical `TS-1` temperature sensor:

```text
Parameter          Symbol   Min    Typ    Max    Unit   Conditions
--------------------------------------------------------------------
Supply voltage     VDD      1.8    3.3    3.6    V      —
Supply current     IDD      —      1.2    3.5    µA     VDD=3.3V, 1 Hz sampling  (note 2)
Accuracy           —        —      ±0.3   —      °C     VDD=3.3V, 0–65°C          (note 3)
Absolute max VDD   —        —      —      4.0    V      stress rating, not operational
Operating temp     TA       -40    —      85     °C     —

note 2: Add 500 µA during the 8.2 ms conversion. Average per your sample rate.
note 3: ±0.5°C outside 0–65°C. See Figure 7 for the full curve.
```

What this row tells a designer:
- Run it from **1.8–3.6 V**, not up to 4.0 V. The 4.0 V is a survival number.
- Budget current as **note 2 says to compute it**, not as the 1.2 µA headline (Lesson 537 does this).
- The **±0.3 °C is typical and only inside 0–65 °C**; outside that band it is ±0.5 °C, and the real curve is a figure. If your enclosure runs at 70 °C, your accuracy is not ±0.3.
- There is **no guaranteed accuracy** — no min/max column — so a fleet will spread, and Lesson 534 is where that spread gets corrected.

## When to Use
- Before choosing any part — read the operating conditions and the notes, not the marketing first page
- When a part behaves out of spec — check the test conditions of the number you are comparing against
- When budgeting power or timing — follow the note that says how to compute the real figure
- When writing a purchasing specification — cite the parameter, its limit, and the datasheet revision
- When a supplier offers a "compatible" alternative — compare the guaranteed columns, not the typical ones

## Common Mistakes
- **Treating an Absolute Maximum as an operating limit** — it is the number past which the part may be destroyed, not run
- **Designing against the "typ" column** — the worst part in the hottest enclosure will not be typical
- **Ignoring test conditions** — a current or accuracy figure at 25 °C and 3.3 V does not apply at 70 °C and 3.0 V
- **Missing the note superscripts** — they routinely say "add X during conversion" or "valid only over this range"
- **Quoting a value without a revision** — datasheets are revised, and a number can change between revisions (Lesson 468)
- **Assuming an unspecified parameter has a reasonable bound** — if it is not in a min/max column, it is not guaranteed at all

## Further Reading
- [TI: How to Read a Datasheet (application brief)](https://www.ti.com/lit/an/slyt732/slyt732.pdf) — the section structure and what each guarantees, from a manufacturer
- [EEVblog: Absolute Maximum Ratings explained](https://www.eevblog.com/) — the damage-threshold-vs-operating-range distinction with real parts
- [Lesson 468](/courses/autodesk-developer-platform/designing-for-vendor-churn) — pinning a quoted external value to a version, the same discipline for an API

```recall
- q: "Distinguish Absolute Maximum Ratings from Recommended Operating Conditions."
  must:
    - "absolute maximum is the stress level beyond which the part may be permanently damaged"
    - "recommended operating conditions are where it is guaranteed to work as specified"
    - "the gap is design margin — you keep it, you do not operate in it"

- q: "What is the difference between a 'typ' value and a min/max value?"
  must:
    - "typ is a representative part at 25°C and nominal supply — not guaranteed"
    - "min/max are guaranteed limits and are what you design against"
    - "a parameter with only a typ column is not guaranteed at all"

- q: "Why does every guaranteed datasheet number have test conditions attached?"
  must:
    - "the number is only valid under those conditions — supply, temperature, load"
    - "the same parameter at a different temperature is a different number, often on a graph"
    - "so comparing a part to a spec means matching the conditions too"
```
