import path from "node:path";
import { promises as fs } from "node:fs";
import { canManageVideos, currentUser } from "@/lib/server/auth";
import { VIDEOS_DIR, updateLibrary } from "@/lib/media/library";

/** Remove an exercise's demo (?variant=demo) or mistakes clip (?variant=mistakes). */
export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await currentUser();
  if (!canManageVideos(user)) return Response.json({ error: "Not allowed." }, { status: 403 });
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) return Response.json({ error: "Invalid exercise." }, { status: 400 });
  const variant = new URL(req.url).searchParams.get("variant") === "mistakes" ? "mistakes" : "demo";
  const stem = variant === "mistakes" ? `${slug}-mistakes` : slug;
  for (const ext of ["mp4", "webm", "jpg"]) await fs.rm(path.join(/*turbopackIgnore: true*/ VIDEOS_DIR, `${stem}.${ext}`), { force: true });
  await updateLibrary((lib) => {
    const e = lib[slug];
    if (!e || e.kind !== "video") { delete lib[slug]; return; }
    if (variant === "mistakes") delete e.mistakes;
    else if (e.mistakes) lib[slug] = { kind: "video", sources: [], mistakes: e.mistakes };
    else delete lib[slug];
  });
  return Response.json({ ok: true });
}
