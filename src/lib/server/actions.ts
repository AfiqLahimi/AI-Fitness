"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../db";
import { createUser, endSession, rateLimit, requireUser, startSession, verifyUser } from "./auth";
import {
  clearChat, getActivePlan, getMealPlan, getProfile, logWeight, saveMealPlan, saveNewPlan, saveProfile, updatePlan,
} from "./data";
import { computeTargets } from "../fitness/calc";
import { buildDay, generatePlan, nextLevel, represcribe, rng, TEMPLATES, type Feedback, type TemplateKey } from "../fitness/planner";
import { getExercise } from "../fitness/exercises";
import { generateMealPlan, replaceMeal } from "../nutrition/planner";
import { FOOD_BY_ID, type MealSlot } from "../nutrition/foods";
import type { Profile } from "../fitness/types";

export type ActionState = { error?: string; ok?: boolean } | undefined;

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

// ───────────────────────── Auth

const credentials = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export async function signupAction(_: ActionState, form: FormData): Promise<ActionState> {
  if (!rateLimit(`signup:${await clientKey()}`, 10, 15 * 60_000)) return { error: "Too many attempts. Try again later." };
  const parsed = credentials.extend({ name: z.string().trim().min(1, "Tell us your name.").max(60) }).safeParse({
    email: form.get("email"), password: form.get("password"), name: form.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const u = await createUser(parsed.data.email, parsed.data.password, parsed.data.name);
    await startSession(u.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create account." };
  }
  redirect("/onboarding");
}

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!rateLimit(`login:${await clientKey()}:${parsed.data.email}`, 8, 15 * 60_000))
    return { error: "Too many attempts. Wait a few minutes and try again." };
  const u = await verifyUser(parsed.data.email, parsed.data.password);
  if (!u) return { error: "Email or password is incorrect." };
  await startSession(u.id);
  const profile = await getProfile(u.id);
  redirect(profile ? "/app" : "/onboarding");
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}

// ───────────────────────── Profile

const profileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  age: z.number().int().min(16, "Pulse is designed for people aged 16+.").max(90),
  gender: z.enum(["male", "female", "unspecified"]),
  heightCm: z.number().min(120).max(230),
  weightKg: z.number().min(35).max(250),
  targetWeightKg: z.number().min(35).max(250),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  goal: z.enum(["weight_loss", "muscle_building", "recomposition", "strength", "general_fitness"]),
  location: z.enum(["home", "gym"]),
  equipment: z.array(z.enum(["bodyweight", "dumbbells", "barbell", "kettlebell", "resistance_band", "pullup_bar", "bench", "cable_machine", "machines", "mat"])),
  daysPerWeek: z.number().int().min(2).max(6),
  sessionMinutes: z.number().int().min(20).max(90),
  diet: z.array(z.enum(["halal", "vegetarian", "vegan", "no_beef", "no_seafood", "dairy_free", "low_spice"])),
  allergies: z.string().max(300),
});

export async function saveProfileAction(input: Profile, opts: { regeneratePlan: boolean }): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const existing = await getProfile(user.id);
  // Always build a plan the first time; afterwards only when asked or when training inputs change.
  const trainingChanged =
    !existing ||
    (["goal", "experience", "location", "daysPerWeek", "sessionMinutes"] as const).some((k) => existing[k] !== parsed.data[k]) ||
    existing.equipment.join() !== parsed.data.equipment.join();
  await saveProfile(user.id, parsed.data, { regeneratePlan: opts.regeneratePlan || trainingChanged });
  revalidatePath("/app", "layout");
  return { ok: true };
}

// ───────────────────────── Workout plan

async function loadPlanContext() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile) redirect("/onboarding");
  const active = await getActivePlan(user.id);
  return { user, profile, active };
}

export async function regeneratePlanAction() {
  const { user, profile, active } = await loadPlanContext();
  await saveNewPlan(user.id, generatePlan(profile, { level: active?.plan.level ?? 1 }));
  revalidatePath("/app", "layout");
}

const dowSchema = z.number().int().min(0).max(6);

export async function setDayTemplateAction(dow: number, key: TemplateKey | "rest" | "active") {
  const { user, profile, active } = await loadPlanContext();
  if (!active) return;
  dowSchema.parse(dow);
  const plan = active.plan;
  const day =
    key === "rest"
      ? { dow, type: "rest" as const, title: "Rest Day", templateKey: null, muscles: [], warmup: [], main: [], cooldown: [], estMinutes: 0 }
      : key === "active"
        ? generatePlan({ ...profile, daysPerWeek: 4 }, { seed: plan.seed, level: plan.level }).days.find((d) => d.type === "active_recovery")!
        : (() => {
            if (!(key in TEMPLATES)) throw new Error("Unknown template");
            return buildDay(key, dow, profile, plan.level, rng(Date.now() & 0xffffff));
          })();
  plan.days[dow] = { ...day, dow };
  await updatePlan(user.id, active.id, plan);
  revalidatePath("/app", "layout");
}

export async function swapExerciseAction(dow: number, index: number, slug: string) {
  const { user, profile, active } = await loadPlanContext();
  if (!active) return;
  dowSchema.parse(dow);
  const ex = getExercise(slug);
  const day = active.plan.days[dow];
  if (!ex || !day?.main[index]) return;
  const repl = represcribe({ ...active.plan, days: [{ ...day, main: [{ ...day.main[index], slug }] }] }, profile, active.plan.level).days[0].main[0];
  day.main[index] = { ...repl, mode: ex.defaultMode };
  await updatePlan(user.id, active.id, active.plan);
  revalidatePath("/app", "layout");
}

