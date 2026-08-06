# Transform Iris Studio into a Contest-Based Platform (Phase 1)

Structural + terminology transformation only. No visual redesign: same tokens, typography, spacing, colors, motion, components.

## What changes

### 1. Roles
Three roles: Business, Influencer, Admin. The existing auth roles stay exactly as stored today (`brand`, `creator`, `admin`) — only the labels shown to users change ("Business", "Influencer"). No role logic, no new gating, no migration in this phase.

### 2. Navigation (rewritten in the existing sidebar component)

Business: Dashboard, Campaign Requests, Notifications, Profile

Influencer: Dashboard, Available Contests, My Applications, Active Contests, Completed Contests, Won Contests, Notifications, Profile

Admin: Dashboard, Businesses, Influencers, Campaign Requests, Contests, Participants, Winners, Manual Payouts, Notifications

The Admin nav renders for the `admin` role using the same sidebar layout.

### 3. Hidden (not deleted) Phase-1-out features
Iris/AI, Messages, Deals, Analytics, Media Kit, Earnings, Lists, Team/Collaborators, Connections, Pricing links inside the app. Route files and components stay on disk and keep working if visited directly — they are simply removed from navigation, including the sidebar "Ask Iris" promo card and the Settings hub tiles for hidden areas.

### 4. Renames (labels and new routes)
- Campaigns → Campaign Requests
- Discover → Available Contests
- Deals → Contest Results
- Organizations → Businesses
- Creator/Brand Dashboard → Influencer/Business Dashboard

### 5. Placeholder pages
Each new page reuses the existing page header, card, and `EmptyState` components and contains: title, one-line description, empty state, and a "Coming in next milestone" card. No data fetching.

## Route map

```text
src/routes/
  app.tsx                         (unchanged shell + auth guard)
  app.index.tsx                   dashboard, switches by role label
  app.notifications.tsx           NEW placeholder
  app.profile.tsx                 NEW placeholder

  app.business.requests.index.tsx     Campaign Requests list
  app.business.requests.new.tsx       Submit a request
  app.business.requests.$requestId.tsx  Request detail

  app.contests.index.tsx              Available Contests (influencer)
  app.contests.$contestId.tsx         Contest detail
  app.entries.index.tsx               My Applications (contest entries)
  app.contests.active.tsx
  app.contests.completed.tsx
  app.contests.won.tsx

  app.admin.index.tsx                 Admin Dashboard
  app.admin.businesses.tsx
  app.admin.businesses.$businessId.tsx
  app.admin.influencers.tsx
  app.admin.influencers.$influencerId.tsx
  app.admin.requests.index.tsx
  app.admin.requests.$requestId.tsx
  app.admin.contests.index.tsx
  app.admin.contests.new.tsx
  app.admin.contests.$contestId.tsx
  app.admin.entries.tsx               Participants
  app.admin.winners.tsx
  app.admin.payouts.tsx
```

These are the final URLs — detail/new routes are created now (rendering the shared empty state) so no path changes are needed when data lands. Existing files (`app.campaigns.*`, `app.discover.tsx`, `app.deals.$id.tsx`, `app.iris.*`, `app.messages.tsx`, `app.analytics.tsx`, etc.) are left in place, untouched, just unlinked from nav.

## Future-proofing

Naming is final, not transitional. Domain vocabulary used everywhere: `campaignRequest`, `contest`, `contestEntry` (an influencer's application), `contestWinner`, `payout`, `business`, `influencer`. No "placeholder", "temp", "new-", or "v2" in any identifier or path.

Module scaffolding created now, filled in the next milestone — nothing gets renamed later:

```text
src/features/
  campaign-requests/  types.ts  requests.functions.ts  components/
  contests/           types.ts  contests.functions.ts  components/
  contest-entries/    types.ts  entries.functions.ts   components/
  payouts/            types.ts  payouts.functions.ts   components/
src/components/shared/
  page-header.tsx  empty-state.tsx  data-section.tsx  status-badge.tsx
src/lib/
  navigation.ts     role-based nav config
  roles.ts          Role type + display labels + role helpers
```

- `types.ts` per feature defines the domain shape (status unions like `draft | open | in_review | active | completed`) up front, so pages, badges, and future queries share one contract.
- `*.functions.ts` files are created as thin server-function modules returning empty typed collections; the next milestone swaps the body for real queries with zero call-site changes.
- Routes render feature components (e.g. `<ContestList contests={[]} />`), not inline markup, so wiring data means passing real props.
- `data-section.tsx` is one wrapper handling loading / empty / error / content states so every list page behaves identically once queries exist.
- `status-badge.tsx` maps the shared status unions to existing token colors — one place to extend.
- `roles.ts` centralises the `brand→Business` / `creator→Influencer` label mapping and a `hasRole` helper, so introducing real role gating later is a single-file change.

## Technical notes

- `app-shell.tsx` reads nav from `src/lib/navigation.ts` (three role-keyed arrays with `to`, `label`, `icon`) instead of its inline `brandNav`/`creatorNav` constants; hidden Phase-1 items are simply absent from the config.
- Each new route gets its own `head()` with unique title/description/og tags.
- Auth, Supabase clients, existing server functions, and React Query setup are not touched.
- Landing page, marketing routes, and auth screens are untouched apart from copy where it says "marketplace".
- Verification: typecheck, lint, and a click-through of every nav link in the running preview.

## Out of scope for this phase
No contest tables, no submissions, no winner selection, no payout records — data modelling comes in the next milestone against the module contracts above.

