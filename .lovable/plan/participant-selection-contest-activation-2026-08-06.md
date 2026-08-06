# Participant Selection & Contest Activation

Admins pick contest participants from submitted applications, then activate the contest. Influencers see live status changes and their active contests; businesses see counts only. No redesign — existing cards, badges, dialogs, timelines, gates and data patterns are reused.

## What users get

**Admin — Contest Detail**
- A Participant Selection workspace listing every application with search, status filter (Submitted / Shortlisted / Selected / Rejected) and sort (submission date, followers, category).
- Portfolio link and campaign idea readable inline, no navigation away.
- Per-applicant actions: Shortlist, Select, Reject. Bulk reject for remaining applicants.
- Selection summary: total applications, selected participants, remaining slots, participant limit.
- "Activate Contest" once participants are selected and the contest is in the right state.

**Influencer**
- My Applications reflects Submitted / Shortlisted / Selected / Rejected / Withdrawn, with each change on the application timeline.
- A detail view per application (currently only a list exists) showing status and history.
- Notifications for shortlisted, selected, rejected and contest activated.
- Contests they were selected for appear under Active Contests once the contest is Live.

**Business**
- Contest detail gains a participant summary: selected participants, participant limit, contest status, activation date. No applicant identities or contact details.

## Rules enforced on the server

- Selection is only allowed when the contest is Applications Closed or Participant Selection, and not archived.
- Allowed transitions only: Submitted → Shortlisted/Selected/Rejected, Shortlisted → Selected/Rejected. Nothing else, so a rejected or withdrawn applicant can never become a participant.
- Selecting beyond the participant limit is refused; duplicate participants are blocked by a database uniqueness rule.
- Activation requires at least one selected participant, moves the contest to Live, stamps activation on participant records, and cannot be undone.

## Contest flow

Applications Closed → Participant Selection (on first selection) → Live (on activation).

## Technical section

**Database migration**
- New table `contest_participants`: `id`, `contest_id`, `application_id`, `influencer_id`, `selected_at`, `activated_at`, `participation_status` (enum `active` | `removed` | `completed`, default `active`), `created_at`, unique `(contest_id, influencer_id)`. GRANTs for `authenticated` (select) and `service_role`; RLS: influencer reads own rows, admin full access via `has_role`; writes go through server functions using the admin client.
- No enum change needed for `contest_application_status` or `contest_status` — `shortlisted`/`selected`/`rejected` and `participant_selection`/`live` already exist. Event tables use free-text `event_type`, so new event kinds (`shortlisted`, `selected`, `rejected`, `participant_selection_started`, `participant_selected`, `contest_activated`) are added as constants in `types.ts` with labels.

**Server layer** (`src/features/contest-applications/`)
- `participant-selection.server.ts`: transition matrix, limit and contest-status guards, participant upsert, event logging, notification fan-out (admin client only for cross-user notification inserts and business-safe aggregates).
- `participant-selection.functions.ts`: `shortlistApplication`, `selectParticipant`, `rejectApplication`, `bulkRejectApplications`, `activateContest`, `listSelectedParticipants`, `listContestParticipants`, `getSelectionSummary` — all `requireSupabaseAuth` + admin check, all emitting timeline events.
- `listMyActiveContests` in `src/features/contests/contests.functions.ts` switches to real data: contests where the user has an `active` participant row and the contest is Live.

**Components** (new, in the applications feature module)
`ParticipantSelectionTable`, `ApplicationSelectionCard`, `SelectedParticipantCard`, `ParticipantLimitIndicator`, `SelectionSummary`, `ActivateContestDialog`, `SelectionStatusBadge`. Reuse `ApplicationCard`, `ContestHeader`, `ContestTimeline`, `DataSection`, `EmptyState`, `ProfileGate`, existing status badges.

**Routes**
- `app.admin.contests.$contestId.index.tsx`: add selection summary, participant selection workspace and activate action alongside existing panels.
- `app.contests.active.tsx`: fed by real participant data.
- New `app.entries.$applicationId.tsx`: influencer application detail with status and timeline; list rows link into it.
- `app.business.contests.$contestId.tsx`: participant summary card.

**Verification**
Typecheck, lint, and a preview walkthrough covering limit enforcement, invalid transitions, activation, notifications and business-side redaction.
