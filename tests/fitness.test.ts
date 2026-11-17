import { test } from "node:test";
import assert from "node:assert/strict";
import { bmi, bmr, computeTargets } from "../src/lib/fitness/calc.ts";
import { generatePlan, nextLevel, represcribe, availableEquipment, canPerform } from "../src/lib/fitness/planner.ts";
import { getExercise } from "../src/lib/fitness/exercises.ts";
import { generateMealPlan, allowedFoods, macrosOf } from "../src/lib/nutrition/planner.ts";
import type { Profile } from "../src/lib/fitness/types.ts";

const base: Profile = {
  name: "Test", age: 30, gender: "male", heightCm: 175, weightKg: 80, targetWeightKg: 72, experience: "beginner",
  goal: "weight_loss", location: "home", equipment: ["dumbbells"], daysPerWeek: 3, sessionMinutes: 45, diet: ["halal"], allergies: "",
};

test("BMI matches the standard formula and categories", () => {
  const r = bmi(80, 175);
  assert.equal(r.value, 26.1);
  assert.equal(r.category, "Overweight");
  assert.equal(r.asianCategory, "Increased risk");
});

test("Mifflin–St Jeor BMR", () => {
  assert.equal(bmr({ weightKg: 80, heightCm: 175, age: 30, gender: "male" }), 1749);
  assert.equal(bmr({ weightKg: 60, heightCm: 165, age: 30, gender: "female" }), 1320);
});

test("weight-loss deficit is capped and never below BMR", () => {
  const t = computeTargets(base);
  assert.ok(t.tdee - t.calories <= 510);
  assert.ok(t.calories >= t.bmr);
  const tiny = computeTargets({ ...base, gender: "female", weightKg: 45, heightCm: 150, age: 60, daysPerWeek: 2, sessionMinutes: 20 });
  assert.ok(tiny.calories >= 1200 && tiny.calories >= tiny.bmr);
});

test("macros add up to roughly the calorie target", () => {
  const t = computeTargets({ ...base, goal: "muscle_building" });
  const kcal = t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9;
  assert.ok(Math.abs(kcal - t.calories) < 40, `${kcal} vs ${t.calories}`);
});

test("plan respects training days and equipment", () => {
  for (const days of [2, 3, 4, 5, 6]) {
    const plan = generatePlan({ ...base, daysPerWeek: days }, { seed: 42 });
    assert.equal(plan.days.length, 7);
    assert.equal(plan.days.filter((d) => d.type === "training").length, days);
    const eq = availableEquipment(base);
    for (const d of plan.days) for (const it of d.main) {
      const ex = getExercise(it.slug)!;
      assert.ok(ex, it.slug);
      if (d.type === "training") assert.ok(canPerform(ex, eq, "beginner"), `${ex.slug} not doable`);
    }
  }
});

test("plans are reproducible from the seed", () => {
  const a = generatePlan(base, { seed: 7 }), b = generatePlan(base, { seed: 7 });
  assert.deepEqual(a.days, b.days);
});

test("auto-difficulty", () => {
  assert.equal(nextLevel(2, "too_easy", 1), 3);
  assert.equal(nextLevel(2, "too_hard", 1), 1);
  assert.equal(nextLevel(2, "just_right", 0.4), 1);
  assert.equal(nextLevel(5, "too_easy", 1), 5);
  const plan = generatePlan(base, { seed: 1, level: 1 });
  const up = represcribe(plan, base, 4);
  const d0 = plan.days.find((d) => d.type === "training")!;
  const d1 = up.days[d0.dow];
  assert.deepEqual(d1.main.map((i) => i.slug), d0.main.map((i) => i.slug));
  assert.ok(d1.main[0].reps > d0.main[0].reps || d1.main[0].sets > d0.main[0].sets);
});

test("meal plans respect halal / vegan filters and approach targets", () => {
  for (const f of allowedFoods(["halal"])) assert.ok(f.tags.includes("halal"));
  for (const f of allowedFoods(["vegan"])) assert.ok(f.tags.includes("vegan"));
  assert.ok(!allowedFoods([], "peanut").some((f) => f.name.toLowerCase().includes("peanut")));
  const t = computeTargets(base);
  const plan = generateMealPlan("2026-01-01", t, ["halal"], "", 3);
  const m = macrosOf(plan.meals.flatMap((x) => x.items));
  assert.ok(Math.abs(m.kcal - t.calories) / t.calories < 0.2, `${m.kcal} vs ${t.calories}`);
});
