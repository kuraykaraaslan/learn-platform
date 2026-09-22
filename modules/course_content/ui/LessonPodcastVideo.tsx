// The studio-video version of the lesson podcast (scripts/generate-lesson-
// podcast-video.ts), shown after the lesson body. A plain <video> needs no
// client JS, so unlike LessonPodcastPlayer this is a server component;
// preload="none" keeps the ~6 MB file from downloading until it's played.
import { cn } from '@/libs/utils/cn';
import { SECTION_SHELL, SECTION_TITLE } from './LessonSectionCard';

export function LessonPodcastVideo({ videoSrc }: { videoSrc: string }) {
  return (
    <section className={cn(SECTION_SHELL, 'mt-4')}>
      <h2 className={cn(SECTION_TITLE, 'mb-3')}>Watch: Podcast Video</h2>
      <video
        controls
        preload="none"
        poster="/podcasts/studio-bg.webp"
        className="w-full rounded-md bg-black aspect-video"
        src={videoSrc}
      >
        Your browser does not support the video element.
      </video>
    </section>
  );
}
