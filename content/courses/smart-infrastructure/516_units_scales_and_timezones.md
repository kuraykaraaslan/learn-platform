# 516. Units, Scales, and Timezones: Normalising at the Boundary

## What It Is
Every value crossing a system boundary arrives in that system's own convention, and the conventions disagree in ways a schema check never catches. A flow is `l/s` here and `m³/h` there. A pressure is `bar`, `kPa` or `psi`. A temperature is `°C` or `°F`. A timestamp is `2024-03-01T03:00:00` with no zone, and whether that is UTC, local winter time or local summer time is a fact about the source system that is nowhere in the payload. Every one of these is a valid number of the right type, so nothing downstream complains — it just quietly means something different.

The discipline is to **normalise at the boundary, once, into a canonical set of units and UTC**, and to make that the only place conversion happens. A value that has entered the integration is always in canonical form; a value being sent back out to a system is converted at the edge to that system's expectation. The conversion table is data — source unit, canonical unit, factor and offset — reviewed like any other reference data, because a wrong factor is a silent order-of-magnitude error.

Time is the harder half. A naive timestamp needs three pieces of information the payload rarely carries: the **zone** it was recorded in, whether that zone observes **daylight saving**, and what the source does at the **DST transition** — the hour that happens twice in autumn and the hour that never happens in spring. The safe rule is to require every source to declare its time convention in the integration contract (Lesson 522), reject naive timestamps that arrive without one, and store everything as UTC with the original offset kept alongside for audit.

Scale errors hide inside otherwise-correct conversions. A device reports an integer because it has no floating point, and the real value is `raw × 0.1` — miss the scale and every reading is ten times too big, still plausible, still passing a range check if the range was set loosely. This is why the range gate in Lesson 519 is downstream of normalisation: you can only check a value against sane bounds once it is in known units.

```quiz
- q: "Why do unit and timezone mismatches pass every schema check?"
  anchor: "Every one of these is a valid number of the right type"
  options:
    - text: "Because schemas do not validate numbers at all"
      correct: false
      why: "Schemas validate type and often range. The mismatch is that a valid number in the wrong unit is still a valid number."
    - text: "Because the value is the right type and often a plausible magnitude — only its meaning differs"
      correct: true
      why: "A flow of 42 is valid whether it means l/s or m³/h; the schema cannot tell which was intended."
    - text: "Because timestamps are always stored as strings"
      correct: false
      why: "Storage format is incidental. A naive timestamp is a valid timestamp; its missing zone is the problem."

- q: "Where should unit conversion happen in the integration?"
  anchor: "normalise at the boundary, once, into a canonical set of units and UTC"
  options:
    - text: "Wherever a value is displayed, so each view controls its own units"
      correct: false
      why: "That scatters conversion logic and guarantees inconsistency. Convert once, at entry."
    - text: "Once, at the boundary — into canonical units and UTC — and again at the edge only when sending back out"
      correct: true
      why: "Inside the integration every value is canonical; conversion lives only at the two edges."
    - text: "In the database, via a computed column per unit"
      correct: false
      why: "That still means values enter in mixed units. Normalise before storage, not after."
```

## Key Concepts
- **Every boundary value arrives in the source's own convention** — units, scale, zone — and schemas do not catch the mismatch
- **Normalise once, at the boundary**, into canonical units and UTC; convert back only at the outbound edge
- **The conversion table is reviewed reference data** — source unit, canonical unit, factor, offset
- **A naive timestamp needs three facts** the payload rarely carries: zone, whether it observes DST, and DST-transition behaviour
- **Require every source to declare its time convention** in the contract; reject naive timestamps without one
- **Store UTC, keep the original offset** alongside for audit
- **Scale errors hide inside correct conversions** — a missed `× 0.1` is a plausible order-of-magnitude error
- **Range checks come after normalisation** (Lesson 519) — bounds only mean something in known units

## Example Code
A boundary normaliser: a data-driven unit table, and a timestamp step that refuses to guess:

```typescript run
type UnitConversion = { from: string; to: string; factor: number; offset: number };

/** Reviewed reference data. `to` is always the canonical unit for that
 *  quantity. value_canonical = value_source * factor + offset. */
const UNITS: UnitConversion[] = [
  { from: 'm3/h', to: 'l/s', factor: 1000 / 3600, offset: 0 },
  { from: 'l/s', to: 'l/s', factor: 1, offset: 0 },
  { from: 'kPa', to: 'bar', factor: 0.01, offset: 0 },
  { from: 'psi', to: 'bar', factor: 0.0689476, offset: 0 },
  { from: 'bar', to: 'bar', factor: 1, offset: 0 },
  { from: 'F', to: 'C', factor: 5 / 9, offset: -32 * (5 / 9) },
  { from: 'C', to: 'C', factor: 1, offset: 0 },
];

function toCanonical(value: number, fromUnit: string): { value: number; unit: string } {
  const conv = UNITS.find((u) => u.from === fromUnit);
  if (!conv) throw new Error(`no conversion registered for unit "${fromUnit}"`);
  return { value: value * conv.factor + conv.offset, unit: conv.to };
}

/** A source reading, exactly as three different systems present it. */
const readings = [
  { source: 'SCADA', value: 151.2, unit: 'm3/h', ts: '2024-03-01T03:00:00Z' },
  { source: 'BMS', value: 14.5, unit: 'psi', ts: '2024-03-01T03:00:00+01:00' },
  { source: 'legacy-logger', value: 68, unit: 'F', ts: '2024-03-01T03:00:00' }, // naive — no zone
];

for (const r of readings) {
  const canon = toCanonical(r.value, r.unit);
  const zoned = /Z|[+-]\d{2}:\d{2}$/.test(r.ts);
  console.log(
    `${r.source.padEnd(14)} ${r.value} ${r.unit.padEnd(5)} -> ${canon.value.toFixed(3)} ${canon.unit}   ` +
      (zoned ? `ts ok (${r.ts})` : `TS REJECTED — naive timestamp, no zone declared`)
  );
}

console.log('');
console.log('The legacy logger reading is rejected at the boundary, not stored and guessed at.');
console.log('Its value converted fine; the timestamp is the problem, and the fix is a contract');
console.log('clause requiring that source to send an offset — not a heuristic here.');
```

```typescript
/** Converting a canonical value BACK to a system's expectation, for the
 *  outbound edge. Same table, read the other way. */
function fromCanonical(value: number, canonicalUnit: string, targetUnit: string): number {
  if (canonicalUnit === targetUnit) return value;
  const conv = UNITS.find((u) => u.from === targetUnit && u.to === canonicalUnit);
  if (!conv) throw new Error(`no conversion from ${canonicalUnit} to ${targetUnit}`);
  return (value - conv.offset) / conv.factor;
}
```

## When to Use
- At every inbound boundary — the gateway feed, a file import, a partner API — before anything else touches the value
- When adding a source, to register its units and time convention as reference data and contract clauses
- When a value looks wrong by a round factor (10, 100, 3.6, 1.8) — a unit or scale error is the first hypothesis
- Before wiring the range/quality gate (Lesson 519), which assumes its inputs are already canonical

## Common Mistakes
- **Converting units at display time** — every view then reimplements the table and they drift apart
- **Accepting a naive timestamp and assuming UTC** — half the time it is local, and the error is up to a day near midnight
- **Ignoring the DST transition** — the repeated autumn hour and the missing spring hour both produce real ordering and gap bugs
- **Hard-coding conversion factors in code** — they belong in reviewed data, because a wrong one is a silent 10x
- **Discarding the original offset after converting to UTC** — audit and debugging both need to see what the source actually sent
- **Range-checking before normalising** — a value in the wrong unit passes a loose bound and fails a tight one for the wrong reason

## Further Reading
- [RFC 3339 — Date and Time on the Internet: Timestamps](https://datatracker.ietf.org/doc/html/rfc3339) — the timestamp format to require from every source, offset included
- [IANA Time Zone Database](https://www.iana.org/time-zones) — the canonical source for zone rules and DST transitions, and why a zone name beats a fixed offset
- [BIPM: The International System of Units (SI)](https://www.bipm.org/en/publications/si-brochure) — the reference for canonical units and the definitions behind the conversion factors

```recall
- q: "Why do unit and timezone mismatches survive schema validation, and what is the fix?"
  must:
    - "the value is the right type and often a plausible magnitude — only its meaning differs"
    - "normalise once at the boundary into canonical units and UTC"
    - "convert back to a system's units only at the outbound edge"

- q: "What three facts does a naive timestamp lack, and how should a boundary handle one?"
  must:
    - "the zone, whether it observes DST, and its behaviour at the DST transition"
    - "require every source to declare its time convention in the contract"
    - "reject a naive timestamp rather than guessing UTC; store UTC keeping the original offset"

- q: "Why must range checks run after normalisation, not before?"
  must:
    - "a bound only means something in known units"
    - "a value in the wrong unit passes a loose bound and fails a tight one for the wrong reason"
    - "a missed scale factor is a plausible order-of-magnitude error a loose range misses"
```
