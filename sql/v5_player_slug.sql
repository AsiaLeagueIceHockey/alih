-- =====================================================
-- V5: Player Slug for URL-friendly Names
-- 실행일: 2026-02-01
-- 설명: 
--   선수 URL을 ID 기반에서 이름 기반으로 변경
--   예: /player/123 → /player/sang-wook-kim
-- 의존성: 없음 (기존 alih_players 테이블에 컬럼 추가)
-- =====================================================

-- =====================
-- 1. slug 컬럼 추가
-- =====================
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS slug TEXT;

-- UNIQUE 제약조건 추가 (slug는 고유해야 함)
ALTER TABLE alih_players ADD CONSTRAINT alih_players_slug_unique UNIQUE (slug);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_players_slug ON alih_players(slug);

-- =====================
-- 2. 기존 데이터 slug 생성 (선택사항)
-- =====================
-- 아래 SQL은 기존 name 컬럼 기반으로 slug를 자동 생성합니다.
-- 형식: "HITOSATO,Shigeki" → "shigeki-hitosato"
-- 형식: "KIM,Sang Wook" → "sang-wook-kim"

-- UPDATE alih_players
-- SET slug = LOWER(
--   REGEXP_REPLACE(
--     TRIM(SPLIT_PART(name, ',', 2)) || '-' || TRIM(SPLIT_PART(name, ',', 1)),
--     '\s+', '-', 'g'
--   )
-- )
-- WHERE slug IS NULL AND name LIKE '%,%';

-- =====================
-- 3. 향후 데이터를 위한 트리거 (선택사항)
-- =====================
-- CREATE OR REPLACE FUNCTION generate_player_slug()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.slug IS NULL AND NEW.name LIKE '%,%' THEN
--     NEW.slug := LOWER(
--       REGEXP_REPLACE(
--         TRIM(SPLIT_PART(NEW.name, ',', 2)) || '-' || TRIM(SPLIT_PART(NEW.name, ',', 1)),
--         '\s+', '-', 'g'
--       )
--     );
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trg_player_slug
-- BEFORE INSERT OR UPDATE ON alih_players
-- FOR EACH ROW EXECUTE FUNCTION generate_player_slug();
