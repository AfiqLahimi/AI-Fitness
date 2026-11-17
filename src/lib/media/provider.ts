/**
 * Exercise media resolution. The studio asks for media by exercise slug and
 * gets back the best available source, in priority order:
 *   1. An explicit entry in video-manifest.json (licensed library / AI-generated clip / embed)
 *   2. A CDN convention: NEXT_PUBLIC_VIDEO_BASE_URL/<slug>.mp4 (and optional .webm)
 *   3. The procedural animated motion guide (always available, rendered in-browser)
 * Swapping or upgrading videos never requires code changes — update the manifest or CDN.
 */
import manifest from "./video-manifest.json";

export type ManifestEntry =
  | { kind: "video"; sources: { src: string; type: string }[]; poster?: string; credit?: string; license?: string; aiGenerated?: boolean }
  | { kind: "embed"; provider: "youtube" | "vimeo"; id: string; credit?: string; license?: string };

export type ExerciseMedia = ManifestEntry | { kind: "motion" };

const MANIFEST = manifest as Record<string, ManifestEntry>;

export function resolveMedia(slug: string): ExerciseMedia {
  const entry = MANIFEST[slug];
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
