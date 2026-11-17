"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen, ChevronLeft, ChevronRight, Flame, Pause, Play, Plus, RotateCcw, SkipForward, Timer, Repeat, Volume2, VolumeX, X, Check, Trophy, Loader2, Clock, Dumbbell,
} from "lucide-react";
import type { PlanDay, PlanItem } from "@/lib/fitness/planner";
import { getExercise, MUSCLE_LABELS, type Exercise } from "@/lib/fitness/exercises";
import { completeWorkoutAction } from "@/lib/server/actions";
import { ExerciseMedia } from "./ExerciseMedia";
import { ExerciseIntro } from "./ExerciseIntro";
import { Button, Pill, Ring, cx } from "../ui";

type Section = "warmup" | "main" | "cooldown";
interface Step { item: PlanItem; ex: Exercise; section: Section }
type Phase = "ready" | "countdown" | "work" | "rest" | "done";

const SECTION_LABEL: Record<Section, string> = { warmup: "Warm-up", main: "Workout", cooldown: "Cool-down" };
const REP_SECONDS = 3.5; // average time under tension per rep, for estimates
const REST_MET = 1.5;

function fmt(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Short beeps through WebAudio — no audio files needed. */
function useBeeper(enabled: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  return useCallback(
    (freq = 880, dur = 0.12) => {
      if (!enabled) return;
      try {
        ctx.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const c = ctx.current, o = c.createOscillator(), g = c.createGain();
        o.frequency.value = freq; o.type = "sine";
        g.gain.setValueAtTime(0.0001, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
        o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur + 0.02);
      } catch { /* audio unavailable */ }
    },
    [enabled],
  );
}

export function WorkoutStudio({ day, date, weightKg }: { day: PlanDay; date: string; weightKg: number }) {
  const steps = useMemo<Step[]>(() => {
    const list: Step[] = [];
    (["warmup", "main", "cooldown"] as Section[]).forEach((section) =>
      day[section].forEach((item) => { const ex = getExercise(item.slug); if (ex) list.push({ item, ex, section }); }),
    );
    return list;
  }, [day]);

  const [idx, setIdx] = useState(0);
  const [setNo, setSetNo] = useState(1);
  const [phase, setPhase] = useState<Phase>("ready");
  const [modes, setModes] = useState<("reps" | "time")[]>(() => steps.map((s) => s.item.mode));
  const [done, setDone] = useState<number[]>(() => steps.map(() => 0)); // completed sets per step
  const [reps, setReps] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(true);
  const [tab, setTab] = useState<"how" | "posture" | "mistakes">("how");
  const beep = useBeeper(sound);

  // Learning intro (muscles → technique → video → choose mode) before each main exercise.
  const [showIntros, setShowIntros] = useState(true);
  const [introFor, setIntroFor] = useState<number | null>(null);
  useEffect(() => {
    try { if (localStorage.getItem("pulse.showIntros") === "0") setShowIntros(false); } catch { /* storage unavailable */ }
  }, []);
  const toggleIntros = (v: boolean) => { setShowIntros(v); try { localStorage.setItem("pulse.showIntros", v ? "1" : "0"); } catch { /* ignore */ } };
  const wantsIntro = (n: number) => showIntros && steps[n]?.section === "main";

  // Timer: either running toward `endsAt`, or frozen at `frozen` seconds.
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [frozen, setFrozen] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // Workout clock and calorie estimate
  const startedAt = useRef<number | null>(null);
  const pausedMs = useRef(0);
  const pausedAt = useRef<number | null>(null);
  const kcal = useRef(0);
  const lastTick = useRef(Date.now());

  const step = steps[idx];
  const mode = modes[idx] ?? "reps";
  const totalSets = step?.item.sets ?? 1;
  const remaining = endsAt ? Math.max(0, (endsAt - now) / 1000) : frozen;
  const running = endsAt !== null && !paused;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  // Keep the screen awake during the session where supported.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    if (phase !== "done" && "wakeLock" in navigator) navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => { lock?.release().catch(() => {}); };
  }, [phase]);

  // Accumulate calories (estimate) while active.
  useEffect(() => {
    const t = Date.now();
    const dt = (t - lastTick.current) / 1000;
    lastTick.current = t;
    if (paused || phase === "done" || startedAt.current === null || dt > 2) return;
    const met = phase === "work" || phase === "countdown" ? step?.ex.met ?? 3 : REST_MET;
    kcal.current += (met * weightKg * dt) / 3600;
  }, [now, paused, phase, step, weightKg]);

  const begin = () => { startedAt.current ??= Date.now(); };
  const startTimer = (sec: number) => { begin(); setFrozen(sec); setEndsAt(Date.now() + sec * 1000); };
  const stopTimer = (sec = 0) => { setEndsAt(null); setFrozen(sec); };

  const goTo = useCallback((i: number) => {
    const n = Math.max(0, Math.min(steps.length - 1, i));
    setIdx(n); setSetNo(Math.min(steps[n].item.sets, (done[n] ?? 0) + 1)); setReps(0);
    setPhase("ready"); stopTimer(steps[n].item.mode === "time" ? steps[n].item.seconds : 0); setTab("how");
    setIntroFor(wantsIntro(n) && (done[n] ?? 0) === 0 ? n : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, done, showIntros]);

  const finish = () => { stopTimer(); setPhase("done"); };

  const completeSet = useCallback(() => {
    begin();
    setDone((d) => d.map((v, i) => (i === idx ? Math.max(v, setNo) : v)));
    setReps(0);
    beep(1320, 0.18);
    if (navigator.vibrate) navigator.vibrate(60);
    const lastSet = setNo >= totalSets;
    const lastStep = idx >= steps.length - 1;
    if (lastSet && lastStep) return finish();
    setPhase("rest");
    startTimer(step.item.restSec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, setNo, totalSets, steps.length, step, beep]);

  const afterRest = useCallback(() => {
    if (setNo < totalSets) {
      setSetNo((s) => s + 1);
      if (mode === "time") { setPhase("countdown"); startTimer(3); }
      else { setPhase("work"); stopTimer(); }
    } else {
      const n = idx + 1;
      setIdx(n); setSetNo(1); setReps(0); setTab("how");
      if (wantsIntro(n)) { setIntroFor(n); setPhase("ready"); stopTimer(steps[n].item.seconds); }
      else if (modes[n] === "time") { setPhase("countdown"); startTimer(3); }
      else { setPhase("work"); stopTimer(); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setNo, totalSets, mode, idx, modes, showIntros]);

  const startFromIntro = (m: "reps" | "time") => {
    setModes((ms) => ms.map((v, i) => (i === idx ? m : v)));
    setIntroFor(null);
    begin();
    if (m === "time") { setPhase("countdown"); startTimer(3); }
    else { setPhase("work"); stopTimer(); }
  };

  // Timer reached zero → advance the state machine. Beep on the last 3 seconds.
  const lastBeep = useRef(-1);
  useEffect(() => {
    if (!running) return;
    const s = Math.ceil(remaining);
    if (s <= 3 && s > 0 && s !== lastBeep.current) { lastBeep.current = s; beep(660, 0.09); }
    if (remaining > 0) return;
    lastBeep.current = -1;
    setEndsAt(null);
    if (phase === "countdown") { beep(990, 0.2); setPhase("work"); if (mode === "time") startTimer(step.item.seconds); }
    else if (phase === "work" && mode === "time") completeSet();
    else if (phase === "rest") afterRest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  const togglePauseWorkout = () => {
    if (!paused) {
      pausedAt.current = Date.now();
      if (endsAt) { setFrozen(Math.max(0, (endsAt - Date.now()) / 1000)); setEndsAt(null); }
      setPaused(true);
    } else {
      if (pausedAt.current) pausedMs.current += Date.now() - pausedAt.current;
      pausedAt.current = null;
      setPaused(false);
      if ((phase === "rest" || phase === "countdown" || (phase === "work" && mode === "time")) && frozen > 0) startTimer(frozen);
    }
  };

  // Timer-mode controls for the working set
  const timerStart = () => {
    if (phase === "ready" || (phase === "work" && endsAt === null && frozen === 0)) { setPhase("countdown"); startTimer(3); return; }
    if (phase === "work" && endsAt === null) startTimer(frozen); // resume
  };
  const timerPause = () => { if (endsAt) { setFrozen(Math.max(0, (endsAt - Date.now()) / 1000)); setEndsAt(null); } };
  const timerReset = () => { stopTimer(step.item.seconds); setPhase("ready"); };

  const switchMode = (m: "reps" | "time") => {
    setModes((ms) => ms.map((v, i) => (i === idx ? m : v)));
    if (phase === "work" || phase === "ready" || phase === "countdown") { setPhase(m === "reps" ? "work" : "ready"); stopTimer(m === "time" ? step.item.seconds : 0); }
  };

  // Keyboard shortcuts: Space = primary action, ←/→ = previous/next exercise, P = pause.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || phase === "done" || introFor !== null) return;
      if (e.key === "ArrowRight") goTo(idx + 1);
      else if (e.key === "ArrowLeft") goTo(idx - 1);
      else if (e.key.toLowerCase() === "p") togglePauseWorkout();
      else if (e.key === " ") {
        e.preventDefault();
        if (phase === "rest") afterRest();
        else if (mode === "reps") completeSet();
        else if (running) timerPause(); else timerStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const elapsedSec = startedAt.current ? (now - startedAt.current - pausedMs.current - (pausedAt.current ? now - pausedAt.current : 0)) / 1000 : 0;
  const setsTotal = steps.reduce((s, x) => s + x.item.sets, 0);
  const setsDone = done.reduce((s, x) => s + x, 0);
  const progress = setsTotal ? setsDone / setsTotal : 0;

  if (!steps.length) return null;
  if (phase === "done") {
    return (
      <CompletionScreen
        day={day} date={date} durationSec={Math.round(elapsedSec)} kcal={Math.round(kcal.current)}
        setsDone={setsDone} setsTotal={setsTotal}
        exercisesDone={done.filter((d, i) => d > 0 && steps[i].section === "main").length}
        exercisesTotal={steps.filter((s) => s.section === "main").length}
      />
    );
  }

  const next = steps[idx + 1];
  const workTarget = mode === "time" ? step.item.seconds : step.item.reps;

  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 md:px-6">
        <Link href="/app" className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-dim transition hover:text-fg" aria-label="Exit workout"><X className="h-5 w-5" /></Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{day.title}</p>
          <div className="mt-1.5 flex gap-1" aria-label={`Workout ${Math.round(progress * 100)}% complete`}>
            {steps.map((s, i) => (
              <button key={i} onClick={() => goTo(i)} title={s.ex.name} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <span className={cx("block h-full rounded-full transition-all duration-500", s.section === "main" ? "bg-lime" : "bg-sky")} style={{ width: `${(done[i] / s.item.sets) * 100}%` }} />
              </button>
            ))}
          </div>
        </div>
        <div className="hidden items-center gap-4 text-sm tabular sm:flex">
          <span className="inline-flex items-center gap-1.5 text-dim"><Clock className="h-4 w-4" />{fmt(elapsedSec)}</span>
          <span className="inline-flex items-center gap-1.5 text-dim" title="Estimated calories burned (based on exercise METs and your body weight)"><Flame className="h-4 w-4 text-amber" />≈{Math.round(kcal.current)} kcal <span className="text-[10px] text-mute">est.</span></span>
        </div>
        {introFor === null && (
          <button onClick={() => { if (running && phase === "work") timerPause(); setIntroFor(idx); }} className="hidden h-10 items-center gap-1.5 rounded-full bg-white/5 px-3.5 text-sm text-dim hover:text-fg sm:inline-flex" aria-label="Learn this exercise">
            <BookOpen className="h-4 w-4" /> Learn
          </button>
        )}
        <button onClick={() => setSound((s) => !s)} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-dim hover:text-fg" aria-label={sound ? "Mute sounds" : "Unmute sounds"}>{sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
        <Button variant="secondary" size="sm" onClick={togglePauseWorkout}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}<span className="hidden sm:inline">{paused ? "Resume" : "Pause"}</span></Button>
      </header>

      {introFor === idx ? (
        <ExerciseIntro
          key={step.ex.slug}
          exercise={step.ex} item={step.item}
          position={steps.filter((s) => s.section === "main").indexOf(step) + 1 || idx + 1}
          total={steps.filter((s) => s.section === "main").length || steps.length}
          defaultMode={mode} onStart={startFromIntro} onSkip={() => setIntroFor(null)}
          showIntros={showIntros} onToggleIntros={toggleIntros}
        />
      ) : (
      <div className="grid flex-1 gap-4 px-4 pb-4 md:px-6 lg:grid-cols-[1fr_380px] lg:gap-6 lg:pb-6">
        {/* Stage */}
        <section className="flex min-w-0 flex-col gap-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] border border-line bg-[radial-gradient(ellipse_at_top,#17191a,#060607)] sm:aspect-video lg:aspect-auto lg:min-h-[520px] lg:flex-1">
            <AnimatePresence mode="wait">
              <motion.div key={step.ex.slug} className="absolute inset-0" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                <ExerciseMedia exercise={step.ex} playing={!paused && phase !== "rest"} />
              </motion.div>
            </AnimatePresence>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 pt-20 md:p-8 md:pt-24">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Pill tone={step.section === "main" ? "lime" : "sky"}>{SECTION_LABEL[step.section]}</Pill>
                <Pill className="capitalize">{step.ex.difficulty}</Pill>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs tabular text-dim">{idx + 1} / {steps.length}</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime">Set {setNo} of {totalSets}{step.ex.unilateral ? " · each side" : ""}</p>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-5xl">{step.ex.name}</h1>
              <p className="mt-2 text-sm text-dim">{step.ex.primary.map((m) => MUSCLE_LABELS[m]).join(" · ")}{step.ex.secondary.length ? <span className="text-mute"> + {step.ex.secondary.map((m) => MUSCLE_LABELS[m]).join(", ")}</span> : null}</p>
            </div>

            {/* Rest overlay */}
            <AnimatePresence>
              {phase === "rest" && (
                <motion.div key="rest" className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky">Rest</p>
                  <Ring value={remaining / step.item.restSec} size={220} stroke={10} color="var(--color-sky)" label="Rest countdown">
                    <span className="font-display text-6xl font-bold tabular">{fmt(remaining)}</span>
                  </Ring>
                  <p className="mt-6 text-sm text-dim">Up next: <span className="text-fg">{setNo < totalSets ? `${step.ex.name} — set ${setNo + 1}` : next ? next.ex.name : "Finish"}</span></p>
                  <div className="mt-5 flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => endsAt && setEndsAt(endsAt + 15000)}><Plus className="h-4 w-4" />15s</Button>
                    <Button size="sm" onClick={() => { stopTimer(); afterRest(); }}><SkipForward className="h-4 w-4" /> Skip rest</Button>
                  </div>
                </motion.div>
              )}
              {phase === "countdown" && (
                <motion.div key="countdown" className="absolute inset-0 z-10 grid place-items-center bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.span key={Math.ceil(remaining)} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-[9rem] font-bold leading-none text-lime tabular">{Math.max(1, Math.ceil(remaining))}</motion.span>
                </motion.div>
              )}
              {paused && (
                <motion.div key="paused" className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="font-display text-4xl font-bold">Paused</p>
                  <div className="flex gap-3">
                    <Button size="lg" onClick={togglePauseWorkout}><Play className="h-5 w-5" /> Resume</Button>
                    <Button size="lg" variant="secondary" onClick={finish}>End workout</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Transport */}
          <div className="flex items-center justify-between gap-2">
            <Button variant="secondary" onClick={() => goTo(idx - 1)} disabled={idx === 0}><ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span></Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => (idx === steps.length - 1 ? finish() : goTo(idx + 1))}><SkipForward className="h-4 w-4" /> Skip</Button>
            </div>
            <Button variant="secondary" onClick={() => (idx === steps.length - 1 ? finish() : goTo(idx + 1))}><span className="hidden sm:inline">{idx === steps.length - 1 ? "Finish" : "Next"}</span> <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </section>

        {/* Coach panel */}
        <aside className="flex flex-col gap-4">
          <div className="card p-5">
            <div className="grid grid-cols-2 gap-1 rounded-full bg-ink p-1" role="tablist" aria-label="Training mode">
              {(["reps", "time"] as const).map((m) => (
                <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)} disabled={m === "reps" && step.item.reps === 0} title={m === "reps" && step.item.reps === 0 ? "This movement is done for time" : undefined}
                  className={cx("flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40", mode === m ? "bg-raised text-fg shadow" : "text-mute hover:text-fg")}>
                  {m === "reps" ? <Repeat className="h-4 w-4" /> : <Timer className="h-4 w-4" />}{m === "reps" ? "Rep mode" : "Timer mode"}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col items-center text-center">
              {mode === "reps" ? (
                <>
                  <p className="text-sm text-dim">{totalSets} {totalSets === 1 ? "set" : "sets"} × {step.item.reps} reps{step.ex.unilateral ? " per side" : ""}</p>
                  <button onClick={() => { begin(); setReps((r) => Math.min(r + 1, 99)); if (phase === "ready") setPhase("work"); }}
                    className="group relative mt-4 grid h-44 w-44 place-items-center rounded-full border border-line-strong bg-raised transition active:scale-95" aria-label="Count a rep">
                    <span className="absolute inset-2 rounded-full border border-lime/20" />
                    <span>
                      <span className="block font-display text-6xl font-bold tabular">{reps}<span className="text-2xl text-mute">/{step.item.reps}</span></span>
                      <span className="text-xs text-mute">tap to count reps</span>
                    </span>
                  </button>
                  <Button size="lg" className="mt-6 w-full" onClick={completeSet}><Check className="h-5 w-5" /> Complete set {setNo}</Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-dim">{totalSets} {totalSets === 1 ? "set" : "sets"} × {step.item.seconds} seconds</p>
                  <div className="mt-4">
                    <Ring value={phase === "work" ? remaining / step.item.seconds : 1} size={176} stroke={10} label="Set timer">
                      <span className="font-display text-5xl font-bold tabular">{fmt(phase === "work" ? remaining : step.item.seconds)}</span>
                    </Ring>
                  </div>
                  <div className="mt-6 grid w-full grid-cols-[1fr_auto] gap-2">
                    {running && phase === "work" ? (
                      <Button size="lg" variant="secondary" onClick={timerPause}><Pause className="h-5 w-5" /> Pause</Button>
                    ) : (
                      <Button size="lg" onClick={timerStart}><Play className="h-5 w-5 fill-current" /> {phase === "work" && frozen > 0 && frozen < step.item.seconds ? "Resume" : "Start"}</Button>
                    )}
                    <Button size="lg" variant="secondary" onClick={timerReset} aria-label="Reset timer"><RotateCcw className="h-5 w-5" /></Button>
                  </div>
                  {phase === "work" && <button onClick={completeSet} className="mt-3 text-sm text-mute hover:text-fg">Mark set complete</button>}
                </>
              )}
              <div className="mt-5 flex gap-1.5" aria-label={`${done[idx]} of ${totalSets} sets done`}>
                {Array.from({ length: totalSets }).map((_, i) => (
                  <span key={i} className={cx("h-2 w-8 rounded-full transition", i < done[idx] ? "bg-lime" : i === setNo - 1 ? "bg-white/40" : "bg-white/10")} />
                ))}
              </div>
              <p className="mt-3 text-xs text-mute">Rest {step.item.restSec}s between sets · target {workTarget}{mode === "time" ? "s" : " reps"}</p>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex gap-1 border-b border-line" role="tablist">
              {([["how", "How to"], ["posture", "Posture"], ["mistakes", "Mistakes"]] as const).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx("-mb-px border-b-2 px-3 pb-2.5 text-sm font-medium transition", tab === k ? "border-lime text-fg" : "border-transparent text-mute hover:text-fg")}>{l}</button>
              ))}
            </div>
            <div className="mt-4 text-sm leading-relaxed text-dim">
              {tab === "how" && <ol className="space-y-2.5">{step.ex.instructions.map((s, i) => <li key={i} className="flex gap-3"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/5 text-[11px] font-semibold text-fg">{i + 1}</span>{s}</li>)}</ol>}
              {tab === "posture" && <ul className="space-y-2">{step.ex.posture.map((s) => <li key={s} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" />{s}</li>)}</ul>}
              {tab === "mistakes" && <ul className="space-y-2">{step.ex.mistakes.map((s) => <li key={s} className="flex gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-coral" />{s}</li>)}</ul>}
            </div>
          </div>

          {next && (
            <button onClick={() => goTo(idx + 1)} className="card flex items-center gap-3 p-3 text-left transition hover:border-line-strong">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-ink"><ExerciseMedia exercise={next.ex} compact showBadge={false} playing={false} /></div>
              <div className="min-w-0"><p className="text-[11px] uppercase tracking-wider text-mute">Next</p><p className="truncate font-semibold">{next.ex.name}</p><p className="text-xs text-dim">{next.item.sets} × {next.item.mode === "time" ? `${next.item.seconds}s` : `${next.item.reps} reps`}</p></div>
              <ChevronRight className="ml-auto h-4 w-4 text-mute" />
            </button>
          )}
        </aside>
      </div>
      )}
    </div>
  );
}

function CompletionScreen(props: { day: PlanDay; date: string; durationSec: number; kcal: number; setsDone: number; setsTotal: number; exercisesDone: number; exercisesTotal: number }) {
  const [feedback, setFeedback] = useState<"too_easy" | "just_right" | "too_hard" | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ level: number; previousLevel: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true); setError(null);
    const r = await completeWorkoutAction({
      date: props.date, dow: props.day.dow, title: props.day.title, durationSec: props.durationSec,
      setsDone: props.setsDone, setsTotal: props.setsTotal, exercisesDone: props.exercisesDone, exercisesTotal: props.exercisesTotal,
      kcalEstimate: props.kcal, feedback,
    }).catch(() => ({ error: "Couldn't save — check your connection and try again." }));
    setSaving(false);
    if ("error" in r) setError(r.error); else setResult(r);
  };

  const pct = props.setsTotal ? Math.round((props.setsDone / props.setsTotal) * 100) : 0;
  return (
    <div className="bg-aurora grid min-h-dvh place-items-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-xl text-center">
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <span className="animate-pulse-ring absolute inset-0 rounded-full bg-lime/30" />
          <span className="relative grid h-24 w-24 place-items-center rounded-full bg-lime text-lime-ink"><Trophy className="h-10 w-10" /></span>
        </div>
        <h1 className="mt-8 font-display text-4xl font-bold tracking-tight md:text-5xl">Workout complete</h1>
        <p className="mt-2 text-dim">{props.day.title}</p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Duration" value={fmt(props.durationSec)} />
          <Metric label="Sets" value={`${props.setsDone}/${props.setsTotal}`} />
          <Metric label="Completion" value={`${pct}%`} />
          <Metric label="Calories" value={`≈${props.kcal}`} note="estimate" />
        </div>

        {!result ? (
          <div className="card mt-8 p-6 text-left">
            <p className="font-semibold">How did that feel?</p>
            <p className="text-sm text-dim">Your answer tunes the difficulty of upcoming sessions.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {([["too_easy", "Too easy"], ["just_right", "Just right"], ["too_hard", "Too hard"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setFeedback(k)} aria-pressed={feedback === k}
                  className={cx("rounded-xl border px-3 py-3 text-sm font-medium transition", feedback === k ? "border-lime/60 bg-lime/10 text-lime" : "border-line bg-ink text-dim hover:text-fg")}>{l}</button>
              ))}
            </div>
            {error && <p className="mt-3 text-sm text-coral" role="alert">{error}</p>}
            <Button size="lg" className="mt-5 w-full" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} Save workout</Button>
          </div>
        ) : (
          <div className="card mt-8 p-6">
            <p className="flex items-center justify-center gap-2 font-semibold"><Dumbbell className="h-4 w-4 text-lime" />Saved to your progress</p>
            <p className="mt-2 text-sm text-dim">
              {result.level > result.previousLevel ? `Nice — your plan has levelled up to ${result.level}/5. Expect a few more reps or seconds next time.`
                : result.level < result.previousLevel ? `We've eased your plan to level ${result.level}/5 so you can build back up with good form.`
                : `Your plan stays at level ${result.level}/5. Keep stacking consistent sessions.`}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/app" className="inline-flex h-11 items-center rounded-full bg-lime px-5 text-sm font-semibold text-lime-ink">Back to today</Link>
              <Link href="/app/nutrition" className="inline-flex h-11 items-center rounded-full border border-line-strong px-5 text-sm font-semibold">Log a meal</Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] uppercase tracking-wider text-mute">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular">{value}</p>
      {note && <p className="text-[10px] text-mute">{note}</p>}
    </div>
  );
}
