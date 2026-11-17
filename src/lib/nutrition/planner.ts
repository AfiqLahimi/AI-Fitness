import type { DietPreference } from "../fitness/types";
import { FOODS, FOOD_BY_ID, type Food, type MealSlot } from "./foods";

export interface MealEntry {
  slot: MealSlot;
  items: { foodId: string; servings: number }[];
}
export interface MealPlan {
  date: string;
  seed: number;
  meals: MealEntry[];
}
export interface Macros { kcal: number; protein: number; carbs: number; fat: number }

export const SLOT_SPLIT: Record<MealSlot, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 };
export const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

export function allowedFoods(diet: DietPreference[], allergies = ""): Food[] {
  const banned = allergies.toLowerCase().split(/[,;\n]/).map((s) => s.trim()).filter((s) => s.length > 2);
  return FOODS.filter((f) => {
    if (diet.includes("halal") && !f.tags.includes("halal")) return false;
    if (diet.includes("vegan") && !f.tags.includes("vegan")) return false;
    if (diet.includes("vegetarian") && !f.tags.includes("vegetarian")) return false;
    if (diet.includes("no_beef") && f.tags.includes("beef")) return false;
    if (diet.includes("no_seafood") && f.tags.includes("seafood")) return false;
    if (diet.includes("dairy_free") && f.tags.includes("dairy")) return false;
    if (diet.includes("low_spice") && f.tags.includes("spicy")) return false;
    const n = f.name.toLowerCase();
    if (banned.some((b) => n.includes(b))) return false;
    return true;
  });
}

export function macrosOf(items: { foodId: string; servings: number }[]): Macros {
  return items.reduce<Macros>(
    (acc, it) => {
      const f = FOOD_BY_ID.get(it.foodId);
      if (!f) return acc;
      acc.kcal += f.kcal * it.servings;
      acc.protein += f.protein * it.servings;
      acc.carbs += f.carbs * it.servings;
      acc.fat += f.fat * it.servings;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function rand(seed: number) {
  let s = seed >>> 0 || 7;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

/** Pick the best meal for a slot: one main dish, optionally a side to close a calorie/protein gap. */
function pickSlot(slot: MealSlot, pool: Food[], kcalT: number, proteinT: number, r: () => number, exclude: Set<string>) {
  const candidates = pool.filter((f) => f.slots.includes(slot) && !exclude.has(f.id));
  if (!candidates.length) return { slot, items: [] };
  const score = (m: Macros) =>
    Math.abs(m.kcal - kcalT) / kcalT + Math.max(0, proteinT - m.protein) / Math.max(proteinT, 1) * 0.8 + (m.kcal > kcalT * 1.15 ? 0.5 : 0);

  let best: { items: { foodId: string; servings: number }[]; s: number } | null = null;
  for (const main of candidates) {
    const single = [{ foodId: main.id, servings: 1 }];
    const opts: { foodId: string; servings: number }[][] = [single];
    if (slot !== "snack") {
      for (const side of pool) {
        if (side.id === main.id || !side.slots.includes("snack") || side.kcal > kcalT * 0.5) continue;
        opts.push([...single, { foodId: side.id, servings: 1 }]);
      }
    }
    for (const o of opts) {
      const s = score(macrosOf(o)) + r() * 0.35; // randomness keeps plans varied
      if (!best || s < best.s) best = { items: o, s };
    }
  }
  return { slot, items: best!.items };
}

export function generateMealPlan(
  date: string,
  targets: { calories: number; proteinG: number },
  diet: DietPreference[],
  allergies: string,
  seed = Math.floor(Math.random() * 1e9),
): MealPlan {
  const pool = allowedFoods(diet, allergies);
  const r = rand(seed);
  const used = new Set<string>();
  const meals = SLOTS.map((slot) => {
    const m = pickSlot(slot, pool, targets.calories * SLOT_SPLIT[slot], targets.proteinG * SLOT_SPLIT[slot], r, used);
    m.items.forEach((i) => used.add(i.foodId));
    return m;
  });
  return { date, seed, meals };
}

export function replaceMeal(plan: MealPlan, slot: MealSlot, targets: { calories: number; proteinG: number }, diet: DietPreference[], allergies: string): MealPlan {
  const pool = allowedFoods(diet, allergies);
  const current = new Set(plan.meals.flatMap((m) => m.items.map((i) => i.foodId)));
  const r = rand(Date.now() & 0xffffffff);
  const next = pickSlot(slot, pool, targets.calories * SLOT_SPLIT[slot], targets.proteinG * SLOT_SPLIT[slot], r, current);
  if (!next.items.length) return plan;
  return { ...plan, meals: plan.meals.map((m) => (m.slot === slot ? next : m)) };
}
