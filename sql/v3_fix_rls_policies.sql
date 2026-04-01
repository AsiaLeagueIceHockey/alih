-- =====================================================
-- V3: 댓글 및 프로필 RLS 수정
-- 실행일: 2026-02-01
-- 설명: 
--   1. alih_comments UPDATE 정책에 WITH CHECK 추가
--   2. alih_comments SELECT 정책 - 본인 댓글은 항상 접근 가능
--   3. profiles SELECT 정책 - 모든 사용자가 닉네임 조회 가능
-- 의존성: V2 실행 후 실행
-- =====================================================

-- =====================
-- 1. alih_comments SELECT 정책 수정
-- =====================
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can read non-deleted comments" ON alih_comments;

-- 새 정책: 삭제되지 않은 댓글 + 본인 댓글은 항상 조회 가능
CREATE POLICY "Read non-deleted or own comments" ON alih_comments
  FOR SELECT USING (is_deleted = FALSE OR auth.uid() = user_id);

-- =====================
-- 2. alih_comments UPDATE 정책 수정
-- =====================
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can update own comments" ON alih_comments;

-- 새 정책: USING과 WITH CHECK 모두 지정
CREATE POLICY "Users can update own comments" ON alih_comments
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================
-- 3. profiles SELECT 정책 수정
-- =====================
-- 모든 사용자가 프로필(닉네임) 조회 가능하도록 변경
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- 모든 인증/비인증 사용자가 프로필 읽기 가능
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

-- ⚠️ 참고: 이 정책으로 모든 사용자의 프로필(nickname, avatar_url 등)이 
-- 공개됩니다. email 같은 민감한 정보는 프론트에서 필터링하거나,
-- 별도의 뷰를 만들어서 제한된 컬럼만 노출할 수 있습니다.
