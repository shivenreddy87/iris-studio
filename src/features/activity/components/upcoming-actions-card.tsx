import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ListChecks } from "lucide-react";
import { getUpcomingActions } from "../activity.functions";

export function UpcomingActionsCard() {
  const fetchActions = useServerFn(getUpcomingActions);
  const { data = [] } = useQuery({
    queryKey: ["activity", "upcoming"],
    queryFn: () => fetchActions(),
  });

  return (
    <section className="rounded-3xl border border-hairline bg-surface-2">
      <header className="flex items-center gap-2 px-5 py-4">
        <ListChecks className="size-4 text-rose" />
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink">
          Upcoming actions
        </h2>
      </header>
      {data.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-ink-mute">You are all caught up. Nothing needs you right now.</p>
      ) : (
        <ul className="divide-y divide-hairline">
          {data.map((action) => (
            <li key={action.id}>
              <Link
                to={action.to}
                className="group flex items-center gap-3 px-5 py-3 transition hover:bg-surface-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{action.title}</p>
                  <p className="truncate text-xs text-ink-mute">{action.description}</p>
                </div>
                {action.priority === "high" || action.priority === "urgent" ? (
                  <span className="rounded-full bg-rose/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-rose">
                    {action.priority}
                  </span>
                ) : null}
                <ArrowRight className="size-4 shrink-0 text-ink-mute transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
