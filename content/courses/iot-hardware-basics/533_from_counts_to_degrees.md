# 533. From Counts to Degrees: The ADC and Two Lossy Conversions

## What It Is
An analog-to-digital converter turns a voltage into an integer count. Firmware then turns that count into a number with a unit. Both steps lose information, and the phrase to keep from Lesson 524 is that "counts are not volts" — a count is a count, and treating it as a voltage without the two conversions is where a plausible wrong number comes from.

**Conversion one: voltage to counts.** An N-bit ADC divides its reference voltage into `2^N` steps, so one count is worth `Vref / 2^N` volts — the **resolution**, and the smallest change it can see. A 12-bit ADC on a 3.3 V reference resolves 0.8 mV. But your signal rarely uses the whole reference: a sensor that swings 0–1.65 V through a divider (Lesson 532) only ever reaches half scale, so half the counts are unused and your effective resolution is one bit worse than the datasheet's headline. **Design the front end to use the full ADC range** — that is what conditioning is for.

**Conversion two: counts to a physical quantity.** This is a formula specific to the sensor. For a linear sensor it is `quantity = (count × Vref / 2^N − offset) × scale`. For a non-linear one — a thermistor, most notably — it is a curve: the resistance-to-temperature relationship is exponential (the Steinhart–Hart or Beta equation), so recovering temperature needs `Math.log`, which is exactly why a thermistor lesson cannot use the `calc` widget (its grammar has no logarithm) and takes a `ts run` instead.

The loss in conversion two is quantisation carried forward. If one count is 0.1 °C at the sensor's operating point, no amount of floating-point maths in firmware gives you 0.01 °C — the extra digits are interpolation between two counts, not measurement. Reporting them (Lesson 473's payload) transmits noise. And for a non-linear sensor the °C-per-count value is not constant: a thermistor in a divider resolves finely where its resistance is close to the fixed resistor and coarsely where the two are far apart, so "±0.1 °C" holds over part of the range and not the rest — this lesson's `ts run` shows a 3× spread across one sensor's span.

```quiz
- q: "A 12-bit ADC has 3.3 V reference resolution of 0.8 mV. Your sensor only swings 0–1.1 V. What is your effective resolution in bits?"
  anchor: "half the counts are unused and your effective resolution is one bit worse"
  options:
    - text: "Still 12 bits — the ADC does not change"
      correct: false
      why: "The ADC is 12-bit, but your signal only reaches a third of its range, so you use ~10.7 bits of it. The unused range is wasted resolution."
    - text: "About 10–11 bits — the signal uses only a third of the range, so ~1.5 bits of resolution are unused"
      correct: true
      why: "Effective bits = 12 + log2(1.1/3.3) ≈ 10.4. Conditioning the signal to fill the range recovers them."
    - text: "24 bits — you can oversample to double the resolution"
      correct: false
      why: "Oversampling can add resolution but only under specific noise conditions, and it never doubles the bit count for a static signal."

- q: "Why does a thermistor lesson need a `ts run` fence and not a `calc` widget?"
  anchor: "recovering temperature needs `Math.log`"
  options:
    - text: "Because `calc` cannot display temperature units"
      correct: false
      why: "`calc` handles units fine. The problem is the maths."
    - text: "The resistance-to-temperature relationship is exponential, so recovering temperature needs a logarithm, which `calc`'s grammar does not have"
      correct: true
      why: "`calc` supports + − × ÷ and min/max/round only. Any exponential or log conversion has to be a `ts run`."
    - text: "Because thermistors are non-linear and `calc` only does linear equations"
      correct: false
      why: "Close — but the specific blocker is the missing `log`/`exp` in the expression grammar, not linearity in general."
```

## Key Concepts
- **An ADC turns a voltage into a count** — one count is `Vref / 2^N` volts, the resolution
- **"Counts are not volts"** — the count needs two conversions before it is a measurement
- **A signal that uses part of the range wastes resolution** — design the front end to fill the ADC's input span
- **Effective bits** = `N + log2(signal span / reference)` — always ≤ N
- **Conversion two is sensor-specific**: linear → `(count·Vref/2^N − offset)·scale`; non-linear → a curve
- **A thermistor's curve is exponential** — recovering temperature needs `log`, so it is a `ts run`, not a `calc`
- **Quantisation is carried forward** — firmware maths cannot add resolution the ADC did not capture
- **°C-per-count is not constant** for a non-linear sensor — it varies several-fold across the sensor's span

## Example Code
The two conversions for a thermistor, and the resolution you actually have at each end of its range:

