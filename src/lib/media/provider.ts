/**
 * Exercise media resolution. For each exercise slug the app picks the best source:
 *   1. The runtime video library (data/video-library.json): videos you uploaded on the
 *      Video Library page, AI clips you generated, or clips fetched with `npm run videos`.
 *   2. Built-in entries committed in video-manifest.json (e.g. licensed CDN clips or embeds).
 *   3. A CDN convention: NEXT_PUBLIC_VIDEO_BASE_URL/<slug>.mp4
 *   4. The animated motion guide (always available, drawn in the browser).
 * Adding or replacing a video never needs a code change or a rebuild.
 */
import builtIn from "./video-manifest.json";

export interface VideoSource { src: string; type: string }

export interface VideoEntry {
  kind: "video";
  sources: VideoSource[];
  poster?: string;
  /** Optional second clip demonstrating common mistakes. */
  mistakes?: VideoSource[];
  credit?: string;
  license?: string;
  sourceUrl?: string;
  aiGenerated?: boolean;
  generator?: string; // e.g. "Wan 2.2 (local)", "Kling web app"
  trainer?: string; // fictional trainer id, e.g. "maya"
  updatedAt?: string;
}

export type ManifestEntry = VideoEntry | { kind: "embed"; provider: "youtube" | "vimeo"; id: string; credit?: string; license?: string };
export type VideoLibrary = Record<string, ManifestEntry>;
export type ExerciseMedia = ManifestEntry | { kind: "motion" };

export const BUILT_IN = builtIn as VideoLibrary;

export function resolveMedia(slug: string, library: VideoLibrary = {}): ExerciseMedia {
  const entry = library[slug] ?? BUILT_IN[slug];
  if (entry) return entry;
  const base = process.env.NEXT_PUBLIC_VIDEO_BASE_URL;
  if (base) {
    return {
      kind: "video",
      sources: [
        { src: `${base.replace(/\/$/, "")}/${slug}.webm`, type: "video/webm" },
        { src: `${base.replace(/\/$/, "")}/${slug}.mp4`, type: "video/mp4" },
      ],
    };
  }
  return { kind: "motion" };
}

export function embedUrl(e: Extract<ManifestEntry, { kind: "embed" }>): string {
  return e.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(e.id)}?autoplay=1&mute=1&loop=1&playlist=${encodeURIComponent(e.id)}&controls=0&modestbranding=1&rel=0&playsinline=1`
    : `https://player.vimeo.com/video/${encodeURIComponent(e.id)}?autoplay=1&muted=1&loop=1&background=1`;
}
