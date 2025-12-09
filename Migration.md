# Lovable 마이그레이션 가이드

이 문서는 현재 프로젝트에서 Lovable 플랫폼에 종속된 기능들을 식별하고, 각각의 마이그레이션 방법을 상세하게 안내합니다.

---

## 📋 목차

1. [마이그레이션 대상 요약](#1-마이그레이션-대상-요약)
2. [Supabase 프로젝트 마이그레이션](#2-supabase-프로젝트-마이그레이션)
3. [Edge Functions 마이그레이션](#3-edge-functions-마이그레이션)
4. [도메인 및 URL 하드코딩 수정](#4-도메인-및-url-하드코딩-수정)
5. [개발 도구 정리](#5-개발-도구-정리)
6. [환경 변수 설정](#6-환경-변수-설정)
7. [마이그레이션 체크리스트](#7-마이그레이션-체크리스트)

---

## 1. 마이그레이션 대상 요약

### 1.1 종속성 분류표

| 카테고리 | 항목 | 현재 사용 위치 | 마이그레이션 난이도 | 우선순위 |
|---------|------|--------------|-------------------|---------|
| Supabase | Lovable Cloud Supabase | 전역 (client, Edge Functions) | ⭐⭐ 중간 | 🔴 높음 |
| Edge Functions | generate-sitemap | SEO 동적 사이트맵 | ⭐ 쉬움 | 🟡 중간 |
| Edge Functions | send-analytics-report | 이메일 리포트 (현재 미사용) | ⭐ 쉬움 | 🟢 낮음 |
| Edge Functions | scrape-news/schedule/standings | 데이터 스크래핑 (예비 기능) | ⭐ 쉬움 | 🟢 낮음 |
| 도메인 | alhockey.fans | SEO, OG 태그, sitemap | ⭐ 쉬움 | 🔴 높음 |
| 개발 도구 | lovable-tagger | Vite 플러그인 | ⭐ 쉬움 | 🟢 낮음 |
| UI 요소 | #lovable-badge | CSS 숨김 처리 | ⭐ 쉬움 | 🟢 낮음 |

---

## 2. Supabase 프로젝트 마이그레이션

### 2.1 현재 구조

프로젝트는 **두 개의 Supabase 프로젝트**를 사용합니다:

#### A. 외부 Supabase (데이터 소스) - 유지
```
URL: https://nvlpbdyqfzmlrjauvhxx.supabase.co
용도: 주요 데이터 저장 (팀, 경기, 순위, 선수, 뉴스)
파일: src/lib/supabase-external.ts
```

**유스케이스:**
- 모든 페이지에서 팀/경기/선수 데이터 조회
- 실시간 경기 스코어 조회
- 뉴스 및 하이라이트 데이터 조회

**마이그레이션:** 이 프로젝트는 **그대로 유지**됩니다. 별도 Supabase 계정으로 이미 분리되어 있음.

#### B. Lovable Cloud Supabase (Edge Functions) - 마이그레이션 필요
```
URL: https://rmfwypuvpwndnhjznaig.supabase.co
용도: Edge Functions 호스팅, Lovable 자동 생성
파일: src/integrations/supabase/client.ts, .env
```

**유스케이스:**
- Edge Functions 배포 및 실행
- robots.txt에서 동적 sitemap 참조

### 2.2 마이그레이션 방법

#### Step 1: 새 Supabase 프로젝트 생성
```bash
# 1. Supabase CLI 설치
npm install -g supabase

# 2. 로그인
supabase login

# 3. 새 프로젝트 생성 (Supabase Dashboard에서)
# https://supabase.com/dashboard 접속 → New Project
```

#### Step 2: 환경 변수 업데이트
`.env` 파일을 수정합니다:
```env
# 기존 Lovable Cloud
# VITE_SUPABASE_PROJECT_ID="rmfwypuvpwndnhjznaig"
# VITE_SUPABASE_PUBLISHABLE_KEY="..."
# VITE_SUPABASE_URL="https://rmfwypuvpwndnhjznaig.supabase.co"

# 새 Supabase 프로젝트
VITE_SUPABASE_PROJECT_ID="your-new-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-new-anon-key"
VITE_SUPABASE_URL="https://your-new-project-id.supabase.co"
```

#### Step 3: Supabase 클라이언트 수정
`src/integrations/supabase/client.ts`는 Lovable에서 자동 생성되므로, 로컬에서는 수동으로 수정하거나 새로 생성:

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

## 3. Edge Functions 마이그레이션

### 3.1 현재 Edge Functions 목록

| 함수명 | 현재 사용 여부 | 용도 | 마이그레이션 필요 사항 |
|-------|--------------|------|---------------------|
| `generate-sitemap` | ✅ 사용 중 | SEO 동적 사이트맵 생성 | URL 변경 |
| `send-analytics-report` | ⚠️ 미사용 | 이메일 애널리틱스 리포트 | Lovable API 제거 또는 GA API로 대체 |
| `scrape-news` | ⚠️ 예비 | 뉴스 스크래핑 | 그대로 사용 가능 |
| `scrape-schedule` | ⚠️ 예비 | 일정 스크래핑 | 그대로 사용 가능 |
| `scrape-standings` | ⚠️ 예비 | 순위 스크래핑 | 그대로 사용 가능 |

### 3.2 generate-sitemap

#### 현재 유스케이스
```
파일: supabase/functions/generate-sitemap/index.ts
호출: robots.txt에서 Sitemap URL로 참조
     검색엔진이 주기적으로 호출하여 사이트맵 생성

동작:
1. 외부 Supabase에서 alih_schedule, alih_teams 데이터 조회
2. 모든 경기 페이지 (120+개), 팀 페이지 (6개) URL 생성
3. XML sitemap 형식으로 반환
```

#### 현재 코드에서 하드코딩된 URL
```typescript
// supabase/functions/generate-sitemap/index.ts (line 20)
const siteUrl = 'https://alhockey.fans';  // ← 변경 필요
```

#### 마이그레이션 방법
```bash
# 1. 프로젝트 폴더에서 Supabase 초기화
supabase init

# 2. 프로젝트 연결
supabase link --project-ref your-new-project-id

# 3. URL 수정 후 배포
supabase functions deploy generate-sitemap

# 4. 함수를 public으로 설정 (JWT 인증 비활성화)
# supabase/config.toml에서:
[functions.generate-sitemap]
verify_jwt = false
```

#### 수정 사항
```typescript
// supabase/functions/generate-sitemap/index.ts
const siteUrl = 'https://your-new-domain.com';  // 새 도메인으로 변경
```

### 3.3 send-analytics-report

#### 현재 유스케이스
```
파일: supabase/functions/send-analytics-report/index.ts
호출: 현재 미사용 (수동 테스트용)

동작:
1. Lovable Analytics API 호출 (api.lovable.dev)
2. 어제 날짜의 방문자/페이지뷰 데이터 조회
3. Resend API로 이메일 발송
```

#### 문제점: Lovable API 종속
```typescript
// supabase/functions/send-analytics-report/index.ts (line 96-97)
const projectId = Deno.env.get("SUPABASE_PROJECT_ID") || "rmfwypuvpwndnhjznaig";
const apiUrl = `https://api.lovable.dev/v1/projects/${projectId}/analytics`;  // ← Lovable 전용 API
```

#### 마이그레이션 옵션

**옵션 A: Google Analytics API로 대체 (권장)**
```typescript
// GA4 Data API 사용
import { google } from 'googleapis';

async function fetchGAAnalytics(startDate: string, endDate: string) {
  const analytics = google.analyticsdata('v1beta');
  
  const response = await analytics.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
      dimensions: [
        { name: 'pagePath' },
      ],
    },
  });
  
  return response.data;
}
```

**필요한 시크릿:**
- `GA_PROPERTY_ID`: Google Analytics 속성 ID
- `GA_SERVICE_ACCOUNT_KEY`: 서비스 계정 JSON 키

**옵션 B: 함수 제거**
현재 미사용 상태이므로, 마이그레이션 시 삭제 고려.

### 3.4 scrape-* 함수들

#### 현재 유스케이스
```
파일: supabase/functions/scrape-news/index.ts
      supabase/functions/scrape-schedule/index.ts
      supabase/functions/scrape-standings/index.ts
호출: 현재 미사용 (예비 기능)

동작:
- asiaicehockey.com 웹사이트 스크래핑
- HTML 파싱하여 경기/순위/뉴스 데이터 추출
- 일본어 팀명을 한국어로 변환
```

#### 마이그레이션
이 함수들은 외부 API 종속이 없으므로 **그대로 배포 가능**:
```bash
supabase functions deploy scrape-news
supabase functions deploy scrape-schedule
supabase functions deploy scrape-standings
```

---

## 4. 도메인 및 URL 하드코딩 수정

### 4.1 수정 필요 파일 목록

| 파일 | 현재 URL | 용도 |
|-----|---------|------|
| `public/robots.txt` | Lovable Cloud Edge Function URL | 검색엔진 sitemap 참조 |
| `public/sitemap.xml` | alhockey.fans | 정적 sitemap (Google Search Console용) |
| `index.html` | alhockey.fans | OG 이미지 URL |
| `src/components/SEO.tsx` | alhockey.fans | 모든 페이지 SEO 메타 태그 |
| `supabase/functions/generate-sitemap/index.ts` | alhockey.fans | 동적 sitemap 생성 |
| `supabase/functions/send-analytics-report/index.ts` | api.lovable.dev | 애널리틱스 API |

### 4.2 상세 수정 가이드

#### A. public/robots.txt
```diff
User-agent: *
Allow: /

- Sitemap: https://rmfwypuvpwndnhjznaig.supabase.co/functions/v1/generate-sitemap
+ Sitemap: https://your-new-supabase-id.supabase.co/functions/v1/generate-sitemap
```

**유스케이스:** 검색엔진 크롤러가 이 URL을 통해 동적 sitemap 접근

#### B. public/sitemap.xml
전체 파일에서 `alhockey.fans` → 새 도메인으로 일괄 변경:
```bash
# 일괄 치환 (Linux/Mac)
sed -i 's/alhockey.fans/your-new-domain.com/g' public/sitemap.xml
```

**유스케이스:** Google Search Console에 제출된 정적 sitemap

#### C. index.html
```diff
- <meta property="og:image" content="https://alhockey.fans/og-image.png">
- <meta name="twitter:image" content="https://alhockey.fans/og-image.png">
+ <meta property="og:image" content="https://your-new-domain.com/og-image.png">
+ <meta name="twitter:image" content="https://your-new-domain.com/og-image.png">
```

**유스케이스:** 소셜 미디어 공유 시 미리보기 이미지

#### D. src/components/SEO.tsx
```diff
const SEO = ({ ... }: SEOProps) => {
-  const siteUrl = "https://alhockey.fans";
+  const siteUrl = "https://your-new-domain.com";
  // 또는 환경 변수 사용:
+ const siteUrl = import.meta.env.VITE_SITE_URL || "https://your-new-domain.com";
```

**유스케이스:** 모든 페이지의 canonical URL, OG 태그 생성

---

## 5. 개발 도구 정리

### 5.1 lovable-tagger 제거

#### 현재 유스케이스
```
파일: vite.config.ts (line 4, 12)
용도: 개발 모드에서 컴포넌트 태깅 (Lovable 에디터 연동)
실행: development 모드에서만 동작
```

#### 현재 코드
```typescript
// vite.config.ts
import { componentTagger } from "lovable-tagger";  // line 4

plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),  // line 12
```

#### 마이그레이션
```diff
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
- import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
-  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
+  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ... build 설정 유지
}));
```

#### 패키지 제거
```bash
npm uninstall lovable-tagger
```

### 5.2 #lovable-badge CSS 제거

#### 현재 유스케이스
```
파일: src/index.css (line 117-119)
용도: Lovable 배지 숨김 (프로덕션 UI에서 제거)
```

#### 현재 코드
```css
/* src/index.css */
#lovable-badge {
  display: none !important;
}
```

#### 마이그레이션
Lovable 외부에서는 이 배지가 삽입되지 않으므로, 해당 CSS 제거 가능:
```diff
// src/index.css
- #lovable-badge {
-   display: none !important;
- }
```

---

## 6. 환경 변수 설정

### 6.1 현재 환경 변수

```env
# .env (Lovable 자동 생성)
VITE_SUPABASE_PROJECT_ID="rmfwypuvpwndnhjznaig"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."
VITE_SUPABASE_URL="https://rmfwypuvpwndnhjznaig.supabase.co"
```

### 6.2 마이그레이션 후 환경 변수

```env
# .env (수동 설정)
VITE_SUPABASE_PROJECT_ID="your-new-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-new-anon-key"
VITE_SUPABASE_URL="https://your-new-project-id.supabase.co"

