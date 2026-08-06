# Contest Applications

Influencers apply once per eligible contest, track and withdraw their applications. Admins browse all applications per contest. Businesses see counts only. No redesign — existing layouts, cards, badges, dialogs, gate and query patterns are reused.

## What users get

**Influencer**
- Eligible contests show an active Apply button on the contest detail page; the placeholder application panel is replaced by the real form.
- Application form sections: Portfolio Link (required, valid URL), Content Idea / Campaign Approach (required), Additional Notes (optional), Agreement to Contest Rules (required checkbox).
- One application per contest, enforced in the database and re-checked server-side.
- My Applications lists every application with contest, business category, submitted date, status and contest deadline.
- Withdraw is available only while the contest is in Applications Open; withdrawn applications stay in history and cannot be restored or re-applied.
- Application detail page shows the submitted answers, portfolio preview and a timeline.

**Admin**
- Contest detail gains an Applications tab: full list, applicant search, status filter, and a link into each application detail.
- A Participant Selection panel is reserved on the contest detail with the message that selection arrives in the next milestone.

**Business**
- Its contest detail shows total applications and a status summary plus a read-only, anonymised list (status + submitted date only). No applicant identity, contact details or answers.

## Application rules (all enforced server-side)

An application is accepted only when the contest is in Applications Open, today falls inside the application window, the contest is not archived, the influencer passes eligibility, and no prior application exists. Each failure returns a typed error code so the UI can explain it precisely.

## Data model

New table `contest_applications`: contest_id, influencer_id, portfolio_url, content_idea, notes, status, submitted_at, withdrawn_at, created_at, updated_at, unique on (contest_id, influencer_id).

New enum `contest_application_status`: submitted, withdrawn, shortlisted, selected, rejected. Only submitted and withdrawn are produced this milestone; the rest exist for Participant Selection.

New table `contest_application_events`: application_id, actor_id, event_type, note, created_at. Every timeline entry is read from this table.

Access rules: influencers create, read and withdraw their own applications; admins read all; businesses read only aggregate counts for their own contests, delivered through a server-side count query rather than a row-level read of applicant data.

## Technical notes

New module `src/features/contest-applications/` with `types.ts`, `application.schema.ts` (Zod, shared client/server), `application.functions.ts`, `application.server.ts`, `components/`, `hooks/`.

Validation reuses `src/features/contests/eligibility.ts` (`evaluateEligibility`, `evaluateAvailability`, `isDiscoverable`) — no duplicated rules. `application.server.ts` composes `validateApplicationEligibility`, `checkDuplicateApplication` and `checkContestAvailability` into one guard used by every mutation.

Server functions (all `requireSupabaseAuth`): `applyToContest`, `withdrawApplication`, `getApplication`, `listMyApplications`, `listContestApplications` (admin), `listApplicationEvents`, plus `getContestApplicationSummary` for the business counts.

Notifications reuse the existing in-app notifications table and the admin-client helper pattern already used for contests: influencer on submit and withdraw, admins on a new application, business on application count change.

Components: `ContestApplicationForm`, `ApplicationCard`, `ApplicationStatusBadge`, `ApplicationTimeline`, `ApplicationSummary`, `WithdrawApplicationDialog`, `ContestApplicationHeader`, `PortfolioPreview` — reusing PageHeader, DataSection, EmptyState, ContestHeader, ContestTimeline, ProfileGate.

Routes: update `app.contests.$contestId.tsx` (real apply flow), rewrite `app.entries.index.tsx` against real data, add `app.entries.$applicationId.tsx`, update `app.admin.contests.$contestId.index.tsx` (Applications tab + reserved selection panel), update `app.business.contests.$contestId.tsx` (summary + read-only list).

The placeholder `src/features/contest-entries/` module and `contest-application-panel.tsx` are retired; `app.admin.entries.tsx` is repointed at the real application data so no stub contracts remain.

## Verification

Typecheck and lint clean, then a preview walkthrough: apply once as an influencer, confirm the duplicate and out-of-window attempts fail server-side, withdraw and confirm it cannot be restored, check My Applications statuses, admin browsing and search, and that the business view exposes counts only.

## Migration order

The database migration runs first and needs approval; the feature code follows once types are regenerated.
