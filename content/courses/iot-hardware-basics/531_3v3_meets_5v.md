# 531. 3.3 V Meets 5 V: Logic Thresholds and the Board You Killed

## What It Is
Two boards that work perfectly alone can destroy each other the moment they are wired together, and the reason is that "logic high" is not one voltage. A pin that outputs a "1" drives to near its own supply; a pin that reads a "1" compares against its own thresholds. Connect a 5 V output to a 3.3 V input and you are pushing 5 V into a pin rated for 3.6, which conducts through the input's protection diode into the 3.3 V rail — and the board dies slowly, over minutes to days, as that diode cooks.

Every logic input has two named thresholds. **VIH** is the minimum voltage guaranteed to read as a "1"; **VIL** is the maximum guaranteed to read as a "0". Between them is undefined. Every output has **VOH** (the minimum it drives for a "1") and **VOL** (the maximum for a "0"). A link works only if the driver's VOH clears the receiver's VIH *and* the driver's VOL is below the receiver's VIL — with margin, at the temperature and supply extremes (Lesson 526).

The two directions fail differently. **5 V output → 3.3 V input** is an overvoltage: it usually reads fine and slowly damages the input, unless the input is marked "5 V tolerant" in the datasheet. **3.3 V output → 5 V input** is a marginal high: 3.3 V may sit below a 5 V part's VIH (often 3.5 V or 0.7 × Vdd = 3.5 V), so it reads unreliably — no damage, just an intermittent link that gets worse when the board warms up.

The fix is a **level shifter** — a small circuit or chip that translates between the two domains. For a slow open-drain line a single MOSFET does it; for a fast push-pull line a dedicated level-shifter IC does. What you must not do is "it seems to work on the bench": a marginal level difference is a field failure waiting for a temperature change.

```quiz
- q: "You connect a 5 V sensor's digital output directly to a 3.3 V MCU input that is not marked '5 V tolerant'. It reads correctly. What is happening?"
  anchor: "the board dies slowly, over minutes to days, as that diode cooks"
  options:
    - text: "Nothing wrong — 5 V reads as a solid high on a 3.3 V input"
      correct: false
      why: "It reads high, but 5 V exceeds the pin's absolute maximum and current is flowing through the input protection diode into the 3.3 V rail."
    - text: "The 5 V is forward-biasing the input protection diode into the 3.3 V rail; the pin degrades over minutes to days"
      correct: true
      why: "The failure is slow and the bench test passes, which is exactly why it reaches the field."
    - text: "The MCU automatically clamps the input to 3.3 V with no ill effect"
      correct: false
      why: "The clamp diode is not rated for continuous current. Clamping is a survival feature for transients, not a design method."

- q: "A 3.3 V output drives a 5 V logic input. No damage occurs, but the link is intermittent and worse when warm. Why?"
  anchor: "3.3 V may sit below a 5 V part's VIH"
  options:
    - text: "The 3.3 V output cannot source enough current"
      correct: false
      why: "Current is not the issue for a logic input (it draws almost none). The voltage level is."
    - text: "3.3 V is below the 5 V part's guaranteed VIH (often ~3.5 V), so it is in the undefined region and reads unreliably"
      correct: true
      why: "It is a marginal high. Temperature shifts the thresholds, so a link that passed at 25 °C fails at 60 °C."
    - text: "The 5 V part is drawing current back into the 3.3 V output"
      correct: false
      why: "A logic input does not source current back. The problem is the input threshold, not a reverse current."
```

## Key Concepts
- **"Logic high" is not one voltage** — each pin drives and reads against its own supply and thresholds
- **VIH**: minimum input voltage guaranteed to read "1"; **VIL**: maximum guaranteed to read "0"; between them is undefined
- **VOH / VOL**: what an output actually drives for "1" and "0"
- **A link works only if** VOH > VIH and VOL < VIL, with margin, over temperature and supply extremes
- **5 V out → 3.3 V in** is an overvoltage — reads fine, damages the input slowly, unless the input is "5 V tolerant"
- **3.3 V out → 5 V in** is a marginal high — no damage, unreliable reads, worse when warm
- **The fix is a level shifter** — a MOSFET for a slow open-drain line, a dedicated IC for a fast one
- **"Works on the bench" is not a pass** — a marginal level is a field failure waiting for a temperature change

## Example Code
Given two supply voltages, does a direct connection work in each direction — and is it safe?

