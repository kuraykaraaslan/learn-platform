# 551. The Watchdog Is Not a Safety Net: Feeding It, and the Reboot Loop You Built

## What It Is
A **watchdog** is a hardware timer that resets the device unless the firmware tells it not to, within a window, forever. That is the whole mechanism, and it is the only recovery a device in a ceiling void has, because there is no supervisor to restart it and nobody within reach of the power switch (Lesson 542). It is genuinely valuable, and it is also the component most often installed in a way that guarantees it can never fire.

The failure is always the same: **feeding it from somewhere that keeps running when the application has stopped**. A timer interrupt that pets the watchdog every 100 ms is trivially easy to write and proves exactly one thing — that the timer peripheral still works. The main loop can be stuck in an infinite wait, a task can have died, the sensor can have been unread for an hour, and the watchdog will keep being satisfied. A watchdog fed by anything other than the code path whose health you care about is a watchdog that has been disabled with extra steps.

What works instead is **supervision**: each activity that must keep running publishes a heartbeat — the tick at which it last completed a cycle — and one place, in the main loop, feeds the watchdog only when every heartbeat is recent enough. Now the reset means something specific: some named subsystem stopped. The window is then a design number, not a default: it must exceed the longest legitimate loop iteration (including the slowest flash write and the longest radio operation) and be short enough that the device recovers before anyone notices.

