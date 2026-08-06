# Prompt 11 — Analytics, Reporting & Platform Administration

Adds an operational analytics and administration layer on top of the data the platform already produces. No new contest workflow, no new design system — every screen reuses the existing PageHeader, DataSection, EmptyState, StatusBadge, cards, tables, dialogs, timelines and TanStack Query patterns.

## What users get

**Admin** — the dashboard becomes a control center with widgets for platform overview, revenue & reward distribution, contest / campaign request / submission / winner / payout analytics, influencer and business growth, user activity, system health and a moderation queue. Each widget deep-links to its management page. A new Platform Administration section adds User Management, Platform Statistics, Categories, Platforms, Contest Templates, Global Settings, Moderation and Reports (Businesses and Influencers pages already exist and get statistics columns).

**Business** — an analytics dashboard (requests created, approved rate, contest success rate, applications received, selected participants, submission progress, verified content, completion rate, reward distributed, average engagement, average completion time) plus an Analytics tab on each contest with charts for applications over time, participant / submission / verification funnels, winner breakdown, reward distribution and contest timeline. Contest Summary export.

**Influencer** — a personal analytics panel (applications, acceptance / selection / win rates, average submission time, rewards won and paid, active and completed contests, average engagement, performance score trend) plus a read-only Achievements section (First Application, First Selection, First Win, Top Performer, Fast Responder, Consistent Creator) computed automatically from existing data.

**Reports** — an export center. Admin: contest, campaign request, winner, payout, user, business, influencer and activity reports. Business: contest summary, campaign performance, reward distribution. Influencer: contest history, reward history, performance summary. Exports are placeholder downloads (CSV generated client-side from the analytics payload) for this milestone.

**Moderation** — admins can suspend or reactivate a business or influencer, flag contests, campaign requests and submissions, record notes, and view moderation history. Suspension never deletes data: suspended users keep read access but cannot create requests, apply, be selected, or upload submissions.

## Technical approach

### Database (single migration)

New tables, each with GRANTs, RLS and admin-only write policies:
- `platform_settings` — versioned key/value config (default participant limit, winner count, min/max reward, application duration, contest duration, payout reminder days, notification defaults). New row per version; latest wins.
- `contest_templates` — reusable defaults (rules, eligibility, reward and participant presets).
- `moderation_records` — target type/id, action, reason, note, actor, created_at.
- `user_suspensions` — user_id, role, reason, suspended_by, suspended_at, lifted_at.
- `achievement_definitions` + `user_achievements` — definitions seeded in the migration; user rows awarded server-side.

Analytics use **regular SQL views** (`contest_statistics`, `business_statistics`, `influencer_statistics`, `platform_statistics`) rather than materialized views, because materialized views need an explicit refresh job and would show stale numbers immediately after a contest action. Supporting indexes are added for each aggregation (contest_id, business_id, influencer_id, status, created_at).

Suspension enforcement is added to the existing server-side guards (apply, submit, create request, participant selection) so it cannot be bypassed by the client.

### Analytics engine — `src/features/analytics/`

`types.ts`, `analytics.server.ts` (aggregation), `analytics.functions.ts` (server functions), `chart.helpers.ts`, `hooks/`, `components/`.

Server functions: `getPlatformAnalytics`, `getBusinessAnalytics`, `getInfluencerAnalytics`, `getContestAnalytics`, `getCampaignAnalytics`, `getSubmissionAnalytics`, `getWinnerAnalytics`, `getPayoutAnalytics`, `getDashboardAnalytics`. Admin-only ones go through the existing `assertAdmin` helper; business and influencer ones scope to `context.userId`. Components never touch Supabase directly — every chart consumes one of these via TanStack Query.

### Administration module — `src/features/platform-admin/`

`types.ts`, `admin.server.ts`, `admin.functions.ts`, `hooks/`, `components/` with the list/get/suspend/activate functions for businesses and influencers, CRUD for categories, platforms and contest templates, get/update for settings, the four report generators, and `createModerationRecord` / `listModerationRecords` / `getModerationHistory`. All admin-gated with the existing role helpers.

### Components

Analytics: `AnalyticsCard`, `MetricCard`, `TrendCard`, `StatisticsGrid`, `AnalyticsChart` (wrapping the existing `components/ui/chart.tsx` + recharts), `DateRangeFilter`, `ExportButton`, `AchievementCard`, `AchievementGrid`.

Administration: `BusinessTable`, `InfluencerTable`, `ModerationTable`, `SuspensionDialog`, `PlatformSettingsForm`, `ContestTemplateEditor`, `CategoryManager`, `PlatformManager`, `ReportCard`, `StatisticsOverview`.

### Routes

Update `app.admin.index.tsx` (overview dashboard). Create `app.admin.analytics.tsx`, `app.admin.reports.tsx`, `app.admin.settings.tsx`, `app.admin.templates.tsx`, `app.admin.categories.tsx`, `app.admin.platforms.tsx`, `app.admin.moderation.tsx`, and add them to the admin nav in `src/lib/navigation.ts`.

Business analytics goes into the existing role-aware `app.index.tsx` business branch (there is no separate `app.business.dashboard.tsx` in this codebase) plus an Analytics tab in `app.business.contests.$contestId.tsx`. Influencer analytics and achievements go into the influencer branch of `app.index.tsx`, with export buttons on `app.contests.completed.tsx` and `app.contests.won.tsx`.

Each new route gets its own `head()` metadata.

### Order of work

1. Migration → 2. regenerate types → 3. analytics engine → 4. platform-admin module → 5. reports → 6. dashboard integrations → 7. moderation enforcement → 8. typecheck + lint → 9. preview walkthrough of analytics, exports, moderation, achievements and role-based access.

## Out of scope

AI recommendations, financial accounting, email or scheduled reporting, ML insights, external BI, real PDF/Excel generation.
