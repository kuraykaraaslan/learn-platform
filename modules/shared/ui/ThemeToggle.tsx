// Adapted from kui-react/modules/app/ThemeSwitcher.tsx (v1.0.1, copied 2026-08-26,
// see modules/shared/ui/kui/PROVENANCE.md) — kui-react's own ThemeSwitcher manages
// theme state by hand (localStorage + classList.toggle), but Code_Structure_Rules_Next
// / UI_Interface_Rules_Next explicitly mandate the `next-themes` package. This is a
// simplified 2-state (light/dark) button wired to next-themes' useTheme() instead of
// kui-react's 3-state light/dark/system dropdown, to avoid pulling in Button+DropdownMenu
// just for this. Swap in the full dropdown later if "system" needs to be user-selectable.
'use client';

import { useTheme } from 'next-themes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/libs/utils/cn';
import { useMounted } from '@/modules/shared/useMounted';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // next-themes only knows the resolved theme in the browser, so the first
  // render has to match the server's guess and correct itself after hydration.
  const mounted = useMounted();

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex items-center justify-center w-9 h-9 rounded-md text-text-secondary',
        'hover:text-text-primary hover:bg-surface-overlay transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
        className
      )}
    >
      <span suppressHydrationWarning>
        <FontAwesomeIcon icon={mounted && isDark ? faSun : faMoon} className="w-4 h-4" aria-hidden="true" />
      </span>
    </button>
  );
}
