# Phase 1 Finalization — Platform Audit, Cleanup & Bug Fixes

Goal: bring the contest platform to a production-ready state. No new product features — only completing, correcting, and cleaning what exists.

## 1. Remove the legacy pre-contest product

These pages remain from the earlier "campaigns / creators / deals" product and are not reachable from any role's menu. They will be deleted along with their now-unused server functions, components, and hooks:

- Routes: Campaigns (list/new/detail), Discover, Creator detail, Deals, Lists, Messages, Team, Connections, Iris AI (all), Creator earnings / inbox / media-kit / opportunities, Rewards duplicates if any.
- Supporting modules: campaigns, creators, deals, lists, messages, team, org, iris server functions and the chat API route, plus any components used only by those pages.
- Old marketing nav/footer component (`site-nav.tsx`) and the hero logo marquee if unreferenced.

Database tables belonging to the old product stay untouched (no destructive migrations); only application code is removed.

## 2. Replace placeholders with real data

- Admin dashboard: contest, winner, and payout counters currently hardcoded to `0` get live queries.
- Business/influencer dashboard: admin stat cards wired to real counts.
- Remove every "what's coming next" milestone notice and the `MilestoneNotice` component.
- Won / Completed / Saved contest pages: real empty states instead of roadmap text.
- Audit remaining "coming soon", TODO, and demo strings and either wire them up or replace with a clear disabled-state message.

## 3. Workflow completeness pass (role by role)

Walk each role's journey end-to-end and fix broken links, missing actions, and dead ends:

- Business: registration → profile → dashboard → campaign request (draft/submit/edit/resubmit) → contest tracking → results → payout progress → notifications → settings.
- Influencer: registration → profile completion → discovery → saved → contest detail → apply → active contest → submission → completed/won → rewards → analytics/achievements.
- Admin: dashboard → campaign review → contest creation → lifecycle → applications → participant selection → live management → winner selection → payouts → analytics/reports/moderation/settings/templates/taxonomies.

Fix navigation highlighting, back-navigation behaviour, and any route that renders nothing meaningful.

## 4. Consistency pass

- Data: campaign title, business name, influencer name, reward amount, participant/submission counts, statuses, approval and payout references must read identically across request, contest, application, winner, payout, analytics and report surfaces. Normalize through shared mappers where they diverge.
- UI: reuse the existing page header, card, table, badge, dialog, empty-state and loading patterns everywhere. Same status colors for the same status. No redesign.

## 5. Lifecycle and permission enforcement

- Re-verify each state machine (campaign request, contest, application, participant, submission, winner, payout) rejects illegal transitions server-side, not just in the UI.
- Verify each server function checks: authenticated, correct role, ownership, not suspended, valid lifecycle state. Add the missing guards.
- Confirm business users cannot review/select/judge/edit payouts; influencers cannot reach admin or business-only data or other people's payout details.

## 6. Security pass

- Ownership checks on every read of another user's record.
- Storage: signed URLs only, server-side path ownership validation on every upload reference.
- Remove client-side-only trust (hidden buttons that aren't backed by a server check).
- Confirm audit log entries exist for all admin decisions and high-value user actions.
- Run the security scanner and fix in-scope findings.

## 7. Performance pass

- Deduplicate identical queries fired by sibling components; share query keys.
- Correct invalidation after mutations (list + detail).
- Add pagination or limits where lists can grow unbounded (applications, submissions, notifications, audit-backed feeds).
- Memoize expensive derived tables/charts only where it measurably helps.

## 8. Error handling and accessibility

- Every mutation surfaces validation, permission, network and stale-resource errors through the shared toast handling; guard against double submission.
- Keyboard navigation, dialog focus, table headers, aria-labels on icon-only buttons, accessible names on all actions. No visual changes.

## 9. Cleanup and verification

- Remove unused imports, dead code, duplicate helpers/components, commented-out blocks.
- Update `/docs`: architecture, routes, permissions, database, lifecycles, server-function index, and the Production Readiness Report to match the code after cleanup.
- Run typecheck, lint (only issues in touched code), and a production build; verify all route imports and query hooks resolve.

## Deliverable

A Phase 1 Completion Report listing: issues found and fixed, remaining known limitations, security checks completed, performance improvements, and documentation updated.

## Technical notes

- Route deletions are file removals under `src/routes/`; `routeTree.gen.ts` regenerates automatically.
- No schema migrations planned. If a missing index or grant is discovered during the audit, it will be raised as a separate migration for approval.
- Work proceeds feature-by-feature with a build/typecheck gate after each area rather than one large sweep at the end.
