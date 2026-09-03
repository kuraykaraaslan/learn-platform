import { cn } from '@/libs/utils/cn';
import type { LessonBlock } from '../course_content.blocks';
import { CopyButton } from './CopyButton';
import { WidgetShell } from './WidgetShell';
import { MD_CLASSES } from './prose';

export function CodeBlock({
  block,
  className,
}: {
  block: Extract<LessonBlock, { kind: 'code' }>;
  className?: string;
}) {
  return (
    // The fence language as the header label, and the copy button moved out
    // of `absolute top-2 right-2 opacity-0 group-hover:opacity-100` into the
    // strip: hover-only reveal is undiscoverable and unreachable on touch.
    <WidgetShell
      kind="code"
      label={block.lang}
      actions={<CopyButton source={block.source} />}
      bodyClassName="p-0"
      className={className}
    >
      <div
        // The shell body already supplies the surface and the radius, so the
        // <pre> drops its own; twMerge resolves each against MD_CLASSES.
        className={cn(MD_CLASSES, '[&_pre]:mb-0 [&_pre]:p-3 [&_pre]:rounded-none [&_pre]:bg-transparent')}
        // eslint-disable-next-line react/no-danger -- block.html is our own build-time markdown pipeline output, not user input
        dangerouslySetInnerHTML={{ __html: block.html }}
      />
    </WidgetShell>
  );
}
