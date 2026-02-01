-- =====================================================
-- V2: 댓글 시스템 (alih_comments)
-- 실행일: 2026-02-01
-- 설명: 경기/팀/선수 페이지 댓글 기능
-- 의존성: V1 실행 후 실행
-- =====================================================

-- =====================
-- alih_comments 테이블
-- =====================
CREATE TABLE alih_comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('game', 'team', 'player')),
  entity_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  parent_id BIGINT REFERENCES alih_comments(id) ON DELETE CASCADE,  -- 대댓글용
  is_deleted BOOLEAN DEFAULT FALSE,  -- soft delete (관리자용)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_comments_entity ON alih_comments(entity_type, entity_id);
CREATE INDEX idx_comments_user ON alih_comments(user_id);
CREATE INDEX idx_comments_parent ON alih_comments(parent_id);

-- RLS 정책
ALTER TABLE alih_comments ENABLE ROW LEVEL SECURITY;

-- 읽기: 삭제되지 않은 댓글 전체 공개
CREATE POLICY "Anyone can read non-deleted comments" ON alih_comments
  FOR SELECT USING (is_deleted = FALSE);

-- 쓰기: 로그인 유저만
CREATE POLICY "Authenticated users can insert" ON alih_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 수정: 본인만
CREATE POLICY "Users can update own comments" ON alih_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- 삭제: 본인만 (프론트에서 soft delete로 처리)
CREATE POLICY "Users can delete own comments" ON alih_comments
  FOR DELETE USING (auth.uid() = user_id);

-- ⚠️ 관리자 삭제: Edge Function에서 service_role로 is_deleted = true 처리
