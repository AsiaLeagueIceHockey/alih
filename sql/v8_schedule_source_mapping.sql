-- =====================================================
-- V8: Schedule Source Mapping For Regular/Playoff Sync
-- Description:
--   Add official ALH source identifiers so internal game_no can stay
--   continuous while regular season (47) and playoff (48) source game
--   numbers are mapped safely.
-- Date: 2026-03-20
-- =====================================================

ALTER TABLE alih_schedule
  ADD COLUMN IF NOT EXISTS source_popup_id INTEGER,
  ADD COLUMN IF NOT EXISTS source_game_no INTEGER,
  ADD COLUMN IF NOT EXISTS season_phase TEXT;

ALTER TABLE alih_schedule
  DROP CONSTRAINT IF EXISTS alih_schedule_season_phase_check;

ALTER TABLE alih_schedule
  ADD CONSTRAINT alih_schedule_season_phase_check
  CHECK (season_phase IS NULL OR season_phase IN ('regular', 'playoff'));

-- 2025-26 season backfill:
-- Regular season used popup/47 with game numbers 1-120.
-- Playoff schedule was inserted with internal game_no 121+, but official
-- playoff source numbers restart from 1 on popup/48.
UPDATE alih_schedule
SET
  source_popup_id = COALESCE(
    source_popup_id,
    CASE
      WHEN game_no <= 120 THEN 47
      ELSE 48
    END
  ),
  source_game_no = COALESCE(
    source_game_no,
    CASE
      WHEN game_no <= 120 THEN game_no
      ELSE game_no - 120
    END
  ),
  season_phase = COALESCE(
    season_phase,
    CASE
      WHEN game_no <= 120 THEN 'regular'
      ELSE 'playoff'
    END
  )
WHERE
  source_popup_id IS NULL
  OR source_game_no IS NULL
  OR season_phase IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_alih_schedule_source_popup_game_no
  ON alih_schedule (source_popup_id, source_game_no)
  WHERE source_popup_id IS NOT NULL AND source_game_no IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_alih_schedule_season_phase
  ON alih_schedule (season_phase, match_at);
