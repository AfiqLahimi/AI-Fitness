"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Film, Info, Play, Repeat, Target, Timer, X, BookOpen } from "lucide-react";
import type { Exercise } from "@/lib/fitness/exercises";
import type { PlanItem } from "@/lib/fitness/planner";
import { targetsFor } from "@/lib/anatomy/muscles";
import { GUIDES } from "@/lib/anatomy/guides";
import { EQUIPMENT_LABELS } from "@/lib/fitness/types";
import { resolveMedia } from "@/lib/media/provider";
import { useVideoLibrary } from "@/lib/media/useVideoLibrary";
import { AnatomyViewerLazy } from "../anatomy/AnatomyViewerLazy";
import { MuscleTargets } from "../anatomy/MuscleTargets";
import { ExerciseMedia } from "./ExerciseMedia";
import { Button, Pill, cx } from "../ui";

const STEPS = [
  { key: "muscles", label: "Muscles", icon: Target },
  { key: "technique", label: "Technique", icon: BookOpen },
  { key: "video", label: "Watch", icon: Film },
  { key: "start", label: "Start", icon: Play },
] as const;

export function ExerciseIntro({
  exercise: e, item, position, total, defaultMode, onStart, onSkip, showIntros, onToggleIntros,
}: {
  exercise: Exercise; item: PlanItem; position: number; total: number; defaultMode: "reps" | "time";
  onStart: (mode: "reps" | "time") => void; onSkip: () => void; showIntros: boolean; onToggleIntros: (v: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"reps" | "time">(item.reps === 0 ? "time" : defaultMode);
  const [videoTab, setVideoTab] = useState<"demo" | "mistakes">("demo");
  const targets = targetsFor(e.slug);
  const guide = GUIDES[e.slug];
  const library = useVideoLibrary();
  const media = resolveMedia(e.slug, library);
  const hasVideo = media.kind === "embed" || (media.kind === "video" && media.sources.length > 0);
  const hasMistakes = media.kind === "video" && !!media.mistakes?.length;
  const last = step === STEPS.length - 1;

  return (
    <div className="flex flex-1 flex-col px-4 pb-4 md:px-6 lg:pb-6">
      {/* Title + stepper */}
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime">Exercise {position} of {total} · Learn before you lift</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">{e.name}</h1>
        </div>
        <ol className="flex gap-1.5" aria-label="Introduction steps">
          {STEPS.map((s, i) => (
            <li key={s.key}>
              <button onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
                className={cx("flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition md:px-4 md:text-sm",
                  i === step ? "border-lime/60 bg-lime/10 text-lime" : i < step ? "border-line bg-white/5 text-fg" : "border-line text-mute hover:text-fg")}>
                <span className={cx("grid h-5 w-5 place-items-center rounded-full text-[11px]", i < step ? "bg-lime text-lime-ink" : "bg-white/10")}>{i < step ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="h-full">
            {step === 0 && (
              <div className="grid h-full gap-4 lg:grid-cols-[1.35fr_1fr]">
                <AnatomyViewerLazy targets={targets} className="h-[420px] lg:h-full lg:min-h-[540px]" />
                <div className="card p-5 md:p-6">
                  <p className="mb-1 font-display text-xl font-semibold">{targets.stretch ? "What this stretches" : "What this works"}</p>
                  <p className="mb-5 text-sm text-dim">Red muscles do most of the work; orange muscles help. Drag the model to rotate it, use X-ray to see deeper muscles.</p>
                  <MuscleTargets targets={targets} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="card space-y-5 p-5 md:p-6">
                  {guide && (
                    <>
                      <section><p className="text-xs font-semibold uppercase tracking-wider text-mute">What you do</p><p className="mt-1.5 text-lg leading-relaxed">{guide.what}</p></section>
                      <section><p className="text-xs font-semibold uppercase tracking-wider text-mute">Why it helps</p><p className="mt-1.5 leading-relaxed text-dim">{guide.why}</p></section>
                    </>
                  )}
                  <section>
                    <p className="text-xs font-semibold uppercase tracking-wider text-mute">Step by step</p>
                    <ol className="mt-2 space-y-2.5">
                      {e.instructions.map((s, i) => <li key={i} className="flex gap-3 text-sm text-dim"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 text-xs font-semibold text-fg">{i + 1}</span>{s}</li>)}
                    </ol>
                  </section>
                  <div className="flex flex-wrap gap-2">
                    <Pill className="capitalize">{e.difficulty}</Pill>
                    <Pill><Dumbbell className="h-3 w-3" />{e.equipment.map((q) => EQUIPMENT_LABELS[q]).join(" or ")}</Pill>
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="card border-lime/20 p-5 md:p-6">
                    <p className="flex items-center gap-2 font-semibold text-lime"><Check className="h-4 w-4" /> Correct posture</p>
                    <ul className="mt-3 space-y-2.5 text-sm">{e.posture.map((p) => <li key={p} className="flex gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" />{p}</li>)}</ul>
                  </div>
                  <div className="card border-coral/20 p-5 md:p-6">
                    <p className="flex items-center gap-2 font-semibold text-coral"><X className="h-4 w-4" /> Common mistakes</p>
                    <ul className="mt-3 space-y-2.5 text-sm">{e.mistakes.map((p) => <li key={p} className="flex gap-2.5"><X className="mt-0.5 h-4 w-4 shrink-0 text-coral" />{p}</li>)}</ul>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                <div className="space-y-3">
                  {hasMistakes && (
                    <div className="flex gap-1">
                      {(["demo", "mistakes"] as const).map((t) => (
                        <button key={t} onClick={() => setVideoTab(t)} className={cx("rounded-full px-4 py-2 text-sm", videoTab === t ? "bg-white/10 font-semibold text-fg" : "text-mute hover:text-fg")}>{t === "demo" ? "Correct technique" : "Common mistakes"}</button>
                      ))}
                    </div>
                  )}
                  <div className="aspect-video overflow-hidden rounded-[1.5rem] border border-line bg-[radial-gradient(ellipse_at_top,#17191a,#060607)]">
                    <ExerciseMedia exercise={e} variant={videoTab} controls={hasVideo} />
                  </div>
                </div>
                <div className="card space-y-4 p-5">
                  {hasVideo ? (
                    <p className="text-sm text-dim">Watch at least two reps. Notice the <b className="text-fg">starting position</b>, the <b className="text-fg">full range of motion</b> and the <b className="text-fg">tempo</b> — slower on the way down.</p>
                  ) : (
                    <p className="flex gap-2 rounded-xl border border-amber/30 bg-amber/10 p-3 text-sm text-amber">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>No demonstration video has been added for this exercise yet, so you&apos;re seeing the animated motion guide. Add a real or AI-generated video in <b>Video library</b>.</span>
                    </p>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-mute">Watch for</p>
                    <ul className="mt-2 space-y-2 text-sm text-dim">{e.posture.slice(0, 3).map((p) => <li key={p} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" />{p}</li>)}</ul>
                  </div>
                  {!hasMistakes && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-mute">Avoid</p>
                      <ul className="mt-2 space-y-2 text-sm text-dim">{e.mistakes.slice(0, 2).map((p) => <li key={p} className="flex gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-coral" />{p}</li>)}</ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mx-auto max-w-3xl">
                <div className="card p-5 md:p-8">
                  <p className="text-center text-sm text-dim">Your target</p>
                  <p className="mt-1 text-center font-display text-4xl font-bold tabular md:text-5xl">
                    {item.sets} × {mode === "time" ? `${item.seconds}s` : `${item.reps} reps`}
                  </p>
                  <p className="mt-1 text-center text-sm text-mute">Rest {item.restSec}s between sets{e.unilateral ? " · do both sides" : ""}</p>
                  <p className="mt-8 text-sm font-semibold">How do you want to train?</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <ModeCard active={mode === "reps"} disabled={item.reps === 0} onClick={() => setMode("reps")} icon={<Repeat className="h-5 w-5" />} title="Rep mode"
                      body={item.reps === 0 ? "Not available — this movement is done for time." : `Do ${item.reps} reps at your own pace, tap to count, then mark the set complete.`} />
                    <ModeCard active={mode === "time"} onClick={() => setMode("time")} icon={<Timer className="h-5 w-5" />} title="Timer mode"
                      body={`Work for ${item.seconds} seconds per set with a countdown. Pause or reset any time.`} />
                  </div>
                  <Button size="lg" className="mt-8 w-full" onClick={() => onStart(mode)}><Play className="h-5 w-5 fill-current" /> Start {e.name}</Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <div className="flex flex-wrap items-center gap-4 text-sm text-mute">
          <label className="flex items-center gap-2"><input type="checkbox" checked={showIntros} onChange={(ev) => onToggleIntros(ev.target.checked)} className="accent-[#c6ff3d]" /> Show this before every exercise</label>
          <button onClick={onSkip} className="underline-offset-4 hover:text-fg hover:underline">Skip intro</button>
        </div>
        {!last ? <Button onClick={() => setStep((s) => s + 1)}>Next: {STEPS[step + 1].label} <ArrowRight className="h-4 w-4" /></Button> : <span className="hidden w-28 sm:block" />}
      </div>
    </div>
  );
}

function ModeCard({ active, disabled, onClick, icon, title, body }: { active: boolean; disabled?: boolean; onClick: () => void; icon: React.ReactNode; title: string; body: string }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} aria-pressed={active}
      className={cx("rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40", active ? "border-lime/60 bg-lime/[0.07] shadow-[0_0_0_1px_rgba(198,255,61,0.25)]" : "border-line bg-ink hover:border-line-strong")}>
      <p className={cx("flex items-center gap-2 font-semibold", active && "text-lime")}>{icon}{title}</p>
      <p className="mt-1.5 text-sm text-dim">{body}</p>
    </button>
  );
}
