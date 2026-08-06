import { DATE_RANGES, type DateRangeKey } from "../types";

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRangeKey;
  onChange: (next: DateRangeKey) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-hairline bg-surface-2 p-1">
      {DATE_RANGES.map((range) => (
        <button
          key={range.key}
          type="button"
          onClick={() => onChange(range.key)}
          className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition ${
            value === range.key ? "bg-violet/20 text-violet" : "text-ink-mute hover:text-ink"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
