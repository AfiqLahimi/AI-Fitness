"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { Exercise } from "@/lib/fitness/exercises";
import { embedUrl, resolveMedia } from "@/lib/media/provider";
import { useVideoLibrary } from "@/lib/media/useVideoLibrary";
import { MotionGuide } from "./MotionGuide";

export function ExerciseMedia({
  exercise, playing = true, compact = false, showBadge = true, variant = "demo", controls = false,
}: { exercise: Exercise; playing?: boolean; compact?: boolean; showBadge?: boolean; variant?: "demo" | "mistakes"; controls?: boolean }) {
  const library = useVideoLibrary();
  const resolved = resolveMedia(exercise.slug, library);
  // The "mistakes" variant only exists as a separately uploaded clip.
  const media = variant === "mistakes"
    ? (resolved.kind === "video" && resolved.mistakes?.length ? { ...resolved, sources: resolved.mistakes, poster: undefined } : { kind: "motion" as const })
    : resolved.kind === "video" && !resolved.sources.length ? { kind: "motion" as const } : resolved;
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  const srcKey = media.kind === "video" ? media.sources.map((x) => x.src).join() : media.kind;
  useEffect(() => setFailed(false), [exercise.slug, srcKey]);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing, exercise.slug, srcKey]);

  if (media.kind === "video" && !failed) {
    return (
      <div className="relative h-full w-full">
        <video
          key={srcKey}
          ref={video}
          className={controls ? "h-full w-full bg-black object-contain" : "h-full w-full object-cover"}
          autoPlay muted loop playsInline preload="auto" controls={controls}
          poster={media.poster}
          onError={() => setFailed(true)}
          aria-label={`${exercise.name} demonstration video`}
        >
          {media.sources.map((s) => <source key={s.src} src={s.src} type={s.type} onError={(e) => { if (e.currentTarget === e.currentTarget.parentElement?.lastElementChild) setFailed(true); }} />)}
        </video>
        {showBadge && (media.credit || media.aiGenerated) && (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-dim backdrop-blur">
            {media.aiGenerated ? "AI-generated demo" : "Video"}{media.credit ? ` · ${media.credit}` : ""}
          </span>
        )}
      </div>
    );
  }

  if (media.kind === "embed" && !failed) {
    return (
      <iframe
        className="h-full w-full"
        src={embedUrl(media)}
        title={`${exercise.name} demonstration`}
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <MotionGuide exercise={exercise} playing={playing} compact={compact} />
      {showBadge && (
        <span className="absolute bottom-3 right-3 hidden items-center gap-1.5 sm:inline-flex rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] text-dim backdrop-blur">
          <Sparkles className="h-3 w-3 text-lime" /> Animated motion guide · working muscles highlighted
        </span>
      )}
    </div>
  );
}
