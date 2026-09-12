# Instagram sign-in, connect, and admin-created contests

Finishes the Instagram work already started on the backend and lets admins start a contest themselves instead of waiting for a business request.

## 1. Instagram connect and sign-in

**What people will see**

- Sign-in and sign-up pages get a "Continue with Instagram" button next to Google. First time through, the Instagram account creates a Creoinfo account and lands on role selection; returning users go straight to their dashboard.
- Social accounts settings gets a real "Connect Instagram" button. After approving on Instagram, the account shows username, picture, follower count, account type, connected date and last refresh, plus "Refresh data" and "Disconnect".
- Instagram-linked accounts are verified automatically — no admin review, no typing a follower number by hand. Follower counts from Instagram feed contest eligibility.
- Personal Instagram accounts (which cannot share follower data) fall back to today's manual verification with a plain explanation.
- Until the Instagram app credentials exist, the buttons show a clear "Instagram connection isn't set up yet" state and nothing else breaks.

**Setup you need to do once**

Instagram requires a free Meta developer app. After the code is in place I'll give you the exact redirect address to paste there, then open a secure form for the App ID and App Secret. Meta also reviews the app before non-test accounts can log in.

## 2. Verified metrics on submissions

When an influencer submits a Reel and their Instagram is connected, the submission is matched against their own Instagram media and views/reach/likes/comments are pulled in and marked platform-verified instead of pending, so reward tiers run on real numbers. Unmatched links keep the current manual path.

## 3. Admin can create contests directly

- "New Contest" gains a second path: "Create from scratch". The admin picks the business, fills in the campaign details (title, brief, goal, category, platform, location, required views), and the system records an internal, auto-approved campaign request behind it so every contest still traces back to one — then opens the usual six-step contest wizard.
- The existing "from an approved request" list stays exactly as it is.
- The business sees the contest read-only in their own contest list, same as today, and is notified.

## Technical notes

- New server routes `src/routes/api/public/instagram/start.ts` and `callback.ts`: signed state (10 min) carrying mode (`link` | `login`) and optional user id, code exchange, long-lived token, profile fetch, then either `saveInstagramConnection` for a linked user or `resolveUserForInstagramLogin` + `createSessionLink` for sign-in. Existing `config.server.ts`, `crypto.server.ts`, `api.server.ts`, `link.server.ts` are used as-is.
- New page `src/routes/auth.instagram.tsx` consumes the one-time token via `supabase.auth.verifyOtp`, then routes to `/auth/role` for new users or `/app` for existing ones; surfaces errors passed back as a query param.
- New `src/features/social-verification/instagram/instagram.functions.ts`: `getInstagramStatus`, `startInstagramLink` (returns authorize URL), `refreshInstagramData`, `disconnectInstagram` — all `requireSupabaseAuth`, admin/token work loaded inside handlers.
- `social-accounts-panel.tsx` gains the connect/refresh/disconnect UI; the manual follower input stays only for non-OAuth connections.
- Submission verification: `submission.server.ts` calls `findMediaIdByPermalink` + `fetchMediaMetrics` with the stored token when the submitter has an Instagram connection, writing verified metrics; failures fall back silently to the current flow.
- Admin-created contests: migration adds `origin` (`business_request` | `admin`) to `campaign_requests`; new server fn `createAdminContest` validates the payload with Zod, inserts an approved internal request (admin as reviewer, approval reference generated as today) and the contest draft in one guarded path, logs the usual `contest_events` entry and notifies the business. `app.admin.contests.new.tsx` gets a tab/dialog for the scratch form reusing the campaign-request field components.
- Finish with typecheck, existing Vitest suite, and a browser pass over connect → eligibility → submit → verified metrics (with real credentials) and admin scratch-contest creation.
