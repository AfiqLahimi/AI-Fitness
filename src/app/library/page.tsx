import type { Metadata } from "next";
import { EXERCISES } from "@/lib/fitness/exercises";
import { LibraryGrid } from "@/components/LibraryGrid";
import { Logo, ButtonLink } from "@/components/ui";
import Link from "next/link";

export const metadata: Metadata = { title: "Exercise Library" };

export default function LibraryPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
      <header className="flex items-center justify-between py-6">
        <Link href="/"><Logo /></Link>
        <ButtonLink href="/signup" size="sm">Get your plan</ButtonLink>
      </header>
      <div className="mb-8 mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Exercise library</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">{EXERCISES.length} coached movements</h1>
        <p className="mt-3 max-w-2xl text-dim">Every movement comes with a demonstration, target muscles, step-by-step cues and the mistakes to avoid.</p>
      </div>
      <LibraryGrid />
    </main>
  );
}
