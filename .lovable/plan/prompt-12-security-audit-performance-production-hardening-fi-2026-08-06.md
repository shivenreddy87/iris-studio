# Prompt 12 — Security, Audit, Performance & Production Hardening (Final Phase 1)

No new business workflows, no redesign. This milestone closes the remaining suspension-guard gap from the Analytics milestone, hardens security and auditing, improves performance, and produces the final Phase 1 production-ready platform.

This is the final engineering pass before Phase 2.

Because this touches almost every module, complete it in six sequential stages. After each stage run a full typecheck so the application always remains functional.

---

# Stage 1 — Complete Suspension Enforcement (Remaining Gap)

The Analytics milestone introduced suspension support and `assertNotSuspended` inside:

```
src/features/platform-admin/admin.server.ts

```

but it is **not yet enforced** everywhere.

Reuse this helper (do not duplicate logic) and enforce suspension in every write operation across the application.

Protect:

- Campaign Requests
  - create draft
  - edit
  - submit
  - resubmit
- Campaign Review
- Contest Creation
- Contest Lifecycle
- Saved Contests
- Contest Applications
- Withdraw Applications
- Participant Selection
- Contest Activation
- Contest Submissions
- Winner Selection
- Manual Payout Details
- Manual Payout Lifecycle
- Profile Updates
- Notification Preferences
- Connected Accounts
- Platform Administration
- Moderation

Suspended users:

- may continue reading their own data
- may browse history
- may open dashboards

but every write must fail with the same typed

```
ACCOUNT_SUSPENDED

```

error.

No duplicated checks.

Every server function reuses the same helper.

---

# Stage 2 — Authorization + Database Security Audit

Perform a complete security review.

Across every server-function module ensure every mutation verifies:

- authenticated user
- correct role
- ownership
- suspension
- lifecycle state
- referenced row still exists

Never trust client IDs.

Always reload records server-side.

---

Review every RLS policy.

Consolidate duplicates.

Remove obsolete policies.

Standardise every policy using the existing

```
has_role(...)

```

helper.

Review every table introduced in Phase 1.

---

Retire unused legacy modules that are no longer referenced by routes.

Do not remove anything still used by the application.

---

# Stage 3 — Audit Logging

Create

```
audit_logs

```

table.

Fields:

- actor
- actor_role
- entity_type
- entity_id
- action
- previous_values
- new_values
- ip_address (placeholder)
- user_agent (placeholder)
- created_at

Rules:

- insert only
- no update
- no delete

Admins read everything.

Users may read only their own audit history.

---

Create

```
recordAuditLog()

```

inside a shared server helper.

Use it from every admin mutation plus important user actions:

- campaign submission
- contest application
- submission upload
- payout detail submission
- winner finalization
- payout completion

Never duplicate audit insertion logic.

---

# Stage 4 — Performance Optimisation

Review every feature module.

Improve React Query:

- shared query key factories
- invalidate only required queries
- remove duplicate requests
- optimistic updates

especially:

- save contest
- notifications
- bookmarks

---

Improve server queries.

Remove N+1 lookups.

Batch related records.

Only select required columns.

---

Add missing indexes.

Especially:

- contests
- applications
- submissions
- notifications
- payouts
- campaign requests

---

Storage:

Replace every custom upload implementation with one shared helper.

Use it for:

- avatars
- campaign attachments
- payout documents

Common validation:

- type
- size
- signed URL expiry

---

Standardise server errors.

One shared typed error format.

Unexpected failures return safe messages.

Detailed information stays server-side.

Continue using Sonner.

---

Every async page must use the existing

```
DataSection

```

wrapper.

Every form:

- RHF
- shared Zod schema
- disable while invalid
- disable during submission
- prevent double-submit

---

# Stage 5 — Accessibility, Cleanup & Production Build

Improve accessibility.

Review:

- keyboard navigation
- focus management
- dialogs
- sheets
- icon button labels
- table captions
- table header scopes
- screen-reader labels

Use existing design tokens only.

No redesign.

---

Remove:

- dead components
- duplicate helpers
- unused hooks
- obsolete placeholder modules

---

Review:

- route splitting
- lazy loading
- heavy charts
- image loading
- bundle sizes

---

# Stage 6 — Documentation & Production Readiness

Add lightweight Vitest coverage for pure business logic only.

Test:

- eligibility
- scoring
- lifecycle transitions
- profile completion

No E2E framework.

---

Perform a complete manual walkthrough of every workflow.

Business

Influencer

Admin

Verify:

- permissions
- notifications
- lifecycle transitions
- suspension
- uploads
- dashboards
- reports
- payouts

---

Create

```
/docs

```

containing:

- Architecture Overview
- Module Map
- Database Relationship Diagram (Markdown)
- Route Map
- Permission Matrix
- Lifecycle Diagrams
- Server Function Index
- Storage Architecture
- Query Key Map

---

Generate a final

# Phase 1 Production Readiness Report

Include:

- completed features
- security review
- RLS review
- performance improvements
- audit implementation
- remaining technical debt
- recommended Phase 2 roadmap
- known limitations

---

## Technical Notes

Database migrations:

1. Policy cleanup + indexes
2. Audit logs

Guard, upload and audit helpers remain server-only.

Do not introduce middleware.

Existing handlers call the shared helpers directly.

No UI redesign.

No workflow redesign.

No contest behaviour changes.

Only hardening, optimisation, security and production readiness.

---

&nbsp;