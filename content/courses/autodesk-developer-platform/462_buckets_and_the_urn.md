# 462. Buckets and the URN: Encoding an Object Id Correctly

## What It Is
**Mode: cloud.** Before a model can be translated, it has to be somewhere the service can read, and that somewhere is addressed by a string you construct rather than one you are handed.

Object storage here has two levels. A **bucket** is a namespace you create, with a retention policy chosen at creation — transient, temporary or persistent — and that choice cannot be changed afterwards. An **object** is a file inside it, addressed by a key you pick. Together they form an object id of the form `urn:adsk.objects:os.object:<bucket>/<key>`, which is a URN in the ordinary sense: a name, not a location.

Everything downstream refers to that object by its **URN**, which is the object id **base64url-encoded with the padding removed**. Not base64. The difference is three characters — `+` becomes `-`, `/` becomes `_`, and trailing `=` is dropped — and it exists because the URN travels as a **path segment** in a URL, where all three of those characters mean something else.

The reason this is a whole lesson rather than a footnote is measured in the proof below: encode fifty-six plausible ASCII object ids and **none** of them contain a `+` or a `/`. The alphabet difference is invisible to any test suite built from ordinary names. The first object key with an accent in it produces one, and by then the encoding is in production. Padding is different — it appears in most ids — and its failure is a client that percent-encodes `=` to `%3D` while another does not.

And the failure mode is the bad kind. Base64 decoders in both Node and the browser **skip characters outside the alphabet** rather than rejecting them, so a URN encoded the wrong way decodes to a different string with no exception raised.

```quiz
- q: "Why does a URN use base64url rather than base64?"
  anchor: "the URN travels as a **path segment** in a URL"
  options:
    - text: "It is shorter, since the padding is dropped"
      correct: false
      why: "Dropping padding does shorten it, and that is a consequence rather than the reason."
    - text: "Because `+`, `/` and `=` all mean something else in a URL path segment"
      correct: true
      why: "A `/` splits the segment, a `+` is a space in form encoding, and `=` gets percent-encoded inconsistently."
    - text: "Because the service rejects the standard alphabet"
      correct: false
      why: "Rejection would be the easy case. The difficulty is that the wrong variant often decodes to something."

- q: "A test suite of ASCII object keys passes and production breaks on the first accented filename. Why?"
  anchor: "**none** of them contain a `+` or a `/`"
  options:
    - text: "The accented character is not valid in an object key"
      correct: false
      why: "It is perfectly valid. What changes is the bytes, and therefore the encoded alphabet."
    - text: "ASCII keys never produce `+` or `/`, so the substitution is never exercised by those tests"
      correct: true
      why: "Measured in the proof below: 0 of 56. The tests exercise padding and nothing else."
    - text: "The encoder throws on non-ASCII input"
      correct: false
      why: "A naive `btoa` does throw on a multi-byte string — a real and separate bug — but a correct encoder handles it and still produces the substituted characters."
```

## Key Concepts
- **Bucket**: a namespace with a retention policy fixed at creation time
- **Object key**: the filename part, chosen by you, and the part whose bytes decide the encoding
- **Object id**: `urn:adsk.objects:os.object:<bucket>/<key>` — a name, not a location
- **URN**: that object id, base64url-encoded, padding removed
- **Three substitutions**: `+` to `-`, `/` to `_`, trailing `=` dropped
- **It is a path segment**: which is what makes each of the three a real problem rather than a style choice
- **ASCII keys hide two of the three** — so a test suite built from them proves very little
- **Decoders do not reject** — they skip unknown characters, so the wrong variant yields a wrong string silently
- **`btoa` needs bytes**: a multi-byte character must be encoded to UTF-8 first, or the naive call throws

## Example Code
Both directions, and the substitutions in the open:

```typescript run
// it back. No network: the encoding is the entire subject.
const OBJECT_ID = 'urn:adsk.objects:os.object:riverside-depot/depot-l1.rvt';

/** Standard base64, then the three substitutions that make it safe in a URL:
 *  `+` to `-`, `/` to `_`, and the `=` padding removed. */
function toUrn(objectId: string): string {
  // btoa works on a binary string, so multi-byte characters have to be
  // widened first — a filename with an accent in it is exactly where a naive
  // btoa(objectId) throws.
  const bytes = new TextEncoder().encode(objectId);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** The other direction. Padding has to be restored: a strict decoder rejects
 *  a length that is not a multiple of four. */
function fromUrn(urn: string): string {
  const standard = urn.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const urn = toUrn(OBJECT_ID);
console.log(`object id  ${OBJECT_ID}`);
console.log(`urn        ${urn}`);
console.log(`round trip ${fromUrn(urn) === OBJECT_ID ? 'ok' : 'MISMATCH'}`);
console.log('');

// What the three substitutions are actually for. A URN goes into a URL path
// segment, and each of the three characters breaks that in its own way.
const samples = [
  'urn:adsk.objects:os.object:riverside-depot/depot-l1.rvt',
  'urn:adsk.objects:os.object:riverside-depot/façade~r2.rvt',
];
console.log('what standard base64 would have produced:');
for (const id of samples) {
  const bytes = new TextEncoder().encode(id);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const std = btoa(binary);
  const offenders = ['+', '/', '='].filter((c) => std.includes(c));
  console.log(`  ${id}`);
  console.log(`    ${std}`);
  console.log(`    unsafe in a path segment: ${offenders.length ? offenders.join(' ') : '(none)'}`);
}
console.log('');

// The failure mode worth naming, because nothing throws. Take an object id
// whose encoding actually uses the substituted alphabet:
const ACCENTED = 'urn:adsk.objects:os.object:riverside-depot/façade~r2.rvt';
const accentedUrn = toUrn(ACCENTED);
console.log('a urn that really does use the url-safe alphabet:');
console.log(`  ${accentedUrn}`);

// Decoded by a reader that forgot to undo the substitution — plain atob on the
// url-safe string. Node and browsers both skip characters outside the base64
// alphabet rather than rejecting them, so this returns a string, not an error.
const naive = atob(accentedUrn.replace(/[^A-Za-z0-9+/=]/g, ''));
const naiveText = new TextDecoder().decode(Uint8Array.from(naive, (c) => c.charCodeAt(0)));
console.log(`  decoded without undoing the substitution:`);
console.log(`    ${JSON.stringify(naiveText.slice(-28))}`);
console.log(`    expected tail: ${JSON.stringify(ACCENTED.slice(-28))}`);
console.log(`    ${naiveText === ACCENTED ? 'same' : 'DIFFERENT STRING, and no error was raised'}`);
console.log('');
console.log('Encode once, at the boundary, and carry the urn. Re-encoding an already-encoded');
console.log('urn is the other half of this bug, and it also does not throw:');
console.log(`  ${toUrn(urn).slice(0, 44)}...`);
console.log('  A perfectly well-formed urn that names nothing.');
```

And the measurement that makes this a lesson rather than a footnote — how often the alphabet difference actually shows up in names a project produces:

