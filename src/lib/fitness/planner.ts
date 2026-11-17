import { EXERCISES, getExercise, type Exercise, type Muscle } from "./exercises";
import type { Equipment, Experience, Goal, Profile } from "./types";

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export interface PlanItem {
  slug: string;
  sets: number;
  reps: number; // used in rep mode
  seconds: number; // used in timer mode
  restSec: number;
  mode: "reps" | "time";
}

export type DayType = "training" | "active_recovery" | "rest";

export interface PlanDay {
  dow: number; // 0 = Monday
  type: DayType;
  title: string;
  templateKey: TemplateKey | null;
  muscles: Muscle[];
  warmup: PlanItem[];
  main: PlanItem[];
  cooldown: PlanItem[];
  estMinutes: number;
}

export interface WorkoutPlan {
  version: 1;
  seed: number;
  level: number; // 1–5 progression level, adjusted from feedback
  goal: Goal;
  days: PlanDay[];
  generatedAt: string;
}

export type TemplateKey =
  | "full_a" | "full_b" | "full_c" | "push" | "pull" | "legs" | "upper" | "lower"
  | "chest_tri" | "back_bi" | "shoulders_abs" | "conditioning";

interface Template {
  title: string;
  slots: Muscle[]; // one exercise per slot, in order
  muscles: Muscle[];
}

export const TEMPLATES: Record<TemplateKey, Template> = {
  full_a: { title: "Full Body A", slots: ["quads", "chest", "back", "shoulders", "core"], muscles: ["quads", "chest", "back", "shoulders", "core"] },
  full_b: { title: "Full Body B", slots: ["hamstrings", "back", "chest", "glutes", "biceps", "core"], muscles: ["hamstrings", "back", "chest", "glutes", "core"] },
  full_c: { title: "Full Body C", slots: ["glutes", "shoulders", "lats", "quads", "triceps", "core"], muscles: ["glutes", "shoulders", "lats", "quads", "core"] },
  push: { title: "Push — Chest, Shoulders & Triceps", slots: ["chest", "shoulders", "chest", "shoulders", "triceps", "triceps"], muscles: ["chest", "shoulders", "triceps"] },
  pull: { title: "Pull — Back & Biceps", slots: ["lats", "back", "back", "biceps", "biceps", "core"], muscles: ["lats", "back", "biceps"] },
  legs: { title: "Legs & Glutes", slots: ["quads", "hamstrings", "quads", "glutes", "calves", "core"], muscles: ["quads", "hamstrings", "glutes", "calves"] },
  upper: { title: "Upper Body", slots: ["chest", "back", "shoulders", "lats", "biceps", "triceps"], muscles: ["chest", "back", "shoulders", "biceps", "triceps"] },
  lower: { title: "Lower Body & Core", slots: ["quads", "hamstrings", "glutes", "calves", "core", "core"], muscles: ["quads", "hamstrings", "glutes", "core"] },
  chest_tri: { title: "Chest & Triceps", slots: ["chest", "chest", "chest", "triceps", "triceps"], muscles: ["chest", "triceps"] },
  back_bi: { title: "Back & Biceps", slots: ["lats", "back", "back", "biceps", "biceps"], muscles: ["back", "lats", "biceps"] },
  shoulders_abs: { title: "Shoulders & Abs", slots: ["shoulders", "shoulders", "shoulders", "core", "core", "obliques"], muscles: ["shoulders", "core", "obliques"] },
  conditioning: { title: "Conditioning & Core", slots: ["cardio", "full_body", "core", "cardio", "core"], muscles: ["cardio", "core", "full_body"] },
};

/** Which weekdays train for each frequency, and which template each training day uses. */
function weekLayout(days: number, exp: Experience, goal: Goal): { dow: number; key: TemplateKey | "active" }[] {
  const d = Math.min(6, Math.max(2, Math.round(days)));
  if (d === 2) return [{ dow: 0, key: "full_a" }, { dow: 3, key: "full_b" }];
  if (d === 3) {
    if (exp === "beginner" || goal === "weight_loss" || goal === "general_fitness")
      return [{ dow: 0, key: "full_a" }, { dow: 2, key: "full_b" }, { dow: 4, key: "full_c" }];
    return [{ dow: 0, key: "push" }, { dow: 2, key: "pull" }, { dow: 4, key: "legs" }];
  }
  if (d === 4)
    return [{ dow: 0, key: "upper" }, { dow: 1, key: "lower" }, { dow: 2, key: "active" }, { dow: 3, key: "upper" }, { dow: 4, key: "lower" }];
  if (d === 5)
    return [
      { dow: 0, key: "chest_tri" }, { dow: 1, key: "back_bi" }, { dow: 2, key: "active" },
      { dow: 3, key: "shoulders_abs" }, { dow: 4, key: "legs" }, { dow: 5, key: goal === "weight_loss" ? "conditioning" : "full_a" },
    ];
  return [
    { dow: 0, key: "push" }, { dow: 1, key: "pull" }, { dow: 2, key: "legs" },
    { dow: 3, key: "push" }, { dow: 4, key: "pull" }, { dow: 5, key: "legs" },
  ];
}

