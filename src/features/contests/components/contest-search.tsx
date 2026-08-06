import { Search } from "lucide-react";
import { fieldClass } from "@/features/profiles/components/field";

/** Search across contest title, campaign goal and business category. */
export function ContestSearch({
  value,
  onChange,
  placeholder = "Search by title, goal or category",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative min-w-64 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-mute" />
      <input
        className={`${fieldClass} pl-9`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search contests"
      />
    </div>
  );
}
