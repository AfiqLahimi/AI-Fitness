import "server-only";

/**
 * Which model powers the AI coach.
 *  - "ollama": a free, open-source model running locally via Ollama (no API cost)
 *  - "claude": Anthropic's Claude API (paid, needs ANTHROPIC_API_KEY)
 *  - null: not configured; the coach UI says so and the rest of the app works normally
 * Ollama wins when OLLAMA_MODEL is set, so you can stay on the free option.
 */
export type CoachProvider = "ollama" | "claude" | null;

export function coachProvider(): CoachProvider {
  if (process.env.OLLAMA_MODEL) return "ollama";
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return "claude";
  return null;
}

export function coachProviderLabel(p: CoachProvider): string {
  return p === "ollama" ? `${process.env.OLLAMA_MODEL} (local, free)` : p === "claude" ? "Claude" : "not configured";
}

export interface ChatTurn { role: "user" | "assistant"; content: string }

/** Stream a reply from a local Ollama server (NDJSON from POST /api/chat). */
export async function* streamOllama(system: string, messages: ChatTurn[], signal?: AbortSignal): AsyncGenerator<string> {
  const base = (process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
      options: { temperature: 0.6, num_ctx: 8192 },
    }),
    signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new OllamaError(res.status === 404 ? `Model "${process.env.OLLAMA_MODEL}" isn't installed. Run: ollama pull ${process.env.OLLAMA_MODEL}` : `Ollama error ${res.status}: ${text.slice(0, 200)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const msg = JSON.parse(line) as { message?: { content?: string }; done?: boolean; error?: string };
      if (msg.error) throw new OllamaError(msg.error);
      if (msg.message?.content) yield msg.message.content;
      if (msg.done) return;
    }
  }
}

export class OllamaError extends Error {}
