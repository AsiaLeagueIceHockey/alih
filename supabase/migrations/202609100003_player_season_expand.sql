-- Expand-only: prepare season-scoped player and ranking upserts.

ALTER TABLE public.alih_player_stats
  ADD COLUMN IF NOT EXISTS season TEXT;

UPDATE public.alih_player_stats
SET season = '2025-26'
WHERE season IS NULL;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.alih_player_stats) <> 62
     OR EXISTS (SELECT 1 FROM public.alih_player_stats WHERE season IS NULL) THEN
    RAISE EXCEPTION 'Expected 62 legacy player-stat rows with a backfilled season';
  END IF;
END $$;

ALTER TABLE public.alih_players
  ADD CONSTRAINT alih_players_season_team_name_key UNIQUE (season, team_id, name);

ALTER TABLE public.alih_player_stats
  ADD CONSTRAINT alih_player_stats_season_team_name_key UNIQUE (season, team_id, player_name);

-- Existing global unique keys remain until the batch contract migration.
