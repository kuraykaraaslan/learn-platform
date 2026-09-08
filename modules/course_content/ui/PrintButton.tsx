'use client';

// The only client component on the cheat-sheet page, and it exists for one
// call. Everything else about the sheet is server-rendered, because a page
// whose entire job is to be printed has nothing to hydrate.
import { BTN_SECONDARY } from './widget-ui';

export function PrintButton() {
  return (
    <button type="button" className={BTN_SECONDARY} onClick={() => window.print()} data-print="hide">
      Print
    </button>
  );
}
