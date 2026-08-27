import Link from 'next/link';
import { Badge } from '@kui/ui/Badge';
import { BRACKET_LABELS, type Lesson } from '../course_content.types';
import { LessonSectionCard } from './LessonSectionCard';

export function LessonPage({ lesson, courseTitle }: { lesson: Lesson; courseTitle: string }) {
  return (
    <div className="max-w-3xl mx-auto">
      <nav className="text-xs text-text-secondary mb-4 flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link href={`/courses/${lesson.courseSlug}`} className="hover:text-text-primary">
          {courseTitle}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{BRACKET_LABELS[lesson.bracket]}</span>
      </nav>

      <h1 className="text-2xl font-semibold text-text-primary mb-2">{lesson.title}</h1>
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="primary" size="sm">
          {BRACKET_LABELS[lesson.bracket]}
        </Badge>
        <Badge variant="neutral" size="sm">
          {lesson.category}
        </Badge>
      </div>

      <div className="space-y-4">
        <LessonSectionCard title="What It Is" html={lesson.sections.whatItIs} />
        <LessonSectionCard title="Key Concepts" html={lesson.sections.keyConcepts} />
        <LessonSectionCard title="Example Code" html={lesson.sections.exampleCode} />
        <LessonSectionCard title="When to Use" html={lesson.sections.whenToUse} />
        <LessonSectionCard title="Common Mistakes" html={lesson.sections.commonMistakes} />
        <LessonSectionCard title="Further Reading" html={lesson.sections.furtherReading} />
      </div>
    </div>
  );
}
