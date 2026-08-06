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

  business/
    app.business.requests.index.tsx   Campaign Requests (placeholder)
    app.business.requests.new.tsx     Submit a request (placeholder)

  influencer/
    app.influencer.contests.tsx       Available Contests
    app.influencer.applications.tsx   My Applications
    app.influencer.active.tsx         Active Contests
    app.influencer.completed.tsx      Completed Contests
    app.influencer.won.tsx            Won Contests

  admin/
    app.admin.index.tsx               Admin Dashboard
    app.admin.businesses.tsx
    app.admin.influencers.tsx
    app.admin.requests.tsx
    app.admin.contests.tsx
    app.admin.participants.tsx
    app.admin.winners.tsx
    app.admin.payouts.tsx
```

Existing files (`app.campaigns.*`, `app.discover.tsx`, `app.deals.$id.tsx`, `app.iris.*`, `app.messages.tsx`, `app.analytics.tsx`, etc.) are left in place, untouched, just unlinked from nav.

## Technical notes

- New shared file `src/lib/navigation.ts` holds the three nav arrays keyed by role; `app-shell.tsx` reads from it instead of its inline `brandNav`/`creatorNav` constants.
- New shared component `src/components/shared/placeholder-page.tsx` renders title + description + empty state + "Coming in next milestone" card, built from existing UI primitives and the current dark tokens. Every placeholder route is ~10 lines using it.
- Each new route gets its own `head()` with unique title/description/og tags.
- Auth, Supabase clients, server functions, and React Query setup are not touched.
- Landing page, marketing routes, and auth screens are not touched apart from copy where it says "marketplace".
- Verification at the end: typecheck, lint, and a click-through of every nav link in the running preview.

## Out of scope for this phase
No contest tables, no submissions, no winner selection, no payout records — data modelling comes in the next milestone.
