import { LOVE_STORY } from "@/lib/content";

export default function LoveStory() {
  return (
    <div
      className="glass-card max-w-3xl mx-auto p-6 sm:p-10 text-center space-y-4"
      data-reveal
    >
      <p className="text-sm sm:text-base md:text-lg leading-relaxed text-cream/90 font-light whitespace-pre-line text-justify sm:text-center">
        {LOVE_STORY.story}
      </p>
    </div>
  );
}
