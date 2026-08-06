/** Progress toward the configured participant limit. */
export function ParticipantLimitIndicator({
  selected,
  limit,
}: {
  selected: number;
  limit: number | null;
}) {
  const pct = limit && limit > 0 ? Math.min(100, Math.round((selected / limit) * 100)) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
          Participants
        </span>
        <span className="text-sm text-ink">
          {selected}
          {limit === null ? " selected" : ` / ${limit}`}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-violet transition-all"
          style={{ width: `${limit === null ? (selected > 0 ? 100 : 0) : pct}%` }}
        />
      </div>
    </div>
  );
}
