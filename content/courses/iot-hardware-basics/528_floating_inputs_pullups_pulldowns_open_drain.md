# 528. Floating Inputs, Pull-ups, Pull-downs, and Open Drain

## What It Is
A digital input pin that is not connected to anything is **floating**: its voltage is undefined, set by leakage, nearby signals and static, and it will read 0 and 1 unpredictably — often reading whatever you last touched near the board. This is the mechanism behind Lesson 524's "a disconnected sensor reads whatever the input floats to", and it is why a switch wired between a pin and ground, with nothing else, does not work: closed, the pin is ground; open, the pin is floating.

The fix is a **pull resistor**. A **pull-up** connects the pin to the supply through a resistor (typically 4.7 kΩ–100 kΩ), so the pin sits at the supply when nothing else drives it, and an external device pulls it low to signal. A **pull-down** does the mirror image to ground. The resistor is large enough that whatever drives the pin the other way wins easily, and small enough that leakage and noise do not move the pin. Many MCUs have internal pull-ups and pull-downs you enable in firmware — convenient, but their value is loosely specified (often 10 kΩ–50 kΩ), so a bus with tight timing needs external resistors of a known value (Lesson 530).

**Open-drain** (or open-collector) outputs can only pull the line low or release it — they never drive it high. On their own they do nothing; they need a pull-up to define the released state. This is not a limitation, it is the enabling trick for a **shared bus**: several devices can share one line, any of them can pull it low, and nobody fights because nobody drives high. I²C works this way, and so does an interrupt line shared by several sensors, and a "device ready" signal. The cost is speed — the pull-up has to charge the line's capacitance on every low-to-high transition, and Lesson 530 turns that into the reason an I²C bus dies at a few metres.

```quiz
- q: "A push-button is wired between a GPIO pin and ground, with no other components. The firmware reads the pin. What happens?"
  anchor: "closed, the pin is ground; open, the pin is floating"
  options:
    - text: "It reads 1 when open and 0 when pressed — a working button"
      correct: false
      why: "Only the pressed case is defined. Open, the pin floats and reads unpredictably."
    - text: "Pressed reads 0; released, the pin floats and reads 0 or 1 at random — you need a pull-up"
      correct: true
      why: "A pull-up (external or the MCU's internal one) gives the released state a defined level."
    - text: "It damages the pin when the button is pressed"
      correct: false
      why: "Connecting an input to ground is harmless. The problem is the undefined open state."

- q: "Why does an open-drain output need a pull-up resistor?"
  anchor: "they never drive it high"
  options:
    - text: "To limit the current when the output drives high"
      correct: false
      why: "An open-drain output never drives high — that is the point. There is no high-drive current to limit."
    - text: "Because it can only pull low or release; the pull-up defines the voltage when every device has released the line"
      correct: true
      why: "It is what lets several devices share one line — any can pull low, none drives high, so none fight."
    - text: "Pull-ups are optional on open-drain outputs and only improve noise immunity"
      correct: false
      why: "Without one, the released state is floating and undefined — the output is unusable."
```

