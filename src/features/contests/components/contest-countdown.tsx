import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import type { ContestAvailability } from "../eligibility";

function targetFor(availability: ContestAvailability): { at: number; label: string } | null {
  if (availability.state === "open" && availability.applicationDeadline) {
    return {
      at: new Date(`${availability.applicationDeadline.slice(0, 10)}T23:59:59`).getTime(),
      label: "Applications close in",
    };
  }
  if (availability.state === "not_yet_open" && availability.applicationStartDate) {
    return {
      at: new Date(`${availability.applicationStartDate.slice(0, 10)}T00:00:00`).getTime(),
      label: "Applications open in",
    };
  }
  return null;
}

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** Live countdown to the next application milestone. */
export function ContestCountdown({ availability }: { availability: ContestAvailability }) {
  const target = targetFor(availability);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target?.at]);

  if (!target) {
    return (
      <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
          Application window
        </p>
        <p className="mt-2 text-sm text-ink-dim">{availability.label}</p>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = split(target.at - now);
  const cells = [
    { value: days, label: "Days" },
    { value: hours, label: "Hours" },
    { value: minutes, label: "Min" },
    { value: seconds, label: "Sec" },
  ];

  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
        <Timer className="size-3.5" />
        {target.label}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="rounded-2xl border border-hairline bg-surface-3 p-3 text-center"
          >
            <p className="font-display text-xl font-semibold text-ink">
              {String(cell.value).padStart(2, "0")}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
              {cell.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
