-- Contract-only: apply after season-aware batch writers pass dry-run.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.alih_player_stats WHERE season IS NULL) THEN
    RAISE EXCEPTION 'Cannot contract player stats while season is NULL';
  END IF;
END $$;

ALTER TABLE public.alih_player_stats
  ALTER COLUMN season SET NOT NULL,
  DROP CONSTRAINT IF EXISTS unique_player_team;

ALTER TABLE public.alih_players
  DROP CONSTRAINT IF EXISTS unique_team_player;
