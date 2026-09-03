# 532. Voltage Dividers and Tolerance: Where Your Three Percent Error Came From

## What It Is
A resistor divider is the most common front end in the course: two resistors in series across a voltage, with the measured point between them, scaling a signal down into an ADC's input range. The nominal behaviour is one line — `Vout = Vin × R_bottom / (R_top + R_bottom)` — and it is exact. The reason a divider deserves its own lesson is that **every component in it has a tolerance, and at the worst combination the tolerances add**.

Consider a divider scaling a 5 V signal for a 3.3 V ADC, built from two 1% resistors, powered by a 1% voltage reference, read by an ADC with a 1% gain error. Each part is individually good. But firmware recovers the signal by *undoing* the divider: `Vin = count / full_scale × Vref × (R_top + R_bottom) / R_bottom`, and that expression contains all four toleranced quantities. At the corner where they all push the same way, the recovered value is off by close to the sum — about 3%. This lesson's `proof` enumerates all sixteen tolerance corners and counts the worst case, so the number in the title is the run's output, not an estimate. It is the number you would have to defend in a design review.

Three percent is often fine. The point is to **know it, and know where it came from**, so that when the requirement is 1% you make the right change — tighter resistors (0.1%), a better reference, an ADC with a lower gain error, or a per-device calibration (Lesson 534) that measures the actual divider rather than trusting its nominal value. Spending money on 0.1% resistors while keeping a 1% reference is a common way to pay for precision you do not get.

There is a second, quieter divider error: **loading**. The divider's own resistance is in parallel with whatever it feeds. If R_top and R_bottom are large (to save power) and the ADC's input impedance or sampling is not much larger, the ADC pulls the divider's output down and the ratio you designed is not the ratio you get. The fix is either lower divider resistance (more standby current — Lesson 537) or a buffer between the divider and the ADC.

```quiz
- q: "A divider is built from two 1% resistors, a 1% reference and an ADC with 1% gain error. What is the worst-case measurement error?"
  anchor: "the recovered value is off by close to the sum"
  options:
    - text: "1% — the resistors are matched so their errors cancel"
      correct: false
      why: "They only cancel if you assume they track. At the worst corner they do not, and the reference and ADC errors add on top."
    - text: "About 3% — at the worst tolerance corner the four 1% errors nearly add"
      correct: true
      why: "This lesson's proof enumerates all sixteen corners and the worst case is ~3.2%. That is the number for a design review."
    - text: "0.25% — errors combine as the square root of the sum of squares"
      correct: false
      why: "RSS is the statistical (typical) combination. Worst-case design uses the linear sum, because the corner is a real build."

- q: "Your divider uses two large resistors to save power, and the reading is a few percent low and drifts with temperature. Likely cause?"
  anchor: "the ADC pulls the divider's output down and the ratio you designed is not the ratio you get"
  options:
    - text: "The resistors have drifted out of tolerance"
      correct: false
      why: "Drift of that size is unlikely for metal-film parts. A temperature-dependent low reading points at loading."
    - text: "Loading — the ADC's input impedance is comparable to the divider resistance and pulls the output down"
      correct: true
      why: "Large divider resistors save power but make the divider easy to load. Lower the resistance or add a buffer."
    - text: "The reference voltage is too high"
      correct: false
      why: "A high reference would make readings low uniformly, not with a temperature dependence tied to the divider."
```

## Key Concepts
- **Nominal divider**: `Vout = Vin × R_bottom / (R_top + R_bottom)` — exact
- **Every part has a tolerance**: the two resistors, the reference, the ADC's gain error
- **At the worst corner the tolerances add** — four 1% parts give ~3%, not 1% and not 0.25%
- **Worst-case design uses the linear sum**, because the corner is a real build (RSS is the typical case)
- **Know the number and its source** — then spend on the part that dominates, not the cheap fix
- **Per-device calibration** (Lesson 534) measures the actual divider instead of trusting nominal
- **Loading**: the divider's resistance parallels its load; large resistors are easily pulled down by the ADC
- **Loading fix**: lower resistance (more standby current, Lesson 537) or a buffer

## Example Code
The nominal divider, as a calculator you put your own values into — and then the proof that counts the worst case:

```calc
inputs:
  - { id: v_in,   label: "Signal voltage at the top of the divider (V)", type: number, default: 5, min: 0 }
  - { id: r_top,  label: "Top resistor (ohms)", type: number, default: 10000, min: 1 }
  - { id: r_bot,  label: "Bottom resistor (ohms)", type: number, default: 6800, min: 1 }
  - { id: v_ref,  label: "ADC reference / full-scale voltage (V)", type: number, default: 3.3, min: 0 }
outputs:
  - { label: "Divider output voltage", expr: "v_in * r_bot / (r_top + r_bot)", format: number }
  - { label: "Fraction of ADC range used", expr: "v_in * r_bot / (r_top + r_bot) / v_ref", format: percent }
  - { label: "Volts represented by one count (12-bit)", expr: "v_ref / 4095 * (r_top + r_bot) / r_bot", format: number }
```

