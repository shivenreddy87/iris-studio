# New landing hero + next-step suggestions

## Part A — Rebuild the landing hero to spec

Replace the current `/` hero (in `src/routes/index.tsx`) with a full-screen dark hero matching the exact specs you provided. Keep the rest of the landing (trust bar, discovery preview, split section, footer) as-is for now — the request is scoped to the hero.

### Files touched
- `src/styles.css` — add dark tokens, fonts, `.liquid-glass` utility, marquee keyframes.
- `src/routes/__root.tsx` — add General Sans `<link>` (Fontshare); Geist Sans via `@fontsource/geist-sans` package.
- `src/routes/index.tsx` — new hero section (navbar + headline + subtitle + CTA + marquee) with background video loop.
- `src/components/hero/BackgroundVideo.tsx` — client-only component with the JS-controlled fade loop (rAF, 0.5s in / 0.5s out, reset + 100ms delay before replay).
- `src/components/hero/LogoMarquee.tsx` — duplicated logo strip with `translateX(0 → -50%)` 20s linear infinite.
- `src/components/ui/button.tsx` — add `heroSecondary` variant (rounded-full, subtle glass border, foreground text).
- `src/assets/logo.png` — placeholder logo (generate small mark, height 32px use).

### Design tokens (added to `src/styles.css`)
- `--background: 260 87% 3%` (HSL), `--foreground: 40 6% 95%`, `--hero-sub: 40 6% 82%` mapped via `@theme inline` so `bg-background`, `text-foreground`, `text-hero-sub` work.
- `--font-sans: "Geist Sans"`, `--font-display: "General Sans"`.
- `.liquid-glass` utility written exactly as specified (with `::before` gradient border via mask-composite).

### Structure
```
<section class="min-h-screen flex flex-col relative overflow-hidden bg-background">
  <BackgroundVideo />                  {/* absolute inset-0, z-0 */}
  <div class="blur-shape" />           {/* 984x527, gray-950, blur-82, centered */}
  <div class="relative z-10 flex flex-col flex-1">
    <Navbar />                          {/* py-5 px-8 + gradient divider */}
    <div class="flex-1 flex items-center justify-center overflow-visible">
      <Headline + Subtitle + CTA />
    </div>
    <LogoMarquee class="pb-10" />
  </div>
</section>
```

### Fonts
- Geist Sans → `bun add @fontsource/geist-sans` and `@import "@fontsource/geist-sans";` at top of `src/styles.css`.
- General Sans → `<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap">` in `__root.tsx` head (never `@import` a URL in CSS on this stack).

### Video loop (rAF)
Client component: `useEffect` starts an rAF loop that reads `video.currentTime` / `video.duration` and sets `video.style.opacity` — ramp up over first 0.5s, ramp down over last 0.5s. On `ended`: opacity → 0, `setTimeout(100)`, `currentTime = 0`, `play()`. Muted + playsInline + autoplay (required for autoplay policies).

### Notes / trade-offs
- Landing page currently uses the light "canvas" theme. Applying the dark tokens globally would flip the whole app. I'll scope the dark palette to the landing hero section only (local CSS vars on the section) so the authenticated app stays on its current light theme. Confirm if you'd rather flip the whole site dark.
- Logo image doesn't exist yet — I'll generate a simple wordmark PNG.

## Part B — Suggestions for next work (not built yet, pick what you want)

### Frontend
1. **Onboarding**: brand empty-state CTAs on `/app`; creator media-kit completeness meter with checklist.
2. **Loading skeletons** on Discover, Campaigns, Analytics (blank flashes today).
3. **Per-route error boundaries** with retry — root has one, leaves don't.
4. **404 page** with a link back to `/app`.
5. **Toasts** on campaign create, deal accept, list add (some paths silent).
6. **Command palette** (⌘K) for quick nav + creator search.
7. **Dark mode toggle** for the authenticated app.

### Backend
1. **Seed migration** with 8–12 realistic creator profiles + 2 example lists so new signups see a populated Discover/Lists.
2. **Storage bucket** for avatars & media-kit portfolio images (RLS: owner-write, public-read).
3. **Transactional email** (verification, deal invites, password reset) via an email connector.
4. **Iris tools**: give the AI real function-calling (search creators, draft brief, propose deal terms) instead of just chat.
5. **Stripe payouts** for creators (deal → escrow → release).
6. **Analytics rollups**: nightly aggregation job (pg_cron → `/api/public/rollup`) so `/app/analytics` doesn't scan raw rows.
7. **Webhook receivers** under `/api/public/*` for Instagram/TikTok metrics ingestion.

Approve and I'll build Part A. Tell me which items from Part B to queue next.