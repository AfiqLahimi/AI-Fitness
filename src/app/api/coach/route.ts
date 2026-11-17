import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { currentUser, rateLimit } from "@/lib/server/auth";
import { addChat, getActivePlan, getChat, getFoodLogs, getProfile, getSessions, getWeights, dateNDaysAgo } from "@/lib/server/data";
import { computeTargets } from "@/lib/fitness/calc";
import { GOAL_LABELS, EXPERIENCE_LABELS, EQUIPMENT_LABELS, DIET_LABELS } from "@/lib/fitness/types";
import { WEEKDAYS, mondayIndex } from "@/lib/fitness/planner";
import { getExercise } from "@/lib/fitness/exercises";

export const runtime = "nodejs";

const MODEL = process.env.COACH_MODEL ?? "claude-opus-5-5";

const body = z.object({
  thread: z.enum(["coach", "nutrition"]),
  message: z.string().trim().min(1).max(2000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const STABLE_SYSTEM = `You are Pulse Coach, a personal fitness and nutrition coach inside the Pulse app.

How you coach:
- Personalise every answer to the user's profile, plan, logged workouts, weight trend and food log given in the context block. Reference their real numbers.
- Be concise and practical: lead with the answer, then 2–5 specific actions. Use short paragraphs or bullet lists. Use metric units.
- Recommend sustainable approaches. Never suggest crash diets, very-low-calorie diets, eating below the user's BMR, fasting for days, dehydration, or unproven supplements. Weight-loss pace should be about 0.25–1% of body weight per week.
- Treat BMI as a screening tool only; mention body composition, waist size and how they feel where relevant.
- Know Malaysian food well (nasi lemak, chicken rice, roti canai, nasi campur, mamak food, kuih, teh tarik) and give realistic swaps rather than banning foods. Respect halal and other dietary preferences in the profile.
- Calorie and macro figures are estimates; say so when it matters.
- You are not a doctor. For pain, injury, dizziness, chest pain, eating-disorder signs, pregnancy, or medical conditions, give general safety guidance and recommend a qualified professional. If someone describes chest pain or fainting during exercise, tell them to stop and seek medical help.
- If the user asks about something outside fitness, nutrition, sleep or recovery, briefly steer back.`;

const THREAD_FOCUS = {
  coach: "The user opened the AI Fitness Coach. Cover training, recovery, progress and nutrition as needed.",
  nutrition: "The user opened the AI Nutrition Coach. Focus on food, calories, protein, meal choices and their food log for today.",
};

async function buildContext(userId: string, date: string) {
  const [profile, active, sessions, weights, foods] = await Promise.all([
    getProfile(userId), getActivePlan(userId), getSessions(userId, dateNDaysAgo(28)), getWeights(userId), getFoodLogs(userId, date),
  ]);
  if (!profile) return null;
  const t = computeTargets(profile);
  const dow = mondayIndex(new Date(date + "T12:00:00"));
  const plan = active?.plan;
  const planLines = plan
    ? plan.days.map((d) => `${WEEKDAYS[d.dow]}: ${d.title}${d.main.length ? " — " + d.main.map((i) => `${getExercise(i.slug)?.name ?? i.slug} ${i.sets}×${i.mode === "time" ? i.seconds + "s" : i.reps}`).join(", ") : ""}`).join("\n")
    : "No plan yet.";
  const eaten = foods.reduce((a, f) => ({ kcal: a.kcal + f.kcal, p: a.p + f.protein }), { kcal: 0, p: 0 });
  const recentW = weights.slice(-8).map((w) => `${w.date}: ${w.weightKg} kg`).join("; ") || "none";
  const sess = sessions.slice(0, 12).map((s) => `${s.date} ${s.title} — ${Math.round(s.durationSec / 60)} min, ${s.setsDone}/${s.setsTotal} sets, feedback: ${s.feedback ?? "none"}`).join("\n") || "No workouts logged in the last 4 weeks.";

  return `<user_context date="${date}" today="${WEEKDAYS[dow]}">
Profile: ${profile.name}, ${profile.age} y, ${profile.gender === "unspecified" ? "gender not specified" : profile.gender}, ${profile.heightCm} cm, ${profile.weightKg} kg → target ${profile.targetWeightKg} kg.
Goal: ${GOAL_LABELS[profile.goal]}. Experience: ${EXPERIENCE_LABELS[profile.experience]}. Trains at ${profile.location}, ${profile.daysPerWeek} days/week, ~${profile.sessionMinutes} min.
Equipment: ${profile.equipment.map((e) => EQUIPMENT_LABELS[e]).join(", ") || "bodyweight only"}.
Diet: ${profile.diet.map((d) => DIET_LABELS[d]).join(", ") || "no restrictions"}. Allergies/avoid: ${profile.allergies || "none stated"}.
Calculated: BMI ${t.bmi.value} (${t.bmi.category}; Asian cut-off: ${t.bmi.asianCategory}), BMR ${t.bmr} kcal, TDEE ${t.tdee} kcal, target ${t.calories} kcal, protein ${t.proteinG} g, carbs ${t.carbsG} g, fat ${t.fatG} g.
Plan progression level: ${plan?.level ?? 1}/5.
Weekly plan:
${planLines}
Recent workouts:
${sess}
Weight log (recent): ${recentW}
Food logged today: ${foods.length ? foods.map((f) => `${f.slot}: ${f.name} (${Math.round(f.kcal)} kcal, ${Math.round(f.protein)} g P)`).join("; ") : "nothing yet"}. Total ${Math.round(eaten.kcal)} kcal / ${Math.round(eaten.p)} g protein; remaining ${Math.round(t.calories - eaten.kcal)} kcal.
</user_context>`;
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Please sign in." }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN)
    return Response.json({ error: "The AI coach isn't configured yet. Add ANTHROPIC_API_KEY to the server environment.", code: "not_configured" }, { status: 503 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid message." }, { status: 400 });
  if (!rateLimit(`coach:${user.id}`, 30, 60 * 60_000))
    return Response.json({ error: "You've reached the hourly coaching limit. Try again a bit later." }, { status: 429 });

  const { thread, message, date } = parsed.data;
  const context = await buildContext(user.id, date);
  if (!context) return Response.json({ error: "Complete your profile first." }, { status: 400 });

  const history = await getChat(user.id, thread, 20);
  await addChat(user.id, thread, "user", message);

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: `${context}\n\n${message}` },
  ];

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        const s = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 4000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "low" },
          system: [
            { type: "text", text: STABLE_SYSTEM, cache_control: { type: "ephemeral" } },
            { type: "text", text: THREAD_FOCUS[thread] },
          ],
          messages,
        });
        for await (const ev of s) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            full += ev.delta.text;
            controller.enqueue(encoder.encode(ev.delta.text));
          }
        }
        const final = await s.finalMessage();
        if (final.stop_reason === "refusal" && !full) {
          full = "I can't help with that one. Try asking about your training, recovery or nutrition.";
          controller.enqueue(encoder.encode(full));
        }
        if (full) await addChat(user.id, thread, "assistant", full);
      } catch (err) {
        const msg =
          err instanceof Anthropic.RateLimitError ? "The coach is busy right now — please try again in a minute."
          : err instanceof Anthropic.AuthenticationError ? "The AI coach's API key is invalid. Check the server configuration."
          : err instanceof Anthropic.APIConnectionError ? "Couldn't reach the AI service. Check your connection and try again."
          : "Something went wrong while generating a response.";
        console.error("[coach]", err);
        controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
