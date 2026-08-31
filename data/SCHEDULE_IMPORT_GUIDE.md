# Season Schedule Import Guide

The 2026-27 regular-season schedule is already present in `sql/v12_insert_2026_27_schedule.sql` and has been applied to production. Do not rerun it: it contains a season-scoped replacement intended only for the initial import.

For a future season, scrape the official [Asia League schedule](https://asiaicehockey.com/schedule), review the generated SQL, and create a new versioned migration. Never point an import script directly at production.

`node scripts/scrape_schedule.cjs 2027-28` prints a reviewable JSON schedule and never writes to Supabase. `node scripts/generate_schedule_sql.cjs 2027-28 sql/v14_insert_2027_28_schedule.sql` creates a local SQL file only; use a new migration filename, never `v12`.

## Step 1: Prepare the Data
Scrape or manually extract the schedule from the official site into a JSON format.
The required structure for the `alih_schedule` table is as follows:

```json
[
  {
    "game_no": 1,
    "match_at": "2026-09-07T15:00:00+09:00",
    "match_place": "Anyang",
    "home_alih_team_id": 1,
    "away_alih_team_id": 2,
    "game_status": "Scheduled",
    "season": "2026-27",
    "season_phase": "regular"
  }
]
```

**Team IDs (verify against `alih_teams` before a new season):**
- 1: HL ANYANG
- 2: RED EAGLES HOKKAIDO
- 3: TOHOKU FREE BLADES
- 4: YOKOHAMA GRITS
- 5: H.C. TOCHIGI NIKKO ICEBUCKS
- 6: STARS KOBE

## Step 2: Insert into Database

Create and review a new SQL migration before applying it with the Supabase Dashboard SQL Editor. Keep the import append-only for completed historical seasons; do not use a script that deletes rows from production.

```sql
-- Example SQL insertion
INSERT INTO public.alih_schedule (game_no, match_at, match_place, home_alih_team_id, away_alih_team_id, game_status, season, season_phase)
VALUES
  (1, '2026-09-07 15:00:00+09', 'ANYANG', 1, 2, 'Scheduled', '2026-27', 'regular');
```

## Step 3: Standings and Players

- **Standings:** Initialize one zero-value row per participating team in `alih_standings` with the new `season` value. 2026-27 has six teams.
- **Players:** Insert a season-specific roster into `alih_players`, always including `season`. `scripts/update_players_db.cjs` enriches existing player profile data only; it does not scrape or insert a new season roster.
- **Slug constraint:** Apply `sql/v13_player_season_slug.sql` before inserting a returning player whose slug already exists in a prior season.
- **No fabricated data:** Until an official roster or statistic is available, leave the new-season rows absent rather than copying prior-season stats or personnel.

## Step 4: Validate Before Applying

1. Compare the generated game count, teams, dates, kickoff times, and venue mapping against all official monthly pages (September through April).
2. Confirm every inserted schedule, standing, player, and stat row carries the new `season` value.
3. Run the frontend build and select both the new and preceding seasons from the home-page selector.
