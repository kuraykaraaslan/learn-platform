# 527. Pins: Input or Output, Digital or Analog — and What PWM Actually Is

## What It Is
A microcontroller pin is not one thing. It has a **direction** — input (the MCU reads a voltage the outside world sets) or output (the MCU drives the pin to a voltage) — and a **domain** — digital (only two meaningful states) or analog (a continuous voltage). The four combinations are four different jobs, and choosing the wrong one is a common early fault: reading a sensor's analog output on a digital input gives you a 0 or a 1 with a threshold you did not choose, and driving an LED from an analog input pin does nothing at all.

A **digital input** reports one bit: is the voltage above or below a threshold. A **digital output** drives the pin to roughly the supply rail (a "1") or to ground (a "0"), and it can source or sink a limited current — exceed it and the output voltage sags or the pin is damaged (Lesson 525's power equation applies). An **analog input** feeds an ADC (Lesson 533) that turns the voltage into a number. A true **analog output** — a DAC — exists on some MCUs and produces an arbitrary voltage; most MCUs do not have one, and what they offer instead is PWM.

**PWM is not an analog output.** It is a digital output switched on and off rapidly, where the fraction of time it spends high — the *duty cycle* — is adjustable. Its *average* voltage is `duty × supply`, and for a load that responds slowly compared to the switching (an LED and your eye, a motor and its inertia, a heater) the average is what matters, so PWM looks analog. But the signal is still a square wave: feed PWM into something that responds fast — an audio amplifier, another logic input, an ADC sampling at the wrong moment — and you get the switching, not the average. Making PWM into a real analog voltage needs a low-pass filter, and then it is a filter design problem.

```quiz
- q: "You connect a sensor's 0–3 V analog output to a digital input pin. What do you read?"
  anchor: "a 0 or a 1 with a threshold you did not choose"
  options:
    - text: "A number proportional to the voltage, 0 to 1023"
      correct: false
      why: "That is what an analog input pin and its ADC would give. A digital input only reports above/below a threshold."
    - text: "A single bit — 0 below the pin's logic threshold, 1 above it — with a threshold set by the chip, not by you"
      correct: true
      why: "You lose all the resolution, and the crossover point is the pin's VIH/VIL (Lesson 531), which is not where your measurement's midpoint is."
    - text: "Nothing — the pin cannot be read"
      correct: false
      why: "It reads fine; it just reads one bit instead of a value."

- q: "Why does PWM 'look analog' to an LED but not to another logic input?"
  anchor: "for a load that responds slowly compared to the switching"
  options:
    - text: "Because the LED converts the square wave to a sine wave"
      correct: false
      why: "It does not. The LED and your eye simply average the pulses because they respond slowly."
    - text: "The LED (with your eye) responds slowly and averages the pulses; a logic input responds fast and sees each edge"
      correct: true
      why: "PWM's average is duty × supply, and slow loads follow the average. A fast input sees a square wave switching between two levels."
    - text: "Because the LED has a lower resistance than a logic input"
      correct: false
      why: "Resistance is not the mechanism. Response speed relative to the PWM frequency is."
```

## Key Concepts
- **A pin has a direction** (input/output) and a **domain** (digital/analog) — four distinct jobs
- **Digital input**: one bit — above or below a threshold you did not set
- **Digital output**: drives to a rail, with a limited source/sink current (Lesson 525)
- **Analog input**: feeds an ADC that produces a number (Lesson 533)
- **Analog output (DAC)**: an arbitrary voltage — many MCUs do not have one
- **PWM is a digital output**, switched fast, with an adjustable high-fraction (duty cycle)
- **PWM's average voltage is `duty × supply`** — slow loads follow the average and it looks analog
- **Fast loads see the square wave**, not the average — PWM into an ADC, an amp or a logic input misbehaves
- **A real analog voltage from PWM** needs a low-pass filter, which is its own design problem

## Example Code
The average voltage of a PWM signal, and where treating that average as "the signal" goes wrong:

```typescript run
const SUPPLY_V = 3.3;

/** The average (DC) voltage of a PWM output. This is all a slow load sees. */
function pwmAverage(dutyFraction: number): number {
  return dutyFraction * SUPPLY_V;
}

/** What an ADC sees if it samples the PWM at one instant — either the high
 *  level or the low level, never the average, and which one depends on timing
 *  the firmware does not control. */
function pwmInstantaneous(dutyFraction: number, samplePhase: number): number {
  return samplePhase < dutyFraction ? SUPPLY_V : 0;
}

console.log('duty   average (slow load)   sampled at 30% phase   sampled at 70% phase');
for (const duty of [0.1, 0.25, 0.5, 0.75, 0.9]) {
  console.log(
    `${(duty * 100).toFixed(0).padStart(3)}%   ${pwmAverage(duty).toFixed(2)} V` +
      `                ${pwmInstantaneous(duty, 0.3).toFixed(2)} V` +
      `                  ${pwmInstantaneous(duty, 0.7).toFixed(2)} V`
  );
}

console.log('');
console.log('An LED driven at 50% duty glows at the brightness of ~1.65 V average.');
console.log('An ADC reading the same pin returns 3.30 V or 0.00 V depending on when it');
console.log('happened to sample — never 1.65. "Set the pin to half" means two different');
console.log('things depending on what is downstream.');
```

## When to Use
- When wiring any sensor — decide first whether its output is digital (a threshold event) or analog (a value), and pick the pin type to match
- When you need a variable voltage and the MCU has no DAC — PWM plus a filter, and size the filter for the load
- When driving an LED, motor or heater — PWM is correct and no filter is needed, because the load averages
- When a PWM-driven signal feeds anything fast — an ADC, an op-amp, another MCU — add the filter or expect the square wave
- When a pin's output voltage sags under load — check the current against the pin's source/sink limit (Lesson 525)

## Common Mistakes
- **Reading an analog sensor on a digital input** — you get one bit at a threshold the chip chose, not a measurement
- **Calling PWM an analog output** — it is a square wave whose *average* is adjustable, which only helps slow loads
- **Feeding PWM into an ADC** — the reading is the high or low level depending on sample timing, not the average
- **Exceeding a pin's drive current** — an output rated to source 8 mA cannot light a 40 mA LED at full brightness; the voltage collapses
- **Forgetting PWM frequency matters** — too low and the LED flickers or the motor whines; too high and switching losses and EMI rise
- **Assuming every MCU has a DAC** — most do not; check the datasheet before designing around a true analog output

## Further Reading
- [Nordic nRF52832 Product Specification — GPIO chapter](https://infocenter.nordicsemi.com/index.jsp?topic=%2Fps_nrf52832%2Fgpio.html) — one MCU's pin modes, drive strengths and the exact VIH/VIL numbers
- [TI: Using PWM output as a digital-to-analog converter (SLAA523)](https://www.ti.com/lit/an/slaa523/slaa523.pdf) — the filter design that turns PWM into a real analog voltage
- [Lesson 473](/courses/iot-telemetry-edge/designing-a-payload) — the payload side: the ADC resolution a pin's analog input actually delivers sets how many bits are worth sending

```recall
- q: "Name the two properties every MCU pin has and the four combinations."
  must:
    - "a direction: input or output"
    - "a domain: digital (two states) or analog (a continuous voltage)"
    - "digital-in, digital-out, analog-in (ADC), analog-out (DAC, often absent)"

- q: "What is PWM, and why does it look analog to some loads but not others?"
  must:
    - "a digital output switched on and off fast, with an adjustable duty cycle"
    - "its average voltage is duty × supply"
    - "slow loads (LED+eye, motor, heater) follow the average; fast loads (ADC, amp, logic) see the square wave"

- q: "What happens if you read an analog sensor on a digital input pin?"
  must:
    - "you get a single bit, not a value"
    - "the crossover is the pin's logic threshold, which you did not choose"
    - "all the measurement resolution is lost"
```
