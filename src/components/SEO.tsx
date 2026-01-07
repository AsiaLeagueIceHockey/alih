import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

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
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  
  const siteUrl = "https://alhockey.fans";
  const fullUrl = `${siteUrl}${path}`;
  
  // Language-specific site names
  const siteNames: Record<string, string> = {
    ko: "아시아리그 아이스하키",
    ja: "アジアリーグアイスホッケー",
    en: "Asia League Ice Hockey"
  };
  const siteName = siteNames[currentLang] || siteNames.ko;
  
  // Language-specific title suffix
  const suffixes: Record<string, string> = {
    ko: "아시아리그 아이스하키",
    ja: "アジアリーグ",
    en: "Asia League Ice Hockey"
  };
  const suffix = suffixes[currentLang] || suffixes.ko;
  const fullTitle = title.includes("아시아리그") || title.includes("Asia League") || title.includes("アジアリーグ") 
    ? title 
    : `${title} | ${suffix}`;

  // Language to locale mapping
  const locales: Record<string, string> = {
    ko: "ko_KR",
    ja: "ja_JP",
    en: "en_US"
  };
  const ogLocale = locales[currentLang] || locales.ko;

  // Content language mapping
  const contentLangs: Record<string, string> = {
    ko: "ko-KR",
    ja: "ja-JP",
    en: "en-US"
  };
  const contentLang = contentLangs[currentLang] || contentLangs.ko;

  return (
    <Helmet>
      <html lang={currentLang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* 기본 메타 태그 */}
      <meta name="author" content="alhockey_fans" />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="googlebot" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <meta name="language" content={currentLang} />
      <meta name="revisit-after" content="1 days" />
      <meta name="rating" content="general" />
      
      {/* 지역/언어 태그 */}
      <meta name="geo.region" content={currentLang === 'ja' ? 'JP' : currentLang === 'en' ? 'US' : 'KR'} />
      <meta name="geo.placename" content={currentLang === 'ja' ? 'Japan' : currentLang === 'en' ? 'United States' : 'South Korea'} />
      <meta name="content-language" content={contentLang} />
      
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
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content="ko_KR" />
      <meta property="og:locale:alternate" content="ja_JP" />
      <meta property="og:locale:alternate" content="en_US" />
      
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
      <link rel="alternate" hrefLang="ja" href={fullUrl} />
      <link rel="alternate" hrefLang="en" href={fullUrl} />
      <link rel="alternate" hrefLang="x-default" href={fullUrl} />
      
      {/* Theme & App */}
      <meta name="theme-color" content="#0a0a0a" />
      <meta name="apple-mobile-web-app-title" content={currentLang === 'ja' ? 'ALIHホッケー' : currentLang === 'en' ? 'ALIH Hockey' : '아시아리그하키'} />
      
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

