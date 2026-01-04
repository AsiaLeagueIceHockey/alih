-- =====================================================
-- 실시간 응원하기 (Cheering Battle) DB 스키마
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS alih_cheers (
  id BIGSERIAL PRIMARY KEY,
  game_no INTEGER NOT NULL,
  home_cheers BIGINT DEFAULT 0,
  away_cheers BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_no)
);

-- 2. RLS 활성화
ALTER TABLE alih_cheers ENABLE ROW LEVEL SECURITY;

-- 3. 읽기 정책 (모든 사용자 허용 - 익명 포함)
CREATE POLICY "Allow anonymous read" ON alih_cheers
  FOR SELECT USING (true);

-- 4. 삽입 정책 (anon 역할 허용)
CREATE POLICY "Allow anonymous insert" ON alih_cheers
  FOR INSERT WITH CHECK (true);

-- 5. RPC 함수: 원자적 증가 (Throttled 요청 처리용)
CREATE OR REPLACE FUNCTION increment_cheers(
  p_game_no INTEGER,
  p_team TEXT,  -- 'home' 또는 'away'
  p_count INTEGER DEFAULT 1
)
RETURNS TABLE(home_cheers BIGINT, away_cheers BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- INSERT 또는 UPDATE (upsert)
  INSERT INTO alih_cheers (game_no, home_cheers, away_cheers)
  VALUES (
    p_game_no,
    CASE WHEN p_team = 'home' THEN p_count ELSE 0 END,
    CASE WHEN p_team = 'away' THEN p_count ELSE 0 END
  )
  ON CONFLICT (game_no) DO UPDATE SET
    home_cheers = alih_cheers.home_cheers + CASE WHEN p_team = 'home' THEN p_count ELSE 0 END,
    away_cheers = alih_cheers.away_cheers + CASE WHEN p_team = 'away' THEN p_count ELSE 0 END,
    updated_at = NOW();

  -- 업데이트된 값 반환
  RETURN QUERY
  SELECT c.home_cheers, c.away_cheers
  FROM alih_cheers c
  WHERE c.game_no = p_game_no;
END;
$$;

-- 6. Realtime 활성화 (Supabase Dashboard에서 수동 활성화 필요)
-- Dashboard > Database > Replication > alih_cheers 테이블 활성화

-- 7. 인덱스 (선택사항 - 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_cheers_game_no ON alih_cheers(game_no);
