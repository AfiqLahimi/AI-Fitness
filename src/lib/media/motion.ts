/**
 * Procedural motion engine for the animated trainer.
 * Each movement pattern is a loop of keyframe poses (joint angles). Angles are
 * absolute in degrees: limbs 0 = pointing straight down, +90 = forward (facing
 * direction), 180 = straight up, −90 = backwards. Torso 0 = upright, +90 = leaning
 * fully forward. The solver turns angles into 2D joint positions and grounds them.
 */
import type { MotionPattern } from "../fitness/exercises";

export type View = "side" | "front";
export type Ground =
  | { mode: "feet"; anchorX?: number }
  | { mode: "hands"; anchorX?: number; surfaceY?: number; ik?: [boolean, boolean] }
  | { mode: "lowest"; anchorX?: number }
  | { mode: "hang"; barY: number; anchorX?: number }
  | { mode: "fixed"; hip: [number, number] };

export interface Pose {
  t: number; // torso
  head?: number; // absolute head direction, defaults to torso
  ua: [number, number]; // upper arm [near, far]
  fa: [number, number];
  th: [number, number]; // thigh
  sh: [number, number]; // shin
  foot?: [number, number]; // foot offset from perpendicular-to-shin
  air?: number; // lift off the ground
  ik?: [boolean, boolean]; // straight legs solved to reach the floor (plank family)
}

export interface Frame { pose: Pose; ground: Ground; hold: number; move: number } // ms

export interface MotionDef {
  view: View;
  frames: Frame[];
  props?: ("bench" | "bar")[];
}

export const FLOOR = 340;
export const L = { torso: 92, neck: 10, head: 17, ua: 52, fa: 50, th: 70, sh: 66, foot: 20, shoulderHalf: 24, hipHalf: 13 };

const STAND: Pose = { t: 0, ua: [6, -4], fa: [10, -2], th: [0, 0], sh: [0, 0] };
const P = (o: Partial<Pose>, base: Pose = STAND): Pose => ({ ...base, ...o });
const feet: Ground = { mode: "feet", anchorX: 200 };
const hands = (ik: [boolean, boolean] = [true, true], anchorX = 250): Ground => ({ mode: "hands", anchorX, ik });
const lowest: Ground = { mode: "lowest", anchorX: 200 };
const f = (pose: Pose, ground: Ground, hold = 250, move = 900): Frame => ({ pose, ground, hold, move });

const PLANK_HIGH = P({ t: 78, ua: [0, 0], fa: [0, 0], th: [-70, -70], sh: [-70, -70], ik: [true, true] });
const LYING = P({ t: -90, head: -90, ua: [90, 90], fa: [90, 90], th: [140, 140], sh: [10, 10] });

