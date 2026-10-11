# Missing Topics and Ideas

## Operating systems fundamentals

The course corpus touches operating-system concepts in several specialized contexts, but it does not appear to have a cohesive introduction to general-purpose OS fundamentals. This is a candidate gap, not a recommendation to add a broad course without first deciding which concepts fit the platform's 145-concept scope.

### Existing coverage

- **Process and thread models — partial.** [Concurrency & Async Fundamentals](content/courses/algorithms-concurrency/129_concurrency_async_fundamentals.md) explains JavaScript's single-threaded event loop, interleaving across `await`, and Node's `worker_threads`. [Electron: Process Model](content/courses/framework-deep-dives/421_electron_process_model_and_typed_ipc.md) covers Electron's process boundaries. [When the Superloop Stops Paying](content/courses/embedded-firmware/547_when_the_superloop_stops_paying.md) covers RTOS tasks, priorities, preemption, and priority inversion. These are runtime- and domain-specific treatments rather than a general OS process/thread model.
- **Memory — partial.** [Browser Internals](content/courses/advanced-deep-dive-topics/103_browser_internals.md) discusses V8 and browser memory behavior. Firmware lessons cover stack, heap, static allocation, and per-task memory budgets. General virtual memory, paging, address spaces, and page faults are not clearly covered.
- **Kernel and scheduling — partial.** Firmware content explains a preemptive kernel and task scheduling, but general-purpose OS scheduling and context switching are not clearly covered.
- **File systems and system calls — practical mentions only.** File access appears in Electron, React Native, deployment, and security contexts. No lesson was found explaining file descriptors, system calls, or how an OS manages files.
- **I/O — distributed across topics.** Async I/O and event-loop behavior appear in backend, telemetry, and edge lessons. A general treatment of blocking/non-blocking I/O and the OS I/O model is not apparent.

### Candidate concepts to consider

If this gap is in scope, consider a focused set of concepts rather than a broad survey course:

1. Process vs. thread, address-space isolation, and context switching.
2. Virtual memory, pages, page faults, and memory-mapped files.
3. System calls, user/kernel boundary, and file descriptors.
4. File-system basics: paths, metadata, permissions, and durability.
5. Blocking vs. non-blocking I/O and how runtimes build async I/O on OS primitives.
6. Scheduling, synchronization, and deadlocks as they apply to general-purpose operating systems.

This is based on a search of lesson titles and Markdown content for the concepts above. Some may be mentioned briefly without constituting a dedicated explanation; confirm the intended concept inventory before treating them as definite omissions.
