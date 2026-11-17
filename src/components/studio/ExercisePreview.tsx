"use client";
import { getExercise } from "@/lib/fitness/exercises";
import { ExerciseMedia } from "./ExerciseMedia";

/** Client wrapper so server components can show a live demo by slug. */
export function ExercisePreview({ slug, badge = false }: { slug: string; badge?: boolean }) {
  const ex = getExercise(slug);
  if (!ex) return null;
  return <ExerciseMedia exercise={ex} showBadge={badge} />;
}
