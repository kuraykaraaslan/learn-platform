# 552. Power Loss Is a State Transition: Flash Wear, Journaling, and the Commit Point

## What It Is
A server can assume it will be told before it stops. A field device cannot: the battery contacts vibrate, the supply browns out, someone pulls the breaker. Power loss is not an exception to handle, it is **a transition that can occur between any two instructions**, including the two that were updating the thing the device needs in order to boot. Firmware that survives in the field treats it as a normal state transition and designs for it, once, in the small number of places that write persistent state.

Understanding those places starts with how flash actually behaves, because it is not memory. Erasing sets a whole block to all ones; programming can only clear bits from one to zero; and a bit cannot return to one without erasing its entire block. So "update one configuration field" is really "erase a block and rewrite it", and there is a window in the middle where **the block contains neither the old value nor the new one**. Blocks also have a finite endurance — a datasheet number of erase cycles — and a device that rewrites the same block on every change will reach it. Both facts point at the same design.

That design is a **journal**. Instead of overwriting a record, append a new one into free space in the block and treat the last valid record as current; when the block fills, write the surviving records into a freshly erased block and erase the old one. Appending spreads writes across the block instead of erasing on every change, which is the wear argument, and it means the previous record is still intact while the new one is being written, which is the power-loss argument. The two problems have one answer.

What makes a record valid is the **commit point**: a single write, performed last, that turns a region of bytes from "being written" into "the truth". A checksum or a sequence number written after the payload does this, provided that write is small enough to be atomic on the part. Before it, a reader sees an incomplete record and skips it; after it, the record is current. Power loss anywhere in between leaves the previous record as the newest valid one, which is exactly the behaviour required. **A design without an identifiable commit point does not have a power-loss story**, whatever its error handling looks like.

The same argument governs a firmware update on the device side. The image is received into a slot that is not the running one, it is verified completely, and only then does a single write flip which slot boots. Nothing is overwritten in place, and the flip is one word rather than a sequence. Two neighbouring subjects are deliberately not this lesson's: **what makes an image trustworthy — signing, keys and the trust chain — is Lesson 478's**, and **how an update is rolled out and rolled back across a fleet is Lesson 479's**. This lesson is only about where the bytes go and which single write makes the change real.

```quiz
- q: "Why does updating one configuration field mean erasing an entire flash block?"
  anchor: "a bit cannot return to one without erasing its entire block"
  options:
    - text: "Because the flash controller only exposes block-sized transfers"
      correct: false
      why: "Programming granularity is usually a page or a word; the constraint is the direction bits can move."
    - text: "Because programming can only clear bits to zero, and restoring a bit to one requires erasing the whole block"
      correct: true
      why: "That is why an in-place update has a window containing neither the old value nor the new one."
    - text: "Because the checksum covers the whole block and must be recomputed"
      correct: false
      why: "A checksum is a design choice; the erase granularity is a property of the device."

- q: "What does a journal buy over rewriting a record in place?"
  anchor: "The two problems have one answer"
  options:
    - text: "Faster writes, because appending skips the erase"
      correct: false
      why: "Speed is a side effect. The reasons are wear and survivability."
    - text: "Wear spread across the block, and the previous record left intact while the new one is written"
      correct: true
      why: "One structure answers both the endurance problem and the power-loss problem."
    - text: "Smaller storage, because records are compressed"
      correct: false
      why: "A journal uses more space, not less. That is what it trades for the guarantee."

- q: "What is a commit point?"
  anchor: "a single write, performed last"
  options:
    - text: "The moment the write function returns successfully"
      correct: false
      why: "A return says the driver finished, not that the device holds a complete record."
    - text: "One small, last write — a checksum or sequence number — that turns bytes being written into the current truth"
      correct: true
      why: "Before it, a reader skips the incomplete record; after it, the record is current."
    - text: "The point where the erase completes and the block reads as all ones"
      correct: false
      why: "That is the start of the dangerous window, not the end of it."
```

## Key Concepts
- **Power loss is a transition between any two instructions**, not an exception to be caught
- **Flash is not memory**: erase sets a block to ones, programming only clears bits, and a bit cannot be set without erasing its block
- **An in-place update has a window** where the block holds neither the old value nor the new one
- **Endurance is finite per block** — a datasheet figure a device that rewrites on every change will reach
- **A journal answers both**: append new records, treat the last valid one as current, compact when the block fills
- **The commit point is one small write performed last** — a checksum or sequence number that makes the record real
- **The OTA image follows the same rule**: receive into the inactive slot, verify fully, then flip one word
- **Signing is Lesson 478's, rollout and rollback are Lesson 479's** — this lesson is where the bytes go

