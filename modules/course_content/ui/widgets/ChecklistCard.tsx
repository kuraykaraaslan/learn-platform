'use client';

import { useProgressStore, widgetFieldKey } from '@/modules/progress/progress.store';
import { useHydrated } from '@/modules/progress/useHydrated';
import type { ChecklistWidget } from '../../course_content.templates';
import { WidgetShell } from '../WidgetShell';
import { CHECKBOX } from '../widget-ui';

export function ChecklistCard({
  widget,
  blockId,
  courseSlug,
  lessonFile,
}: {
  widget: ChecklistWidget;
  blockId: string;
  courseSlug: string;
  lessonFile: string;
}) {
  const checked = useProgressStore((s) => s.checklistChecked);
  const setChecklistChecked = useProgressStore((s) => s.setChecklistChecked);
  // The store is read during render and persist() hydrates from localStorage
  // synchronously, so without this gate the first client render can disagree
  // with the SSR HTML. Every checked-state read below goes through it.
  const hydrated = useHydrated();

  const isChecked = (key: string, fallback: boolean) => (hydrated ? (checked[key] ?? fallback) : fallback);
  const done = widget.items.filter((item) =>
    isChecked(widgetFieldKey(courseSlug, lessonFile, blockId, item.id), item.checked)
  ).length;

  return (
    <WidgetShell kind="checklist" status={`${done}/${widget.items.length} checked`}>
      {/* A plain <ul> used to BE this component's root, which meant it could
          carry no header — and, while the markdown rules still sat on the
          section container, it also rendered disc bullets beside every
          checkbox. */}
      <ul className="space-y-1.5 text-sm">
        {widget.items.map((item) => {
          const key = widgetFieldKey(courseSlug, lessonFile, blockId, item.id);
          const on = isChecked(key, item.checked);
          return (
            <li key={item.id}>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className={CHECKBOX}
                  checked={on}
                  onChange={(e) => setChecklistChecked(key, e.target.checked)}
                />
                <span className={on ? 'text-text-secondary line-through' : 'text-text-primary'}>{item.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </WidgetShell>
  );
}
