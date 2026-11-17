"use client";

import { useMemo, useState } from "react";
import { EXERCISES, MUSCLE_LABELS, type Exercise } from "@/lib/fitness/exercises";
import { EQUIPMENT_LABELS } from "@/lib/fitness/types";
import { ExerciseMedia } from "./studio/ExerciseMedia";
import { Pill, cx } from "./ui";
import { X } from "lucide-react";

const FILTERS = ["all", "strength", "core", "cardio", "warmup", "cooldown"] as const;

export function LibraryGrid() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Exercise | null>(null);
  const list = useMemo(
    () => EXERCISES.filter((e) => (filter === "all" || e.category === filter) && (!q || (e.name + e.primary.join(" ")).toLowerCase().includes(q.toLowerCase()))),
    [filter, q],
  );
  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cx("rounded-full px-4 py-2 text-sm capitalize transition", filter === f ? "bg-lime text-lime-ink font-semibold" : "bg-white/5 text-dim hover:text-fg")}>
              {f === "warmup" ? "Warm-up" : f}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises or muscles" className="h-11 w-full rounded-full border border-line bg-panel px-5 text-sm outline-none placeholder:text-mute focus:border-lime/50 md:w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((e) => (
          <button key={e.slug} onClick={() => setOpen(e)} className="card group overflow-hidden p-0 text-left transition hover:border-line-strong">
            <div className="aspect-[4/3] bg-ink"><ExerciseMedia exercise={e} compact showBadge={false} /></div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{e.name}</h3>
                <Pill tone={e.difficulty === "beginner" ? "lime" : e.difficulty === "intermediate" ? "amber" : "coral"} className="capitalize">{e.difficulty}</Pill>
              </div>
              <p className="mt-1 text-sm text-mute">{e.primary.map((m) => MUSCLE_LABELS[m]).join(" · ")}</p>
            </div>
          </button>
        ))}
      </div>
      {open && <ExerciseSheet exercise={open} onClose={() => setOpen(null)} />}
    </>
  );
}

export function ExerciseSheet({ exercise: e, onClose }: { exercise: Exercise; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center" onClick={onClose} role="dialog" aria-modal aria-label={e.name}>
      <div className="card max-h-[92dvh] w-full max-w-4xl overflow-y-auto p-0 md:rounded-[1.5rem]" onClick={(ev) => ev.stopPropagation()}>
        <div className="relative aspect-video bg-ink">
          <ExerciseMedia exercise={e} />
          <button onClick={onClose} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-fg backdrop-blur" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="font-display text-2xl font-bold">{e.name}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {e.primary.map((m) => <Pill key={m} tone="lime">{MUSCLE_LABELS[m]}</Pill>)}
              {e.secondary.map((m) => <Pill key={m}>{MUSCLE_LABELS[m]}</Pill>)}
            </div>
            <ol className="mt-5 space-y-3">
              {e.instructions.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-dim"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 text-xs font-semibold text-fg">{i + 1}</span>{s}</li>
              ))}
            </ol>
          </div>
          <div className="space-y-5">
            <div><h3 className="mb-2 text-sm font-semibold text-lime">Correct posture</h3><ul className="space-y-1.5 text-sm text-dim">{e.posture.map((p) => <li key={p}>✓ {p}</li>)}</ul></div>
            <div><h3 className="mb-2 text-sm font-semibold text-coral">Common mistakes</h3><ul className="space-y-1.5 text-sm text-dim">{e.mistakes.map((p) => <li key={p}>✕ {p}</li>)}</ul></div>
            <p className="text-xs text-mute">Equipment: {e.equipment.map((q) => EQUIPMENT_LABELS[q]).join(" or ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
