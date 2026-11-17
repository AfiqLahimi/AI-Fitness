import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { getProfile } from "@/lib/server/data";
import { ProfileWizard } from "@/components/ProfileWizard";
import { Logo } from "@/components/ui";

export const metadata = { title: "Build your profile" };

export default async function Onboarding() {
  const user = await requireUser();
  if (await getProfile(user.id)) redirect("/app");
  return (
    <main className="bg-aurora min-h-dvh px-4 pb-16 md:px-8">
      <header className="mx-auto flex max-w-3xl items-center justify-between py-6"><Link href="/"><Logo /></Link></header>
      <ProfileWizard mode="onboarding" initial={{ name: user.name }} />
    </main>
  );
}
