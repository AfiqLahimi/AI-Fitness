export default function Loading() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="skeleton h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="skeleton h-56 md:col-span-2" /><div className="skeleton h-56" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>
    </div>
  );
}