export const MOTIONS: Record<MotionPattern, MotionDef> = {
  curl: {
    view: "side",
    frames: [f(P({ ua: [4, 0], fa: [6, 2] }), feet, 250, 1100), f(P({ ua: [10, 6], fa: [150, 144] }), feet, 400, 1800)],
  },
  hammer_curl: {
    view: "side",
    frames: [f(P({ ua: [4, 0], fa: [6, 2] }), feet, 250, 1100), f(P({ ua: [10, 6], fa: [138, 132] }), feet, 400, 1800)],
  },
  overhead_press: {
    view: "side",
    frames: [f(P({ ua: [20, 16], fa: [172, 168] }), feet, 250, 1000), f(P({ ua: [176, 172], fa: [178, 174] }), feet, 300, 1500)],
  },
  lateral_raise: {
    view: "front",
    frames: [f(P({ ua: [8, 8], fa: [12, 12] }), feet, 250, 1000), f(P({ ua: [86, 86], fa: [92, 92] }), feet, 350, 1600)],
  },
  front_raise: {
    view: "side",
    frames: [f(P({ ua: [6, 2], fa: [6, 2] }), feet, 250, 1000), f(P({ ua: [90, 86], fa: [92, 88] }), feet, 300, 1500)],
  },
  squat: {
    view: "side",
    frames: [
      f(P({ ua: [70, 66], fa: [80, 76] }), feet, 300, 1500),
      f(P({ t: 38, ua: [88, 84], fa: [90, 86], th: [86, 82], sh: [-22, -20] }), feet, 250, 1200),
    ],
  },
  lunge: {
    view: "side",
    frames: [
      f(P({ ua: [4, -2], fa: [6, 0], th: [8, -8], sh: [0, -8] }), feet, 250, 1200),
      f(P({ t: 4, ua: [6, 0], fa: [8, 2], th: [82, -22], sh: [-2, -100], foot: [0, -60] }), feet, 300, 1200),
    ],
  },
  pushup: {
    view: "side",
    frames: [
      f(PLANK_HIGH, hands(), 250, 1400),
      f(P({ t: 86, ua: [-62, -62], fa: [28, 28] }, PLANK_HIGH), hands(), 200, 1000),
    ],
  },
  plank: {
    view: "side",
    frames: [
      f(P({ t: 82, ua: [0, 0], fa: [90, 90], th: [-80, -80], sh: [-80, -80], ik: [true, true] }), hands(), 600, 1600),
      f(P({ t: 80, ua: [2, 2], fa: [90, 90], th: [-80, -80], sh: [-80, -80], ik: [true, true] }), hands(), 600, 1600),
    ],
  },
  side_plank: {
    view: "side",
    frames: [
      f(P({ t: 72, ua: [0, 176], fa: [90, 178], th: [-75, -75], sh: [-75, -75], ik: [true, true] }), hands(), 700, 1600),
      f(P({ t: 70, ua: [2, 176], fa: [90, 178], th: [-75, -75], sh: [-75, -75], ik: [true, true] }), hands(), 700, 1600),
    ],
  },
  row: {
    view: "side",
    frames: [
      f(P({ t: 62, ua: [0, 2], fa: [0, 2], th: [18, 14], sh: [-8, -8] }), feet, 250, 1000),
      f(P({ t: 62, ua: [-70, 2], fa: [-6, 2], th: [18, 14], sh: [-8, -8] }), feet, 350, 1500),
    ],
  },
  hinge: {
    view: "side",
    frames: [
      f(P({ ua: [2, -2], fa: [2, -2], th: [2, 0], sh: [0, 0] }), feet, 250, 1600),
      f(P({ t: 72, head: 60, ua: [0, -2], fa: [0, -2], th: [16, 14], sh: [-4, -4] }), feet, 250, 1300),
    ],
  },
  glute_bridge: {
    view: "side",
    frames: [
      f(P({ th: [140, 136], sh: [12, 10], ua: [92, 92], fa: [90, 90] }, LYING), lowest, 300, 1100),
      f(P({ t: -108, head: -95, th: [112, 108], sh: [-6, -8], ua: [96, 96], fa: [92, 92] }, LYING), lowest, 500, 1500),
    ],
  },
  crunch: {
    view: "side",
    frames: [
      f(P({ ua: [140, 140], fa: [110, 110] }, LYING), lowest, 300, 1100),
      f(P({ t: -58, head: -48, ua: [140, 140], fa: [110, 110] }, LYING), lowest, 300, 1300),
    ],
  },
  leg_raise: {
    view: "side",
    frames: [
      f(P({ th: [88, 86], sh: [88, 86], ua: [90, 90], fa: [90, 90] }, LYING), lowest, 300, 1500),
      f(P({ th: [178, 176], sh: [178, 176], ua: [90, 90], fa: [90, 90] }, LYING), lowest, 300, 1800),
    ],
  },
  jumping_jack: {
    view: "front",
    frames: [
      f(P({ ua: [8, 8], fa: [10, 10], th: [3, 3], sh: [3, 3] }), feet, 60, 300),
      f(P({ ua: [90, 90], fa: [120, 120], th: [12, 12], sh: [12, 12], air: 16 }), feet, 0, 300),
      f(P({ ua: [165, 165], fa: [172, 172], th: [20, 20], sh: [20, 20] }), feet, 60, 300),
      f(P({ ua: [90, 90], fa: [120, 120], th: [12, 12], sh: [12, 12], air: 16 }), feet, 0, 300),
    ],
  },
  mountain_climber: {
    view: "side",
    frames: [
      f(P({ th: [62, -70], sh: [-40, -70], ik: [false, true] }, PLANK_HIGH), hands(), 40, 380),
      f(P({ th: [-70, 62], sh: [-70, -40], ik: [true, false] }, PLANK_HIGH), hands(), 40, 380),
    ],
  },
  tricep_extension: {
    view: "side",
    frames: [
      f(P({ ua: [172, 168], fa: [176, 172] }), feet, 300, 1100),
      f(P({ ua: [166, 162], fa: [-16, -20] }), feet, 300, 1700),
    ],
  },
  dip: {
    view: "side",
    props: ["bench"],
    frames: [
      f(P({ ua: [-22, -22], fa: [-2, -2], th: [90, 88], sh: [0, 2] }), { mode: "hands", anchorX: 150, surfaceY: FLOOR - 74 }, 250, 1100),
      f(P({ ua: [-82, -82], fa: [10, 10], th: [84, 82], sh: [64, 62] }), { mode: "hands", anchorX: 150, surfaceY: FLOOR - 74 }, 250, 1500),
    ],
  },
  pullup: {
    view: "side",
    props: ["bar"],
    frames: [
      f(P({ t: -4, ua: [178, 176], fa: [178, 176], th: [-6, -6], sh: [-40, -40] }), { mode: "hang", barY: 64, anchorX: 205 }, 300, 1400),
      f(P({ t: -12, ua: [118, 114], fa: [176, 172], th: [10, 10], sh: [-40, -40] }), { mode: "hang", barY: 64, anchorX: 205 }, 300, 1700),
    ],
  },
  calf_raise: {
    view: "side",
    frames: [
      f(P({}), feet, 300, 900),
      f(P({ foot: [-52, -52] }), feet, 400, 1200),
    ],
  },
  bench_press: {
    view: "side",
    props: ["bench"],
    frames: [
      f(P({ ua: [178, 178], fa: [180, 180], th: [80, 78], sh: [2, 2] }, LYING), { mode: "fixed", hip: [240, FLOOR - 92] }, 250, 1300),
      f(P({ ua: [16, 16], fa: [176, 176], th: [80, 78], sh: [2, 2] }, LYING), { mode: "fixed", hip: [240, FLOOR - 92] }, 250, 1800),
    ],
  },
  high_knees: {
    view: "side",
    frames: [
      f(P({ ua: [-35, 45], fa: [60, 130], th: [95, -8], sh: [0, -20], air: 6 }), feet, 0, 260),
      f(P({ ua: [45, -35], fa: [130, 60], th: [-8, 95], sh: [-20, 0], air: 6 }), feet, 0, 260),
    ],
  },
  burpee: {
    view: "side",
    frames: [
      f(P({ ua: [2, -2], fa: [4, 0] }), feet, 120, 500),
      f(P({ t: 70, ua: [20, 16], fa: [10, 8], th: [110, 106], sh: [-50, -48] }), feet, 100, 450),
      f(PLANK_HIGH, hands(), 220, 450),
      f(P({ t: 70, ua: [20, 16], fa: [10, 8], th: [110, 106], sh: [-50, -48] }), feet, 80, 400),
      f(P({ ua: [176, 172], fa: [178, 174], air: 34, foot: [-30, -30] }), feet, 120, 600),
    ],
  },
  arm_circles: {
    view: "front",
    frames: [
      f(P({ ua: [80, 80], fa: [80, 80] }), feet, 0, 300),
      f(P({ ua: [96, 96], fa: [96, 96] }), feet, 0, 300),
      f(P({ ua: [104, 104], fa: [104, 104] }), feet, 0, 300),
      f(P({ ua: [88, 88], fa: [88, 88] }), feet, 0, 300),
    ],
  },
  stretch_hamstring: {
    view: "side",
    frames: [
      f(P({ t: 52, head: 40, ua: [38, 34], fa: [36, 32], th: [26, -8], sh: [26, 6], foot: [-40, 0] }), feet, 1400, 1500),
      f(P({ t: 60, head: 48, ua: [32, 28], fa: [30, 26], th: [26, -8], sh: [26, 6], foot: [-40, 0] }), feet, 1400, 1500),
    ],
  },
  stretch_quad: {
    view: "side",
    frames: [
      f(P({ ua: [8, -36], fa: [10, -60], th: [0, -4], sh: [0, -168] }), feet, 1400, 1500),
      f(P({ t: 2, ua: [8, -40], fa: [10, -64], th: [0, -10], sh: [0, -166] }), feet, 1400, 1500),
    ],
  },
  march: {
    view: "side",
    frames: [
      f(P({ ua: [-28, 28], fa: [-10, 50], th: [62, -2], sh: [-4, 0] }), feet, 60, 450),
      f(P({ ua: [28, -28], fa: [50, -10], th: [-2, 62], sh: [0, -4] }), feet, 60, 450),
    ],
  },
};

