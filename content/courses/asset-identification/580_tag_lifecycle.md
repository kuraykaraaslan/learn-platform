# 580. Tag Lifecycle: Re-Tagging, and the Tag That Outlives the Asset

## What It Is
A tag is a physical object with its own life, and it does not end when the asset's does. It falls off, fades, gets painted over, gets removed during a refurbishment and put back on the wrong unit. Meanwhile the asset it identifies is replaced, moved, split into two, or merged into a system. **The tag and the asset have separate lifecycles and neither system tracks the other**, which is where the last class of wrong attribution comes from.

The worst case in that list deserves naming because it is silent and permanent: **a tag reused on a different asset**. A pump is replaced, the old tag is peeled off and stuck to the new one, and every historical record now describes a machine that is gone while appearing to describe the one in front of you. If the identifier is a functional location this is *correct* — the location is the same and the history belongs to it (Lesson 506). If the identifier is a serial or an arbitrary tag number, it is a fabrication. **Which of those two you have is decided by Lesson 573's choice, years earlier**, and it is the reason that choice mattered.

Re-tagging an estate is the other event with consequences. It happens for good reasons — a merger, a new numbering scheme, tags that have become unreadable — and it is the only cheap moment to change the encoding, the symbology or the check digit. It is also the moment when the link between the physical world and the register is broken and remade, one asset at a time, by people working quickly. A re-tag with no record of *which old identifier became which new one* discards the entire history, and it discards it in a way that is not obvious until somebody asks a question about last year.

So the two rules are short. **Record the mapping**: every re-tag is an event with an old identifier, a new identifier, a date and a person. And **never reuse an identifier for a different asset** — a retired identifier stays retired, because the alternative is that a query about the past silently returns the present. That is the same constraint Lesson 515 arrives at from a different direction, and for the same reason.

```quiz
- q: "A pump is replaced and the old tag is moved to the new pump. Is the history now wrong?"
  anchor: "Which of those two you have is decided by Lesson 573's choice"
  options:
    - text: "Yes, always — the history describes a machine that is gone"
      correct: false
      why: "It depends entirely on what the identifier means."
    - text: "It depends: for a functional location the history belongs to the location and is correct; for a serial or arbitrary number it is a fabrication"
      correct: true
      why: "Which is what Lesson 573's choice decided, years earlier."
    - text: "No — physical replacement never affects records"
      correct: false
      why: "It does whenever the identifier was meant to identify the equipment rather than its role."

- q: "What is the danger of a re-tagging exercise?"
  anchor: "A re-tag with no record of *which old identifier became which new one*"
  options:
    - text: "The new tags may use a worse symbology"
      correct: false
      why: "Re-tagging is in fact the cheap moment to improve the symbology."
    - text: "Without a recorded old-to-new mapping, the entire history is discarded, invisibly until someone asks about last year"
      correct: true
      why: "The link between the physical world and the register is broken and remade, quickly, one asset at a time."
    - text: "Assets get physically moved during the exercise"
      correct: false
      why: "That is a separate operational risk and is usually visible."

- q: "Why must a retired identifier never be reused?"
  anchor: "a query about the past silently returns the present"
  options:
    - text: "Because databases cannot handle reused primary keys"
      correct: false
      why: "They handle it fine — that is exactly the problem."
    - text: "Because a query about the old asset's history silently returns the new asset's, with nothing to indicate the switch"
      correct: true
      why: "It is the same constraint Lesson 515 reaches from the identity-resolution side."
    - text: "Because identifiers are expensive to allocate"
      correct: false
      why: "They cost nothing; the cost is in what reuse does to history."
```

## Key Concepts
- **The tag and the asset have separate lifecycles** and neither system tracks the other
- **A tag moved to a replacement asset** is correct for a functional location and a fabrication for a serial (Lessons 506, 573)
- **Re-tagging is the only cheap moment** to change encoding, symbology or check digit
- **It is also when the physical-to-register link is broken and remade**, quickly, by people under time pressure
- **Record the mapping**: old identifier, new identifier, date, person — or the history is discarded
- **Never reuse a retired identifier** — a query about the past would silently return the present (Lesson 515)
- **The damage is invisible** until somebody asks a question about a period before the change

