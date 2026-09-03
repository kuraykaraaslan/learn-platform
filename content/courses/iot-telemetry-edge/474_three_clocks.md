# 474. Three Clocks: Device Time, Gateway Time, Ingest Time

## What It Is
Every reading that reaches a database has passed at least three clocks, and choosing which one to keep is a decision made once, at write time, that cannot be undone afterwards.

**Device time** is the device's own clock when it sampled. It is what the reading is *about* — the instant the temperature actually was what it says. It is also the least reliable of the three: a device with no network time source drifts, a device that lost power comes back with an unset clock, and a device whose clock was never set at all reports readings from 1970.

**Gateway time** is when the gateway forwarded it. Usually close to the truth, and it is the truth about the *gateway*, not about the measurement. For a reading that sat in a device's buffer for twenty minutes, gateway time is twenty minutes wrong about the thing you care about.

**Ingest time** is your own clock when the row was written. It is the only one you can fully trust, and it is trustworthy about the wrong thing — it says when you found out, not when it happened.

The rule that follows is short: **store all three, order by device time, and validate device time against ingest time.** Ordering by ingest time produces charts that are wrong in a specific and recognisable way — a device that sends its live reading and then flushes its backlog puts newer values before older ones, and the graph shows the signal going backwards. Nothing is missing and no row is wrong; the sequence is.

Validation is where the judgement lives. A device clock **ahead of** ingest time is always wrong, because nothing can have measured something that has not happened yet. A device clock far **behind** is ambiguous: it may be an unset clock, or it may be a perfectly good reading that waited three days in a buffer. So the threshold is a policy, it has to be a stated one, and the response is to **quarantine rather than discard** — a device with a broken clock is still reporting something real, and the readings become recoverable once the offset is known.

```quiz
- q: "A chart shows the temperature rising, dropping sharply, then rising again. The device reports every ten minutes and had a brief outage. What is the likeliest cause?"
  anchor: "puts newer values before older ones"
  options:
    - text: "The sensor was disturbed during the outage"
      correct: false
      why: "Possible, and the cheaper explanation is first: the rows are in arrival order, and a backlog flushed after a live reading arrives out of sequence."
    - text: "The chart is ordered by ingest time, and a live reading arrived before the flushed backlog"
      correct: true
      why: "Every value is correct; only the order is wrong."
    - text: "Readings were lost during the outage and the gap was interpolated"
      correct: false
      why: "That would show a smooth line, not a drop and recovery."

- q: "A device's clock reads two hours ahead of your ingest clock. What do you know?"
  anchor: "nothing can have measured something that has not happened yet"
  options:
    - text: "The device is in a different time zone"
      correct: false
      why: "Timestamps are instants, not local times. A time zone difference is a formatting question, not a skew."
    - text: "The device's clock is wrong — it cannot have measured something that has not happened"
      correct: true
      why: "Ahead is unambiguous. Behind is the ambiguous direction, because a buffered reading is also behind."
    - text: "The reading is late and should be discarded"
      correct: false
      why: "Ahead is not late, and discarding is the wrong response either way — quarantine keeps it recoverable."
```

## Key Concepts
- **Device time**: when it was measured — what the reading is about, and the least reliable
- **Gateway time**: when it was forwarded — true about the gateway, not the measurement
- **Ingest time**: when the row was written — fully trustworthy about the wrong thing
- **Store all three**: they cannot be recovered from each other afterwards
- **Order by device time**: ingest order produces charts that run backwards
- **Ahead is unambiguous**: a device clock later than ingest is wrong, full stop
- **Behind is ambiguous**: an unset clock and a buffered reading look identical, so the threshold is a stated policy
- **Quarantine, do not discard**: a known clock offset makes the readings recoverable
- **This is why deduplication keys on device time** (Lesson 475), never on arrival

## Example Code
The three clocks on one device's readings, and what each ordering produces:

