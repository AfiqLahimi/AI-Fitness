"use client";

import { useEffect, useState } from "react";
import { VideoOff } from "lucide-react";
import type { Exercise } from "@/lib/fitness/exercises";
import { embedUrl, resolveMedia } from "@/lib/media/provider";
import { useVideoLibrary } from "@/lib/media/useVideoLibrary";
import { targetsFor } from "@/lib/anatomy/muscles";
import { AnatomyViewerLazy } from "../anatomy/AnatomyViewerLazy";
import { VideoPlayer } from "./VideoPlayer";

/**
 * Shows an exercise's demonstration video when one exists in the video library.
 * When there is no video, it NEVER fakes one: large views show the real 3D anatomy
 * model with the target muscles highlighted, small cards show a rendered still of that
 * model, and both say clearly that no video has been added yet.
 */
export function ExerciseMedia({
  exercise, playing = true, compact = false, showBadge = true, variant = "demo", controls = false,
}: { exercise: Exercise; playing?: boolean; compact?: boolean; showBadge?: boolean; variant?: "demo" | "mistakes"; controls?: boolean }) {
  const library = useVideoLibrary();
  const resolved = resolveMedia(exercise.slug, library);
  const media = variant === "mistakes"
    ? (resolved.kind === "video" && resolved.mistakes?.length ? { ...resolved, sources: resolved.mistakes, poster: undefined } : { kind: "none" as const })
    : resolved.kind === "video" && !resolved.sources.length ? { kind: "none" as const }
    : resolved;
  const srcKey = media.kind === "video" ? media.sources.map((x) => x.src).join() : media.kind;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [exercise.slug, srcKey]);

  if (media.kind === "video" && !failed) {
    const credit = showBadge ? [media.aiGenerated ? "AI-generated demo" : null, media.credit].filter(Boolean).join(" · ") || undefined : undefined;
    return (
      <VideoPlayer
        sources={media.sources} poster={media.poster} playing={playing} label={`${exercise.name} demonstration video`}
        credit={credit} minimal={compact || !controls} onError={() => setFailed(true)}
      />
    );
  }

  if (media.kind === "embed" && !failed) {
    return (
      <iframe className="h-full w-full" src={embedUrl(media)} title={`${exercise.name} demonstration`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" loading="lazy" />
    );
  }

  // No video available.
  if (compact) {
    return (
      <div className="relative h-full w-full bg-[#0b0b0d]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/anatomy-thumbs/${exercise.slug}.jpg`} alt={`Muscles worked in ${exercise.name}`} className="h-full w-full object-cover" loading="lazy" />
        {showBadge && <NoVideoBadge small />}
      </div>
    );
  }
  return (
    <div className="relative h-full w-full">
      <AnatomyViewerLazy targets={targetsFor(exercise.slug)} className="h-full w-full rounded-none border-0" compact />
      {showBadge && <NoVideoBadge mistakes={variant === "mistakes"} />}
    </div>
  );
}

function NoVideoBadge({ small = false, mistakes = false }: { small?: boolean; mistakes?: boolean }) {
  return (
    <span className={small
      ? "absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] text-white/75 backdrop-blur"
      : "pointer-events-none absolute left-1/2 top-14 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-amber/30 bg-black/70 px-3 py-1.5 text-xs text-amber backdrop-blur"}>
      <VideoOff className={small ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {small ? "No video yet" : mistakes ? "No mistakes video yet — showing muscles worked" : "No demonstration video yet — showing muscles worked"}
    </span>
  );
}
