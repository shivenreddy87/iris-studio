import { Link } from "@tanstack/react-router";
import { Archive, ArchiveRestore, Circle, CircleCheck, Trash2 } from "lucide-react";
import type { NotificationItem } from "../types";

const CATEGORY_STYLES: Record<string, string> = {
  campaign: "bg-violet/15 text-violet",
  contest: "bg-rose/15 text-rose",
  payout: "bg-emerald-500/15 text-emerald-400",
  marketing: "bg-amber-500/15 text-amber-400",
  system: "bg-white/10 text-ink-dim",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationRow({
  item,
  onToggleRead,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  item: NotificationItem;
  onToggleRead: (item: NotificationItem) => void;
  onArchive: (item: NotificationItem) => void;
  onUnarchive: (item: NotificationItem) => void;
  onDelete: (item: NotificationItem) => void;
}) {
  const unread = !item.readAt;
  return (
    <div
      className={`flex gap-3 border-b border-hairline p-4 transition last:border-0 hover:bg-surface-3 ${
        unread ? "bg-surface-2" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onToggleRead(item)}
        title={unread ? "Mark as read" : "Mark as unread"}
        className="mt-1 text-ink-mute transition hover:text-violet"
      >
        {unread ? (
          <Circle className="size-4 fill-violet text-violet" />
        ) : (
          <CircleCheck className="size-4" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
              CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES["system"]
            }`}
          >
            {item.category}
          </span>
          {item.priority === "high" || item.priority === "urgent" ? (
            <span className="rounded-full bg-rose/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-rose">
              {item.priority}
            </span>
          ) : null}
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-mute">
            {timeAgo(item.createdAt)}
          </span>
        </div>

        <p className="mt-1 font-display text-sm font-semibold text-ink">{item.title}</p>
        {item.body ? <p className="mt-0.5 text-sm text-ink-dim">{item.body}</p> : null}

        {item.actionUrl ? (
          <Link
            to={item.actionUrl}
            onClick={() => (unread ? onToggleRead(item) : undefined)}
            className="mt-2 inline-block text-xs font-semibold text-violet hover:underline"
          >
            {item.actionLabel ?? "Open"} →
          </Link>
        ) : null}
      </div>

      <div className="flex shrink-0 items-start gap-1">
        {item.archivedAt ? (
          <button
            type="button"
            title="Restore"
            onClick={() => onUnarchive(item)}
            className="rounded-full p-2 text-ink-mute transition hover:bg-surface-3 hover:text-ink"
          >
            <ArchiveRestore className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            title="Archive"
            onClick={() => onArchive(item)}
            className="rounded-full p-2 text-ink-mute transition hover:bg-surface-3 hover:text-ink"
          >
            <Archive className="size-4" />
          </button>
        )}
        <button
          type="button"
          title="Delete"
          onClick={() => onDelete(item)}
          className="rounded-full p-2 text-ink-mute transition hover:bg-surface-3 hover:text-rose"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