const LEVEL_RANK: Record<Experience, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export function availableEquipment(p: Pick<Profile, "equipment" | "location">): Set<Equipment> {
  const s = new Set<Equipment>(["bodyweight", ...p.equipment]);
  if (p.location === "gym")
    (["dumbbells", "barbell", "kettlebell", "bench", "cable_machine", "machines", "pullup_bar", "mat", "resistance_band"] as Equipment[]).forEach((e) => s.add(e));
  return s;
}

export function canPerform(ex: Exercise, eq: Set<Equipment>, exp: Experience): boolean {
  if (LEVEL_RANK[ex.difficulty] > LEVEL_RANK[exp]) return false;
  // "bench" + "bodyweight" style lists mean ANY works; bench dips can use a chair.
  return ex.equipment.some((e) => eq.has(e));
}

export function alternativesFor(slug: string, p: Profile): Exercise[] {
  const ex = getExercise(slug);
  if (!ex) return [];
  const eq = availableEquipment(p);
  return EXERCISES.filter(
    (o) => o.slug !== slug && o.category === ex.category && o.primary.some((m) => ex.primary.includes(m)) && canPerform(o, eq, p.experience),
  );
}

export function prescribe(ex: Exercise, goal: Goal, experience: Experience, level: number): PlanItem {
  const lv = Math.min(5, Math.max(1, level)) - 1; // 0–4
  const timed = ex.defaultMode === "time";
  let sets = 3, reps = 10, seconds = 40, restSec = 60;
  switch (goal) {
    case "strength": sets = 4; reps = 5; restSec = 150; seconds = 30; break;
    case "muscle_building": sets = 3; reps = 10; restSec = 90; seconds = 40; break;
    case "recomposition": sets = 3; reps = 10; restSec = 75; seconds = 40; break;
    case "weight_loss": sets = 3; reps = 12; restSec = 45; seconds = 40; break;
    case "general_fitness": sets = 3; reps = 12; restSec = 60; seconds = 35; break;
  }
  if (experience === "beginner") { sets = Math.max(2, sets - 1); seconds -= 5; }
  if (experience === "advanced") { sets += 1; }
  if (ex.category === "cardio") { restSec = Math.min(restSec, 45); }
  if (ex.category === "core" && goal === "strength") { reps = 10; restSec = 60; }
  // Progressive overload by level: add reps/time first, then a set.
  reps += Math.min(lv, 3);
  seconds += lv * 5;
  if (lv >= 3) sets += 1;
  return { slug: ex.slug, sets, reps, seconds, restSec, mode: timed ? "time" : "reps" };
}

function warmFor(muscles: Muscle[]): string[] {
  const lower = muscles.some((m) => ["quads", "hamstrings", "glutes", "calves"].includes(m));
  return lower ? ["march-in-place", "bodyweight-good-morning", "jumping-jacks"] : ["march-in-place", "arm-circles", "jumping-jacks"];
}
function coolFor(): string[] {
  return ["hamstring-stretch", "quad-stretch"];
}

