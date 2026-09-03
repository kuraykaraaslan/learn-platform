# 472. LoRaWAN: Duty Cycle, Spreading Factor, and a Payload Budget You Cannot Argue With

## What It Is
LoRaWAN is a long-range, low-power radio protocol for devices that send small amounts of data infrequently over years on a battery. Its constraints are unlike anything in a networked application, and two of them are not engineering trade-offs at all — they are physics and law.

The physics is the **spreading factor**. LoRa trades data rate for range by spreading each symbol over more time: a higher spreading factor survives a weaker signal and takes proportionally longer to transmit. Each step up doubles the symbol duration, so the same twelve bytes that take about 62 milliseconds at SF7 take about 1.5 seconds at SF12 — roughly twenty-four times the airtime for the same payload, as the run below computes.

The law is the **duty cycle**. In the EU868 band a device may occupy its channel for only a small fraction of the time, and that fraction is set by regulation rather than by the network operator. It is enforced as a required silence *after each transmission*: send for 1.5 seconds at 1% and the radio must then stay quiet for about 147 seconds. This is not a rate limit you can negotiate, retry past, or buy your way out of. **A retry policy written for HTTP is not legal here.**

Those two facts produce the third: a **payload budget** that shrinks as range grows. The regional parameters cap the application payload per data rate, and at the three slowest EU868 data rates that cap is 51 bytes — which is where Lesson 473's title comes from and why the two lessons are adjacent. A device at the edge of coverage is at the slowest data rate, sending the smallest payloads, least often. The constraints compound in the same direction.

Everything numeric below is computed from published modulation parameters by the proof, not quoted. The one figure taken on authority is the duty-cycle percentage itself, which is regulatory and **belongs to a region** — a duty cycle quoted without one is not a fact about anything.

```quiz
- q: "A device at SF12 sends a reading and the acknowledgement does not arrive. When may it retry?"
  anchor: "the radio must then stay quiet for about 147 seconds"
  options:
    - text: "Immediately, with exponential backoff from a few hundred milliseconds"
      correct: false
      why: "That is the HTTP answer and it is not legal here. At the EU868 sub-band's 1% duty cycle the radio owes over two minutes of silence after a 1.5-second transmission."
    - text: "After the silence its duty cycle requires — over two minutes at that spreading factor"
      correct: true
      why: "The limit is enforced as required silence after each transmission, not as a daily allowance."
    - text: "After the network server grants it a new slot"
      correct: false
      why: "The duty cycle is a regulatory constraint on the transmitter, not something a server allocates."

- q: "Why does a device at the edge of coverage send the least data?"
  anchor: "The constraints compound in the same direction"
  options:
    - text: "Because weak signal corrupts large payloads more often"
      correct: false
      why: "True of any radio and not the mechanism here. The cap is set by the data rate, before any corruption."
    - text: "Weak signal means a higher spreading factor, which means longer airtime, a smaller payload cap and a longer mandated silence"
      correct: true
      why: "Three constraints tightening together — which is why coverage planning and payload design are the same conversation."
    - text: "Because the gateway deprioritises distant devices"
      correct: false
      why: "Gateways do not prioritise. The device's own data rate is what changes."
```

