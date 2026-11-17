import { requireUser } from "@/lib/server/auth";
import { getChat, getFoodLogs, getMealPlan, getProfile, today } from "@/lib/server/data";
import { computeTargets } from "@/lib/fitness/calc";
import { allowedFoods } from "@/lib/nutrition/planner";
import { NutritionView } from "@/components/NutritionView";
import { CoachChat } from "@/components/CoachChat";
import { coachProvider, coachProviderLabel } from "@/lib/server/ai";
import { PageHeader } from "@/components/ui";
import { DIET_LABELS } from "@/lib/fitness/types";

export const metadata = { title: "Nutrition" };

export default async function NutritionPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today();
  const [profile, plan, logs, chat] = await Promise.all([getProfile(user.id), getMealPlan(user.id, date), getFoodLogs(user.id, date), getChat(user.id, "nutrition")]);
  const p = profile!;
  const t = computeTargets(p);
  const foods = allowedFoods(p.diet, p.allergies).map((f) => f.id);
  return (
    <>
      <PageHeader
        eyebrow="Nutrition"
        title="Fuel your training"
        subtitle={<>Targets from your profile{p.diet.length ? <> · {p.diet.map((d) => DIET_LABELS[d]).join(", ")}</> : null}. Calories and macros for dishes are estimates — hawker portions vary.</>}
      />
      <NutritionView
        date={date} today={today()} targets={{ calories: t.calories, protein: t.proteinG, carbs: t.carbsG, fat: t.fatG }}
        plan={plan} logs={logs.map((l) => ({ id: l.id, slot: l.slot, name: l.name, servings: l.servings, kcal: l.kcal, protein: l.protein, carbs: l.carbs, fat: l.fat }))}
        allowedFoodIds={foods}
      />
      <div className="mt-8">
        <CoachChat
          compact thread="nutrition" date={date} configured={coachProvider() !== null} providerLabel={coachProviderLabel(coachProvider())}
          initial={chat.map((c) => ({ role: c.role as "user" | "assistant", content: c.content }))}
          suggestions={["What should I eat for dinner with my remaining calories?", "Is nasi lemak okay on my plan?", "High-protein mamak options?", "What should I eat after my workout?"]}
        />
      </div>
    </>
  );
}
