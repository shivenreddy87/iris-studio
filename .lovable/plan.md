# Contest Discovery & Saved Contests

Published contests become discoverable to influencers, with search, filters, sorting, server-side eligibility and a saved-contests list. No redesign: existing page headers, cards, badges, timelines, profile gate and query patterns are reused. Applications remain out of scope and are represented by reserved, clearly-labelled placeholders.

## Database

New table `saved_contests` (id, contest_id, influencer_id, created_at):
- Unique on (contest_id, influencer_id) so a contest can only be saved once.
- Contest deletion cascades and removes saved rows.
- Influencers can read, add and remove only their own saved rows; admins get read-only access.

New read access rule on `contests`: influencers can read contests that are Published or Applications Open, are not archived, and whose publish date has passed. Current admin (full) and business (own contests) rules are unchanged.

## Eligibility engine

`src/features/contests/eligibility.ts` — pure, reusable, evaluated on the server:

Returns `{ eligible, reasons[], missingRequirements[] }` with reasons drawn from: Eligible, Category Mismatch, Followers Below Minimum, Followers Above Maximum, Location Restricted, Contest Not Published, Applications Closed, Contest Archived.

Inputs are the contest row plus the influencer's creator profile (niche/category, follower count, location). Because it is a pure function it plugs directly into the next milestone's application validation.

## Server functions

`discovery.functions.ts` (all authenticated):
- `listDiscoverableContests` — search + filters + sort + pagination in one call, returning `{ items: [{ contest, eligibility, saved }], total, page, pageSize }`.
- `getContestForInfluencer` — one contest plus eligibility, saved status and timeline events.
- `searchContests`, `filterContests`, `calculateEligibility` — thin typed wrappers over the same query/eligibility core so the contracts named in the spec exist.

`saved.functions.ts`: `saveContest`, `unsaveContest`, `listSavedContests` (same enriched shape as discovery, so the same card renders both).

Search covers title, campaign goal and business category. Filters: platform, creator category, reward pool range, follower range, status, location, application deadline. Sorts: Newest, Highest Reward, Earliest Deadline, Contest Start.

## Components (`src/features/contests/components/`)

New: `ContestDiscoveryCard`, `ContestFilterBar`, `ContestSearch`, `ContestSort`, `ContestDetailHeader`, `ContestCountdown`, `EligibilityBanner`, `EligibilityReasonList`, `SavedContestButton`, `ContestMetaCard`.

Reused as-is: `ContestStatusBadge`, `ContestTimeline`, `RewardCard`, `EligibilityCard`, `AttachmentPreview`, `ContestDates`, `ContestRules`, `DataSection`, `EmptyState`, `PageHeader`, `ProfileGate`.

`ContestDiscoveryCard` shows title, business category, reward pool, required views, participant limit, winner count, platform, creator category, follower range, contest start, application deadline and status badge, plus a save toggle and a reserved action slot for the future Apply button.

## Routes

- `app.contests.index.tsx` — real discovery page: search bar, filter bar, sort control, paginated grid of discovery cards, empty state, link to Saved Contests.
- `app.contests.$contestId.tsx` — full detail: header, business category, campaign goal, campaign brief, contest brief, rules, reward, required views, participant limit, winner count, eligibility requirements, contest dates, countdown timer, attachment preview, timeline, save button, and an Application section that renders either the Applications Opening Soon banner with a disabled Apply button (eligible) or the eligibility panel with structured reasons (ineligible).
- `app.contests.saved.tsx` — new: saved cards with search, sorting, remove action and empty state; added to influencer navigation.
- Business detail (`app.business.contests.$contestId.tsx`) gains current status, application window, timeline and read-only progress. Still no editing. Admin routes untouched.

## Verification

Typecheck, lint, and a preview walkthrough confirming: only Published/Applications Open contests surface; draft, completed and archived stay hidden; search, filters, sorting and pagination behave; eligibility reasons match profile variations; duplicate saves are rejected; countdowns render; business read-only access intact.
