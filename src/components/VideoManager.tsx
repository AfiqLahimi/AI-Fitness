"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Copy, Film, Loader2, Sparkles, Trash2, Upload, X, AlertTriangle } from "lucide-react";
import { EXERCISES, type Exercise } from "@/lib/fitness/exercises";
import { resolveMedia } from "@/lib/media/provider";
import { refreshVideoLibrary, useVideoLibrary } from "@/lib/media/useVideoLibrary";
import { TRAINERS, characterPrompt, demoPrompt, mistakesPrompt, NEGATIVE_PROMPT } from "@/lib/media/prompts";
import { ExerciseMedia } from "./studio/ExerciseMedia";
import { Button, Pill, cx } from "./ui";

type Filter = "all" | "missing" | "done";

export function VideoManager({ canManage }: { canManage: boolean }) {
  const library = useVideoLibrary();
  const [filter, setFilter] = useState<Filter>("missing");
  const [open, setOpen] = useState<Exercise | null>(null);
  const status = (slug: string) => {
    const m = resolveMedia(slug, library);
    return { video: m.kind !== "none" && !(m.kind === "video" && !m.sources.length), mistakes: m.kind === "video" && !!m.mistakes?.length, media: m };
  };
  const done = EXERCISES.filter((e) => status(e.slug).video).length;
  const list = EXERCISES.filter((e) => (filter === "all" ? true : filter === "done" ? status(e.slug).video : !status(e.slug).video));

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-dim"><span className="font-semibold text-fg tabular">{done} / {EXERCISES.length}</span> exercises have a real demonstration video. The rest show the 3D muscle model (and a clear "no video yet" label) until you add one.</p>
        <div className="flex gap-1.5">
          {(["missing", "done", "all"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cx("rounded-full px-4 py-2 text-sm transition", filter === f ? "bg-lime font-semibold text-lime-ink" : "bg-white/5 text-dim hover:text-fg")}>
              {f === "missing" ? "Needs video" : f === "done" ? "Has video" : "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((e) => {
          const st = status(e.slug);
          return (
            <button key={e.slug} onClick={() => setOpen(e)} className="card overflow-hidden p-0 text-left transition hover:border-line-strong">
              <div className="aspect-video bg-ink"><ExerciseMedia exercise={e} compact showBadge={false} playing={false} /></div>
              <div className="flex items-center justify-between gap-2 p-3.5">
                <span className="truncate text-sm font-semibold">{e.name}</span>
                {st.video ? <Pill tone="lime"><Film className="h-3 w-3" />Video{st.mistakes ? " + mistakes" : ""}</Pill> : <Pill tone="amber">No video yet</Pill>}
              </div>
            </button>
          );
        })}
        {list.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-line-strong p-10 text-center text-sm text-mute">Nothing here. {filter === "missing" ? "Every exercise has a video — nice!" : "No videos yet."}</p>}
      </div>

      {open && <VideoSheet exercise={open} canManage={canManage} onClose={() => setOpen(null)} />}
    </>
  );
}

