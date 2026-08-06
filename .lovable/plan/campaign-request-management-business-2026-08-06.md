# Campaign Request Management (Business)

Businesses can draft, submit, track and review campaign requests. Admins can browse and search them (no approval actions yet). No redesign — existing page header, cards, badges, forms and profile-gate patterns are reused.

## What changes for users

**Business**
- Campaign Requests page grouped into Drafts, Submitted, Approved, Rejected, each showing title, budget, views requested, duration, status badge, created date and actions.
- New Request form (multi-section): title, business category, campaign goal, description, target audience, location, platform, required views, budget, duration in days, preferred creator category, min/max followers, attachment upload. Two actions: Save Draft and Submit Request.
- Drafts can be edited and deleted. Once submitted, a request becomes read-only.
- Detail page shows every field, a status timeline, an attachment preview and a review-notes placeholder.

**Admin**
- Campaign Requests list shows every business request with search (title/business) and status filter, and opens the same read-only detail view. No approve/reject yet.

## Data

New table `campaign_requests` with the requested fields (id, business_id, title, campaign_goal, business_category, target_platform, target_audience, target_location, required_views, budget, duration_days, preferred_creator_category, minimum_followers, maximum_followers, campaign_description, attachment_url, status, submitted_at, reviewed_at, reviewed_by, created_at, updated_at), foreign keys to the user/business owner and reviewer, updated_at trigger, grants and RLS:
- Owner can read/insert/update their own; update and delete restricted to rows still in Draft.
- Admins can read all rows.

Statuses are a shared constant set: Draft, Submitted, Under Review, Approved, Rejected, Cancelled. The current placeholder type (`in_review`, `converted`) is replaced by this set everywhere it is referenced.

A private `campaign-attachments` storage bucket with owner-scoped policies backs the attachment upload; previews use signed URLs, matching the existing avatar upload approach.

## Technical notes

- Module: `src/features/campaign-requests/`
  - `types.ts` — status constants/labels, `CampaignRequest`, Zod schemas (draft-lenient, submit-strict) shared by form and server validation.
  - `requests.functions.ts` — typed `createServerFn` with `requireSupabaseAuth`: `createDraft`, `updateDraft`, `submitRequest`, `deleteDraft`, `listMyRequests`, `getRequestDetails`, `listAllRequests` (admin-only via `has_role`). Draft/submitted state transitions enforced server-side, not just in the UI.
  - `components/` — `CampaignRequestCard`, `CampaignRequestForm`, `CampaignStatusBadge`, `RequestTimeline`, `AttachmentPreview` (existing `campaign-request-list.tsx` is refactored to render the new card).
- Routes updated in place: `app.business.requests.index.tsx` (sectioned list), `app.business.requests.new.tsx` (form), new `app.business.requests.$requestId.edit.tsx` (draft edit), `app.business.requests.$requestId.tsx` (detail), `app.admin.requests.index.tsx` (search + filter), `app.admin.requests.$requestId.tsx` (read-only detail). All business routes stay wrapped in `ProfileGate`.
- Data fetching follows the existing TanStack Query + `useServerFn` pattern; mutations invalidate the request list keys. Forms use React Hook Form + Zod with inline errors and numeric/file validation.
- Verified with a typecheck at the end.
