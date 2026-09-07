# Instagram Login & Automatic Follower Data

Add "Continue with Instagram" as both a sign-in option and an account-linking
option, and pull real profile data (username, profile picture, follower count,
media performance) straight from Instagram instead of manual entry and admin
verification.

## What you'll need to do once (I'll guide you)

Instagram doesn't offer a plug-in login the way Google does, so Creoinfo has to
talk to Instagram directly. That needs a free Meta developer app:

1. Create an app at developers.facebook.com and add the "Instagram" product.
2. Paste in the redirect address I'll give you after the code is in place.
3. Send me the App ID and App Secret through the secure form I'll open.

Until those exist, the button appears with a clear "coming soon" state and the
current manual/admin-verified flow keeps working, so nothing breaks.

Important limits to know: Instagram only returns follower counts and view/reach
numbers for Business or Creator accounts. Meta also reviews the app before the
login works for people outside your own test accounts — that review typically
takes a few days, and I'll list the exact permissions to request.

## What gets built

### 1. Connect Instagram (linking)
- The Social Accounts section gains a real "Connect Instagram" button that opens
  Instagram's own authorization screen in a popup.
- On return, Creoinfo stores the account: username, profile picture, account
  type, follower count, and marks it verified automatically — no admin step, no
  manual follower entry.
- Status shows connected date, follower count, last refresh time, and a
  "Refresh data" action. Disconnect revokes and clears the stored access.
- Personal accounts that can't share follower data fall back to today's manual
  path with a clear explanation.

### 2. Sign in with Instagram
- "Continue with Instagram" on both the sign-in and sign-up screens.
- First time: the Instagram account creates a Creoinfo account, lands on role
  selection, and the Instagram account is already linked and verified.
- Returning: signs straight in.
- If the Instagram account's email matches an existing Creoinfo account, it
  links to that account instead of creating a duplicate.

### 3. Real data feeding the product
- Follower counts from Instagram take priority in contest eligibility, so cases
  like the earlier "not eligible" mismatch disappear.
- Submitted Reels are matched against the creator's own Instagram media, and
  views, reach, likes and comments are fetched and marked as platform-verified
  rather than pending. Reward tiers and payouts then run on verified numbers.
- Metrics refresh when an admin opens the winner evaluation screen and on demand.

### 4. Safety
- Read-only throughout: no posting, following, liking or messaging on anyone's
  behalf. Only the read permissions needed for verification and metrics are
  requested, and the existing read-only contract is extended to cover the live
  integration.

## Technical notes

- OAuth handled in-app: server routes `src/routes/api/public/instagram/start.ts`
  and `callback.ts` implement Instagram Login (the current API; Basic Display is
  retired), with a signed state parameter, code exchange, and long-lived token
  exchange. `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` stored as secrets, read
  inside handlers only.
- `instagramProvider` in `src/features/social-verification/providers/instagram.ts`
  gains real `getAccountProfile`, `getContentMetrics` and token refresh, flipping
  `apiConfigured` to true when credentials are present; the provider interface
  and all downstream contest/reward/payout logic stay unchanged.
- Migration on `connected_accounts`: encrypted `access_token`, `token_expires_at`,
  `account_type`, `media_count`, `avatar_url`, plus a unique index on
  (platform, provider_user_id) so one Instagram account can't back two profiles.
  Tokens encrypted at rest with an auto-generated key; never returned to the
  browser and never selectable by non-admins.
- Sign-in path: callback verifies the Instagram identity server-side, then uses
  the admin auth API to find-or-create the user and issue a session, redirecting
  to `/auth/role` for new users. No client ever sees the app secret or token.
- Long-lived tokens (60 days) refreshed by a scheduled job; expired connections
  surface a "Reconnect Instagram" prompt instead of silently going stale.
- Verification pass: typecheck, existing tests, plus a browser walk of connect →
  eligibility → submit Reel → verified metrics using a test Instagram account.
