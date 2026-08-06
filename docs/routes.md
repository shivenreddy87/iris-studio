# Route Map

## Public

| Route | Purpose |
| --- | --- |
| `/` | Landing page (hero video, marquee) |
| `/pricing`, `/terms`, `/privacy` | Marketing / legal |
| `/auth/sign-in`, `/auth/sign-up`, `/auth/reset-password` | Authentication |
| `/auth/role` | Business vs Influencer role selection |
| `/onboarding/business`, `/onboarding/influencer` | Profile setup |
| `/invite/$token` | Invitation acceptance |

## Authenticated shell (`/app`)

Shared: `/app` (dashboard), `/app/profile`, `/app/settings`,
`/app/settings/notifications`, `/app/notifications`, `/app/analytics`,
`/app/iris` (AI studio), `/app/messages`, `/app/connections`.

### Business

| Route | Purpose |
| --- | --- |
| `/app/business/requests` | Campaign requests list |
| `/app/business/requests/new` | Multi-section request form |
| `/app/business/requests/$requestId` | Request detail + review timeline |
| `/app/business/requests/$requestId/edit` | Edit draft / resubmit |
| `/app/business/contests` | Contests derived from approved requests |
| `/app/business/contests/$contestId` | Progress, submissions, payout progress |

### Influencer

| Route | Purpose |
| --- | --- |
| `/app/contests` | Available contests + eligibility |
| `/app/contests/$contestId` | Contest detail + apply panel |
| `/app/contests/saved` | Bookmarked contests |
| `/app/contests/active` | Contests they are participating in |
| `/app/contests/completed`, `/app/contests/won` | History and wins |
| `/app/entries` | Applications and submissions |
| `/app/results/$contestId` | Personal outcome |
| `/app/rewards` | My Rewards — payout details and status |

### Admin

| Route | Purpose |
| --- | --- |
| `/app/admin` | Operations dashboard |
| `/app/admin/requests`, `/app/admin/requests/$requestId` | Review workflow |
| `/app/admin/contests`, `/new`, `/$contestId`, `/$contestId/edit` | Contest engine |
| `/app/admin/entries` | Applications, selection, submissions |
| `/app/admin/winners` | Winner evaluation and finalisation |
| `/app/admin/payouts` | Manual payout dashboard |
| `/app/admin/businesses`, `/app/admin/influencers` | Directories + detail |
| `/app/admin/moderation` | Suspensions and moderation log |
| `/app/admin/settings`, `/app/admin/templates`, `/app/admin/reports` | Platform config |
| `/app/admin/analytics` | Growth and health analytics |
