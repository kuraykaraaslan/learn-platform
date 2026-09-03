# 473. Designing a Payload for a 51-Byte Budget: CBOR, Varints, Deltas

## What It Is
Lesson 472 established where 51 bytes comes from: it is the application payload cap at the three slowest EU868 data rates, which is where a device at the edge of coverage lives. This lesson is about fitting something useful inside it.

The first thing to accept is that **JSON is not a candidate**. Six readings of three fields each, as JSON, is several hundred bytes — the run below measures it at eight times the budget. That is not a failure of JSON; it is JSON doing what it is for, which is being readable and self-describing over links where a few hundred bytes cost nothing.

The second is that **a fixed binary layout is often not enough either**. Dropping the field names and packing each value into a known width gets six readings to around 54 bytes in the run below — still over. Knowing that before you build it is worth something.

What fits is **deltas plus variable-length integers**. Store the first reading in full, then only the change from the previous one. A varint spends seven bits of value per byte, so a small number costs one byte; zig-zag encoding maps small negatives onto small positives so a delta of `-1` costs one byte rather than five. A sensor whose readings barely move produces deltas near zero, and those are the cheapest thing this encoding can carry.

**CBOR** (RFC 8949) sits between the two: a binary encoding that is still self-describing, so a reader does not need the schema out of band. It costs more than a raw delta stream and much less than JSON, and it is the right default when the budget is tight but not desperate.

The costs are real and worth stating rather than discovering. A compact encoding **gives up self-description**, so the schema travels separately and has to be versioned; it **gives up random access**, so reading the fourth value means decoding the first three; and it **gives up error tolerance**, so one corrupt byte desynchronises everything after it.

```quiz
- q: "Six readings of three fields will not fit in 51 bytes as a fixed-width binary record. What is the next move?"
  anchor: "Store the first reading in full, then only the change from the previous one"
  options:
    - text: "Send fewer readings per message"
      correct: false
      why: "A legitimate answer and a costly one — Lesson 472 showed the next transmission may be minutes away, so fewer readings per message means a longer backlog."
    - text: "Delta-encode against the previous reading and store the deltas as varints"
      correct: true
      why: "A sensor that barely moves produces near-zero deltas, and a varint near zero is one byte."
    - text: "Increase the spreading factor to get a larger payload cap"
      correct: false
      why: "Backwards — a higher spreading factor means a smaller cap and longer airtime, per Lesson 472."

- q: "What does a delta-plus-varint encoding give up?"
  anchor: "gives up random access"
  options:
    - text: "Nothing material — it is strictly better than JSON on a constrained link"
      correct: false
      why: "It is smaller. It is not strictly better: three properties are traded away for the size."
    - text: "Self-description, random access, and error tolerance"
      correct: true
      why: "The schema travels separately, the fourth value needs the first three decoded, and one corrupt byte desynchronises the rest."
    - text: "Precision, since values are scaled to integers"
      correct: false
      why: "Scaling is a choice with a known bound — two decimal places is exact if you scale by a hundred. The three losses above are structural."
```

## Key Concepts
- **51 bytes** is the EU868 application payload cap at the slowest three data rates (Lesson 472)
- **JSON is out**: self-description costs multiples of the budget
- **Fixed-width binary** removes names and separators and is often still not enough
- **Varint (LEB128)**: seven bits of value per byte, so small numbers cost one byte
- **Zig-zag**: maps small negatives onto small positives, so `-1` costs one byte
- **Delta encoding**: first reading in full, then changes — a bet that the signal is smooth
- **CBOR (RFC 8949)**: binary and still self-describing; the middle option
- **What compaction costs**: self-description, random access, error tolerance
- **A fixed reporting interval is worth bytes**: send it once in a header and the timestamp delta disappears

## Example Code
Four encodings of the same six readings, measured:

