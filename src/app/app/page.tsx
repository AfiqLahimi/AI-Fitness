import Link from "next/link";
import { ArrowRight, Clock, Flame, MessageCircle, Moon, Play, Sparkles, Trophy } from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { dateNDaysAgo, getActivePlan, getFoodLogs, getProfile, getSessions, getWeights, today } from "@/lib/server/data";
import { computeTargets } from "@/lib/fitness/calc";
import { WEEKDAYS, mondayIndex } from "@/lib/fitness/planner";
import { getExercise, MUSCLE_LABELS } from "@/lib/fitness/exercises";
import { GOAL_LABELS } from "@/lib/fitness/types";
import { ButtonLink, Card, Eyebrow, Pill, Ring, cx } from "@/components/ui";
import { ExercisePreview } from "@/components/studio/ExercisePreview";
import { WeightQuickLog } from "@/components/WeightQuickLog";

export const metadata = { title: "Today" };

export default async function Today({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const date = today();
  const [profile, active, foods, sessions, weights] = await Promise.all([
    getProfile(user.id), getActivePlan(user.id), getFoodLogs(user.id, date), getSessions(user.id, dateNDaysAgo(6)), getWeights(user.id),
  ]);
  const p = profile!;
  const t = computeTargets(p);
  const dow = mondayIndex(new Date(date + "T12:00:00"));
  const day = active?.plan.days[dow];
  const doneToday = sessions.some((s) => s.date === date);
  const eaten = foods.reduce((a, f) => ({ kcal: a.kcal + f.kcal, p: a.p + f.protein, c: a.c + f.carbs, f: a.f + f.fat }), { kcal: 0, p: 0, c: 0, f: 0 });
  const weekMinutes = Math.round(sessions.reduce((s, x) => s + x.durationSec, 0) / 60);
  const trainingDays = active?.plan.days.filter((d) => d.type === "training").length ?? 0;
  const weekDone = new Set(sessions.map((s) => s.date)).size;
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: process.env.APP_TIMEZONE ?? "Asia/Kuala_Lumpur" }).format(new Date()));
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = day?.main[0] ? getExercise(day.main[0].slug) : undefined;
  const lastWeight = weights.at(-1);

  return (
    <div className="space-y-6">
      {sp.welcome && (
        <div className="flex items-center gap-3 rounded-2xl border border-lime/30 bg-lime/[0.06] px-5 py-4 text-sm">
          <Sparkles className="h-5 w-5 shrink-0 text-lime" />
          <span>Your personalised plan is ready. We built a {trainingDays}-day week for <b>{GOAL_LABELS[p.goal].toLowerCase()}</b> around your equipment and schedule.</span>
        </div>
      )}

      <div>
        <Eyebrow>{WEEKDAYS[dow]} · {new Date(date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</Eyebrow>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-5xl">{greet}, {p.name.split(" ")[0]}.</h1>
      </div>

      {/* Hero: today's workout */}
      <section className="card relative overflow-hidden p-0">
        <div className="grid md:grid-cols-[1.15fr_1fr]">
          <div className="relative z-10 flex flex-col p-6 md:p-8">
            <div className="flex items-center gap-2">
              <Pill tone={day?.type === "training" ? "lime" : day?.type === "active_recovery" ? "sky" : "default"}>
                {day?.type === "training" ? "Training day" : day?.type === "active_recovery" ? "Active recovery" : "Rest day"}
              </Pill>
              {doneToday && <Pill tone="lime"><Trophy className="h-3 w-3" /> Completed</Pill>}
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">{day?.title ?? "No plan yet"}</h2>
            {day && day.type !== "rest" ? (
              <>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-dim">
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />~{day.estMinutes} min</span>
                  <span>{day.main.length} exercises</span>
                  <span>{day.muscles.map((m) => MUSCLE_LABELS[m]).join(" · ")}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {day.main.slice(0, 5).map((it, i) => {
                    const ex = getExercise(it.slug);
                    return (
                      <li key={i} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-white/5 text-[11px] tabular text-dim">{i + 1}</span>{ex?.name}</span>
                        <span className="text-mute tabular">{it.sets} × {it.mode === "time" ? `${it.seconds}s` : it.reps}</span>
                      </li>
                    );
                  })}
                  {day.main.length > 5 && <li className="pl-9 text-sm text-mute">+{day.main.length - 5} more</li>}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href={`/studio/${dow}`} size="lg"><Play className="h-5 w-5 fill-current" /> {doneToday ? "Train again" : "Start workout"}</ButtonLink>
                  <ButtonLink href="/app/plan" variant="secondary" size="lg">View week</ButtonLink>
                </div>
              </>
            ) : (
              <div className="mt-3 max-w-md text-dim">
                <p className="flex items-start gap-2"><Moon className="mt-0.5 h-4 w-4 shrink-0 text-sky" />Recovery is where adaptation happens. Aim for 7–9 hours of sleep, a walk if you feel like it, and hit your protein target.</p>
                <div className="mt-6 flex gap-3">
                  <ButtonLink href="/app/plan" variant="secondary">View week</ButtonLink>
                  <ButtonLink href="/library" variant="ghost">Browse exercises</ButtonLink>
                </div>
              </div>
            )}
          </div>
          <div className="relative min-h-64 border-t border-line bg-ink md:border-l md:border-t-0">
            {first ? <ExercisePreview slug={first.slug} /> : <div className="grid h-full place-items-center text-mute"><Moon className="h-16 w-16 opacity-30" /></div>}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent" />
            {first && <p className="absolute bottom-4 right-5 text-xs text-dim">Up first · <span className="text-fg">{first.name}</span></p>}
          </div>
        </div>
      </section>

      {/* Week strip */}
      {active && (
        <section className="grid grid-cols-7 gap-1.5 md:gap-3">
          {active.plan.days.map((d) => {
            const isToday = d.dow === dow;
            const doneDay = sessions.some((s) => mondayIndex(new Date(s.date + "T12:00:00")) === d.dow);
            return (
              <Link key={d.dow} href={d.type === "rest" ? "/app/plan" : `/studio/${d.dow}`}
                className={cx("rounded-2xl border p-2 text-center transition md:p-3", isToday ? "border-lime/50 bg-lime/[0.06]" : "border-line bg-panel hover:border-line-strong")}>
                <p className={cx("text-[11px] font-semibold uppercase", isToday ? "text-lime" : "text-mute")}>{WEEKDAYS[d.dow].slice(0, 3)}</p>
                <div className={cx("mx-auto my-2 h-2 w-2 rounded-full", doneDay ? "bg-lime" : d.type === "training" ? "bg-white/40" : d.type === "active_recovery" ? "bg-sky/60" : "bg-white/10")} />
                <p className="hidden truncate text-xs text-dim md:block">{d.type === "rest" ? "Rest" : d.title.split(" —")[0]}</p>
              </Link>
            );
          })}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <div className="flex items-center justify-between">
            <div><Eyebrow>Nutrition today</Eyebrow><p className="mt-1 text-sm text-dim">{Math.max(0, Math.round(t.calories - eaten.kcal)).toLocaleString()} kcal remaining</p></div>
            <ButtonLink href="/app/nutrition" variant="ghost" size="sm">Log food <ArrowRight className="h-4 w-4" /></ButtonLink>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-6 md:gap-10">
            <Ring value={eaten.kcal / t.calories} size={150} stroke={12} label="Calories eaten">
              <div><p className="font-display text-3xl font-bold tabular">{Math.round(eaten.kcal)}</p><p className="text-xs text-mute">of {t.calories} kcal</p></div>
            </Ring>
            <div className="grid flex-1 grid-cols-3 gap-4">
              <MacroRing label="Protein" v={eaten.p} t={t.proteinG} color="var(--color-lime)" />
              <MacroRing label="Carbs" v={eaten.c} t={t.carbsG} color="var(--color-sky)" />
              <MacroRing label="Fat" v={eaten.f} t={t.fatG} color="var(--color-amber)" />
            </div>
          </div>
        </Card>
        <Card>
          <Eyebrow>Body weight</Eyebrow>
          <p className="mt-2 font-display text-4xl font-bold tabular">{lastWeight?.weightKg ?? p.weightKg}<span className="ml-1 text-base text-dim">kg</span></p>
          <p className="text-sm text-dim">Target {p.targetWeightKg} kg · BMI {t.bmi.value}</p>
          <WeightQuickLog date={date} current={lastWeight?.weightKg ?? p.weightKg} />
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Flame className="h-4 w-4" />} label="This week" value={`${weekDone}/${trainingDays}`} sub="sessions completed" />
        <Stat icon={<Clock className="h-4 w-4" />} label="Training time" value={`${weekMinutes} min`} sub="last 7 days" />
        <Link href="/app/coach" className="card group flex items-center gap-4 p-5 transition hover:border-lime/40">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lime/10 text-lime"><MessageCircle className="h-5 w-5" /></span>
          <span><span className="block font-semibold">Ask your coach</span><span className="text-sm text-dim">&ldquo;What should I eat after today&apos;s workout?&rdquo;</span></span>
          <ArrowRight className="ml-auto h-4 w-4 text-mute transition group-hover:translate-x-0.5 group-hover:text-lime" />
        </Link>
      </section>
    </div>
  );
}

function MacroRing({ label, v, t, color }: { label: string; v: number; t: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Ring value={v / t} size={78} stroke={7} color={color} label={`${label} eaten`}>
        <span className="text-sm font-semibold tabular">{Math.round(v)}<span className="text-[10px] text-mute">g</span></span>
      </Ring>
      <p className="text-xs text-dim">{label} <span className="text-mute">/ {t}g</span></p>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="card p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mute"><span className="text-lime">{icon}</span>{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular">{value}</p>
      <p className="text-sm text-dim">{sub}</p>
    </div>
  );
}
