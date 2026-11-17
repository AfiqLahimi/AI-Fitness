import type { Profile } from "@/lib/fitness/types";
import type { Targets } from "@/lib/fitness/calc";
import { Info } from "lucide-react";

export function NumbersExplainer({ profile: p, targets: t }: { profile: Profile; targets: Targets }) {
  const bmiPos = Math.min(1, Math.max(0, (t.bmi.value - 15) / 25));
  const kgToGo = Math.round((p.targetWeightKg - p.weightKg) * 10) / 10;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <p className="text-sm text-dim">Daily calorie target</p>
          <p className="mt-1 font-display text-5xl font-bold tracking-tight text-lime tabular">{t.calories.toLocaleString()}<span className="ml-2 text-lg font-medium text-dim">kcal</span></p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Macro label="Protein" g={t.proteinG} kcal={t.proteinG * 4} total={t.calories} color="var(--color-lime)" />
            <Macro label="Carbs" g={t.carbsG} kcal={t.carbsG * 4} total={t.calories} color="var(--color-sky)" />
            <Macro label="Fat" g={t.fatG} kcal={t.fatG * 9} total={t.calories} color="var(--color-amber)" />
          </div>
          <p className="mt-5 text-sm text-dim">{t.goalNote}{t.floorApplied && " Your target was raised to a safe minimum so you never eat below your BMR."}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-dim">Body Mass Index</p>
          <p className="mt-1 font-display text-4xl font-bold tabular">{t.bmi.value}</p>
          <p className="text-sm text-dim">{t.bmi.category} <span className="text-mute">· Asian cut-offs: {t.bmi.asianCategory}</span></p>
          <div className="relative mt-5 h-2 rounded-full" style={{ background: "linear-gradient(90deg,#5ad1ff 0%,#c6ff3d 30%,#ffbf3c 55%,#ff6b5a 100%)" }}>
            <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-base bg-fg" style={{ left: `${bmiPos * 100}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-mute tabular"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span></div>
          <p className="mt-4 flex gap-2 rounded-xl bg-white/[0.03] p-3 text-xs text-dim">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky" />
            BMI is a quick screening indicator only. It doesn&apos;t distinguish muscle from fat or account for where fat is stored, age, sex or ethnicity, so it isn&apos;t a complete assessment of your health or body composition.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="BMR" value={`${t.bmr.toLocaleString()} kcal`} body={`Energy your body uses at complete rest. Mifflin–St Jeor equation from your weight, height and age${p.gender === "unspecified" ? ", using a sex-neutral midpoint since gender wasn't specified" : ""}.`} />
        <Stat label="TDEE" value={`${t.tdee.toLocaleString()} kcal`} body={`BMR × ${t.activityFactor} (${t.activityLabel.toLowerCase()}, from ${p.daysPerWeek} × ${p.sessionMinutes} min sessions). Roughly what you burn in a day.`} />
        <Stat label="Target weight" value={`${p.targetWeightKg} kg`} body={kgToGo === 0 ? "You're at your target — the plan focuses on performance and maintenance." : `${Math.abs(kgToGo)} kg to ${kgToGo < 0 ? "lose" : "gain"}. A sustainable pace is about 0.25–1% of body weight per week.`} />
      </div>
      <p className="text-xs text-mute">Protein is set at {t.proteinPerKg} g per kg{t.bmi.value > 27 ? " of a reference body weight (BMI 25 at your height)" : " of body weight"}, fat at ~27–30% of calories and carbohydrates fill the rest. All figures are estimates — individual needs vary, so adjust based on your progress and talk to a healthcare professional if you have a medical condition.</p>
    </div>
  );
}

function Macro({ label, g, kcal, total, color }: { label: string; g: number; kcal: number; total: number; color: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <div className="flex items-center gap-1.5 text-xs text-dim"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{label}</div>
      <p className="mt-1 font-display text-2xl font-semibold tabular">{g}<span className="text-sm text-dim">g</span></p>
      <p className="text-[11px] text-mute tabular">{Math.round((kcal / total) * 100)}% of kcal</p>
    </div>
  );
}

function Stat({ label, value, body }: { label: string; value: string; body: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-mute">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-dim">{body}</p>
    </div>
  );
}
