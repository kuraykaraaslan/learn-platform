# 547. When the Superloop Stops Paying: Tasks, Priorities, and Priority Inversion

## What It Is
A superloop is a scheduler — a very simple one, with a single priority level and no preemption between jobs. It is enough for most sensor nodes, and Lesson 546's state machines are how it stays enough. It stops being enough at a specific point, and the point is worth naming precisely: **when one job's worst-case iteration is longer than another job's deadline**. Not when the code gets complicated, not when the team grows — when a deadline and a duration collide and no amount of restructuring separates them.

A **preemptive kernel** answers that by giving each job its own stack and letting a higher-priority job take the core the instant it becomes ready. What you buy is bounded response time for the jobs you designated important. What you pay is threefold: **RAM**, because each task needs a stack sized for its own worst case plus interrupt overhead (Lesson 548); **switching cost**, paid on every preemption; and a new class of bug that a superloop cannot have, because a superloop has nothing to share between jobs that are never interleaved.

The archetype of that new class is **priority inversion**. A low-priority task takes a mutex. A high-priority task becomes ready, wants the same mutex, and blocks — correctly, so far. Then a *medium*-priority task becomes ready and preempts the low-priority one, which is also correct in isolation. The result is that a medium-priority task, holding no resources and having nothing to do with either, is delaying the highest-priority task in the system, for as long as it likes. The standard mitigation is **priority inheritance**: while a high-priority task waits on a mutex, the holder temporarily runs at the waiter's priority, so nothing in between can preempt it. This is not a hypothetical failure — it is the one that hung the Mars Pathfinder lander and had to be fixed by enabling inheritance on the affected mutex from another planet.

The honest summary is that a kernel does not remove complexity, it relocates it. The superloop's complexity is in decomposing every job so no step runs long. The kernel's complexity is in stack budgets, priority assignment, and the interactions between tasks that a single-threaded loop made impossible by construction. **Choose by the deadline, not by the aesthetics** — and note that most sensor nodes never reach the point where the deadline forces the choice.

```quiz
- q: "What is the precise condition under which a superloop stops being sufficient?"
  anchor: "when one job's worst-case iteration is longer than another job's deadline"
  options:
    - text: "When the number of jobs exceeds what one loop can hold readably"
      correct: false
      why: "Readability is a decomposition problem, and state machines solve it without preemption."
    - text: "When one job's worst-case iteration is longer than another job's deadline and it cannot be decomposed"
      correct: true
      why: "A duration colliding with a deadline is the forcing condition -- nothing else is."
    - text: "When the device gains a second processor core"
      correct: false
      why: "A second core is a different question entirely, and most sensor nodes have one."

- q: "A medium-priority task with no shared resources delays the highest-priority task. What is happening?"
  anchor: "priority inversion"
  options:
    - text: "The scheduler is misconfigured and the priorities are inverted in the code"
      correct: false
      why: "Every task obeys its own priority correctly. The system's behaviour is still wrong."
    - text: "Priority inversion — the high-priority task is blocked on a mutex held by a low-priority task the medium one preempts"
      correct: true
      why: "The medium task holds nothing and is unrelated, which is what makes it hard to see."
    - text: "A deadlock between the high- and medium-priority tasks"
      correct: false
      why: "Nothing is deadlocked; the system makes progress, just not on the task that matters."

- q: "What does priority inheritance do?"
  anchor: "the holder temporarily runs at the waiter's priority"
  options:
    - text: "It permanently raises the low-priority task so the situation cannot recur"
      correct: false
      why: "It is temporary, and lasts only while a higher-priority task is actually waiting."
    - text: "While a high-priority task waits on a mutex, the holder runs at the waiter's priority so nothing in between can preempt it"
      correct: true
      why: "It closes the window the medium-priority task was using."
    - text: "It aborts the low-priority task so the mutex is released immediately"
      correct: false
      why: "Aborting mid-critical-section would leave whatever the mutex protects in an undefined state."
```

