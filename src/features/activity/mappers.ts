import type {
  Meta,
  NotificationCategory,
  NotificationItem,
  NotificationPreferences,
  NotificationPriority,
} from "./types";

export type NotificationRow = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  action_url: string | null;
  action_label: string | null;
  priority: string | null;
  metadata: Meta | null;
  read_at: string | null;
  archived_at: string | null;
  created_at: string;
};

export function mapNotification(row: NotificationRow): NotificationItem {
  const metadata = (row.metadata ?? {}) as Meta;
  const category = (metadata["category"] as NotificationCategory | undefined) ?? "system";
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind as NotificationItem["kind"],
    title: row.title,
    body: row.body,
    link: row.link,
    actionUrl: row.action_url ?? row.link,
    actionLabel: row.action_label,
    priority: (row.priority as NotificationPriority | null) ?? "normal",
    metadata,
    category,
    readAt: row.read_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  };
}

export function mapPreferences(row: {
  user_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  campaign_updates: boolean;
  contest_updates: boolean;
  payout_updates: boolean;
  marketing: boolean;
  system: boolean;
}): NotificationPreferences {
  return {
    userId: row.user_id,
    emailEnabled: row.email_enabled,
    inAppEnabled: row.in_app_enabled,
    campaignUpdates: row.campaign_updates,
    contestUpdates: row.contest_updates,
    payoutUpdates: row.payout_updates,
    marketing: row.marketing,
    system: row.system,
  };
}

