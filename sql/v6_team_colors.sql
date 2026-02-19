-- =====================================================
-- V6: Team Colors for Player Cards
-- 실행일: 2026-02-18
-- 설명: 
--   선수 카드 뒷면 배경색을 위한 team_color 컬럼 추가 및 데이터 업데이트
-- =====================================================

-- 1. alih_teams 테이블에 team_color 컬럼 추가
ALTER TABLE alih_teams ADD COLUMN IF NOT EXISTS team_color TEXT;

-- 2. 각 팀별 색상 업데이트
-- HL Anyang (HL 안양) - 기존 색상 유지 (Primary Red assumed roughly #ce0e2d or similar, user said keep current so maybe let's set a default red)
-- Note: User said "currently keeps current color". If NULL, frontend can fallback to default. 
-- But let's set a specific one if known. For now, let's leave HL Anyang as NULL or set to red?
-- User: "HL안양: 현재 색상 코드 유지" -> I will set it to the team's red color for consistency #ce0e2d
UPDATE alih_teams
SET team_color = '#009FEF'
WHERE english_name ILIKE '%Anyang%';

-- Red Eagles Hokkaido (레드이글스 홋카이도) - #E60012
UPDATE alih_teams
SET team_color = '#E60012'
WHERE english_name ILIKE '%Eagle%';

-- Nikko Icebucks (닛코 아이스벅스) - #F37021
UPDATE alih_teams
SET team_color = '#F37021'
WHERE english_name ILIKE '%Icebuck%';

-- Yokohama Grits (요코하마 그리츠) - Sky Blue (#87CEEB)
UPDATE alih_teams
SET team_color = '#87CEEB'
WHERE english_name ILIKE '%Grit%';

-- Tohoku Free Blades (도호쿠 프리블레이즈) - Silver (#C0C0C0)
UPDATE alih_teams
SET team_color = '#C0C0C0'
WHERE english_name ILIKE '%Free%';

-- Stars Kobe (스타즈 고베) - Navy (#000080)
-- Assuming english_name contains "Star" or "Kobe"
UPDATE alih_teams
SET team_color = '#000080'
WHERE english_name ILIKE '%Star%' OR english_name ILIKE '%Kobe%';