## Example Code
The wear question, made arithmetic. The endurance figure belongs to a specific part and is read from its datasheet; everything else is a decision about how often the firmware writes:

```calc
inputs:
  - { id: endurance,    label: "Erase cycles per block (datasheet figure for the part)", type: number, default: 10000, min: 1 }
  - { id: block_bytes,  label: "Erase block size (bytes)", type: number, default: 4096, min: 1 }
  - { id: record_bytes, label: "Size of one journal record (bytes)", type: number, default: 32, min: 1 }
  - { id: writes_day,   label: "Records written per day", type: number, default: 288, min: 1 }
  - { id: blocks,       label: "Blocks dedicated to the journal", type: number, default: 2, min: 1 }
outputs:
  - { label: "Records per block", expr: "round(block_bytes / record_bytes)", format: number }
  - { label: "Erases per block per year", expr: "365 * writes_day / round(block_bytes / record_bytes) / blocks", format: number }
  - { label: "Years until the endurance figure is reached", expr: "endurance * blocks * round(block_bytes / record_bytes) / (365 * writes_day)", format: number }
  - { label: "Years if the same block were erased on every write instead", expr: "endurance / (365 * writes_day)", format: number }
```

The last two outputs are the whole argument. Rewriting in place divides the device's storage life by the number of records a block can hold — on the defaults, a device whose journal would last about 24 years instead reaches its endurance figure in roughly five weeks, and it does so silently, one field return at a time.

## When to Use
- On every piece of state that must survive a reset: configuration, calibration (Lesson 534), counters, the boot-failure count of Lesson 551
- When choosing where a value lives — RAM that vanishes, journalled flash that survives, or a server that has to be reachable
- When adding a write to a code path that runs often, where the wear arithmetic above decides whether it is acceptable
- When implementing the device side of an update, where the verify-then-flip order is the entire correctness argument
- When reviewing persistence code, where the first question is "which single write is the commit point?"

## Common Mistakes
- **Overwriting a record in place** — the window in the middle holds neither version, and power loss lands in it eventually
- **Writing the checksum before the payload** — the record then claims to be valid while it is still being written
- **A commit write larger than the part's atomic program unit** — a torn commit marker is the failure the design was meant to remove
- **Rewriting the same block on every change** — the endurance figure arrives years early, and looks like random hardware failure
- **Flipping the boot slot before verifying the image** — the device commits to bytes it has not checked (Lesson 479's rollback then has to save it)
- **Testing power loss by shutting down cleanly** — the interesting cases are mid-erase and mid-program, and they need a deliberately brutal test

## Further Reading
- [ST AN4894: EEPROM emulation techniques and software for STM32](https://www.st.com/resource/en/application_note/an4894-eeprom-emulation-techniques-and-software-for-stm32-microcontrollers-stmicroelectronics.pdf) — a worked journal over flash blocks: record format, the valid marker, compaction and the wear arithmetic
- [Zephyr Project: the NVS non-volatile storage subsystem](https://docs.zephyrproject.org/latest/services/storage/nvs/nvs.html) — one open implementation of the same structure, including its rules for what survives an interrupted write
- [Lesson 479](/courses/iot-telemetry-edge/device-fleet-management) — the rollout, probation and automatic rollback that sit above the slot flip
- [Lesson 478](/courses/iot-telemetry-edge/device-identity-and-provisioning) — what makes an image trustworthy in the first place, held as the security topic it is

```recall
- q: "Why can flash not be updated the way RAM is?"
  must:
    - "erasing sets a whole block to ones and programming can only clear bits to zero"
    - "a bit cannot return to one without erasing its entire block"
    - "so an in-place update passes through a window holding neither the old value nor the new one"

- q: "What is a journal and which two problems does it solve at once?"
  must:
    - "new records are appended into free space and the last valid record is treated as current"
    - "appending spreads writes across the block instead of erasing on every change -- the wear problem"
    - "and the previous record stays intact while the new one is written -- the power-loss problem"

- q: "Define the commit point and state its constraint."
  must:
    - "a single small write performed last -- a checksum or sequence number -- that makes the record current"
    - "it must be atomic at the part's program granularity, or the marker itself can tear"
    - "before it a reader skips the record; after it the record is the truth, so power loss in between is safe"
```
