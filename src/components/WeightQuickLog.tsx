"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { logWeightAction } from "@/lib/server/actions";
import { Button } from "./ui";

export function WeightQuickLog({ date, current }: { date: string; current: number }) {
  const [v, setV] = useState(String(current));
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await logWeightAction(date, Number(v));
          setMsg(r?.error ?? "Saved");
          setTimeout(() => setMsg(null), 2000);
        });
      }}
    >
      <label className="text-xs text-mute" htmlFor="wq">Log today&apos;s weight</label>
      <div className="mt-1.5 flex gap-2">
        <div className="flex h-11 flex-1 items-center rounded-full border border-line bg-ink pr-4 focus-within:border-lime/60">
          <input id="wq" type="number" step="0.1" min="30" max="300" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} className="tabular h-full w-full bg-transparent px-4 outline-none" />
          <span className="text-sm text-mute">kg</span>
        </div>
        <Button type="submit" variant="secondary" disabled={pending} aria-label="Save weight">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
      </div>
      {msg && <p className="mt-2 text-xs text-lime" role="status">{msg}</p>}
    </form>
  );
}
