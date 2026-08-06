# Admin Review Workflow

Adds the full review lifecycle for campaign requests: admins triage submitted briefs, approve, reject or send them back for changes, and businesses can revise and resubmit. No contest creation in this milestone. No visual redesign — everything reuses existing cards, badges, forms, timeline and dialog components.

## Status flow

```text
Draft ──submit──> Submitted ──start review──> Under Review
                                   │
                     ┌─────────────┼──────────────┐
                     v             v              v
                 Approved      Rejected    Changes Requested
                                                  │
                                          business edits + resubmits
                                                  │
                                                  v
                                              Submitted
```

Only these transitions are permitted, and they are enforced in the database writes (each update is conditional on the current status), not just in the UI.

## Database changes

Extend `campaign_requests`:
- new status value `changes_requested`
- `review_reason` — the reason shown to the business on rejection / changes requested
- `approval_reference` — display ID generated on approval, format `APR-000001` (sequence-backed, unique)
- `review_notes` stays, but becomes **admin-internal only** and is hidden from business-facing reads
- `reviewed_by`, `reviewed_at` already exist and get set on every decision

New `campaign_request_events` table recording each transition (`draft_created`, `submitted`, `under_review`, `changes_requested`, `resubmitted`, `approved`, `rejected`) with actor, note and timestamp. This is what powers the real timeline instead of inferring steps from a few date columns. Admins can read all events; a business can read events for its own requests (internal notes are not stored in this table's visible fields for businesses).

Access rules: admins can update any request's review fields; businesses can update their own request only while it is `draft` or `changes_requested`.

Notifications use the existing in-app `notifications` table (kind `system`) with a link to the request — approved, rejected, and changes-requested each notify the owning business. No email.

## Server functions

Added to the existing campaign-requests module, all admin-guarded via the role check:
- `startReview` — Submitted → Under Review
- `approveRequest` — Under Review → Approved, assigns `approval_reference`
- `rejectRequest` — Under Review → Rejected, requires a reason
- `requestChanges` — Under Review → Changes Requested, requires a reason
- `addInternalNote` — appends an admin-only note
- `listPendingRequests` — the review queue (Submitted + Under Review)
- `getAdminReviewSummary` — counts for Pending Review, Approved Today, Rejected Today, Changes Requested
- `listRequestEvents` — timeline entries

Business side:
- `resubmitCampaignRequest` — Changes Requested → Submitted after edits
- existing draft edit/submit functions extended to accept `changes_requested` as an editable state

Each function rejects an invalid source status with a clear message.

## Components (new, built from existing primitives)

- `ReviewNotesCard` — internal admin notes list plus an add-note field (admin only)
- `ApprovalActions` — Start Review / Approve / Reject / Request Changes buttons, only showing the actions valid for the current status; reject and request-changes open the existing dialog to capture a required reason
- `ReviewTimeline` — replaces the inferred timeline with real event history, same visual style as the current `RequestTimeline`
- `StatusHistory` — compact status transition list with actor and timestamp

## Screens

**Admin request detail** (`/app/admin/requests/:id`) — existing detail layout plus: approval actions bar, internal notes card, review timeline, a link to the submitting business profile, and attachment download.

**Admin requests list** — adds a "Pending review" section at the top from the review queue and shows the approval reference on approved requests.

**Admin dashboard** — four summary widgets (Pending Review, Approved Today, Rejected Today, Changes Requested) using the existing card/stat styling, each linking into the filtered request list.

**Business request detail** — shows the decision banner (approved with reference, rejected with reason, or changes requested with the reason), the real timeline, and an "Edit & resubmit" action when the status is Changes Requested. Internal admin notes are never shown here.

**Business request edit** — allows editing when status is `draft` or `changes_requested`; saving from a changes-requested state offers "Resubmit for review", which returns the status to Submitted and logs a `resubmitted` event.

**Business requests list** — a "Changes requested" section surfaces items needing action.

## Verification

Typecheck with `tsgo --noEmit`, then walk the flow in the preview: submit a request as a business, start review / request changes as admin, confirm the business sees the reason and can resubmit, then approve and confirm the reference and notification appear.
