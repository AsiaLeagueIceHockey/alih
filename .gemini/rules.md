# 프로젝트 규칙

## 작업 시작 시
1. **반드시** `AGENTS.md`를 먼저 읽고 프로젝트 개요, 기술 스택, 완료된 기능을 파악할 것
2. `sql/README.md`를 확인하여 마이그레이션 상태 파악

## 작업 완료 시
1. **AGENTS.md 업데이트** (새 기능/파일/SQL 추가 시)
   - "완료된 기능" 섹션 업데이트
   - "변경 이력" 섹션에 날짜와 내용 추가
2. **Git 커밋 및 푸시** (자동 실행)
   ```bash
   git add -A
   git commit -m "<type>: <설명>"
   git push origin main
   ```

## 개발 컨벤션
- shadcn/ui 컴포넌트 필수 사용
- 시맨틱 색상 토큰 사용 (text-success, text-destructive 등)
- 다국어(i18n) 필수: 한국어, 일본어, 영어
- 팀명은 `getLocalizedTeamName(team, currentLang)` 사용

## 커밋 메시지 타입
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `style`: UI/스타일 수정
- `docs`: 문서 수정
- `chore`: 기타 작업
