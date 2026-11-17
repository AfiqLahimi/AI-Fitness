"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Home, Loader2 } from "lucide-react";
import {
  DIET_LABELS, EQUIPMENT_LABELS, EXPERIENCE_LABELS, GOAL_LABELS,
  type DietPreference, type Equipment, type Experience, type Goal, type Profile,
} from "@/lib/fitness/types";
import { computeTargets } from "@/lib/fitness/calc";
import { saveProfileAction } from "@/lib/server/actions";
import { Button, cx } from "./ui";
import { NumbersExplainer } from "./NumbersExplainer";

const DEFAULT: Profile = {
  name: "", age: 28, gender: "unspecified", heightCm: 170, weightKg: 70, targetWeightKg: 65,
  experience: "beginner", goal: "general_fitness", location: "home", equipment: ["dumbbells", "mat"],
  daysPerWeek: 4, sessionMinutes: 45, diet: ["halal"], allergies: "",
};

const GOAL_DESC: Record<Goal, string> = {
  weight_loss: "Lose fat steadily while keeping strength.",
  muscle_building: "Add lean muscle with progressive training.",
  recomposition: "Lose fat and build muscle at the same time.",
  strength: "Lift heavier with lower reps and longer rest.",
  general_fitness: "Feel fitter, move better, build habits.",
};

const STEPS = ["About you", "Your goal", "Training", "Nutrition", "Your numbers"];

