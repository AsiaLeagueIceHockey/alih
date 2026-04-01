-- v6_predictions.sql
-- 승부 예측 (Match Prediction) 기능
-- 사용자가 경기 결과를 예측할 수 있는 테이블

-- alih_predictions: 승부 예측 테이블
CREATE TABLE IF NOT EXISTS alih_predictions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id INTEGER NOT NULL,
  prediction TEXT NOT NULL CHECK (prediction IN ('home_reg', 'home_ot', 'away_ot', 'away_reg')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, schedule_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_predictions_schedule ON alih_predictions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON alih_predictions(user_id);

-- RLS 정책
ALTER TABLE alih_predictions ENABLE ROW LEVEL SECURITY;

-- 누구나 예측 집계 읽기 가능
CREATE POLICY "Anyone can read predictions" ON alih_predictions
  FOR SELECT USING (true);

-- 로그인한 사용자만 자기 예측 삽입 가능
CREATE POLICY "Authenticated users can insert predictions" ON alih_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 자기 예측만 수정 가능
CREATE POLICY "Users can update own predictions" ON alih_predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- 자기 예측만 삭제 가능
CREATE POLICY "Users can delete own predictions" ON alih_predictions
  FOR DELETE USING (auth.uid() = user_id);