```proof sha=ee9ddd30579853f6 at=2026-09-03 commit=c761a61
$ node divider.js
Divider front end: R_top 10k 1%, R_bottom 6.8k 1%, V_ref 3.300 V 1%, ADC gain 1%, 12-bit
Signal is truly 4.000 V; nominal parts give ADC count 2009.

Recovering that one count under every one of the 16 tolerance corners:
  R_top    R_bot    V_ref    ADC gain   recovered
    9900     6732   3.267   0.990      3.9998 V
    9900     6732   3.267   1.010      3.9206 V
    9900     6732   3.333   0.990      4.0806 V
    9900     6732   3.333   1.010      3.9998 V
    9900     6868   3.267   0.990      3.9527 V
    9900     6868   3.267   1.010      3.8744 V
    9900     6868   3.333   0.990      4.0325 V
    9900     6868   3.333   1.010      3.9527 V
   10100     6732   3.267   0.990      4.0479 V
   10100     6732   3.267   1.010      3.9678 V
   10100     6732   3.333   0.990      4.1297 V
   10100     6732   3.333   1.010      4.0479 V
   10100     6868   3.267   0.990      3.9998 V
   10100     6868   3.267   1.010      3.9206 V
   10100     6868   3.333   0.990      4.0806 V
   10100     6868   3.333   1.010      3.9998 V

nominal recovery : 3.9998 V
worst-case low   : 3.8744 V   (-3.14 %)
worst-case high  : 4.1297 V   (+3.25 %)

Worst-case error from four 1% parts: +/- 3.2 %.
It approaches the sum of the four tolerances because at the worst corner they
all push the same way. This is the number to bring to a design review — not
"about a percent, probably fine", and not a bench reading of one build.
```

The `calc` gives you the nominal design. The `proof` runs the tolerance corners of the *same* divider (10k / 6.8k / 3.3 V / 12-bit) and reports the worst-case recovered-signal error — the "three percent" in the title, computed rather than asserted.

## When to Use
- Whenever a signal is scaled into an ADC — the divider's tolerance stack is part of your measurement error budget
- When a measurement requirement is a percentage — add up the front-end tolerances before promising it
- When choosing where to spend — the reference and the ADC gain error often dominate; 0.1% resistors alone do not help
- When divider resistors are large for power reasons — check the loading against the ADC's input spec (Lesson 526)
- Before designing calibration (Lesson 534) — calibration corrects the divider you built, not the one you drew

## Common Mistakes
- **Quoting the nominal ratio as the accuracy** — the divider is exact only if the resistors are; they are not
- **Assuming matched resistors cancel** — they only track if specified to; at the worst corner they diverge
- **Using RSS for a worst-case number** — root-sum-square is the typical combination; a design review wants the linear sum
- **Buying 0.1% resistors while keeping a 1% reference** — you paid for precision the reference throws away
- **Ignoring loading** — large divider resistors and a modest ADC input impedance shift the ratio and add temperature dependence
- **Skipping the proof and writing "about 3%"** — the exact worst case is countable, and it is the number you will be asked to defend

## Further Reading
- [Vishay: Resistor tolerance and its effect on divider accuracy](https://www.vishay.com/docs/28770/tempco.pdf) — how tolerance and temperature coefficient combine in a divider
- [Analog Devices MT-031: Grounding, and MT-035: Op Amp Inputs](https://www.analog.com/en/resources/technical-articles/mt031.html) — buffering a divider so its output impedance stops mattering
- [Lesson 534](/courses/iot-hardware-basics/sensor-error-offset-gain-drift) — measuring and correcting the divider you actually built, per device

```recall
- q: "Why does a divider built from four 1% parts have a ~3% worst-case error?"
  must:
    - "the recovered signal expression contains all four toleranced quantities"
    - "at the corner where they all push the same way, the errors nearly add"
    - "worst-case design uses the linear sum, not RSS, because the corner is a real build"

- q: "What is divider loading and how is it fixed?"
  must:
    - "the divider's resistance is in parallel with whatever it feeds"
    - "large divider resistors are pulled down by a modest ADC input impedance, shifting the ratio"
    - "fix with lower resistance (more standby current) or a buffer between divider and ADC"

- q: "Once you know the front-end error is 3%, what is the right response?"
  must:
    - "know where it came from — resistors, reference, or ADC gain"
    - "if the requirement is tighter, spend on the dominant contributor"
    - "or use per-device calibration (Lesson 534) to measure the divider you built"
```