export function ProfileWizard({ initial, mode }: { initial?: Partial<Profile>; mode: "onboarding" | "edit" }) {
  const [p, setP] = useState<Profile>({ ...DEFAULT, ...initial });
  const [step, setStep] = useState(mode === "edit" ? 0 : 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const targets = useMemo(() => computeTargets(p), [p]);

  const valid = [
    p.name.trim().length > 0 && p.age >= 16 && p.heightCm >= 120 && p.weightKg >= 35 && p.targetWeightKg >= 35,
    true, true, true, true,
  ];

  const save = () =>
    start(async () => {
      setError(null);
      const res = await saveProfileAction(p, { regeneratePlan: mode === "onboarding" });
      if (res?.error) { setError(res.error); return; }
      router.push(mode === "onboarding" ? "/app?welcome=1" : "/app");
      router.refresh();
    });

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i < step && setStep(i)} className="group flex-1 text-left" disabled={i > step}>
            <div className={cx("h-1 rounded-full transition-colors duration-500", i <= step ? "bg-lime" : "bg-white/10")} />
            <span className={cx("mt-2 hidden text-xs sm:block", i === step ? "text-fg" : "text-mute")}>{s}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          {step === 0 && (
            <Section title="Let's get to know you" sub="We use this to calculate your energy needs and tailor every plan.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Name" value={p.name} onChange={(v) => set("name", v)} placeholder="Your first name" />
                <Num label="Age" unit="years" value={p.age} onChange={(v) => set("age", v)} min={16} max={90} />
                <Num label="Height" unit="cm" value={p.heightCm} onChange={(v) => set("heightCm", v)} min={120} max={230} />
                <Num label="Current weight" unit="kg" value={p.weightKg} onChange={(v) => set("weightKg", v)} min={35} max={250} step={0.1} />
                <Num label="Target weight" unit="kg" value={p.targetWeightKg} onChange={(v) => set("targetWeightKg", v)} min={35} max={250} step={0.1} />
                <div>
                  <Label>Gender <span className="text-mute">(optional)</span></Label>
                  <Segmented value={p.gender} onChange={(v) => set("gender", v)} options={[["female", "Female"], ["male", "Male"], ["unspecified", "Prefer not to say"]]} />
                </div>
              </div>
            </Section>
          )}

          {step === 1 && (
            <Section title="What are you training for?" sub="Your goal shapes your split, rep ranges, rest periods and calorie target.">
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
                  <Choice key={g} active={p.goal === g} onClick={() => set("goal", g)} title={GOAL_LABELS[g]} body={GOAL_DESC[g]} />
                ))}
              </div>
              <Label className="mt-8">Experience</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(EXPERIENCE_LABELS) as Experience[]).map((e) => (
                  <Choice key={e} active={p.experience === e} onClick={() => set("experience", e)} title={EXPERIENCE_LABELS[e]}
                    body={e === "beginner" ? "New or returning after a long break" : e === "intermediate" ? "Training consistently 6+ months" : "Years of structured training"} />
                ))}
              </div>
            </Section>
          )}

          {step === 2 && (
            <Section title="Your training setup" sub="We only pick exercises you can actually do with what you have.">
              <div className="grid gap-3 sm:grid-cols-2">
                <Choice active={p.location === "home"} onClick={() => set("location", "home")} title="Home" body="Bodyweight plus whatever equipment you own" icon={<Home className="h-5 w-5" />} />
                <Choice active={p.location === "gym"} onClick={() => set("location", "gym")} title="Gym" body="Full access to weights and machines" icon={<Dumbbell className="h-5 w-5" />} />
              </div>
              {p.location === "home" && (
                <>
                  <Label className="mt-8">Equipment you have</Label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).filter((e) => e !== "bodyweight" && e !== "machines" && e !== "cable_machine").map((e) => (
                      <Chip key={e} active={p.equipment.includes(e)} onClick={() => set("equipment", toggle(p.equipment, e))}>{EQUIPMENT_LABELS[e]}</Chip>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <Slider label="Workout days per week" value={p.daysPerWeek} min={2} max={6} onChange={(v) => set("daysPerWeek", v)} format={(v) => `${v} days`} />
                <Slider label="Session length" value={p.sessionMinutes} min={20} max={90} step={5} onChange={(v) => set("sessionMinutes", v)} format={(v) => `${v} min`} />
              </div>
            </Section>
          )}

          {step === 3 && (
            <Section title="Food preferences" sub="Meal plans use a Malaysian-first food database and respect these filters.">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DIET_LABELS) as DietPreference[]).map((d) => (
                  <Chip key={d} active={p.diet.includes(d)} onClick={() => set("diet", toggle(p.diet, d))}>{DIET_LABELS[d]}</Chip>
                ))}
              </div>
              <label className="mt-8 block">
                <Label>Allergies or foods to avoid</Label>
                <textarea value={p.allergies} onChange={(e) => set("allergies", e.target.value)} maxLength={300} rows={3} placeholder="e.g. peanuts, prawns" className="w-full rounded-xl border border-line bg-ink px-4 py-3 outline-none placeholder:text-mute focus:border-lime/60" />
                <span className="mt-1 block text-xs text-mute">Separate with commas. Foods whose names contain these words are excluded from meal plans. Always double-check ingredients when eating out.</span>
              </label>
            </Section>
          )}

          {step === 4 && (
            <Section title={`${p.name ? p.name + ", h" : "H"}ere are your numbers`} sub="Calculated from your profile. They update automatically when your weight or training changes.">
              <NumbersExplainer profile={p} targets={targets} />
            </Section>
          )}
        </motion.div>
      </AnimatePresence>

      {error && <p role="alert" className="mt-6 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p>}

      <div className="mt-10 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ArrowLeft className="h-4 w-4" /> Back</Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!valid[step]}>Continue <ArrowRight className="h-4 w-4" /></Button>
        ) : (
          <Button onClick={save} disabled={pending} size="lg">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {mode === "onboarding" ? "Build my plan" : "Save changes"}
          </Button>
        )}
      </div>
    </div>
  );
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section>
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      <p className="mb-8 mt-2 text-dim">{sub}</p>
      {children}
    </section>
  );
}
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cx("mb-2 block text-sm font-medium", className)}>{children}</span>;
}
function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={60} className="h-12 w-full rounded-xl border border-line bg-ink px-4 outline-none placeholder:text-mute focus:border-lime/60" />
    </label>
  );
}
function Num({ label, unit, value, onChange, min, max, step = 1 }: { label: string; unit: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="flex h-12 items-center rounded-xl border border-line bg-ink pr-4 focus-within:border-lime/60">
        <input type="number" inputMode="decimal" value={Number.isFinite(value) ? value : ""} min={min} max={max} step={step}
          onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
          className="tabular h-full w-full bg-transparent px-4 outline-none" />
        <span className="text-sm text-mute">{unit}</span>
      </div>
    </label>
  );
}
function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="grid h-12 grid-cols-3 gap-1 rounded-xl border border-line bg-ink p-1">
      {options.map(([v, l]) => (
        <button type="button" key={v} onClick={() => onChange(v)} className={cx("rounded-lg text-xs font-medium transition sm:text-sm", value === v ? "bg-raised text-fg shadow" : "text-mute hover:text-fg")}>{l}</button>
      ))}
    </div>
  );
}
function Choice({ active, onClick, title, body, icon }: { active: boolean; onClick: () => void; title: string; body: string; icon?: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cx("relative rounded-2xl border p-4 text-left transition-all duration-200", active ? "border-lime/60 bg-lime/[0.06] shadow-[0_0_0_1px_rgba(198,255,61,0.25)]" : "border-line bg-panel hover:border-line-strong")}>
      <div className="flex items-center gap-2 font-semibold">{icon && <span className={active ? "text-lime" : "text-dim"}>{icon}</span>}{title}</div>
      <p className="mt-1 text-sm text-dim">{body}</p>
      {active && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-lime text-lime-ink"><Check className="h-3 w-3" strokeWidth={3} /></span>}
    </button>
  );
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cx("rounded-full border px-4 py-2 text-sm transition", active ? "border-lime/60 bg-lime/10 text-lime" : "border-line bg-panel text-dim hover:text-fg")}>
      {children}
    </button>
  );
}
function Slider({ label, value, min, max, step = 1, onChange, format }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <label className="block">
      <div className="mb-3 flex items-baseline justify-between"><Label className="mb-0">{label}</Label><span className="font-display text-xl font-semibold text-lime tabular">{format(value)}</span></div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
