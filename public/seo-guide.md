# SEO 최적화 가이드

이 사이트는 검색엔진 최적화(SEO)를 위해 다음과 같이 구성되었습니다:

## 1. 구현된 SEO 기능

### 메타 태그
- 각 페이지마다 고유한 title과 description
- Open Graph 태그 (소셜 미디어 공유용)
- Twitter Cards 태그
- Canonical URL (중복 콘텐츠 방지)
- 키워드 메타 태그

### 구조화된 데이터 (JSON-LD)
- 홈페이지: SportsOrganization 스키마
- 경기 상세: SportsEvent 스키마
- 검색엔진이 콘텐츠를 더 잘 이해할 수 있도록 구조화

### 기술적 SEO
- sitemap.xml 생성 (모든 주요 페이지 포함)
- robots.txt 구성 (검색엔진 크롤링 허용)
- Semantic HTML 구조 사용
- 반응형 디자인 (모바일 친화적)

## 2. 검색엔진 등록 방법

### Google Search Console
1. [Google Search Console](https://search.google.com/search-console) 접속
2. 속성 추가 → URL 접두어 방식 선택
3. 사이트 URL 입력: `https://alih.lovable.app`
4. 소유권 확인 (HTML 파일 업로드 또는 메타 태그 추가)
5. Sitemap 제출: `https://alih.lovable.app/sitemap.xml`

### Naver 웹마스터 도구
1. [네이버 서치어드바이저](https://searchadvisor.naver.com/) 접속
2. 웹마스터 도구 → 사이트 등록
3. 사이트 URL 입력: `https://alih.lovable.app`
4. 소유권 확인 (HTML 파일 업로드)
5. 사이트맵 제출: `https://alih.lovable.app/sitemap.xml`

### Bing Webmaster Tools
1. [Bing Webmaster Tools](https://www.bing.com/webmasters) 접속
2. 사이트 추가
3. 사이트 URL 입력: `https://alih.lovable.app`
4. 소유권 확인
5. Sitemap 제출: `https://alih.lovable.app/sitemap.xml`

## 3. 추가 최적화 팁

### 콘텐츠 최적화
- 정기적으로 최신 뉴스와 경기 결과 업데이트
- 고유하고 가치 있는 콘텐츠 제공
- 이미지에 적절한 alt 속성 추가

### 성능 최적화
- 이미지 최적화 (WebP 포맷 사용)
- 코드 minification
- CDN 사용 고려

### 링크 구축
- 소셜 미디어에 콘텐츠 공유
- 관련 스포츠 사이트와 협력
- 백링크 확보

## 4. 모니터링

검색엔진 등록 후 다음을 정기적으로 확인하세요:
- 색인 생성 상태 (Google Search Console)
- 검색 성능 (클릭수, 노출수)
- 크롤링 오류
- 모바일 사용성

일반적으로 검색엔진에 사이트가 완전히 색인되는 데는 며칠에서 몇 주가 걸릴 수 있습니다.
