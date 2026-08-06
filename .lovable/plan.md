# Onboarding and Profiles Milestone

Adds first-login onboarding for Business and Influencer accounts, editable profiles, and a profile-completion indicator. Admin accounts are untouched. No contest functionality, no navigation/layout/design changes.

## What the user will experience

**First login**
- A Business account lands on Business Profile Setup; an Influencer lands on Influencer Profile Setup. Admins go straight to the dashboard.
- Setup is a single professional form built from existing inputs, cards and buttons — no new visual language.
- Once saved, onboarding is marked complete and every later login goes directly to the dashboard.

**Business setup fields**
Business name, category, contact person, business email, phone, location, website (optional), Instagram (optional), description, company logo upload.

**Influencer setup fields**
Full name, username, primary category, location, primary platform, follower range, bio, Instagram handle, TikTok handle (optional), YouTube channel (optional), profile photo.

**Profile completion**
- A reusable completion card (existing Progress component) shows a percentage on the dashboard and on the profile page.
- Features that are not part of this milestone stay gated behind 100% completion, using the existing milestone/empty-state components — no new UI patterns.

**Profile page**
- `/app/profile` becomes a real page: view current details, edit them, save changes, with a success toast via the existing sonner setup.
- The same form component powers both onboarding and editing, so there is one source of truth.

## Data changes

One migration:

- `public.profiles`: add `onboarding_completed_at` (timestamptz, nullable).
- New `public.business_profiles`: one row per business user — business name, category, contact person, contact email, phone, location, website, instagram, description, logo_url, timestamps. Owner-only read/write policy plus admin read via the existing role helper; GRANTs for `authenticated` and `service_role`; `updated_at` trigger.
- Extend existing `public.creator_profiles` with the fields it lacks: `username`, `primary_platform`, `follower_range`, `tiktok_handle`, `youtube_channel`, `avatar_url`. Existing columns (`display_name`, `niche`, `location`, `bio`) are reused rather than duplicated.

Logo/photo uploads use the existing private `avatars` bucket with owner-scoped `storage.objects` policies and signed URLs for display.

## Technical approach

- `src/features/profiles/types.ts` — typed `BusinessProfile`, `InfluencerProfile`, shared `ProfileCompletion`, plus Zod schemas (`businessProfileSchema`, `influencerProfileSchema`) shared by form and server validation.
- `src/features/profiles/profiles.functions.ts` — `createServerFn` CRUD with `requireSupabaseAuth`: `getMyProfile`, `upsertBusinessProfile`, `upsertInfluencerProfile`, `completeOnboarding`. Simple CRUD only.
- `src/features/profiles/completion.ts` — pure function computing percentage from required fields per role (kept out of server functions so both client and server can use it).
- Components under `src/features/profiles/components/`: `business-profile-form.tsx`, `influencer-profile-form.tsx`, `profile-completion-card.tsx`, `avatar-upload.tsx` — all built from existing shadcn primitives and shared components.
- Forms use React Hook Form + Zod resolver, inline field errors, submit disabled until valid, `sonner` toast on save.
- New routes (follows existing flat convention, no nav changes): `src/routes/onboarding.business.tsx` and `src/routes/onboarding.influencer.tsx`, both auth-gated the same way `/app` is.
- Redirect logic: `src/routes/app.tsx` `beforeLoad` — after the existing `getUser()` check, read the profile's role and `onboarding_completed_at`; redirect Business/Influencer users with no completion timestamp to the matching onboarding route. Admins are exempt. Onboarding routes redirect back to `/app` when already complete.
- `src/routes/app.index.tsx` gains the completion card; `src/routes/app.profile.tsx` gains view/edit using the same forms.
- Verification: typecheck, lint on touched files, and a preview pass over the onboarding and profile routes.
