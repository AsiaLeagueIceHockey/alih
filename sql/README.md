# SQL 마이그레이션 가이드

이 폴더에는 Supabase SQL Editor에서 실행해야 하는 마이그레이션 파일들이 있습니다.

## 📁 파일 목록

| 파일 | 설명 | 실행일 |
|------|------|--------|
| `v1_base_schema.sql` | 기본 스키마 (profiles, notification_tokens, alih_cheers) | 2026-01-04 |
| `v2_comments.sql` | 댓글 시스템 (alih_comments) | 2026-02-01 |
| `v3_fix_rls_policies.sql` | RLS 수정 (댓글 삭제, 프로필 공개) | 2026-02-01 |

## 🚀 실행 방법

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 → **SQL Editor** 이동
3. 각 파일 내용 복사 → **Run** 클릭
4. ✅ 순서대로 실행 (v1 → v2 → ...)

## ⚠️ 주의사항

- **버전 순서대로 실행** (v1 → v2 → v3 ...)
- 이미 실행된 버전은 다시 실행하지 않음
- 새 테이블 추가 시 v{N+1} 파일 생성
- 실행 후 `AGENTS.md` 변경이력 업데이트

## 📋 현재 상태

- [x] v1_base_schema.sql - 프로덕션 적용됨
- [x] v2_comments.sql - 프로덕션 적용됨
- [ ] v3_fix_rls_policies.sql - **실행 필요** ⚠️

