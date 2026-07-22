# Connect Project Eros to a real backend

Right now every screen runs on mock adapters in `src/lib/api/adapters.ts`, and the sign-up/sign-in forms have empty submit handlers — that's why nothing happens when you try to sign up. This plan connects a real backend (Lovable Cloud) and makes auth actually work end-to-end. Data-layer wiring for campaigns/creators/deals stays on mocks for now (separate follow-up) so this stays focused.

## 1. Enable Lovable Cloud
Provisions a Postgres database, auth, storage, and secrets — no external accounts. Gives us a real `supabase` client at `@/integrations/supabase/client` and server-side helpers.

## 2. Database: profiles + roles
- `profiles` table linked to `auth.users` (id, full_name, email, avatar_url, timestamps).
- `app_role` enum (`brand`, `creator`, `admin`) and a separate `user_roles` table (never store the role on `profiles` — prevents privilege escalation).
- `has_role()` security-definer function for RLS checks.
- Trigger `on_auth_user_created` that auto-creates a `profiles` row and inserts the chosen role (read from signup metadata) into `user_roles`.
- RLS: users can read/update their own profile; users can read their own roles.

## 3. Auth wiring (frontend)
- `src/routes/auth.sign-up.tsx`: React Hook Form + Zod, real `supabase.auth.signUp({ email, password, options: { data: { full_name, role }, emailRedirectTo: window.location.origin } })`, error toasts, redirect to `/app` on success.
- `src/routes/auth.sign-in.tsx`: real `signInWithPassword`, redirect to `/app`.
- Add Google sign-in button on both (via the Lovable managed broker) — default per platform guidance.
- Add `src/routes/auth.callback.tsx` and `/reset-password` route (required for password recovery).

## 4. Session + route protection
- Central `useAuth` hook: subscribes to `onAuthStateChange` once, exposes `{ session, user, role, loading }`.
- Move the app shell under the integration-managed `src/routes/_authenticated/` layout (rename `app.*.tsx` → `_authenticated/app.*.tsx`) so unauthenticated visits redirect to `/auth/role`.
- Update the sidebar/header to show the signed-in user and a working Sign out button (cancel queries → clear cache → `signOut()` → `navigate('/auth/sign-in', { replace: true })`).
- Root route wires `onAuthStateChange` → `router.invalidate()` for SIGNED_IN/OUT/USER_UPDATED only.

## 5. Verification
- Sign up as Brand → land in `/app` → `profiles` + `user_roles` rows exist.
- Sign out → protected routes redirect to `/auth/sign-in`.
- Sign in again → session restored, role visible in UI.
- Google sign-in round-trip works.

## Out of scope (call out for a later turn)
- Replacing mock `adapters.ts` with real Supabase queries for campaigns, creators, deals, messages, analytics.
- Storage buckets for creator media/avatars.
- Iris AI endpoints (will use Lovable AI Gateway).

## Technical notes
- Use `supabase.auth.getUser()` (not `getSession()`) for any trust check; `getSession()` only for bearer attachment.
- Roles table is mandatory-separate — enforced by platform security rules.
- Google OAuth must go through `lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin })`, not raw `supabase.auth.signInWithOAuth`.
- All new tables get explicit `GRANT`s to `authenticated` + `service_role` in the same migration as `CREATE TABLE`.
