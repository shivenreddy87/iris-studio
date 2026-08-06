import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

/** Section wrapper that matches the existing card language. */
export function AnalyticsCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink-dim">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-5">
      <div className="flex items-center gap-2 text-ink-mute">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink lg:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-dim">{hint}</p> : null}
    </div>
  );
}

export function TrendCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string | number;
  delta: number;
  hint?: string;
}) {
  const up = delta >= 0;
  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</span>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-display text-2xl font-semibold text-ink lg:text-3xl">{value}</p>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[10px] ${
            up
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-rose/30 bg-rose/10 text-rose"
          }`}
        >
          {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
      {hint ? <p className="mt-1 text-xs text-ink-dim">{hint}</p> : null}
    </div>
  );
}

export function StatisticsGrid({
  columns = 4,
  children,
}: {
  columns?: 2 | 3 | 4;
  children: ReactNode;
}) {
  const cls =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";
  return <div className={`grid gap-4 ${cls}`}>{children}</div>;
}
