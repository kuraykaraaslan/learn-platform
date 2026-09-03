# 479. Device Fleet Management: Configuration, OTA Updates, and Rollback

## What It Is
One device is a project. A thousand devices is an operation, and the difference is that you can no longer touch any of them.

**Configuration** is the easy half and still has a shape worth getting right. A device's settings — reporting interval, thresholds, which server to talk to — should be data the device fetches or is pushed, not constants compiled into firmware, because changing a compiled constant means an update and an update is the risky operation this lesson is mostly about. The pattern that works is desired-versus-reported: the server holds what the configuration *should* be, the device reports what it *is*, and the gap between them is the fleet's to-do list. That gap is also the monitoring signal — a device whose reported configuration has not matched the desired one for a week is a device with a problem, and nothing else would have told you.

**Over-the-air updates** are the hard half, and the danger is not the update failing. It is the update *succeeding* at installing something that does not work, on a device you cannot reach. Three properties keep that survivable. The update is **staged**: a canary group, then a percentage, then the fleet, with a stop between each — the same argument as (#56), with the difference that a bad rollout here cannot be fixed by redeploying. The device **verifies before it commits**: a partial download or a corrupted image is detected on the device, before anything is overwritten. And there is an **automatic rollback**: the device boots the new image on probation, and if it does not check in successfully within a window, the bootloader reverts to the previous one without anyone asking it to.

That last property is what makes the difference between a fleet you can update and one you can only update carefully. A rollback that requires a command from the server cannot help a device whose new firmware broke its networking — which is precisely the failure that most needs recovering from.

**Firmware signing and the trust chain are Lesson 478's subject and are deliberately not covered here.** An OTA mechanism that installs whatever it downloaded is a remote code execution feature, and the question of what makes an image trustworthy belongs with identity, provisioning and revocation — where it is treated as the security topic it is, on a page that carries no exercises for that reason.

```quiz
- q: "What is the dangerous failure mode of an OTA update?"
  anchor: "It is the update *succeeding* at installing something that does not work"
  options:
    - text: "The download failing partway and corrupting the image"
      correct: false
      why: "Real, and the one that is easy to defend: the device verifies the image before committing to it."
    - text: "The update installing successfully and the new firmware not working, on a device you cannot reach"
      correct: true
      why: "Which is why the device boots on probation and reverts itself if it does not check in."
    - text: "Devices updating at different times and ending up on mixed versions"
      correct: false
      why: "That is the normal, intended state of a staged rollout rather than a failure."

- q: "Why must rollback be automatic rather than commanded?"
  anchor: "cannot help a device whose new firmware broke its networking"
  options:
    - text: "Because a command would be too slow across a large fleet"
      correct: false
      why: "Speed is secondary. The problem is that the device may no longer be able to receive a command at all."
    - text: "Because the firmware that most needs reverting is the firmware that broke the device's ability to be reached"
      correct: true
      why: "A commanded rollback works for exactly the cases you did not need it for."
    - text: "Because devices cannot be trusted to apply a command correctly"
      correct: false
      why: "They can. The issue is delivery, not execution."
```

## Key Concepts
- **Configuration is data, not compiled constants** — changing a constant means an update, and updates are the risk
- **Desired versus reported**: the server holds what it should be, the device reports what it is
- **The gap is the to-do list, and the monitoring signal** — a device stuck on an old configuration is a device with a problem
- **Staged rollout**: canary, then a percentage, then the fleet, with a stop between each (#56)
- **Verify before commit**: a corrupted or partial image is detected on the device, before anything is overwritten
- **Automatic rollback**: boot on probation, revert if the device does not check in
- **A commanded rollback cannot save a device that lost its network** — which is the case that needs it
- **Bandwidth is the constraint**: a firmware image is orders of magnitude larger than a reading (Lesson 472)
- **Signing and the trust chain belong to Lesson 478** — an OTA path that installs anything is remote code execution

## Example Code
The configuration model, which is where most of the operational value is and none of the danger:

```typescript
/** Desired versus reported, as two halves of one record. The gap between them
 *  is what the fleet dashboard is actually showing. */
type DeviceConfig = {
  reportIntervalSeconds: number;
  alertThresholdCelsius: number;
  firmwareVersion: string;
};

export type FleetEntry = {
  deviceId: string;
  desired: DeviceConfig;
  /** Null until the device has reported once — a genuinely different state
   *  from "reported something that does not match". */
  reported: DeviceConfig | null;
  reportedAt: string | null;
};

export type Drift =
  | { state: 'never-reported' }
  | { state: 'in-sync' }
  | { state: 'pending'; fields: string[] }
  | { state: 'stale'; fields: string[]; sinceHours: number };

/** A device that has not converged for a while is the signal. Distinguishing
 *  "applying" from "stuck" is a threshold, and like Lesson 474's skew
 *  threshold it is a policy that has to be stated rather than assumed. */
export function drift(entry: FleetEntry, nowMs: number, staleAfterHours: number): Drift {
  if (entry.reported === null || entry.reportedAt === null) return { state: 'never-reported' };

  const fields = (Object.keys(entry.desired) as (keyof DeviceConfig)[]).filter(
    (key) => entry.desired[key] !== entry.reported![key]
  );
  if (fields.length === 0) return { state: 'in-sync' };

  const sinceHours = (nowMs - Date.parse(entry.reportedAt)) / 3_600_000;
  return sinceHours > staleAfterHours
    ? { state: 'stale', fields, sinceHours }
    : { state: 'pending', fields };
}

/** A rollout stage, expressed so that "stop" is a state rather than a
 *  decision someone has to remember to make. Each stage names what it is
 *  waiting for, and the wait is what makes it staged rather than merely slow. */
export type RolloutStage = {
  name: string;
  /** Fraction of the fleet, cumulative. */
  share: number;
  /** How long to hold here before the next stage is allowed to begin. */
  soakHours: number;
  /** The condition that must hold at the end of the soak. Expressed as a
   *  check-in rate rather than an error rate: a device that broke badly does
   *  not report an error, it stops reporting. */
  minimumCheckInRate: number;
};

export const ROLLOUT: RolloutStage[] = [
  { name: 'canary', share: 0.01, soakHours: 24, minimumCheckInRate: 1.0 },
  { name: 'early', share: 0.1, soakHours: 48, minimumCheckInRate: 0.99 },
  { name: 'broad', share: 0.5, soakHours: 48, minimumCheckInRate: 0.99 },
  { name: 'fleet', share: 1.0, soakHours: 0, minimumCheckInRate: 0.99 },
];
```

Note the check-in rate rather than an error rate. A device whose update went badly does not send you an error; it stops sending anything, which means the metric that detects the worst outcome is an absence.

## When to Use
- As soon as a second device exists, since the configuration model is much cheaper to adopt early than to retrofit
- Before the first field update, where the rollback path has to be proven on a real device rather than assumed
- When a fleet's behaviour is inconsistent, where configuration drift usually explains it before firmware version does
- When planning update bandwidth, since a firmware image against Lesson 472's budget may simply not be deliverable over the primary link

## Common Mistakes
- **Compiling configuration into firmware** — every threshold change becomes a firmware update, which is the operation with all the risk
- **Not tracking reported configuration** — desired-only means the fleet dashboard shows intentions rather than facts
- **Updating everything at once** — a staged rollout with a soak is the only thing standing between a bad image and every device
- **Relying on a commanded rollback** — the device that most needs reverting is the one that can no longer be reached
- **Alerting on error rate after a rollout** — a badly broken device reports nothing at all, so the signal is a drop in check-ins
- **Never testing the rollback in the field** — a lab rollback proves the mechanism; a field rollback proves the mechanism plus the radio, the power budget and the bootloader on the actual hardware
- **Skipping image verification** — this lesson stops here on purpose, and Lesson 478 is where trust in an image is established

## Further Reading
- [ThingsBoard documentation](https://thingsboard.io/docs/) — one platform's attribute model, which is the desired-versus-reported pattern with names attached
- [MQTT 5.0 specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html) — retained messages and the Last Will, which are how a fleet notices a device stopped checking in (Lesson 471)
- [LoRaWAN L2 1.0.4 specification](https://resources.lora-alliance.org/technical-specifications/ts001-1-0-4-lorawan-l2-1-0-4-specification) — the downlink model, and why pushing anything to a device on this link is not like pushing to a server

```recall
- q: "Describe the desired-versus-reported configuration model and what it buys."
  must:
    - "the server holds what the configuration should be, the device reports what it is"
    - "the gap between them is the fleet's to-do list"
    - "and it is the monitoring signal — a device stuck on an old configuration has a problem"

- q: "Name the three properties that make an OTA update survivable."
  must:
    - "staged rollout — canary, percentage, fleet, with a stop between each"
    - "verify before commit — a corrupt or partial image is caught before anything is overwritten"
    - "automatic rollback — boot on probation and revert if the device does not check in"

- q: "Why is the rollout metric a check-in rate rather than an error rate?"
  must:
    - "a badly broken device does not report an error"
    - "it stops reporting altogether"
    - "so the signal for the worst outcome is an absence, not a message"
```
