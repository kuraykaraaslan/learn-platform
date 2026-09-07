# 550. Fixed Point: The Float You Cannot Afford, and the Overflow in the Middle

## What It Is
Lesson 533 turned counts into degrees with a division, and wrote the result as a decimal. On the device, that decimal is a decision. Many microcontrollers have no floating-point unit at all, so every `float` operation becomes a call into a software library that costs code space and cycles; on the parts that do have one it is usually single precision, and using it inside an interrupt handler drags floating-point registers into the context the core has to preserve. Neither is a reason to never use a float. Both are reasons to know when you are.

The alternative is **fixed point**: keep integers, and agree on where the decimal point is. Store 23.45 °C as `2345` and remember the unit is centi-degrees; store a Q16.16 value as a 32-bit integer where 65,536 means 1.0. Addition and subtraction are ordinary integer operations. Comparison is ordinary. Nothing is emulated, nothing is rounded twice, and the representation is exact for the quantities the sensor can actually produce.

Multiplication is where it goes wrong, and it goes wrong quietly. **The product of two scaled integers needs more bits than either of them**, so an expression that looks obviously correct — scale a reading by a calibration factor, then divide the scale back out — overflows the register in the middle and produces a number with no relationship to the answer. The overflow is not signalled. It appears at large inputs only, which is to say at exactly the readings that matter: the hot day, the full tank, the peak load.

There are two fixes and they are both simple once the problem is named. **Widen the intermediate** — compute the product in 64 bits and narrow afterwards — which is correct and costs a multi-word multiply on a 32-bit core. Or **restructure so the intermediate stays small**: apply the *correction* rather than the whole factor. A gain error of +20,000 ppm scales a reading by 1.02; multiplying by 1,020,000 and dividing by a million overflows, while adding `counts × 20,000 / 1,000,000` does not, because the intermediate is fifty times smaller. Lesson 534's per-device `gain_ppm` is exactly this computation, and this is exactly where it breaks.

One more detail separates a correct implementation from an almost-correct one: **integer division truncates**, and truncation is a bias, not a rounding. Every conversion that discards fractional bits should add half a unit first, or a chain of conversions accumulates an error that always points the same way — the same argument Lesson 533 makes about resolution, one layer down.

```quiz
- q: "Why can a calibration multiply overflow when the inputs and the result both fit comfortably in 32 bits?"
  anchor: "The product of two scaled integers needs more bits than either of them"
  options:
    - text: "Because the compiler promotes to a smaller type inside expressions"
      correct: false
      why: "The promotion rules are not the issue; the intermediate genuinely needs more bits than the operands."
    - text: "Because the intermediate product is much larger than either operand or the final answer"
      correct: true
      why: "The scale is multiplied in before it is divided back out, and the peak is between the two."
    - text: "Because fixed-point values are stored as signed and lose one bit"
      correct: false
      why: "The sign bit costs one bit of range; the overflow here is orders of magnitude, not one bit."

- q: "A reading must be scaled by a gain factor of 1.02 on a 32-bit core with no 64-bit multiply. What is the cheapest correct approach?"
  anchor: "apply the *correction* rather than the whole factor"
  options:
    - text: "Convert to float for that one operation"
      correct: false
      why: "It works, but it pulls in the soft-float library for a computation that does not need it."
    - text: "Add counts × 20,000 / 1,000,000 to the reading, so the intermediate stays small"
      correct: true
      why: "The correction's intermediate is about fifty times smaller than the full-factor one."
    - text: "Divide by 1,000,000 first, then multiply by 1,020,000"
      correct: false
      why: "Dividing first throws away the precision the calibration was meant to add."

- q: "What is wrong with discarding fractional bits by shifting or dividing?"
  anchor: "integer division truncates"
  options:
    - text: "Nothing, provided the result is only used for display"
      correct: false
      why: "The bias accumulates through a chain of conversions long before display."
    - text: "It truncates rather than rounds, so the error always points the same way and accumulates"
      correct: true
      why: "Adding half a unit before the division turns a systematic bias into ordinary rounding."
    - text: "It is undefined behaviour for negative values"
      correct: false
      why: "It is implementation-defined in older standards and well-defined now -- but the bias is the practical problem."
```

## Key Concepts
- **Floats are not free**: no FPU means a software library; an FPU means extra context in an interrupt handler
- **Fixed point is integers plus an agreed scale** — 2345 centi-degrees, or Q16.16 where 65,536 means 1.0
- **Add, subtract and compare are ordinary integer operations** at the same scale
- **The product of two scaled integers needs more bits than either of them** — the overflow is in the middle, unsignalled
- **It appears only at large inputs**, which are the readings that matter most
- **Fix 1: widen the intermediate** to 64 bits, then narrow — correct, costs a multi-word multiply
- **Fix 2: apply the correction, not the whole factor** — `counts × ppm / 1e6` keeps the intermediate small
- **Integer division truncates** — add half a unit before dividing or the bias accumulates (Lesson 533)

## Example Code
Lesson 534's per-device gain correction, computed three ways on a 32-bit machine:

