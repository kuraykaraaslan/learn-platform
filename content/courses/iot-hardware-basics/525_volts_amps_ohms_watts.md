# 525. Volts, Amps, Ohms, Watts: The Four Numbers Behind Most Field Failures

## What It Is
Four quantities describe almost every electrical fault a sensor node has in the field, and they are related by two equations you never have to memorise once you have used them a few times as a debugging tool rather than a formula.

**Voltage** is a difference in electrical potential between two points, measured in volts. It is always *between* two points — "the voltage at pin 7" is shorthand for "the voltage between pin 7 and the board's ground", and forgetting the second point is the source of a large fraction of confusing measurements. **Current** is the rate of charge flow through a point, measured in amps (field electronics lives in milliamps and microamps). Current flows *through* a component; voltage appears *across* it. **Resistance** is how much a component opposes current, in ohms. **Power** is the rate at which electrical energy becomes heat or work, in watts.

The two equations: **Ohm's law**, `V = I × R` — the voltage across a resistance equals the current through it times the resistance. And **power**, `P = V × I` — which combines with Ohm's law into `P = I²R` and `P = V²/R`. That is the whole toolkit.

It is a debugging tool because every term is measurable and the equations must balance. A regulator output that reads 2.9 V instead of 3.3 V is dropping 0.4 V somewhere; if you know the current, Ohm's law tells you the resistance that is causing it, and a 0.4 V drop at 100 mA is a 4-ohm resistance that should not be there — a corroded joint, a thin wire, an under-rated connector. A component running hot is dissipating power you can calculate; if `V²/R` comes out to 2 watts in a part rated for 0.25, the part is wrong or the voltage is.

```quiz
- q: "What does 'the voltage at pin 7' actually mean?"
  anchor: "the voltage between pin 7 and the board's ground"
  options:
    - text: "The absolute electrical potential of pin 7"
      correct: false
      why: "There is no absolute potential to measure — voltage is always a difference between two points."
    - text: "The voltage between pin 7 and the board's ground, with ground as the implied second point"
      correct: true
      why: "Every single-point voltage is shorthand for a difference against an agreed reference, usually ground."
    - text: "The current flowing into pin 7"
      correct: false
      why: "Current flows through a point; voltage is measured across two points. They are different quantities."

- q: "A 3.3 V regulator output reads 2.9 V at the far end of a cable carrying 100 mA. What does Ohm's law tell you?"
  anchor: "a 0.4 V drop at 100 mA is a 4-ohm resistance that should not be there"
  options:
    - text: "The regulator is faulty and must be replaced"
      correct: false
      why: "The regulator may be fine — the drop is across the path between it and the measurement point."
    - text: "There is about 4 ohms of unwanted resistance in the path: 0.4 V / 0.1 A"
      correct: true
      why: "A corroded joint, an undersized wire or a poor connector. The number points you at the physical fault."
    - text: "Nothing — voltage drop over a cable is normal and cannot be quantified"
      correct: false
      why: "It is entirely quantifiable, and 4 ohms in a signal or power path is not normal."
```

## Key Concepts
- **Voltage** is a difference between two points (volts) — always name both
- **Current** flows *through* a point (amps; field work is mA and µA)
- **Resistance** opposes current (ohms)
- **Power** is energy per second becoming heat or work (watts)
- **Ohm's law**: `V = I × R` — voltage across a resistance = current through it × the resistance
- **Power**: `P = V × I`, and by substitution `P = I²R` and `P = V²/R`
- **The equations must balance** — an unexplained voltage drop is a resistance you can calculate and then go find
- **A part running hot** is dissipating a wattage you can compute and compare to its rating
- **"Across" vs "through"** — voltage is measured across a component, current through it

## Example Code
The same 5 V supply feeding three different loads, and what Ohm's law and the power equation say about each:

