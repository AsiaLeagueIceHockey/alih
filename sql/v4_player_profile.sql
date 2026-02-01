-- =====================================================
-- V4: Player Profile 확장
-- 실행일: 2026-02-01
-- 설명: 
--   선수 포트폴리오 페이지를 위한 alih_players 컬럼 추가
--   - 프로필 사진, 인스타그램, 생년월일, 국적 등
-- 의존성: 없음 (기존 alih_players 테이블에 컬럼 추가)
-- =====================================================

-- =====================
-- 1. alih_players 컬럼 추가
-- =====================

-- 프로필 사진 URL
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 인스타그램 URL
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 생년월일
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 국적 (영문)
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS nationality TEXT;

-- 국적 플래그 이모지 (🇰🇷, 🇯🇵 등)
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS nationality_flag TEXT;

-- 키 (cm)
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS height_cm INTEGER;

-- 몸무게 (kg)
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS weight_kg INTEGER;

-- 드래프트 정보 (JSON)
-- 예: {"year": 2020, "round": 3, "pick": 72, "team": "Detroit Red Wings"}
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS draft_info JSONB;

-- 커리어 히스토리 (JSON 배열)
-- 예: [{"team": "안양 한라", "league": "ALIH", "season": "2023-24", "gp": 48, "g": 12, "a": 15}]
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS career_history JSONB;

-- 선수 스토리/역사 (마크다운)
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS bio_markdown TEXT;

-- 다국어 이름
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS name_ko TEXT;
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE alih_players ADD COLUMN IF NOT EXISTS name_ja TEXT;

-- =====================
-- 2. 인덱스 추가
-- =====================
CREATE INDEX IF NOT EXISTS idx_players_instagram ON alih_players(instagram_url) WHERE instagram_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_nationality ON alih_players(nationality);

-- =====================
-- 3. player_cards 테이블 (디지털 카드 발급 기록)
-- =====================
CREATE TABLE IF NOT EXISTS player_cards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES alih_players(id) ON DELETE CASCADE,
  serial_number INTEGER NOT NULL,
  card_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 같은 사용자가 같은 선수 카드를 중복 발급 방지
  UNIQUE(user_id, player_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_player_cards_player ON player_cards(player_id);
CREATE INDEX IF NOT EXISTS idx_player_cards_user ON player_cards(user_id);

-- RLS 정책
ALTER TABLE player_cards ENABLE ROW LEVEL SECURITY;

-- 누구나 카드 조회 가능 (공개 갤러리 목적)
CREATE POLICY "Anyone can view cards" ON player_cards
  FOR SELECT USING (true);

-- 로그인 유저만 발급 가능
CREATE POLICY "Authenticated users can create cards" ON player_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ⚠️ player_cards serial_number 자동 생성 함수
CREATE OR REPLACE FUNCTION get_next_card_serial(p_player_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  next_serial INTEGER;
BEGIN
  SELECT COALESCE(MAX(serial_number), 0) + 1 INTO next_serial
  FROM player_cards
  WHERE player_id = p_player_id;
  RETURN next_serial;
END;
$$ LANGUAGE plpgsql;
