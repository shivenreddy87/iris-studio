import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/list-skeleton";
import { NotificationRow } from "@/features/activity/components/notification-row";
import {
  archiveNotification,
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  unarchiveNotification,
} from "@/features/activity/notification.functions";
import type { NotificationItem } from "@/features/activity/types";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Project Eros" },
      {
        name: "description",
        content: "Every update about your requests, contests and results in one place.",
      },
      { property: "og:title", content: "Notifications — Project Eros" },
      {
        property: "og:description",
        content: "Every update about your requests, contests and results in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

const STATUSES = ["all", "unread", "read", "archived"] as const;
const CATEGORIES = ["all", "campaign", "contest", "payout", "system", "marketing"] as const;

function NotificationsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [search, setSearch] = useState("");

  const fetchList = useServerFn(listNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markUnread = useServerFn(markNotificationUnread);
  const markAll = useServerFn(markAllNotificationsRead);
  const archive = useServerFn(archiveNotification);
  const unarchive = useServerFn(unarchiveNotification);
  const remove = useServerFn(deleteNotification);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "page", status, category, search],
    queryFn: () =>
      fetchList({
        data: { status, category, limit: 50, ...(search.trim() ? { search: search.trim() } : {}) },
      }),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const mutate = useMutation({
    mutationFn: async (job: () => Promise<unknown>) => job(),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Workspace"
        title="Notifications"
        description="Updates on campaign requests, contest selections, results and payouts."
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-full border border-hairline bg-surface-2 p-1">
          {STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition ${
                status === value ? "bg-violet text-white" : "text-ink-mute hover:text-ink"
              }`}
            >
              {value}
              {value === "unread" && data?.unreadCount ? ` (${data.unreadCount})` : ""}
            </button>
          ))}
        </div>

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as (typeof CATEGORIES)[number])}
          className="rounded-full border border-hairline bg-surface-2 px-3 py-2 text-xs text-ink"
        >
          {CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {value === "all" ? "All categories" : value}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search notifications"
          className="min-w-40 flex-1 rounded-full border border-hairline bg-surface-2 px-4 py-2 text-sm text-ink placeholder:text-ink-mute"
        />

        <button
          type="button"
          onClick={() => mutate.mutate(() => markAll())}
          className="rounded-full border border-hairline px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface-3"
        >
          Mark all read
        </button>

        <Link
          to="/app/settings/notifications"
          className="flex items-center gap-1.5 rounded-full border border-hairline px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface-3"
        >
          <Settings2 className="size-3.5" /> Preferences
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-hairline bg-surface-2 p-8 text-center text-sm text-ink-mute">
          Loading notifications…
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-8" />}
          title="You are all caught up"
          hint="Notifications about reviews, selections and winners will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-hairline bg-surface-1">
          {items.map((item: NotificationItem) => (
            <NotificationRow
              key={item.id}
              item={item}
              onToggleRead={(n) =>
                mutate.mutate(() => (n.readAt ? markUnread({ data: { id: n.id } }) : markRead({ data: { id: n.id } })))
              }
              onArchive={(n) => mutate.mutate(() => archive({ data: { id: n.id } }))}
              onUnarchive={(n) => mutate.mutate(() => unarchive({ data: { id: n.id } }))}
              onDelete={(n) => mutate.mutate(() => remove({ data: { id: n.id } }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
