// One <audio> element plus a collapsible transcript. Renders only when
// CourseContentService.getLessonPodcast found a generated episode for this
// lesson (scripts/generate-lesson-podcast.ts) — most lessons have none, so
// this component never mounts (and ships no client bytes) on those pages,
// same reasoning as CopyButton's own "zero client JS by default" note.
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import type { PodcastTurn } from '../course_content.types';
import { SECTION_SHELL, SECTION_TITLE } from './LessonSectionCard';

const SPEAKER_LABEL: Record<PodcastTurn['speaker'], string> = {
  host_a: 'Host A',
  host_b: 'Host B',
};

export function LessonPodcastPlayer({ audioSrc, turns }: { audioSrc: string; turns: PodcastTurn[] }) {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <section className={cn(SECTION_SHELL, 'mb-4')}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className={SECTION_TITLE}>Listen: Podcast</h2>
        {turns.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            className="text-xs text-text-secondary hover:text-text-primary underline underline-offset-2"
            aria-expanded={showTranscript}
          >
            {showTranscript ? 'Hide transcript' : 'Show transcript'}
          </button>
        )}
      </div>

      <audio controls preload="none" className="w-full" src={audioSrc}>
        Your browser does not support the audio element.
      </audio>

      {showTranscript && (
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-text-primary">
          {turns.map((turn, i) => (
            <p key={i}>
              <span className="font-semibold text-text-secondary">{SPEAKER_LABEL[turn.speaker]}: </span>
              {turn.text}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
