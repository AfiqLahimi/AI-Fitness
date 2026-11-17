import { requireUser } from "@/lib/server/auth";
import { dateNDaysAgo, getActivePlan, getFoodLogsSince, getProfile, getSessions, getWeights } from "@/lib/server/data";
import { bmi, computeTargets } from "@/lib/fitness/calc";
import { Bars, TrendLine } from "@/components/Charts";
import { Card, EmptyState, PageHeader, Ring } from "@/components/ui";
import { WeightQuickLog } from "@/components/WeightQuickLog";
import { today } from "@/lib/server/data";
import { LineChart as LineIcon, Dumbbell } from "lucide-react";

export const metadata = { title: "Progress" };

function weekStart(d: string) {
  const x = new Date(d + "T12:00:00");
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

export default async function ProgressPage() {
  const user = await requireUser();
  const [profile, weights, sessions, foods, active] = await Promise.all([
    getProfile(user.id), getWeights(user.id), getSessions(user.id), getFoodLogsSince(user.id, dateNDaysAgo(13)), getActivePlan(user.id),
  ]);
  const p = profile!;
  const t = computeTargets(p);
  const first = weights[0];
  const latest = weights.at(-1);
  const change = first && latest ? Math.round((latest.weightKg - first.weightKg) * 10) / 10 : 0;
  const startToTarget = first ? first.weightKg - p.targetWeightKg : 0;
  const towardTarget = startToTarget !== 0 && latest ? Math.max(0, Math.min(1, (first.weightKg - latest.weightKg) / startToTarget)) : latest && latest.weightKg === p.targetWeightKg ? 1 : 0;

  // Weekly activity: last 8 weeks
  const weeks: { label: string; value: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const ws = weekStart(dateNDaysAgo(i * 7));
    weeks.push({ label: ws, value: sessions.filter((s) => weekStart(s.date) === ws).length });
  }
  const plannedPerWeek = active?.plan.days.filter((d) => d.type === "training").length ?? p.daysPerWeek;
  const last4 = weeks.slice(-4).reduce((s, w) => s + w.value, 0);
  const completionRate = Math.min(1, last4 / (plannedPerWeek * 4));
  const totalMin = Math.round(sessions.reduce((s, x) => s + x.durationSec, 0) / 60);
  const totalKcal = sessions.reduce((s, x) => s + x.kcalEstimate, 0);
  const setRate = sessions.length ? sessions.reduce((s, x) => s + x.setsDone, 0) / Math.max(1, sessions.reduce((s, x) => s + x.setsTotal, 0)) : 0;

  // Nutrition: last 14 days
  const days = Array.from({ length: 14 }, (_, i) => dateNDaysAgo(13 - i));
  const kcalDays = days.map((d) => ({ label: d, value: Math.round(foods.filter((f) => f.date === d).reduce((s, f) => s + f.kcal, 0)) }));
  const proteinDays = days.map((d) => ({ label: d, value: Math.round(foods.filter((f) => f.date === d).reduce((s, f) => s + f.protein, 0)) }));
  const loggedDays = kcalDays.filter((d) => d.value > 0);

  return (
    <>
      <PageHeader eyebrow="Progress" title="Your progress" subtitle="Every workout, weigh-in and meal adds to the picture." />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="flex items-center gap-5 md:col-span-2">
          <Ring value={towardTarget} size={120} stroke={10} label="Progress toward target weight">
            <div><p className="font-display text-2xl font-bold tabular">{Math.round(towardTarget * 100)}%</p><p className="text-[10px] text-mute">to target</p></div>
          </Ring>
          <div>
            <p className="text-sm text-dim">Current weight</p>
            <p className="font-display text-4xl font-bold tabular">{latest?.weightKg ?? p.weightKg}<span className="ml-1 text-base text-dim">kg</span></p>
            <p className="text-sm text-dim">Target {p.targetWeightKg} kg · {change === 0 ? "no change yet" : `${change > 0 ? "+" : ""}${change} kg since ${first?.date}`}</p>
          </div>
        </Card>
        <Kpi label="Workouts completed" value={String(sessions.length)} sub={`${totalMin} min total`} />
        <Kpi label="4-week completion" value={`${Math.round(completionRate * 100)}%`} sub={`${last4} of ${plannedPerWeek * 4} planned`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="font-semibold">Weight (kg)</h2>
          <p className="text-xs text-mute">Dashed line: your target</p>
          {weights.length >= 2 ? <TrendLine data={weights.map((w) => ({ date: w.date, value: w.weightKg }))} unit=" kg" target={p.targetWeightKg} /> : (
            <div className="grid h-60 place-items-center text-center text-sm text-mute"><div><LineIcon className="mx-auto mb-2 h-6 w-6" />Log your weight on a few different days to see your trend.</div></div>
          )}
        </Card>
        <Card>
          <h2 className="font-semibold">Log a weigh-in</h2>
          <p className="text-sm text-dim">Weigh at the same time of day — ideally in the morning — for a fairer comparison.</p>
          <WeightQuickLog date={today()} current={latest?.weightKg ?? p.weightKg} />
          <div className="mt-6 border-t border-line pt-4 text-sm text-dim">
            <p>BMI now <span className="font-semibold text-fg tabular">{t.bmi.value}</span> · {t.bmi.category}</p>
            <p className="mt-1 text-xs text-mute">BMI is a screening indicator, not a measure of body composition. Pair it with how your clothes fit, waist measurement and strength gains.</p>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">BMI history</h2>
          <p className="text-xs text-mute">Dashed line: 25 (upper healthy-range cut-off; 23 under Asian cut-offs)</p>
          {weights.length >= 2 ? <TrendLine data={weights.map((w) => ({ date: w.date, value: w.bmi || bmi(w.weightKg, p.heightCm).value }))} unit="" target={25} targetLabel="25" domainPad={0.5} /> : <div className="grid h-60 place-items-center text-sm text-mute">Needs at least two weigh-ins.</div>}
        </Card>
        <Card>
          <h2 className="font-semibold">Workouts per week</h2>
          <p className="text-xs text-mute">Last 8 weeks · dashed line: planned sessions</p>
          {sessions.length ? <Bars data={weeks} unit=" workouts" target={plannedPerWeek} targetLabel="Plan" /> : (
            <EmptyState icon={<Dumbbell className="h-6 w-6" />} title="No workouts yet" body="Complete your first session in the Workout Studio and it will show up here." />
          )}
          {sessions.length > 0 && <p className="mt-2 text-xs text-mute tabular">Sets completed {Math.round(setRate * 100)}% · ≈{totalKcal.toLocaleString()} kcal burned in workouts (estimate)</p>}
        </Card>
        <Card>
          <h2 className="font-semibold">Daily calories (kcal)</h2>
          <p className="text-xs text-mute">Last 14 days · dashed line: your {t.calories} kcal target</p>
          {loggedDays.length ? <Bars data={kcalDays} unit=" kcal" target={t.calories} /> : <div className="grid h-56 place-items-center text-sm text-mute">Log food to see your intake trend.</div>}
        </Card>
        <Card>
          <h2 className="font-semibold">Daily protein (g)</h2>
          <p className="text-xs text-mute">Last 14 days · dashed line: your {t.proteinG} g target</p>
          {loggedDays.length ? <Bars data={proteinDays} unit=" g" target={t.proteinG} /> : <div className="grid h-56 place-items-center text-sm text-mute">Log food to see your protein trend.</div>}
        </Card>
      </div>

      {sessions.length > 0 && (
        <Card className="mt-4 overflow-x-auto p-0">
          <h2 className="px-5 pt-5 font-semibold md:px-6">Workout history</h2>
          <table className="mt-3 w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-mute"><th className="px-5 py-2 font-medium md:px-6">Date</th><th className="py-2 font-medium">Workout</th><th className="py-2 font-medium">Duration</th><th className="py-2 font-medium">Sets</th><th className="py-2 font-medium">Feel</th></tr></thead>
            <tbody>
              {sessions.slice(0, 15).map((s) => (
                <tr key={s.id} className="border-b border-line/60 last:border-0">
                  <td className="px-5 py-3 tabular text-dim md:px-6">{s.date}</td><td className="py-3">{s.title}</td>
                  <td className="py-3 tabular text-dim">{Math.round(s.durationSec / 60)} min</td><td className="py-3 tabular text-dim">{s.setsDone}/{s.setsTotal}</td>
                  <td className="py-3 text-dim">{s.feedback ? s.feedback.replace("_", " ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-mute">{label}</p>
      <p className="mt-2 font-display text-4xl font-bold tabular">{value}</p>
      <p className="text-sm text-dim">{sub}</p>
    </div>
  );
}
