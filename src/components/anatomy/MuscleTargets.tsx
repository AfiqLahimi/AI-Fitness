import { MUSCLES, type ExerciseTargets } from "@/lib/anatomy/muscles";

/** Text list of primary / secondary muscles with plain-language explanations. */
export function MuscleTargets({ targets, dense = false }: { targets: ExerciseTargets; dense?: boolean }) {
  const groups = [
    { label: targets.stretch ? "Muscles being stretched" : "Primary muscles", color: "#ff3b30", ids: targets.primary },
    { label: "Secondary muscles", color: "#ff9f0a", ids: targets.secondary },
  ].filter((g) => g.ids.length);
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mute">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.color, boxShadow: `0 0 12px ${g.color}` }} />{g.label}
          </p>
          <ul className="space-y-2.5">
            {g.ids.map((id) => {
              const m = MUSCLES[id];
              return (
                <li key={id} className="rounded-xl border border-line bg-ink/60 px-3.5 py-2.5">
                  <p className="font-semibold">{m.name} <span className="font-normal text-mute">· {m.anatomical}</span></p>
                  {!dense && <p className="mt-0.5 text-sm text-dim">{m.what}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
