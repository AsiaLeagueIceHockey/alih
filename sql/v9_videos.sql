-- v9_videos.sql
-- 범용 영상 콘텐츠 테이블 (팀 다큐, 인터뷰, 리캡 등)
-- Highlights(경기 하이라이트)와 별도로 운영

CREATE TABLE IF NOT EXISTS alih_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  team_english_name TEXT,              -- alih_teams.english_name과 매칭 (nullable)
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE alih_videos ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 영상 (어드민에서 비공개도 볼 수 있도록)
CREATE POLICY "Anyone can read videos"
  ON alih_videos
  FOR SELECT
  USING (true);

-- 쓰기: anon key로 INSERT/UPDATE/DELETE 허용
-- (어드민 페이지는 VITE_ADMIN_PIN으로 보호, DB 레벨 보호는 추후 Edge Function으로 전환)
CREATE POLICY "Anyone can insert videos"
  ON alih_videos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update videos"
  ON alih_videos
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete videos"
  ON alih_videos
  FOR DELETE
  USING (true);

-- 인덱스
CREATE INDEX idx_alih_videos_published_at ON alih_videos (published_at DESC);
CREATE INDEX idx_alih_videos_team ON alih_videos (team_english_name);
