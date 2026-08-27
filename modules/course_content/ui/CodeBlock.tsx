import { cn } from '@/libs/utils/cn';
import type { LessonBlock } from '../course_content.blocks';
import { CopyButton } from './CopyButton';

export function CodeBlock({
  block,
  className,
}: {
  block: Extract<LessonBlock, { kind: 'code' }>;
  className?: string;
}) {
  return (
    <div className={cn('relative group', className)}>
      {/* eslint-disable-next-line react/no-danger -- block.html is our own build-time markdown pipeline output, not user input */}
      <div dangerouslySetInnerHTML={{ __html: block.html }} />
      <CopyButton
        source={block.source}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      />
    </div>
  );
}
