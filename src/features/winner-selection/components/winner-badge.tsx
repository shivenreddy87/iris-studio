import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { positionLabel } from "../types";

/** Compact winner marker used in tables, cards and lists. */
export function WinnerBadge({ rank, className }: { rank?: number | null; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-violet/40 bg-violet/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-violet",
        className,
      )}
    >
      <Trophy className="size-3" />
      {rank ? positionLabel(rank) : "Winner"}
    </span>
  );
}

export function NotSelectedBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-hairline bg-surface-3 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
      Not selected
    </span>
  );
}