```proof sha=1c181112d759d86c at=2026-09-03 commit=f44a38a
$ node urn.js
56 plausible ASCII object ids, encoded with standard base64:
  contain "+"  0
  contain "/"  0
  contain "="  41

So a test suite built from ASCII names exercises the padding difference and
never the alphabet difference. The first name that does is not a test.

base64                                                                    url-safe
  urn:adsk.objects:os.object:riverside-depot/facade~r2.rvt
    standard  dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6cml2ZXJzaWRlLWRlcG90L2ZhY2FkZX5yMi5ydnQ=
    url-safe  dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6cml2ZXJzaWRlLWRlcG90L2ZhY2FkZX5yMi5ydnQ
    differs at: =
  urn:adsk.objects:os.object:riverside-depot/façade~r2.rvt
    standard  dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6cml2ZXJzaWRlLWRlcG90L2Zhw6dhZGV+cjIucnZ0
    url-safe  dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6cml2ZXJzaWRlLWRlcG90L2Zhw6dhZGV-cjIucnZ0
    differs at: +
  urn:adsk.objects:os.object:riverside-depot/ab₿-depot.rvt
    standard  dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6cml2ZXJzaWRlLWRlcG90L2Fi4oK/LWRlcG90LnJ2dA==
    url-safe  dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6cml2ZXJzaWRlLWRlcG90L2Fi4oK_LWRlcG90LnJ2dA
    differs at: / =

A URN travels as a PATH SEGMENT, so the three characters matter differently:
  "/" splits the segment      -> 2 segments instead of 1
  "+" is a legal path char but a SPACE in a form-encoded query string
  "=" is often percent-encoded to %3D by one client and not by another

  standard, in a path:  .../designdata/dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6cml2ZXJzaWRlLWRlcG90L2Fi4oK/LWRlcG90LnJ2dA==/manifest
  url-safe, in a path:  .../designdata/dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6cml2ZXJzaWRlLWRlcG90L2Fi4oK_LWRlcG90LnJ2dA/manifest

round trip: ok

And the failure that is worth seeing, because it does not throw: Node's base64
decoder ignores characters outside the alphabet instead of rejecting them.
  decoding a URN that arrived percent-encoded:
    got      ...object:riverside-depot/ab₿-depot.rvt\u000d\ufffd
    expected ...s.object:riverside-depot/ab₿-depot.rvt
  No exception. A wrong string, quietly, which is the whole class of bug.
```

## When to Use
- Whenever an object id crosses a boundary into a URL, which is every downstream call in this course
- When choosing bucket retention, which is fixed at creation and therefore a decision rather than a default
- When a translation, a manifest fetch or a properties query returns "not found" for something you know exists — the encoding is the first suspect
- When designing object keys, where restricting them to a safe character set is a choice you can make and a constraint you should write down

## Common Mistakes
- **Encoding with standard base64** — it works for most ASCII keys and fails on the first one that does not, in production
- **Re-encoding an already-encoded URN** — it produces a perfectly well-formed URN that names nothing, and nothing throws
- **Calling `btoa` on the object id directly** — it operates on a binary string, so a multi-byte character throws; encode to UTF-8 bytes first
- **Decoding without restoring padding** — a strict decoder rejects a length that is not a multiple of four, and a lenient one gives you a truncated string
- **Testing only with ASCII object keys** — measured above: the substitution is never exercised, so the tests are silent about the failure they exist to prevent
- **Assuming a bucket's retention can be changed later** — it is fixed at creation, and the fix is a new bucket and a migration

## Further Reading
- [RFC 4648 — Base16, Base32 and Base64 Data Encodings](https://datatracker.ietf.org/doc/html/rfc4648) — section 5 defines the URL-safe alphabet, character for character
- [Autodesk Platform Services documentation](https://aps.autodesk.com/developer/documentation) — the object storage service index, where bucket policies and current limits live
- [Model Derivative overview](https://aps.autodesk.com/en/docs/model-derivative/v2/developers_guide/overview/) — the first consumer of the URN, and Lesson 463's subject

```recall
- q: "What is a URN here, and what three substitutions make it one?"
  must:
    - "the object id urn:adsk.objects:os.object:<bucket>/<key>, base64url-encoded with padding removed"
    - "+ becomes -, / becomes _, trailing = is dropped"
    - "because the URN travels as a URL path segment"

- q: "Why does an ASCII-only test suite fail to catch a base64 versus base64url mistake?"
  must:
    - "measured: 0 of 56 plausible ASCII object ids produce a + or a /"
    - "only the padding difference is exercised"
    - "the first non-ASCII object key produces one, in production"

- q: "What makes the failure mode of the wrong encoding especially bad?"
  must:
    - "base64 decoders skip characters outside the alphabet instead of rejecting them"
    - "so the wrong variant decodes to a different string with no exception"
    - "and re-encoding an encoded URN produces a well-formed URN that names nothing"
```
