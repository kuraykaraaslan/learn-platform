// Always present on a `run`-marked code block — CodeRunner.tsx (the actual
// sandbox: transpile + iframe + worker) is not imported until the reader
// clicks Run, via next/dynamic({ssr:false}) below. Before that click, this
// component itself is the only runner-related JS a page ships.
'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import { useProgressStore, editorKey } from '@/modules/progress/progress.store';
import type { LessonBlock } from '../course_content.blocks';
import { WidgetShell } from './WidgetShell';
import { BTN_PRIMARY, FIELD_CODE } from './widget-ui';

const CodeRunner = dynamic(() => import('./CodeRunner').then((m) => m.CodeRunner), { ssr: false });

export function RunMount({
  block,
  courseSlug,
  lessonFile,
}: {
  block: Extract<LessonBlock, { kind: 'code' }>;
  courseSlug: string;
  lessonFile: string;
}) {
  // Editable textarea instead of the highlighted <pre> + textarea overlay the
  // phase spec sketches: correct and testable, at the cost of live
  // re-highlighting while typing — a deliberate scope cut given the size of
  // the rest of this phase (sandbox, watchdog, transpile, persistence all
  // had to be right first).
  const [hasRun, setHasRun] = useState(false);
  const [runCount, setRunCount] = useState(0);

  const key = editorKey(courseSlug, lessonFile, block.id);
  const savedSource = useProgressStore((s) => s.editors[key]);
  const setEditorValue = useProgressStore((s) => s.setEditorValue);
  // Restoring this on load never runs it — Run is always an explicit click,
  // never a side effect of mounting or of loading a saved buffer.
  const source = savedSource ?? block.source;

  return (
    <WidgetShell kind="run" status="sandboxed">
      <textarea
        value={source}
        onChange={(e) => setEditorValue(key, e.target.value)}
        spellCheck={false}
        rows={Math.min(20, Math.max(3, source.split('\n').length))}
        className={FIELD_CODE}
      />
      <button
        type="button"
        onClick={() => {
          setHasRun(true);
          setRunCount((c) => c + 1);
        }}
        className={cn(BTN_PRIMARY, 'mt-2')}
      >
        Run
      </button>
      {/* key={runCount} remounts on every click — a fresh sandbox and a
          fresh watchdog per run, using whatever the textarea holds right now. */}
      {hasRun && <CodeRunner key={runCount} source={source} lang={block.lang} />}
    </WidgetShell>
  );
}
