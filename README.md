# 아시아리그 아이스하키 팬사이트

아시아리그 아이스하키 2025-26 시즌 정보를 제공하는 팬 사이트입니다.

🔗 **사이트**: [https://alhockey.fans](https://alhockey.fans)

## 주요 기능

- 🏒 **경기 일정/결과**: 월별/팀별 필터링, 실시간 스코어 업데이트
- 📊 **리그 순위**: 팀 순위 및 개인 기록 (득점왕, 도움왕 등)
- 🎬 **하이라이트**: 경기별 하이라이트 영상
- 📰 **뉴스**: 한국어/일본어/영어 뉴스 통합 제공
- 🏆 **팀 상세**: 팀 정보, 로스터, 최근 경기 결과
- 📱 **모바일 최적화**: PWA 스타일 반응형 디자인

## 기술 스택

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Data**: Supabase, TanStack React Query
- **SEO**: react-helmet-async, 동적 sitemap
- **Hosting**: Vercel

## 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 프로젝트 구조

```
src/
├── components/       # UI 컴포넌트
│   ├── team/        # 팀 상세 페이지 전용
│   └── ui/          # shadcn/ui 컴포넌트
├── hooks/           # 커스텀 훅
│   ├── useTeams.tsx     # 팀 데이터
│   └── useSchedules.ts  # 일정 데이터 (캐시 공유)
├── pages/           # 페이지 컴포넌트
├── lib/             # 유틸리티
└── types/           # 타입 정의
```

## 주요 라우트

| 경로 | 설명 |
|------|------|
| `/` | 홈 (다음 경기, 뉴스, 순위) |
| `/schedule` | 경기 일정 (월별/팀별 필터) |
| `/schedule/:gameNo` | 경기 상세 |
| `/highlights` | 하이라이트 영상 |
| `/standings` | 팀/개인 순위 |
| `/news` | 뉴스 목록 |
| `/team/:teamId` | 팀 상세 |

## 기여하기

이슈 및 PR 환영합니다!

## 라이선스

MIT License

---

*Made with ❤️ for Asian ice hockey fans*
