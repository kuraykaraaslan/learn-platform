import Link from 'next/link';
import { Badge } from '@kui/ui/Badge';
import { BRACKET_LABELS, type Lesson } from '../course_content.types';
import { LessonSectionCard } from './LessonSectionCard';
import { FailureDrillCard } from './FailureDrillCard';
import { ConceptTooltipProvider } from './ConceptTooltip';

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

      <ConceptTooltipProvider concepts={lesson.concepts} className="space-y-4">
        <LessonSectionCard title="What It Is" blocks={lesson.blocks.whatItIs} courseSlug={lesson.courseSlug} lessonFile={lesson.file} verified={lesson.verified === true} />
        <LessonSectionCard title="Key Concepts" blocks={lesson.blocks.keyConcepts} courseSlug={lesson.courseSlug} lessonFile={lesson.file} verified={lesson.verified === true} />
        <LessonSectionCard title="Example Code" blocks={lesson.blocks.exampleCode} courseSlug={lesson.courseSlug} lessonFile={lesson.file} verified={lesson.verified === true} />
        <LessonSectionCard title="When to Use" blocks={lesson.blocks.whenToUse} courseSlug={lesson.courseSlug} lessonFile={lesson.file} verified={lesson.verified === true} />
        <FailureDrillCard lesson={lesson} blocks={lesson.blocks.commonMistakes} />
        <LessonSectionCard title="Further Reading" blocks={lesson.blocks.furtherReading} courseSlug={lesson.courseSlug} lessonFile={lesson.file} verified={lesson.verified === true} />
      </ConceptTooltipProvider>
    </div>
  );
}
