'use client';
/**
 * Route-aware auto-close hook.
 *
 * TODO M6: Wire up to Next.js `usePathname()` / `useSearchParams()` so
 * overlays with `closeOnRouteChange` opt-in dismiss themselves when the
 * route changes. For M1 this is a no-op stub so the prop is accepted
 * but does nothing — keeps the public API stable across milestones.
 */

type Options = {
  active: boolean;
  closeOnRouteChange?: boolean;
  onClose: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useRouteClose(_opts: Options): void {
  // TODO M6: subscribe to pathname / searchParams and call onClose
  // when they change while `active && closeOnRouteChange`.
}
