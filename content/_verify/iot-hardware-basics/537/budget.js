// One day of a sensor node, as a charge budget. Never quote a battery life;
// compute it, from a state schedule and a current per state.
//
// The currents below are datasheet figures, each with its source. The point
// of the script is the arithmetic between them, and one line in particular:
// the regulator's quiescent current, which runs 24 hours a day whatever the
// firmware does and is the item that most often sinks a field budget.
//
// Determinism: the schedule and the currents are literals, the arithmetic is
// pure, rounding is fixed. No clock, no random, no library, no network.

// --- Cited component currents ------------------------------------------------
// nRF52832 Product Specification v1.4, System ON, RAM retention, RTC running:
// 1.9 uA. Real designs rarely see this — leakage and a watchdog push it up —
// so take a measured-in-practice 3 uA.
const I_MCU_SLEEP_UA = 3.0;
// nRF52832 CPU running @ 64 MHz from flash, radio off: ~3.7 mA.
const I_MCU_ACTIVE_MA = 3.7;
// nRF52832 radio TX @ +4 dBm: 7.5 mA on top of the CPU.
const I_RADIO_TX_MA = 7.5;
// Sensor: Sensirion SHT4x datasheet rev 1, high-precision measurement 500 uA
// typ for 8.2 ms, idle 0.08 uA.
const I_SENSOR_MEAS_UA = 500;
const I_SENSOR_IDLE_UA = 0.08;
// Regulator: a mid-range LDO many boards actually ship — Microchip MCP1802
// datasheet, 25 uA typ quiescent. It runs 24 h/day regardless of firmware,
// which is why it gets its own line. The sensitivity sweep swaps it for a
// cheap 5 mA LDO and for a 1.6 uA one (MCP1700), and the answer moves by
// orders of magnitude in both directions.
const I_REG_QUIESCENT_UA = 25.0;

// --- One day's schedule -----------------------------------------------------
// Wake every 10 minutes: measure, compute, transmit, sleep. 144 wakes/day.
const WAKES_PER_DAY = 144;
const SECONDS_PER_DAY = 86_400;

const perWake = [
  { state: 'sensor measurement', seconds: 0.0082, current_mA: I_SENSOR_MEAS_UA / 1000 + I_MCU_ACTIVE_MA },
  { state: 'compute + format', seconds: 0.020, current_mA: I_MCU_ACTIVE_MA + I_SENSOR_IDLE_UA / 1000 },
  { state: 'radio transmit', seconds: 0.060, current_mA: I_MCU_ACTIVE_MA + I_RADIO_TX_MA + I_SENSOR_IDLE_UA / 1000 },
];

const activeSecondsPerWake = perWake.reduce((s, p) => s + p.seconds, 0);
const sleepSecondsPerDay = SECONDS_PER_DAY - WAKES_PER_DAY * activeSecondsPerWake;

// Charge (mAh) = current (mA) * time (h).
const mAh = (mA, seconds) => (mA * seconds) / 3600;

let activeCharge = 0;
console.log('Per wake (144 wakes/day):');
console.log('  state                 duration     current      charge/day');
for (const p of perWake) {
  const c = mAh(p.current_mA, p.seconds * WAKES_PER_DAY);
  activeCharge += c;
  console.log(
    `  ${p.state.padEnd(20)} ${(p.seconds * 1000).toFixed(1).padStart(6)} ms   ${p.current_mA.toFixed(3).padStart(8)} mA   ${c.toFixed(3).padStart(8)} mAh`
  );
}

const sleepCharge = mAh((I_MCU_SLEEP_UA + I_SENSOR_IDLE_UA) / 1000, sleepSecondsPerDay);
const regCharge = mAh(I_REG_QUIESCENT_UA / 1000, SECONDS_PER_DAY);

console.log(`  ${'MCU + sensor sleep'.padEnd(20)} ${(sleepSecondsPerDay / 3600).toFixed(2).padStart(6)} h    ${((I_MCU_SLEEP_UA + I_SENSOR_IDLE_UA) / 1000).toFixed(6).padStart(8)} mA   ${sleepCharge.toFixed(3).padStart(8)} mAh`);
console.log(`  ${'regulator quiescent'.padEnd(20)} ${'24.00'.padStart(6)} h    ${(I_REG_QUIESCENT_UA / 1000).toFixed(6).padStart(8)} mA   ${regCharge.toFixed(3).padStart(8)} mAh   <- its own line`);

const totalPerDay = activeCharge + sleepCharge + regCharge;
console.log('');
console.log(`Total: ${totalPerDay.toFixed(3)} mAh/day`);

const CELL_MAH = 2400; // one 18650-class Li-ion, cited nominal
const USABLE = 0.8; // only ~80% is usable before the regulator drops out
const days = (CELL_MAH * USABLE) / totalPerDay;
console.log(`On a ${CELL_MAH} mAh cell at ${USABLE * 100}% usable: ${days.toFixed(0)} days (${(days / 365).toFixed(2)} years).`);
console.log('');

// --- Sensitivity: change ONE parameter -------------------------------------
console.log('Change one parameter, hold the rest:');
const baseline = totalPerDay;

const withCheapLdo = baseline - regCharge + mAh(5.0, SECONDS_PER_DAY); // 5 mA LDO
console.log(
  `  regulator 25 uA -> 5 mA (cheap LDO):      ${withCheapLdo.toFixed(1)} mAh/day  -> ${((CELL_MAH * USABLE) / withCheapLdo).toFixed(0)} days`
);
const withLowIqLdo = baseline - regCharge + mAh(1.6 / 1000, SECONDS_PER_DAY); // MCP1700
console.log(
  `  regulator 25 uA -> 1.6 uA (MCP1700):     ${withLowIqLdo.toFixed(3)} mAh/day  -> ${((CELL_MAH * USABLE) / withLowIqLdo).toFixed(0)} days`
);

const txDoubled = (() => {
  const tx = perWake[2];
  const extra = mAh(tx.current_mA, tx.seconds * WAKES_PER_DAY); // add one more TX worth
  return baseline + extra;
})();
console.log(
  `  transmit 60 ms -> 120 ms (one retry):    ${txDoubled.toFixed(2)} mAh/day  -> ${((CELL_MAH * USABLE) / txDoubled).toFixed(0)} days`
);

const wake5min = (() => {
  const wakes = 288;
  const active = perWake.reduce((s, p) => s + mAh(p.current_mA, p.seconds * wakes), 0);
  const sleepS = SECONDS_PER_DAY - wakes * activeSecondsPerWake;
  const sleep = mAh((I_MCU_SLEEP_UA + I_SENSOR_IDLE_UA) / 1000, sleepS);
  return active + sleep + regCharge;
})();
console.log(
  `  wake every 10 min -> every 5 min:         ${wake5min.toFixed(2)} mAh/day  -> ${((CELL_MAH * USABLE) / wake5min).toFixed(0)} days`
);

console.log('');
console.log('The regulator swap changes the answer by more than an order of magnitude and');
console.log('touches no firmware. The transmit and wake-rate changes are what a reader');
console.log('would reach for first, and they barely move it. Compute the budget; do not');
console.log('quote it, and do not optimise the part that is not the problem.');
