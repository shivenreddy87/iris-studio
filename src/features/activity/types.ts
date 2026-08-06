export type MetaValue = string | number | boolean | null;
export type Meta = Record<string, MetaValue>;

export type NotificationCategory = "campaign" | "contest" | "payout" | "system" | "marketing";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type NotificationKind = "message" | "deal_update" | "invitation" | "system";

export type NotificationInput = {
  userId: string;
  title: string;
  body?: string | null;
  /** Destination path, e.g. /app/business/contests/123 */
  link?: string | null;
  actionLabel?: string | null;
  category: NotificationCategory;
  priority?: NotificationPriority;
  kind?: NotificationKind;
  metadata?: Meta;
};

export type NotificationItem = {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  actionUrl: string | null;
  actionLabel: string | null;
  priority: NotificationPriority;
  metadata: Meta;
  category: NotificationCategory;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
};

export type NotificationPreferences = {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  campaignUpdates: boolean;
  contestUpdates: boolean;
  payoutUpdates: boolean;
  marketing: boolean;
  system: boolean;
};

export const DEFAULT_PREFERENCES: Omit<NotificationPreferences, "userId"> = {
  emailEnabled: true,
  inAppEnabled: true,
  campaignUpdates: true,
  contestUpdates: true,
  payoutUpdates: true,
  marketing: false,
  system: true,
};

export type ActivityInput = {
  actorId?: string | null;
  targetUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Meta;
};

export type ActivityItem = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  targetUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata: Meta;
  createdAt: string;
};

export type NotificationListFilters = {
  status?: "all" | "unread" | "read" | "archived";
  category?: NotificationCategory | "all";
  search?: string;
  /** ISO date; only notifications created on/after this are returned */
  since?: string | null;
  cursor?: string | null;
  limit?: number;
};

export type NotificationListResult = {
  items: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
};

export type UpcomingAction = {
  id: string;
  title: string;
  description: string;
  to: string;
  priority: NotificationPriority;
};
