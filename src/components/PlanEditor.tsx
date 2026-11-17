"use client";

import { useState, useTransition } from "react";

import { ArrowLeftRight, Clock, Loader2, Moon, Play, Repeat, Timer, Waves } from "lucide-react";
import { TEMPLATES, WEEKDAYS, type PlanDay, type TemplateKey, type WorkoutPlan } from "@/lib/fitness/planner";
import { getExercise, MUSCLE_LABELS } from "@/lib/fitness/exercises";
import { setDayTemplateAction, setItemModeAction, swapExerciseAction } from "@/lib/server/actions";
import { ExerciseMedia } from "./studio/ExerciseMedia";
import { ButtonLink, Pill, cx } from "./ui";

export function PlanEditor({ plan, todayDow, alternatives }: { plan: WorkoutPlan; todayDow: number; alternatives: Record<string, { slug: string; name: string }[]> }) {
  const [sel, setSel] = useState(todayDow);
  const [pending, start] = useTransition();
  const day = plan.days[sel];

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="flex gap-2 overflow-x-auto scrollbar-none lg:flex-col">
        {plan.days.map((d) => (
          <button key={d.dow} onClick={() => setSel(d.dow)}
            className={cx("min-w-36 shrink-0 rounded-2xl border p-4 text-left transition lg:min-w-0", sel === d.dow ? "border-lime/50 bg-lime/[0.06]" : "border-line bg-panel hover:border-line-strong")}>
            <div className="flex items-center justify-between">
              <span className={cx("text-xs font-semibold uppercase tracking-wider", sel === d.dow ? "text-lime" : "text-mute")}>{WEEKDAYS[d.dow]}</span>
              {d.dow === todayDow && <span className="rounded-full bg-lime px-1.5 py-0.5 text-[10px] font-bold text-lime-ink">TODAY</span>}
            </div>
            <p className="mt-1.5 truncate font-semibold">{d.type === "rest" ? "Rest Day" : d.title.split(" —")[0]}</p>
            <p className="mt-0.5 text-xs text-dim">{d.type === "rest" ? "Recover" : `${d.main.length} exercises · ~${d.estMinutes} min`}</p>
          </button>
        ))}
      </div>

      <div className={cx("transition-opacity", pending && "opacity-60")}>
        <div className="card p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-mute">{WEEKDAYS[day.dow]}</p>
              <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">{day.title}</h2>
              {day.type !== "rest" && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-sm text-dim"><Clock className="h-4 w-4" />~{day.estMinutes} min</span>
                  {day.muscles.map((m) => <Pill key={m}>{MUSCLE_LABELS[m]}</Pill>)}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="tpl">Change focus</label>
              <select id="tpl" value={day.type === "rest" ? "rest" : day.type === "active_recovery" ? "active" : day.templateKey ?? ""} disabled={pending}
                onChange={(e) => start(() => setDayTemplateAction(day.dow, e.target.value as TemplateKey | "rest" | "active"))}
                className="h-11 rounded-full border border-line-strong bg-raised px-4 text-sm outline-none">
                <optgroup label="Training">{(Object.keys(TEMPLATES) as TemplateKey[]).map((k) => <option key={k} value={k}>{TEMPLATES[k].title}</option>)}</optgroup>
                <option value="active">Active Recovery</option>
                <option value="rest">Rest Day</option>
              </select>
              {day.type !== "rest" && <ButtonLink href={`/studio/${day.dow}`}><Play className="h-4 w-4 fill-current" /> Start</ButtonLink>}
            </div>
          </div>
          {pending && <p className="mt-3 inline-flex items-center gap-2 text-sm text-dim"><Loader2 className="h-4 w-4 animate-spin" /> Updating…</p>}
        </div>

        {day.type === "rest" ? (
          <div className="card mt-4 flex items-start gap-4 p-6">
            <Moon className="h-6 w-6 shrink-0 text-sky" />
            <div className="text-sm text-dim"><p className="font-semibold text-fg">Rest is part of the plan</p><p className="mt-1">Muscles grow and adapt between sessions. Sleep 7–9 hours, keep protein high and stay lightly active — a walk is perfect.</p></div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {day.warmup.length > 0 && <Group title="Warm-up" icon={<Waves className="h-4 w-4 text-sky" />} items={day.warmup} />}
            <div className="card divide-y divide-line p-0">
              <p className="flex items-center gap-2 px-5 py-4 text-sm font-semibold">Main workout</p>
              {day.main.map((it, i) => {
                const ex = getExercise(it.slug);
                if (!ex) return null;
                const alts = alternatives[it.slug] ?? [];
                return (
                  <div key={i} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center md:p-5">
                    <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-ink sm:w-32"><ExerciseMedia exercise={ex} compact showBadge={false} playing={false} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{ex.name}</p>
                      <p className="text-sm text-dim">{ex.primary.map((m) => MUSCLE_LABELS[m]).join(" · ")}</p>
                      <p className="mt-1 text-sm tabular text-mute">{it.sets} sets × {it.mode === "time" ? `${it.seconds}s` : `${it.reps} reps`} · rest {it.restSec}s</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex rounded-full border border-line bg-ink p-0.5">
                        {(["reps", "time"] as const).map((m) => (
                          <button key={m} disabled={pending} onClick={() => start(() => setItemModeAction(day.dow, i, m))} aria-pressed={it.mode === m}
                            className={cx("inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium", it.mode === m ? "bg-raised text-fg" : "text-mute")}>
                            {m === "reps" ? <Repeat className="h-3 w-3" /> : <Timer className="h-3 w-3" />}{m === "reps" ? "Reps" : "Timer"}
                          </button>
                        ))}
                      </div>
                      {alts.length > 0 && (
                        <label className="relative inline-flex items-center">
                          <ArrowLeftRight className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-mute" />
                          <select aria-label={`Swap ${ex.name}`} value="" disabled={pending} onChange={(e) => e.target.value && start(() => swapExerciseAction(day.dow, i, e.target.value))}
                            className="h-9 rounded-full border border-line bg-ink pl-8 pr-3 text-xs text-dim outline-none">
                            <option value="">Swap</option>
                            {alts.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {day.cooldown.length > 0 && <Group title="Cool-down" icon={<Waves className="h-4 w-4 text-violet" />} items={day.cooldown} />}
          </div>
        )}
      </div>
    </div>
  );
}

function Group({ title, icon, items }: { title: string; icon: React.ReactNode; items: PlanDay["warmup"] }) {
  return (
    <div className="card p-5">
      <p className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((it, i) => <Pill key={i}>{getExercise(it.slug)?.name} · {it.seconds}s</Pill>)}
      </div>
    </div>
  );
}

