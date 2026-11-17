import { requireUser } from "@/lib/server/auth";
import { getActivePlan, getProfile, today } from "@/lib/server/data";
import { mondayIndex } from "@/lib/fitness/planner";
import { alternativesFor } from "@/lib/fitness/planner";
import { PlanEditor } from "@/components/PlanEditor";
import { EmptyState, PageHeader } from "@/components/ui";
import { GOAL_LABELS } from "@/lib/fitness/types";
import { RegenerateButton } from "@/components/RegenerateButton";

export const metadata = { title: "Workout Plan" };

export default async function PlanPage() {
  const user = await requireUser();
  const [profile, active] = await Promise.all([getProfile(user.id), getActivePlan(user.id)]);
  const p = profile!;
  const todayDow = mondayIndex(new Date(today() + "T12:00:00"));
  if (!active) return <EmptyState title="No plan yet" body="Generate a plan from your profile." action={<RegenerateButton />} />;
  const alts: Record<string, { slug: string; name: string }[]> = {};
  active.plan.days.forEach((d) => d.main.forEach((it) => { alts[it.slug] ??= alternativesFor(it.slug, p).map((e) => ({ slug: e.slug, name: e.name })); }));
  return (
    <>
      <PageHeader
        eyebrow={`${GOAL_LABELS[p.goal]} · Level ${active.plan.level}/5`}
        title="Your training week"
        subtitle={`Built for ${p.daysPerWeek} sessions of ~${p.sessionMinutes} minutes using ${p.location === "gym" ? "full gym equipment" : "your home equipment"}. Difficulty adapts automatically from your workout feedback.`}
        actions={<RegenerateButton />}
      />
      <PlanEditor plan={active.plan} todayDow={todayDow} alternatives={alts} />
    </>
  );
}
