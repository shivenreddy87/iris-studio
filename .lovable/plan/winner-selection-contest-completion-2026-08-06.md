# Winner Selection & Contest Completion

Admins score verified submissions, rank creators, declare winners and close the contest. Influencers get real Won Contests history and winner notifications. Businesses get a full outcome report. No redesign — existing cards, badges, dialogs, timelines, tables, profile gate and query patterns are reused.

## What changes for each user

### Admin (contest detail, live contests)
- A Winner Evaluation workspace listing **only verified submissions**, each showing influencer, submission URL, platform, campaign category, required views, portfolio, verification status and submission timeline.
- Per submission the admin enters views, likes, comments and shares. Engagement rate and performance score recalculate immediately.
- Optional manual score override with a required justification note.
- A live ranking table: rank, influencer, performance score, views, engagement, winner status.
- Actions: Mark Winner, Remove Winner, Finalize Winners.
- Winner count comes from the contest configuration and is enforced on the server — a selection beyond the limit is rejected, as is a duplicate winner or a duplicate rank.
- Finalizing winners moves the contest to Completed. After that, metrics, winners, rankings and statistics are frozen and every mutation is rejected.

### Influencer
- Winner Announced appears on the entry timeline.
- Winners are notified "You won this contest"; other selected participants get "Contest completed".
- Won Contests becomes real: contest, business category, rank, position, reward, completion date.
- Completed Contests shows Winner / Not Selected alongside the submission status.
- A new results page per entry: submission metrics, rank, winner status and timeline.

### Business
- Contest detail gains a Results section: total participants, verified submissions, winner count, completion date, winner rankings and a performance summary.
- A Download Contest Summary Report button (placeholder file for this milestone).
- No participant contact details anywhere in the business view.

## Lifecycle

```text
Live -> verified submissions -> winner evaluation -> winners finalized -> Completed -> Archived
```

Completion is one-way. The existing `live -> completed -> archived` transition rules already allow this and stay unchanged.

## Technical plan

### Database (migration first, then regenerate types)
- `contest_winners`: contest_id, participant_id, submission_id, influencer_id, rank, performance_score, manual_score, final_score, reward_amount, winner_notes, selected_by, selected_at, timestamps. Unique on (contest_id, rank) and (contest_id, influencer_id). RLS: admins manage all; influencers read their own rows; the owning business reads rows for its contests. Grants for authenticated and service_role.
- `contest_result_events`: contest_id, actor_id, event_type (`winner_selected`, `winner_removed`, `winner_finalized`, `contest_completed`), note, created_at. Insert-only, admin-write, readable by admin, contest owner and involved influencers.
- `contest_submissions` gains: views, likes, comments, shares, engagement_rate, review_score, review_notes. Writable only while the contest is not completed.
- `updated_at` triggers on the new table, matching existing conventions.

Reward amounts default to an even split of the contest reward pool across the configured winner count, and the admin can override per winner before finalizing.

### Scoring engine — `src/features/winner-selection/scoring.ts`
Pure, dependency-free functions with exported weight constants (no inline magic numbers):
`calculateEngagementRate`, `calculatePerformanceScore` (views reach + engagement rate + admin review score, weighted), `rankContestSubmissions`, `calculateContestStatistics`. The same signature is what a future AI judge would implement.

### Feature module — `src/features/winner-selection/`
`types.ts`, `scoring.ts`, `winner.server.ts` (validation, persistence, event logging, notifications), `winner.functions.ts` (thin server-function wrappers only), `hooks/`, `components/`.

Server functions: `listVerifiedSubmissions`, `updateSubmissionMetrics`, `calculateRankings`, `markWinner`, `removeWinner`, `finalizeWinners`, `completeContest`, `listContestWinners`, `getContestResults`, `getBusinessContestReport`.

Every mutation validates admin role, contest status, winner-count limit, duplicate winner, rank uniqueness, and rejects anything on a completed or archived contest. Reads are audience-scoped: admin full, influencer own rows, business aggregate plus winner rankings without contact details.

### Components
`WinnerEvaluationTable`, `PerformanceScoreCard`, `ContestRankingTable`, `WinnerBadge`, `WinnerCard`, `ContestResultsCard`, `WinnerSummary`, `WinnerTimeline`, `PerformanceMetricsCard`, `ResultStatistics`, plus a Finalize Winners confirmation dialog. These build on the existing `ContestHeader`, `ContestTimeline`, `SubmissionCard`, `SubmissionStatusBadge`, `PageHeader`, `DataSection`, `EmptyState`, `ProfileGate`, `StatusBadge`, progress card and `AttachmentPreview`.

### Routes
- `app.admin.contests.$contestId.index.tsx` — Winner Evaluation workspace, ranking table, Finalize Winners dialog (shown for live contests; read-only results once completed).
- `app.business.contests.$contestId.tsx` — Contest Results dashboard, winner rankings, report download placeholder.
- `app.contests.won.tsx` — real winner history, replacing the current empty stub `listMyWins`.
- `app.contests.completed.tsx` — Winner / Not Selected badge alongside submission status.
- `app.entries.$applicationId.results.tsx` — new influencer results page: metrics, rank, winner status, timeline.

### Notifications
Reuses the existing notifications helper: influencer winner-selected and contest-completed, business contest-completed and winner-finalized, admin winner-finalized and contest-completed.

### Verification
Typecheck, lint, then a preview walkthrough of winner-count enforcement, ranking calculation, duplicate prevention, immutability after completion, notifications, business results and influencer Won Contests.

## Out of scope
Payout execution and real PDF generation — the report is a placeholder download this milestone.
