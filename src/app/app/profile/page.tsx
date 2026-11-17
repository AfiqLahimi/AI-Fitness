import { requireUser } from "@/lib/server/auth";
import { getProfile } from "@/lib/server/data";
import Link from "next/link";
import { ProfileWizard } from "@/components/ProfileWizard";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const p = await getProfile(user.id);
  return (
    <div className="pt-2">
      <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
        <Link href="/library" className="rounded-full border border-line bg-panel px-4 py-2 text-sm text-dim">Exercise library</Link>
        <Link href="/app/videos" className="rounded-full border border-line bg-panel px-4 py-2 text-sm text-dim">Video library</Link>
      </div>
      <p className="mb-6 text-sm text-dim">Signed in as {user.email}. Changing your goal, experience, equipment or schedule rebuilds your workout plan.</p>
      <ProfileWizard mode="edit" initial={p ?? undefined} />
    </div>
  );
}