## Key Concepts
- **A floating input** has an undefined voltage and reads 0/1 unpredictably (Lesson 524's disconnected-sensor mechanism)
- **A pull-up** ties the pin to supply through a resistor; **a pull-down** ties it to ground — defining the idle state
- **Resistor value**: large enough that an active driver wins, small enough that noise and leakage do not (4.7 kΩ–100 kΩ)
- **Internal MCU pulls** are convenient but loosely specified — use external ones where the value matters (Lesson 530)
- **Open-drain outputs** only pull low or release — never drive high
- **Open-drain + pull-up = a shared bus** — any device pulls low, none drives high, none fights
- **Used by** I²C, shared interrupt lines, "device ready" signals
- **The cost is speed** — the pull-up must charge the line capacitance on every rising edge (Lesson 530)

## Example Code
The rising edge of an open-drain line is an RC charge curve — the pull-up resistance and the line capacitance set how long it takes, and that time is a hard limit on bus speed:

```typescript run
/** Time for an RC circuit to charge from 0 to a fraction of the supply.
 *  t = -R·C·ln(1 − fraction). This is why open-drain buses have a speed
 *  ceiling: the pull-up has to drag the line up through this curve every
 *  time a device releases it. */
function riseTimeSeconds(pullupOhms: number, capacitanceFarads: number, toFraction: number): number {
  return -pullupOhms * capacitanceFarads * Math.log(1 - toFraction);
}

// Rising to 70% of supply (a rough "recognised as high" threshold).
const THRESHOLD = 0.7;

// Line capacitance grows with length and the number of devices: a few pF per
// device pin, ~50–100 pF/m of ribbon or wire.
const scenarios = [
  { desc: 'short PCB trace, 2 devices', pF: 40, pullup_k: 4.7 },
  { desc: '0.3 m cable, 3 devices', pF: 90, pullup_k: 4.7 },
  { desc: '2 m cable, 4 devices', pF: 260, pullup_k: 4.7 },
  { desc: '2 m cable, stronger pull-up', pF: 260, pullup_k: 1.5 },
];

console.log('rise to 70% of supply:');
for (const s of scenarios) {
  const t = riseTimeSeconds(s.pullup_k * 1000, s.pF * 1e-12, THRESHOLD);
  // I²C fast mode (400 kHz) allows ~300 ns; standard mode (100 kHz) ~1000 ns.
  const verdict = t < 300e-9 ? 'ok for 400 kHz' : t < 1000e-9 ? 'ok for 100 kHz only' : 'too slow for I²C';
  console.log(`  ${s.desc.padEnd(32)} ${(t * 1e9).toFixed(0).padStart(5)} ns   ${verdict}`);
}

console.log('');
console.log('The 2 m run with a 4.7k pull-up rises in ~1470 ns — too slow for I²C at any');
console.log('standard clock. Dropping the pull-up to 1.5k gets it to ~470 ns (100 kHz ok)');
console.log('but raises the current each device sinks when it pulls low (Lesson 525). The');
console.log('value that fixes the timing is not the value that fixes the current, which is');
console.log('Lesson 530.');
```

## When to Use
- On every digital input driven by a switch, a jumper, or an open-drain device — it needs a defined idle level
- When an internal pull-up is "sometimes working" — its value is loose; fit an external one
- When several devices share an interrupt or status line — open-drain plus one pull-up is the pattern
- When an I²C or one-wire bus is unreliable over distance — the pull-up and capacitance are the first suspects (Lesson 530)
- When a button generates multiple events per press — that is contact bounce, a related but separate issue (Lesson 482)

## Common Mistakes
- **Reading a switch with no pull resistor** — the released state floats and the input is random
- **Trusting an internal pull-up for bus timing** — its resistance can be anywhere in a 5:1 range
- **Using an open-drain output with no pull-up** — the released state is undefined and the output does nothing
- **Choosing a pull-up that is too weak** — the line rises slowly and the bus speed drops or the bus fails
- **Choosing a pull-up that is too strong** — every device now sinks more current to pull low, and the low level may not be low enough
- **Confusing a floating-input glitch with contact bounce** — bounce is real switch chatter over milliseconds (Lesson 482); a float is undefined level with no switch action at all

## Further Reading
- [TI: Pull-up resistor calculation for I²C (SLVA689)](https://www.ti.com/lit/an/slva689/slva689.pdf) — the minimum and maximum pull-up from bus capacitance and sink current, worked
- [Nordic nRF52832 Product Specification — GPIO pull configuration](https://infocenter.nordicsemi.com/topic/ps_nrf52832/gpio.html) — one MCU's internal pull values and their tolerance
- [Lesson 482](/courses/iot-telemetry-edge/alerting-without-crying-wolf) — debounce and hysteresis: the switch-chatter problem a pull resistor does not solve

```recall
- q: "What is a floating input and how is it fixed?"
  must:
    - "an input connected to nothing — its voltage is undefined and it reads 0/1 unpredictably"
    - "a pull-up resistor ties it to supply, a pull-down ties it to ground, defining the idle level"
    - "the resistor is large enough that an active driver wins and small enough that noise does not move the pin"

- q: "What is an open-drain output and why does it need a pull-up?"
  must:
    - "it can only pull the line low or release it — it never drives high"
    - "the pull-up defines the voltage when all devices have released"
    - "this lets several devices share one line without fighting"

- q: "What is the speed cost of an open-drain bus?"
  must:
    - "the pull-up must charge the line's capacitance on every rising edge"
    - "rise time is roughly R·C, and it grows with cable length and device count"
    - "past some length the rise is too slow for the bus clock (Lesson 530)"
```
