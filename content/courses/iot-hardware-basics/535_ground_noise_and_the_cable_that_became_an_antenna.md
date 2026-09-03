# 535. Ground, Noise, and the Cable That Became an Antenna

## What It Is
"Ground" is the reference every voltage in the system is measured against, and the assumption that there is *one* ground at *one* potential everywhere is the assumption that breaks in the field. Current flowing through the resistance of a ground wire or a copper plane creates a voltage along it, so the ground at the sensor is not quite the ground at the ADC. That difference adds directly to your signal, and because it moves with whatever else is drawing current — a radio transmitting, a pump motor starting — it looks like the sensor is picking up the machinery.

This is a **ground loop**: two points that should be at the same potential are connected by more than one path, and current circulates around the loop, developing a voltage that rides on every measurement referenced to it. The classic version is a sensor grounded both at its own location and through its signal cable's shield back to the controller; the two ground points are metres apart, at slightly different potentials, and the difference drives current through the shield.

A cable is also an **antenna**. Any wire picks up the electromagnetic fields around it — mains hum at 50/60 Hz, switching-supply noise at tens of kHz, radio at MHz — and a long unshielded signal wire in an industrial environment picks up a lot. The pickup is a voltage added to your signal, largest when the signal impedance is high and the cable is long and the environment is noisy, which describes most field installations.

The countermeasures are structural, not software. **Single-point grounding** — every ground returns to one node, so no loops form. **Shielded cable grounded at one end only** — the shield intercepts fields without becoming a second ground path. **Differential signalling** (Lesson 536) — send the signal as the difference between two wires so that pickup common to both cancels. **Twisted pairs** so the loop area that catches magnetic fields is tiny. And keeping the analog front end physically and electrically away from the switching and the radio. None of these can be added in firmware after the fact; a filter in code removes some noise and also removes some signal.

```quiz
- q: "A sensor reading is clean on the bench and picks up a periodic disturbance in the field that correlates with a nearby pump cycling. What is the most likely mechanism?"
  anchor: "the ground at the sensor is not quite the ground at the ADC"
  options:
    - text: "The pump is transmitting radio interference into the sensor"
      correct: false
      why: "Possible for a VFD, but a low-frequency correlation with the pump's mechanical cycle points at a shared ground path, not RF."
    - text: "A ground loop — the pump's current shifts the ground potential the sensor is referenced to, and that shift adds to the reading"
      correct: true
      why: "Shared ground impedance turns another load's current into a voltage on your reference. Single-point grounding breaks it."
    - text: "The sensor's calibration drifted when the room warmed from the pump"
      correct: false
      why: "Drift is slow and does not correlate with a pump's on/off cycle. The timing is the clue."

- q: "Why can't a firmware filter fix cable-pickup noise as well as a hardware countermeasure?"
  anchor: "a filter in code removes some noise and also removes some signal"
  options:
    - text: "Firmware runs too slowly to filter effectively"
      correct: false
      why: "Speed is not the issue. The issue is that once noise is added to the signal, no filter separates them perfectly."
    - text: "Once pickup is added to the signal they share a wire; a filter that attenuates the noise band also attenuates signal in that band"
      correct: true
      why: "Differential signalling, shielding and grounding stop the noise from being added in the first place, which a filter cannot undo."
    - text: "Firmware filters introduce quantisation error"
      correct: false
      why: "A minor effect. The fundamental problem is that noise and signal are already summed on one wire."
```

## Key Concepts
- **Ground is a reference, not a place** — current through ground resistance means the ground potential varies across the board
- **A ground-potential difference adds directly to every measurement referenced to it**
- **A ground loop**: two points connected by more than one ground path, with circulating current
- **A cable is an antenna** — it picks up mains hum, supply switching noise and RF, worst for long high-impedance lines
- **Single-point grounding** — every return to one node, no loops
- **Shield grounded at one end only** — intercepts fields without becoming a ground path
- **Differential signalling** (Lesson 536) — common-mode pickup cancels
- **Twisted pairs** minimise the loop area that catches magnetic fields
- **Countermeasures are structural** — a firmware filter removes signal along with noise