```typescript run
// the bug that survives review because the data looks fine.
type Arrival = {
  deviceId: string;
  /** The device's own clock when it sampled. What the reading is ABOUT. */
  deviceTime: string;
  /** The gateway's clock when it forwarded. Usually right, sometimes not. */
  gatewayTime: string;
  /** Our clock when the row was written. Always right, about the wrong thing. */
  ingestTime: string;
  celsius: number;
  note: string;
};

const ARRIVALS: Arrival[] = [
  { deviceId: 'dev-0041', deviceTime: '2026-03-01T09:00:00Z', gatewayTime: '2026-03-01T09:00:01Z', ingestTime: '2026-03-01T09:00:02Z', celsius: 21.4, note: 'normal' },
  { deviceId: 'dev-0041', deviceTime: '2026-03-01T09:10:00Z', gatewayTime: '2026-03-01T09:10:01Z', ingestTime: '2026-03-01T09:10:02Z', celsius: 21.6, note: 'normal' },
  // The link dropped. 09:20 and 09:30 were buffered on the device.
  // 09:40 went out live once the link came back, and only THEN was the
  // backlog flushed — which is what most stacks do, and what puts these
  // three rows in the database in the wrong order.
  { deviceId: 'dev-0041', deviceTime: '2026-03-01T09:40:00Z', gatewayTime: '2026-03-01T09:40:01Z', ingestTime: '2026-03-01T09:40:02Z', celsius: 22.6, note: 'live, link restored' },
  { deviceId: 'dev-0041', deviceTime: '2026-03-01T09:20:00Z', gatewayTime: '2026-03-01T09:41:00Z', ingestTime: '2026-03-01T09:41:01Z', celsius: 21.9, note: 'backlog flush' },
  { deviceId: 'dev-0041', deviceTime: '2026-03-01T09:30:00Z', gatewayTime: '2026-03-01T09:41:00Z', ingestTime: '2026-03-01T09:41:02Z', celsius: 22.2, note: 'backlog flush' },
  // A device whose clock never got set. Its readings claim 1970.
  { deviceId: 'dev-0055', deviceTime: '1970-01-01T00:04:12Z', gatewayTime: '2026-03-01T09:35:00Z', ingestTime: '2026-03-01T09:35:01Z', celsius: 19.8, note: 'clock never set' },
  // A device whose clock drifted forward. Its readings claim the future.
  { deviceId: 'dev-0062', deviceTime: '2026-03-01T11:47:00Z', gatewayTime: '2026-03-01T09:38:00Z', ingestTime: '2026-03-01T09:38:01Z', celsius: 20.3, note: 'clock drifted ahead' },
];

const ms = (iso: string) => Date.parse(iso);
const hhmm = (iso: string) => (ms(iso) < ms('2020-01-01T00:00:00Z') ? iso.slice(0, 10) : iso.slice(11, 16));

console.log('device     measured   forwarded  ingested   skew (device vs ingest)');
for (const a of ARRIVALS) {
  const skewS = (ms(a.deviceTime) - ms(a.ingestTime)) / 1000;
  const skew =
    Math.abs(skewS) < 60
      ? `${skewS.toFixed(0)} s`
      : Math.abs(skewS) < 86_400
        ? `${(skewS / 60).toFixed(0)} min`
        : `${(skewS / 86_400).toFixed(0)} days`;
  console.log(
    `${a.deviceId}  ${hhmm(a.deviceTime).padEnd(10)} ${hhmm(a.gatewayTime).padEnd(10)} ${hhmm(a.ingestTime).padEnd(10)} ${skew.padStart(9)}   ${a.note}`
  );
}
console.log('');

// The same series, ordered by each clock. Two of the three orderings are wrong
// about what happened, and neither reports an error.
const series = ARRIVALS.filter((a) => a.deviceId === 'dev-0041');
for (const [name, key] of [['device time', 'deviceTime'], ['ingest time', 'ingestTime']] as const) {
  const ordered = [...series].sort((a, b) => ms(a[key]) - ms(b[key]));
  console.log(`ordered by ${name.padEnd(12)} ${ordered.map((a) => a.celsius).join(' -> ')}`);
}
console.log('');
console.log('The 09:40 reading was sent live and the backlog followed it, so ingest order');
console.log('puts 22.6 before 21.9. A chart drawn from it shows the room warming, dropping,');
console.log('then warming again. Nothing is missing and no row is wrong; the readings are');
console.log('simply in the order they arrived rather than the order they happened.');
console.log('');

// The defence, which is not "trust the device" and not "trust the ingest".
const MAX_SKEW_MS = 60 * 60 * 1000;
type Judged = { deviceId: string; usable: boolean; reason: string };

function judge(a: Arrival): Judged {
  const skew = ms(a.deviceTime) - ms(a.ingestTime);
  if (Number.isNaN(ms(a.deviceTime))) return { deviceId: a.deviceId, usable: false, reason: 'unparseable device time' };
  // A device clock ahead of ours is always wrong: it cannot have measured
  // something that has not happened yet.
  if (skew > MAX_SKEW_MS) return { deviceId: a.deviceId, usable: false, reason: 'device clock ahead of ingest' };
  // Far behind is the unset-clock case. Note the asymmetry: a legitimately
  // buffered reading is also behind, so the threshold is a policy choice and
  // has to be a stated one.
  if (skew < -30 * 86_400 * 1000) return { deviceId: a.deviceId, usable: false, reason: 'device clock implausibly far behind' };
  return { deviceId: a.deviceId, usable: true, reason: 'within tolerance' };
}

console.log('device time, checked against ingest time before it is trusted:');
for (const a of ARRIVALS) {
  const j = judge(a);
  console.log(`  ${j.deviceId}  ${j.usable ? 'accept' : 'quarantine'}  ${j.reason}`);
}
console.log('');
console.log('Store all three. Order by device time. Check it against ingest time, and');
console.log('quarantine rather than discard — a device with a broken clock is still');
console.log('reporting something, and the reading is recoverable once the clock is fixed.');
```

