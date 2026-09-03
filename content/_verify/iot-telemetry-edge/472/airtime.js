// LoRa time-on-air, from the modulation parameters, and what a duty cycle
// does to it. Every input below is named; nothing is a remembered figure.
//
// The time-on-air formula is the one in Semtech's SX127x datasheet and
// reproduced throughout the LoRa literature:
//
//   Tsym      = 2^SF / BW
//   Tpreamble = (npreamble + 4.25) * Tsym
//   npayload  = 8 + max(ceil((8*PL - 4*SF + 28 + 16*CRC - 20*IH)
//                            / (4*(SF - 2*DE))) * (CR + 4), 0)
//   Tpayload  = npayload * Tsym
//   ToA       = Tpreamble + Tpayload
//
// Determinism: fixed inputs, pure arithmetic, fixed rounding. No clock, no
// random, no library, no network.

const BANDWIDTH_HZ = 125_000; // EU868 uplink channels
const PREAMBLE_SYMBOLS = 8;   // LoRaWAN's fixed preamble
const CODING_RATE = 1;        // 4/5, LoRaWAN's uplink coding rate
const CRC = 1;                // present on uplinks
const IMPLICIT_HEADER = 0;    // LoRaWAN uses the explicit header

/** LoRaWAN mandates the low-data-rate optimisation where a symbol lasts more
 *  than 16 ms — which is SF11 and SF12 at 125 kHz, and nowhere else. */
const lowDataRateOptimise = (sf) => ((2 ** sf) / BANDWIDTH_HZ) * 1000 > 16;

function timeOnAirMs(sf, payloadBytes) {
  const tSym = (2 ** sf) / BANDWIDTH_HZ;
  const de = lowDataRateOptimise(sf) ? 1 : 0;
  const numerator = 8 * payloadBytes - 4 * sf + 28 + 16 * CRC - 20 * IMPLICIT_HEADER;
  const denominator = 4 * (sf - 2 * de);
  const nPayload = 8 + Math.max(Math.ceil(numerator / denominator) * (CODING_RATE + 4), 0);
  const tPreamble = (PREAMBLE_SYMBOLS + 4.25) * tSym;
  return (tPreamble + nPayload * tSym) * 1000;
}

// EU868 data rates and their maximum application payload, as the LoRa
// Alliance's regional parameters define them. The payload column is where
// lesson 473's "51 bytes" comes from — it is DR0 through DR2.
const EU868 = [
  { dr: 0, sf: 12, maxAppPayload: 51 },
  { dr: 1, sf: 11, maxAppPayload: 51 },
  { dr: 2, sf: 10, maxAppPayload: 51 },
  { dr: 3, sf: 9, maxAppPayload: 115 },
  { dr: 4, sf: 8, maxAppPayload: 222 },
  { dr: 5, sf: 7, maxAppPayload: 222 },
];

// A LoRaWAN frame carries more than the application payload: the MAC header,
// device address, frame control, counter and MIC. 13 bytes of overhead with
// no MAC commands riding along.
const FRAME_OVERHEAD_BYTES = 13;

console.log('EU868, 125 kHz, preamble 8, coding rate 4/5, explicit header, CRC on');
console.log('');
console.log('  DR  SF   max app payload   airtime at 12 B   airtime at max');
for (const { dr, sf, maxAppPayload } of EU868) {
  const small = timeOnAirMs(sf, 12 + FRAME_OVERHEAD_BYTES);
  const full = timeOnAirMs(sf, maxAppPayload + FRAME_OVERHEAD_BYTES);
  console.log(
    `  ${dr}   ${String(sf).padStart(2)}   ${String(maxAppPayload).padStart(3)} bytes` +
      `        ${small.toFixed(1).padStart(7)} ms` +
      `        ${full.toFixed(1).padStart(7)} ms`
  );
}
console.log('');
console.log('One spreading factor step doubles the symbol time, so SF12 costs about');
console.log(`${(timeOnAirMs(12, 25) / timeOnAirMs(7, 25)).toFixed(0)}x the airtime of SF7 for the same twelve bytes of payload.`);
console.log('');

// The duty cycle. The percentage is a REGULATORY input, not something this
// script derives — it is stated per region and per sub-band, and here it is
// the 1% that applies to the common EU868 uplink sub-band. What the script
// computes is the consequence.
const DUTY_CYCLE = 0.01;
const SECONDS_PER_DAY = 86_400;
const SECONDS_PER_HOUR = 3_600;

console.log('At 1% duty cycle (EU868, the common uplink sub-band), with a 12-byte payload:');
console.log('');
console.log('  DR  SF   airtime   messages/hour   messages/day   min gap after each');
for (const { dr, sf } of EU868) {
  const toaMs = timeOnAirMs(sf, 12 + FRAME_OVERHEAD_BYTES);
  const toaS = toaMs / 1000;
  const perHour = (SECONDS_PER_HOUR * DUTY_CYCLE) / toaS;
  const perDay = (SECONDS_PER_DAY * DUTY_CYCLE) / toaS;
  // The regulation is enforced as a required silence after each transmission,
  // not as a daily allowance you may spend at once.
  const gapS = toaS / DUTY_CYCLE - toaS;
  console.log(
    `  ${dr}   ${String(sf).padStart(2)}  ${toaMs.toFixed(0).padStart(6)} ms` +
      `   ${perHour.toFixed(1).padStart(10)}` +
      `   ${perDay.toFixed(0).padStart(12)}` +
      `   ${gapS.toFixed(1).padStart(12)} s`
  );
}
console.log('');
console.log('That last column is the one that changes a design. The limit is not a daily');
console.log('budget you may spend when you like: after a transmission the radio must stay');
console.log('silent for the rest of its window, so at SF12 a retry cannot be attempted for');
console.log(`${(timeOnAirMs(12, 25) / 1000 / DUTY_CYCLE - timeOnAirMs(12, 25) / 1000).toFixed(0)} seconds. A retry policy written for HTTP is not legal here.`);
console.log('');
console.log('Every number above is computed from the parameters at the top. The only value');
console.log('taken on authority is the 1% itself, which is regulatory and belongs to a');
console.log('region — a duty cycle quoted without one is not a fact about anything.');
