# Live Contest Management & Content Submission

Selected participants publish their contest content and submit it once for verification. Admins review every submission, businesses watch aggregate progress, and each contest tracks execution through to completion. Winner selection stays out of scope.

No new design language — this reuses the existing panels, cards, badges, dialogs, timelines, profile gate and data-section patterns already used by applications and participant selection.

## Database

New enum `contest_submission_status`: `pending`, `submitted`, `verified`, `flagged`.

New table `contest_submissions` — contest, participant, influencer, platform, content URL, caption, notes, status, submitted/reviewed timestamps, reviewer. One submission per participant (unique on participant).

New table `contest_submission_events` — submission, actor, event type, note, timestamp. Supported events: `submission_created`, `submission_verified`, `submission_flagged`. Submission timelines read from this table only.

Access rules:
- Influencers read and create their own submission; they can never edit or delete it.
- Admins read every submission and record verify/flag decisions.
- Businesses get no row access; their progress numbers come from a server-side aggregate that returns counts only, never applicant identities.
- Timeline events are insert-only and readable by the submission owner and admins.

Grants accompany each table, and an updated-at trigger keeps `contest_submissions` current.

## Influencer experience

**Active Contests** becomes the execution dashboard. Each card shows title, business category, reward pool, required views, start and end dates, submission status, a countdown to the contest end, and a progress indicator.

**Contest detail** for a live contest the influencer participates in shows campaign brief, contest brief, rules, reward breakdown, required views, timeline, and a submission panel.

The submission form asks for platform (Instagram / TikTok / YouTube), content URL (required), caption (optional), notes (optional), and a final-submission agreement checkbox. Submitting is one-way: the panel then renders a read-only summary of what was sent plus the submission timeline, and the contest stays under Active Contests until its end date passes.

**Completed Contests** lists finished contests together with the submission status for each. A contest is treated as completed once its end date has passed or an admin marks it completed; active means live and not past its end date. No scheduled job is involved — the split is derived from the contest dates at read time.

A reserved Performance Metrics section on the submission detail states that metrics will be collected during winner evaluation.

## Admin experience

Contest detail gains a Content Submissions workspace listing every participant with their submission state (including participants who have not submitted yet). It supports search by participant, filtering by pending / submitted / verified / flagged, and sorting by submission date, participant or platform.

Each submission expands to show influencer, portfolio, submitted URL, caption, notes and the submission timeline, with Verify and Flag actions. Winner selection is deliberately absent.

## Business experience

Business contest detail gains a Contest Progress dashboard: total participants, total submitted, pending, verified and flagged counts, an overall progress indicator, and the contest submission activity summary. Read-only — no review controls.

## Server rules

A submission is accepted only when the contest is live, the end date has not passed, a participant record exists for the caller with active participation, and no submission exists yet. All of this is enforced server-side; the client form only mirrors it. Verify and flag are admin-only and only apply to a submitted (or already reviewed) record, and each mutation writes its timeline event.

Notifications reuse the existing system: the influencer is told when their submission is received, verified or flagged; the business and admins are told when a new submission arrives and when contest progress changes.

## Technical notes

New module `src/features/contest-submissions/` with `types.ts`, `submission.schema.ts`, `submission.server.ts`, `submission.functions.ts`, `components/` and `hooks/`.

Server functions: `submitContestContent`, `getSubmission`, `getMySubmission`, `listContestSubmissions`, `verifySubmission`, `flagSubmission`, `listSubmissionEvents`, `getContestProgress`. Shared helpers `validateParticipant`, `validateSubmissionWindow`, `checkDuplicateSubmission` live in `submission.server.ts` and call the existing contest-lifecycle, participant and notification helpers rather than duplicating them. Cross-user reads (admin lists, business aggregates, notifications) go through the admin client only after the caller's role is verified.

Components: `ContestSubmissionForm`, `SubmissionCard`, `SubmissionStatusBadge`, `SubmissionTimeline`, `SubmissionPreview`, `ContestProgressCard`, `SubmissionSummary`, `SubmissionCountdown`, plus an admin `SubmissionsWorkspace` container. Existing `ContestHeader`, `ContestTimeline`, `DataSection`, `EmptyState`, `PageHeader`, `ProfileGate`, `AttachmentPreview` and the shared `StatusBadge` are reused.

Routes updated: `app.contests.active.tsx`, `app.contests.$contestId.tsx`, `app.contests.completed.tsx`, `app.admin.contests.$contestId.index.tsx`, `app.business.contests.$contestId.tsx`. Query keys follow the existing feature-key pattern with a shared invalidator.

## Order of work

1. Migration: enum, both tables, grants, RLS policies, updated-at trigger; regenerate database types.
2. Module types, schema and server helpers.
3. Server functions with validation and notifications.
4. Components.
5. Route integration for influencer, admin and business.
6. Typecheck, lint and a preview walkthrough of the full execution flow.