```typescript run
// byte count this code produced, not an estimate.
type Reading = { measuredAt: number; celsius: number; humidity: number; battery: number };

// Six readings a device buffered while it waited for its transmission window.
const BASE_EPOCH = 1_772_323_200; // a fixed reference instant, in seconds
const READINGS: Reading[] = [
  { measuredAt: BASE_EPOCH + 0, celsius: 21.4, humidity: 48.2, battery: 61 },
  { measuredAt: BASE_EPOCH + 600, celsius: 21.6, humidity: 48.0, battery: 61 },
  { measuredAt: BASE_EPOCH + 1200, celsius: 21.9, humidity: 47.7, battery: 61 },
  { measuredAt: BASE_EPOCH + 1800, celsius: 22.2, humidity: 47.1, battery: 60 },
  { measuredAt: BASE_EPOCH + 2400, celsius: 22.5, humidity: 46.8, battery: 60 },
  { measuredAt: BASE_EPOCH + 3000, celsius: 22.4, humidity: 46.9, battery: 60 },
];

const BUDGET_BYTES = 51; // the EU868 limit at the slowest data rates

const jsonBytes = new TextEncoder().encode(JSON.stringify(READINGS)).length;
console.log(`budget                       ${BUDGET_BYTES} bytes`);
console.log(`JSON                         ${jsonBytes} bytes   ${jsonBytes > BUDGET_BYTES ? `(${(jsonBytes / BUDGET_BYTES).toFixed(1)}x over)` : ''}`);

// A fixed binary layout: no field names, no separators, everything a known
// width. Timestamps as a 4-byte epoch, values scaled to integers.
const FIXED_BYTES_PER_READING = 4 + 2 + 2 + 1; // epoch, celsius x100, humidity x100, battery
const fixedBytes = READINGS.length * FIXED_BYTES_PER_READING;
console.log(`fixed-width binary           ${fixedBytes} bytes   ${fixedBytes > BUDGET_BYTES ? `(${(fixedBytes / BUDGET_BYTES).toFixed(1)}x over)` : '(fits)'}`);

/** LEB128 varint: seven bits of value per byte, high bit set while more
 *  follows. Small numbers cost one byte, which is the whole reason to delta. */
function varint(value: number, out: number[]): void {
  let v = value;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
}

/** Zig-zag, so a delta of -1 costs one byte rather than five. */
const zigzag = (n: number) => (n << 1) ^ (n >> 31);

/** Deltas plus varints: store the first reading in full, then only what
 *  changed. A sensor that barely moves produces deltas near zero, and a
 *  varint near zero is one byte. */
function encodeDelta(readings: Reading[]): number[] {
  const out: number[] = [];
  const first = readings[0];
  varint(first.measuredAt, out);
  varint(zigzag(Math.round(first.celsius * 100)), out);
  varint(zigzag(Math.round(first.humidity * 100)), out);
  varint(first.battery, out);
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1];
    const cur = readings[i];
    varint(cur.measuredAt - prev.measuredAt, out);
    varint(zigzag(Math.round(cur.celsius * 100) - Math.round(prev.celsius * 100)), out);
    varint(zigzag(Math.round(cur.humidity * 100) - Math.round(prev.humidity * 100)), out);
    varint(zigzag(cur.battery - prev.battery), out);
  }
  return out;
}

const delta = encodeDelta(READINGS);
console.log(`delta + varint               ${delta.length} bytes   ${delta.length > BUDGET_BYTES ? `(${(delta.length / BUDGET_BYTES).toFixed(1)}x over)` : '(fits)'}`);
console.log('');

// Where the saving comes from, per field. Measured by encoding each field on
// its own rather than asserted, because the timestamp delta is the one that
// costs two bytes and the table would otherwise quietly claim it costs one.
const sizeOf = (value: number) => {
  const out: number[] = [];
  varint(value, out);
  return out.length;
};
console.log('bytes per reading after the first, for this data:');
const second = READINGS[1];
const first = READINGS[0];
const fields: [string, number][] = [
  ['timestamp delta (600 s)', sizeOf(second.measuredAt - first.measuredAt)],
  ['celsius delta (hundredths)', sizeOf(zigzag(Math.round(second.celsius * 100) - Math.round(first.celsius * 100)))],
  ['humidity delta (hundredths)', sizeOf(zigzag(Math.round(second.humidity * 100) - Math.round(first.humidity * 100)))],
  ['battery delta (unchanged)', sizeOf(zigzag(second.battery - first.battery))],
];
for (const [name, bytes] of fields) console.log(`  ${name.padEnd(30)} ${bytes}`);
console.log(`  ${'total per reading'.padEnd(30)} ${fields.reduce((a, [, b]) => a + b, 0)}`);
console.log('');
console.log('A fixed reporting interval is worth a byte on its own: send the interval once');
console.log('in a header and the timestamp delta disappears from every reading after it.');
console.log('');

// The honest cost, stated rather than skipped.
console.log('what the compact encoding gives up:');
console.log('  * self-description — a reader needs the schema, out of band and versioned');
console.log('  * random access — reading the fourth value means decoding the first three');
console.log('  * error tolerance — one corrupt byte desynchronises everything after it');
console.log('');

// Two ways the budget is reached anyway, both of them ordinary.
//
// First: deltas are a bet on the signal being smooth. A door opening swings a
// room sensor by degrees between samples, and a bigger delta is a bigger
// varint.
const VOLATILE: Reading[] = READINGS.map((r, i) => ({
  ...r,
  celsius: r.celsius + (i % 2 === 0 ? -2.5 : 2.5),
}));
const volatileBytes = encodeDelta(VOLATILE).length;
console.log(`the same six readings from a sensor swinging 5 C between samples: ${volatileBytes} bytes`);
console.log(`(${delta.length} when it is smooth — the encoding degrades with the signal, it does not fail)`);
console.log('');

// Second, and the one that actually breaks it: a device that lost its link
// buffers, and then has more to say than one frame can hold. Lesson 476 is
// about what it does then; this is where the number comes from.
console.log('buffered readings against the same 51-byte frame:');
for (const count of [6, 8, 10, 12, 16]) {
  const buffered = Array.from({ length: count }, (_, i) => ({
    measuredAt: BASE_EPOCH + i * 600,
    celsius: 21.4 + i * 0.2,
    humidity: 48.2 - i * 0.2,
    battery: 61 - Math.floor(i / 8),
  }));
  const bytes = encodeDelta(buffered).length;
  console.log(`  ${String(count).padStart(2)} readings   ${String(bytes).padStart(3)} bytes   ${bytes <= BUDGET_BYTES ? 'fits' : `needs ${Math.ceil(bytes / BUDGET_BYTES)} frames`}`);
}
console.log('');
console.log('So the payload design decides how much of an outage a device can flush in one');
console.log('transmission — and at the slowest data rate, Lesson 472 showed the next');
console.log('transmission is over two minutes away.');
```

