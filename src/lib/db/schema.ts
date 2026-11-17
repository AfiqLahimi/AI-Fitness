import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // sha256 of the cookie token
  userId: text("user_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  data: text("data").notNull(), // JSON Profile
  updatedAt: integer("updated_at").notNull(),
});

export const weightLogs = sqliteTable(
  "weight_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD
    weightKg: real("weight_kg").notNull(),
    bmi: real("bmi").notNull(),
  },
  (t) => [uniqueIndex("weight_user_date").on(t.userId, t.date)],
);

export const workoutPlans = sqliteTable(
  "workout_plans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    data: text("data").notNull(), // JSON WorkoutPlan
    active: integer("active").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("plans_user").on(t.userId, t.active)],
);

export const workoutSessions = sqliteTable(
  "workout_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    date: text("date").notNull(),
    title: text("title").notNull(),
    dow: integer("dow").notNull(),
    durationSec: integer("duration_sec").notNull(),
    setsDone: integer("sets_done").notNull(),
    setsTotal: integer("sets_total").notNull(),
    exercisesDone: integer("exercises_done").notNull(),
    exercisesTotal: integer("exercises_total").notNull(),
    kcalEstimate: integer("kcal_estimate").notNull(),
    feedback: text("feedback"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("ws_user_date").on(t.userId, t.date)],
);

export const mealPlans = sqliteTable(
  "meal_plans",
  {
    userId: text("user_id").notNull(),
    date: text("date").notNull(),
    data: text("data").notNull(),
  },
  (t) => [uniqueIndex("meal_user_date").on(t.userId, t.date)],
);

export const foodLogs = sqliteTable(
  "food_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    date: text("date").notNull(),
    slot: text("slot").notNull(),
    name: text("name").notNull(),
    foodId: text("food_id"),
    servings: real("servings").notNull(),
    kcal: real("kcal").notNull(),
    protein: real("protein").notNull(),
    carbs: real("carbs").notNull(),
    fat: real("fat").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("food_user_date").on(t.userId, t.date)],
);

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    thread: text("thread").notNull(), // "coach" | "nutrition"
    role: text("role").notNull(), // "user" | "assistant"
    content: text("content").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("chat_user_thread").on(t.userId, t.thread, t.createdAt)],
);
