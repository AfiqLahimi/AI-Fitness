import type { Goal, Profile } from "./types";

export interface BmiResult {
  value: number;
  category: "Underweight" | "Healthy range" | "Overweight" | "Obesity";
  /** Asian cut-offs (WHO expert consultation 2004, used by Malaysia's MOH CPG) */
  asianCategory: "Underweight" | "Healthy range" | "Increased risk" | "High risk";
}

export function bmi(weightKg: number, heightCm: number): BmiResult {
  const m = heightCm / 100;
  const value = round1(weightKg / (m * m));
  const category =
    value < 18.5 ? "Underweight" : value < 25 ? "Healthy range" : value < 30 ? "Overweight" : "Obesity";
  const asianCategory =
    value < 18.5 ? "Underweight" : value < 23 ? "Healthy range" : value < 27.5 ? "Increased risk" : "High risk";
  return { value, category, asianCategory };
}

/**
 * Mifflin–St Jeor equation. When gender is not given we use the midpoint
 * of the male (+5) and female (−161) constants (−78) and say so in the UI.
 */
export function bmr(p: Pick<Profile, "weightKg" | "heightCm" | "age" | "gender">): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  const k = p.gender === "male" ? 5 : p.gender === "female" ? -161 : -78;
  return Math.round(base + k);
}

/** Activity factor derived from planned training volume (sessions × minutes). */
export function activityFactor(daysPerWeek: number, sessionMinutes: number): { factor: number; label: string } {
  const weeklyMinutes = daysPerWeek * sessionMinutes;
  if (weeklyMinutes < 60) return { factor: 1.2, label: "Sedentary" };
  if (weeklyMinutes < 150) return { factor: 1.375, label: "Lightly active" };
  if (weeklyMinutes < 300) return { factor: 1.55, label: "Moderately active" };
  if (weeklyMinutes < 420) return { factor: 1.725, label: "Very active" };
  return { factor: 1.9, label: "Extremely active" };
}

const GOAL_ADJUST: Record<Goal, { pct: number; note: string }> = {
  weight_loss: { pct: -0.2, note: "A moderate ~20% deficit (capped at 500 kcal) for steady, sustainable fat loss of roughly 0.25–0.75 kg per week." },
  muscle_building: { pct: 0.1, note: "A small ~10% surplus (capped at 300 kcal) to support muscle growth while limiting fat gain." },
  recomposition: { pct: -0.1, note: "A slight ~10% deficit with high protein so you can lose fat while maintaining or building muscle." },
  strength: { pct: 0.05, note: "Around maintenance with a small surplus to fuel heavy training and recovery." },
  general_fitness: { pct: 0, note: "Maintenance calories to support training, energy and health." },
};

export interface Targets {
  bmi: BmiResult;
  bmr: number;
  tdee: number;
  activityLabel: string;
  activityFactor: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinPerKg: number;
  goalNote: string;
  floorApplied: boolean;
}

export function computeTargets(p: Profile): Targets {
  const b = bmi(p.weightKg, p.heightCm);
  const base = bmr(p);
  const af = activityFactor(p.daysPerWeek, p.sessionMinutes);
  const tdee = Math.round(base * af.factor);
  const adj = GOAL_ADJUST[p.goal];
  let delta = Math.round(tdee * adj.pct);
  if (adj.pct < 0) delta = Math.max(delta, -500);
  if (adj.pct > 0) delta = Math.min(delta, 300);
  let calories = tdee + delta;

  // Never recommend eating below BMR or below a general safety floor.
  const floor = Math.max(base, p.gender === "male" ? 1500 : 1200);
  const floorApplied = calories < floor;
  calories = roundTo(Math.max(calories, floor), 10);

  // Protein: evidence-based 1.6–2.2 g/kg. For people with a high BMI we
  // anchor on a reference weight (BMI 25 at their height) to avoid inflated targets.
  const perKg: Record<Goal, number> = {
    weight_loss: 1.8,
    muscle_building: 2.0,
    recomposition: 2.0,
    strength: 1.8,
    general_fitness: 1.6,
  };
  const refWeight = b.value > 27 ? 25 * (p.heightCm / 100) ** 2 : p.weightKg;
  const proteinG = Math.round(refWeight * perKg[p.goal]);
  const fatG = Math.round((calories * (p.goal === "strength" ? 0.3 : 0.27)) / 9);
  const carbsG = Math.max(50, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  return {
    bmi: b,
    bmr: base,
    tdee,
    activityLabel: af.label,
    activityFactor: af.factor,
    calories,
    proteinG,
    carbsG,
    fatG,
    proteinPerKg: perKg[p.goal],
    goalNote: adj.note,
    floorApplied,
  };
}

/** Calorie estimate for an activity using METs: kcal = MET × kg × hours. */
export function estimateKcal(met: number, weightKg: number, seconds: number): number {
  return Math.round(met * weightKg * (seconds / 3600));
}

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}
