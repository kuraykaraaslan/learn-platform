'use client';

import { useProgressStore, widgetFieldKey } from '@/modules/progress/progress.store';
import type { ChecklistWidget } from '../../course_content.templates';

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

  return (
    <ul className="space-y-1.5 rounded-lg border border-border bg-surface-sunken p-4 text-sm">
      {widget.items.map((item) => {
        const key = widgetFieldKey(courseSlug, lessonFile, blockId, item.id);
        return (
          <li key={item.id}>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={checked[key] ?? item.checked}
                onChange={(e) => setChecklistChecked(key, e.target.checked)}
              />
              <span className={checked[key] ?? item.checked ? 'text-text-secondary line-through' : 'text-text-primary'}>
                {item.label}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
