# Agent handoff entry point

Before changing season data, Supabase schema, Edge Functions, Web Push, cron jobs, or the sibling `alih-batch` pipeline, read `docs/2026-27-operations-audit.md` completely. It is the source of truth for the verified production snapshot, unapplied migrations, launch gates, credential setup, and rollback. Source files in this repository do not prove that a migration or function is deployed.

For the unfinished 2026-27 launch, follow `.omx/plans/2026-27-terra-execution-plan.md` phase by phase. It records the current dirty-worktree hazards, GPT-5.6 Terra handoff prompt, verification gates, production delivery sequence, first-game canary, and stop conditions.

# Agent Work Summary - Player Card Feature

## Completed Tasks
1.  **Database Implementation**: Created `alih_player_cards` table and `generate_player_card` RPC function for handling card issuance and ownership.
2.  **UI Implementation**:
    -   **Player Detail Page**: Added "Issue Card" and "View My Card" buttons.
    -   **Card Generation Overlay**: Created an interactive overlay for the card issuance process with animations and steps.
    -   **My Cards Page**: Implemented a wallet-style view for collecting playing cards.
    -   **Card Detail Modal**: Standardized the full-screen card view for consistency across the app.
3.  **Player Card Component**: Built a reusable `PlayerCard` component with front/back frames, holographic effects, and team-specific branding.
4.  **Internationalization (i18n)**: Applied English, Korean, and Japanese translations for all new features.
5.  **UX Refinements**:
    -   Implemented scroll-to-top on card selection.
    -   Simplified navigation (removed "Fold", added "X" and "Back").
    -   Fixed card flipping logic and animation glitches.
    -   Linked card generation completion directly to the full-screen card view.
18. **Optimization**:
    -   Resolved Supabase Cached Egress spike by removing `no-cache` on card generation and instructing 1-year cache headers for images.

# Agent Work Summary - Trip.com Affiliate Banner

## Completed Tasks
1.  **Component Creation**: Created `FlightAffiliateBanner` component to display Trip.com flight deals for away games.
    -   Displays simplified UI without "Powered by Trip.com" or external booking button based on user feedback.
2.  **Affiliate Mapping**: Created `src/constants/affiliate.ts` mapping team English names to Trip.com destination tracking URLs.
3.  **Localization Logic**:
    -   KR/EN Locale: Shows KR->JP flights when home team is Japanese.
    -   JA Locale: Shows JP->KR flights when home team is HL Anyang.
4.  **UI Integration**: Integrated the banner into `GameDetail.tsx` right below the main match card.
    -   **Visibility Fix**: Ensures banner is also shown for live and finished games (below the period summary score table).
5.  **PWA Compatibility**:
    -   Changed the external URL trigger from a standard `<a>` tag to an `onClick` event with `window.open(url, '_blank', 'noopener,noreferrer')` to prevent iOS PWA from opening a blank internal WebView.

# Agent Work Summary - Playoff Schedule & Visual Enhancements

## Completed Tasks
1.  **Schedule Implementation**: Created `sql/v7_playoff_schedule.sql` to insert playoff matches with standardized English venue names (`TOMAKOMAI`, `ANYANG`).
2.  **Playoff Logic**: Implemented `isPlayoffGame` utility in `src/lib/game-utils.ts` to identify games within the Mar 19 - Apr 5, 2026 window.
3.  **Premium UI Design**:
    -   Implemented a **Premium Silver Theme** using a slate/zinc/silver palette for playoff games.
    -   Added thematic glow effects and borders to match cards on Home and Schedule pages.
4.  **Component Enhancements**:
    -   **Home & Schedule**: Integrated "Playoff" badges and subtle metallic styling for playoff match cards.
    -   **Game Detail**: Updated the header with a silver gradient and positioned the "Playoff" badge below the match status for better hierarchy.
5.  **Internationalization (i18n)**: Added translations for "Playoff" in Korean ("플레이오프") and Japanese ("プレーオフ").

## Next Steps
-   **Instagram Integration**: Implement specific sharing functionality for Instagram Stories, including generating a dynamic asset (GIF/Video) of the card flipping.

# Agent Work Summary - Video Hub Feature

## Completed Tasks
1.  **Database Implementation**: Created `alih_videos` table via `sql/v9_videos.sql` with UUID, YouTube URL mapping, team tags, and RLS policies allowing anon read and admin write.
2.  **UI Updates**: 
    -   Integrated `Videos` tab into existing `/news` page to show paginated video grid with team filters.
    -   Resolved React Query cache expiration issue (`staleTime`) to ensure freshly added admin videos appear immediately on UI.
3.  **Video Detail Module**: Created `/videos/:videoId` showing a full-width YouTube embed, sharing tools (Web Share API fallback to clipboard), related team videos, and SEO metadata.
4.  **Admin Manager**: Built `/admin/videos` protected by `AdminLayout` for adding/deleting YouTube links inline, assigning teams, toggling publish state, and previewing thumbnails.
5.  **Multi-Language Support**: Added Korean, Japanese, and English strings across News & Videos contexts (`page.videos`, `tabNews`, `share`, etc).

# Agent Work Summary - Supabase Disk IO & Cron Optimization

## Completed Tasks
1.  **Root Cause Analysis (Disk IO & CPU 100% Depletion)**:
    -   Identified that the `live-game` `pg_cron` job (`jobid: 1`) was running every 1 minute (`* * * * *`), executing 1,440 times/day during the off-season when no matches occur.
    -   Every run invoked the edge function (`net.http_post`), inserting rows into `net.http_request_queue`, `net._http_response`, and `cron.job_run_details`.
    -   Daily log cleanup jobs (`cleanup_cron_logs` and `cleanup_http_logs`) ran `DELETE FROM ... WHERE created < now() - interval '3 days'`, generating ~1,440 dead tuples per table per day. This triggered continuous heavy `autovacuum` loops and table bloat, exhausting the daily 30-minute Disk IO burst budget (43 Mbps baseline limit) and pinning CPU at 100%.
2.  **Emergency Recovery & Table Cleanup**:
    -   Restarted the Supabase database instance to break existing locks and `statement timeout` (500/504 errors).
    -   Executed `TRUNCATE TABLE net._http_response;`, `TRUNCATE TABLE net.http_request_queue;`, and `TRUNCATE TABLE cron.job_run_details;` to instantly free up disk space without creating dead tuples.
    -   Verified database query latency dropped from `56,422ms (statement timeout)` down to `466ms (200 OK)` and confirmed full recovery of `https://alhockey.fans/`.
3.  **Cron Schedule Optimization**:
    -   Unscheduled the `live-game` cron job (`SELECT cron.unschedule(1);` / `SELECT cron.unschedule('live-game');`) for the off-season, reducing daily background jobs from `1,446 runs/day` to just `6 runs/day` (99.6% reduction).
    -   Updated `cleanup_cron_logs` and `cleanup_http_logs` retention period from 3 days down to 1 day (`interval '1 day'`) to minimize future cleanup load.
4.  **Documentation & Diagnostic Scripts**:
    -   Created `sql/v10_cron_schedule_management.sql` containing the optimization queries and commented instructions on how to re-schedule `live-game` (`* * * * *` via `net.http_post`) when the next season begins.
    -   Created `scripts/check_health.cjs` (`node scripts/check_health.cjs`) to quickly diagnose Supabase connectivity, latency, and status directly from the terminal.