## Key Concepts
- **Spreading factor**: trades data rate for range; each step doubles symbol duration
- **Time on air**: computed from spreading factor, bandwidth, coding rate and payload — not estimated
- **Duty cycle**: a regulatory limit on channel occupancy, stated per region and per sub-band
- **Enforced as silence after each transmission**, not as a daily allowance to spend at will
- **Payload cap per data rate**: 51 bytes at the three slowest EU868 data rates
- **The constraints compound**: worse coverage means slower rate, smaller payload, longer silence
- **A duty cycle without a region is meaningless** — the number is regulatory and regional
- **Retry is a budget item**, not a policy choice (contrast with #4 and #5)

## Example Code
The arithmetic, run and stamped. Every figure in the table is produced from the parameters at the top of the script:

```proof sha=d2912f9c8a635452 at=2026-09-03 commit=bca3d34
$ node airtime.js
EU868, 125 kHz, preamble 8, coding rate 4/5, explicit header, CRC on

  DR  SF   max app payload   airtime at 12 B   airtime at max
  0   12    51 bytes         1482.8 ms         2793.5 ms
  1   11    51 bytes          823.3 ms         1560.6 ms
  2   10    51 bytes          411.6 ms          698.4 ms
  3    9   115 bytes          205.8 ms          676.9 ms
  4    8   222 bytes          113.2 ms          655.9 ms
  5    7   222 bytes           61.7 ms          368.9 ms

One spreading factor step doubles the symbol time, so SF12 costs about
24x the airtime of SF7 for the same twelve bytes of payload.

At 1% duty cycle (EU868, the common uplink sub-band), with a 12-byte payload:

  DR  SF   airtime   messages/hour   messages/day   min gap after each
  0   12    1483 ms         24.3            583          146.8 s
  1   11     823 ms         43.7           1049           81.5 s
  2   10     412 ms         87.5           2099           40.8 s
  3    9     206 ms        174.9           4198           20.4 s
  4    8     113 ms        318.2           7636           11.2 s
  5    7      62 ms        583.5          14004            6.1 s

That last column is the one that changes a design. The limit is not a daily
budget you may spend when you like: after a transmission the radio must stay
silent for the rest of its window, so at SF12 a retry cannot be attempted for
147 seconds. A retry policy written for HTTP is not legal here.

Every number above is computed from the parameters at the top. The only value
taken on authority is the 1% itself, which is regulatory and belongs to a
region — a duty cycle quoted without one is not a fact about anything.
```

And the same calculation as something you can change and re-run — put your own payload size in and see what it does to the ceiling:

```typescript run
// The same arithmetic as the proof above, with the inputs at the top so you
// can put your own numbers in. Change PAYLOAD_BYTES to what your device
// actually sends and re-run.
const PAYLOAD_BYTES = 12;
const DUTY_CYCLE = 0.01; // EU868, the common uplink sub-band. Regional.

const BANDWIDTH_HZ = 125_000;
const PREAMBLE_SYMBOLS = 8;
const CODING_RATE = 1; // 4/5
const FRAME_OVERHEAD_BYTES = 13; // MAC header, address, control, counter, MIC

/** LoRaWAN mandates the low-data-rate optimisation wherever a symbol lasts
 *  more than 16 ms — SF11 and SF12 at 125 kHz, and nowhere else. */
function timeOnAirMs(sf: number, applicationBytes: number): number {
  const tSym = 2 ** sf / BANDWIDTH_HZ;
  const de = tSym * 1000 > 16 ? 1 : 0;
  const bytes = applicationBytes + FRAME_OVERHEAD_BYTES;
  const symbols =
    8 + Math.max(Math.ceil((8 * bytes - 4 * sf + 44) / (4 * (sf - 2 * de))) * (CODING_RATE + 4), 0);
  return ((PREAMBLE_SYMBOLS + 4.25) * tSym + symbols * tSym) * 1000;
}

type Budget = { sf: number; airtimeMs: number; silenceS: number; perDay: number };

function budget(sf: number, applicationBytes: number): Budget {
  const airtimeMs = timeOnAirMs(sf, applicationBytes);
  const airtimeS = airtimeMs / 1000;
  return {
    sf,
    airtimeMs,
    // The limit is enforced as silence AFTER each transmission.
    silenceS: airtimeS / DUTY_CYCLE - airtimeS,
    perDay: (86_400 * DUTY_CYCLE) / airtimeS,
  };
}

console.log(`payload ${PAYLOAD_BYTES} bytes + ${FRAME_OVERHEAD_BYTES} bytes of frame overhead, EU868, ${DUTY_CYCLE * 100}% duty cycle`);
console.log('');
console.log('  SF   airtime   silence owed after   messages/day   shortest safe interval');
for (const sf of [7, 8, 9, 10, 11, 12]) {
  const b = budget(sf, PAYLOAD_BYTES);
  const interval = 86_400 / b.perDay;
  console.log(
    `  ${String(sf).padStart(2)}   ${b.airtimeMs.toFixed(0).padStart(5)} ms   ${b.silenceS.toFixed(1).padStart(14)} s   ` +
      `${b.perDay.toFixed(0).padStart(12)}   ${(interval / 60).toFixed(1).padStart(18)} min`
  );
}
console.log('');

// What a reporting interval costs, which is the question a product decision
// actually turns on.
const WANTED_INTERVAL_MINUTES = 2;
console.log(`reporting every ${WANTED_INTERVAL_MINUTES} minutes needs ${(1440 / WANTED_INTERVAL_MINUTES).toFixed(0)} messages a day:`);
for (const sf of [7, 9, 10, 11, 12]) {
  const b = budget(sf, PAYLOAD_BYTES);
  const needed = 1440 / WANTED_INTERVAL_MINUTES;
  console.log(`  SF${String(sf).padStart(2)}  ${b.perDay >= needed ? 'fits' : `does NOT fit — ceiling is ${b.perDay.toFixed(0)}/day`}`);
}
console.log('');
console.log('Adaptive data rate moves a device between these rows as its signal changes, so');
console.log('the budget is a range and not a number. Design against the worst row a device');
console.log('can reach, because that is the one it reaches in the field.');
```

## When to Use
- When choosing a reporting interval, which is a duty-cycle calculation before it is a product decision
- When coverage planning, where the spreading factor a device ends up at decides its payload and its cadence
- When designing a retry or acknowledgement scheme, where the mandated silence is the constraint rather than the server's patience
- When someone asks how often a device can report — a question with an arithmetic answer that this run gives

## Common Mistakes
- **Quoting a duty cycle without its region** — the limit is regulatory and differs by region and sub-band, so the bare percentage is not a fact
- **Treating the duty cycle as a daily allowance** — it is enforced as silence after each transmission, so a burst is not available even when the day's total would allow it
- **Applying HTTP retry intervals** — at the slowest data rates the next legal transmission is minutes away, and a tight retry loop is simply not permitted
- **Designing the payload before knowing the data rate** — the cap changes with spreading factor, and a payload that fits in the lab may not fit at the edge of coverage
- **Assuming a fixed spreading factor** — adaptive data rate moves it, so the budget is a range rather than a number
- **Ignoring the frame overhead** — the application payload is not the transmitted frame, and the header, address, counter and integrity code all cost airtime

## Further Reading
- [LoRaWAN L2 1.0.4 specification](https://resources.lora-alliance.org/technical-specifications/ts001-1-0-4-lorawan-l2-1-0-4-specification) — the protocol itself, version-stamped
- [RP002-1.0.4 regional parameters](https://resources.lora-alliance.org/technical-specifications/rp002-1-0-4-regional-parameters) — the per-region data rates and payload caps the table above uses
- [ETSI EN 300 220-2](https://www.etsi.org/deliver/etsi_en/300200_300299/30022002/03.02.01_60/en_30022002v030201p.pdf) — the European short-range-device rules the EU868 duty cycle comes from
- [The Things Network LoRaWAN documentation](https://www.thethingsnetwork.org/docs/lorawan/) — a readable second explanation of adaptive data rate and airtime

```recall
- q: "Explain what a spreading factor trades, and what it costs."
  must:
    - "range for data rate — a higher spreading factor survives a weaker signal"
    - "each step doubles the symbol duration"
    - "so the same payload takes about twenty-four times the airtime at SF12 as at SF7"

- q: "State how a duty cycle is enforced and why that changes a retry design."
  must:
    - "as required silence after each transmission, not as a daily allowance"
    - "at EU868's 1% and 1.5 seconds of airtime, the next transmission is over two minutes away"
    - "so an HTTP-style retry interval is not merely wasteful, it is not legal"

- q: "Why must a duty cycle always be quoted with a region?"
  must:
    - "the limit is regulatory, and differs by region and by sub-band"
    - "a bare percentage is not a fact about any particular network"
```