function CopyBox({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-mute">{label}</p>
        <button onClick={() => { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-lime hover:bg-lime/10">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="max-h-36 overflow-y-auto rounded-xl border border-line bg-ink p-3 text-xs leading-relaxed text-dim">{text}</p>
    </div>
  );
}

function VideoSheet({ exercise: e, canManage, onClose }: { exercise: Exercise; canManage: boolean; onClose: () => void }) {
  const library = useVideoLibrary();
  const media = resolveMedia(e.slug, library);
  const hasDemo = media.kind === "embed" || (media.kind === "video" && media.sources.length > 0);
  const hasMistakes = media.kind === "video" && !!media.mistakes?.length;
  const [trainerId, setTrainerId] = useState(TRAINERS[0].id);
  const trainer = TRAINERS.find((t) => t.id === trainerId)!;
  const [tab, setTab] = useState<"demo" | "mistakes">("demo");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center" onClick={onClose} role="dialog" aria-modal aria-label={`${e.name} video`}>
      <div className="card max-h-[94dvh] w-full max-w-5xl overflow-y-auto p-0 md:rounded-[1.5rem]" onClick={(ev) => ev.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div><p className="text-xs uppercase tracking-wider text-mute">Video library</p><p className="font-display text-xl font-bold">{e.name}</p></div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/5" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[1.1fr_1fr] md:p-6">
          <div className="space-y-3">
            <div className="flex gap-1">
              {(["demo", "mistakes"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={cx("rounded-full px-3.5 py-1.5 text-sm", tab === t ? "bg-white/10 text-fg" : "text-mute hover:text-fg")}>{t === "demo" ? "Demonstration" : "Common mistakes"}</button>
              ))}
            </div>
            <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-ink">
              <ExerciseMedia exercise={e} variant={tab} controls />
            </div>
            <p className="text-xs text-mute">
              {tab === "demo"
                ? hasDemo ? `Real video${media.kind === "video" && media.aiGenerated ? " (AI-generated)" : ""}${media.kind === "video" && media.credit ? ` · ${media.credit}` : ""}${media.kind === "video" && media.license ? ` · ${media.license}` : ""}` : "No video yet. Until you add one, the app shows the 3D muscle model and says that no video exists."
                : hasMistakes ? "Mistakes clip uploaded." : "Optional. Without it, the app lists the common mistakes as text."}
            </p>
            {canManage && ((tab === "demo" && hasDemo && media.kind === "video") || (tab === "mistakes" && hasMistakes)) && (
              <DeleteButton slug={e.slug} variant={tab} />
            )}
          </div>

          <div className="space-y-5">
            <div>
              <p className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-lime" /> Make this video with AI</p>
              <p className="mt-1 text-sm text-dim">Use the same fictional trainer for every exercise so your library looks consistent.</p>
              <div className="mt-3 flex gap-2">
                {TRAINERS.map((t) => (
                  <button key={t.id} onClick={() => setTrainerId(t.id)} className={cx("rounded-full border px-3.5 py-1.5 text-sm", trainerId === t.id ? "border-lime/60 bg-lime/10 text-lime" : "border-line text-dim")}>{t.name}</button>
                ))}
              </div>
            </div>
            <ol className="space-y-4 text-sm">
              <li><CopyBox label="1 · Trainer reference photo (make once, reuse)" text={characterPrompt(trainer)} /></li>
              <li><CopyBox label={`2 · ${tab === "demo" ? "Demonstration" : "Mistakes"} video prompt (image-to-video)`} text={tab === "demo" ? demoPrompt(e, trainer) : mistakesPrompt(e, trainer)} /></li>
              <li><CopyBox label="Negative prompt (if your tool has one)" text={NEGATIVE_PROMPT} /></li>
            </ol>
            <p className="flex gap-2 rounded-xl border border-amber/30 bg-amber/10 p-3 text-xs text-amber">
              <AlertTriangle className="h-4 w-4 shrink-0" /> AI video can get technique wrong (bent wrists, swinging, odd joints). Watch every clip carefully before uploading — beginners will copy it.
            </p>
            {canManage ? <UploadForm slug={e.slug} variant={tab} trainer={trainer.id} /> : (
              <p className="rounded-xl border border-line bg-ink p-3 text-sm text-dim">Only admins can upload videos. Add your email to <code>ADMIN_EMAILS</code> in <code>.env.local</code>.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteButton({ slug, variant }: { slug: string; variant: "demo" | "mistakes" }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="danger" size="sm" disabled={busy} onClick={async () => {
      if (!confirm("Remove this video from the library? The file will be deleted.")) return;
      setBusy(true);
      await fetch(`/api/videos/${slug}?variant=${variant}`, { method: "DELETE" });
      await refreshVideoLibrary();
      setBusy(false);
    }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Remove video</Button>
  );
}

function UploadForm({ slug, variant, trainer }: { slug: string; variant: "demo" | "mistakes"; trainer: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<"ai" | "licensed" | "own">("ai");
  const [generator, setGenerator] = useState("Wan 2.2 (local)");
  const [credit, setCredit] = useState("");
  const [license, setLicense] = useState("");
  const [rights, setRights] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const sizeMb = useMemo(() => (file ? (file.size / 1024 / 1024).toFixed(1) : ""), [file]);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!file) return setMsg({ ok: false, text: "Choose a video file first." });
    const fd = new FormData();
    Object.entries({ slug, variant, source, generator: source === "ai" ? generator : "", trainer: source === "ai" ? trainer : "", credit, license, rights: rights ? "yes" : "" }).forEach(([k, v]) => fd.append(k, v));
    fd.append("file", file);
    // XHR (not fetch) so we can show upload progress for large videos.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/videos/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = async () => {
      setProgress(null);
      let body: { error?: string } = {};
      try { body = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        setMsg({ ok: true, text: "Uploaded! It now plays everywhere this exercise appears." });
        setFile(null); if (input.current) input.current.value = "";
        await refreshVideoLibrary();
      } else setMsg({ ok: false, text: body.error ?? `Upload failed (${xhr.status}).` });
    };
    xhr.onerror = () => { setProgress(null); setMsg({ ok: false, text: "Upload failed. Is the dev server still running?" }); };
    setMsg(null); setProgress(0);
    xhr.send(fd);
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line bg-ink/60 p-4">
      <p className="flex items-center gap-2 font-semibold"><Upload className="h-4 w-4 text-lime" /> Upload {variant === "demo" ? "demonstration" : "mistakes"} video</p>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-line-strong px-4 py-3 text-sm hover:border-lime/50">
        <span className="truncate text-dim">{file ? `${file.name} · ${sizeMb} MB` : "Choose an MP4 or WebM file (max 200 MB)"}</span>
        <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs">Browse</span>
        <input ref={input} type="file" accept="video/mp4,video/webm" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <div className="grid grid-cols-3 gap-1 rounded-full bg-panel p-1 text-xs">
        {([["ai", "AI-generated"], ["licensed", "Licensed / stock"], ["own", "My own recording"]] as const).map(([v, l]) => (
          <button type="button" key={v} onClick={() => setSource(v)} className={cx("rounded-full py-1.5", source === v ? "bg-raised font-semibold text-fg" : "text-mute")}>{l}</button>
        ))}
      </div>
      {source === "ai" && (
        <input value={generator} onChange={(e) => setGenerator(e.target.value)} placeholder="Tool used (e.g. Wan 2.2 local, Kling web app)" className="h-10 w-full rounded-xl border border-line bg-ink px-3 text-sm outline-none focus:border-lime/50" />
      )}
      <div className="grid grid-cols-2 gap-2">
        <input value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="Credit (optional)" className="h-10 rounded-xl border border-line bg-ink px-3 text-sm outline-none focus:border-lime/50" />
        <input value={license} onChange={(e) => setLicense(e.target.value)} placeholder="Licence (e.g. Pexels License)" className="h-10 rounded-xl border border-line bg-ink px-3 text-sm outline-none focus:border-lime/50" />
      </div>
      <label className="flex items-start gap-2 text-xs text-dim">
        <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-0.5 accent-[#c6ff3d]" />
        I have the right to use this video (my own, properly licensed, or generated under terms that allow this use) and I checked the technique is correct.
      </label>
      {progress !== null && <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-lime transition-all" style={{ width: `${progress}%` }} /></div>}
      {msg && <p className={cx("text-sm", msg.ok ? "text-lime" : "text-coral")} role="status">{msg.text}</p>}
      <Button type="submit" className="w-full" disabled={progress !== null || !file || !rights}>
        {progress !== null ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading {progress}%</> : <><Upload className="h-4 w-4" /> Upload video</>}
      </Button>
    </form>
  );
}