## Example Code
Two wiring schemes for the same remote sensor, as netlists. The difference is one decision — where the sensor's ground connects:

```text
// ── broken ──
// Sensor grounded locally AND through the cable shield back to the
// controller. The two ground points are 8 m apart at slightly different
// potentials, so current flows around the loop through the shield and
// develops a voltage that adds to SIG.
NET SIG      : SENSOR.OUT   -> CTRL.ADC_IN
NET SHIELD   : SENSOR.GND   -> CABLE.SHIELD -> CTRL.GND
NET GND_LOCAL: SENSOR.GND   -> LOCAL_EARTH_ROD
// SENSOR.GND now has two paths to controller ground: the shield and the
// local earth. That is the loop.

// ── fixed ──
// Sensor ground returns to the controller by ONE path only. The shield is
// grounded at the controller end alone, so it catches fields without
// carrying ground current. No loop.
NET SIG    : SENSOR.OUT -> CTRL.ADC_IN
NET RTN    : SENSOR.GND -> CTRL.GND            // the only sensor ground path
NET SHIELD : CABLE.SHIELD -> CTRL.GND          // one end only; floating at the sensor
// SENSOR.GND has exactly one route to CTRL.GND. No circulating current.
```

The broken version often passes a bench test, where the cable is short and nothing else draws current. It fails once the run is long and a motor shares the building's earth.

## When to Use
- When a signal is clean on the bench and noisy in the field — grounding and cable pickup are the first suspects
- When laying out a board — decide the single ground node before routing, not after
- When specifying a sensor cable — shielded, twisted pair, and a documented shield-termination end
- When a disturbance correlates with another machine's duty cycle — that correlation is the signature of a shared ground path
- Before reaching for a software filter — a structural fix removes the noise; a filter trades signal for it

## Common Mistakes
- **Assuming one ground symbol means one potential** — current and wire resistance make it a distribution
- **Grounding a cable shield at both ends** — it becomes a second ground path and a loop
- **Running a high-impedance analog signal down a long unshielded wire** — it is an antenna, and the pickup is proportional to length and impedance
- **Routing the analog front end next to the switching regulator or the radio** — the coupling is local and strong
- **Fixing pickup in firmware** — the filter attenuates the signal in the noise band too, and the structural cause remains
- **Testing grounding only on the bench** — the loop needs distance and a second load to show itself, neither of which the bench has

## Further Reading
- [Analog Devices MT-031: Grounding Data Converters and Solving the Mystery of "AGND" and "DGND"](https://www.analog.com/media/en/training-seminars/tutorials/MT-031.pdf) — single-point grounding and where the return currents actually flow
- [Henry Ott: Electromagnetic Compatibility Engineering](https://www.wiley.com/en-us/Electromagnetic+Compatibility+Engineering-p-9780470189306) — the reference text on grounding, shielding and cable pickup
- [Lesson 536](/courses/iot-hardware-basics/distance-voltage-drop-4-20ma) — differential signalling and the current loop: the wiring methods that survive the distance where pickup dominates

```recall
- q: "What is a ground loop and how does it corrupt a measurement?"
  must:
    - "two points that should be at the same potential are connected by more than one ground path"
    - "current circulates around the loop and develops a voltage across the ground impedance"
    - "that voltage adds directly to any measurement referenced to that ground"

- q: "In what sense is a signal cable an antenna, and what makes the pickup worse?"
  must:
    - "any wire picks up the electromagnetic fields around it — mains hum, supply switching, RF"
    - "pickup is worst for long cables, high signal impedance, and noisy environments"
    - "the pickup is a voltage added to the signal on the same wire"

- q: "Why must noise countermeasures be structural rather than a firmware filter?"
  must:
    - "once noise is summed onto the signal wire, no filter separates them cleanly"
    - "a filter that attenuates the noise band attenuates signal there too"
    - "single-point grounding, one-end shields and differential signalling stop the noise being added at all"
```