// ───────────────────────── Solver

export interface Pt { x: number; y: number }
export interface Skeleton {
  view: View;
  hip: Pt; shoulder: Pt; head: Pt; neck: Pt;
  near: { shoulder: Pt; elbow: Pt; hand: Pt; hip: Pt; knee: Pt; ankle: Pt; toe: Pt };
  far: { shoulder: Pt; elbow: Pt; hand: Pt; hip: Pt; knee: Pt; ankle: Pt; toe: Pt };
}

const rad = (d: number) => (d * Math.PI) / 180;
const limb = (p: Pt, len: number, a: number, mirror = 1): Pt => ({ x: p.x + mirror * len * Math.sin(rad(a)), y: p.y + len * Math.cos(rad(a)) });

function legAngleToFloor(hip: Pt, floorY: number): number {
  const reach = L.th + L.sh + L.foot * 0.85;
  const dy = Math.min(reach * 0.999, Math.max(0, floorY - hip.y));
  return -Math.acos(dy / reach) * (180 / Math.PI); // backwards
}

/** Forward kinematics from a hip position. */
export function fk(pose: Pose, view: View, hip: Pt, floorY = FLOOR): Skeleton {
  const torsoDir = { x: Math.sin(rad(pose.t)), y: -Math.cos(rad(pose.t)) };
  const shoulder = { x: hip.x + torsoDir.x * L.torso, y: hip.y + torsoDir.y * L.torso };
  const ha = pose.head ?? pose.t;
  const neck = { x: shoulder.x + Math.sin(rad(ha)) * L.neck, y: shoulder.y - Math.cos(rad(ha)) * L.neck };
  const head = { x: shoulder.x + Math.sin(rad(ha)) * (L.neck + L.head), y: shoulder.y - Math.cos(rad(ha)) * (L.neck + L.head) };

  const side = (i: 0 | 1) => {
    const front = view === "front";
    const m = front ? (i === 0 ? 1 : -1) : 1;
    const sOff = front ? m * L.shoulderHalf : 0;
    const hOff = front ? m * L.hipHalf : 0;
    const sh0 = { x: shoulder.x + sOff, y: shoulder.y + (front ? 4 : 0) };
    const hp0 = { x: hip.x + hOff, y: hip.y };
    const elbow = limb(sh0, L.ua, pose.ua[i], m);
    const hand = limb(elbow, L.fa, pose.fa[i], m);
    let th = pose.th[i], shn = pose.sh[i];
    if (pose.ik?.[i] && !front) { th = legAngleToFloor(hp0, floorY); shn = th; }
    const knee = limb(hp0, L.th, th, m);
    const ankle = limb(knee, L.sh, shn, m);
    const footA = front ? shn + 180 : shn + 90 + (pose.foot?.[i] ?? 0);
    const toe = front ? limb(ankle, 6, 0, m) : limb(ankle, L.foot, pose.ik?.[i] ? shn + 20 : footA, m);
    return { shoulder: sh0, elbow, hand, hip: hp0, knee, ankle, toe };
  };
  return { view, hip, shoulder, head, neck, near: side(0), far: side(1) };
}