```typescript run
/** `Math.imul` is JavaScript's 32-bit integer multiply -- it wraps exactly as
 *  a 32-bit register does, which is what makes it the right tool for showing
 *  what the device would compute. */
const PPM = 1_000_000;

/** Scale by (1 + gain), full factor, 32-bit intermediate. */
function naive32(counts: number, gainPpm: number): number {
  const factor = PPM + gainPpm; // 1_020_000 for +2%
  return Math.trunc(Math.imul(counts, factor) / PPM); // the intermediate wraps
}

/** Same thing with an intermediate wide enough to hold the product. */
function widened(counts: number, gainPpm: number): number {
  const factor = PPM + gainPpm;
  return Math.trunc((counts * factor) / PPM); // exact: a JS number holds it
}

/** Apply only the correction, so the intermediate never grows. */
function corrected(counts: number, gainPpm: number): number {
  return counts + Math.trunc(Math.imul(counts, gainPpm) / PPM);
}

const GAIN_PPM = 20_000; // +2%, a plausible per-device gain error (Lesson 534)

console.log(`gain correction of ${GAIN_PPM} ppm (x${(1 + GAIN_PPM / PPM).toFixed(2)}), three implementations:`);
console.log('     counts     naive32      widened    corrected   32-bit product');
for (const counts of [100, 1_000, 2_000, 4_000, 20_000, 65_535]) {
  const product = counts * (PPM + GAIN_PPM);
  const overflows = product > 2 ** 31 - 1;
  console.log(
    `  ${String(counts).padStart(9)}  ${String(naive32(counts, GAIN_PPM)).padStart(10)}   ${String(widened(counts, GAIN_PPM)).padStart(10)}   ${String(corrected(counts, GAIN_PPM)).padStart(10)}   ${overflows ? 'OVERFLOWS' : 'fits'}`
  );
}

console.log('');
console.log('The naive version is correct up to 2,105 counts and then silently wrong.');
console.log('A 12-bit converter crosses that at about half of full scale; a 16-bit one');
console.log('crosses it in the first few percent. Nothing warns, and the wrong values are');
console.log('the large ones -- the hot day, the full tank, the peak load.');
console.log('');

// --- truncation bias ---
const raw = [1234, 1235, 1236, 1237, 1238]; // milli-degrees
let truncated = 0;
let rounded = 0;
for (const r of raw) {
  truncated += Math.trunc(r / 10); // discard the fraction
  rounded += Math.trunc((r + 5) / 10); // add half a unit first
}
const exact = raw.reduce((a, b) => a + b, 0) / 10;
console.log(`converting ${raw.length} milli-degree readings to centi-degrees and summing:`);
console.log(`  truncating          : ${truncated}   (${(truncated - exact).toFixed(0)} against exact)`);
console.log(`  adding half first   : ${rounded}   (+${(rounded - exact).toFixed(0)} against exact)`);
console.log(`  exact               : ${exact}`);
console.log('Truncation lost a unit on every one of the five, always downward. Rounding is');
console.log('off by one here and its errors cancel as the sample grows, because they point');
console.log('both ways. A systematic downward drift looks exactly like the sensor\'s own');
console.log('offset error, which is how it survives review (Lesson 534).');
```

## When to Use
- On any part without an FPU, where every float operation is a library call with a code-size cost
- Inside interrupt handlers even on parts with an FPU, where floating-point context is extra state to preserve
- When applying calibration (Lesson 534), which is the multiply where the intermediate overflow actually happens
- When a value must be exact at a known scale — centi-degrees, milli-volts, ppm — rather than nearly right in binary floating point
- When a computation is correct in testing with small inputs and wrong in the field with large ones

## Common Mistakes
- **Multiplying by the full factor before dividing the scale out** — the intermediate is the largest value in the expression
- **Assuming an overflow will be noticed** — nothing is raised; the result is simply a different number
- **Testing with small readings only** — the bug is invisible below the boundary and unavoidable above it
- **Dividing first to avoid overflow** — that discards the precision the calibration existed to supply
- **Truncating at every conversion** — the bias always points one way and adds up over a chain (Lesson 533)
- **Mixing scales silently** — centi-degrees added to milli-degrees compiles perfectly and is wrong by a factor of ten

## Further Reading
- [Fixed-Point Arithmetic: An Introduction (Randy Yates, Digital Signal Labs)](https://www.digitalsignallabs.com/downloads/fp.pdf) — Q notation, range and precision, and the rules for products and sums
- [ARM Cortex-M4 Devices Generic User Guide (ARM DUI 0553)](https://developer.arm.com/documentation/dui0553/latest/) — the floating-point unit as an optional extension, and the context it adds to an exception
- [Lesson 533](/courses/iot-hardware-basics/from-counts-to-degrees) — the two lossy conversions this arithmetic carries, and the resolution lost at each
- [Lesson 534](/courses/iot-hardware-basics/sensor-error) — the per-device offset and `gain_ppm` that make this multiply a real one rather than an example

```recall
- q: "Why is a float not free on a microcontroller?"
  must:
    - "many parts have no FPU, so every operation becomes a software library call costing code space and cycles"
    - "parts that have one are usually single precision"
    - "and using floating point in an interrupt handler adds registers to the context that must be preserved"

- q: "Where does a fixed-point calibration multiply overflow, and why is it dangerous?"
  must:
    - "in the intermediate product, which needs more bits than the operands or the result"
    - "nothing signals the overflow -- the value is simply wrong"
    - "and it only happens at large inputs, which are the readings that matter most"

- q: "Give the two ways to make a fixed-point multiply safe."
  must:
    - "widen the intermediate to 64 bits and narrow afterwards"
    - "or apply only the correction rather than the whole factor, keeping the intermediate small"
    - "and add half a unit before any division that discards fractional bits, or the truncation bias accumulates"
```