export async function setItemModeAction(dow: number, index: number, mode: "reps" | "time") {
  const { user, active } = await loadPlanContext();
  if (!active) return;
  const item = active.plan.days[dow]?.main[index];
  if (!item) return;
  item.mode = mode === "time" ? "time" : "reps";
  await updatePlan(user.id, active.id, active.plan);
  revalidatePath("/app", "layout");
}

const completeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dow: dowSchema,
  title: z.string().max(120),
  durationSec: z.number().int().min(0).max(6 * 3600),
  setsDone: z.number().int().min(0).max(500),
  setsTotal: z.number().int().min(0).max(500),
  exercisesDone: z.number().int().min(0).max(100),
  exercisesTotal: z.number().int().min(0).max(100),
  kcalEstimate: z.number().int().min(0).max(5000),
  feedback: z.enum(["too_easy", "just_right", "too_hard"]).nullable(),
});

export async function completeWorkoutAction(input: z.infer<typeof completeSchema>): Promise<{ level: number; previousLevel: number } | { error: string }> {
  const user = await requireUser();
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const db = await getDb();
  await db.insert(schema.workoutSessions).values({ id: randomUUID(), userId: user.id, ...d, createdAt: Date.now() });

  const profile = await getProfile(user.id);
  const active = await getActivePlan(user.id);
  let level = active?.plan.level ?? 1;
  const previousLevel = level;
  if (profile && active) {
    level = nextLevel(level, d.feedback as Feedback | null, d.setsTotal ? d.setsDone / d.setsTotal : 1);
    if (level !== previousLevel) await updatePlan(user.id, active.id, represcribe(active.plan, profile, level));
  }
  revalidatePath("/app", "layout");
  return { level, previousLevel };
}

// ───────────────────────── Weight

export async function logWeightAction(date: string, weightKg: number): Promise<ActionState> {
  const user = await requireUser();
  const ok = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), weightKg: z.number().min(30).max(300) }).safeParse({ date, weightKg });
  if (!ok.success) return { error: "Enter a weight between 30 and 300 kg." };
  const profile = await getProfile(user.id);
  if (!profile) return { error: "Complete your profile first." };
  await logWeight(user.id, date, weightKg, profile.heightCm);
  // Keep the profile's current weight in sync when logging today's (or the latest) weight.
  await saveProfile(user.id, { ...profile, weightKg }, { regeneratePlan: false });
  revalidatePath("/app", "layout");
  return { ok: true };
}

// ───────────────────────── Nutrition

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const slotSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export async function generateMealPlanAction(date: string) {
  const user = await requireUser();
  dateSchema.parse(date);
  const profile = await getProfile(user.id);
  if (!profile) redirect("/onboarding");
  const t = computeTargets(profile);
  await saveMealPlan(user.id, generateMealPlan(date, t, profile.diet, profile.allergies));
  revalidatePath("/app/nutrition");
}

export async function replaceMealAction(date: string, slot: MealSlot) {
  const user = await requireUser();
  dateSchema.parse(date);
  slotSchema.parse(slot);
  const profile = await getProfile(user.id);
  const plan = await getMealPlan(user.id, date);
  if (!profile || !plan) return;
  await saveMealPlan(user.id, replaceMeal(plan, slot, computeTargets(profile), profile.diet, profile.allergies));
  revalidatePath("/app/nutrition");
}

export async function logFoodAction(date: string, slot: MealSlot, foodId: string, servings: number) {
  const user = await requireUser();
  dateSchema.parse(date);
  slotSchema.parse(slot);
  const s = z.number().min(0.25).max(10).parse(servings);
  const f = FOOD_BY_ID.get(foodId);
  if (!f) return;
  const db = await getDb();
  await db.insert(schema.foodLogs).values({
    id: randomUUID(), userId: user.id, date, slot, name: f.name, foodId: f.id, servings: s,
    kcal: f.kcal * s, protein: f.protein * s, carbs: f.carbs * s, fat: f.fat * s, createdAt: Date.now(),
  });
  revalidatePath("/app", "layout");
}

const customFood = z.object({
  name: z.string().trim().min(1).max(80),
  kcal: z.number().min(0).max(5000),
  protein: z.number().min(0).max(400),
  carbs: z.number().min(0).max(800),
  fat: z.number().min(0).max(400),
});

export async function logCustomFoodAction(date: string, slot: MealSlot, food: z.infer<typeof customFood>): Promise<ActionState> {
  const user = await requireUser();
  dateSchema.parse(date);
  slotSchema.parse(slot);
  const parsed = customFood.safeParse(food);
  if (!parsed.success) return { error: "Check the food name and numbers." };
  const db = await getDb();
  await db.insert(schema.foodLogs).values({ id: randomUUID(), userId: user.id, date, slot, foodId: null, servings: 1, ...parsed.data, createdAt: Date.now() });
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function logMealFromPlanAction(date: string, slot: MealSlot) {
  const user = await requireUser();
  const plan = await getMealPlan(user.id, date);
  const meal = plan?.meals.find((m) => m.slot === slot);
  if (!meal) return;
  for (const it of meal.items) await logFoodAction(date, slot, it.foodId, it.servings);
}

export async function deleteFoodLogAction(id: string) {
  const user = await requireUser();
  const db = await getDb();
  await db.delete(schema.foodLogs).where(and(eq(schema.foodLogs.id, z.string().uuid().parse(id)), eq(schema.foodLogs.userId, user.id)));
  revalidatePath("/app", "layout");
}

// ───────────────────────── Coach

export async function clearChatAction(thread: "coach" | "nutrition") {
  const user = await requireUser();
  await clearChat(user.id, z.enum(["coach", "nutrition"]).parse(thread));
  revalidatePath("/app/coach");
  revalidatePath("/app/nutrition");
}

