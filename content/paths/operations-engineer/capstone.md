# Capstone — Commissioning One Chiller

## Brief
A new chiller was installed on the roof of Block B last Thursday. The
contractor has gone. It is running.

As far as every system you operate is concerned, it does not exist.

Your job is the plan that makes it exist correctly — not a ticket saying "add
chiller", but the sequence that ends with an asset your organisation can find,
inspect, monitor and maintain in five years, when nobody involved in this
installation still works here.

**What you have**

- The commissioning pack: manufacturer, model, serial `SN-CH-88214`, a
  works order number, and a photograph of the nameplate.
- The existing register, in which Block B's HVAC system already contains two
  air handling units and their components.
- A field app your technicians use, and a label printer.
- Telemetry: the unit exposes a vibration and a discharge-temperature reading
  every five minutes, starting from the day it was energised.
- A maintenance schedule template your organisation applies to chillers.

**What you do not have**

- Any confirmation of where in the hierarchy this unit belongs.
- Any history. It has run for six days.
- Any inspection. Nobody has been to see it since the contractor left.

## Deliverable
A commissioning plan: the ordered steps that take this machine from "running
on a roof" to "correctly represented", with the decision each step makes
written down rather than implied.

It is done when it contains:

1. **The register row**, field by field, and — for each field you cannot fill
   today — what you put there instead and when it gets resolved. "TBC" is an
   acceptable answer only if something makes it come back.
2. **The identifier**, decided rather than defaulted: what goes on the label,
   what the label carries beyond the code, and what happens to that label the
   first time this unit is replaced.
3. **The first field visit**: what the technician is asked to confirm, and
   what the app should refuse to accept from them.
4. **The condition baseline**: when you are allowed to establish one, what you
   do in the meantime, and what would make you throw it away.
5. **The first work order**, and what it is measured against.
6. **The order of all of the above**, with the dependencies named. Several of
   these steps cannot be done first, and one of them cannot be done for weeks.

## Rubric
Score yourself honestly against each row. Every one is a mistake documented by
a lesson on this path, quoted from it — and every one of those lessons is
verified, so the rubric measures only what the corpus stands behind.

```rubric
rows:
  - lead: "Keying the register on the serial number"
    lesson: 504
    looks_like: "You did not make `SN-CH-88214` the key, even though it is the only identifier you actually have today. The serial belongs in a field; the row is keyed on where the chiller sits in the estate, which is what survives the unit being replaced."
  - lead: "No parent field"
    lesson: 504
    looks_like: "Your row says what this chiller hangs from. Block B's HVAC system already exists in the register, and the plan places the new unit inside it rather than beside it at the top level."
  - lead: "Tagging with the serial number"
    lesson: 573
    looks_like: "The same decision, now in adhesive. You noticed that the tag repeats the register's choice and outlives it by years, and that a serial on the label becomes wrong the first time the unit is swapped."
  - lead: "Not giving the session a scope"
    lesson: 577
    looks_like: "Your first field visit is a session with a stated scope — this system, this asset class — so the app can question a scan that lands on one of the two air handling units next to it rather than accepting it."
  - lead: "Assuming the sync completes"
    lesson: 494
    looks_like: "The commissioning visit happens on a roof. Your plan says what the technician's app does when the record does not reach the server, and does not treat a submitted form as a stored one."
  - lead: "Baselining a brand-new asset from its first week"
    lesson: 564
    looks_like: "Six days of telemetry is not a baseline, and your plan says so. It states what you do until there is one — a fleet figure, a manufacturer figure, or a stated warm-up with no alarms — and when the real baseline gets established."
```

## Reference Walkthrough
One competent plan. Read it after scoring yourself.

**Step 1 — the register row, and the two fields that decide everything else.**
The key is the functional location, not the serial: something like
`CH-B2-01`, meaning *the chiller serving Block B, position 1*. The serial goes
in its own field, because it identifies the equipment rather than the role, and
those diverge the first time this unit is replaced. The parent is Block B's
HVAC system, which already exists — so the new row joins a tree rather than
starting one.

Two fields cannot be filled today: the condition score, because nobody has
seen it, and the criticality, because that is a judgement about what its
failure costs and nobody has made it. Neither becomes "TBC" on its own. The
condition is left empty with the first inspection scheduled; the criticality is
assigned by whoever owns Block B, as a task with a name on it.

**Step 2 — the label, which is the register's decision made physical.**
`CH-B2-01`, printed as a code and again as human-readable text beside it,
because a damaged code is typed. Not the serial, and not a URL pointing at a
system this organisation may not be running in ten years. The label goes where
it can be read without moving anything, and not on the part most likely to be
replaced.

**Step 3 — the first field visit, which is also the first chance to get it
wrong.** The technician is asked to confirm three things: that the tag they
scanned matches the nameplate serial in the pack, that the unit is where the
register says it is, and the initial condition. The app's session is scoped to
Block B's HVAC system, so a scan landing on one of the neighbouring air
handling units raises a question rather than a record. And because the visit
is on a roof, the capture is queued locally and the plan does not treat the
technician pressing submit as the record having arrived.

**Step 4 — the baseline, which you cannot do yet.** Six days is not a
baseline; it is a sample of one week's weather. Until there is enough history,
the unit is monitored and not alarmed, and the plan says that in those words so
nobody reads the silence as health. When the baseline is established, its
window and start date are recorded with it — and it is discarded the first time
the unit is repaired, because after that it describes a different machine.

**Step 5 — the first work order, and what it is measured against.** The
schedule template supplies the interval; the work order exists so that in six
months the question "has this been maintained" has an answer that is a row
rather than a memory. Without a stated policy interval there is nothing to
compare a gap against, and an asset with no completed work order looks
identical to one nobody scheduled.

**The order, and the one step that has to wait.** Register row, then label,
then field visit, then work order — each depends on the one before it, because
you cannot tag an asset that has no identifier and cannot inspect one the app
cannot resolve. The baseline is the exception: it cannot be done for weeks, and
the plan's job is to make that a scheduled step rather than something everyone
forgets until the first false alarm.

**What this plan does not settle.** Whether the criticality assignment will
actually happen, which is a question about a person rather than a system.
Whether the telemetry is attributed to the right asset at the source — the
plan assumes the integration was configured correctly and nothing here checks
it. And what happens to all of this if the contractor's works order turns out
to describe a different unit than the one on the roof, which is the failure
this whole sequence is least able to detect.
