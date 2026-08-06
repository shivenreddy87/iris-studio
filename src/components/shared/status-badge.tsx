export type StatusTone = "neutral" | "info" | "active" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "border-hairline bg-white/5 text-ink-dim",
  info: "border-violet/30 bg-violet/10 text-violet",
  active: "border-violet/40 bg-violet/15 text-violet",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  danger: "border-rose/30 bg-rose/10 text-rose",
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