```tradeoff
question: "The device has a hard deadline one job's worst-case iteration cannot meet. Restructure the superloop, or adopt a preemptive kernel?"
sides:
  - name: "Superloop with state machines"
    wins_when:
      - signal: "every job can be decomposed into steps whose worst case is comfortably under the tightest deadline — the decomposition is work, but it is bounded and reviewable"
      - signal: "RAM is the binding constraint, since one stack for the loop is dramatically cheaper than one stack per task plus the kernel's own overhead"
      - signal: "the team can reason about the whole device by reading one loop, and there is no shared state between jobs because they never interleave"
      - signal: "certification, review or field-debug practice favours a system whose entire control flow is visible in one function"
  - name: "Preemptive kernel"
    wins_when:
      - signal: "a job genuinely cannot be decomposed — a blocking driver, a protocol stack, or a third-party library that owns its control flow"
      - signal: "the deadline is short relative to the longest indivisible step, so responsiveness must come from preemption rather than from decomposition"
      - signal: "several independent activities each need their own blocking sequence, and expressing them as interleaved state machines has stopped being readable"
      - signal: "the RAM budget has room for per-task stacks measured with a high-water mark, not estimated (Lesson 548)"
```

## Key Concepts
- **A superloop is a scheduler** — one priority, no preemption; state machines are how it scales (Lesson 546)
- **It stops paying when one job's worst-case step exceeds another job's deadline** — a duration/deadline collision, nothing else
- **A preemptive kernel buys bounded response** for the jobs you designate as important
- **It costs RAM (a stack per task), switching overhead, and a new bug class** that a non-interleaved loop cannot have
- **Priority inversion**: a medium-priority task delays a high-priority one by preempting the low-priority holder of its mutex
- **Priority inheritance** raises the holder to the waiter's priority for the duration, closing the window
- **Mars Pathfinder** is the canonical case — diagnosed and fixed in flight by enabling inheritance
- **Choose by the deadline, not by the aesthetics** — most sensor nodes never reach the forcing point

## Example Code
Priority inversion, run as a timeline rather than described. Same three tasks, same arrival times, one difference: whether the mutex holder inherits the waiter's priority.

```typescript run
/** A tick-by-tick model of three tasks and one mutex. H (high) and L (low)
 *  both need the mutex; M (medium) needs nothing and is pure interference. */
type Task = {
  name: string;
  priority: number; // higher runs first
  readyAt: number;
  work: number; // ticks of work remaining
  needsMutex: boolean;
  done?: number;
};

function simulate(inheritance: boolean): { order: string[]; hDone: number } {
  const tasks: Task[] = [
    { name: 'H', priority: 3, readyAt: 2, work: 2, needsMutex: true },
    { name: 'M', priority: 2, readyAt: 3, work: 6, needsMutex: false },
    { name: 'L', priority: 1, readyAt: 0, work: 5, needsMutex: true },
  ];
  let holder: Task | null = null;
  const order: string[] = [];

  for (let tick = 0; tick < 20; tick++) {
    // A waiter's priority is lent to the holder while it waits.
    const waiters = tasks.filter(
      (t) => t.readyAt <= tick && t.work > 0 && t.needsMutex && holder !== null && holder !== t
    );
    const effective = (t: Task): number => {
      if (!inheritance || holder !== t || waiters.length === 0) return t.priority;
      return Math.max(t.priority, ...waiters.map((w) => w.priority));
    };

    const runnable = tasks.filter((t) => {
      if (t.readyAt > tick || t.work <= 0) return false;
      if (t.needsMutex && holder !== null && holder !== t) return false; // blocked
      return true;
    });
    if (runnable.length === 0) { order.push('.'); continue; }

    runnable.sort((a, b) => effective(b) - effective(a));
    const running = runnable[0];
    if (running.needsMutex && holder === null) holder = running;
    running.work--;
    if (running.work === 0) {
      running.done = tick + 1;
      if (holder === running) holder = null;
    }
    order.push(running.name);
  }
  return { order, hDone: tasks.find((t) => t.name === 'H')!.done ?? -1 };
}

const without = simulate(false);
const with_ = simulate(true);

console.log('L holds the mutex from tick 0. H (highest, needs the mutex) is ready at tick 2.');
console.log('M (medium, needs nothing at all) is ready at tick 3.');
console.log('');
console.log(`no inheritance      : ${without.order.join(' ')}`);
console.log(`with inheritance    : ${with_.order.join(' ')}`);
console.log('');
console.log(`H finishes at tick ${without.hDone} without inheritance, ${with_.hDone} with it.`);
console.log(`Inversion cost the highest-priority task ${without.hDone - with_.hDone} ticks, spent running M --`);
console.log('a task that holds no resource and has no relationship to H at all. Nothing in');
console.log('the code is wrong: each task obeys its own priority. The system does not.');
```

