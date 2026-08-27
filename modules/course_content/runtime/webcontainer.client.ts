// The only module in this codebase that imports @webcontainer/api, and only
// ever inside runProject() below — never at top level — so a page with no
// `run project` block ships none of it. Everything here runs client-side
// only; there is no server counterpart.
//
// Auth: the API key StackBlitz issues for this project is a `clientId` for
// their OAuth 2.0 + PKCE flow (auth.init/startAuthFlow/loggedIn), not a
// configureAPIKey() value — confirmed against the real SDK types and the
// example StackBlitz's own dashboard shows for this exact key, after the
// first version of this file (which used configureAPIKey and got rejected
// with "not available for use from this referrer") was tried against a real
// browser. Every reader needs their own StackBlitz account and sees a real
// consent popup before Run Project does anything — that UX cost is a
// deliberate, discussed decision, not an oversight.
//
// UNTESTED beyond TypeScript compiling cleanly against the real SDK's types.
// WebContainer needs SharedArrayBuffer under real cross-origin isolation plus
// a Service Worker, none of which exist in Node or in any tool available in
// this session.
import type { WebContainer, WebContainerProcess, AuthAPI } from '@webcontainer/api';
import { buildProjectMount, defaultRunCommand } from '../course_content.mount';

const OAUTH_SCOPE = '';

let authInitResult: ReturnType<AuthAPI['init']> | null = null;
let containerPromise: Promise<WebContainer> | null = null;

/** Resolves once the reader has an authorized StackBlitz session — a popup
 *  consent flow the first time, instant on every later call in the same
 *  session. auth.loggedIn() by itself never rejects even if the reader
 *  declines (per the SDK's own docs), so a decline is caught via the
 *  'auth-failed' event instead, raced against it. */
async function waitForLogin(auth: AuthAPI): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.on('auth-failed', (reason) => {
      unsubscribe();
      reject(new Error(`WebContainer authorization declined: ${reason.description || reason.error}`));
    });
    auth.loggedIn().then(() => {
      unsubscribe();
      resolve();
    });
  });
}

async function ensureAuthenticated(onEvent: (event: RunProjectEvent) => void): Promise<void> {
  const { auth } = await import('@webcontainer/api');
  const clientId = process.env.NEXT_PUBLIC_WEBCONTAINER_API_KEY;
  if (!clientId) throw new Error('NEXT_PUBLIC_WEBCONTAINER_API_KEY is not set.');

  // auth.init() must run exactly once per page per the SDK's own docs.
  if (!authInitResult) authInitResult = auth.init({ clientId, scope: OAUTH_SCOPE });

  if (authInitResult.status === 'auth-failed') {
    throw new Error(`WebContainer authorization failed: ${authInitResult.description || authInitResult.error}`);
  }
  if (authInitResult.status === 'authorized') return;

  onEvent({ type: 'status', text: 'Sign in to StackBlitz to run this project…' });
  auth.startAuthFlow({ popup: true });
  await waitForLogin(auth);
}

/** One instance per browser tab, shared across every `run project` block on
 *  the page — WebContainer.boot() only allows a single instance at a time. */
function getContainer(): Promise<WebContainer> {
  if (!containerPromise) {
    containerPromise = (async () => {
      const { WebContainer } = await import('@webcontainer/api');
      return WebContainer.boot();
    })();
  }
  return containerPromise;
}

export type RunProjectEvent =
  | { type: 'status'; text: string }
  | { type: 'output'; text: string }
  | { type: 'server-ready'; url: string }
  | { type: 'error'; message: string }
  | { type: 'exit'; code: number };

export type RunProjectHandle = { cancel: () => void };

/**
 * Authenticates (first call only — a popup consent flow), mounts a `run
 * project` fence, runs `npm install`, then spawns `cmd` (or a language-
 * appropriate default) — streaming every event back through `onEvent` rather
 * than returning a promise, since output arrives incrementally over what the
 * spec measures as 10-30 seconds, well before that.
 */
export function runProject(
  code: string,
  entry: string | undefined,
  cmd: string | undefined,
  onEvent: (event: RunProjectEvent) => void
): RunProjectHandle {
  let cancelled = false;
  let currentProcess: WebContainerProcess | null = null;

  function streamOutput(process: WebContainerProcess) {
    process.output.pipeTo(
      new WritableStream<string>({
        write(chunk) {
          if (!cancelled) onEvent({ type: 'output', text: chunk });
        },
      })
    );
  }

  (async () => {
    try {
      await ensureAuthenticated(onEvent);
      if (cancelled) return;

      onEvent({ type: 'status', text: 'Booting…' });
      const container = await getContainer();
      if (cancelled) return;

      onEvent({ type: 'status', text: 'Mounting files…' });
      const { tree, entry: resolvedEntry } = buildProjectMount(code, entry);
      await container.mount(tree);
      if (cancelled) return;

      onEvent({ type: 'status', text: 'npm install…' });
      const install = await container.spawn('npm', ['install']);
      currentProcess = install;
      streamOutput(install);
      const installExitCode = await install.exit;
      if (cancelled) return;
      if (installExitCode !== 0) {
        onEvent({ type: 'error', message: `npm install exited with code ${installExitCode}` });
        return;
      }

      const unsubscribe = container.on('server-ready', (_port, url) => {
        if (!cancelled) onEvent({ type: 'server-ready', url });
      });

      const [command, ...args] = (cmd ?? defaultRunCommand(resolvedEntry)).split(' ');
      onEvent({ type: 'status', text: `Running: ${command} ${args.join(' ')}` });
      const run = await container.spawn(command, args);
      currentProcess = run;
      streamOutput(run);
      const runExitCode = await run.exit;
      unsubscribe();
      if (!cancelled) onEvent({ type: 'exit', code: runExitCode });
    } catch (error) {
      if (!cancelled) onEvent({ type: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  })();

  return {
    cancel: () => {
      cancelled = true;
      currentProcess?.kill();
    },
  };
}
