---
description: 작업 완료 후 문서 업데이트 및 Git 푸시
---
// turbo-all

## 작업 완료 후 체크리스트

### 1. AGENTS.md 업데이트
변경 사항이 있다면 AGENTS.md를 업데이트합니다:
- 새로운 기능 추가 시 → "완료된 기능" 섹션에 추가
- 새 컴포넌트/파일 추가 시 → "프로젝트 구조" 섹션 업데이트
- 새 SQL 마이그레이션 추가 시 → "SQL 마이그레이션" 섹션 업데이트
- 변경 이력에 날짜와 함께 기록

### 2. Git 커밋 및 푸시
```bash
git add -A
git commit -m "<type>: <설명>"
git push origin main
```

커밋 메시지 타입:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `style`: 스타일 수정 (UI)
- `docs`: 문서 수정
- `chore`: 기타 작업
