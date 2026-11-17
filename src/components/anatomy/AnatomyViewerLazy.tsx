"use client";
import dynamic from "next/dynamic";

/** Loads three.js only when an anatomy view is actually shown (keeps other pages light). */
export const AnatomyViewerLazy = dynamic(() => import("./AnatomyViewer").then((m) => m.AnatomyViewer), {
  ssr: false,
  loading: () => <div className="grid h-full w-full place-items-center rounded-[1.5rem] border border-line bg-ink text-sm text-dim">Loading 3D anatomy…</div>,
});
