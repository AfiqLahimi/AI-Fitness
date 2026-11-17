import { readLibrary } from "@/lib/media/library";

/** The runtime exercise video library (read by every page that shows exercise media). */
export async function GET() {
  return Response.json(await readLibrary(), { headers: { "Cache-Control": "no-store" } });
}