```typescript run
// A 10k NTC thermistor with the Beta-parameter model. R0 and T0 are the
// datasheet reference point (10k at 25 degC); BETA is the datasheet Beta.
// These are cited datasheet values, not tuned.
const R0 = 10_000;
const T0_K = 298.15;
const BETA = 3950;
const KELVIN = 273.15;

// The circuit: thermistor from 3.3 V to the ADC node, fixed 10k from node to
// ground. 12-bit ADC, 3.3 V reference.
const VREF = 3.3;
const R_FIXED = 10_000;
const FULL_SCALE = 4095;

/** Conversion one: count -> node voltage -> thermistor resistance. */
function countToResistance(count: number): number {
  const vNode = (count / FULL_SCALE) * VREF;
  // vNode = VREF * R_FIXED / (R_therm + R_FIXED)  ->  solve for R_therm
  return R_FIXED * (VREF / vNode - 1);
}

/** Conversion two: resistance -> temperature, via the Beta equation. This is
 *  the step that needs a logarithm. */
function resistanceToC(rTherm: number): number {
  const invT = 1 / T0_K + (1 / BETA) * Math.log(rTherm / R0);
  return 1 / invT - KELVIN;
}

console.log('count -> R_therm -> temperature, and the degC change from one more count:');
console.log('  count    R_therm      temp        resolution here');
for (const count of [400, 1200, 2048, 2900, 3600]) {
  const t = resistanceToC(countToResistance(count));
  const tNext = resistanceToC(countToResistance(count + 1));
  const degPerCount = Math.abs(tNext - t);
  console.log(
    `  ${String(count).padStart(4)}   ${countToResistance(count).toFixed(0).padStart(7)} ohm   ${t.toFixed(2).padStart(6)} degC    ${degPerCount.toFixed(3)} degC/count`
  );
}

console.log('');
console.log('Near the middle of the range (count ~1200-2048, roughly 6-25 degC) one count is');
console.log('~0.022 degC. Out at the hot end (count 3600, ~78 degC) one count is ~0.072 degC,');
console.log('more than three times coarser. A firmware value of "77.52 degC" at the hot end');
console.log('claims resolution the divider and ADC did not deliver — the .02 is interpolation');
console.log('between two counts, and Lesson 473 should not transmit it.');
```

## When to Use
- Whenever an analog sensor feeds an ADC — write both conversions explicitly and know the resolution at your operating point
- When designing signal conditioning — the goal is to map the sensor's real range onto the ADC's full input span
- When choosing how many decimal places a reading carries — no more than the °C-per-count at the coldest/least-sensitive point
- When a non-linear sensor is involved — the conversion is a `ts run`, and the resolution varies across the range
- When a reading looks precise but is really noisy — check whether the last digit is smaller than one count

## Common Mistakes
- **Treating a count as a voltage** — it is a count; the reference and the bit depth turn it into volts
- **Using only part of the ADC range** — a sensor that reaches half scale throws away a bit of resolution the datasheet advertised
- **Reporting more decimal places than the resolution supports** — the extra digits are interpolation, and transmitting them wastes payload (Lesson 473)
- **Assuming °C-per-count is constant for a thermistor** — it is finest in the middle of the range and coarse at the ends
- **Trying to force a thermistor curve into a `calc` fence** — no logarithm in the grammar; it must be a `ts run`
- **Oversampling and claiming free resolution** — it only works under specific noise conditions and never doubles the bit count for a static signal

## Further Reading
- [Analog Devices MT-001: Taking the Mystery out of the Infamous Formula, "SNR = 6.02N + 1.76dB"](https://www.analog.com/media/en/training-seminars/tutorials/MT-001.pdf) — where ADC resolution and effective bits actually come from
- [Vishay NTCLE100E3 datasheet](https://www.vishay.com/docs/29049/ntcle100.pdf) — a real NTC thermistor with its Beta value and R/T table, the numbers this lesson's code cites
- [Lesson 473](/courses/iot-telemetry-edge/designing-a-payload) — deciding how many bits of a reading are worth sending, given the resolution the front end delivers

```recall
- q: "Name the two conversions between an ADC count and a measurement, and what each loses."
  must:
    - "count to voltage: one count is Vref / 2^N; a signal using part of the range wastes resolution"
    - "voltage to physical quantity: a sensor-specific formula, linear or a curve"
    - "quantisation is carried forward — firmware maths cannot recover resolution the ADC did not capture"

- q: "Why can a thermistor conversion not use the `calc` widget?"
  must:
    - "the resistance-to-temperature relationship is exponential"
    - "recovering temperature needs a logarithm"
    - "`calc`'s grammar has only + − × ÷ and min/max/round, so it must be a `ts run`"

- q: "How many decimal places should a reading carry?"
  must:
    - "no more than the °C (or unit) per count at the operating point"
    - "for a non-linear sensor the °C-per-count varies several-fold — use the coarsest point in the used range"
    - "extra digits are interpolation between counts, not measurement, and should not be transmitted"
```
