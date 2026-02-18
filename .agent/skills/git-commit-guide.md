---
name: git-commit-guide
description: 가독성 좋은 Git 커밋 메시지 작성 및 워크플로우 가이드 (Korean) - No Emojis
---

# Git Commit Guide

본 가이드는 프로젝트의 Git 커밋 메시지 규칙과 워크플로우를 정의합니다.

## 1. 커밋 메시지 구조 (Commit Message Structure)

기본 형식:
`[태그]: [제목] (User Request ID 등 코멘트 - 선택사항)`

예시:
`feat: 실시간 응원 기능 추가`
`fix: 로그인 모달이 닫히지 않는 버그 수정`

### 1.1 태그 (Tags)

| 태그 | 설명 |
|---|---|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 코드 리팩토링 (기능 변경 없음) |
| `style` | UI/스타일 변경, 포맷팅 (로직 변경 없음) |
| `docs` | 문서 수정 (README, AGENTS.md 등) |
| `chore` | 설정 변경, 패키지 매니저 관리, 빌드 스크립트 등 |
| `perf` | 성능 개선 |
| `test` | 테스트 코드 추가/수정 |

---

## 2. 워크플로우 (Workflow)

작업이 완료되면 다음 절차를 따릅니다.

1. **변경 사항 확인**:
   ```bash
   git status
   git diff
   ```

2. **변경 사항 스테이징**:
   ```bash
   git add .
   ```

3. **커밋 (Commit)**:
   - 메시지는 **한글**로 작성합니다.
   - 이모지를 사용하지 않고 명확하고 간결하게 작성합니다.
   ```bash
   git commit -m "feat: 사용자 프로필 수정 페이지 구현"
   ```

4. **푸시 (Push)**:
   ```bash
   git push origin main
   ```
   *(브랜치 전략이 따로 있다면 해당 브랜치명 사용)*

---

## 3. 주의사항

- **중요**: `.env` 파일과 같은 민감한 정보는 절대 커밋하지 마세요.
- **단위**: 가능한 한 논리적인 단위로 나누어 커밋하는 것을 권장합니다.
- **충돌**: 푸시 전 `git pull`을 통해 원격 저장소와의 동기화를 확인하는 습관을 들이세요.
