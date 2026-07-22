export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-hairline bg-surface-2 p-5"
        >
          <div className="mb-3 h-4 w-40 rounded-full bg-white/8" />
          <div className="mb-2 h-3 w-full rounded-full bg-white/5" />
          <div className="h-3 w-3/4 rounded-full bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-hairline bg-surface-2 p-6">
      <div className="mb-4 size-10 rounded-xl bg-white/8" />
      <div className="mb-2 h-3 w-24 rounded-full bg-white/6" />
      <div className="h-8 w-16 rounded-full bg-white/8" />
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-hairline bg-surface-2/50 px-6 py-16 text-center">
      {icon ? <div className="mb-4 text-ink-mute">{icon}</div> : null}
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {hint ? <p className="mt-1 max-w-md text-sm text-ink-dim">{hint}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