```typescript run
/** Rough threshold model: VIH ≈ 0.7·Vdd, VIL ≈ 0.3·Vdd, an output drives to
 *  ~Vdd for a 1 and ~0 for a 0. Absolute-max input is ~Vdd + 0.3 unless the
 *  pin is 5 V tolerant. Real numbers are per-datasheet (Lesson 526); this is
 *  the shape of the check. */
function link(driverVdd: number, receiverVdd: number, receiverIs5vTolerant: boolean) {
  const vOH = driverVdd * 0.9;
  const vIH = receiverVdd * 0.7;
  const absMaxIn = receiverIs5vTolerant ? 5.5 : receiverVdd + 0.3;

  const readsHigh = vOH >= vIH;
  const safe = driverVdd <= absMaxIn;

  return {
    readsHigh,
    safe,
    verdict: !safe
      ? 'DAMAGES the input — needs a level shifter'
      : !readsHigh
        ? 'marginal high — unreliable, needs a level shifter'
        : 'direct connection ok',
  };
}

const cases = [
  { from: 3.3, to: 3.3, tol: false },
  { from: 5.0, to: 3.3, tol: false },
  { from: 5.0, to: 3.3, tol: true },
  { from: 3.3, to: 5.0, tol: false },
];

for (const c of cases) {
  const r = link(c.from, c.to, c.tol);
  console.log(
    `${c.from} V -> ${c.to} V${c.tol ? ' (5V-tolerant)' : ''}`.padEnd(28) +
      ` reads high: ${String(r.readsHigh).padEnd(5)}  safe: ${String(r.safe).padEnd(5)}  ${r.verdict}`
  );
}

console.log('');
console.log('Only 3.3->3.3 and 5->3.3-tolerant are direct connections. 5->3.3 non-tolerant');
console.log('damages the part; 3.3->5 reads marginally. Both need a level shifter, and the');
console.log('bench will not tell you — the 5->3.3 case reads correctly right up until it fails.');
```

## When to Use
- Before wiring any two boards or modules together — check both supplies and the datasheet thresholds
- When a datasheet says "5 V tolerant" for some pins — it is per-pin, not per-chip; check the pin you are using
- When a link is intermittent and temperature-dependent — suspect a marginal logic level before suspecting noise
- When designing a board that talks to both 3.3 V and 5 V parts — plan the level shifters in, do not bodge them later
- When a working prototype fails in a hot enclosure — recheck every cross-voltage interface against the hot-temperature thresholds

## Common Mistakes
- **Connecting a 5 V output to a non-tolerant 3.3 V input** — it reads fine and kills the pin over days
- **Driving a 5 V input from 3.3 V and calling a bench pass a design pass** — 3.3 V is often below VIH and fails when warm
- **Relying on the input clamp diode** — it is rated for transients, not continuous current
- **Assuming "5 V tolerant" applies to the whole chip** — it is usually a subset of pins, listed individually
- **Using a plain resistor divider as a level shifter on a fast line** — it works for slow signals but the RC roll-off kills a fast bus (Lesson 528)
- **Ignoring the supply and temperature extremes** — thresholds shift, and the margin you need is at the corners, not at 25 °C and nominal Vdd

## Further Reading
- [TI: Logic Guide — voltage thresholds and level translation (SCYT129)](https://www.ti.com/lit/sg/scyt129e/scyt129e.pdf) — VIH/VIL/VOH/VOL across logic families, and which translator for which case
- [NXP AN10441: Level shifting techniques in I²C-bus design](https://www.nxp.com/docs/en/application-note/AN10441.pdf) — the single-MOSFET open-drain level shifter, derived
- [Lesson 526](/courses/iot-hardware-basics/reading-a-datasheet) — where the real threshold numbers live, and why the "typ" column is not one of them

```recall
- q: "Name the four logic-level parameters and the condition for a link to work."
  must:
    - "VIH (min input for a 1), VIL (max input for a 0), VOH (output high), VOL (output low)"
    - "the link works only if VOH > VIH and VOL < VIL"
    - "with margin, at the temperature and supply extremes"

- q: "How do the two cross-voltage directions fail differently?"
  must:
    - "5 V out → 3.3 V in: overvoltage, reads fine, damages the input slowly (unless 5 V tolerant)"
    - "3.3 V out → 5 V in: no damage, but 3.3 V may be below the 5 V part's VIH, so reads are unreliable"
    - "the second gets worse with temperature"

- q: "Why is 'it works on the bench' not a valid test for a cross-voltage link?"
  must:
    - "the 5 V → 3.3 V case reads correctly while it slowly damages the pin"
    - "the 3.3 V → 5 V case passes at 25 °C and fails when the board warms"
    - "the fix is a level shifter, designed in, not a bench observation"
```