## When to Use
- When one job's worst-case step is longer than another job's deadline and decomposition cannot separate them
- When adopting a third-party stack that blocks and cannot be restructured into steps
- When assigning priorities, which is a design activity — a priority is a statement about deadlines, not about importance
- When any two tasks share a resource, where the mutex's inheritance setting is a decision that has to be made explicitly
- When a system "occasionally responds late under load" and the late task is high priority — inversion is the first hypothesis

## Common Mistakes
- **Adopting a kernel for tidiness** — it relocates complexity into stack budgets and task interactions rather than removing it
- **Assigning priorities by importance** — priority encodes deadline urgency; the most important job is often not the most urgent one
- **Leaving priority inheritance off on a shared mutex** — the inversion window opens the first time a medium-priority task exists
- **Sizing task stacks by guesswork** — every task pays a stack, and the guess is discovered wrong by a corrupted neighbour (Lesson 548)
- **Busy-waiting inside a task** — a task that spins denies the core to everything below it exactly as a superloop delay does (Lesson 546)
- **Assuming a kernel makes shared state safe** — a preempted read-modify-write tears exactly as it does under an interrupt (Lesson 544)

## Further Reading
- [Zephyr Project: scheduling, priorities and priority inheritance](https://docs.zephyrproject.org/latest/kernel/services/scheduling/index.html) — one kernel's documented rules for preemption and for what a mutex does to a holder's priority
- [What really happened on Mars (Mike Jones' account of the Pathfinder inversion)](https://www.cs.unc.edu/~anderson/teach/comp790/papers/mars_pathfinder_long_version.html) — the diagnosis, the trace that revealed it, and the in-flight fix
- [Lesson 546](/courses/embedded-firmware/never-block-cooperative-state-machines) — the decomposition that lets a superloop meet deadlines without preemption
- [Lesson 548](/courses/embedded-firmware/memory-you-cannot-ask-for) — the per-task stack budget a kernel makes you pay and measure
- [Lesson 544](/courses/embedded-firmware/shared-state-volatile-and-atomicity) — a preempted read-modify-write tears exactly as it does under an interrupt, kernel or not

```recall
- q: "At what point does a superloop stop being sufficient?"
  must:
    - "when one job's worst-case iteration is longer than another job's deadline"
    - "and the job cannot be decomposed into shorter steps"
    - "not when the code becomes complicated -- the trigger is a duration colliding with a deadline"

- q: "Describe priority inversion and its standard mitigation."
  must:
    - "a low-priority task holds a mutex a high-priority task needs, so the high-priority task blocks"
    - "a medium-priority task then preempts the holder, delaying the high-priority task indefinitely"
    - "priority inheritance raises the holder to the waiter's priority until it releases the mutex"

- q: "What does a preemptive kernel cost?"
  must:
    - "RAM: a separate stack per task, sized for its worst case plus interrupt overhead"
    - "context-switch overhead on every preemption"
    - "a new class of bug -- inversion and deadlock -- that non-interleaved jobs cannot have"
```
