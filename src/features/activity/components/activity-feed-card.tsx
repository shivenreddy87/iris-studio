import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity } from "lucide-react";
import { listMyActivity, listPlatformActivityFeed } from "../activity.functions";
import type { ActivityItem } from "../types";

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function ActivityRows({ items, empty }: { items: ActivityItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="px-5 pb-5 text-sm text-ink-mute">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-hairline">
      {items.map((item) => (
        <li key={item.id} className="px-5 py-3">
          <p className="text-sm text-ink">{item.summary}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-mute">
            {item.actorName ? `${item.actorName} · ` : ""}
            {item.action.replace(/[._]/g, " ")} · {timeAgo(item.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-hairline bg-surface-2">
      <header className="flex items-center gap-2 px-5 py-4">
        <Activity className="size-4 text-violet" />
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink">{title}</h2>
      </header>
      {children}
    </section>
  );
}

/** Business / influencer: activity that involves the signed-in user. */
export function RecentActivityCard({ limit = 8 }: { limit?: number }) {
  const fetchActivity = useServerFn(listMyActivity);
  const { data = [] } = useQuery({
    queryKey: ["activity", "mine", limit],
    queryFn: () => fetchActivity({ data: { limit } }),
  });
  return (
    <Shell title="Recent activity">
      <ActivityRows items={data} empty="Nothing has happened yet. Your updates will show up here." />
    </Shell>
  );
}

/** Admin: platform-wide feed. */
export function PlatformActivityCard({ limit = 12 }: { limit?: number }) {
  const fetchFeed = useServerFn(listPlatformActivityFeed);
  const { data = [] } = useQuery({
    queryKey: ["activity", "platform", limit],
    queryFn: () => fetchFeed({ data: { limit } }),
  });
  return (
    <Shell title="Platform activity">
      <ActivityRows items={data} empty="No platform activity recorded yet." />
    </Shell>
  );
}
