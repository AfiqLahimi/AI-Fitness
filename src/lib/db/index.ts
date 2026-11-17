import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Idempotent DDL kept in sync with schema.ts. For larger teams, switch to drizzle-kit migrations.
const DDL = `
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS profiles (user_id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS weight_logs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, date TEXT NOT NULL, weight_kg REAL NOT NULL, bmi REAL NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS weight_user_date ON weight_logs(user_id, date);
CREATE TABLE IF NOT EXISTS workout_plans (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, data TEXT NOT NULL, active INTEGER NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS plans_user ON workout_plans(user_id, active);
CREATE TABLE IF NOT EXISTS workout_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, date TEXT NOT NULL, title TEXT NOT NULL, dow INTEGER NOT NULL, duration_sec INTEGER NOT NULL, sets_done INTEGER NOT NULL, sets_total INTEGER NOT NULL, exercises_done INTEGER NOT NULL, exercises_total INTEGER NOT NULL, kcal_estimate INTEGER NOT NULL, feedback TEXT, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS ws_user_date ON workout_sessions(user_id, date);
CREATE TABLE IF NOT EXISTS meal_plans (user_id TEXT NOT NULL, date TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS meal_user_date ON meal_plans(user_id, date);
CREATE TABLE IF NOT EXISTS food_logs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, date TEXT NOT NULL, slot TEXT NOT NULL, name TEXT NOT NULL, food_id TEXT, servings REAL NOT NULL, kcal REAL NOT NULL, protein REAL NOT NULL, carbs REAL NOT NULL, fat REAL NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS food_user_date ON food_logs(user_id, date);
CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, thread TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS chat_user_thread ON chat_messages(user_id, thread, created_at);
`;

type DB = ReturnType<typeof drizzle<typeof schema>>;
const g = globalThis as unknown as { __pulseDb?: { client: Client; db: DB; ready: Promise<void> } };

function init() {
  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:./data/pulse.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });
  const ready = client.executeMultiple(DDL);
  return { client, db, ready };
}

export async function getDb(): Promise<DB> {
  g.__pulseDb ??= init();
  await g.__pulseDb.ready;
  return g.__pulseDb.db;
}

export { schema };
