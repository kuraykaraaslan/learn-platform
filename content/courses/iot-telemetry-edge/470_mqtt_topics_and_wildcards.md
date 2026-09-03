# 470. MQTT Topics, Wildcards, and the Matching Rule

## What It Is
MQTT's addressing is a slash-separated **topic**, published to by a client and subscribed to by a **filter** that may contain wildcards. There is no registry, no schema and no creation step: a topic exists because someone published to it. That freedom is why topic design is a design decision rather than a naming convention.

The matching rule is small and has exactly two wildcards. `+` matches **exactly one level** — never zero, never two — so `site/+/temp` matches `site/depot/temp` and matches neither `site/temp` nor `site/depot/plant/temp`. `#` matches **this level and everything below it**, must be the last character of the filter, and — the part that surprises everyone — matches the parent level too: `site/#` matches the topic `site`.

Two more details decide real behaviour. **Empty levels are levels**: `/site/temp` has three levels, the first empty, and does not match `site/temp`. And a topic beginning `$` is reserved for the broker's own metrics and is deliberately not matched by a bare `#`.

The reason to know this precisely is not correctness for its own sake — it is that **the filter is your bandwidth bill**. A subscriber that asks for `#` and discards what it does not want has still moved every byte across the link. On a metered connection, or on a broker fanning out to hundreds of subscribers, the filter is the single biggest lever you have.

```quiz
- q: "Does the filter `site/#` match the topic `site`?"
  anchor: "matches the parent level too"
  options:
    - text: "No — the filter has two levels and the topic has one"
      correct: false
      why: "This is the case nearly every hand-rolled matcher gets wrong. `#` matches the parent level as well as everything below it."
    - text: "Yes — `#` matches its parent level as well as every level beneath it"
      correct: true
      why: "It is in the specification and it is counter-intuitive, which is a bad combination."
    - text: "Only if the topic is published as `site/`"
      correct: false
      why: "`site/` is a two-level topic with an empty second level, and a different thing again."

- q: "Why does a subscription filter matter beyond correctness?"
  anchor: "the filter is your bandwidth bill"
  options:
    - text: "It does not — the broker filters, so the client pays nothing"
      correct: false
      why: "The broker filters before sending, which is exactly why a wide filter costs: everything matching it is sent to you."
    - text: "A wide filter moves every matching byte to the subscriber, whether or not the subscriber uses it"
      correct: true
      why: "Discarding after receipt is discarding after paying."
    - text: "Because wildcards are slower to evaluate than literal topics"
      correct: false
      why: "Matching cost is negligible next to transport. The bytes are the cost."
```

## Key Concepts
- **Topic**: slash-separated levels, created by publishing, with no registry or schema
- **`+`**: exactly one level — not zero, not more
- **`#`**: this level and everything below; must be last; matches its parent level too
- **Empty levels count**: `/site` and `site` are different topics
- **`$`-prefixed topics** are broker-internal and not matched by a bare `#`
- **The filter is the bandwidth decision** — a subscriber pays for everything that matches
- **Topic design is data modelling**: what varies goes in a level, so it can be wildcarded later
- **Identity in the topic, not the payload**: a device id in the topic lets the broker route it; in the payload only the subscriber can

## Example Code
The whole matching rule, with the cases that catch people:

```typescript run
// and subtle enough that nearly every hand-rolled version gets one of the
// three edge cases wrong.
type Match = { filter: string; topic: string; matches: boolean };

/** MQTT 5.0 section 4.7: `+` matches exactly one level, `#` matches this level
 *  and every level below it and must be the last character of the filter. */
function topicMatches(filter: string, topic: string): boolean {
  const f = filter.split('/');
  const t = topic.split('/');

  for (let i = 0; i < f.length; i++) {
    if (f[i] === '#') {
      // `#` is only legal as the final level, and it matches the parent level
      // too: `site/#` matches `site`. It does NOT match a topic that has
      // fewer levels than the filter's prefix.
      return i === f.length - 1 && t.length >= i;
    }
    if (i >= t.length) return false;
    if (f[i] === '+') continue; // exactly one level, whatever it contains
    if (f[i] !== t[i]) return false;
  }
  // Every filter level matched; the topic must not have levels left over.
  return f.length === t.length;
}

