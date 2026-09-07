# 548. Memory You Cannot Ask For: Static Allocation, Stack Depth, and the Heap You Did Not Budget

## What It Is
On a device there is one number for RAM and it was decided when the part was chosen. There is no virtual memory, no swap, no page fault, and no out-of-memory killer to blame. Everything the firmware will ever hold has to fit at once, and the linker — not the runtime — is where you find out whether it does. Its map file is the closest thing embedded work has to a memory profiler, and it reports three regions worth separating: `.text` and `.rodata`, which live in flash; `.data` and `.bss`, which occupy RAM from the bottom; and whatever is left for the stack and, if you allow one, a heap.

The stack is the part that fails invisibly. It grows down from the top of RAM toward `.bss`, and nothing checks that it stops. When it does not, it writes over a variable that belongs to something else, and **the symptom appears in code that has nothing to do with the cause** — a counter that changes on its own, a string that grows a stray byte, a state machine in an impossible state. Its depth is the worst-case call chain, plus every local variable along that chain, plus the frame an interrupt pushes when it lands at the deepest point — and on a kernel, plus that again for every task, since each has its own stack (Lesson 547).

Because the worst case is what matters and it is not observable by testing the common case, the depth is **measured, not estimated**. The standard technique is stack painting: fill the stack region with a known pattern at startup, run the device through its heaviest path, and read back how far the pattern was overwritten. That high-water mark is a fact about a real run rather than a guess. Static analysis of call graphs (`-fstack-usage` and the tools built on it) gives the complementary number: the theoretical worst case, including paths testing did not reach.

The heap is the other half, and the advice is stronger than it looks: **long-running firmware should not allocate dynamically at all**. Not because allocation is slow, but because fragmentation is unbounded on a device that runs for years and never restarts. A general-purpose allocator can leave you with plenty of free RAM in pieces too small to use, and there is no compaction and no restart to recover from it. The alternatives are known and boring: static buffers sized at build time, and fixed-size pools where a fixed number of identical objects are handed out and returned. Both fail at build time or immediately, which is exactly when you want to find out.

```quiz
- q: "The firmware's stack grows past its region. What is the symptom?"
  anchor: "the symptom appears in code that has nothing to do with the cause"
  options:
    - text: "An out-of-memory error from the allocator"
      correct: false
      why: "Nothing is watching. There is no allocator involved and no error to raise."
    - text: "Corruption of whatever variable occupied the memory below it, so the failure surfaces somewhere unrelated"
      correct: true
      why: "That is why stack depth must be measured rather than inferred from where the crash appeared."
    - text: "A hard fault at the exact instruction that overflowed"
      correct: false
      why: "Only with hardware stack-limit checking enabled; by default the write simply succeeds."

- q: "Why is the worst-case stack depth measured rather than estimated?"
  anchor: "measured, not estimated"
  options:
    - text: "Because compilers do not report per-function stack usage"
      correct: false
      why: "They do -- that is the complementary static number. The measurement covers the paths actually taken."
    - text: "Because the deepest path includes an interrupt frame landing at the deepest point, which no ordinary test exercises"
      correct: true
      why: "Painting the stack and reading the high-water mark after the heaviest run gives a fact instead of a guess."
    - text: "Because stack usage changes with the ambient temperature"
      correct: false
      why: "Nothing about frame size is environmental."

- q: "Why avoid dynamic allocation in firmware that runs for years?"
  anchor: "fragmentation is unbounded"
  options:
    - text: "Allocation is too slow for real-time code"
      correct: false
      why: "Speed is a secondary concern and a pool solves it. The problem is what happens over time."
    - text: "Free memory ends up in pieces too small to use, with no compaction and no restart to recover"
      correct: true
      why: "A device with no restart has no way back from a fragmented heap."
    - text: "The heap and the stack cannot coexist in the same RAM"
      correct: false
      why: "They can, growing toward each other -- which is its own hazard, but not the reason to avoid the heap."
```

## Key Concepts
- **RAM is one fixed number** — no virtual memory, no swap, no OOM killer, and the linker map is the profiler
- **Flash holds `.text`/`.rodata`; RAM holds `.data`/`.bss`**, plus the stack from the top and any heap
- **A stack overflow corrupts a neighbour** — the symptom appears far from the cause, with no fault raised by default
- **Depth = worst-case call chain + locals + an interrupt frame at the deepest point**, per task on a kernel
- **Measure with stack painting** (a known pattern, then the high-water mark) and check against `-fstack-usage`
- **Avoid the heap in long-running firmware** — fragmentation is unbounded and there is no compaction or restart
- **Use static buffers and fixed-size pools**, which fail at build time or immediately rather than in year two