The other half of the lesson is what happens **after** the reset, because a watchdog turns a hang into a reboot and a reboot into a possible loop. A device that faults during startup — a sensor that fails to initialize, a configuration that cannot be parsed — will reset, boot, fault and reset again as fast as the hardware allows. That loop drains a battery in hours instead of years, and when it happens to a fleet it also arrives at the server as a stampede of identical reconnections (Lesson 479's fleet view). The fix has two parts: **count the consecutive failed boots in memory that survives a reset**, and **back off** — increase the delay before retrying, and past a threshold, boot into a reduced mode that does nothing but stay reachable. A device that gives up on the failing subsystem and keeps its radio alive can be diagnosed; one that reboots forever cannot.

Two boundaries. Recording *why* the last reset happened — watchdog, brownout, power-on, fault — is what makes any of this diagnosable, and that is Lesson 553's subject. And this lesson is about a mechanism, not a safety argument: certified functional-safety systems (IEC 61508 and its sector standards) impose architectural requirements — redundancy, diagnostic coverage, independent monitoring — that a watchdog does not satisfy and this course does not cover. **A watchdog makes an unattended device recoverable. It does not make a system safe**, and the two must never be confused in a specification.

```quiz
- q: "Why is feeding the watchdog from a timer interrupt a mistake?"
  anchor: "proves exactly one thing"
  options:
    - text: "Interrupt handlers must stay short, and feeding takes too long"
      correct: false
      why: "The write is trivially short. The problem is what it proves."
    - text: "It proves only that the timer peripheral still runs — the loop can be stuck and the watchdog stays satisfied"
      correct: true
      why: "A watchdog fed by something independent of the application's health cannot detect the application failing."
    - text: "Interrupts cannot access the watchdog registers"
      correct: false
      why: "They can. Nothing prevents it, which is exactly why the mistake is common."

- q: "What is the supervision pattern for a watchdog?"
  anchor: "each activity that must keep running publishes a heartbeat"
  options:
    - text: "Feed it from every task, so any live task keeps the device up"
      correct: false
      why: "Then one surviving task masks every dead one -- the same failure as the timer, distributed."
    - text: "Each activity records when it last completed a cycle, and one place feeds the watchdog only when all heartbeats are recent"
      correct: true
      why: "The reset then means something specific: a named subsystem stopped."
    - text: "Feed it once at startup with the longest possible window"
      correct: false
      why: "A window long enough to cover the whole run detects nothing at all."

- q: "A device faults during startup and the watchdog resets it. What does the firmware owe the fleet?"
  anchor: "count the consecutive failed boots"
  options:
    - text: "Nothing — the reset is the recovery, and it will either work or it will not"
      correct: false
      why: "An unbounded reboot loop drains the battery in hours and stampedes the server."
    - text: "A persistent count of consecutive failed boots, a growing delay before retrying, and a reduced mode past a threshold"
      correct: true
      why: "A device that stays reachable can be diagnosed; one that reboots forever cannot."
    - text: "An immediate factory reset to clear whatever caused it"
      correct: false
      why: "That destroys the evidence and often the configuration that made the device reachable."
```

## Key Concepts
- **A watchdog resets the device unless fed within a window** — the only recovery an unattended device has
- **Feeding it from a timer interrupt disables it in practice** — it then proves only that the timer runs
- **Supervision**: each activity publishes a heartbeat; one place feeds the watchdog when all are recent
- **The window is a design number** — longer than the slowest legitimate iteration, short enough to recover unnoticed
- **A reset can become a reboot loop** — draining a battery in hours and stampeding the server (Lesson 479)
- **Count consecutive failed boots in memory that survives a reset**, back off, and fall into a reduced mode
- **Stay reachable above all** — a device that can be reached can be diagnosed and updated
- **A watchdog makes a device recoverable, not safe** — functional-safety certification is out of scope here

## Example Code
Two watchdog installations against the same failure, plus the boot-loop backoff that decides whether the device is diagnosable afterwards:

```typescript run
/** The sensor subsystem stops completing cycles at tick 6. Everything else
 *  keeps running. The question is which installation notices. */
const TICKS = 16;
const WINDOW = 3; // watchdog window, in ticks
const SENSOR_DIES_AT = 6;

type Health = { lastSensorTick: number; lastRadioTick: number };

function run(feedFrom: 'timer-isr' | 'supervised'): number {
  const health: Health = { lastSensorTick: 0, lastRadioTick: 0 };
  let lastFed = 0;

  for (let tick = 1; tick <= TICKS; tick++) {
    if (tick < SENSOR_DIES_AT) health.lastSensorTick = tick; // sensor cycle completed
    health.lastRadioTick = tick; // radio keeps working throughout

    if (feedFrom === 'timer-isr') {
      lastFed = tick; // the timer fires regardless of what the application is doing
    } else {
      const stale =
        tick - health.lastSensorTick > WINDOW || tick - health.lastRadioTick > WINDOW;
      if (!stale) lastFed = tick;
    }

    if (tick - lastFed >= WINDOW) return tick; // watchdog expires: reset
  }
  return -1; // never reset
}

const isr = run('timer-isr');
const supervised = run('supervised');

console.log(`the sensor stops completing cycles at tick ${SENSOR_DIES_AT}; window is ${WINDOW} ticks`);
console.log(`  fed from a timer ISR : ${isr === -1 ? 'never reset -- device looks alive, produces nothing' : `reset at tick ${isr}`}`);
console.log(`  supervised heartbeats: ${supervised === -1 ? 'never reset' : `reset at tick ${supervised}`}`);
console.log('');
console.log('Same hardware, same window, same failure. The difference is whether the thing');
console.log('doing the feeding depends on the thing whose health is in question.');
console.log('');

// --- what happens after the reset ---
const BASE_DELAY_S = 2;
const MAX_DELAY_S = 900;
const SAFE_MODE_AFTER = 6;

console.log('consecutive failed boots -> delay before the next attempt:');
let cumulative = 0;
for (let n = 1; n <= 8; n++) {
  const delay = Math.min(BASE_DELAY_S * 2 ** (n - 1), MAX_DELAY_S);
  cumulative += delay;
  const mode = n >= SAFE_MODE_AFTER ? '  reduced mode: radio only' : '';
  console.log(`  boot ${n}: wait ${String(delay).padStart(4)} s   (total ${String(cumulative).padStart(4)} s)${mode}`);
}
console.log('');
console.log(`Without the backoff those eight attempts happen in under a second and continue`);
console.log(`for as long as the battery lasts. With it, the eighth attempt is ${Math.round(cumulative / 60)} minutes in,`);
console.log(`the delay caps at ${MAX_DELAY_S / 60} minutes, and the device is still reachable -- still able to`);
console.log('say which subsystem it gave up on.');
```

## When to Use
- On every unattended device, where a reset is the only recovery available (Lesson 542)
- When choosing the window: measure the longest legitimate iteration, including the slowest flash write and radio operation
- When adding a subsystem that must keep running — it gets a heartbeat, or the watchdog stops covering it
- When a device is reported as "online but not sending data", which is the exact signature of a watchdog fed by a timer
- Before the first field deployment, where the reboot-loop behaviour has to be tested deliberately rather than discovered

## Common Mistakes
- **Feeding the watchdog from a timer interrupt** — it then supervises the timer, not the application
- **Feeding it from several places** — one live path masks every dead one, and the reset stops meaning anything
- **Feeding it inside a long loop "so it does not fire during the slow part"** — that is precisely the part that needs covering
- **Disabling it during development and shipping that build** — the mechanism that would have caught this is the one that was removed
- **No backoff after a failed boot** — the device drains its battery in hours and arrives at the server as a stampede (Lesson 479)
- **Not persisting the boot counter** — without state that survives a reset, every boot looks like the first one
- **Presenting a watchdog as a safety measure** — it makes a device recoverable; safety certification requires an architecture this course does not cover

## Further Reading
- [Nordic nRF52832 Product Specification — watchdog timer (WDT)](https://infocenter.nordicsemi.com/topic/ps_nrf52832/wdt.html) — one implementation's reload registers, its behaviour while the core sleeps, and what cannot be changed once it is started
- [ARM Cortex-M4 Devices Generic User Guide (ARM DUI 0553)](https://developer.arm.com/documentation/dui0553/latest/) — the reset and fault behaviour a watchdog reset joins, and what state survives it
- [Lesson 479](/courses/iot-telemetry-edge/device-fleet-management) — the fleet-side view: what a reboot loop looks like from the server, and why staged rollouts assume devices stay reachable
- [Lesson 553](/courses/embedded-firmware/debugging-without-a-console) — recording the reset reason, without which a watchdog reset is indistinguishable from a power glitch
- [Lesson 542](/courses/embedded-firmware/the-loop-that-never-exits) — why a reset is the only recovery: there is no supervisor to restart anything

```recall
- q: "Why must the watchdog not be fed from a timer interrupt?"
  must:
    - "the timer keeps running even when the application has stopped"
    - "so the feed proves only that the timer peripheral works"
    - "the feed must depend on the health of the code path you actually care about"

- q: "Describe the supervision pattern and how the window is chosen."
  must:
    - "each supervised activity records the tick at which it last completed a cycle"
    - "one place in the main loop feeds the watchdog only if every heartbeat is recent enough"
    - "the window must exceed the longest legitimate iteration and be short enough to recover unnoticed"

- q: "What does firmware owe after a watchdog reset?"
  must:
    - "a count of consecutive failed boots held in memory that survives a reset"
    - "a growing delay before each retry, so the device does not drain its battery or stampede the server"
    - "a reduced mode past a threshold that keeps the device reachable and able to report what failed"
```
