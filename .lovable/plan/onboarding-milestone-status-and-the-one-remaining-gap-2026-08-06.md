# Onboarding milestone: status and the one remaining gap

This milestone is already built and compiling. Verified in the project right now:

- Database has `profiles.onboarding_completed_at`, a `business_profiles` table, and the extra influencer columns (`username`, `primary_platform`, `follower_range`, `tiktok_handle`, `youtube_channel`, `avatar_url`).
- `src/features/profiles/` holds typed Zod models, completion scoring, and CRUD server functions (`getMyProfile`, `upsertBusinessProfile`, `upsertInfluencerProfile`, `completeOnboarding`).
- Onboarding routes exist for both roles, redirect on first login happens in `/app`, admins are untouched.
- Profile page supports view + edit + save; dashboard shows the completion card and hides stat cards until 100%.
- TypeScript passes with no errors.

## The gap worth closing

"Hide incomplete features until onboarding reaches 100%" is only enforced on the dashboard. A business or influencer with a 60% profile can still open Campaign Requests, Available Contests, My Applications, and the other feature pages directly from the sidebar or by URL.

## What to build

1. A shared gate component in `src/features/profiles/components/profile-gate.tsx`. It reads the current profile with the existing `getMyProfile` query key, computes completion with the existing helper, and either renders its children or renders a locked card that explains what is missing and links to `/app/profile`. Admins always pass. While the profile is loading it shows the existing skeleton so nothing flashes.

2. Wrap the feature pages in that gate, leaving their content untouched:
   - Business: `app.business.requests.*`
   - Influencer: `app.contests.*` (available, active, completed, won) and `app.entries.*`
   - Not gated: Dashboard, Notifications, Profile, and every admin route.

3. Dim the gated links in the sidebar when the profile is incomplete, using the existing nav rendering (opacity plus a small lock icon). No changes to the nav arrays, layout, routing, or design system.

## Technical notes

- Reuse `profileCompletion()` from `src/features/profiles/completion.ts` and `ProfileCompletionCard` for the locked state; no new tokens or styles.
- The gate uses the same `["my-profile"]` query key already used by the dashboard and profile page, so it costs no extra request.
- No schema changes, no new server functions, no contest logic.
