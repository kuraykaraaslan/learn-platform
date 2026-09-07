# 576. RFID and NFC: When the Tag Does Not Have to Be Seen

## What It Is
An optical code has one hard requirement: a clear line of sight to a clean, undamaged, adequately lit symbol. A great deal of plant fails that test — a tag behind a duct, under insulation, inside a cabinet, or simply covered in the grime of a decade. **A radio-frequency tag removes the line-of-sight requirement**, and that is the entire reason to consider one, because in every other respect it is more expensive and more complicated.

The mechanism is worth understanding because it explains the constraints. A **passive** tag has no battery: the reader's field powers it, and it replies by modulating that field. A **battery-assisted** or **active** tag carries its own power and can be read further away and more reliably, at the cost of a battery that will eventually be flat inside a tag that is riveted to a machine (Lesson 537's arithmetic, on a device nobody will service). **NFC** is a short-range case of the same physics, standardised so that ordinary phones can act as readers — which matters enormously, because it removes the dedicated-hardware requirement that kills most RFID proposals.

The most important thing to understand about range is that **it is not a property of the tag**. It emerges from the reader's transmit power, the antenna on both ends, the frequency band, the material the tag is mounted on and what is between them. A tag on metal behaves differently from the same tag on plastic; a tag inside a metal cabinet may not be readable at all. Any number quoted for a tag in isolation is a laboratory figure, and the only honest way to establish range is to measure it in the installation. The air interfaces themselves are specified in the ISO/IEC 18000 series, by band.

The consequence that surprises developers is **collision**. Optical scanning reads exactly one symbol because the operator points at one. A radio reader energises everything in range at once, and if six tags reply simultaneously the reply is unintelligible. Every RF system therefore runs an **anti-collision** protocol to single tags out one at a time, which is why reading a cabinet of tagged parts takes a measurable amount of time and why a reader can return a tag that is not the one you meant to read. Being able to read without aiming is the feature; having to establish *which* tag you read is the cost, and it turns Lesson 577's checks from good practice into a requirement.

```quiz
- q: "What is the one reason to choose a radio-frequency tag over an optical code?"
  anchor: "removes the line-of-sight requirement"
  options:
    - text: "It stores more data"
      correct: false
      why: "Capacity was never the constraint — the tag carries an identifier (Lesson 573)."
    - text: "It removes the line-of-sight requirement, so tags behind ducts, under insulation or covered in grime still read"
      correct: true
      why: "In every other respect it is more expensive and more complicated."
    - text: "It cannot be damaged"
      correct: false
      why: "It can — and unlike a printed code, a person cannot tell by looking."

- q: "Why is a quoted read range for an RFID tag not a useful number?"
  anchor: "it is not a property of the tag"
  options:
    - text: "Because manufacturers exaggerate it"
      correct: false
      why: "Even an honest figure describes a laboratory arrangement rather than your installation."
    - text: "Because range emerges from reader power, both antennas, the band, the mounting material and what is in between"
      correct: true
      why: "A tag on metal behaves differently from the same tag on plastic; inside a cabinet it may not read at all."
    - text: "Because range varies with the tag's remaining battery"
      correct: false
      why: "True for active tags only, and passive tags have no battery at all."

- q: "What problem does a radio reader have that an optical scanner does not?"
  anchor: "if six tags reply simultaneously the reply is unintelligible"
  options:
    - text: "It cannot read damaged tags"
      correct: false
      why: "Both struggle with damage; the RF case is just less visible."
    - text: "Collision — it energises everything in range at once, so it needs an anti-collision protocol to single tags out"
      correct: true
      why: "Which is why a reader can return a tag that is not the one you meant to read."
    - text: "It cannot distinguish tag types"
      correct: false
      why: "The air interface handles that; the difficulty is having many tags reply at once."
```

## Key Concepts
- **The reason to use RF is line of sight** — behind a duct, under insulation, inside a cabinet, under grime
- **Passive** tags are powered by the reader's field; **active** tags carry a battery that will be flat inside a riveted tag
- **NFC** is short-range RF that ordinary phones can read, which removes the dedicated-hardware barrier
- **Range is a system property**, not a tag property: reader power, antennas, band, mounting material, obstructions
- **A tag on metal behaves differently** from the same tag on plastic
- **Air interfaces are specified in ISO/IEC 18000**, by band
- **Collision is the RF-specific problem** — many tags reply at once, so an anti-collision protocol singles them out
- **Reading without aiming means you must establish which tag you read** — Lesson 577 becomes mandatory

