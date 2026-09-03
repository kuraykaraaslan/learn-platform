# 536. Distance: Voltage Drop, 4–20 mA, and Differential Pairs

## What It Is
The buses from Lesson 530 assume the chips are centimetres apart. The moment a sensor is metres from the controller — across a plant room, down a borehole, along a bridge — the wire itself becomes a circuit element, and three physical effects decide whether the signal arrives.

**Voltage drop.** A wire has resistance (roughly 20 Ω per kilometre for 20 AWG copper, more for thinner), and any current through it drops voltage: `V_drop = I × R_wire`. Power a remote sensor with 3.3 V down 50 m of thin wire at 30 mA and a good fraction of a volt is gone before the sensor sees it — it may brown out, and it will certainly not have the supply the datasheet assumed. The fix is to send more voltage and regulate locally, or to send less current.

**4–20 mA current loops.** Instead of representing the measurement as a voltage (which the wire corrupts), represent it as a *current*: 4 mA means the low end of the range, 20 mA the high end. A series resistance in the wire does not change a current, so voltage drop stops mattering; a broken wire reads 0 mA, which is outside the valid range, so a fault is unambiguous; and the 4 mA "live zero" powers the sensor itself. This is why process industry field instruments have used 4–20 mA for decades. It is a de-facto industry convention, formalised by manufacturer application notes rather than a single paid standard.

**Differential pairs.** Send the signal as the *difference* between two wires (RS-485 / TIA-EIA-485 does this for digital data). Noise picked up along the run (Lesson 535) appears almost equally on both wires — it is *common-mode* — and the receiver, which looks only at the difference, rejects it. A twisted differential pair over hundreds of metres in electrical noise beats a single-ended signal over ten.

This lesson stops at the physical layer. **Where a differential digital link becomes a multi-drop bus with addressing, arbitration and a protocol — Modbus RTU over RS-485, and the OT/IT boundary around it — that is Lesson 514's subject**, and Lesson 514 is a security topic held for expert review. This lesson gives you the wire; it does not give you the network on it.

```quiz
- q: "A remote sensor 40 m away browns out intermittently. It is powered with 3.3 V down a thin cable and draws 25 mA during radio transmission. What is happening?"
  anchor: "any current through it drops voltage"
  options:
    - text: "The sensor's regulator is faulty"
      correct: false
      why: "The regulator is probably fine — it just is not receiving 3.3 V. The drop is across the cable, and it is worst during the current spike."
    - text: "Voltage drop across the cable resistance, worst during the transmit current spike, pulls the sensor's supply below its minimum"
      correct: true
      why: "V_drop = I × R_wire, and both the current and the effective wire resistance conspire. Send more voltage and regulate locally, or send less current."
    - text: "Radio interference is resetting the sensor"
      correct: false
      why: "Possible, but the correlation with the sensor's own transmit current points at a supply-droop problem, not external RF."

- q: "Why does a 4–20 mA current loop survive a long noisy cable run where a 0–3 V signal does not?"
  anchor: "A series resistance in the wire does not change a current"
  options:
    - text: "Because 4–20 mA uses a higher voltage that overcomes the noise"
      correct: false
      why: "It is not about voltage level. Representing the measurement as a current makes series wire resistance irrelevant."
    - text: "The measurement is encoded as a current, which series wire resistance does not change; and 0 mA (a broken wire) is an unambiguous fault"
      correct: true
      why: "Voltage drop stops mattering, the live zero powers the sensor, and an out-of-range reading means a fault."
    - text: "Because current loops are immune to electromagnetic pickup"
      correct: false
      why: "They are more robust but not immune — a low-impedance current loop just picks up far less voltage noise than a high-impedance voltage signal."
```

## Key Concepts
- **Over distance the wire is a circuit element** — resistance, and it picks up noise
- **Voltage drop**: `V_drop = I × R_wire` — a remote sensor's supply is not what the datasheet assumed
- **Voltage-drop fixes**: send higher voltage and regulate locally, or send less current
- **4–20 mA current loop**: the measurement is a current, so series resistance does not matter
- **Live zero**: 4 mA is the range's low end and powers the sensor; 0 mA is an unambiguous broken-wire fault
- **4–20 mA is a de-facto industry convention**, documented by manufacturer application notes, not one paid standard
- **Differential pair**: signal is the difference of two wires; common-mode noise (Lesson 535) is rejected by the receiver
- **RS-485 (TIA/EIA-485)** is differential digital; twisted pair, hundreds of metres in noise
- **This lesson is the physical layer only** — the bus, addressing and protocol on RS-485 are Lesson 514

## Example Code
The voltage-drop calculation, with your own cable and current — then the choice of signalling method for a given run:

```calc
inputs:
  - { id: supply_v,     label: "Voltage sent down the cable (V)", type: number, default: 5, min: 0 }
  - { id: current_ma,   label: "Current the remote device draws (mA)", type: number, default: 30, min: 0 }
  - { id: length_m,     label: "One-way cable length (m)", type: number, default: 50, min: 1 }
  - { id: ohm_per_km,   label: "Cable resistance (ohms per km, both conductors ~2x one)", type: number, default: 40, min: 1 }
  - { id: device_min_v, label: "Minimum supply the device needs (V)", type: number, default: 3.0, min: 0 }
outputs:
  - { label: "Round-trip wire resistance (ohms)", expr: "ohm_per_km * length_m * 2 / 1000", format: number }
  - { label: "Voltage lost in the cable (V)", expr: "current_ma / 1000 * (ohm_per_km * length_m * 2 / 1000)", format: number }
  - { label: "Voltage arriving at the device (V)", expr: "supply_v - current_ma / 1000 * (ohm_per_km * length_m * 2 / 1000)", format: number }
  - { label: "Margin above the device minimum (V) — negative means brown-out", expr: "supply_v - current_ma / 1000 * (ohm_per_km * length_m * 2 / 1000) - device_min_v", format: number }
```

```tradeoff
question: "Send a field sensor's reading over distance as a 0–10 V analog signal, a 4–20 mA current loop, or a differential digital bus?"
sides:
  - name: "4–20 mA current loop"
    wins_when:
      - signal: "the run is long and electrically noisy, and the reading is a single slowly-changing analog value — measured against the cable length and the environment, not assumed"
      - signal: "an unambiguous broken-wire indication is required — 0 mA is out of range, so a fault cannot be mistaken for a valid low reading"
      - signal: "the receiving equipment already expects 4–20 mA inputs, which most process instrumentation does"
  - name: "Differential digital bus (RS-485)"
    wins_when:
      - signal: "several sensors share one cable run, or the reading is more than one value — a current loop carries exactly one analog quantity per pair"
      - signal: "the data rate or update rate is beyond what a 4–20 mA loop's response allows"
      - signal: "you are prepared to design or adopt the bus layer on top — addressing, framing, a protocol — which Lesson 514 covers and which a current loop does not need"
```

## When to Use
- Any time a sensor is more than a couple of metres from the controller — run the voltage-drop number before choosing a cable
- When a remote device browns out under load — the drop is worst at the current peak, which is usually during transmission
- When the environment is electrically noisy — 4–20 mA or a differential pair, not a single-ended voltage
- When an unambiguous wire-break indication matters for safety or process control — the 4–20 mA live zero provides it
- When the link needs to carry more than one value or serve several devices — a digital bus, and then Lesson 514 for the network on it

## Common Mistakes
- **Powering a remote sensor without computing the voltage drop** — the datasheet's minimum supply is not what arrives
- **Sending a 0–3 V analog signal down a long field cable** — it is a high-impedance antenna and the drop corrupts it
- **Treating 4–20 mA as a paid formal standard** — it is a de-facto convention, referenced by manufacturer application notes
- **Grounding a differential pair's shield at both ends** — the loop returns (Lesson 535)
- **Assuming RS-485 gives you a protocol** — it gives you a differential physical layer; the bus, addressing and framing are separate (Lesson 514)
- **Extending an on-board bus (I²C, SPI) down a cable instead** — those buses were never meant to leave the board (Lesson 530)

## Further Reading
- [TI: The RS-485 Design Guide (SLLA272)](https://www.ti.com/lit/an/slla272d/slla272d.pdf) — the differential physical layer, common-mode range, termination and cable length, with the standard (TIA/EIA-485) referenced by number
- [Analog Devices: 4–20 mA loop design (AN-1852 / MT-036)](https://www.analog.com/en/resources/technical-articles/mt036.html) — the loop-powered current transmitter, the live zero, and the compliance-voltage budget
- [Lesson 514](/courses/smart-infrastructure/ot-and-it-protocol-boundaries) — the network layer above an RS-485 pair: Modbus, the OT/IT boundary, and the gateway (a security topic held for expert review)
- [Lesson 535](/courses/iot-hardware-basics/ground-noise-and-the-cable-that-became-an-antenna) — why a differential pair rejects the pickup a single-ended signal collects over the same run

```recall
- q: "State the voltage-drop problem for a remote device and its two fixes."
  must:
    - "a wire has resistance, so current through it drops voltage: V_drop = I × R_wire"
    - "a remote device's supply is lower than the datasheet assumed, worst at the current peak"
    - "fix by sending a higher voltage and regulating locally, or by sending less current"

- q: "Why does a 4–20 mA current loop survive distance and noise?"
  must:
    - "the measurement is encoded as a current, which series wire resistance does not change"
    - "0 mA (a broken wire) is out of range, so a fault is unambiguous, and 4 mA powers the sensor"
    - "it is a de-facto industry convention, not one paid formal standard"

- q: "What does this lesson deliberately not cover, and where does it go?"
  must:
    - "the physical layer only — voltage drop, current loop, differential pair"
    - "the bus, addressing and protocol on RS-485 (e.g. Modbus) and the OT/IT boundary are Lesson 514"
    - "Lesson 514 is a security topic held for expert review"
```
