# Database

## Relationship diagram

```text
auth.users
  ├── profiles (1:1)                 onboarding_completed_at
  ├── user_roles (1:N)               brand | creator | admin
  ├── business_profiles (1:1)
  ├── creator_profiles (1:1)
  ├── connected_accounts (1:N)
  ├── notification_preferences (1:1)
  ├── notifications (1:N)
  ├── user_suspensions (1:N)
  └── audit_logs (actor)

campaign_requests (business_id → users)
  └── campaign_request_events (1:N)
  └── contests (1:1 per approved request)
        ├── contest_events
        ├── contest_applications ──── contest_application_events
        │      └── contest_participants (selected applications)
        │            └── contest_submissions ── contest_submission_events
        │                  └── contest_winners ── payouts ── payout_events
        │                                            └── payout_details
        ├── saved_contests (influencer bookmarks)
        └── contest_result_events

platform_settings (versioned)   platform_categories   platform_channels
contest_templates               moderation_records    activity_feed
achievement_definitions ── user_achievements          analytics_rollups
```

## Access model

- RLS is enabled on every public table; policies use the security-definer
  helper `private.has_role(uid, role)` — never a self-referential subquery.
- Grants follow the policy set: `authenticated` for user-facing tables,
  `service_role` everywhere the server writes, `anon` only where a public
  policy exists.
- `audit_logs`, `*_events` and feed tables are append-only: no UPDATE/DELETE
  policies exist for any role.

## Indexes

Foreign keys used in list filters are indexed (`contest_id`, `influencer_id`,
`business_id`, `status`, `created_at`). Redundant duplicate indexes on
`notifications`, `payouts`, `contest_submissions` and `campaign_requests` were
dropped during hardening.
