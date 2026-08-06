# Contest Creation Engine

Admins turn an approved campaign request into a contest, configure it through a multi-step wizard, publish it and move it through its lifecycle. Businesses get read-only visibility of contests made from their own requests. Influencer discovery stays out of scope. No redesign — existing page headers, cards, badges, dialogs, forms, timelines and query patterns are reused.

## What changes for users

**Admin**
- Contests dashboard grouped into Draft, Published, Applications Open, Live, Completed, Archived, with search (title, business name, approval reference), filters (status, platform, business category) and sorting (created, updated, contest start, application deadline).
- Each contest card shows title, business name, reward pool, required views, participant limit, winner count, status badge and created date, and opens the contest detail page.
- "Create Contest" lists only approved campaign requests that don't already have a contest. Selecting one opens the wizard with campaign data pre-filled.
- Six-step wizard: Campaign Information (inherited), Eligibility, Rewards, Timeline, Rules, Review — ending in Save Draft or Publish Contest.
- Contest detail shows business info, campaign request reference, brief, goal, required views, reward pool, participant limit, winner count, eligibility, dates, attachment preview, current status, lifecycle actions and an event timeline.

**Business**
- Read-only contest view for contests generated from their own approved requests, plus in-app notifications when a contest draft is created, published or archived.

## Lifecycle

Draft → Published → Applications Open → Applications Closed → Participant Selection → Live → Completed → Archived. Every transition is validated in server functions; the UI only offers the next legal step. After publishing, inherited campaign fields are locked and only dates, brief, rules and instructions stay editable.

## Data

New `contests` table with the listed fields: unique campaign_request_id, business_id, inherited campaign fields (title, description, goal, category, platform, location, required views, preferred creator category, follower range, attachment), contest settings (reward pool, participant limit, winner count, application/contest dates, brief, rules), status, published_at, archived_at, created_by, timestamps, updated_at trigger.

New `contest_events` table (contest_id, actor_id, event_type, note, created_at) — the single source for the timeline.

New `contest_status` enum with the eight lifecycle values.

Access rules: admins have full access; a business can read contests whose business_id is theirs and read their events; all writes go through admin-checked server functions. Grants and RLS follow the existing campaign-request pattern.

## Technical notes

- Module `src/features/contests/` is reworked in place: `types.ts` (status enum, labels, `Contest`, `ContestEvent`), `contest.schema.ts` (per-step Zod schemas plus draft-lenient / publish-strict composites, including the date ordering rules), `contest.functions.ts` (`createContestFromRequest`, `updateDraftContest`, `publishContest`, `transitionContest`, `archiveContest`, `getContest`, `listContests`, `listContestEvents`, `listApprovedRequestsWithoutContest`), `contest.server.ts` for shared helpers (admin check, event logging, transition guard, business notification), `components/`, `hooks/`.
- Server-side guards: request must be `approved`, no existing contest for that request, transition must be legal for the current status, and published contests reject inherited-field updates.
- Components: `ContestCard`, `ContestWizard` (+ step components), `ContestHeader`, `ContestStatusBadge`, `ContestTimeline`, `EligibilityCard`, `RewardCard`, `ContestSummary`, `ContestDates`, `ContestRules`. Existing `contest-list.tsx` and the placeholder status set are replaced by the new enum; `attachment-preview` and `status-badge` primitives are reused.
- Routes: `app.admin.contests.index.tsx` (sectioned dashboard + search/filter/sort), `app.admin.contests.new.tsx` (approved-request picker → wizard), new `app.admin.contests.$contestId.edit.tsx`, `app.admin.contests.$contestId.tsx` (detail + lifecycle actions + timeline), and a business-facing read-only contest detail behind `ProfileGate`.
- Data flow uses the existing TanStack Query + `useServerFn` pattern with mutations invalidating contest list/detail/event keys. Notifications use the existing `notifications` table helper.
- Migration runs first (enum, tables, grants, RLS, trigger); code follows once types regenerate. Finished with a typecheck.
