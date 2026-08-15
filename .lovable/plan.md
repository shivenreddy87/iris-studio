# Creoinfo — Social Verification, Tiered Rewards & Rebrand

A single milestone covering the rebrand, mandatory Instagram linking, platform-aware
submissions, view-based reward tiers, and payouts driven by verified performance.
No visual redesign: every screen keeps its current layout, components and responsive
behaviour.

## 1. Rebrand to Creoinfo

- Replace all user-facing "Project Eros" / "Iris AI" strings across routes, page
  titles, head metadata, auth pages, shell navigation, empty/loading/error states,
  notifications and docs. Internal module names stay as they are.
- Landing page keeps its exact structure; copy is rewritten to say Creoinfo connects
  businesses with influencers through performance-based contests on Instagram, with
  YouTube next. Existing logo asset is reused.
- Remove links/pages that describe things the product does not do (Privacy, Terms,
  Pricing, AI assistant references) from the user-facing surface.

## 2. Social accounts (Instagram first, YouTube ready)

- Extend the existing `connected_accounts` table rather than creating a new one:
  add `is_primary`, `provider_user_id`, `connection_status`, plus a partial unique
  index enforcing one primary account per influencer per platform.
- Platform list becomes a shared constant: `instagram` (Phase 1), `youtube`
  (architecture-ready). TikTok is removed from primary-platform pickers.
- Social Accounts section in influencer profile/settings (reusing the existing
  panel) shows platform, handle, status, connected date, primary badge, and
  connect / set-primary / disconnect actions.
- No fake OAuth. Verification stays the current manual/code-based flow; a provider
  abstraction (`connectAccount`, `disconnectAccount`, `getAccountProfile`,
  `getContentMetrics`, `validateContentUrl`) wraps it so official APIs slot in later.

## 3. Server-enforced application rules

- New server helper `requirePrimarySocialAccount(influencerId, platform)` returning a
  typed error, called inside the application server path — never trusted from the client.
- Application validation continues to check platform match, follower range, location,
  category, application window, contest status, suspension and duplicates; the primary
  account check is added to the same chain and surfaced in the eligibility UI as a
  blocking reason with a link to connect the account.

## 4. Platform-aware content submission

- Submission form label and validation follow the contest's platform: "Instagram Reel
  URL" or "YouTube Video URL". URL is required, validated for shape and host, stored
  with the submission and read-only afterwards.
- Server re-validates host/platform match through the provider's `validateContentUrl`;
  an arbitrary URL on an Instagram contest is rejected.

## 5. Metrics architecture (no invented numbers)

- Extend `contest_submissions` with `reach`, `metrics_source` (manual /
  instagram_api / youtube_api), `metrics_status` (pending / verified), and
  `metrics_last_synced_at`. Existing views/likes/comments/shares/engagement stay.
- Until an official API is configured, metrics render as "Metrics pending platform
  verification" everywhere instead of zeros or placeholders.
- `src/features/social-verification/` gains `providers/instagram.ts`,
  `providers/youtube.ts`, and social-verification server/function modules alongside
  the existing verification code.

## 6. Tiered rewards

- New table `contest_reward_tiers` (contest, min views, nullable max views, amount,
  currency) with checks for non-negative values, min <= max, and no overlapping or
  duplicate ranges.
- New pure module `src/features/rewards/reward-calculation.ts` with
  `findRewardTier`, `calculateReward`, `validateRewardTiers` — no DB access, unit tested.
- Contest wizard gains a "Performance Reward Tiers" section under Rewards with
  add/edit/delete, live validation and a reward-structure preview. Publishing is
  blocked while the tier config is invalid.
- Contest detail replaces the single reward figure with "Performance Rewards":
  influencers see current views, current tier, next tier and views remaining;
  businesses see the full structure and distribution; admins see configuration plus
  calculated amounts.

## 7. Winner evaluation, payouts, business visibility

- Winner evaluation table shows content URL, platform, verified views, reach,
  engagement, performance score, calculated tier and amount. Admin metric edits
  recalculate tier/amount/ranking and write an audit event. Finalization freezes
  metrics and amounts.
- Payout amount is server-derived from the finalized tier amount instead of an equal
  pool split; paid payouts stay immutable.
- Business contest detail gains a "Contest Content & Performance" section listing each
  submission with a "View Content" action opening the public URL in a new tab, plus
  verification status and metrics when verified. Influencers appear only as a safe
  public display identifier — no email, phone, payout, bank or private profile data.

## 8. Notifications & analytics

- Reuse the existing notification engine (respecting preferences) for: account
  connected, application blocked for missing account, content submitted, metrics
  updated, tier reached, final reward confirmed, contest completed — routed to the
  relevant influencer, business and admin audiences.
- Analytics extended with verified-view totals, averages, tier distribution, rewards
  earned/liability and cost per verified view, all computed from verified metrics only.

## Technical notes

- Migrations: alter `connected_accounts`, alter `contest_submissions`, create
  `contest_reward_tiers` with GRANTs and RLS (influencer reads own, business reads
  tiers of its contests, admin full), then regenerate types.
- All new reads/writes go through `createServerFn` with the existing auth, role,
  ownership, suspension, lifecycle and audit-logging patterns.
- Verification pass at the end: typecheck, lint, unit tests for reward calculation and
  tier validation, plus a manual walk of the demo flow (connect Instagram → apply →
  select → live → submit Reel → business views content → admin verifies metrics →
  reward tier → payout).

## Known external dependency

Real Instagram/YouTube metrics require official API credentials and app review; until
those exist the system uses admin-verified manual metrics and labels them as such.