## When to Use
- Designing the telemetry schema, where three columns is the decision and one column is the regret
- Drawing any chart from time-series data, where the ordering column is the whole correctness question
- Writing ingest validation, where the skew check is cheap and catches an entire class of device fault
- Investigating data that looks impossible — a skew report per device usually names the culprit immediately

## Common Mistakes
- **Storing one timestamp** — whichever you keep, the other two are gone, and which one you needed becomes clear later
- **Ordering by ingest time** — it is the reliable column and it answers a different question, so charts drawn from it are wrong in the way described above
- **Discarding readings with implausible clocks** — the measurement is real; only its timestamp is unknown, and a quarantine keeps it recoverable
- **Using an unstated skew threshold** — "far behind" covers both an unset clock and a legitimate three-day buffer, so the cut-off is a policy that has to be written down
- **Treating a clock ahead as a time-zone problem** — timestamps are instants; a device claiming the future has a broken clock
- **Trusting device time without checking it** — the correct column and the unreliable one are the same column, which is why validation is not optional

## Further Reading
- [MQTT 5.0 specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html) — the broker adds no timestamp of its own, which is why the payload must carry one
- [LoRaWAN L2 1.0.4 specification](https://resources.lora-alliance.org/technical-specifications/ts001-1-0-4-lorawan-l2-1-0-4-specification) — where gateway-side reception metadata comes from
- [PostgreSQL date/time types](https://www.postgresql.org/docs/current/ddl-partitioning.html) — and Lesson 477 on why the storage column's type and time zone matter as much as its value

```recall
- q: "Name the three clocks and what each is true about."
  must:
    - "device time — when it was measured, what the reading is about, least reliable"
    - "gateway time — when it was forwarded, true about the gateway"
    - "ingest time — when the row was written, fully trustworthy about when you found out"

- q: "State the rule, and the symptom of breaking it."
  must:
    - "store all three, order by device time, validate device time against ingest time"
    - "ordering by ingest time puts a live reading before a flushed backlog"
    - "so the chart shows the signal going backwards, with every row correct"

- q: "Why is a clock ahead unambiguous and a clock behind not?"
  must:
    - "nothing can have measured something that has not happened yet"
    - "behind could be an unset clock or a legitimately buffered reading"
    - "so the threshold is a stated policy, and the response is quarantine rather than discard"
```
