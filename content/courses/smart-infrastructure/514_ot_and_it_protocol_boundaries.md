# 514. OT and IT: Protocol Boundaries, Segregation, and the Gateway

## What It Is
Operational technology (OT) is the equipment that runs the plant: PLCs, RTUs, sensors and actuators, talking Modbus, BACnet, DNP3, OPC UA. Information technology (IT) is everything an integration developer normally works with: HTTP, JSON, message brokers, databases. Between them sits a boundary that is a network boundary, a protocol boundary and an ownership boundary all at once, and a smart-infrastructure integration lives on the IT side of it, reading through a controlled crossing point.

The protocols are genuinely different in shape, not just in syntax. **Modbus** is register-based: the device exposes numbered 16-bit registers, and the meaning of register 40001 is in a document, not in the protocol — there is no type, no name, no unit on the wire. **BACnet** is object-based: a device exposes objects (Analog Input 1, Binary Value 3) with properties, so it is more self-describing, but discovery and addressing are their own subject. **OPC UA** carries a full address space with types and metadata and is the one most comfortable to bridge to IT. The integration has to map each of these onto the canonical model, and for Modbus that map is hand-written from the vendor's register table.

The crossing point is a **gateway** — sometimes a dedicated appliance, sometimes a software service, sometimes a historian that already does the job. Its responsibilities are worth stating as a data contract: it **polls or subscribes** to the OT devices on their terms, **translates** register or object reads into named, typed, unit-carrying records, **buffers** so that an IT-side outage does not lose readings and an OT-side stall does not block IT, and **presents one direction of flow by default** — data out, with any control path treated as a separate, deliberately narrow channel.

What the integration developer needs from this boundary is a clean, documented feed on the IT side: named points, known units, a timestamp with a known clock (Lesson 474 in the IoT course), and a statement of what the gateway does when a device stops responding. The OT network's own design — its segmentation, its access control, its monitoring — is a security discipline owned by other people, and this course does not give recommendations on it.

## Key Concepts
- **OT** runs the plant (PLC, RTU, sensor) on Modbus / BACnet / DNP3 / OPC UA; **IT** is HTTP / JSON / brokers / databases
- **The boundary is network, protocol and ownership at once**
- **Modbus is register-based** — numbered 16-bit registers, meaning lives in a document, nothing typed on the wire
- **BACnet is object-based** — devices expose named objects with properties, more self-describing
- **OPC UA carries a typed address space** — the easiest to bridge to IT
- **The gateway is the crossing point** — poll/subscribe, translate to named typed records, buffer both ways, one direction of flow by default
- **State the gateway's behaviour as a data contract** — including what it does when a device goes silent
- **What the integration needs**: named points, known units, a timestamp with a known clock, a stated failure behaviour
- **OT network security is a separate discipline** owned by other people — not covered here

## Example Code
The shape of the mapping problem, for the least self-describing of the protocols. A Modbus read returns numbers; the register map is what makes them data:

```typescript
/** A vendor register-map entry, transcribed by hand from the device manual.
 *  This table IS the semantics — Modbus itself carries none of it. */
type ModbusPoint = {
  /** Canonical point name in the integration's model. */
  point: string;
  /** Modbus function + address. 3xxxx = input register, 4xxxx = holding. */
  register: number;
  /** How to decode the raw 16-bit words. */
  encoding: 'uint16' | 'int16' | 'int32-be' | 'float32-be';
  /** Registers are integers; the real value is raw * scale + offset. */
  scale: number;
  offset: number;
  unit: string;
};

const PUMP_STATION_MAP: ModbusPoint[] = [
  { point: 'ps01.flow',        register: 30001, encoding: 'float32-be', scale: 1,    offset: 0, unit: 'l/s' },
  { point: 'ps01.pressure',    register: 30003, encoding: 'uint16',     scale: 0.1,  offset: 0, unit: 'bar' },
  { point: 'ps01.run_hours',   register: 30004, encoding: 'int32-be',   scale: 1,    offset: 0, unit: 'h' },
  { point: 'ps01.pump1_state', register: 10001, encoding: 'uint16',     scale: 1,    offset: 0, unit: 'bool' },
];

/** Decode one raw reading into a canonical record. The raw words come from the
 *  gateway's poll; everything that makes them meaningful comes from the map. */
function decode(entry: ModbusPoint, rawWords: number[]): { point: string; value: number; unit: string } {
  let raw: number;
  switch (entry.encoding) {
    case 'uint16': raw = rawWords[0]; break;
    case 'int16':  raw = (rawWords[0] << 16) >> 16; break;
    case 'int32-be': raw = (rawWords[0] << 16) | rawWords[1]; break;
    case 'float32-be': {
      const buf = new ArrayBuffer(4);
      const dv = new DataView(buf);
      dv.setUint16(0, rawWords[0]);
      dv.setUint16(2, rawWords[1]);
      raw = dv.getFloat32(0);
      break;
    }
  }
  return { point: entry.point, value: raw * entry.scale + entry.offset, unit: entry.unit };
}
```

```typescript
/** The gateway's contract, as a type the IT side can rely on. The important
 *  field is the last one: an explicit statement of what a missing device
 *  looks like downstream, so a consumer does not read a stale value as fresh. */
type GatewayFeed = {
  point: string;
  value: number | null;
  unit: string;
  /** The clock this came from — Lesson 474's distinction, carried through. */
  observedAt: string;
  clockSource: 'device' | 'gateway';
  /** Set when the gateway's last poll of this point failed. A consumer must
   *  treat `value` as stale, not absent. */
  stale: boolean;
  lastGoodAt: string | null;
};
```

## When to Use
- When an integration needs live plant data and the only source is an OT network — the gateway feed is the interface to design against
- When transcribing a vendor register map, which is unavoidable manual work for Modbus and error-prone without a review
- When specifying a new gateway or historian — its buffering and failure behaviour belong in the procurement, not discovered later
- When a reading looks wrong and the question is whether the gateway, the map or the device is at fault — the decode step is where scale and encoding errors live

## Common Mistakes
- **Treating a Modbus register value as self-describing** — register 40001 means whatever the manual says, and nothing on the wire tells you
- **Getting the word order wrong on 32-bit values** — big-endian vs little-endian vs word-swapped is a per-vendor decision and a common decode bug
- **No buffering at the gateway** — an IT-side outage then loses readings that the OT side had, silently
- **Letting the feed omit a staleness signal** — a consumer reads the last value as current and acts on a number from an hour ago
- **Carrying the timestamp without its clock source** — device time and gateway time are different questions (Lesson 474), and merging them loses order (Lesson 518)
- **Assuming one gateway is a single point that cannot fail** — its buffering and failover behaviour is part of the contract, not an afterthought

## Further Reading
- [Modbus Application Protocol Specification V1.1b3](https://www.modbus.org/docs/Modbus_Application_Protocol_V1_1b3.pdf) — the register model and function codes, publisher and version stated
- [BACnet — ASHRAE Standard 135](https://www.ashrae.org/technical-resources/standards-and-guidelines) — the object model and services; catalogue reference only
- [OPC UA Online Reference (OPC Foundation)](https://reference.opcfoundation.org/) — the address-space and information-model concepts that make OPC UA the easiest OT protocol to bridge

<!-- This lesson is on scripts/stamp-verified.ts's HARM_DENYLIST: OT/IT
segregation is a security topic, so no exercises open on it until an expert
review. It carries no quiz and no recall by design. -->
