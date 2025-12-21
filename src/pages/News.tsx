import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";
import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface AlihNews {
  id: number;
  title: string;
  origin_url: string;
  created_at: string;
  summary: string;
  published_at: string;
  language: string;
}

const News = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const itemsPerPage = 10;

  const { data: allNews, isLoading } = useQuery({
    queryKey: ['alih-news'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_news')
        .select('*')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as AlihNews[];
    },
    staleTime: 1000 * 60 * 30, // 30분 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
  });

  const filteredNews = allNews?.filter(news => 
    selectedLanguage === "all" ? true : news.language === selectedLanguage
  ) || [];

  const displayedItemsCount = currentPage * itemsPerPage;
  const paginatedNews = filteredNews.slice(0, displayedItemsCount);
  const hasMore = filteredNews.length > displayedItemsCount;

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setCurrentPage(1);
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'ko': return '한국어';
      case 'ja': return '일본어';
      case 'en': return '영어';
      default: return lang;
    }
  };

  // 뉴스 페이지용 구조화 데이터
  const newsStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "아시아리그 아이스하키 뉴스",
    "description": "아시아리그 아이스하키 2025-26 시즌 최신 뉴스와 소식",
    "url": "https://alhockey.fans/news",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": paginatedNews.slice(0, 5).map((news, index) => ({
        "@type": "NewsArticle",
        "position": index + 1,
        "headline": news.title,
        "description": news.summary,
        "datePublished": news.published_at,
        "url": news.origin_url,
        "inLanguage": news.language
      }))
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://alhockey.fans" },
      { "@type": "ListItem", "position": 2, "name": "뉴스", "item": "https://alhockey.fans/news" }
    ]
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO 
        title="아시아리그 뉴스 - 최신 소식, 경기 분석, 선수 인터뷰 | 2025-26 시즌"
        description="아시아리그 아이스하키 2025-26 시즌 최신 뉴스, 경기 분석, 선수 인터뷰, 팀 소식을 실시간으로 확인. 한국어, 일본어, 영어 뉴스 제공. HL안양, 홋카이도 레드이글스 등 모든 팀 소식."
        keywords="아시아리그 아이스하키 뉴스, 아시아리그 뉴스, 아이스하키 뉴스, 경기 분석, 선수 인터뷰, 아시아리그 소식, HL안양 뉴스, 안양한라 소식, 홋카이도 레드이글스 뉴스, 도호쿠 프리블레이즈 소식, 닛코 아이스벅스 뉴스, 요코하마 그리츠 소식, 스타즈 고베 뉴스, 아이스하키 트레이드, 선수 이적, 시즌 프리뷰"
        path="/news"
        structuredData={[newsStructuredData, breadcrumbData]}
      />
      <PageHeader title="아시아리그 뉴스" subtitle="2025-26 소식" />
      
      <div className="container mx-auto px-4">
        <Tabs value={selectedLanguage} onValueChange={handleLanguageChange} className="mb-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="ko">한국어 뉴스</TabsTrigger>
            <TabsTrigger value="ja">일본어 뉴스</TabsTrigger>
            <TabsTrigger value="en">영어 뉴스</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : paginatedNews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">뉴스가 없습니다</div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {paginatedNews.map((item) => (
                <Card 
                  key={item.id} 
                  className="p-4 border-border hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => window.open(item.origin_url, '_blank')}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {getLanguageLabel(item.language)}
                    </Badge>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  <h3 className="text-base font-semibold mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.summary}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(new Date(item.published_at), 'PPP', { locale: ko })}</span>
                  </div>
                </Card>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="w-full py-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-sm font-medium"
                >
                  더 보기 ▼
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default News;
