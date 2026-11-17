import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";

const COOKIE = "pulse_session";
const TTL_MS = 30 * 24 * 3600 * 1000;

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export interface SessionUser { id: string; email: string; name: string }

export async function createUser(email: string, password: string, name: string): Promise<SessionUser> {
  const db = await getDb();
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (existing) throw new Error("An account with this email already exists.");
  const user = { id: randomUUID(), email, name, passwordHash: await bcrypt.hash(password, 12), createdAt: Date.now() };
  await db.insert(schema.users).values(user);
  return { id: user.id, email, name };
}

export async function verifyUser(email: string, password: string): Promise<SessionUser | null> {
  const db = await getDb();
  const u = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  // Always run a compare to keep timing similar whether or not the email exists.
  const ok = await bcrypt.compare(password, u?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
  return u && ok ? { id: u.id, email: u.email, name: u.name } : null;
}

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const db = await getDb();
  const expiresAt = Date.now() + TTL_MS;
  await db.insert(schema.sessions).values({ id: hash(token), userId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.id, hash(token)));
  }
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const s = await db.query.sessions.findFirst({ where: eq(schema.sessions.id, hash(token)) });
  if (!s || s.expiresAt < Date.now()) return null;
  const u = await db.query.users.findFirst({ where: eq(schema.users.id, s.userId) });
  return u ? { id: u.id, email: u.email, name: u.name } : null;
}

export async function requireUser(): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}

/** Tiny in-memory limiter (per server instance). Use Redis/Upstash when running multiple instances. */
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + windowMs }); return true; }
  if (b.n >= max) return false;
  b.n++;
  return true;
}
