import { canManageVideos, requireUser } from "@/lib/server/auth";
import { VideoManager } from "@/components/VideoManager";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Video Library" };

const OPTIONS = [
  { name: "Wan 2.2 (open source)", cost: "Free", tone: "lime", body: "Apache-2.0 model you run on your own computer (e.g. with ComfyUI). Needs a strong NVIDIA GPU — the small 5B model is the realistic home option. No API cost, no watermark; you are responsible for checking the output." },
  { name: "Pexels stock clips", cost: "Free", tone: "lime", body: "Real trainers, free licence. Run npm run videos with a free Pexels key. Search matches aren't always the exact exercise, so review each clip." },
  { name: "Kling AI", cost: "Free web credits · paid API", tone: "amber", body: "The web app gives limited free daily credits. The developer API is paid and needs an application, so Pulse doesn't connect to it. You can still make clips in the web app and upload them here — check Kling's terms for your use." },
  { name: "PixVerse", cost: "Free web credits · paid API", tone: "amber", body: "Free tier adds a watermark and reportedly doesn't allow commercial use; the API starts around US$100/month. Not integrated — check their current terms before using clips." },
] as const;

export default async function VideosPage() {
  const user = await requireUser();
  const canManage = canManageVideos(user);
  return (
    <>
      <PageHeader
        eyebrow="Exercise video library"
        title="Demonstration videos"
        subtitle="Each exercise can have one demonstration video and an optional 'common mistakes' clip. Videos are stored once and reused for every workout — nothing is generated while you train."
      />
      <details className="card mb-6 p-5 open:pb-6">
        <summary className="cursor-pointer select-none font-semibold">How to get realistic videos — free and paid options</summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {OPTIONS.map((o) => (
            <div key={o.name} className="rounded-xl border border-line bg-ink/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{o.name}</p>
                <span className={o.tone === "lime" ? "rounded-full bg-lime/10 px-2 py-0.5 text-xs text-lime" : "rounded-full bg-amber/10 px-2 py-0.5 text-xs text-amber"}>{o.cost}</span>
              </div>
              <p className="mt-1.5 text-sm text-dim">{o.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-dim">Workflow: pick a trainer → create one reference photo → for each exercise, copy the prompt into your tool (image-to-video) → check the technique → upload it here. The full step-by-step guide is in <code>README.md</code>.</p>
      </details>
      <VideoManager canManage={canManage} />
    </>
  );
}