## Example Code
The procedure, written before the exercise rather than during it:

```md
## Before the first tag is removed
- [ ] Decide what the new identifier means — functional location or equipment (Lesson 506), and write the decision down
- [ ] Decide the encoding, symbology, module size and check digit now; this is the cheap moment (Lessons 573, 574, 575)
- [ ] Confirm no new identifier collides with any retired one, ever — retired stays retired
- [ ] Compute the confusable-pair list for the proposed scheme before printing, not after (Lesson 579)
- [ ] Agree where the tag goes physically: readable without moving anything, and not on the part most likely to be replaced

## During, for every asset
- [ ] Record old identifier, new identifier, date and person — as a row, not as a note
- [ ] Photograph the old tag in place before removal, where the old identifier is damaged or ambiguous
- [ ] Verify the new tag scans, in situ, in the actual lighting, at the distance a technician will use
- [ ] Keep the human-readable text on the new tag, and check it matches the encoded value (Lesson 573)
- [ ] Leave the asset with exactly one tag — an old tag left in place is a future wrong attribution

## After
- [ ] Apply the mapping to the register, to open work orders and to condition history
- [ ] Re-scope every device catalogue; a stale slice now resolves to identifiers that no longer exist (Lesson 578)
- [ ] Re-run the confusable-pair query against the new scheme and act on what it finds (Lesson 579)
- [ ] Keep the mapping permanently — it is the only thing that connects records either side of the exercise
- [ ] Spot-check a sample against the physical estate, including assets nobody visited during the exercise
```

The item people leave out is the fourth one in the second section, and it is the one that costs most: an asset carrying two tags is not an inconvenience, it is a machine with two identities, and one of them will be scanned.

## When to Use
- Before any re-tagging exercise, where the mapping is the deliverable and the tags are the visible part
- When equipment is replaced, where whether the tag moves depends on what the identifier means
- When a merger or a new numbering scheme forces a change, which is also the chance to fix the encoding
- When historical records stop lining up at a specific date, which is the signature of an unrecorded re-tag
- When designing the identifier scheme in the first place, since reuse has to be prohibited before it is convenient

## Common Mistakes
- **Re-tagging without recording the mapping** — the history is discarded and nobody notices for months
- **Reusing a retired identifier** — queries about the past silently return the present
- **Leaving the old tag in place** — the asset now has two identities and one of them will be scanned
- **Moving a serial-based tag to a replacement** — the record becomes a fabrication rather than a continuation
- **Not re-scoping device catalogues afterwards** — every device resolves to identifiers that no longer exist (Lesson 578)
- **Treating the mapping as temporary** — it is the only bridge between records on either side of the change

## Further Reading
- [Lesson 506](/courses/asset-management-systems/asset-identity) — functional location versus equipment identity, which decides whether a moved tag is correct
- [Lesson 515](/courses/smart-infrastructure/identity-resolution-across-systems) — the same prohibition on reuse, arrived at from identity resolution across systems
- [Lesson 573](/courses/asset-identification/what-goes-on-the-tag) — the encoding decision that re-tagging is the cheap moment to revisit
- [Lesson 578](/courses/asset-identification/offline-resolution) — the device catalogues that go stale the moment a re-tag lands

```recall
- q: "Why do the tag and the asset need separate lifecycles in your model?"
  must:
    - "the tag falls off, fades, is painted over or is moved during refurbishment"
    - "the asset is replaced, moved, split or merged"
    - "neither system tracks the other, which is where the last class of wrong attribution comes from"

- q: "When is moving a tag to a replacement asset correct?"
  must:
    - "when the identifier is a functional location -- the role is unchanged and the history belongs to it"
    - "when it is a serial number or an arbitrary tag number, the record becomes a fabrication"
    - "which of the two you have was decided when the tag's content was chosen"

- q: "State the two rules for re-tagging."
  must:
    - "record the mapping -- old identifier, new identifier, date and person -- as data, permanently"
    - "never reuse a retired identifier, or a query about the past silently returns the present"
    - "and leave each asset with exactly one tag, since two tags is two identities"
```
