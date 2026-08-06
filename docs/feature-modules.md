# Feature Module Map

Each module owns its UI, hooks, schemas, types, and server logic.

| Module | Purpose | Key server files |
| --- | --- | --- |
| `profiles` | Onboarding, business/influencer profiles, completion gating | `profiles.functions.ts` |
| `campaign-requests` | Business campaign requests + admin review workflow | `requests.functions.ts`, `admin-review.functions.ts`, `requests.server.ts` |
| `contests` | Contest creation wizard, lifecycle, discovery, saved contests | `contest.functions.ts`, `contest.server.ts` |
| `contest-applications` | Influencer applications, withdrawal, admin triage | `application.functions.ts`, `application.server.ts` |
| `contest-entries` | Participant selection and contest activation | `participant-selection.functions.ts` |
| `contest-submissions` | Content submission, verification, flagging, progress | `submission.functions.ts`, `submission.server.ts` |
| `winner-selection` | Scoring engine, ranking, winner finalisation, results | `winner.functions.ts`, `scoring.ts` |
| `manual-payouts` | Payout records, winner payout details, payout lifecycle | `payout.functions.ts`, `payout.server.ts` |
| `activity` | Notifications, preferences, activity feed | `notification.server.ts`, `activity.server.ts` |
| `analytics` | Role-aware analytics, charts, CSV reports | `analytics.server.ts`, `chart.helpers.ts` |
| `platform-admin` | Moderation, suspensions, taxonomies, settings, templates | `admin.functions.ts`, `admin.server.ts` |

## Shared

- `src/lib/roles.ts` — role keys, labels, role-aware copy.
- `src/lib/navigation.ts` — sidebar per role.
- `src/lib/audit.server.ts` — immutable audit trail.
- `src/lib/storage.ts` / `storage.server.ts` — uploads and path validation.
- `src/components/app` — `PageHeader`, `DataSection`, `EmptyState`, `ProfileGate`.
