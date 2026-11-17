import { notFound } from "next/navigation";
import { getExercise } from "@/lib/fitness/exercises";
import { AnatomyRender } from "@/components/anatomy/AnatomyRender";

/**
 * Bare 3D anatomy view for one exercise. Used by `npm run anatomy:thumbs` to render the
 * thumbnail images shown on exercise cards (so a page doesn't open 40 live 3D views).
 */
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ view?: string; focus?: string }> }) {
  const { slug } = await params;
  const { view, focus } = await searchParams;
  if (!getExercise(slug)) notFound();
  return <AnatomyRender slug={slug} view={view === "back" ? "back" : view === "front" ? "front" : undefined} focus={focus === "1"} />;
}
