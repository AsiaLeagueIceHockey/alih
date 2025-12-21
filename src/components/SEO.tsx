import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  path?: string;
  structuredData?: object;
  noindex?: boolean;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
  };
}

const SEO = ({ 
  title, 
  description, 
  keywords = "아시아리그 아이스하키, 아시아리그, 아이스하키, HL안양, 안양한라, 홋카이도 레드이글스, 도호쿠 프리블레이즈, 닛코 아이스벅스, 요코하마 그리츠, 스타즈 고베, HL ANYANG, RED EAGLES HOKKAIDO, TOHOKU FREE BLADES, NIKKO ICEBUCKS, YOKOHAMA GRITS, STARS KOBE, 경기 일정, 순위, 하이라이트, 실시간 경기, ALIH",
  ogImage = "https://alhockey.fans/og-image.png",
  path = "",
  structuredData,
  noindex = false,
  article
}: SEOProps) => {
  const siteUrl = "https://alhockey.fans";
  const fullUrl = `${siteUrl}${path}`;
  const siteName = "아시아리그 아이스하키";
  const fullTitle = title.includes("아시아리그") ? title : `${title} | 아시아리그 아이스하키`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* 기본 메타 태그 */}
      <meta name="author" content="alhockey_fans" />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="googlebot" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <meta name="language" content="ko" />
      <meta name="revisit-after" content="1 days" />
      <meta name="rating" content="general" />
      
      {/* 지역/언어 태그 */}
      <meta name="geo.region" content="KR" />
      <meta name="geo.placename" content="South Korea" />
      <meta name="content-language" content="ko-KR" />
      
      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={article ? "article" : "website"} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content="ko_KR" />
      
      {/* Article 메타 (뉴스, 경기 결과 등) */}
      {article?.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
      {article?.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
      {article?.section && <meta property="article:section" content={article.section} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@alhockeyfans" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* Canonical & hreflang */}
      <link rel="canonical" href={fullUrl} />
      <link rel="alternate" hrefLang="ko" href={fullUrl} />
      <link rel="alternate" hrefLang="x-default" href={fullUrl} />
      
      {/* Theme & App */}
      <meta name="theme-color" content="#0a0a0a" />
      <meta name="apple-mobile-web-app-title" content="아시아리그하키" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
