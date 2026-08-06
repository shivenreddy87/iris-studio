import { Sparkles } from "lucide-react";

/**
 * Standard "next milestone" notice used on surfaces whose data layer lands in
 * the following milestone. Remove the usage — not the component — as each
 * feature is implemented.
 */
export function MilestoneNotice({ items }: { items: string[] }) {
  return (
    <section className="mt-8 rounded-3xl border border-hairline bg-surface-2 p-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <Sparkles className="size-4 text-violet" />
        Coming in the next milestone
      </div>
      <ul className="grid gap-2 text-sm text-ink-dim sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
