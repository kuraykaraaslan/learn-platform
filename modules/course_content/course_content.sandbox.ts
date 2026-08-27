// The opaque-origin iframe + inner Worker sandbox docs/phases/08-live-js-runner.md
// specifies. Two layers, and the origin argument is the whole reason for
// both:
//
//   1. `<iframe srcdoc sandbox="allow-scripts">` (NO allow-same-origin) gets
//      an opaque origin: no document.cookie, no localStorage, no indexedDB,
//      no caches, and a same-origin fetch is cross-origin from its point of
//      view. A Web Worker, by contrast, runs on the PAGE's own origin and
//      could fetch('/api/...') with real credentials — not a theoretical
//      risk, since the reader can edit the code that runs here.
//   2. A `<meta http-equiv="Content-Security-Policy" content="default-src
//      'none'">` inside the srcdoc closes the one channel an opaque origin
//      still has (outbound network to anywhere, cross-origin or not). The
//      iframe `csp=` attribute only works in Chromium; the meta tag doesn't
//      care which engine is running it.
//
// The inner Worker itself exists because Safari doesn't guarantee event-loop
// isolation between same-process frames — an `while(true){}` in the iframe's
// own script could still stall the parent tab. A Worker can be `.terminate()`d
// instantly from outside; a frame's own script cannot be interrupted from
// within itself.
//
// Everything below builds plain JS *source text* — for the worker and for the
// srcdoc's own inline script — because both run in a context with no module
// loader at all (blob: URL, opaque origin, `script-src 'unsafe-inline'` only).

const MAX_DEPTH = 4;
const MAX_ENTRIES = 200;

/**
 * console.log argument serializer. Bounded on every axis a snippet could
 * abuse to hang the render: recursion depth, entry count per object/array,
 * and cycles. `onPath` tracks only the ancestors currently being serialized
 * (added before recursing into children, removed on the way back out) —
 * NOT every object ever seen, which would misreport the same object
 * appearing twice as SIBLINGS (a real, common, non-cyclic shape) as a cycle.
 * Written as a normal, independently testable function and re-embedded into
 * the worker verbatim via `.toString()` in buildWorkerSource() below — there
 * is no bundler-aware module loader inside a blob: worker to import this
 * from.
 */
export function serializeForSandbox(value: unknown, depth = 0, onPath?: Set<object>): string {
  const path = onPath ?? new Set<object>();

  if (depth > MAX_DEPTH) return '…';
  if (value instanceof Error) return value.stack || value.message || String(value);
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
  if (typeof value !== 'object') return typeof value === 'string' ? value : String(value);

  if (path.has(value)) return '[Circular]';
  path.add(value);

  let result: string;
  if (Array.isArray(value)) {
    const shown = value.slice(0, MAX_ENTRIES).map((v) => serializeForSandbox(v, depth + 1, path));
    const rest = value.length > MAX_ENTRIES ? `, …+${value.length - MAX_ENTRIES} more` : '';
    result = `[${shown.join(', ')}${rest}]`;
  } else {
    const entries = Object.entries(value as Record<string, unknown>);
    const shown = entries.slice(0, MAX_ENTRIES).map(([k, v]) => `${k}: ${serializeForSandbox(v, depth + 1, path)}`);
    const rest = entries.length > MAX_ENTRIES ? `, …+${entries.length - MAX_ENTRIES} more` : '';
    result = `{ ${shown.join(', ')}${rest} }`;
  }

  path.delete(value);
  return result;
}

/** Source text for the inner Worker's blob: URL. Receives `{code}`,
 *  evaluates it with a captured `console`, and posts back every log call and
 *  the final outcome. Never touches the DOM or network — it can't; the
 *  parent frame's CSP already forbids that regardless. */
export function buildWorkerSource(): string {
  return `
'use strict';
var serializeForSandbox = ${serializeForSandbox.toString()};

function post(message) {
  self.postMessage(message);
}

function makeConsole() {
  function level(name) {
    return function () {
      var parts = [];
      for (var i = 0; i < arguments.length; i++) parts.push(serializeForSandbox(arguments[i]));
      post({ type: 'log', level: name, parts: parts });
    };
  }
  return { log: level('log'), info: level('log'), warn: level('warn'), error: level('error'), table: level('table') };
}

self.onmessage = function (event) {
  var code = event.data && event.data.code;
  try {
    var run = new Function('console', code);
    run(makeConsole());
    post({ type: 'done' });
  } catch (err) {
    post({ type: 'error', message: err && err.message ? err.message : String(err), stack: (err && err.stack) || '' });
  }
};
`;
}

/**
 * The full srcdoc document. `nonce` is required identity: the frame is
 * opaque-origin, so `event.origin` on any postMessage is the literal string
 * `"null"` and useless for authentication — every message in and out carries
 * `nonce` instead, checked on both sides.
 */
export function buildSandboxHtml(nonce: string): string {
  const workerSource = buildWorkerSource();
  return `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'">
</head>
<body>
<script>
(function () {
  'use strict';
  var NONCE = ${JSON.stringify(nonce)};

  function send(message) {
    var payload = { nonce: NONCE };
    for (var key in message) payload[key] = message[key];
    parent.postMessage(payload, '*');
  }

  var workerBlob = new Blob([${JSON.stringify(workerSource)}], { type: 'text/javascript' });
  var worker = new Worker(URL.createObjectURL(workerBlob));
  worker.onmessage = function (event) { send(event.data); };
  worker.onerror = function (event) {
    send({ type: 'error', message: (event && event.message) || 'Worker error', stack: '' });
  };

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.nonce !== NONCE) return;
    if (event.data.type === 'run') worker.postMessage({ code: event.data.code });
  });

  window.onerror = function (message, source, lineno, colno, error) {
    send({ type: 'error', message: String(message), stack: (error && error.stack) || '' });
  };
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var message = reason && reason.message ? reason.message : String(reason);
    send({ type: 'error', message: message, stack: (reason && reason.stack) || '' });
  });

  send({ type: 'ready' });
})();
</script>
</body>
</html>`;
}
