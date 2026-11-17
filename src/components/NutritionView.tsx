"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Coffee, Loader2, Moon, Plus, RefreshCw, Sandwich, Search, Sparkles, Trash2, UtensilsCrossed, Apple, Check, X } from "lucide-react";
import { FOODS, FOOD_BY_ID, type MealSlot } from "@/lib/nutrition/foods";
import { macrosOf, SLOTS, type MealPlan } from "@/lib/nutrition/planner";
import {
  deleteFoodLogAction, generateMealPlanAction, logCustomFoodAction, logFoodAction, logMealFromPlanAction, replaceMealAction,
} from "@/lib/server/actions";
import { Bar, Button, Card, EmptyState, Pill, Ring, cx } from "./ui";

interface Log { id: string; slot: string; name: string; servings: number; kcal: number; protein: number; carbs: number; fat: number }
const SLOT_META: Record<MealSlot, { label: string; icon: React.ReactNode }> = {
  breakfast: { label: "Breakfast", icon: <Coffee className="h-4 w-4" /> },
  lunch: { label: "Lunch", icon: <Sandwich className="h-4 w-4" /> },
  dinner: { label: "Dinner", icon: <Moon className="h-4 w-4" /> },
  snack: { label: "Snacks", icon: <Apple className="h-4 w-4" /> },
};

function shift(date: string, d: number) {
  const x = new Date(date + "T12:00:00");
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
}

