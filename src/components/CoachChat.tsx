"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowUp, Loader2, Sparkles, Trash2 } from "lucide-react";
import { clearChatAction } from "@/lib/server/actions";
import { cx } from "./ui";

export interface ChatMsg { role: "user" | "assistant"; content: string }

export function CoachChat({
  thread, initial, suggestions, date, configured, providerLabel = "", compact = false,
}: { thread: "coach" | "nutrition"; initial: ChatMsg[]; suggestions: string[]; date: string; configured: boolean; providerLabel?: string; compact?: boolean }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [msgs]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setError(null); setInput(""); setBusy(true);
    setMsgs((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ thread, message, date }) });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({ error: "Request failed." }));
        setMsgs((m) => m.slice(0, -2));
        setInput(message);
        setError(j.error ?? "Request failed.");
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setMsgs((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: c[c.length - 1].content + chunk }; return c; });
      }
    } catch {
      setMsgs((m) => m.slice(0, -2));
      setInput(message);
      setError("Couldn't reach the coach. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cx("card flex flex-col p-0", compact ? "h-[560px]" : "h-[calc(100dvh-13rem)] min-h-[480px] lg:h-[calc(100dvh-11rem)]")}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-lime/15 text-lime"><Sparkles className="h-4 w-4" /></span>
          <div>
            <p className="text-sm font-semibold">{thread === "coach" ? "Pulse Coach" : "Nutrition Coach"}</p>
            <p className="text-[11px] text-mute">Uses your profile, plan, workouts and food log{configured ? ` · ${providerLabel}` : ""}</p>
          </div>
        </div>
        {msgs.length > 0 && (
          <button onClick={() => { setMsgs([]); start(() => clearChatAction(thread)); }} className="grid h-8 w-8 place-items-center rounded-full text-mute hover:bg-white/5 hover:text-fg" aria-label="Clear conversation"><Trash2 className="h-4 w-4" /></button>
        )}
      </div>

      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
        {!configured && (
          <div className="rounded-xl border border-amber/30 bg-amber/10 p-4 text-sm text-amber">
            The AI coach isn&apos;t set up yet. For a free coach, install Ollama, run <code className="rounded bg-black/30 px-1">ollama pull qwen2.5:7b</code> and set <code className="rounded bg-black/30 px-1">OLLAMA_MODEL=qwen2.5:7b</code> in <code className="rounded bg-black/30 px-1">.env.local</code>. Everything else in Pulse works without it.
          </div>
        )}
        {msgs.length === 0 && (
          <div className="flex min-h-[70%] flex-col items-center justify-center text-center">
            <p className="font-display text-xl font-semibold">{thread === "coach" ? "What can I help you with?" : "Ask about food, calories or protein"}</p>
            <p className="mt-1 max-w-sm text-sm text-dim">Answers are personalised to your real numbers. Not medical advice.</p>
            <div className="mt-6 flex max-w-lg flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button key={s} disabled={!configured} onClick={() => send(s)} className="rounded-full border border-line bg-ink px-4 py-2 text-sm text-dim transition hover:border-lime/40 hover:text-fg disabled:opacity-50">{s}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cx("max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed", m.role === "user" ? "rounded-br-md bg-lime text-lime-ink" : "rounded-bl-md bg-raised text-fg")}>
              {m.role === "assistant" && !m.content ? <span className="inline-flex items-center gap-2 text-dim"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</span> : <RichText text={m.content} />}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mx-5 mb-2 rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">{error}</p>}
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2 border-t border-line p-3">
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)} rows={1} maxLength={2000} disabled={!configured}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder={configured ? "Ask your coach…" : "AI coach not configured"}
          className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-ink px-4 py-3 text-sm outline-none placeholder:text-mute focus:border-lime/50"
        />
        <button type="submit" disabled={busy || !input.trim() || !configured} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lime text-lime-ink transition disabled:opacity-40" aria-label="Send">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}

/** Minimal, safe markdown: paragraphs, bullet/numbered lists, **bold**, headings. No HTML injection. */
function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2.5">
      {blocks.map((b, i) => {
        const lines = b.split("\n").filter(Boolean);
        if (lines.length && lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l))) {
          const ordered = /^\s*\d+\./.test(lines[0]);
          const Tag = ordered ? "ol" : "ul";
          return <Tag key={i} className={cx("space-y-1 pl-5", ordered ? "list-decimal" : "list-disc")}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}</li>)}</Tag>;
        }
        if (/^#{1,4}\s/.test(b)) return <p key={i} className="font-semibold">{inline(b.replace(/^#{1,4}\s/, ""))}</p>;
        return <p key={i} className="whitespace-pre-wrap">{inline(b)}</p>;
      })}
    </div>
  );
}
function inline(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part));
}
