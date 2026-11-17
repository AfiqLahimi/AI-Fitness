"use client";

import { useSyncExternalStore } from "react";
import type { VideoLibrary } from "./provider";

// One shared, lazily-fetched copy of the runtime video library for the whole page.
let data: VideoLibrary = {};
let loaded = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function refreshVideoLibrary(): Promise<void> {
  inflight = fetch("/api/videos", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : {}))
    .then((j: VideoLibrary) => { data = j; loaded = true; listeners.forEach((l) => l()); })
    .catch(() => { loaded = true; })
    .finally(() => { inflight = null; });
  return inflight;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!loaded && !inflight) refreshVideoLibrary();
  return () => listeners.delete(cb);
}

export function useVideoLibrary(): VideoLibrary {
  return useSyncExternalStore(subscribe, () => data, () => data);
}
