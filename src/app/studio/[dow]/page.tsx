import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { getActivePlan, getProfile, today } from "@/lib/server/data";
import { WorkoutStudio } from "@/components/studio/WorkoutStudio";
import { EmptyState, ButtonLink } from "@/components/ui";
import { Moon } from "lucide-react";

export const metadata = { title: "Workout Studio" };

export default async function StudioPage({ params }: { params: Promise<{ dow: string }> }) {
  const user = await requireUser();
  const { dow: raw } = await params;
  const dow = Number(raw);
  if (!Number.isInteger(dow) || dow < 0 || dow > 6) notFound();
  const [profile, active] = await Promise.all([getProfile(user.id), getActivePlan(user.id)]);
  if (!profile) redirect("/onboarding");
  const day = active?.plan.days[dow];
  if (!day || day.type === "rest" || (!day.main.length && !day.warmup.length)) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <EmptyState icon={<Moon className="h-6 w-6" />} title="Rest day" body="Nothing scheduled for this day. Recovery counts — or pick another day from your plan." action={<ButtonLink href="/app/plan">Open plan</ButtonLink>} />
      </main>
    );
  }
  return <WorkoutStudio day={day} date={today()} weightKg={profile.weightKg} />;
}