/** Small deterministic PRNG so "Regenerate" produces a new but reproducible plan. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function itemSeconds(i: PlanItem): number {
  const work = i.mode === "time" ? i.seconds : i.reps * 3.5;
  return i.sets * work + (i.sets - 1) * i.restSec + 45; // + transition
}

export function buildDay(key: TemplateKey, dow: number, p: Profile, level: number, rand: () => number): PlanDay {
  const t = TEMPLATES[key];
  const eq = availableEquipment(p);
  const used = new Set<string>();
  const main: PlanItem[] = [];
  const budgetSec = Math.max(10, p.sessionMinutes - 10) * 60; // 10 min for warm-up + cooldown

  let spent = 0;
  for (const muscle of t.slots) {
    const pool = EXERCISES.filter(
      (e) => (e.category === "strength" || e.category === "core" || e.category === "cardio") && e.primary.includes(muscle) && !used.has(e.slug) && canPerform(e, eq, p.experience),
    );
    if (!pool.length) continue;
    // Prefer loaded movements when equipment exists, and harder moves for experienced lifters.
    const scored = pool
      .map((e) => ({ e, s: rand() + (e.equipment.includes("bodyweight") ? 0 : 0.35) + LEVEL_RANK[e.difficulty] * (p.experience === "beginner" ? -0.3 : 0.2) }))
      .sort((a, b) => b.s - a.s);
    const pick = scored[0].e;
    const item = prescribe(pick, p.goal, p.experience, level);
    const cost = itemSeconds(item);
    if (main.length >= 3 && spent + cost > budgetSec) break;
    used.add(pick.slug);
    main.push(item);
    spent += cost;
  }

  // Weight-loss / general fitness: add a short conditioning finisher if time allows.
  if ((p.goal === "weight_loss" || p.goal === "general_fitness") && key !== "conditioning") {
    const finisher = EXERCISES.find((e) => e.category === "cardio" && !used.has(e.slug) && canPerform(e, eq, p.experience) && e.defaultMode === "time");
    if (finisher) {
      const it = prescribe(finisher, p.goal, p.experience, level);
      if (spent + itemSeconds(it) <= budgetSec + 120) { main.push(it); spent += itemSeconds(it); }
    }
  }

  const warmup = warmFor(t.muscles).map((slug) => ({ slug, sets: 1, reps: 20, seconds: 60, restSec: 10, mode: "time" as const }));
  const cooldown = coolFor().map((slug) => ({ slug, sets: 1, reps: 0, seconds: 45, restSec: 5, mode: "time" as const }));
  const est = Math.round((spent + warmup.length * 70 + cooldown.length * 50) / 60);
  return { dow, type: "training", title: t.title, templateKey: key, muscles: t.muscles, warmup, main, cooldown, estMinutes: est };
}

function activeRecovery(dow: number): PlanDay {
  return {
    dow, type: "active_recovery", title: "Active Recovery", templateKey: null, muscles: ["mobility", "cardio"],
    warmup: [],
    main: [
      { slug: "march-in-place", sets: 1, reps: 0, seconds: 180, restSec: 15, mode: "time" },
      { slug: "arm-circles", sets: 1, reps: 0, seconds: 60, restSec: 15, mode: "time" },
      { slug: "bodyweight-good-morning", sets: 2, reps: 0, seconds: 45, restSec: 15, mode: "time" },
      { slug: "glute-bridge", sets: 2, reps: 12, seconds: 40, restSec: 30, mode: "reps" },
    ],
    cooldown: [
      { slug: "hamstring-stretch", sets: 1, reps: 0, seconds: 60, restSec: 5, mode: "time" },
      { slug: "quad-stretch", sets: 1, reps: 0, seconds: 60, restSec: 5, mode: "time" },
    ],
    estMinutes: 15,
  };
}

function restDay(dow: number): PlanDay {
  return { dow, type: "rest", title: "Rest Day", templateKey: null, muscles: [], warmup: [], main: [], cooldown: [], estMinutes: 0 };
}

export function generatePlan(p: Profile, opts: { seed?: number; level?: number } = {}): WorkoutPlan {
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const level = opts.level ?? 1;
  const rand = rng(seed);
  const layout = weekLayout(p.daysPerWeek, p.experience, p.goal);
  const days: PlanDay[] = WEEKDAYS.map((_, dow) => {
    const slot = layout.find((l) => l.dow === dow);
    if (!slot) return dow === 6 || p.daysPerWeek >= 5 ? restDay(dow) : dow % 2 === 1 ? activeRecovery(dow) : restDay(dow);
    if (slot.key === "active") return activeRecovery(dow);
    return buildDay(slot.key, dow, p, level, rand);
  });
  return { version: 1, seed, level, goal: p.goal, days, generatedAt: new Date().toISOString() };
}

/** Re-apply prescriptions at a new level without changing exercise choices or user swaps. */
export function represcribe(plan: WorkoutPlan, p: Profile, level: number): WorkoutPlan {
  const lv = Math.min(5, Math.max(1, level));
  const days = plan.days.map((d) =>
    d.type !== "training"
      ? d
      : {
          ...d,
          main: d.main.map((it) => {
            const ex = getExercise(it.slug);
            return ex ? { ...prescribe(ex, p.goal, p.experience, lv), mode: it.mode } : it;
          }),
        },
  );
  return { ...plan, level: lv, days };
}

export type Feedback = "too_easy" | "just_right" | "too_hard";

/** Auto-difficulty: feedback plus completion rate decide the next level. */
export function nextLevel(current: number, feedback: Feedback | null, completionRate: number): number {
  let lv = current;
  if (completionRate < 0.6 || feedback === "too_hard") lv -= 1;
  else if (feedback === "too_easy" && completionRate >= 0.9) lv += 1;
  return Math.min(5, Math.max(1, lv));
}

export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}
