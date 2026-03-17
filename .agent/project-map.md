# ALIH Project Map

Last updated: 2026-03-17

## Snapshot

- Product: Asia League Ice Hockey fan site for the 2025-26 season
- Stack: Vite, React 18, TypeScript, Tailwind, shadcn/ui, TanStack Query, Supabase, i18next
- Host assumptions: frontend on Vercel, backend/data on Supabase, mobile-first PWA
- Primary runtime entry: `src/main.tsx` -> `src/App.tsx`

## Local start

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Env vars from `.env`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_VAPID_PUBLIC_KEY`
  - `VITE_ADMIN_PIN`

## App shell

- `src/App.tsx`
  - creates global `QueryClient`
  - persists React Query cache to `localStorage` key `alih-cache`
  - wraps app with `HelmetProvider`, `PersistQueryClientProvider`, `AuthProvider`, `TooltipProvider`
  - lazy-loads all route pages
  - hides `BottomNav` and install prompt on `/instagram/*` and `/admin/*`
- `src/context/AuthContext.tsx`
  - Supabase auth session bootstrap
  - auto-fetches or creates `profiles` rows
  - switches i18n language from profile preference
- `src/lib/supabase-external.ts`
  - main shared Supabase client for app code

## Route map

- `/` -> `src/pages/Home.tsx`
- `/schedule` -> `src/pages/Schedule.tsx`
- `/schedule/:gameNo` -> `src/pages/GameDetail.tsx`
- `/standings` -> `src/pages/Standings.tsx`
- `/players` -> `src/pages/Players.tsx`
- `/player/:playerSlug` -> `src/pages/PlayerDetail.tsx`
- `/player/:playerSlug/card` -> `src/components/player/PlayerCardWrapper.tsx`
- `/my-cards` -> `src/components/player/MyCards.tsx`
- `/team/:teamId` -> `src/pages/TeamDetail.tsx`
- `/roster/:teamId` -> `src/pages/TeamRoster.tsx`
- `/highlights` -> `src/pages/Highlights.tsx`
- `/news` -> `src/pages/News.tsx`
- `/instagram/*` -> image/share layouts for score, preview, goals, weekly stats, standings
- `/admin/test-push` and `/admin/comments` -> admin utilities

## Main feature ownership

### Schedule and game flow

- Shared schedule cache: `src/hooks/useSchedules.ts`
- Home page uses schedule cache plus standings/news summaries: `src/pages/Home.tsx`
- Schedule page filters by month/team: `src/pages/Schedule.tsx`
- Game detail owns:
  - finished game detail from `alih_game_details`
  - live/future head-to-head data
  - cheers, predictions, comments
  - Trip.com affiliate banner
  - playoff badge/styling
- Supporting files:
  - `src/components/game/CheerBattle.tsx`
  - `src/components/game/MatchPrediction.tsx`
  - `src/components/game/FlightAffiliateBanner.tsx`
  - `src/lib/game-utils.ts`
  - `src/hooks/useCheers.ts`
  - `src/hooks/usePrediction.ts`

### Teams

- Team summary page: `src/pages/TeamDetail.tsx`
- Roster page: `src/pages/TeamRoster.tsx`
- Team-specific subcomponents live under `src/components/team/`
- Team data hook: `src/hooks/useTeams.tsx`

### Players and cards

- Player directory: `src/pages/Players.tsx`
- Player profile: `src/pages/PlayerDetail.tsx`
- Card generation flow:
  - overlay UI: `src/components/player/CardGenerationOverlay.tsx`
  - card rendering: `src/components/player/PlayerCard.tsx`
  - full-screen detail modal: `src/components/player/CardDetailModal.tsx`
  - owned cards page: `src/components/player/MyCards.tsx`
  - share action: `src/components/player/InstagramShareButton.tsx`
- DB support:
  - `player_cards` table
  - `generate_player_card` RPC
  - player `slug`, profile columns, `team_color`

### Social and engagement

- Comments hook: `src/hooks/useComments.ts`
- Comment UI: `src/components/comments/*`
- Push notifications hook: `src/hooks/use-notifications.ts`
- Onboarding and settings live in `src/components/auth/*`

### Content

- News: `src/pages/News.tsx` from `alih_news`
- Highlights: `src/pages/Highlights.tsx`
- Standings: `src/pages/Standings.tsx` from `alih_standings` and `alih_players`

## i18n

- Init: `src/i18n/index.ts`
- Supported langs: `ko`, `ja`, `en`
- Query param override supported: `?lang=ko|ja|en` and `jp` normalizes to `ja`
- Translation files:
  - `src/i18n/locales/ko.json`
  - `src/i18n/locales/ja.json`
  - `src/i18n/locales/en.json`
- Existing project convention: do not add hardcoded UI strings

## PWA and notifications

- SW register: `src/registerSW.ts`
- SW implementation: `public/sw.js`
- Manifest: `public/manifest.json`
- Push flow:
  - subscription stored in `notification_tokens`
  - frontend hook: `src/hooks/use-notifications.ts`
  - edge functions send notifications for live games and new comments

## Supabase data model used by frontend

Core product tables already assumed to exist:

- `alih_schedule`
- `alih_game_details`
- `alih_teams`
- `alih_players`
- `alih_standings`
- `alih_news`

App-owned tables and RPCs added by local SQL files:

- `profiles`
- `notification_tokens`
- `alih_cheers`
- `alih_comments`
- `player_cards`
- `alih_predictions`
- RPC `increment_cheers`
- RPC `generate_player_card`

## SQL files

- `sql/v1_base_schema.sql`
  - `profiles`, `notification_tokens`, `alih_cheers`
  - trigger `handle_new_user`
  - RPC `increment_cheers`
- `sql/v2_comments.sql`
  - `alih_comments`
- `sql/v3_fix_rls_policies.sql`
  - comment/profile RLS adjustments
- `sql/v4_player_profile.sql`
  - extended player profile columns
  - `player_cards`
- `sql/v5_player_slug.sql`
  - player URL slug support
- `sql/v5_card_generation_rpc.sql`
  - `generate_player_card`
- `sql/v6_team_colors.sql`
  - `alih_teams.team_color`
- `sql/v6_predictions.sql`
  - `alih_predictions`
- `sql/v7_playoff_schedule.sql`
  - inserts playoff schedule rows

Important note:
- `sql/README.md` still says some migrations are "execution needed". Repo features indicate these files are intended and likely already used in production, but the doc itself is stale. Verify actual DB state before schema work.

## Supabase edge functions

- `supabase/functions/live-game/index.ts`
  - polls upcoming/live games
  - sends reminders, start, goal, and final push notifications
- `supabase/functions/send-comment-notification/index.ts`
  - notifies prior commenters on a game/team/player thread
- `supabase/functions/admin-delete-comment/index.ts`
  - admin soft-delete by PIN
- `supabase/functions/team-youtube/index.ts`
  - batch refresh of `recent_videos` on teams
- `supabase/functions/generate-sitemap/index.ts`
  - builds XML sitemap for static, game, team, and player pages
- `supabase/functions/send-test-push/index.ts`
- `supabase/functions/admin-list-notification-users/index.ts`

## Data ingestion and maintenance scripts

- `scripts/scrape_ep_fast.cjs`
  - scrapes EliteProspects roster and career data with `fetch` + `cheerio`
- `scripts/scrape_ep_players.js`
  - older Puppeteer scraper
- `scripts/update_players_db.cjs`
  - matches scraped player data back into Supabase and fills profile fields
- data outputs:
  - `data/scraped_ep_players.json`
  - `data/unmatched_players.json`

## Working conventions observed in repo

- Shared data should use the central Supabase client in `src/lib/supabase-external.ts`
- Shared schedule data should prefer `useSchedules()` to keep cache consistent
- Most pages add `SEO` with schema.org structured data
- Mobile safe-area padding matters across top and bottom chrome
- shadcn/ui components are preferred over raw interactive elements

## Watchouts and inconsistencies

- Several files still create Supabase clients with hardcoded URL/anon key instead of reusing `src/lib/supabase-external.ts`:
  - `src/pages/GameDetail.tsx`
  - `src/hooks/useCheers.ts`
  - `src/pages/InstagramScore.tsx`
  - `src/pages/InstagramPreview.tsx`
  - `src/pages/InstagramGoals.tsx`
  - `src/pages/InstagramWeeklyStats.tsx`
  - `src/pages/InstagramStandings.tsx`
- `GameDetail` mixes shared schedule cache with its own direct Supabase client. If touched, keep cache and client behavior aligned.
- `send-comment-notification` builds player URLs as `/player/${entityId}`, while the main app prefers slug routes when available. That can work because numeric IDs are still supported, but it is a legacy path.
- `useCheers` initializes local counts with `+100` bias but realtime updates later set raw server values. If cheer behavior is modified, re-check that UX math carefully.
- `sql/README.md` status is not reliable enough to trust for migration truth.
- Repo contains generated/debug artifacts at root (`ep_*.png`, `temp_*.html`, `dist/`). Do not assume they are source-of-truth.

## Fast-start checklist for future tasks

1. Read `AGENTS.md` for latest human/agent history.
2. Read this file for file ownership and caveats.
3. Check whether the task touches:
   - frontend route/page
   - shared hook/cache
   - SQL schema/RLS
   - edge function
   - i18n strings
4. Before schema or auth work, verify actual Supabase state, not only SQL docs.
5. If editing a feature page, inspect its paired hook and any related edge function or SQL file first.
