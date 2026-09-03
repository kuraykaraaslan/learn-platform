# 478. Device Identity and Provisioning: Certificates, Rotation, Revocation

## What It Is
> **This lesson carries no exercises, deliberately.** It describes security
> mitigations, and this repository's stopping rule is that an exercise is
> never opened on content that has not been through an expert review. The
> lesson is here to be read and to be checked against your own threat model
> and your platform's documentation — not to be drilled, and not to be
> treated as a specification. Lesson 479 covers the operational half of fleet
> management and defers the trust chain to this page for the same reason.

Every other lesson in this course assumes the reading came from the device it claims to have come from. This one is about what makes that true, and it has three parts that are usually confused with one another.

**Identity** is what the device is. A device needs a name that is unique across the fleet, stable across its lifetime, and not guessable from another device's name — a sequential serial number fails the third. That identity has to exist before the device can talk to anything, which means it is created at manufacture or at first contact rather than by the device asking for one.

**Provisioning** is how the device gets the credential that proves that identity, and it is the hard part because it happens at the least controlled moment in the device's life. A per-device credential injected during manufacture requires a trustworthy manufacturing process. A credential fetched at first boot requires a bootstrap credential, which pushes the problem back one step rather than solving it. A shared credential across a fleet removes the problem and removes the identity with it: one extracted device compromises all of them, and nothing distinguishes a genuine device from a cloned one.

**Rotation and revocation** are what make the first two survive time. A credential that cannot be replaced is a credential with an expiry date you have not written down; a fleet that cannot revoke one device cannot respond to a single compromised unit except by rotating everything. Both have to be exercised before they are needed — a rotation path that has never been run on a real device in the field is a plan, not a capability.

The constraint that makes all of this harder than its web equivalent is that **the device may be unreachable for months and cannot be asked anything**. A revocation list has to be checkable by the party the device connects to, because the device cannot be relied upon to fetch one. And a rotation has to survive a device that misses it entirely and wakes up with an expired credential — which is a recovery path, and needs designing rather than discovering.

## Key Concepts
- **Identity, provisioning and rotation are three problems**, not one
- **A device identity must be unique, stable and unguessable** — a sequential serial fails the last
- **Identity precedes first contact**: it is assigned, not requested
- **Provisioning happens at the least controlled moment** in the device's life
- **A bootstrap credential moves the problem**, it does not remove it
- **A shared fleet credential removes identity**: one extracted device is all of them, and a clone is indistinguishable
- **Rotation and revocation must be exercised**, or they are plans rather than capabilities
- **Revocation is checked by the server**, because the device cannot be relied on to fetch a list
- **An expired credential needs a recovery path**, because some device will miss the rotation
- **Hardware-backed key storage** changes what "extracted" means, and is the reason secure elements exist

## Example Code
No runnable example and no snippet to paste. A credential-handling code path that has not been reviewed against a specific platform's documentation and a specific threat model is worse than none, because it looks like an answer.

What is worth writing down is the set of questions a design has to answer, in the order they bite:

```text
IDENTITY
  What is the device called, and who assigns it?
  Is it guessable from another device's name?
  Does it survive a factory reset? A mainboard swap? A firmware reflash?

PROVISIONING
  What credential proves that identity, and where is it stored on the device?
  Who put it there, at which point in manufacture or deployment?
  If there is a bootstrap credential, what protects THAT?
  What stops a credential extracted from one device from being used by another?

ROTATION
  How is a credential replaced, and how long does the fleet take to do it?
  What happens to a device that is offline for the whole rotation window?
  Has the path been run on a real device in the field, or only in a lab?

REVOCATION
  Who checks whether a credential is revoked, and how quickly?
  Can one device be revoked without affecting the others?
  What is the response to a compromised unit, stated as a runbook?

RECOVERY
  What does a device with an expired or rejected credential do?
  Is that path reachable without physical access?
```

## When to Use
- Before the first device ships, since provisioning is a manufacturing decision and manufacturing decisions are expensive to revisit
- When reviewing a fleet design, where the shared-credential shortcut is the single most common and most costly finding
- When a compromise is suspected, where the ability to revoke one device is what determines the size of the response
- When choosing a platform, since the provisioning and rotation model is the part that is hardest to change afterwards

## Common Mistakes
- **Sharing one credential across a fleet** — it removes the identity along with the problem, and one extracted device compromises every device
- **Deriving device identity from a sequential serial number** — unique and stable, and guessable, which is the property that matters here
- **Never exercising rotation** — an untested rotation path is a plan; the first real run happens under time pressure
- **Assuming the device can fetch a revocation list** — it may be asleep for months, so the check belongs on the side that is always awake
- **Not designing the expired-credential path** — some device will miss the rotation window, and its recovery cannot require someone driving to it
- **Treating provisioning as a software task** — where the credential comes from and who put it on the device are manufacturing and logistics questions

## Further Reading
- [MQTT 5.0 specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html) — the enhanced authentication exchange, and what the protocol does and does not specify about credentials
- [LoRaWAN L2 1.0.4 specification](https://resources.lora-alliance.org/technical-specifications/ts001-1-0-4-lorawan-l2-1-0-4-specification) — the join procedure and root keys, and the difference between over-the-air and pre-personalised activation
- [ThingsBoard documentation](https://thingsboard.io/docs/) — one platform's device credential model, as a concrete example to compare a design against
