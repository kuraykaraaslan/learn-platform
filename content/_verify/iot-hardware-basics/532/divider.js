// Where a divider front end's error comes from, counted rather than guessed.
//
// The circuit: a signal of up to 5.00 V is scaled by a two-resistor divider
// into the input range of an ADC whose full scale is set by a voltage
// reference. Firmware recovers the signal as:
//
//   V_signal = (count / FULL_SCALE) * V_ref * (R_top + R_bottom) / R_bottom
//
// Four things have a tolerance: the two resistors, the reference, and the
// ADC's own gain (its total-unadjusted-error / gain-error spec). This script
// enumerates all 2^4 = 16 combinations of their extremes, converts one fixed
// ADC reading back to a signal voltage under each, and reports the spread.
// Nothing here is a remembered number.
//
// Determinism: the component values and tolerances are literals from the
// parts list below, the arithmetic is pure, and rounding is fixed. No clock,
// no random, no library.

// --- The parts list (each value is a catalogue figure, not a measurement) ---
const R_TOP_NOM = 10_000; // ohms, 1% metal film (e.g. Vishay MFR series, 1% grade)
const R_BOT_NOM = 6_800; // ohms, 1% metal film
const R_TOL = 0.01; // +/-1%, the tolerance band printed on the part
const VREF_NOM = 3.300; // volts, series voltage reference
const VREF_TOL = 0.01; // +/-1%, the reference's initial-accuracy spec
const ADC_GAIN_TOL = 0.01; // +/-1%, the ADC's gain-error spec (a datasheet line)
const FULL_SCALE = 4095; // 12-bit ADC

// A signal we will pretend is exactly 4.000 V, and the ideal count it would
// produce through the nominal divider and reference.
const V_SIGNAL_TRUE = 4.000;

function dividerOut(vIn, rTop, rBot) {
  return (vIn * rBot) / (rTop + rBot);
}

function countFor(vIn, rTop, rBot, vRef, adcGain) {
  return Math.round((dividerOut(vIn, rTop, rBot) / vRef) * FULL_SCALE * adcGain);
}

function recover(count, rTop, rBot, vRef, adcGain) {
  const vAdc = ((count / adcGain) / FULL_SCALE) * vRef;
  return (vAdc * (rTop + rBot)) / rBot;
}

// The count the device actually reports: produced by the NOMINAL parts.
const reportedCount = countFor(V_SIGNAL_TRUE, R_TOP_NOM, R_BOT_NOM, VREF_NOM, 1);

const extremes = (nom, tol) => [nom * (1 - tol), nom * (1 + tol)];
const rows = [];
for (const rTop of extremes(R_TOP_NOM, R_TOL)) {
  for (const rBot of extremes(R_BOT_NOM, R_TOL)) {
    for (const vRef of extremes(VREF_NOM, VREF_TOL)) {
      for (const adcGain of extremes(1, ADC_GAIN_TOL)) {
        rows.push({
          rTop,
          rBot,
          vRef,
          adcGain,
          recovered: recover(reportedCount, rTop, rBot, vRef, adcGain),
        });
      }
    }
  }
}

const recovered = rows.map((r) => r.recovered);
const lo = Math.min(...recovered);
const hi = Math.max(...recovered);
const nominalRecovered = recover(reportedCount, R_TOP_NOM, R_BOT_NOM, VREF_NOM, 1);

console.log('Divider front end: R_top 10k 1%, R_bottom 6.8k 1%, V_ref 3.300 V 1%, ADC gain 1%, 12-bit');
console.log(`Signal is truly ${V_SIGNAL_TRUE.toFixed(3)} V; nominal parts give ADC count ${reportedCount}.`);
console.log('');
console.log('Recovering that one count under every one of the 16 tolerance corners:');
console.log('  R_top    R_bot    V_ref    ADC gain   recovered');
for (const r of rows) {
  console.log(
    `  ${r.rTop.toFixed(0).padStart(6)}   ${r.rBot.toFixed(0).padStart(6)}   ${r.vRef.toFixed(3)}   ${r.adcGain.toFixed(3)}      ${r.recovered.toFixed(4)} V`
  );
}
console.log('');
console.log(`nominal recovery : ${nominalRecovered.toFixed(4)} V`);
console.log(`worst-case low   : ${lo.toFixed(4)} V   (${(((lo - nominalRecovered) / nominalRecovered) * 100).toFixed(2)} %)`);
console.log(`worst-case high  : ${hi.toFixed(4)} V   (+${(((hi - nominalRecovered) / nominalRecovered) * 100).toFixed(2)} %)`);
const worstPct = (Math.max(hi - nominalRecovered, nominalRecovered - lo) / nominalRecovered) * 100;
console.log('');
console.log(`Worst-case error from four 1% parts: +/- ${worstPct.toFixed(1)} %.`);
console.log('It approaches the sum of the four tolerances because at the worst corner they');
console.log('all push the same way. This is the number to bring to a design review — not');
console.log('"about a percent, probably fine", and not a bench reading of one build.');