## Example Code
Anti-collision, as the search it actually is. The reader asks "does any tag's identifier start with this prefix?" and splits until exactly one answers:

```typescript run
/** A binary-tree singulation walk. The reader broadcasts a prefix; every tag
 *  whose id starts with it replies. One reply is a read; several replies
 *  collide and the reader extends the prefix and asks again. */
const tags = ['0011', '0110', '0111', '1010']; // four tags in range

let queries = 0;
const found: string[] = [];

function walk(prefix: string): void {
  queries++;
  const replying = tags.filter((t) => t.startsWith(prefix));
  if (replying.length === 0) {
    console.log(`  query "${prefix.padEnd(4)}" -> silence`);
    return;
  }
  if (replying.length === 1) {
    console.log(`  query "${prefix.padEnd(4)}" -> one reply: ${replying[0]}`);
    found.push(replying[0]);
    return;
  }
  console.log(`  query "${prefix.padEnd(4)}" -> COLLISION (${replying.length} tags)`);
  walk(prefix + '0');
  walk(prefix + '1');
}

console.log(`${tags.length} tags in range: ${tags.join(', ')}`);
console.log('');
walk('');

console.log('');
console.log(`read ${found.length} tags in ${queries} queries: ${found.join(', ')}`);
console.log('');
console.log('Two things follow from that trace. Reading a population takes a number of');
console.log('exchanges that grows with the population, not with the one tag you wanted --');
console.log('so a reader near a cabinet of tagged parts is slow for a reason. And every tag');
console.log('in range gets read, including the one on the shelf behind the asset, which is');
console.log('why "the reader returned an identifier" is not the same as "I identified the');
console.log('asset in front of me" (Lesson 577).');
```

## When to Use
- When the tag genuinely cannot be seen — behind services, under lagging, inside an enclosure
- When the environment destroys printed labels faster than they can be replaced
- When phones are the reading device and NFC removes the need to deploy dedicated hardware
- When many assets are read in one pass and the aiming step is the bottleneck
- Never for range alone, without measuring it in the actual installation with the actual mounting

## Common Mistakes
- **Quoting a tag's range from a datasheet** — range is a property of the whole installation
- **Ignoring the mounting material** — a tag designed for plastic, applied to metal, may not read at all
- **Choosing active tags without a battery plan** — the battery dies inside a tag riveted to a machine
- **Assuming one read means one asset** — the reader energises everything in range (Lesson 577)
- **Dropping the printed code** — an RF tag gives a person standing in front of the asset nothing to read or type
- **Deploying RF where optical would work** — it is more expensive, more complex, and invisible when it fails

## Further Reading
- [ISO/IEC 18000-3 — RFID air interface for the 13.56 MHz band](https://www.iso.org/standard/53424.html) — the band NFC-class systems use, and what the air interface specifies; catalogue reference, the clause text is paid
- [ISO/IEC 18000-63 — RFID air interface for the UHF band](https://www.iso.org/standard/63675.html) — the longer-range band and its anti-collision arrangement; catalogue reference
- [Lesson 577](/courses/asset-identification/the-scan-that-fails-and-the-scan-that-lies) — the checks that become mandatory once reading no longer requires aiming
- [Lesson 537](/courses/iot-hardware-basics/energy-budgets) — the battery arithmetic, applied here to a tag nobody will ever service

```recall
- q: "What is the one good reason to choose an RF tag, and what does it cost?"
  must:
    - "it removes the line-of-sight requirement -- behind services, under insulation, inside enclosures, under grime"
    - "it costs more, is more complex, and fails invisibly"
    - "and a person standing in front of the asset gets nothing from it unless a printed code is there too"

- q: "Why is a tag's quoted read range not a usable figure?"
  must:
    - "range is a system property: reader power, both antennas, the band, the mounting material and obstructions"
    - "the same tag on metal and on plastic behave differently"
    - "the only honest range is one measured in the actual installation"

- q: "What is collision and what follows from it?"
  must:
    - "a radio reader energises every tag in range and several may reply at once, making the reply unintelligible"
    - "an anti-collision protocol singles tags out one at a time, so reading a population takes time proportional to it"
    - "and every tag in range is read, so a returned identifier is not proof of which asset is in front of you"
```