function allPoints(s: Skeleton): Pt[] {
  return [s.head, s.shoulder, s.hip, ...Object.values(s.near), ...Object.values(s.far)];
}

/** Solve a pose under its ground constraint to an absolute skeleton. */
export function solve(pose: Pose, view: View, g: Ground): Skeleton {
  if (g.mode === "fixed") return fk(pose, view, { x: g.hip[0], y: g.hip[1] });

  if (g.mode === "hands" || g.mode === "hang") {
    // Place the near hand on the surface/bar and walk back up the chain to the hip.
    const surface = g.mode === "hang" ? g.barY : g.surfaceY ?? FLOOR;
    const probe = fk({ ...pose, ik: [false, false] }, view, { x: 0, y: 0 });
    const dx = probe.near.hand.x, dy = probe.near.hand.y;
    const hip = { x: (g.anchorX ?? 200) - dx, y: surface - dy };
    return fk(pose, view, hip);
  }

  // feet / lowest: drop the figure until its lowest point touches the floor.
  const probe = fk(pose, view, { x: 0, y: 0 });
  const pts = g.mode === "feet" ? [probe.near.ankle, probe.near.toe, probe.far.ankle, probe.far.toe] : allPoints(probe);
  const maxY = Math.max(...pts.map((p) => p.y + (g.mode === "lowest" ? 4 : 0)));
  const anchor = g.mode === "feet" ? probe.near.ankle.x : probe.hip.x;
  const lift = pose.air ?? 0;
  return fk(pose, view, { x: (g.anchorX ?? 200) - anchor, y: FLOOR - maxY - 6 - lift });
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpPair = (a: [number, number], b: [number, number], k: number): [number, number] => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

function blendPose(a: Pose, b: Pose, k: number): Pose {
  return {
    t: lerp(a.t, b.t, k),
    head: lerp(a.head ?? a.t, b.head ?? b.t, k),
    ua: lerpPair(a.ua, b.ua, k), fa: lerpPair(a.fa, b.fa, k),
    th: lerpPair(a.th, b.th, k), sh: lerpPair(a.sh, b.sh, k),
    foot: lerpPair(a.foot ?? [0, 0], b.foot ?? [0, 0], k),
    air: lerp(a.air ?? 0, b.air ?? 0, k),
    ik: k < 0.5 ? a.ik : b.ik,
  };
}

export function cycleLength(def: MotionDef): number {
  return def.frames.reduce((s, fr) => s + fr.hold + fr.move, 0);
}

/**
 * Sample the motion at time `ms`. Returns the skeleton and the phase (0–1) of the loop.
 * When consecutive frames share a ground mode we re-solve every tick (contacts stay planted);
 * otherwise we interpolate the solved hips so the transition is continuous.
 */
export function sample(def: MotionDef, ms: number, speed = 1): { skel: Skeleton; phase: number } {
  const total = cycleLength(def);
  let t = (ms * speed) % total;
  for (let i = 0; i < def.frames.length; i++) {
    const a = def.frames[i];
    const b = def.frames[(i + 1) % def.frames.length];
    if (t < a.hold) return { skel: solve(a.pose, def.view, a.ground), phase: ((ms * speed) % total) / total };
    t -= a.hold;
    if (t < a.move) {
      const k = ease(t / a.move);
      const pose = blendPose(a.pose, b.pose, k);
      if (a.ground.mode === b.ground.mode && JSON.stringify(a.ground) === JSON.stringify(b.ground)) {
        return { skel: solve(pose, def.view, a.ground), phase: ((ms * speed) % total) / total };
      }
      const sa = solve(a.pose, def.view, a.ground);
      const sb = solve(b.pose, def.view, b.ground);
      const hip = { x: lerp(sa.hip.x, sb.hip.x, k), y: lerp(sa.hip.y, sb.hip.y, k) };
      return { skel: fk(pose, def.view, hip), phase: ((ms * speed) % total) / total };
    }
    t -= a.move;
  }
  return { skel: solve(def.frames[0].pose, def.view, def.frames[0].ground), phase: 0 };
}
