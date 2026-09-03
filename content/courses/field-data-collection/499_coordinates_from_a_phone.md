# 499. Coordinates From a Phone: DMS, Decimal Degrees, and EXIF GPS

## What It Is
The same position arrives in a field app in at least three shapes, and converting between them is where it quietly moves.

**Decimal degrees** is what an API returns and what a database column holds: two signed numbers. **Degrees-minutes-seconds** is what a person writes and pastes into a text field, with the hemisphere as a letter. And **EXIF**, the metadata inside a photo, is the awkward one: it stores latitude and longitude as **three unsigned rationals** — degrees, minutes, seconds — with the hemisphere in a **separate tag**.

That separation is the trap, and it is the whole reason this lesson exists. `GPSLatitude` for a southern position and a northern one are **identical**; only `GPSLatitudeRef` distinguishes them. A reader that parses the numbers and ignores the ref tags produces a coordinate that is valid, plausible, on land, and in the wrong hemisphere — and in the run below, 17 kilometres from where the photo was taken for a position near the prime meridian. Further from it, the error is much larger.

The DMS-string case is Lesson 442's axis-order problem at a different boundary. `51°30'2.52"N 0°7'28.56"W` and the same two values in the other order both parse correctly **only because the hemisphere letters say which is which**. Strip the letters and you are relying on position in a list, which is exactly what Lesson 442 said not to do.

So the rule is that lesson's rule, applied here: **the sign and the axis come from a named field, never from position, and the conversion happens once where the data enters.** Not at the point of use, because there are many points of use and one of them will be missed.

```quiz
- q: "A photo's EXIF gives GPSLatitude [51, 30, 2.52]. Where was it taken?"
  anchor: "with the hemisphere in a **separate tag**"
  options:
    - text: "51.5007 degrees north"
      correct: false
      why: "Or south — the numbers are unsigned and the hemisphere is in GPSLatitudeRef, a different tag."
    - text: "Either 51.5007 north or 51.5007 south; the numbers alone do not say"
      correct: true
      why: "Which is why ignoring the ref tags puts the point in the wrong hemisphere with no error raised."
    - text: "51 degrees, 30 minutes — the seconds are a fraction of a minute"
      correct: false
      why: "The three components are degrees, minutes and seconds, and the arithmetic is d + m/60 + s/3600."

- q: "Two DMS strings hold the same values in opposite order and both parse correctly. Why?"
  anchor: "only because the hemisphere letters say which is which"
  options:
    - text: "Because the parser tries both and picks the plausible one"
      correct: false
      why: "Plausibility is what a swap preserves. There is nothing to pick between."
    - text: "Because the N/S and E/W letters name the axis, so position in the string does not have to"
      correct: true
      why: "Remove the letters and it becomes Lesson 442's axis-order problem exactly."
    - text: "Because latitude is always bounded to 90, which disambiguates"
      correct: false
      why: "That catches some cases and not the ones where both values are under 90 — the same limit Lesson 442 measured."
```

## Key Concepts
- **Three shapes**: decimal degrees, DMS text, and EXIF's rationals plus ref tags
- **EXIF stores unsigned components** — degrees, minutes, seconds
- **The hemisphere is a separate tag**: `GPSLatitudeRef`, `GPSLongitudeRef`
- **Ignoring the ref tags** produces a valid coordinate in the wrong hemisphere
- **DMS to decimal is `d + m/60 + s/3600`**, then the sign from the ref
- **A DMS string's letters name the axis**, which is why order does not matter there
- **Without the letters it is Lesson 442's problem** — position in a list, with no error possible
- **Convert once, at the boundary** — never at the point of use
- **EXIF may also carry altitude with its own ref tag** (above or below sea level), and the same rule applies
- **A photo may carry no GPS at all**, which is a different fact from carrying a wrong one (Lesson 500)

## Example Code
All three shapes, and the cost of dropping the ref tag:

```typescript run
// between them is where a position quietly moves.
type Decimal = { lat: number; lon: number };

/** EXIF stores latitude and longitude as THREE unsigned rationals — degrees,
 *  minutes, seconds — with the hemisphere in a SEPARATE tag. The sign is not
 *  in the numbers, which is the trap: a southern latitude and a northern one
 *  have identical GPSLatitude values. */
type ExifGps = {
  GPSLatitude: [number, number, number];
  GPSLatitudeRef: 'N' | 'S';
  GPSLongitude: [number, number, number];
  GPSLongitudeRef: 'E' | 'W';
};

function fromExif(exif: ExifGps): Decimal {
  const dms = ([d, m, s]: [number, number, number]) => d + m / 60 + s / 3600;
  return {
    // The ref tag is the entire sign. Dropping it puts a point in the wrong
    // hemisphere with a perfectly plausible-looking number.
    lat: dms(exif.GPSLatitude) * (exif.GPSLatitudeRef === 'S' ? -1 : 1),
    lon: dms(exif.GPSLongitude) * (exif.GPSLongitudeRef === 'W' ? -1 : 1),
  };
}

/** Degrees-minutes-seconds as a human writes it, which is a third shape again
 *  and the one that arrives pasted into a text field. */
function fromDmsString(text: string): Decimal | null {
  const pattern = /(\d+)[^\d]+(\d+)[^\d]+([\d.]+)[^NSEW]*([NSEW])/g;
  const parts = [...text.matchAll(pattern)];
  if (parts.length !== 2) return null;
  const value = (m: RegExpMatchArray) => {
    const decimal = Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600;
    return 'SW'.includes(m[4]) ? -decimal : decimal;
  };
  const first = value(parts[0]);
  const second = value(parts[1]);
  // Which one is latitude is decided by the hemisphere letter, not by order.
  const firstIsLat = 'NS'.includes(parts[0][4]);
  return firstIsLat ? { lat: first, lon: second } : { lat: second, lon: first };
}

