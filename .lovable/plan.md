# Manual Payout Management

Record and track every winner reward payment end to end, while the money itself moves outside the platform (bank transfer, UPI, PayPal). No gateway integrations, no redesign — existing cards, tables, badges, dialogs, timelines and notifications are reused.

## What each role gets

### Admin — Manual Payouts workspace
The existing placeholder page at Manual Payouts becomes a real dashboard with sections for Pending, Processing, Paid, Failed and Cancelled. Each payout card shows contest, business, influencer, rank, reward amount, status and created date.

Actions per payout: view the winner's submitted payment details, request details from the winner, mark processing, record payment reference and method, mark paid, mark failed with a reason, retry a failed payout, cancel before payment, and add internal notes. Bulk actions cover "request details" and "mark processing" only — marking paid is always one at a time.

### Influencer — My Rewards
New page listing every won contest with rank, reward, payout status, requested date, paid date, reference number once paid, and a timeline of what happened. When details are needed, an inline form collects: full name, phone, email, country, bank holder name, bank name, account number, IFSC/SWIFT, optional UPI ID, optional PayPal email, optional government ID upload, optional tax ID, and a declaration checkbox. Once submitted the fields become read-only; the admin verifies them offline.

### Business — Payout Progress
The contest results view gains a progress block: total winners, pending, processing, paid, failed. Businesses never see bank or contact details — counts only.

## Lifecycle

```text
Winner finalized -> pending -> details_requested -> waiting_for_details
                 -> processing -> paid
                              -> failed -> (retry) processing
                 -> cancelled (only before payment)
```

Transitions are enforced on the server. Paid payouts are immutable: no edits, no cancel, no retry. Processing can only start once the winner's details have been submitted and verified.

## Technical plan

### Database (single migration, applied first)
- Enum `payout_status`: pending, details_requested, waiting_for_details, processing, paid, failed, cancelled.
- `manual_payouts`: contest_id, winner_id (unique — one payout per winner), business_id, influencer_id, amount, status, payment_method, payment_reference, internal_notes, failure_reason, requested_at, processing_at, paid_at, cancelled_at, timestamps.
- `winner_payout_details`: winner_id (unique), influencer_id, full_name, phone, email, country, bank_holder_name, bank_name, account_number, ifsc, swift, upi_id, paypal_email, government_id_url, tax_id, declaration_accepted, submitted_at, verified_at, verified_by.
- `manual_payout_events`: payout_id, actor_id, event_type, note, created_at. Event types: details_requested, details_submitted, details_verified, processing_started, payment_completed, payment_failed, payment_cancelled, retry_requested.
- GRANTs plus RLS on all three: influencers read only their own payout rows and own payout details and may insert their own details once; admins (via `private.has_role`) manage everything; businesses get no direct row access — their aggregate progress is served through a server function. Internal notes and failure reasons are never returned to influencers or businesses.
- New private storage bucket `payout-documents` with owner-scoped policies for the optional government ID.
- Update trigger on the two mutable tables.

### Feature module `src/features/manual-payouts/`
`types.ts`, `payout.schema.ts` (Zod), `payout.server.ts`, `payout.functions.ts`, `components/`, `hooks/use-payouts.ts` — mirroring the winner-selection module.

Server functions: createPayoutsForContest, requestWinnerDetails, submitWinnerDetails, verifyWinnerDetails, startProcessing, markPaid, markFailed, retryFailedPayment, cancelPayout, listContestPayouts, listAdminPayouts, listMyRewards, listPayoutEvents, getBusinessPayoutSummary. Bulk variants for request-details and start-processing.

Server validation: contest must be completed, a finalized winner row must exist, duplicate payouts blocked by unique constraint, paid rows rejected for every mutation, processing requires verified details, cancel rejected once paid. Every transition writes a `manual_payout_events` row.

Payout rows are created automatically when winners are finalized (hooked into the existing finalize step) and backfilled on demand by createPayoutsForContest for contests completed earlier.

### Components
ManualPayoutCard, PayoutStatusBadge, PayoutTimeline, WinnerDetailsForm, RewardCard, RewardSummary, BusinessPayoutSummary, PayoutReferenceCard, PaymentHistory, BulkPayoutToolbar — built on the existing PageHeader, DataSection, EmptyState, StatusBadge, Panel, dialog and form patterns.

### Routes
- `app.admin.payouts.tsx` — rebuilt as the full dashboard (replaces the current placeholder that reads the stub `src/features/payouts` module; that stub is removed).
- `app.rewards.tsx` — new influencer My Rewards page, behind ProfileGate, added to the influencer sidebar.
- `app.business.contests.$contestId.tsx` — payout progress section.
- `app.contests.won.tsx` — reward status indicator per win.
- `app.results.$contestId.tsx` — reward and payout status on the influencer result page. Note: the spec names `app.entries.$applicationId.results.tsx`; this project's equivalent result page is the contest-keyed route above, so it is updated instead of adding a duplicate.

### Notifications
Reuse the existing notification helper. Influencer: details requested, details received, payment processing, payment completed, payment failed. Business: contest payouts completed. Admin: winner details submitted, payment failed.

### Verification
Migration -> regenerated types -> module -> admin dashboard -> influencer rewards -> business summary -> typecheck -> preview walkthrough of details submission, processing, completion, failed retry, cancel, business progress and paid-immutability.

## Out of scope
No Stripe, Razorpay, PayPal API, UPI or bank integrations. No automatic transfers. Recording and audit only.
