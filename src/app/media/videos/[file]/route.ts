import path from "node:path";
import { createReadStream, promises as fs } from "node:fs";
import { Readable } from "node:stream";
import { VIDEOS_DIR, VIDEO_FILE_RE } from "@/lib/media/library";

const TYPES: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", jpg: "image/jpeg", png: "image/png" };

/** Streams library videos with HTTP Range support so the browser can seek and loop smoothly. */
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!VIDEO_FILE_RE.test(file)) return new Response("Not found", { status: 404 });
  const full = path.join(/*turbopackIgnore: true*/ VIDEOS_DIR, file);
  const stat = await fs.stat(full).catch(() => null);
  if (!stat?.isFile()) return new Response("Not found", { status: 404 });
  const type = TYPES[file.split(".").pop()!];
  const headers: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=3600" };

  const range = req.headers.get("range");
  const m = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : stat.size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : stat.size - 1;
    start = Math.max(0, start); end = Math.min(stat.size - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
    const body = Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream;
    return new Response(body, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": String(end - start + 1) } });
  }
  const body = Readable.toWeb(createReadStream(full)) as ReadableStream;
  return new Response(body, { headers: { ...headers, "Content-Length": String(stat.size) } });
}