const PHOTO: ExifGps = {
  GPSLatitude: [51, 30, 2.52],
  GPSLatitudeRef: 'N',
  GPSLongitude: [0, 7, 28.56],
  GPSLongitudeRef: 'W',
};

const fromTags = fromExif(PHOTO);
console.log('EXIF tags as stored:');
console.log(`  GPSLatitude  ${JSON.stringify(PHOTO.GPSLatitude)}  GPSLatitudeRef  ${PHOTO.GPSLatitudeRef}`);
console.log(`  GPSLongitude ${JSON.stringify(PHOTO.GPSLongitude)}  GPSLongitudeRef ${PHOTO.GPSLongitudeRef}`);
console.log(`  decimal      lat ${fromTags.lat.toFixed(6)}  lon ${fromTags.lon.toFixed(6)}`);
console.log('');

// What dropping the ref tag costs, which is the whole point of this lesson.
const RAD = Math.PI / 180;
const R = 6371008.8;
const haversineKm = (a: Decimal, b: Decimal) => {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return (2 * R * Math.asin(Math.sqrt(h))) / 1000;
};

const ignoringRefs = {
  lat: PHOTO.GPSLatitude[0] + PHOTO.GPSLatitude[1] / 60 + PHOTO.GPSLatitude[2] / 3600,
  lon: PHOTO.GPSLongitude[0] + PHOTO.GPSLongitude[1] / 60 + PHOTO.GPSLongitude[2] / 3600,
};
console.log('the same tags with the ref fields ignored:');
console.log(`  lat ${ignoringRefs.lat.toFixed(6)}  lon ${ignoringRefs.lon.toFixed(6)}`);
console.log(`  ${haversineKm(fromTags, ignoringRefs).toFixed(0)} km from the correct position`);
console.log('  Both are valid coordinates. Both are on land. Nothing errors.');
console.log('');

// Three text forms of the same place, all of which arrive in practice.
console.log('parsing what people paste into a field:');
for (const text of [
  `51°30'2.52"N 0°7'28.56"W`,
  `0°7'28.56"W 51°30'2.52"N`,
  `51 30 2.52 N, 0 7 28.56 W`,
  `51.5007, -0.1246`,
]) {
  const parsed = fromDmsString(text);
  console.log(
    `  ${text.padEnd(28)} ${parsed === null ? 'not DMS — treat as decimal degrees' : `lat ${parsed.lat.toFixed(6)}  lon ${parsed.lon.toFixed(6)}`}`
  );
}
console.log('');
console.log('The second string is the same place with the two values in the other order, and');
console.log('it parses correctly ONLY because the hemisphere letters say which is which.');
console.log('Strip those and it becomes Lesson 442\'s axis-order problem, with the same');
console.log('property: two valid readings, both plausible, no error raised.');
console.log('');
console.log('So the rule is the one Lesson 442 gave, applied at a different boundary: the');
console.log('sign and the axis come from a NAMED field, never from position in a list, and');
console.log('the conversion happens once where the data enters.');
```

## When to Use
- Reading positions out of photographs, which is most evidence capture
- Accepting coordinates typed or pasted by a person, where all three shapes arrive
- When positions are systematically mirrored across the equator or the prime meridian — that signature is a dropped ref tag
- At every boundary where coordinates enter, which is where Lesson 442 said the conversion belongs

## Common Mistakes
- **Parsing EXIF's numbers and ignoring the ref tags** — the result is a valid coordinate in the wrong hemisphere, and nothing errors
- **Assuming the components are degrees and decimal minutes** — they are degrees, minutes and seconds, and the arithmetic differs
- **Relying on order in a DMS string** — the letters are what name the axis, and stripping them reintroduces Lesson 442's bug
- **Converting at the point of use** — there are many such points and one will be missed
- **Treating a missing GPS block as a zero position** — `0, 0` is a real place in the Gulf of Guinea, and a great many datasets have points there for this reason
- **Ignoring the altitude ref** — EXIF's altitude has its own above-or-below-sea-level tag, with the same trap
- **Trusting EXIF at all without saying so** — it is device-written metadata and Lesson 500 is about what that is worth

## Further Reading
- [Exif](https://en.wikipedia.org/wiki/Exif) — the format's structure and the GPS tag group, as an orientation before the standard itself
- [CIPA standards](https://www.cipa.jp/e/std/std-sec.html) — where Exif is published as DC-008, with the version to cite
- [Exif 2.32 (DC-008-2019) translation](https://www.cipa.jp/std/documents/download_e.html?DC-008-Translation-2019-E) — the GPS tags defined, including the ref fields and the altitude reference
- [Geolocation API specification](https://w3c.github.io/geolocation-api/) — the decimal-degrees shape a browser returns, for contrast

```recall
- q: "How does EXIF store a latitude, and what is the trap?"
  must:
    - "as three unsigned rationals — degrees, minutes, seconds"
    - "with the hemisphere in a separate tag, GPSLatitudeRef"
    - "so a southern and a northern position have identical numbers, and ignoring the ref puts the point in the wrong hemisphere"

- q: "Why does the order of values in a DMS string not matter?"
  must:
    - "the N/S and E/W letters name the axis"
    - "so position in the string does not have to"
    - "strip the letters and it becomes Lesson 442's axis-order problem, with two plausible readings and no error"

- q: "Why is a missing GPS block not a zero position?"
  must:
    - "0, 0 is a real place in the Gulf of Guinea"
    - "absent and zero are different facts"
    - "and a great many datasets have spurious points there for exactly this reason"
```
