"use client";
import { targetsFor } from "@/lib/anatomy/muscles";
import { AnatomyViewer } from "./AnatomyViewer";

export function AnatomyRender({ slug, view, focus }: { slug: string; view?: "front" | "back"; focus?: boolean }) {
  return (
    <main className="h-dvh w-dvw bg-[#0b0b0d]">
      <AnatomyViewer targets={targetsFor(slug)} bare interactive={false} initialView={view} autoFocus={focus} className="h-full w-full rounded-none border-0" />
    </main>
  );
}
