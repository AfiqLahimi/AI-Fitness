# Pulse — AI Personal Fitness & Nutrition Coach

A premium, dark-themed fitness app that works as a personal trainer, workout planner, progress tracker and nutrition coach. Built with Next.js 16, React 19, Tailwind CSS 4, Drizzle ORM on libSQL/SQLite, and Claude for the AI coach.

```bash
cp .env.example .env.local   # add ANTHROPIC_API_KEY to enable the AI coach
npm install
npm run dev                  # http://localhost:3000
npm test                     # unit tests for calculations, planner, meal planner
```

The database (`data/pulse.db`) and its tables are created automatically on first request.

## What's in it

| Area | Where | Notes |
|---|---|---|
| Auth | `src/lib/server/auth.ts` | bcrypt (cost 12), random 256-bit session tokens stored **hashed**, httpOnly + SameSite cookies, login/signup rate limits |
| Onboarding & profile | `src/components/ProfileWizard.tsx` | 5 steps; live BMI / BMR / TDEE / calories / macros with explanations |
| Calculations | `src/lib/fitness/calc.ts` | Mifflin–St Jeor BMR, activity factor from planned training volume, capped deficit/surplus, never below BMR, protein 1.6–2.0 g/kg (reference weight when BMI > 27), BMI with WHO and Asian cut-offs |
| Workout planner | `src/lib/fitness/planner.ts` | Splits for 2–6 days/week, equipment and experience filtering, goal-based sets/reps/rest, warm-up + cool-down, active recovery and rest days, seeded regeneration |
| Auto-difficulty | `nextLevel()` / `represcribe()` | Levels 1–5 change from post-workout feedback and set completion; exercise choices and user swaps are kept |
| Customisation | `src/components/PlanEditor.tsx` | Change any day's focus, swap exercises for equipment-compatible alternatives, set rep or timer mode, regenerate |
| **Workout Studio** | `src/components/studio/WorkoutStudio.tsx` | Large demonstration stage; rep mode (tap counter, set tracking) and timer mode (start/pause/resume/reset); 3-2-1 countdown; rest countdown with +15s and skip; previous/next/skip; pause workout; per-set progress; elapsed time; estimated calories (MET-based, labelled as an estimate); audio cues; screen wake lock; keyboard shortcuts (Space, ←/→, P); completion screen with feedback |
| Exercise library | `src/lib/fitness/exercises.ts`, `/library` | 40 movements with target muscles, steps, posture cues and common mistakes |
| Nutrition | `src/lib/nutrition/*`, `/app/nutrition` | 60+ Malaysian and everyday foods with estimated kcal/macros; halal, vegetarian, vegan, no-beef, no-seafood, dairy-free, low-spice and allergy filters; daily meal-plan generation, meal replacement, food log, custom foods, remaining calories, protein tracking |
| Progress | `/app/progress` | Weight trend vs target, BMI history, workouts per week vs plan, 4-week completion rate, totals, daily calories and protein vs targets, workout history |
| AI coach | `src/app/api/coach/route.ts` | Streams from Claude with the user's real profile, plan, recent workouts, weight trend and today's food log as context; separate Fitness and Nutrition threads persisted per user; sustainable-nutrition and safety guardrails in the system prompt |

## Architecture decisions

- **Next.js App Router, server-first.** Pages are server components that read the database directly; mutations are server actions validated with Zod and scoped to the signed-in user. Only interactive pieces (studio, chat, forms, charts) are client components.
- **libSQL + Drizzle.** A local SQLite file for development. For production, point `DATABASE_URL` to a hosted libSQL/Turso database (works on serverless) — no code changes needed. Moving to Postgres means swapping the Drizzle dialect.
- **The plan generator is rules-based, on purpose.** Workout and meal plans come from deterministic, testable algorithms grounded in standard programming guidelines, not from a language model. That keeps them fast, free, consistent and safe. The LLM is used where it adds real value: open-ended, personalised coaching. Nothing in the UI shows fake AI output — if no API key is set, the coach says so plainly and every other feature still works.
- **Secrets stay server-side.** The Claude key is only read in the route handler; the browser never sees it. The coach is rate limited per user (30 messages/hour).

## Exercise demonstration videos

I couldn't attach real exercise videos in this build. I had no verified, licensed video source, and outbound access to media hosts was blocked in the build environment. I didn't want to link videos I couldn't check, so the media layer is built to take real footage later without code changes:

1. **`src/lib/media/video-manifest.json`**: map an exercise slug to licensed MP4/WebM sources (with credit, licence and an `aiGenerated` flag) or to a YouTube/Vimeo embed from a channel you have rights to use.
2. **`NEXT_PUBLIC_VIDEO_BASE_URL`**: put `<slug>.webm` / `<slug>.mp4` on a CDN and every exercise picks them up.
3. **Fallback: the animated motion guide.** This is not a video. It's a trainer figure animated in the browser from per-exercise keyframes (`src/lib/media/motion.ts`). It loops the real range of motion and tempo and highlights the working muscles. It's labelled as an animated guide, and it takes over automatically if a video fails to load.

Example manifest entry:

```json
{
  "dumbbell-bicep-curl": {
    "kind": "video",
    "sources": [{ "src": "https://cdn.example.com/curl.webm", "type": "video/webm" }],
    "poster": "https://cdn.example.com/curl.jpg",
    "credit": "Your Studio",
    "license": "Commercial licence #1234",
    "aiGenerated": false
  }
}
```

**Getting real footage:** you can film your own trainer (the most reliable option), license a stock fitness library, or generate clips with a paid text-to-video service. All three end up as files listed in the manifest. For AI-generated clips, check every one for correct form before publishing.

## Limitations and next steps

- Food values are estimates compiled from commonly cited figures; hawker portions vary widely. A barcode/photo logger or a link to MyFCD would improve accuracy.
- The rate limiter is in-memory per server instance. Use Redis/Upstash when running several instances.
- The schema is created with idempotent DDL at startup. For a team, switch to `drizzle-kit` migrations.
- No email verification or password reset yet (both need an email provider).
- Calorie burn uses MET values × body weight × time. It's an estimate and is labelled that way everywhere.
- Pulse gives general guidance, not medical advice.