```typescript run
/** A load defined by its resistance, on a fixed supply. Everything else is
 *  derived — this is Ohm's law and P = VI used as a calculator. */
function analyse(supplyV: number, resistanceOhms: number, ratedPowerW: number) {
  const current = supplyV / resistanceOhms; // I = V / R
  const power = supplyV * current; // P = V * I
  const overRating = power / ratedPowerW;
  return {
    current_mA: current * 1000,
    power_W: power,
    verdict:
      overRating > 1 ? `OVER by ${overRating.toFixed(1)}x — part will overheat` : `within rating (${(overRating * 100).toFixed(0)}%)`,
  };
}

const SUPPLY = 5.0;
const loads = [
  { name: 'LED + 330R series resistor', r: 330, rated: 0.25 },
  { name: 'pull-up 4.7k to 5V', r: 4700, rated: 0.125 },
  { name: 'wrong resistor: 47R where 4.7k was meant', r: 47, rated: 0.25 },
];

for (const load of loads) {
  const a = analyse(SUPPLY, load.r, load.rated);
  console.log(
    `${load.name.padEnd(38)} ${a.current_mA.toFixed(2).padStart(8)} mA   ${a.power_W.toFixed(3).padStart(7)} W   ${a.verdict}`
  );
}

console.log('');
console.log('The 47R part draws 106 mA and dissipates 0.53 W in a 0.25 W resistor — it runs');
console.log('at more than twice its rating and will discolour, drift, then fail. The fault is');
console.log('one wrong digit in a resistor value, and the power equation finds it before the');
console.log('smell does.');
```

## When to Use
- Any time a supply voltage reads lower than expected — the drop is a resistance you can locate
- When a component runs hot — compute its dissipation and compare to the rating before guessing
- When sizing a series resistor for an LED, a pull-up, or a current-limit — Ohm's law gives the value directly
- When a battery drains faster than the budget said — the extra current is somewhere, and it obeys these equations (Lesson 537)
- When reading a schematic and a resistor value looks odd — check what current and power it implies

## Common Mistakes
- **Measuring a voltage without naming the reference point** — "3.3 V" against the wrong ground is a different, often meaningless, number
- **Confusing current rating with current draw** — a 2 A supply does not push 2 A through a load; the load's resistance and Ohm's law decide the current
- **Ignoring a small voltage drop** — 0.3 V lost in a connector at 200 mA is 60 mW of heat in that connector and a sign it is failing
- **Sizing a resistor by value alone** — a 100R resistor across 12 V dissipates 1.44 W and needs a 2 W part, not the default 0.25 W one
- **Treating Ohm's law as exam material** — it is a field instrument; every term is something you can put a meter on
- **Assuming the regulator is at fault when its output sags** — measure at the regulator pin and at the load; the difference is the path resistance

## Further Reading
- [SparkFun: Voltage, Current, Resistance, and Ohm's Law](https://learn.sparkfun.com/tutorials/voltage-current-resistance-and-ohms-law) — the same four quantities with bench photos
- [Analog Devices MT-101: Decoupling Techniques](https://www.analog.com/media/en/training-seminars/tutorials/MT-101.pdf) — why a transient current draw shows up as a voltage dip, and what fixes it
- [NIST: SI base units and derived units](https://www.nist.gov/pml/owm/metric-si/si-units) — the definitions behind volt, ampere, ohm and watt
- [EEVblog #202: How to design a resistive voltage divider](https://www.eevblog.com/) — the power-rating check for a divider resistor, worked on the bench

```recall
- q: "State the two equations that relate voltage, current, resistance and power."
  must:
    - "Ohm's law: V = I × R"
    - "power: P = V × I"
    - "combined: P = I²R and P = V²/R"

- q: "Why is Ohm's law described as a debugging tool rather than a formula?"
  must:
    - "every term is measurable with a meter"
    - "the equations must balance, so an unexplained drop is a resistance you can calculate"
    - "e.g. 0.4 V lost at 100 mA is 4 ohms of unwanted resistance to go find"

- q: "What is the difference between 'across' and 'through'?"
  must:
    - "voltage is measured across a component, between its two terminals"
    - "current flows through a component"
    - "and a single-point voltage always implies a second reference point, usually ground"
```
