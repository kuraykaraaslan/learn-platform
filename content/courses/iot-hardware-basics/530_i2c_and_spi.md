# 530. I²C and SPI: Addresses, Chip Selects, and Why the Bus Dies at Three Metres

## What It Is
I²C and SPI are the two buses that connect a microcontroller to the chips around it — sensors, memory, displays. They solve the same problem differently, and Lesson 529's failure class (wiring) is mostly behind you here; what bites on these buses is **budget**: how many devices, how much capacitance, how many select lines, how far.

**I²C** is two wires — clock (SCL) and data (SDA) — shared by every device, both open-drain (Lesson 528) with pull-ups. Each device has a 7-bit **address**, and the controller starts every transaction by putting an address on the bus; the addressed device responds. The budget limits: the pull-ups must charge the shared bus capacitance fast enough for the clock (Lesson 528's `ts run`), so more devices and longer wires force a slower clock or stronger pull-ups; and two devices with the **same fixed address** cannot share a bus at all — many sensors offer only two address options via one pin, so three of the same part need a second bus or an address translator.

**SPI** is four wires — clock, data-out (MOSI), data-in (MISO), and one **chip-select** per device — and it is push-pull, not open-drain, so it runs much faster and much further. The cost is a dedicated select line for every device: eight devices need eight select pins, and a design that runs out of pins ends up multiplexing selects, which reintroduces the complexity SPI avoided.

Both buses **die over distance** for the same underlying reason — a wire is a transmission line, and a metre of ribbon cable is tens to hundreds of picofarads of capacitance and some inductance. I²C, being open-drain and slow-rising, degrades first, often before a metre. SPI tolerates more but rings and reflects past a couple of metres. Neither was designed to leave the board, and a sensor "three metres away on an I²C bus" is a design that will work intermittently and blame the sensor. Distance is Lesson 536's subject, with the buses built for it.

```quiz
- q: "You need three of the same I²C temperature sensor on one node. The part has one address-select pin (two possible addresses). What do you do?"
  anchor: "three of the same part need a second bus or an address translator"
  options:
    - text: "Put all three on the bus — I²C handles many devices"
      correct: false
      why: "It handles many *addresses*. Two of the three sensors would share an address and collide."
    - text: "Use a second I²C bus, an I²C multiplexer, or an address-translator — two of the three would otherwise share an address"
      correct: true
      why: "Fixed-address collisions cannot be resolved on one bus; you need to separate them."
    - text: "Assign each a different address in firmware"
      correct: false
      why: "The address is set by hardware (the select pin and the part's fixed bits), not by firmware."

- q: "Why does an I²C bus fail over distance before an SPI bus does?"
  anchor: "I²C, being open-drain and slow-rising, degrades first"
  options:
    - text: "I²C uses higher voltages that attenuate faster"
      correct: false
      why: "They use the same logic levels. The difference is the drive: open-drain with a pull-up vs push-pull."
    - text: "I²C is open-drain, so a pull-up has to drag the line up through the cable's capacitance every rising edge; SPI drives both ways actively"
      correct: true
      why: "The slow RC rise (Lesson 528) is the limit. SPI's active push-pull drive charges and discharges the line, so it goes faster and further."
    - text: "SPI has error correction and I²C does not"
      correct: false
      why: "Neither has error correction at this layer. The difference is purely the electrical drive."
```

## Key Concepts
- **I²C**: two shared open-drain wires (SCL, SDA) with pull-ups; each device has a 7-bit address
- **I²C budget**: pull-ups vs bus capacitance sets the clock ceiling (Lesson 528); same-address parts cannot share a bus
- **SPI**: four wires (clock, MOSI, MISO) plus **one chip-select per device**; push-pull, fast, longer reach
- **SPI budget**: a select pin per device — eight devices, eight pins, or a multiplexer
- **Both buses degrade over distance** — a cable is capacitance and inductance, not an ideal wire
- **I²C degrades first**, often within a metre; SPI rings and reflects past a couple of metres
- **Neither was designed to leave the board** — distance needs a bus built for it (Lesson 536)

## Example Code
The pull-up that an I²C bus can tolerate has a floor and a ceiling, and they can cross — at which point the bus is simply not viable at that length:

```typescript run
/** I²C pull-up bounds, from the two constraints that fight each other:
 *  - MINIMUM resistance: each device sinks (Vdd − Vol) / R when it pulls low,
 *    and must not exceed its rated sink current (3 mA for standard I²C).
 *  - MAXIMUM resistance: the RC rise (Lesson 528) must finish inside the
 *    clock's allowed rise time.
 *  When min > max, there is no working value. */
function i2cPullupWindow(vddV: number, busCapF: number, maxRiseSec: number, maxSinkA: number) {
  const vol = 0.4; // guaranteed low-level output voltage
  const rMin = (vddV - vol) / maxSinkA;
  // rise to 70% of Vdd: t = R·C·ln(1/(1−0.7)) = R·C·1.204
  const rMax = maxRiseSec / (busCapF * 1.204);
  return { rMin, rMax, viable: rMin < rMax };
}

const VDD = 3.3;
const MAX_SINK = 3e-3; // standard-mode I²C
for (const [desc, capF, mode, riseSec] of [
  ['on-board, 100 kHz', 60e-12, 'standard', 1000e-9],
  ['0.5 m cable, 100 kHz', 150e-12, 'standard', 1000e-9],
  ['2 m cable, 100 kHz', 400e-12, 'standard', 1000e-9],
  ['2 m cable, 400 kHz', 400e-12, 'fast', 300e-9],
] as const) {
  const w = i2cPullupWindow(VDD, capF as number, riseSec as number, MAX_SINK);
  console.log(
    `${desc.padEnd(22)} pull-up must be ${(w.rMin / 1000).toFixed(1)}k .. ${(w.rMax / 1000).toFixed(1)}k` +
      `   ${w.viable ? 'ok' : 'NO WORKING VALUE — bus not viable here'}`
  );
}

console.log('');
console.log('At 2 m and 400 kHz the minimum pull-up (from sink current) is above the maximum');
console.log('(from rise time): the window is empty. No resistor value works. The answer is');
console.log('not a better resistor — it is a different bus (Lesson 536).');
```

Choosing between them for a given board:

```tradeoff
question: "Connect a set of on-board sensors over I²C or over SPI?"
sides:
  - name: "I²C"
    wins_when:
      - signal: "you are pin-constrained — the whole sensor set costs two pins regardless of how many devices, measured against the MCU's free GPIO count"
      - signal: "the devices have distinct addresses (or address-select pins), confirmed against each part's datasheet address table"
      - signal: "the data rate per device is low — a few readings per second — so 100–400 kHz shared across the bus is ample"
  - name: "SPI"
    wins_when:
      - signal: "one device needs real throughput — a display, an ADC streaming samples, a flash chip — where I²C's shared clock would be the bottleneck"
      - signal: "two or more devices are the same fixed-address part, which cannot coexist on one I²C bus"
      - signal: "you have a spare GPIO per device for chip-select, counted against the board's pin budget with margin for the ones you forgot"
```

## When to Use
- When adding a sensor — check its bus, its address options, and whether an address collides with something already there
- When an I²C bus is flaky — measure the rise time, check the pull-up against the window above, count the devices
- When choosing SPI — count the chip-select pins you will need against the pins you have
- When a sensor must be more than ~0.5 m from the MCU — do not extend I²C; use a bus designed for the distance (Lesson 536)
- When two identical I²C parts are required — plan for a second bus or a multiplexer from the start

## Common Mistakes
- **Putting two fixed-address I²C parts on one bus** — they collide and neither is reliably addressable
- **Extending an I²C bus down a cable** — the rise time blows past the clock's budget and the bus fails intermittently
- **Fighting a flaky I²C bus with a stronger pull-up** — past a point the minimum (sink current) and maximum (rise time) cross and no value works
- **Forgetting SPI needs a select pin per device** — the pin count is the constraint, and multiplexing selects adds back the complexity
- **Trusting internal pull-ups for I²C** — their tolerance is too wide for anything but a short on-board bus (Lesson 528)
- **Blaming the sensor for a distance problem** — a metre of I²C cable is the fault, not the part at the end of it

## Further Reading
- [NXP UM10204 — I²C-bus specification and user manual, Rev. 7.0 (1 October 2021)](https://www.nxp.com/docs/en/user-guide/UM10204.pdf) — the addressing, the electrical spec, and the rise-time and pull-up equations, with the revision and date to cite
- [Motorola/NXP SPI Block Guide](https://web.archive.org/web/20150413003534/http://www.ee.nmt.edu/~teare/ee308l/datasheets/S12SPIV3.pdf) — SPI has no formal standard; this is the de-facto reference, and the four clock modes are a convention, not a spec
- [TI SLVA704: Understanding the I²C Bus](https://www.ti.com/lit/an/slva704/slva704.pdf) — the same bus explained around its failure modes

```recall
- q: "Contrast I²C and SPI in wiring and in what limits each."
  must:
    - "I²C: two shared open-drain wires, 7-bit addresses; limited by pull-up-vs-capacitance and address collisions"
    - "SPI: clock + two data wires + one chip-select per device; push-pull, faster, further"
    - "SPI's limit is the chip-select pin count"

- q: "Why does an I²C bus die over distance sooner than SPI?"
  must:
    - "I²C is open-drain: a pull-up drags the line high through the cable capacitance every rising edge"
    - "the RC rise time exceeds the clock budget past a short distance"
    - "SPI actively drives the line both ways, so it tolerates more capacitance"

- q: "What do you do when two identical fixed-address I²C parts are required on one node?"
  must:
    - "they cannot share one bus — the addresses collide"
    - "use a second I²C bus, an I²C multiplexer, or an address translator"
    - "the address is hardware-set, not a firmware choice"
```
