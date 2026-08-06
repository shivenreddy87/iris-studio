/**
 * Legacy import surface. The real implementations live in the shared activity
 * engine (`src/features/activity`); these re-exports keep existing callers working.
 */
export {
  listNotifications,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  archiveNotification,
  unarchiveNotification,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/features/activity/notification.functions";