const CASES: Match[] = [
  { filter: 'site/+/temp', topic: 'site/depot/temp', matches: true },
  // `+` is exactly one level, so it does not span a slash.
  { filter: 'site/+/temp', topic: 'site/depot/plant/temp', matches: false },
  // ...and it does not match zero levels either.
  { filter: 'site/+/temp', topic: 'site/temp', matches: false },
  { filter: 'site/#', topic: 'site/depot/plant/temp', matches: true },
  // `#` matches the parent level as well — the case most hand-rolled
  // matchers miss, because it looks like it should need a trailing slash.
  { filter: 'site/#', topic: 'site', matches: true },
  { filter: '#', topic: 'site/depot/temp', matches: true },
  // A leading empty level is a real level. `/site` is not `site`.
  { filter: '/site/temp', topic: 'site/temp', matches: false },
  // Trailing empty level, likewise.
  { filter: 'site/temp', topic: 'site/temp/', matches: false },
  { filter: 'site/depot/+', topic: 'site/depot/', matches: true },
  { filter: 'site/+/+', topic: 'site/depot/temp', matches: true },
  { filter: 'site/+', topic: 'site/depot/temp', matches: false },
];

let wrong = 0;
console.log('filter            topic                      expect  got');
for (const c of CASES) {
  const got = topicMatches(c.filter, c.topic);
  if (got !== c.matches) wrong++;
  console.log(
    `  ${c.filter.padEnd(16)} ${c.topic.padEnd(26)} ${String(c.matches).padEnd(7)} ${got}${got === c.matches ? '' : '   <- WRONG'}`
  );
}
console.log('');
console.log(wrong === 0 ? 'all cases agree' : `${wrong} cases disagree`);
console.log('');
console.log('Note the two that surprise people: `site/#` matches `site` itself, and');
console.log('`site/+/temp` matches neither `site/temp` nor `site/a/b/temp`. A single-level');
console.log('wildcard is exactly one level — never zero, never two.');
console.log('');

// Why it matters beyond correctness: a subscription is how much traffic you
// asked for, and `#` at the root asks for all of it.
const TOPICS = [
  'site/depot/plant/dev-0041/celsius',
  'site/depot/plant/dev-0041/humidity',
  'site/depot/plant/dev-0041/battery',
  'site/depot/yard/dev-0042/celsius',
  'site/depot/yard/dev-0042/battery',
  'site/depot/plant/dev-0041/status',
  'sys/broker/uptime',
];
console.log('what each subscription would deliver, from one broker:');
for (const filter of ['#', 'site/#', 'site/+/+/+/celsius', 'site/depot/plant/#', 'site/+/+/+/battery']) {
  const delivered = TOPICS.filter((t) => topicMatches(filter, t));
  console.log(`  ${filter.padEnd(22)} ${String(delivered.length).padStart(2)} of ${TOPICS.length} topics`);
}
console.log('');
console.log('The filter is the bandwidth decision. Subscribing to `#` and discarding what');
console.log('you do not want still moves every byte across the link first.');
```

## When to Use
- When designing a topic hierarchy, where the order of levels decides which questions can be asked with one subscription
- When a subscriber is receiving more than it needs, which is a filter problem before it is a processing problem
- When implementing anything that routes on topic — a bridge, a rule engine, a test double — where the two surprising cases are where it will be wrong
- When metering a connection, since the filter is the largest single lever on what crosses it

## Common Mistakes
- **Treating `+` as "anything"** — it is exactly one level, so a filter written for a three-level topic silently stops matching when a fourth is added
- **Assuming `site/#` excludes `site`** — it includes it, and a handler that assumes a minimum level count will index past the end of the array
- **Putting the device id in the payload only** — the broker can route on a topic and cannot route on a payload, so every subscriber then receives everything
- **Subscribing to `#` in development and leaving it** — it works, it is invisible, and it is the whole broker's traffic on your link
- **Forgetting that empty levels are levels** — a stray leading or trailing slash produces a topic that never matches the filter anyone wrote
- **Designing the hierarchy around today's dashboard** — the levels are what future subscriptions can wildcard on, and reordering them later means re-publishing everything

## Further Reading
- [MQTT 5.0 specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html) — section 4.7 is the matching rule in full, and short enough to read whole
- [MQTT 3.1.1 specification](https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html) — the version much deployed hardware still speaks; topic matching is unchanged between them
- [LoRa Alliance technical specifications](https://resources.lora-alliance.org/technical-specifications/ts001-1-0-4-lorawan-l2-1-0-4-specification) — for contrast, a link layer where addressing is not yours to design

```recall
- q: "State the two wildcards and exactly what each matches."
  must:
    - "+ matches exactly one level — never zero, never more"
    - "# matches this level and every level below it, and must be last"
    - "# also matches its parent level: site/# matches site"

- q: "Give two topic details that break naive matchers."
  must:
    - "empty levels are levels — /site and site are different topics"
    - "# matches the parent level, so a handler cannot assume a minimum depth"
    - "$-prefixed broker topics are not matched by a bare #"

- q: "Why is the subscription filter an architectural decision?"
  must:
    - "everything matching the filter is sent to the subscriber"
    - "discarding after receipt is discarding after paying for transport"
    - "so topic design decides which questions one subscription can answer"
```
