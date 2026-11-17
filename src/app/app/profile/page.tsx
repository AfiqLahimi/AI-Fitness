import { requireUser } from "@/lib/server/auth";
import { getProfile } from "@/lib/server/data";
import { ProfileWizard } from "@/components/ProfileWizard";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const p = await getProfile(user.id);
  return (
    <div className="pt-2">
      <p className="mb-6 text-sm text-dim">Signed in as {user.email}. Changing your goal, experience, equipment or schedule rebuilds your workout plan.</p>
      <ProfileWizard mode="edit" initial={p ?? undefined} />
    </div>
  );
}
