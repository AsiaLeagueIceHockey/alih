-- ARCHIVED DRAFT: do not apply. Expand/contract replacements are 202609100003 and 202609100009.
-- V16: Prevent player and ranking import jobs from overwriting prior seasons.

ALTER TABLE public.alih_player_stats
  ADD COLUMN IF NOT EXISTS season TEXT;

UPDATE public.alih_player_stats
SET season = '2025-26'
WHERE season IS NULL;

ALTER TABLE public.alih_player_stats
  ALTER COLUMN season SET NOT NULL;

ALTER TABLE public.alih_players
  DROP CONSTRAINT IF EXISTS unique_team_player;

ALTER TABLE public.alih_player_stats
  DROP CONSTRAINT IF EXISTS unique_player_team;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'alih_players_season_team_name_key'
      AND conrelid = 'public.alih_players'::regclass
  ) THEN
    ALTER TABLE public.alih_players
      ADD CONSTRAINT alih_players_season_team_name_key UNIQUE (season, team_id, name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'alih_player_stats_season_team_name_key'
      AND conrelid = 'public.alih_player_stats'::regclass
  ) THEN
    ALTER TABLE public.alih_player_stats
      ADD CONSTRAINT alih_player_stats_season_team_name_key UNIQUE (season, team_id, player_name);
  END IF;
END $$;
