import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-lime text-lime-ink hover:bg-[#d4ff6a] shadow-[0_0_0_1px_rgba(198,255,61,0.4),0_8px_30px_-8px_rgba(198,255,61,0.55)]",
  secondary: "bg-raised text-fg border border-line-strong hover:bg-[#1e1e22] hover:border-[#3a3a41]",
  ghost: "text-dim hover:text-fg hover:bg-white/5",
  danger: "bg-coral/10 text-coral border border-coral/30 hover:bg-coral/20",
};
const sizes = { sm: "h-9 px-3.5 text-sm gap-1.5", md: "h-11 px-5 text-sm gap-2", lg: "h-14 px-7 text-base gap-2.5" };

export function Button({
  variant = "primary", size = "md", className, ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof sizes }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none",
        variants[variant], sizes[size], className,
      )}
    />
  );
}

export function ButtonLink({
  variant = "primary", size = "md", className, ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof sizes }) {
  return (
    <Link
      {...props}
      className={cx(
        "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 active:scale-[0.97] select-none",
        variants[variant], sizes[size], className,
      )}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2 font-display font-bold tracking-tight", className)}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#c6ff3d" />
        <path d="M5 17h5l3-7 5 13 3-6h6" fill="none" stroke="#101a00" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-lg">Pulse</span>
    </span>
  );
}

export function Card({ className, children, ...p }: ComponentProps<"div">) {
  return <div {...p} className={cx("card p-5 md:p-6", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("text-[11px] font-semibold uppercase tracking-[0.18em] text-mute", className)}>{children}</p>;
}

export function Pill({ children, tone = "default", className }: { children: ReactNode; tone?: "default" | "lime" | "sky" | "coral" | "amber"; className?: string }) {
  const tones = {
    default: "bg-white/5 text-dim border-white/10",
    lime: "bg-lime/10 text-lime border-lime/25",
    sky: "bg-sky/10 text-sky border-sky/25",
    coral: "bg-coral/10 text-coral border-coral/25",
    amber: "bg-amber/10 text-amber border-amber/25",
  };
  return <span className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

/** Circular progress ring. value 0–1. */
export function Ring({
  value, size = 120, stroke = 10, color = "var(--color-lime)", track = "rgba(255,255,255,0.07)", children, label,
}: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: "stroke-dashoffset 900ms var(--ease-out-expo)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Bar({ value, color = "var(--color-lime)", className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cx("h-1.5 w-full overflow-hidden rounded-full bg-white/7", className)}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-line-strong px-6 py-12 text-center">
      {icon && <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-lime">{icon}</div>}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-dim">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-dim">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