export function NutritionView({ date, today, targets, plan, logs, allowedFoodIds }: {
  date: string; today: string; targets: { calories: number; protein: number; carbs: number; fat: number };
  plan: MealPlan | null; logs: Log[]; allowedFoodIds: string[];
}) {
  const [pending, start] = useTransition();
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [adding, setAdding] = useState<MealSlot | null>(null);
  const eaten = logs.reduce((a, l) => ({ kcal: a.kcal + l.kcal, protein: a.protein + l.protein, carbs: a.carbs + l.carbs, fat: a.fat + l.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const remaining = Math.round(targets.calories - eaten.kcal);
  const planTotal = plan ? macrosOf(plan.meals.flatMap((m) => m.items)) : null;
  const run = (slot: string, fn: () => Promise<unknown>) => { setBusySlot(slot); start(async () => { await fn(); setBusySlot(null); }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/app/nutrition?date=${shift(date, -1)}`} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 hover:bg-white/10" aria-label="Previous day"><ChevronLeft className="h-4 w-4" /></Link>
        <p className="min-w-40 text-center font-semibold">{date === today ? "Today" : new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
        <Link href={`/app/nutrition?date=${shift(date, 1)}`} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 hover:bg-white/10" aria-label="Next day"><ChevronRight className="h-4 w-4" /></Link>
      </div>

      {/* Daily summary */}
      <Card className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
        <Ring value={eaten.kcal / targets.calories} size={164} stroke={12} color={remaining < 0 ? "var(--color-coral)" : "var(--color-lime)"} label="Calories">
          <div>
            <p className="font-display text-4xl font-bold tabular">{Math.abs(remaining).toLocaleString()}</p>
            <p className="text-xs text-mute">{remaining >= 0 ? "kcal remaining" : "kcal over"}</p>
          </div>
        </Ring>
        <div className="grid gap-5 sm:grid-cols-2">
          <MacroLine label="Calories" v={eaten.kcal} t={targets.calories} unit="kcal" color="var(--color-lime)" />
          <MacroLine label="Protein" v={eaten.protein} t={targets.protein} unit="g" color="var(--color-lime)" highlight />
          <MacroLine label="Carbohydrates" v={eaten.carbs} t={targets.carbs} unit="g" color="var(--color-sky)" />
          <MacroLine label="Fat" v={eaten.fat} t={targets.fat} unit="g" color="var(--color-amber)" />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Meal plan */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Sparkles className="h-4 w-4 text-lime" /> Meal plan</h2>
            {plan && <Button variant="ghost" size="sm" disabled={pending} onClick={() => run("all", () => generateMealPlanAction(date))}>{busySlot === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} New plan</Button>}
          </div>
          {!plan ? (
            <EmptyState icon={<UtensilsCrossed className="h-6 w-6" />} title="No meal plan for this day" body="Generate a day of Malaysian-friendly meals that fits your calorie and protein targets and your food preferences."
              action={<Button disabled={pending} onClick={() => run("all", () => generateMealPlanAction(date))}>{busySlot === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate meal plan</Button>} />
          ) : (
            <div className="space-y-3">
              {plan.meals.map((m) => {
                const mm = macrosOf(m.items);
                const logged = logs.some((l) => l.slot === m.slot);
                return (
                  <div key={m.slot} className={cx("card p-4 transition", busySlot === m.slot && "opacity-60")}>
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 text-sm font-semibold text-dim">{SLOT_META[m.slot].icon}{SLOT_META[m.slot].label}</p>
                      <p className="text-sm tabular text-mute">{Math.round(mm.kcal)} kcal · {Math.round(mm.protein)}g P</p>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {m.items.map((it) => {
                        const f = FOOD_BY_ID.get(it.foodId);
                        if (!f) return null;
                        return (
                          <li key={it.foodId}>
                            <p className="font-medium">{f.name}</p>
                            <p className="text-xs text-mute">{f.serving} · {f.kcal} kcal · P {f.protein}g · C {f.carbs}g · F {f.fat}g{f.tags.includes("halal") ? " · halal-friendly" : ""}</p>
                            {f.note && <p className="mt-0.5 text-xs text-sky/90">{f.note}</p>}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant={logged ? "secondary" : "primary"} disabled={pending} onClick={() => run(m.slot, () => logMealFromPlanAction(date, m.slot))}>
                        {logged ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {logged ? "Log again" : "I ate this"}
                      </Button>
                      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(m.slot, () => replaceMealAction(date, m.slot))}><RefreshCw className="h-4 w-4" /> Replace</Button>
                    </div>
                  </div>
                );
              })}
              {planTotal && <p className="text-xs text-mute tabular">Plan total ≈ {Math.round(planTotal.kcal)} kcal · {Math.round(planTotal.protein)}g protein · {Math.round(planTotal.carbs)}g carbs · {Math.round(planTotal.fat)}g fat (target {targets.calories} kcal / {targets.protein}g protein)</p>}
            </div>
          )}
        </section>

        {/* Food log */}
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">Food log</h2>
          <div className="space-y-3">
            {SLOTS.map((slot) => {
              const items = logs.filter((l) => l.slot === slot);
              const k = items.reduce((s, l) => s + l.kcal, 0);
              return (
                <div key={slot} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-semibold text-dim">{SLOT_META[slot].icon}{SLOT_META[slot].label}{items.length > 0 && <span className="text-mute tabular">· {Math.round(k)} kcal</span>}</p>
                    <button onClick={() => setAdding(slot)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-lime hover:bg-lime/10"><Plus className="h-4 w-4" /> Add</button>
                  </div>
                  {items.length === 0 ? <p className="mt-1 text-sm text-mute">Nothing logged yet.</p> : (
                    <ul className="mt-2 divide-y divide-line">
                      {items.map((l) => (
                        <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                          <div className="min-w-0"><p className="truncate text-sm">{l.name}{l.servings !== 1 && <span className="text-mute"> × {l.servings}</span>}</p><p className="text-xs tabular text-mute">{Math.round(l.kcal)} kcal · P {Math.round(l.protein)}g · C {Math.round(l.carbs)}g · F {Math.round(l.fat)}g</p></div>
                          <button onClick={() => run(l.id, () => deleteFoodLogAction(l.id))} disabled={pending} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-mute hover:bg-white/5 hover:text-coral" aria-label={`Remove ${l.name}`}>
                            {busySlot === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {adding && <AddFood slot={adding} date={date} allowed={allowedFoodIds} onClose={() => setAdding(null)} />}
    </div>
  );
}

function MacroLine({ label, v, t, unit, color, highlight }: { label: string; v: number; t: number; unit: string; color: string; highlight?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className={highlight ? "font-semibold" : "text-dim"}>{label}</span>
        <span className="tabular"><span className="font-semibold">{Math.round(v)}</span><span className="text-mute"> / {t} {unit}</span></span>
      </div>
      <Bar value={v / t} color={v > t * 1.05 && unit === "kcal" ? "var(--color-coral)" : color} />
    </div>
  );
}

function AddFood({ slot, date, allowed, onClose }: { slot: MealSlot; date: string; allowed: string[]; onClose: () => void }) {
  const [tab, setTab] = useState<"search" | "custom">("search");
  const [q, setQ] = useState("");
  const [onlyMine, setOnlyMine] = useState(true);
  const [servings, setServings] = useState(1);
  const [pending, start] = useTransition();
  const [custom, setCustom] = useState({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
  const [err, setErr] = useState<string | null>(null);
  const allowedSet = useMemo(() => new Set(allowed), [allowed]);
  const list = FOODS.filter((f) => (!onlyMine || allowedSet.has(f.id)) && f.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(b.slots.includes(slot)) - Number(a.slots.includes(slot)));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center" onClick={onClose} role="dialog" aria-modal aria-label="Add food">
      <div className="card flex max-h-[88dvh] w-full max-w-xl flex-col p-0 md:rounded-[1.5rem]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-semibold">Add to {SLOT_META[slot].label.toLowerCase()}</p>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/5" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex gap-1 px-5 pt-3">
          {(["search", "custom"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={cx("rounded-full px-4 py-1.5 text-sm", tab === t ? "bg-white/10 text-fg" : "text-mute")}>{t === "search" ? "Food database" : "Custom food"}</button>)}
        </div>
        {tab === "search" ? (
          <>
            <div className="space-y-3 px-5 py-3">
              <div className="flex h-11 items-center gap-2 rounded-full border border-line bg-ink px-4 focus-within:border-lime/50">
                <Search className="h-4 w-4 text-mute" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search nasi lemak, roti canai, chicken…" className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-mute" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-dim"><input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} className="accent-[#c6ff3d]" /> Match my preferences</label>
                <label className="flex items-center gap-2 text-dim">Servings
                  <select value={servings} onChange={(e) => setServings(Number(e.target.value))} className="rounded-lg border border-line bg-ink px-2 py-1">
                    {[0.5, 0.75, 1, 1.5, 2, 3].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto px-2 pb-3">
              {list.length === 0 && <li className="px-3 py-6 text-center text-sm text-mute">No matches. Try another word or add a custom food.</li>}
              {list.map((f) => (
                <li key={f.id}>
                  <button disabled={pending} onClick={() => start(async () => { await logFoodAction(date, slot, f.id, servings); onClose(); })}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/5">
                    <span className="min-w-0"><span className="block truncate text-sm">{f.name}</span><span className="text-xs text-mute">{f.serving} · P {f.protein}g · C {f.carbs}g · F {f.fat}g</span></span>
                    <span className="flex shrink-0 items-center gap-2">{f.tags.includes("local") && <Pill className="hidden sm:inline-flex">MY</Pill>}<span className="text-sm font-semibold tabular">{Math.round(f.kcal * servings)}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <form className="grid gap-3 p-5" onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await logCustomFoodAction(date, slot, { name: custom.name, kcal: Number(custom.kcal), protein: Number(custom.protein || 0), carbs: Number(custom.carbs || 0), fat: Number(custom.fat || 0) });
              if (r?.error) setErr(r.error); else onClose();
            });
          }}>
            <input required placeholder="Food name" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} className="h-11 rounded-xl border border-line bg-ink px-4 text-sm outline-none focus:border-lime/50" />
            <div className="grid grid-cols-4 gap-2">
              {(["kcal", "protein", "carbs", "fat"] as const).map((k) => (
                <label key={k} className="text-xs text-mute">{k === "kcal" ? "kcal" : `${k} (g)`}
                  <input required={k === "kcal"} type="number" min="0" step="0.1" value={custom[k]} onChange={(e) => setCustom({ ...custom, [k]: e.target.value })} className="mt-1 h-11 w-full rounded-xl border border-line bg-ink px-3 text-sm text-fg outline-none focus:border-lime/50" />
                </label>
              ))}
            </div>
            {err && <p className="text-sm text-coral">{err}</p>}
            <Button type="submit" disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add food</Button>
          </form>
        )}
      </div>
    </div>
  );
}