# 추가 권장 (도메인 중앙 관리)
VITE_SITE_URL="https://your-new-domain.com"

# Edge Function 시크릿 (Supabase Dashboard에서 설정)
# RESEND_API_KEY="re_..."
# GA_PROPERTY_ID="..."  # send-analytics-report 대체 시
```

### 6.3 Edge Function 시크릿 마이그레이션

현재 Lovable Cloud에 저장된 시크릿:
- `RESEND_API_KEY`: Resend 이메일 API 키

새 Supabase 프로젝트에서 설정:
```bash
# Supabase Dashboard → Settings → Edge Functions → Secrets
# 또는 CLI:
supabase secrets set RESEND_API_KEY="re_your_api_key"
```

---

## 7. 마이그레이션 체크리스트

### 7.1 사전 준비
- [ ] 새 Supabase 프로젝트 생성
- [ ] 새 도메인 준비 (또는 기존 도메인 사용 결정)
- [ ] Resend API 키 백업

### 7.2 코드 수정
- [ ] `.env` 환경 변수 업데이트
- [ ] `src/integrations/supabase/client.ts` 수정/재생성
- [ ] `public/robots.txt` sitemap URL 수정
- [ ] `public/sitemap.xml` 도메인 일괄 변경
- [ ] `index.html` OG 이미지 URL 수정
- [ ] `src/components/SEO.tsx` siteUrl 수정
- [ ] `supabase/functions/generate-sitemap/index.ts` siteUrl 수정
- [ ] `vite.config.ts`에서 lovable-tagger 제거
- [ ] `src/index.css`에서 #lovable-badge 스타일 제거
- [ ] `package.json`에서 lovable-tagger 의존성 제거

### 7.3 Edge Functions 배포
- [ ] Supabase CLI 설치 및 로그인
- [ ] 새 프로젝트에 Edge Functions 배포
- [ ] `generate-sitemap` verify_jwt: false 설정
- [ ] RESEND_API_KEY 시크릿 설정

### 7.4 검증
- [ ] 로컬 개발 서버 정상 실행 확인
- [ ] 프로덕션 빌드 성공 확인
- [ ] Edge Function 호출 테스트
- [ ] SEO 메타 태그 확인
- [ ] Google Search Console sitemap 재제출

### 7.5 선택 사항
- [ ] `send-analytics-report` 함수 GA API로 대체 또는 삭제
- [ ] Google Analytics 속성 설정 업데이트 (도메인 변경 시)
- [ ] Search Console 새 도메인 등록

---

## 📌 참고 사항

### 외부 Supabase 프로젝트 (유지)
`src/lib/supabase-external.ts`에 정의된 외부 Supabase 프로젝트는 Lovable과 무관하게 독립적으로 운영되므로 **마이그레이션 불필요**:

```typescript
// src/lib/supabase-external.ts - 변경 없음
export const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJ...'
);
```

### DNS Prefetch 업데이트
`index.html`의 DNS prefetch도 새 Supabase URL로 업데이트 권장:
```html
<link rel="dns-prefetch" href="https://your-new-project-id.supabase.co">
```

### 호스팅 옵션
- **Vercel**: `vercel.json` 설정 후 배포
- **Netlify**: `netlify.toml` 설정 후 배포
- **Cloudflare Pages**: `wrangler.toml` 설정 후 배포
- **자체 서버**: Nginx/Apache 설정

---

*마지막 업데이트: 2025-12-09*
