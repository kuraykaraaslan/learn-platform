# 529. TX to RX: Wiring a Serial Link, and the Four Things That Must Match

## What It Is
An asynchronous serial link — a UART, "serial", TIA/EIA-232 at the logic level — is the simplest way to move bytes between two boards, and the simplest to wire wrong. It is two data wires and a ground, and the failures split cleanly into **wiring** (this lesson) and, for the clocked buses, **budget** (Lesson 530).

The wiring rule is a crossover. Each device has a **TX** pin (it transmits) and an **RX** pin (it receives). The link connects **one device's TX to the other's RX**, and vice versa — TX→RX, RX→TX. Wiring TX→TX is the single most common serial fault: both devices drive the same line, neither receives, and nothing happens. A cable labelled "straight-through" or "null-modem" is just a statement about whether the crossover is in the cable or expected on the board, and getting that wrong has the same effect.

The **third wire is a common ground**, and it is not optional. The two devices express a bit as a voltage *relative to their own ground*; if their grounds are not connected, "3.3 V" on one board is measured against a reference the other board does not share, and the receiver sees noise. A serial link that works on the bench with both boards on one supply and fails in the field on separate supplies is almost always a missing ground between them.

The **fourth thing is the frame format**, and it is a firmware setting on both ends, not a wire: **baud rate** (bits per second), **data bits** (usually 8), **parity** (usually none), and **stop bits** (usually 1) — quoted as "115200 8N1". If the two ends disagree on any of these — most often the baud rate — the receiver samples the line at the wrong moments and produces bytes that are wrong in a consistent, misleading way (Lesson 529's `ts run` shows the baud error a wrong clock divisor produces).

```quiz
- q: "You connect board A's TX to board B's TX and board A's RX to board B's RX. What happens?"
  anchor: "Wiring TX→TX is the single most common serial fault"
  options:
    - text: "It works — the signals are symmetric"
      correct: false
      why: "Both devices are now driving the same wire and both are listening on a wire nobody drives. Nothing is received."
    - text: "Nothing is received — both devices drive one line and both listen on an undriven line; you need the crossover"
      correct: true
      why: "TX must go to the other end's RX. TX→TX and RX→RX is the classic dead link."
    - text: "Board A receives but board B does not"
      correct: false
      why: "Neither receives. The topology is symmetric and wrong on both sides."

- q: "A serial link works with both boards on one bench supply and fails when they run from separate supplies in the field. Most likely cause?"
  anchor: "A serial link that works on the bench with both boards on one supply and fails in the field on separate supplies is almost always a missing ground between them"
  options:
    - text: "The field supply is noisier"
      correct: false
      why: "Possible but not the usual cause. On one bench supply the grounds were connected through the supply; on two they are not."
    - text: "No common ground wire between the boards — each measures the signal against a reference the other does not share"
      correct: true
      why: "The data wire's voltage only means something relative to a shared ground. One bench supply hid the missing ground wire."
    - text: "The baud rates drifted apart"
      correct: false
      why: "Baud is a firmware setting and does not change with the power source. The symptom points at the ground."
```

## Key Concepts
- **A serial link is two data wires and a ground** — failures are wiring or (for clocked buses) budget
- **The crossover**: one device's TX to the other's RX, both ways
- **TX→TX is the classic dead link** — both drive, neither receives
- **"Straight-through" vs "null-modem"** just says where the crossover lives
- **A common ground wire is mandatory** — a bit's voltage only means something against a shared reference
- **Bench-works / field-fails on separate supplies** = missing ground between the boards
- **The frame format is firmware, not wiring**: baud, data bits, parity, stop bits — "115200 8N1"
- **A baud mismatch** makes the receiver sample at the wrong instants and produce consistently wrong bytes

## Example Code
Where a baud-rate error comes from: the UART divides a peripheral clock to make the bit rate, and the division is integer, so most target rates are only approximated. Too much error and the last bits of a frame are sampled in the wrong bit:

```typescript run
/** A UART generates its baud clock by dividing a source clock by an integer.
 *  The achievable rate is source / round(source / target), and the error is
 *  the gap. Past ~2–3% the accumulated timing error across a 10-bit frame
 *  lands the stop-bit sample inside the next bit. */
function actualBaud(sourceHz: number, targetBaud: number): { actual: number; errorPct: number } {
  const divisor = Math.round(sourceHz / targetBaud);
  const actual = sourceHz / divisor;
  return { actual, errorPct: ((actual - targetBaud) / targetBaud) * 100 };
}

const targets = [9600, 115200, 921600];
for (const clock of [8_000_000, 16_000_000, 3_686_400]) {
  console.log(`source clock ${(clock / 1e6).toFixed(4)} MHz`);
  for (const target of targets) {
    const { actual, errorPct } = actualBaud(clock, target);
    const frameErrorPct = Math.abs(errorPct) * 10; // accumulated over a 10-bit frame
    const verdict = frameErrorPct < 25 ? 'ok' : frameErrorPct < 50 ? 'marginal' : 'FRAMING ERRORS';
    console.log(
      `  ${String(target).padStart(7)} -> ${actual.toFixed(0).padStart(7)} (${errorPct.toFixed(2).padStart(6)}%)   frame error ${frameErrorPct.toFixed(0).padStart(3)}%   ${verdict}`
    );
  }
  console.log('');
}

console.log('The 3.6864 MHz clock (an "8N1-friendly" crystal) hits every rate exactly — that');
console.log('is why it exists. An 8 MHz clock at 115200 is off by ~4%, which accumulates to');
console.log('~40% of a bit by the stop bit: intermittent framing errors that look like noise.');
```

## When to Use
- Every time you wire a serial link — check the crossover and the ground wire before touching firmware
- When a link is completely dead — suspect TX→TX or a missing ground first
- When a link mostly works but drops occasional bytes — suspect a baud-rate mismatch or a source clock that cannot hit the rate
- When choosing a crystal for a board that does serial — a "UART-friendly" frequency (11.0592, 3.6864 MHz) removes the error entirely
- When a device documents "RS-232" — check whether it means true ±12 V levels (needs a transceiver) or logic-level UART

## Common Mistakes
- **Wiring TX to TX** — the most common serial fault, and it produces total silence, not garbled data
- **Omitting the ground wire** — works on a shared bench supply, fails on separate supplies in the field
- **Mismatched baud rates** — a consistent pattern of wrong bytes, not random noise
- **Ignoring source-clock limits** — an 8 MHz clock cannot make an accurate 115200 baud, and the datasheet's baud table says so
- **Confusing logic-level UART with true RS-232** — connecting a ±12 V RS-232 line straight to a 3.3 V pin destroys the pin
- **Assuming 8N1** — a device using a parity bit or two stop bits will not talk to one configured 8N1, and the symptom is framing errors

## Further Reading
- [TIA/EIA-232-F overview](https://www.tia.org/) — the standard the "RS-232" name refers to; the electrical levels and the DTE/DCE crossover convention
- [Maxim: Determining Clock Accuracy Requirements for UART Communications (AN2141)](https://www.analog.com/en/resources/technical-articles/determining-clock-accuracy-requirements-for-uart-communications.html) — how much baud error a frame tolerates, derived
- [Lesson 530](/courses/iot-hardware-basics/i2c-and-spi) — the clocked serial buses (I²C, SPI), where the failure class is budget rather than wiring
- [Lesson 474](/courses/iot-telemetry-edge/three-clocks) — the clock question from the other side: which clock a UART timestamp is even against

```recall
- q: "State the wiring rule for a serial link and the most common mistake."
  must:
    - "connect one device's TX to the other's RX, and vice versa — a crossover"
    - "the common mistake is TX→TX (and RX→RX), which produces total silence"
    - "a third wire, common ground, is mandatory"

- q: "Why does a serial link fail on separate supplies when it worked on one bench supply?"
  must:
    - "a data bit's voltage only means something relative to a shared ground"
    - "one bench supply connected the grounds; two separate supplies do not"
    - "the fix is an explicit ground wire between the boards"

- q: "What is the frame format and where does a baud error come from?"
  must:
    - "baud rate, data bits, parity, stop bits — a firmware setting on both ends (e.g. 115200 8N1)"
    - "the UART divides a source clock by an integer, so most rates are approximated"
    - "past ~2–3% error the stop bit is sampled in the wrong bit and framing errors appear"
```
