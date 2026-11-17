import "server-only";
import path from "node:path";
import { promises as fs } from "node:fs";
import type { VideoEntry, VideoLibrary } from "./provider";

/** Uploaded and downloaded videos live outside /public so they work after a production build. */
export const DATA_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
export const VIDEOS_DIR = path.join(DATA_DIR, "videos");
const LIBRARY_FILE = path.join(DATA_DIR, "video-library.json");

export const VIDEO_FILE_RE = /^[a-z0-9-]+\.(mp4|webm|jpg|png)$/;

export async function readLibrary(): Promise<VideoLibrary> {
  try { return JSON.parse(await fs.readFile(LIBRARY_FILE, "utf8")) as VideoLibrary; } catch { return {}; }
}

let writing: Promise<void> = Promise.resolve();
/** Serialised read-modify-write so two uploads can't overwrite each other's entries. */
export function updateLibrary(fn: (lib: VideoLibrary) => void): Promise<void> {
  writing = writing.then(async () => {
    const lib = await readLibrary();
    fn(lib);
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = LIBRARY_FILE + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(lib, null, 2) + "\n");
    await fs.rename(tmp, LIBRARY_FILE);
  });
  return writing;
}

/** Detect the real file type from its first bytes (never trust the browser's MIME type). */
export function sniffVideo(head: Uint8Array): "mp4" | "webm" | null {
  if (head.length >= 12 && String.fromCharCode(...head.slice(4, 8)) === "ftyp") return "mp4";
  if (head.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return "webm";
  return null;
}

export function mediaUrl(file: string) {
  return `/media/videos/${file}`;
}

export type { VideoEntry };