## When to Use
- Any LPWAN link, where the budget is fixed by the regional parameters rather than by your architecture
- Metered cellular, where the encoding is a line on a bill rather than a technical constraint
- Any device where transmission is the dominant power cost, since bytes and battery are the same currency
- When a device buffers, where the encoding decides how much of an outage one transmission can flush

## Common Mistakes
- **Reaching for JSON because the tooling is easier** — it is, and on a 51-byte budget it is not an option; the tooling cost is real and belongs in the estimate
- **Delta-encoding a volatile signal** — deltas are a bet on smoothness, and a signal that swings produces larger varints than the absolute values would have
- **Not versioning the schema** — a compact payload is not self-describing, so a device and a decoder that disagree produce plausible nonsense rather than an error
- **Sending timestamps per reading at a fixed interval** — the interval belongs in a header, once
- **Assuming the encoding fixes the budget** — the run above shows the same encoding needing two frames at ten readings, which is a transmission-schedule problem again
- **Forgetting the frame overhead** — the budget is the application payload, and Lesson 472's frame adds to it on the wire

## Further Reading
- [RFC 8949 — Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949) — the middle option, binary and still self-describing
- [RFC 9052 — CBOR Object Signing and Encryption (COSE)](https://datatracker.ietf.org/doc/html/rfc9052) — for when the compact payload also has to be authenticated
- [RP002-1.0.4 regional parameters](https://resources.lora-alliance.org/technical-specifications/rp002-1-0-4-regional-parameters) — where the per-data-rate payload cap is defined
- [LoRaWAN L2 1.0.4 specification](https://resources.lora-alliance.org/technical-specifications/ts001-1-0-4-lorawan-l2-1-0-4-specification) — the frame the application payload sits inside

```recall
- q: "Why is JSON not a candidate on this budget, and what is the next thing that also fails?"
  must:
    - "JSON is self-describing, which costs multiples of a 51-byte budget"
    - "a fixed-width binary layout removes names and separators and is often still over"
    - "measured: six readings of three fields is about 54 bytes fixed-width"

- q: "Explain varints, zig-zag and deltas, and what they assume."
  must:
    - "a varint spends seven bits of value per byte, so small numbers cost one byte"
    - "zig-zag maps small negatives onto small positives so -1 costs one byte"
    - "deltas store only the change, which is a bet that the signal is smooth"

- q: "Name the three things a compact encoding gives up."
  must:
    - "self-description — the schema travels separately and must be versioned"
    - "random access — the fourth value needs the first three decoded"
    - "error tolerance — one corrupt byte desynchronises everything after it"
```
