import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { Profile } from "../fitness/types";
import { bmi, computeTargets } from "../fitness/calc";
import { generatePlan, type WorkoutPlan } from "../fitness/planner";
import type { MealPlan } from "../nutrition/planner";

const TZ = process.env.APP_TIMEZONE ?? "Asia/Kuala_Lumpur";
const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** Today's date (YYYY-MM-DD) in the app's timezone (APP_TIMEZONE, default Asia/Kuala_Lumpur). */
export function today(): string {
  return fmt.format(new Date());
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const db = await getDb();
  const row = await db.query.profiles.findFirst({ where: eq(schema.profiles.userId, userId) });
  return row ? (JSON.parse(row.data) as Profile) : null;
}

export async function saveProfile(userId: string, p: Profile, opts: { regeneratePlan: boolean }) {
  const db = await getDb();
  const data = JSON.stringify(p);
  await db.insert(schema.profiles).values({ userId, data, updatedAt: Date.now() })
    .onConflictDoUpdate({ target: schema.profiles.userId, set: { data, updatedAt: Date.now() } });
  await logWeight(userId, today(), p.weightKg, p.heightCm);
  if (opts.regeneratePlan) await saveNewPlan(userId, generatePlan(p));
}

export async function logWeight(userId: string, date: string, weightKg: number, heightCm: number) {
  const db = await getDb();
  const b = bmi(weightKg, heightCm).value;
  await db.insert(schema.weightLogs).values({ id: randomUUID(), userId, date, weightKg, bmi: b })
    .onConflictDoUpdate({ target: [schema.weightLogs.userId, schema.weightLogs.date], set: { weightKg, bmi: b } });
}

export async function getWeights(userId: string) {
  const db = await getDb();
  return db.select().from(schema.weightLogs).where(eq(schema.weightLogs.userId, userId)).orderBy(asc(schema.weightLogs.date));
}

export async function getActivePlan(userId: string): Promise<{ id: string; plan: WorkoutPlan } | null> {
  const db = await getDb();
  const row = await db.query.workoutPlans.findFirst({
    where: and(eq(schema.workoutPlans.userId, userId), eq(schema.workoutPlans.active, 1)),
    orderBy: desc(schema.workoutPlans.createdAt),
  });
  return row ? { id: row.id, plan: JSON.parse(row.data) as WorkoutPlan } : null;
}

export async function saveNewPlan(userId: string, plan: WorkoutPlan) {
  const db = await getDb();
  await db.update(schema.workoutPlans).set({ active: 0 }).where(eq(schema.workoutPlans.userId, userId));
  await db.insert(schema.workoutPlans).values({ id: randomUUID(), userId, data: JSON.stringify(plan), active: 1, createdAt: Date.now() });
}

export async function updatePlan(userId: string, planId: string, plan: WorkoutPlan) {
  const db = await getDb();
  await db.update(schema.workoutPlans).set({ data: JSON.stringify(plan) })
    .where(and(eq(schema.workoutPlans.id, planId), eq(schema.workoutPlans.userId, userId)));
}

export async function getSessions(userId: string, sinceDate?: string) {
  const db = await getDb();
  const where = sinceDate
    ? and(eq(schema.workoutSessions.userId, userId), gte(schema.workoutSessions.date, sinceDate))
    : eq(schema.workoutSessions.userId, userId);
  return db.select().from(schema.workoutSessions).where(where).orderBy(desc(schema.workoutSessions.createdAt));
}

export async function getMealPlan(userId: string, date: string): Promise<MealPlan | null> {
  const db = await getDb();
  const row = await db.query.mealPlans.findFirst({ where: and(eq(schema.mealPlans.userId, userId), eq(schema.mealPlans.date, date)) });
  return row ? (JSON.parse(row.data) as MealPlan) : null;
}

export async function saveMealPlan(userId: string, plan: MealPlan) {
  const db = await getDb();
  const data = JSON.stringify(plan);
  await db.insert(schema.mealPlans).values({ userId, date: plan.date, data })
    .onConflictDoUpdate({ target: [schema.mealPlans.userId, schema.mealPlans.date], set: { data } });
}

export async function getFoodLogs(userId: string, date: string) {
  const db = await getDb();
  return db.select().from(schema.foodLogs)
    .where(and(eq(schema.foodLogs.userId, userId), eq(schema.foodLogs.date, date)))
    .orderBy(asc(schema.foodLogs.createdAt));
}

export async function getFoodLogsSince(userId: string, since: string) {
  const db = await getDb();
  return db.select().from(schema.foodLogs)
    .where(and(eq(schema.foodLogs.userId, userId), gte(schema.foodLogs.date, since)));
}

export async function getChat(userId: string, thread: string, limit = 40) {
  const db = await getDb();
  const rows = await db.select().from(schema.chatMessages)
    .where(and(eq(schema.chatMessages.userId, userId), eq(schema.chatMessages.thread, thread)))
    .orderBy(desc(schema.chatMessages.createdAt)).limit(limit);
  return rows.reverse();
}

export async function addChat(userId: string, thread: string, role: "user" | "assistant", content: string) {
  const db = await getDb();
  await db.insert(schema.chatMessages).values({ id: randomUUID(), userId, thread, role, content, createdAt: Date.now() });
}

export async function clearChat(userId: string, thread: string) {
  const db = await getDb();
  await db.delete(schema.chatMessages).where(and(eq(schema.chatMessages.userId, userId), eq(schema.chatMessages.thread, thread)));
}

export function dateNDaysAgo(n: number): string {
  return fmt.format(new Date(Date.now() - n * 86400000));
}

export { computeTargets };
