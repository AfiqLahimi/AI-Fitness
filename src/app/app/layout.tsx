import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { getProfile } from "@/lib/server/data";
import { AppNav } from "@/components/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!(await getProfile(user.id))) redirect("/onboarding");
  return (
    <div className="min-h-dvh">
      <AppNav name={user.name} />
      <main className="px-4 pb-28 pt-6 md:px-8 lg:ml-60 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
