import Link from "next/link";
import { ArrowRight, CalendarDays, LineChart, MessageCircle, Play, Repeat, Salad, Timer } from "lucide-react";
import { ButtonLink, Logo } from "@/components/ui";
import { ExercisePreview } from "@/components/studio/ExercisePreview";
import { currentUser } from "@/lib/server/auth";

export default async function Landing() {
  const user = await currentUser();
  return (
    <main className="bg-aurora overflow-x-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/library" className="hidden rounded-full px-4 py-2 text-sm text-dim hover:text-fg sm:block">Exercises</Link>
          {user ? <ButtonLink href="/app" size="sm">Open app</ButtonLink> : (
            <>
              <Link href="/login" className="rounded-full px-4 py-2 text-sm text-dim hover:text-fg">Sign in</Link>
              <ButtonLink href="/signup" size="sm">Get started</ButtonLink>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-20 pt-10 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-lime/25 bg-lime/[0.06] px-3 py-1 text-xs font-medium text-lime">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" /> Your AI personal trainer & nutrition coach
          </p>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">
            Train with a coach<br />that <span className="text-gradient-lime">knows you.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-dim">
            A plan built from your body, goal and equipment. A guided workout studio with live demonstrations, rest timers and rep tracking. Malaysian-friendly meal plans. And an AI coach that reads your actual progress.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href={user ? "/app" : "/signup"} size="lg">Build my plan <ArrowRight className="h-5 w-5" /></ButtonLink>
            <ButtonLink href="/library" size="lg" variant="secondary"><Play className="h-4 w-4 fill-current" /> See the exercises</ButtonLink>
          </div>
          <p className="mt-6 text-sm text-mute">Free · 2-minute setup · works at home or in the gym</p>
        </div>

        {/* Studio mock */}
        <div className="relative">
          <div className="absolute -inset-10 -z-10 rounded-full bg-lime/10 blur-3xl" />
          <div className="card overflow-hidden p-0 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3 border-b border-line px-5 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-lime" />
              <p className="text-sm font-semibold">Workout Studio</p>
              <div className="ml-auto flex gap-1">{Array.from({ length: 7 }).map((_, i) => <span key={i} className={`h-1.5 w-6 rounded-full ${i < 3 ? "bg-lime" : "bg-white/10"}`} />)}</div>
            </div>
            <div className="relative aspect-[4/3] bg-ink">
              <ExercisePreview slug="dumbbell-bicep-curl" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-16">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime">Set 2 of 3</p>
                <p className="mt-1 font-display text-3xl font-bold">Dumbbell Bicep Curl</p>
                <p className="text-sm text-dim">Biceps · Forearms</p>
              </div>
              <div className="glass absolute right-4 top-4 rounded-2xl px-4 py-3 text-center">
                <p className="font-display text-3xl font-bold tabular">8<span className="text-base text-mute">/12</span></p>
                <p className="text-[10px] uppercase tracking-wider text-mute">reps</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Feature icon={<CalendarDays className="h-5 w-5" />} title="A plan that adapts" body="Weekly split, sets, reps and rest chosen for your goal and equipment. Tell us how a session felt and difficulty adjusts automatically." />
          <Feature icon={<Repeat className="h-5 w-5" />} title="Rep mode or timer mode" body="Count reps and tap through sets, or train against the clock with start, pause, resume and guided rest countdowns." />
          <Feature icon={<Timer className="h-5 w-5" />} title="Coached every set" body="Target muscles, step-by-step cues, posture checkpoints and the mistakes to avoid — right next to the demonstration." />
          <Feature icon={<Salad className="h-5 w-5" />} title="Malaysian-first nutrition" body="Nasi lemak, chicken rice, roti canai, ikan bakar and more — with calorie and macro estimates, halal filters and sensible swaps." />
          <Feature icon={<LineChart className="h-5 w-5" />} title="See your progress" body="Weight and BMI trends, workout consistency, calories and protein — all in one dashboard." />
          <Feature icon={<MessageCircle className="h-5 w-5" />} title="An AI coach with context" body="Ask anything. Answers use your real profile, plan, workouts and food log — and never push crash diets." />
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-xs text-mute md:flex-row md:justify-between md:px-8">
          <Logo className="text-fg" />
          <p className="max-w-2xl">Pulse provides general fitness and nutrition information, not medical advice. Calorie, macro and calorie-burn figures are estimates. Check with a healthcare professional before starting a new programme if you have a medical condition.</p>
        </div>
      </footer>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-6 transition hover:border-line-strong">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime/10 text-lime">{icon}</span>
      <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-dim">{body}</p>
    </div>
  );
}
