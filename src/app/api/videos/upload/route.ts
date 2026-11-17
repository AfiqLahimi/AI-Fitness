import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { canManageVideos, currentUser } from "@/lib/server/auth";
import { getExercise } from "@/lib/fitness/exercises";
import { VIDEOS_DIR, mediaUrl, sniffVideo, updateLibrary, type VideoEntry } from "@/lib/media/library";

export const runtime = "nodejs";
const MAX_BYTES = 200 * 1024 * 1024;

const meta = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  variant: z.enum(["demo", "mistakes"]),
  source: z.enum(["ai", "licensed", "own"]),
  generator: z.string().trim().max(80).optional().default(""),
  trainer: z.string().trim().max(40).optional().default(""),
  credit: z.string().trim().max(120).optional().default(""),
  license: z.string().trim().max(160).optional().default(""),
  rights: z.literal("yes"),
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (!canManageVideos(user)) return Response.json({ error: "Only admins can upload videos. Add your email to ADMIN_EMAILS." }, { status: 403 });

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "Upload failed. Try a smaller file." }, { status: 400 });
  const parsed = meta.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].path[0] === "rights" ? "Please confirm you have the right to use this video." : "Some details are missing or invalid." }, { status: 400 });
  const m = parsed.data;
  if (!getExercise(m.slug)) return Response.json({ error: "Unknown exercise." }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Choose a video file." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Video is larger than 200 MB. Compress it or shorten it first." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffVideo(bytes.subarray(0, 16));
  if (!kind) return Response.json({ error: "That file isn't an MP4 or WebM video." }, { status: 415 });

  await fs.mkdir(VIDEOS_DIR, { recursive: true });
  const name = `${m.slug}${m.variant === "mistakes" ? "-mistakes" : ""}.${kind}`;
  const tmp = path.join(/*turbopackIgnore: true*/ VIDEOS_DIR, `.${randomUUID()}.part`);
  await fs.writeFile(tmp, bytes);
  // Remove the other format so we never serve a stale clip.
  await fs.rm(path.join(/*turbopackIgnore: true*/ VIDEOS_DIR, name.replace(/\.(mp4|webm)$/, kind === "mp4" ? ".webm" : ".mp4")), { force: true });
  await fs.rename(tmp, path.join(/*turbopackIgnore: true*/ VIDEOS_DIR, name));

  const source = [{ src: `${mediaUrl(name)}?v=${Date.now()}`, type: `video/${kind}` }];
  await updateLibrary((lib) => {
    const prev = lib[m.slug];
    const base: VideoEntry = prev?.kind === "video" ? prev : { kind: "video", sources: [] };
    const next: VideoEntry = { ...base, updatedAt: new Date().toISOString() };
    if (m.variant === "mistakes") next.mistakes = source;
    else {
      next.sources = source;
      next.aiGenerated = m.source === "ai";
      next.generator = m.generator || undefined;
      next.trainer = m.trainer || undefined;
      next.credit = m.credit || (m.source === "own" ? "Own recording" : undefined);
      next.license = m.license || undefined;
      next.poster = undefined;
      next.sourceUrl = undefined;
    }
    lib[m.slug] = next;
  });
  return Response.json({ ok: true, file: name });
}
