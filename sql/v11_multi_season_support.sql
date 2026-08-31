-- =====================================================
-- V11: Multi-season Support
-- 실행일: 2026-08-31
-- 설명: 2026-27 시즌 전환을 위해 핵심 데이터 테이블에 season 컬럼 추가
-- =====================================================

-- 1. alih_schedule 테이블
ALTER TABLE public.alih_schedule
  ADD COLUMN IF NOT EXISTS season TEXT NOT NULL DEFAULT '2025-26';

CREATE INDEX IF NOT EXISTS idx_alih_schedule_season
  ON public.alih_schedule(season);

-- 2. alih_standings 테이블
ALTER TABLE public.alih_standings
  ADD COLUMN IF NOT EXISTS season TEXT NOT NULL DEFAULT '2025-26';

CREATE INDEX IF NOT EXISTS idx_alih_standings_season
  ON public.alih_standings(season);

-- 3. alih_players 테이블
ALTER TABLE public.alih_players
  ADD COLUMN IF NOT EXISTS season TEXT NOT NULL DEFAULT '2025-26';

CREATE INDEX IF NOT EXISTS idx_alih_players_season
  ON public.alih_players(season);

-- Default 제약 조건 제거 (이후 데이터 삽입 시 명시적으로 season 값을 넣도록 강제)
ALTER TABLE public.alih_schedule ALTER COLUMN season DROP DEFAULT;
ALTER TABLE public.alih_standings ALTER COLUMN season DROP DEFAULT;
ALTER TABLE public.alih_players ALTER COLUMN season DROP DEFAULT;

-- 4. alih_standings unique constraint: team_id → (team_id, season) 복합 유니크로 변경
--    기존 unique_standings_team 제약은 단일 시즌 기준이므로 다중 시즌 지원을 위해 교체
ALTER TABLE public.alih_standings
  DROP CONSTRAINT IF EXISTS unique_standings_team;

ALTER TABLE public.alih_standings
  ADD CONSTRAINT unique_standings_team_season UNIQUE (team_id, season);
