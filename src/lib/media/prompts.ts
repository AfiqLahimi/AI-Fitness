/**
 * Prompts for generating exercise demo videos with an external AI video tool
 * (e.g. Wan 2.2 running locally, or Kling / PixVerse web apps). Nothing here calls a paid API:
 * you copy a prompt, generate the clip yourself, and upload it on the Video Library page.
 *
 * Consistency tip: first generate ONE reference photo of the trainer with the character
 * prompt, then use image-to-video for every exercise with that same photo.
 */
import type { Exercise } from "../fitness/exercises";

export interface Trainer { id: string; name: string; character: string }

/** Fictional adult trainers — not based on any real person. */
export const TRAINERS: Trainer[] = [
  {
    id: "maya",
    name: "Coach Maya",
    character:
      "a fictional adult female fitness coach in her early 30s, Southeast Asian, athletic build, black hair tied in a high ponytail, charcoal-grey sports top, black leggings, white trainers with lime-green accents, calm confident expression",
  },
  {
    id: "adam",
    name: "Coach Adam",
    character:
      "a fictional adult male fitness coach in his early 30s, Southeast Asian, athletic build, short black hair, fitted charcoal-grey t-shirt, black training shorts, white trainers with lime-green accents, calm confident expression",
  },
];

const SCENE =
  "minimalist dark-grey fitness studio, plain seamless background, soft key light from the front-left and a subtle rim light, full body always in frame, static tripod camera at hip height, 45-degree front-side angle, realistic human anatomy and natural motion, 24 fps, no text, no logos, no music";

const NEGATIVE =
  "extra limbs, extra fingers, deformed hands, distorted face, morphing body, blurry, jittery camera, cut-off feet, cut-off head, text, watermark, logo, multiple people, unsafe form";

/** Equipment wording so the trainer holds the right thing. */
function equipmentPhrase(e: Exercise): string {
  const eq = e.equipment;
  if (eq.includes("dumbbells")) return "holding a pair of dumbbells";
  if (eq.includes("barbell")) return "using a barbell";
  if (eq.includes("kettlebell")) return "holding one kettlebell";
  if (eq.includes("resistance_band")) return "using a resistance band";
  if (eq.includes("pullup_bar")) return "on a pull-up bar";
  if (eq.includes("cable_machine") || eq.includes("machines")) return "on a gym machine";
  if (eq.includes("bench")) return "using a flat bench";
  return "using bodyweight only";
}

export function characterPrompt(t: Trainer): string {
  return `Photorealistic full-body photo of ${t.character}, standing relaxed facing the camera, ${SCENE.replace("24 fps, ", "")}.`;
}

/** Main demo: starting position → slow, full-range reps with good posture. */
export function demoPrompt(e: Exercise, t: Trainer): string {
  const start = e.instructions[0].replace(/\.$/, "");
  const move = e.instructions.slice(1, 4).map((s) => s.replace(/\.$/, "").toLowerCase()).join(", then ");
  const cues = e.posture.slice(0, 3).map((s) => s.toLowerCase()).join("; ");
  return [
    `${t.character} demonstrates the ${e.name} ${equipmentPhrase(e)}.`,
    `The clip begins in the starting position: ${start.toLowerCase()}.`,
    `They perform 3 slow, controlled repetitions with full range of motion: ${move}.`,
    `Perfect technique throughout: ${cues}.`,
    `${SCENE}. Duration 6–8 seconds, seamless loop.`,
  ].join(" ");
}

/** Mistakes clip: shows the most common error first, then the corrected version. */
export function mistakesPrompt(e: Exercise, t: Trainer): string {
  const mistake = e.mistakes[0].toLowerCase();
  return [
    `${t.character} demonstrates a common mistake in the ${e.name} ${equipmentPhrase(e)}:`,
    `for 2 repetitions they are ${mistake.replace(/^(\w+ing)\b/, "$1")} (incorrect form, shown clearly but safely),`,
    `then they pause, reset and perform 2 repetitions with correct form: ${e.posture.slice(0, 2).map((s) => s.toLowerCase()).join("; ")}.`,
    `${SCENE}. Duration 8–10 seconds.`,
  ].join(" ");
}

export const NEGATIVE_PROMPT = NEGATIVE;
