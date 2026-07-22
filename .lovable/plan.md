# Implement Phases 1–9: Project Eros full backend + intelligence

Turn the mock-driven UI into a real, working platform. All 9 phases are large — I'll implement them in one coordinated pass, in dependency order, so each layer works before the next builds on it.

## Scope note
This is a very large build (dozens of tables, ~20 server functions, AI streaming, realtime, role split). I'll ship it end-to-end but expect the response to touch 40+ files. Some polish items (email notifications, file uploads, onboarding checklists from Phase 9) will be scaffolded but marked as follow-ups if they balloon the turn.

---

## Phase 1 — Data layer (foundation for everything)

**Migration 1 — Core schema** (single migration, all tables with GRANTs + RLS):
- `organizations` (id, name, owner_id, created_at) — brand workspaces
- `organization_members` (org_id, user_id, role)
- `creator_profiles` (user_id PK, handle, niche, location, followers, engagement_rate, avg_rate, tags[], bio, accent, socials jsonb)
- `campaigns` (org_id, name, brief, status enum, budget, currency, goal, starts_at, ends_at, reach, engagement_rate)
- `deals` (campaign_id, creator_user_id, stage enum, offer, counter, deliverables jsonb, contract_status, last_update)
- `deal_events` (deal_id, actor_id, kind, payload jsonb) — timeline audit log
- `conversations` (id, campaign_id, brand_user_id, creator_user_id, last_message_at)
- `messages` (conversation_id, sender_id, sender_role enum, body, created_at)
- `creator_lists` (id, owner_id, name, accent) + `creator_list_items` (list_id, creator_user_id)

RLS pattern: brand-owned rows scoped by `has_role(auth.uid(),'admin') OR org membership`; creator-owned rows scoped by `auth.uid() = creator_user_id`; deals/messages readable by both parties.

Enable Realtime on `messages` and `deals`.

**Server functions** in `src/lib/*.functions.ts` (all use `requireSupabaseAuth`):
- `campaigns.functions.ts`: `listCampaigns`, `getCampaign`, `createCampaign`, `updateCampaign`
- `creators.functions.ts`: `searchCreators`, `getCreator`, `upsertCreatorProfile`
- `deals.functions.ts`: `listDeals`, `getDeal`, `createDeal`, `updateDealStage`, `updateOffer`
- `messages.functions.ts`: `listConversations`, `getMessages`, `sendMessage`, `ensureConversation`
- `lists.functions.ts`: `listCreatorLists`, `createCreatorList`, `addToList`, `removeFromList`
- `org.functions.ts`: `ensureOrganization` (auto-create on first brand login)

Delete `src/lib/api/adapters.ts`; keep `mock-data.ts` only as a one-time seed helper.

## Phase 2 — Campaign Studio persists

`/app/campaigns/new` submits `createCampaign` → creates the row + one `deal` per selected creator with `stage='invited'` + one `conversation` per creator → navigates to `/app/campaigns/$id`. Add real "Edit brief" and status toggle on detail view.

## Phase 3 — Discovery + lists + creator profile

Discover route uses `searchCreators` with server-side ILIKE across name/handle/niche/tags/location. Filter chips wire to query params. Creator profile shows real metrics; "Invite to campaign" opens a campaign picker and creates a deal via `createDeal`. Lists page fully wired (create list, add/remove creators from discover + profile).

## Phase 4 — Realtime messaging

`/app/messages` uses `useSuspenseQuery(listConversations)` + per-conversation `getMessages`. `sendMessage` server function inserts a row. Browser client subscribes to `postgres_changes` on `messages` filtered by `conversation_id` and invalidates the messages query on new rows. Unread badge derived from `last_read_at` on `conversations`.

## Phase 5 — Iris becomes intelligent

New server route `src/routes/api/chat.ts` streaming via AI SDK + Lovable AI Gateway (`openai/gpt-5.5`). System prompt includes user role + current campaigns/creators summary.

`/app/iris` refactored to `useChat` + `DefaultChatTransport`. Rendered with react-markdown. Same chat surface embedded in the app-shell "Ask Iris" panel. Iris messages inside `/app/messages` (co-pilot) also stream via the same endpoint.

Tool calls (v1): `suggest_creators(brief)`, `draft_outreach(creator_id, campaign_id)` — return structured data the UI can render as action buttons.

## Phase 6 — Deal workspace lives

`/app/deals/$id` wires to `updateDealStage`, `updateOffer`, deliverables editor (JSONB), contract status toggle. Every mutation writes a `deal_events` row → renders the real timeline. Iris suggest card calls the AI endpoint with the deal context.

## Phase 7 — Role-based experiences

Split routes by role using nested pathless layouts under `_authenticated`:
- Brand routes stay as-is (campaigns, discover, lists, deals, analytics).
- New Creator routes: `/app/creator/opportunities` (invited deals feed), `/app/creator/inbox` (conversations), `/app/creator/media-kit` (edit `creator_profiles`), `/app/creator/earnings` (agreed+delivered deals sum).
- `beforeLoad` gate on each subtree checks `role` from context; wrong-role users redirect to their home.
- Sidebar renders a different nav array per role.
- Creator onboarding: first-time creator users prompted to fill handle/niche/rate/socials.

## Phase 8 — Analytics from real data

`/app/analytics` queries aggregated stats from `campaigns`, `deals`, `messages`. Replace bar `div`s with Recharts (line for reach/engagement over time, bar for top creators). Iris "story" card calls the AI endpoint with the aggregated JSON and streams a narrative.

## Phase 9 — Platform polish (scaffolded)

- **Storage**: `avatars` (public) and `campaign-assets` (private) buckets + upload UI on profile/campaign edit.
- **Notifications**: `notifications` table + realtime subscription + bell dropdown in app shell. Insert on new message / stage change / invitation.
- **Settings** route: profile edit, org name, sign-out.
- **Password reset**: `/auth/reset-password` route + Supabase `resetPasswordForEmail` from sign-in.
- **Onboarding checklist**: card on `/app` home showing completion of profile, first campaign, first deal.

Email notifications and payments are out of scope for this pass.

---

## Technical notes
- Every table follows the 4-step pattern: CREATE → GRANT (authenticated + service_role, no anon) → ENABLE RLS → CREATE POLICY.
- All server functions use `requireSupabaseAuth`; bearer attach already registered in `src/start.ts`.
- Loaders under `_authenticated/` may call protected server functions (managed gate handles SSR).
- No mock adapters remain after Phase 1.
- One-time seed migration inserts the existing mock creators as `creator_profiles` rows (with generated auth users skipped — creators appear when they sign up; seed only fills demo content).

## Verification (after build)
1. Sign up as Brand → auto-create org → create campaign in Studio → invitations exist → creator profile picker works.
2. Sign up as Creator → onboarding → see invitation in opportunities → open conversation → send message → brand sees it live.
3. Ask Iris "plan a Diwali campaign" → streaming response arrives.
4. Analytics page shows real numbers derived from your data (not the mocks).

---

## Files touched (approximate)
- 3 new migrations (schema, realtime enable, seed)
- ~7 new `.functions.ts` files
- 1 new server route (`api/chat.ts`)
- ~15 route files rewritten to use real data
- App shell + sidebar updated for role split
- New routes for creator workspace (~5 files)

Ready to build on approval.