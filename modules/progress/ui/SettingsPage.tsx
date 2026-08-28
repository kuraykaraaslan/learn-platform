// P12 (docs/phases/12): JSON export/import for the entire progress store.
// Load-bearing, not a nice-to-have — this app has no server and no
// account, so a browser data wipe is the only way to lose every self-
// assessment and Return Queue schedule, permanently, with no recovery
// path other than this file.
'use client';

import { useRef, useState } from 'react';
import { exportProgressJson, importProgressJson } from '../progress.store';

export function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function handleExport() {
    const json = exportProgressJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learn-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file: File) {
    file
      .text()
      .then((text) => {
        const result = importProgressJson(text);
        setImportMessage(result.ok ? { ok: true, text: 'Imported. Merged into your current progress.' } : { ok: false, text: result.error });
      })
      .catch(() => setImportMessage({ ok: false, text: 'Could not read that file.' }));
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">Settings</h1>

      <section className="rounded-lg border border-border bg-surface-raised p-5">
        <h2 className="mb-1 text-sm font-semibold text-text-primary uppercase tracking-wide">Progress data</h2>
        <p className="mb-4 text-sm text-text-secondary">
          Every self-assessment, checklist, filled-in template, and Return Queue schedule lives only in this
          browser. Export a backup before clearing site data or switching browsers/devices.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
          >
            Export as JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-text-primary hover:border-primary"
          >
            Import from JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>

        {importMessage && (
          <p className={`mt-3 text-xs ${importMessage.ok ? 'text-success-fg' : 'text-error-fg'}`}>{importMessage.text}</p>
        )}

        <p className="mt-4 text-xs text-text-secondary">
          Importing merges into what&rsquo;s already here — a key from the file overwrites the matching local key,
          but anything you&rsquo;ve done since the export stays.
        </p>
      </section>
    </div>
  );
}
