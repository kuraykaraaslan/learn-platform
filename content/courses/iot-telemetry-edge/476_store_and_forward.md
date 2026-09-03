# 476. Store-and-Forward: A Device That Loses Its Link and Comes Back

## What It Is
A device that cannot reach the network has two choices: throw the reading away, or keep it. Keeping it is called store-and-forward, and it turns one problem into four smaller ones that all have to be answered before the first outage rather than during it.

**How much can it keep?** A device has a fixed buffer, so the question is what happens when it fills. There are only three answers and each is a product decision, not a technical one: drop the newest reading, drop the oldest, or reduce the sampling rate and keep a longer window at lower resolution. Which is right depends entirely on what the data is for — for an alarm, the newest matters; for a compliance record, the oldest is the one that cannot be lost.

**How does it come back?** A device whose link returns and immediately transmits everything it has is a device that will hit the duty-cycle wall in Lesson 472 within seconds, then spend hours dribbling out the rest. Worse, an outage usually affects many devices at once — a gateway rebooted, a power cut ended — so they all come back together and flush together. The mitigation is the same one (#5) describes, with the parameters from this domain: spread the flush, and jitter it per device, so a fleet does not synchronise.

**What order does it send in?** Newest-first gets the current state to the operator immediately and leaves the backlog to fill in behind; oldest-first keeps the series contiguous as it arrives. Newest-first is usually right for anything with a dashboard, and it is what produces the out-of-order arrivals Lesson 474 is about.

**How does it know what to stop keeping?** Only an acknowledgement can tell it, so a device that buffers needs a confirmed-delivery path. Under Lesson 471's QoS 0 there is no acknowledgement at all, which means either accepting that the buffer is trimmed on a guess, or paying for QoS 1 precisely because the buffer exists.

The reason none of this can be added later is that **it is a device-firmware decision**, and the device is in a ceiling void, on a pole, or cast into a wall. Lesson 479 is about updating it; this lesson is about what you would rather not have to.

```quiz
- q: "A gateway reboots and two hundred devices reconnect at once. What is the failure?"
  anchor: "they all come back together and flush together"
  options:
    - text: "The broker's connection limit is exceeded"
      correct: false
      why: "Possible and secondary. The transmissions themselves are the problem, and on a duty-cycled link they are also self-limiting in the worst way."
    - text: "Every device flushes its backlog simultaneously, so the channel saturates and each device then dribbles its remainder out for hours"
      correct: true
      why: "Which is why a flush is spread and jittered per device — the same argument as rate-limiting a client fleet."
    - text: "Readings are lost because the devices' buffers overflowed during the outage"
      correct: false
      why: "That is the separate buffer-policy question, and it happened during the outage rather than at reconnection."

- q: "Why does a buffering device need confirmed delivery?"
  anchor: "Only an acknowledgement can tell it"
  options:
    - text: "It does not — it can delete a reading once it has been transmitted"
      correct: false
      why: "Transmitted is not delivered. Without an acknowledgement the device is guessing, and the guess is wrong exactly when the link is bad."
    - text: "Because nothing else tells it which readings it may stop keeping"
      correct: true
      why: "Under QoS 0 there is no acknowledgement, so either the buffer is trimmed on a guess or you pay for QoS 1 because the buffer exists."
    - text: "Because the buffer must be written in delivery order"
      correct: false
      why: "Order is a separate choice — newest-first or oldest-first — and neither depends on acknowledgement."
```

## Key Concepts
- **Buffer size is finite**: the overflow policy is a product decision made in firmware
- **Three overflow policies**: drop newest, drop oldest, or downsample and keep a longer window
- **Flush is a thundering herd**: an outage ends for many devices at once
- **Spread and jitter the flush** per device — (#5)'s argument with this domain's parameters
- **Newest-first or oldest-first**: a dashboard wants the former, a contiguous series the latter
- **Newest-first produces out-of-order arrivals** — which is why Lesson 474's ordering rule exists
- **Only an acknowledgement lets a buffer be trimmed**, so QoS 0 and buffering are in tension (Lesson 471)
- **The duty cycle caps the flush rate** (Lesson 472), so a long outage takes a long time to clear
- **All of it is firmware**, and the device is somewhere inconvenient (Lesson 479)

## Example Code
There is no runtime here: what this lesson describes is a device's own behaviour over hours, and a page cannot honestly simulate a radio. The decisions, though, are a small amount of state that is worth writing down explicitly:

```typescript
/** The four decisions, as one type. Making them a configuration object rather
 *  than scattered constants is the difference between a policy you can state
 *  and one you discover during an incident. */
export type BufferPolicy = {
  /** Readings, not bytes — the device knows its own record size. */
  capacity: number;
  /** What happens when it is full. There is no fourth option. */
  onFull: 'drop-newest' | 'drop-oldest' | 'downsample';
  /** Whether the current state or the contiguous series matters more. */
  flushOrder: 'newest-first' | 'oldest-first';
  /** Delay before flushing after the link returns, so a fleet that lost the
   *  same gateway does not come back in the same second. Per device, derived
   *  from the device id rather than randomised, so it is reproducible. */
  flushJitterSeconds: number;
  /** Readings per transmission, bounded by the payload budget of Lesson 473
   *  and paced by the duty cycle of Lesson 472. */
  readingsPerFrame: number;
};

/** Deriving jitter from the device id rather than from a random source: the
 *  spread is the same every time the device reconnects, which makes a field
 *  problem reproducible instead of a coincidence. */
export function jitterSecondsFor(deviceId: string, windowSeconds: number): number {
  let hash = 0;
  for (const ch of deviceId) hash = (Math.imul(hash, 31) + ch.charCodeAt(0)) | 0;
  return Math.abs(hash) % windowSeconds;
}

/** How long a backlog takes to clear, which is the number that decides whether
 *  the buffer policy above is adequate. `secondsPerFrame` comes from
 *  Lesson 472's duty-cycle calculation, not from how fast the device could go. */
export function drainSeconds(buffered: number, policy: BufferPolicy, secondsPerFrame: number): number {
  return Math.ceil(buffered / policy.readingsPerFrame) * secondsPerFrame;
}
```

## When to Use
- Any device on an intermittent link, which on a radio network is every device
- When deciding whether a gap in the data is acceptable, since the alternative is firmware complexity that has to be maintained in the field
- When sizing a buffer, where the useful question is which outage length you intend to survive and which you accept losing
- When an ingest sees a burst of old readings and needs to know whether that is a flush or a fault

## Common Mistakes
- **Not deciding the overflow policy** — the firmware has one regardless, and if nobody chose it, it is whatever the ring buffer happened to do
- **Flushing everything on reconnect** — the channel saturates, the duty cycle then throttles the device for hours, and a fleet does it in unison
- **Randomising jitter instead of deriving it** — a reproducible spread makes a field problem reproducible; a random one makes it a coincidence
- **Buffering under QoS 0** — nothing acknowledges, so the device trims its buffer on a guess exactly when the link is unreliable
- **Assuming the backlog arrives in order** — newest-first is usually the right choice, and it guarantees out-of-order arrival (Lesson 474)
- **Sizing the buffer without the drain time** — a buffer that holds three days and takes four days to flush is not a three-day buffer

## Further Reading
- [MQTT 5.0 specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html) — session state and message expiry, which decide what a broker holds for a client that is away
- [LoRaWAN L2 1.0.4 specification](https://resources.lora-alliance.org/technical-specifications/ts001-1-0-4-lorawan-l2-1-0-4-specification) — confirmed versus unconfirmed uplinks, which is where the acknowledgement for a buffer trim comes from
- [RP002-1.0.4 regional parameters](https://resources.lora-alliance.org/technical-specifications/rp002-1-0-4-regional-parameters) — the duty-cycle limits that set how fast a backlog can drain

```recall
- q: "Name the four decisions store-and-forward forces, before an outage happens."
  must:
    - "how much to keep, and what to drop when the buffer is full"
    - "how to come back — spread and jittered, not all at once"
    - "what order to send in — newest-first or oldest-first"
    - "how the device learns what it may stop keeping"

- q: "Why is the reconnection a thundering herd, and what makes it worse here?"
  must:
    - "an outage usually ends for many devices at once — a gateway rebooted, power returned"
    - "they flush together and saturate the channel"
    - "and the duty cycle then throttles each device for hours afterwards"

- q: "What is the tension between buffering and QoS 0?"
  must:
    - "only an acknowledgement tells a device which readings it may delete"
    - "QoS 0 has no acknowledgement"
    - "so either the buffer is trimmed on a guess, or QoS 1 is paid for because the buffer exists"
```
