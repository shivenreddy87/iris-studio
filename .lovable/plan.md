# Notifications & Activity Center

Turn the placeholder notifications page into a real activity hub, add a shared activity/notification engine that every workflow writes through, and give each role dashboard widgets and preference controls.

## What changes for users

### All roles
- `/app/notifications` becomes a real center: sections for Unread, Today, This Week, Earlier; unread counter; mark one/all read; archive; delete; filters (unread/read, type, date), search across title, body, contest, campaign, business and influencer names; cursor pagination, newest first.
- Every notification carries a direct link plus an action label ("Review request", "Submit content", "Complete payout details").
- Top-bar bell keeps its current dropdown but now reflects unread/archived state correctly.
- New page `/app/settings/notifications` with toggles: email, in-app, campaign updates, contest updates, payout updates, marketing, system alerts. Only in-app is enforced today; the rest are stored for future email delivery.

### Business
Notifications for request received / under review / changes requested / approved / rejected, contest created, published, applications opened, activated, completed, winners finalized, and payout progress. Dashboard gains a **Recent Activity** card (latest 10).

### Influencer
Notifications for saved-contest reminders, applications opened, application submitted/shortlisted/selected/rejected, contest activated, submission verified/flagged, winner selected, contest completed, and the four payout states. Dashboard gains an **Upcoming Actions** widget (complete profile, apply before deadline, submit content, complete payout details), each linking to the page that resolves it.

### Admin
Notifications for new campaign request, awaiting review, new application, contest ready for activation, contest completed, winner finalization pending, new payout details, failed payout, outstanding payouts, system warnings. Dashboard gains a **Platform Activity Feed** (latest 25, newest first).

## Technical plan

### Migration
- `notification_preferences` (user_id PK → auth.users, email_enabled, in_app_enabled, campaign_updates, contest_updates, payout_updates, marketing, system, timestamps). Owner-only read/write; defaults all true except marketing.
- `activity_feed` (id, actor_id, target_user_id, action, entity_type, entity_id, summary, metadata jsonb, created_at). Read policies: own rows for actor/target, full read for admins via `has_role`. Inserts service-role only.
- Extend `notifications`: `archived_at`, `deleted_at`, `action_url`, `action_label`, `priority` (text with default `normal`), `metadata jsonb`. `read_at` already exists; existing rows stay valid.
- Indexes: `notifications(user_id, created_at desc)`, partial index on unread (`read_at is null`), `(user_id, archived_at)`, `(user_id, priority)`, `activity_feed(created_at desc)` and `(entity_type, entity_id)`.
- GRANTs for `authenticated` + `service_role` on both new tables; RLS enabled with policies as above.

### Activity engine — `src/features/activity/`
- `types.ts` — activity/notification kinds, priority, action-link shapes.
- `activity.server.ts` — `createActivity()`, `listActivities()`, `listDashboardActivity()` (role-scoped: business → own org entities, influencer → own, admin → all 25).
- `notification.server.ts` — `createNotification()` (single + batch, respects `notification_preferences.in_app_enabled` and the per-category toggle), plus read/archive/delete/mark-all helpers and `getUpcomingActions()`.
- `activity.functions.ts` / `notification.functions.ts` — auth-guarded server functions: `listNotifications`, `markRead`, `markAllRead`, `archiveNotification`, `deleteNotification`, `listActivities`, `listDashboardActivity`, `updateNotificationPreferences`, `getNotificationPreferences`, `getUpcomingActions`.
- Notification list query is cursor-paginated (`created_at`+id cursor), excludes `deleted_at`, and orders unread first within each group.

### Replace direct inserts
Every `supabase.from("notifications").insert(...)` in `campaign-requests/requests.server.ts`, `campaign-requests/admin-review.server.ts`, `contests/contest.server.ts`, `contest-applications/application.server.ts`, `contest-applications/participant-selection.server.ts`, `contest-submissions/submission.server.ts`, `winner-selection/winner.server.ts`, `manual-payouts/payout.server.ts`, plus the legacy `lib/deals.functions.ts`, `lib/campaigns.functions.ts`, `lib/messages.functions.ts`, routes through `createNotification()` and pairs with a `createActivity()` call. Local `insertNotifications`/`notifyAdmins` helpers are removed in favour of shared ones. `src/lib/notifications.functions.ts` re-exports from the new module so existing imports (app shell) keep working.

### Components — `src/features/activity/components/`
`NotificationCenter`, `NotificationCard`, `NotificationBadge`, `UnreadCounter`, `NotificationFilters`, `NotificationSearch`, `ActivityFeed`, `ActivityCard`, `ActivityTimeline`, `NotificationPreferencesForm`, `RecentActivityCard`, `UpcomingActionsCard` — all built from existing `PageHeader`, `DataSection`, `EmptyState`, `StatusBadge`, cards, dialogs and the existing timeline styling. No new visual language.

### Routes
- Rewrite `app.notifications.tsx` as the center.
- New `app.settings.notifications.tsx` (preferences form) linked from `/app/settings`.
- `app.index.tsx` dashboard: role-branched widget — Recent Activity (business), Upcoming Actions (influencer).
- `app.admin.index.tsx`: Platform Activity Feed.

### Verification
Migration → regenerate types → engine → module replacements → UI → typecheck → lint → preview walkthrough of read/unread, archive, delete, search, filters, and dashboard widgets.

## Out of scope
Email, SMS, WhatsApp, push and mobile delivery. Preferences are stored only.
