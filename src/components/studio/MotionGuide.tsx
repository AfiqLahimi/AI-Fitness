"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MOTIONS, FLOOR, L, sample, type Skeleton, type Pt } from "@/lib/media/motion";
import type { Exercise, Muscle } from "@/lib/fitness/exercises";

type Seg = "torso" | "ua" | "fa" | "th" | "sh";
const MUSCLE_SEGS: Partial<Record<Muscle, Seg[]>> = {
  biceps: ["ua"], triceps: ["ua"], forearms: ["fa"], shoulders: ["ua"], chest: ["torso"], back: ["torso"], lats: ["torso"],
  core: ["torso"], obliques: ["torso"], quads: ["th"], hamstrings: ["th"], glutes: ["th"], calves: ["sh"],
  full_body: ["torso", "ua", "fa", "th", "sh"], cardio: ["torso", "th", "sh"],
};

function seg(a: Pt, b: Pt, w: number, color: string, glow?: boolean) {
  return (
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={w} strokeLinecap="round" filter={glow ? "url(#mg-glow)" : undefined} />
  );
}

export function MotionGuide({ exercise, playing = true, speed = 1, compact = false }: { exercise: Exercise; playing?: boolean; speed?: number; compact?: boolean }) {
  const def = MOTIONS[exercise.pattern];
  const [skel, setSkel] = useState<Skeleton>(() => sample(def, 0).skel);
  const t0 = useRef<number | null>(null);
  const elapsed = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    elapsed.current = 0;
    t0.current = null;
    setSkel(sample(def, 0).skel);
  }, [def]);

  useEffect(() => {
    if (!playing) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const tick = (now: number) => {
      if (t0.current === null) t0.current = now - elapsed.current;
      elapsed.current = now - t0.current;
      setSkel(sample(def, elapsed.current, reduce ? 0.5 : speed).skel);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf.current); t0.current = null; };
  }, [def, playing, speed]);

  const hot = useMemo(() => new Set(exercise.primary.flatMap((m) => MUSCLE_SEGS[m] ?? [])), [exercise]);
  const props = def.props ?? [];
  const eq = exercise.equipment;
  const weight = eq.includes("dumbbells") ? "db" : eq.includes("kettlebell") && !eq.includes("dumbbells") ? "kb" : eq.includes("barbell") && !eq.includes("dumbbells") ? "bb" : null;

  const NEAR = "#ececef", FAR = "#5b5b66", HOT = "#c6ff3d", HOT_FAR = "#6f8f22";
  const c = (s: Seg, near: boolean) => (hot.has(s) ? (near ? HOT : HOT_FAR) : near ? NEAR : FAR);

  const limbs = (side: Skeleton["near"], near: boolean) => {
    const w = near ? 1 : 0.86;
    return (
      <g opacity={near ? 1 : 0.95}>
        {seg(side.hip, side.knee, 19 * w, c("th", near), near && hot.has("th"))}
        {seg(side.knee, side.ankle, 15 * w, c("sh", near), near && hot.has("sh"))}
        {seg(side.ankle, side.toe, 10 * w, near ? "#d4d4d8" : "#4a4a52")}
      </g>
    );
  };
  const arms = (side: Skeleton["near"], near: boolean) => {
    const w = near ? 1 : 0.86;
    return (
      <g>
        {seg(side.shoulder, side.elbow, 14 * w, c("ua", near), near && hot.has("ua"))}
        {seg(side.elbow, side.hand, 12 * w, c("fa", near), near && hot.has("fa"))}
        <circle cx={side.hand.x} cy={side.hand.y} r={6.5 * w} fill={near ? "#e4e4e7" : "#4a4a52"} />
        {weight === "db" && <Dumbbell at={side.hand} near={near} view={skel.view} />}
        {weight === "kb" && near && <circle cx={side.hand.x} cy={side.hand.y + 14} r={12} fill="#2a2a30" stroke="#55555f" strokeWidth={3} />}
      </g>
    );
  };

  const s = skel;
  const torsoW = s.view === "front" ? 40 : 30;
  const shadowX = (s.near.ankle.x + s.far.ankle.x + s.hip.x) / 3;

  return (
    <svg viewBox="0 0 400 380" className="h-full w-full" role="img" aria-label={`Animated demonstration of ${exercise.name}`}>
      <defs>
        <radialGradient id="mg-spot" cx="50%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#c6ff3d" stopOpacity="0.10" />
          <stop offset="60%" stopColor="#c6ff3d" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mg-floor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#c6ff3d" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#c6ff3d" stopOpacity="0" />
        </linearGradient>
        <filter id="mg-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="400" height="380" fill="url(#mg-spot)" />
      {!compact && (
        <g opacity="0.35">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={i} x1={-200 + i * 100} y1={380} x2={200 + (i - 4) * 18} y2={FLOOR} stroke="#2a2a30" strokeWidth="1" />
          ))}
        </g>
      )}
      <line x1="20" y1={FLOOR} x2="380" y2={FLOOR} stroke="#2f2f35" strokeWidth="1.5" />
      <rect x="20" y={FLOOR} width="360" height="30" fill="url(#mg-floor)" opacity="0.18" />
      <ellipse cx={shadowX} cy={FLOOR + 4} rx="70" ry="7" fill="#000" opacity="0.55" />

      {props.includes("bench") && (
        <g>
          <rect x={exercise.pattern === "dip" ? 70 : 120} y={FLOOR - 74} width={exercise.pattern === "dip" ? 90 : 170} height="14" rx="5" fill="#26262c" stroke="#3a3a42" />
          <rect x={exercise.pattern === "dip" ? 82 : 140} y={FLOOR - 60} width="8" height="60" fill="#1d1d22" />
          <rect x={exercise.pattern === "dip" ? 140 : 270} y={FLOOR - 60} width="8" height="60" fill="#1d1d22" />
        </g>
      )}
      {props.includes("bar") && (
        <g>
          <line x1="90" y1="64" x2="320" y2="64" stroke="#8a8a94" strokeWidth="6" strokeLinecap="round" />
          <line x1="96" y1="64" x2="96" y2={FLOOR} stroke="#26262c" strokeWidth="8" />
          <line x1="314" y1="64" x2="314" y2={FLOOR} stroke="#26262c" strokeWidth="8" />
        </g>
      )}

      {/* far side */}
      {limbs(s.far, false)}
      {arms(s.far, false)}

      {/* torso */}
      <line x1={s.hip.x} y1={s.hip.y} x2={s.shoulder.x} y2={s.shoulder.y} stroke={hot.has("torso") ? HOT : "#d9d9de"} strokeWidth={torsoW} strokeLinecap="round" filter={hot.has("torso") ? "url(#mg-glow)" : undefined} />
      <line x1={s.shoulder.x} y1={s.shoulder.y} x2={s.neck.x} y2={s.neck.y} stroke="#cfcfd5" strokeWidth={11} strokeLinecap="round" />
      <circle cx={s.head.x} cy={s.head.y} r={L.head} fill="#e8e8ec" />

      {/* near side */}
      {limbs(s.near, true)}
      {arms(s.near, true)}

      {weight === "bb" && (
        <g>
          <line x1={s.near.hand.x - 70} y1={s.near.hand.y} x2={s.near.hand.x + 70} y2={s.near.hand.y} stroke="#9a9aa4" strokeWidth={5} strokeLinecap="round" />
          <rect x={s.near.hand.x - 82} y={s.near.hand.y - 22} width="12" height="44" rx="3" fill="#2d2d33" />
          <rect x={s.near.hand.x + 70} y={s.near.hand.y - 22} width="12" height="44" rx="3" fill="#2d2d33" />
        </g>
      )}
    </svg>
  );
}

function Dumbbell({ at, near, view }: { at: Pt; near: boolean; view: "side" | "front" }) {
  const col = near ? "#3a3a42" : "#26262b";
  if (view === "front") {
    return (
      <g>
        <rect x={at.x - 4} y={at.y - 14} width="8" height="28" rx="2" fill={col} />
        <rect x={at.x - 9} y={at.y - 18} width="18" height="9" rx="3" fill={col} />
        <rect x={at.x - 9} y={at.y + 9} width="18" height="9" rx="3" fill={col} />
      </g>
    );
  }
  return (
    <g>
      <circle cx={at.x} cy={at.y} r={near ? 13 : 11} fill={col} stroke={near ? "#55555f" : "#33333a"} strokeWidth="3" />
      <circle cx={at.x} cy={at.y} r={4} fill={near ? "#77777f" : "#3a3a40"} />
    </g>
  );
}
