# Project Eros — Production Readiness Plan

The app is feature-complete (landing, auth, campaigns, discovery, deals, messaging, analytics, Iris AI) with real Cloud auth + Postgres. Now we make it feel and behave like a shipped product.

## Phase 1 — Palette & UX pass (finish what we started)
- Sweep any remaining light-theme leftovers (modals, popovers, empty states, toasts, sonner, dropdowns, dialogs, command palette).
- Recolor all Recharts across analytics/deals to use the new tokens.
- Add loading skeletons and empty states for every list route (campaigns, discover, deals, messages, opportunities, inbox, media kit, earnings).
- Add error boundaries per route with a friendly "Something broke" card + retry.
- Motion polish: page enter fades, list item stagger, subtle hover elevation.

## Phase 2 — Social account linking & portfolio auto-fill (requested last turn)
Let creators and brands connect Instagram, TikTok, YouTube via App User Connectors, then hydrate their creator profile from the provider.
- Onboarding step after role selection prompts creator to link ≥1 social.
- Store per-user connection keys encrypted (`app_user_connections` table + AES-GCM helpers).
- Server functions call each provider through the connector gateway to fetch: handle, follower count, avg engagement, recent posts, category tags → write into `creator_profiles`.
- Nightly re-sync via a TanStack server route + `pg_net` cron.
- Media Kit page renders live provider metrics with "Last synced X min ago" + manual re-sync button.

## Phase 3 — Brand onboarding & workspace polish
- First-run checklist card on `/app` (create org, invite teammate, launch first campaign, connect payment reference).
- Organization settings page (name, logo upload to `avatars` bucket, members list).
- Invite-by-email flow (magic link token stored in `org_invites`).

## Phase 4 — Iris AI upgrades
- Persist chat threads (per user) in a `iris_threads` + `iris_messages` table so conversations survive reload.
- Add tools: `createCampaignDraft`, `shortlistCreators`, `draftOutreachMessage`, `summarizeDealPipeline`.
- Streaming token counter + graceful rate-limit / credit-exhausted toasts.
- Suggested-prompt chips per role (brand vs creator).

## Phase 5 — Notifications, email, and real-time
- Deliver in-app notifications for: new message, deal stage change, campaign invite, payout event.
- Transactional emails via the built-in email domain: welcome, password reset (already scaffolded), invite, deal accepted.
- Realtime presence indicator in Messages ("typing…", "online").

## Phase 6 — Media, uploads, and storage hardening
- Avatar + media-kit uploads with client-side resize, allowed MIME + size caps, signed URL access.
- RLS review on both buckets; add owner-only delete policy.

## Phase 7 — Search, filtering, and performance
- Postgres full-text + trigram on creator name/handle/bio; category and follower-range facets in `/app/discover`.
- Cursor pagination on campaigns, deals, messages.
- Add DB indexes on hot filter columns.
- TanStack Query: set sensible `staleTime`, prefetch on hover for `Link`s to detail routes.

## Phase 8 — Security & compliance
- Re-run the security scan; fix any new findings before publish.
- Add HIBP password protection (`configure_auth`).
- Rate-limit sensitive server fns (Iris chat, invite send) via a `rate_limits` table.
- Add a public `/privacy` and `/terms` route with real copy placeholders and updated OG meta.
- CSP/robots/sitemap: verify head metadata is unique per route and add `/robots.txt` + basic `/sitemap.xml` route.

## Phase 9 — Observability & error reporting
- Server-fn error logging table (`app_errors`) with a lightweight admin view at `/app/admin/errors` (role-gated).
- Client `window.onerror` + Query `onError` funneling into that same table via a public API route with a shared secret.
- Analytics event stream (page view, campaign created, deal accepted) into `analytics_events`.

## Phase 10 — Billing surface (display-only)
Payments are out of scope per your note; we still show plans/quotas so the product feels complete.
- `/pricing` public route.
- Workspace-level "Plan: Free / Studio / Scale" badge with feature-gate copy (no Stripe hook).

## Phase 11 — Launch prep
- Seed a "Demo mode" toggle that fills a new brand workspace with sample campaigns/creators so a first-time visitor sees a populated app.
- Full pass on unique per-route `head()` metadata (title, description, og:image where a hero exists).
- Manual QA checklist: sign-up (brand + creator), Google OAuth, forgot password, create campaign, invite creator, message thread, Iris chat, analytics loads.
- Run security scan → publish to Lovable URL → verify prod URL end-to-end.

## Technical notes
- New tables: `app_user_connections`, `iris_threads`, `iris_messages`, `org_invites`, `rate_limits`, `app_errors`, `analytics_events`. Every one ships with GRANTs + RLS in the same migration.
- New server functions live in `src/lib/*.functions.ts`; nightly sync + error ingest use `src/routes/api/public/*` routes with HMAC verification.
- New Iris tools use the existing Lovable AI Gateway; no extra secrets.
- Provider OAuth uses App User Connectors — Instagram, TikTok, YouTube each need a workspace client configured; I'll prompt for those inside the phase.

```text
Order of execution
Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11
```

Tell me if you want to trim, reorder, or skip anything (e.g. defer social linking, skip billing display) before I start building.
