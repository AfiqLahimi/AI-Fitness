import { requireUser } from "@/lib/server/auth";
import { getChat, today } from "@/lib/server/data";
import { CoachChat } from "@/components/CoachChat";
import { coachProvider, coachProviderLabel } from "@/lib/server/ai";

export const metadata = { title: "AI Coach" };

export default async function CoachPage() {
  const user = await requireUser();
  const chat = await getChat(user.id, "coach");
  return (
    <>
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">AI Personal Coach</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Your coach</h1>
      </div>
      <CoachChat
        thread="coach" date={today()} configured={coachProvider() !== null} providerLabel={coachProviderLabel(coachProvider())}
        initial={chat.map((c) => ({ role: c.role as "user" | "assistant", content: c.content }))}
        suggestions={["What workout should I do today?", "How can I build bigger arms?", "How much protein should I eat?", "Is my current plan effective?", "How do I lose fat but keep muscle?"]}
      />
      <p className="mt-3 text-center text-xs text-mute">Pulse Coach gives general fitness guidance, not medical advice. Stop and seek help if you feel pain, dizziness or chest discomfort.</p>
    </>
  );
}
