-- =====================================================
-- V13: Allow the same player slug in different seasons
--
-- V11 made player rows season-aware. A global slug constraint would still
-- prevent inserting the same player into a later season, so scope it to the
-- season instead. Existing 2025-26 rows and card references remain unchanged.
--
-- Do not run automatically. Apply through the Supabase SQL Editor only after
-- reviewing it against the production schema.
-- =====================================================

ALTER TABLE public.alih_players
  DROP CONSTRAINT IF EXISTS alih_players_slug_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_alih_players_season_slug
  ON public.alih_players (season, slug)
  WHERE slug IS NOT NULL;