## Example Code
The budget, made explicit. Enter the numbers from your own linker map; the point is that every line is a decision someone made, and the last one is the only line that says whether the device works:

```calc
inputs:
  - { id: ram_total,    label: "RAM on the part (bytes)", type: number, default: 65536, min: 1 }
  - { id: data_bss,     label: ".data + .bss + static pools, from the linker map (bytes)", type: number, default: 29592, min: 0 }
  - { id: main_stack,   label: "Main/loop stack allocated (bytes)", type: number, default: 4096, min: 0 }
  - { id: task_stack,   label: "Stack per RTOS task (bytes)", type: number, default: 1024, min: 0 }
  - { id: task_count,   label: "Number of tasks (0 for a superloop)", type: number, default: 4, min: 0 }
  - { id: measured_hw,  label: "Measured stack high-water mark, deepest run (bytes)", type: number, default: 2900, min: 0 }
outputs:
  - { label: "Stacks total (bytes)", expr: "main_stack + task_stack * task_count", format: number }
  - { label: "Committed RAM (bytes)", expr: "data_bss + main_stack + task_stack * task_count", format: number }
  - { label: "Free RAM (bytes)", expr: "ram_total - (data_bss + main_stack + task_stack * task_count)", format: number }
  - { label: "Main stack used, measured", expr: "measured_hw / main_stack", format: percent }
```

Two of these outputs are the ones to argue about. Free RAM near zero means the next feature is a part change, not a sprint. And a measured high-water mark close to the allocated stack means the device is one unusual interrupt away from corrupting a variable that will be blamed on something else entirely.

## When to Use
- Before choosing a part, where the RAM figure is the constraint that is hardest to revise later
- After every feature that adds a buffer, a task or a library — the map file is the review artifact
- When adopting a kernel, since each task's stack is a separate line in this budget (Lesson 547)
- When a device fails in a way that moves — a different variable each time — which is the signature of a stack overrun
- When a device runs for weeks and then misbehaves, where an unbounded heap is the first suspect

## Common Mistakes
- **Reading only the flash usage** — flash is usually the number the toolchain prints, and RAM is the one that runs out
- **Estimating stack depth from the code** — the deepest path plus an interrupt frame is not visible by reading
- **Sizing every task's stack the same** — a task that formats strings needs a different budget from one that toggles a pin
- **Calling `malloc` "just for initialization"** — allocations at startup are fine, but a `free` anywhere makes fragmentation possible
- **Using recursion** — depth becomes data-dependent, and the worst case stops being computable
- **Treating a stack overflow as a crash** — by default nothing faults; it is a silent write into someone else's variable

## Further Reading
- [GCC: Developer options, including `-fstack-usage`](https://gcc.gnu.org/onlinedocs/gcc/Developer-Options.html) — the per-function stack figures a static worst-case analysis is built from
- [Zephyr Project: threads and their stacks](https://docs.zephyrproject.org/latest/kernel/services/threads/index.html) — how a kernel accounts for per-task stacks, and its built-in high-water reporting
- [MISRA publications (MISRA C:2012 restricts dynamic memory)](https://misra.org.uk/publications/) — the coding-standard position on allocation in embedded software, and its rationale
- [Lesson 545](/courses/embedded-firmware/the-ring-buffer-between-two-contexts) — the static, build-time-sized queue that a dynamic one would otherwise be

```recall
- q: "What does a stack overflow look like on a microcontroller?"
  must:
    - "the stack grows down into .bss and overwrites another variable"
    - "no fault is raised by default -- the write simply succeeds"
    - "so the symptom appears in unrelated code, which is why depth is measured rather than inferred"

- q: "How is worst-case stack depth established?"
  must:
    - "paint the stack region with a known pattern at startup and read the high-water mark after the heaviest run"
    - "combine it with static per-function usage (-fstack-usage) to cover paths testing did not reach"
    - "include the interrupt frame landing at the deepest point, and one stack per task on a kernel"

- q: "Why should long-running firmware avoid dynamic allocation?"
  must:
    - "fragmentation is unbounded on a device that never restarts"
    - "free memory ends up in pieces too small to use, and there is no compaction"
    - "static buffers and fixed-size pools fail at build time or immediately instead"
```
