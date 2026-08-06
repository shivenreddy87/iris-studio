# Prompt 12 — Security, Audit, Performance & Production Hardening

No new business workflows, no redesign. This milestone closes the suspension-guard gap, hardens security and auditing, tunes performance, and produces the Phase 1 readiness documentation.

Because this touches nearly every module, it is delivered in six sequential stages. Each stage ends with a typecheck so the app stays working throughout.

## Stage 1 — Suspension guard everywhere (carryover)

`assertNotSuspended` exists in `src/features/platform-admin/admin.server.ts` but is currently not called anywhere. Wire it (reused, not duplicated) into every mutating server function across:

- campaign requests (create, edit, submit, resubmit) and admin review
- contest creation and lifecycle, saved contests
- applications, withdrawals, participant selection
- content submissions, winner selection
- payout details and payout lifecycle updates
- profile updates, connected accounts, notification preferences
- platform administration and moderation actions

Read paths stay open for suspended users; writes fail with a clear "account suspended" message.

## Stage 2 — Authorization + RLS audit

- Walk all 27 server-function modules. Every mutation must verify: authenticated user, role, ownership of the referenced row, suspension, and the relevant lifecycle state (contest / campaign / payout). Client-supplied IDs are re-resolved server-side before use.
- Database migration: review every table's SELECT/INSERT/UPDATE/DELETE policies, drop redundant ones, consolidate duplicates, and standardise on the existing `has_role` helper conventions.
- Retire the legacy pre-contest modules that are no longer part of the product surface where nothing references them; keep the ones still wired to live routes.

## Stage 3 — Audit logging

New `audit_logs` table: actor, actor role, entity type, entity id, action, previous values, new values, ip placeholder, user agent placeholder, timestamp. Insert-only (no update/delete policy), readable by admins; users can read their own entries.

A single `recordAuditLog` helper in a shared server module is called from every admin mutation plus the key business/influencer actions: campaign submission, contest application, submission upload, payout detail submission.

## Stage 4 — Performance, storage, forms, errors, loading

- **Queries**: consistent React Query key factories per feature, correct invalidation sets, sensible stale times, removal of duplicate fetches, optimistic updates on toggles (save contest, mark notification read).
- **Server queries**: eliminate N+1 lookups (batch related rows), select only needed columns, add the missing indexes for the hottest filters (contest status, application/submission by contest, payouts by influencer, notifications by user).
- **Storage**: one shared upload helper covering avatars, campaign attachments, payout documents — server-side type/size validation and consistent signed-URL expiry; the two ad-hoc upload implementations are replaced by it.
- **Errors**: one typed error shape returned by all server functions, generic user-safe messages for unexpected failures, full detail kept in server logs, toasts via the existing sonner setup.
- **Loading**: every async section routed through `DataSection` with skeleton, empty, error and retry states.
- **Forms**: React Hook Form + shared Zod schemas, inline validation, submit disabled while invalid or in flight, double-submit prevention.

## Stage 5 — Accessibility + cleanup + build

- Keyboard traversal, focus management on dialogs/sheets, aria labels on icon buttons, table captions and header scopes, screen-reader labels; contrast checked against existing tokens only. No visual redesign.
- Remove dead components, duplicate status/format helpers, unused hooks and obsolete placeholder modules.
- Route-level code splitting review, lazy loading of heavy chart bundles, image loading attributes, bundle/chunk size check.

## Stage 6 — Testing, docs, readiness report

- Automated coverage limited to pure domain logic (eligibility, scoring, lifecycle transitions, completion) with a small Vitest suite — no e2e framework is added.
- Manual walkthrough of every Business, Influencer and Admin workflow in the preview, verifying lifecycle transitions, notifications, permissions and suspension behaviour.
- `/docs`: architecture overview, feature module map, database relationship diagram (Markdown), route map, permission matrix, lifecycle diagrams, server function index.
- Final Phase 1 Production Readiness Report: features completed, security checks, performance work, remaining technical debt, recommended Phase 2 items.

## Out of scope

Native apps, payment gateways, AI judging/recommendations, real-time collaboration, email/SMS/push delivery, multi-language, multi-tenant organizations, external BI, deployment automation.

## Technical notes

- Two database migrations: one for policy consolidation + indexes, one for `audit_logs`.
- Guard, audit and upload helpers live in server-only modules and are imported inside handlers so they never reach the client bundle.
- Suspension and audit calls are added to existing handlers rather than wrapped in new middleware, keeping each function's error semantics intact.
