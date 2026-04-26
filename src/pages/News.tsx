import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";
import { useState } from "react";
import { format } from "date-fns";
import { ko, ja, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTeams } from "@/hooks/useTeams";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";

interface AlihNews {
  id: number;
  title: string;
  origin_url: string;
  created_at: string;
  summary: string;
  published_at: string;
  language: string;
}

interface AlihVideo {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  team_english_name: string | null;
  tags: string[];
  published_at: string;
}

const News = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 탭 상태: URL 파라미터로 관리 (공유 시 탭 유지)
  const activeTab = searchParams.get("tab") || "news";
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // --- 뉴스 관련 상태 ---
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const itemsPerPage = 10;

  // --- 영상 관련 상태 ---
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [videoPage, setVideoPage] = useState(1);

  const { data: teams } = useTeams();

  const { data: allNews, isLoading: newsLoading } = useQuery({
    queryKey: ['alih-news'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_news')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as AlihNews[];
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const { data: allVideos, isLoading: videosLoading } = useQuery({
    queryKey: ['alih-videos'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_videos')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as AlihVideo[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24,
  });

  // --- 뉴스 필터링 ---
  const filteredNews = allNews?.filter(news =>
    selectedLanguage === "all" ? true : news.language === selectedLanguage
  ) || [];

  const displayedItemsCount = currentPage * itemsPerPage;
  const paginatedNews = filteredNews.slice(0, displayedItemsCount);
  const hasMoreNews = filteredNews.length > displayedItemsCount;

  // --- 영상 필터링 ---
  const filteredVideos = allVideos?.filter(video => {
    if (!selectedTeam) return true;
    return video.team_english_name === selectedTeam;
  }) || [];

  const videosPerPage = 12;
  const displayedVideosCount = videoPage * videosPerPage;
  const paginatedVideos = filteredVideos.slice(0, displayedVideosCount);
  const hasMoreVideos = filteredVideos.length > displayedVideosCount;

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setCurrentPage(1);
  };

  const getLanguageLabel = (lang: string) => {
    return t(`news.language.${lang}`);
  };

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ja': return ja;
      case 'en': return enUS;
      default: return ko;
    }
  };

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match?.[1] || null;
  };

  const getYoutubeThumbnail = (url: string) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  const getTeamByEnglishName = (englishName: string | null) => {
    if (!englishName || !teams) return null;
    return teams.find(t => t.english_name === englishName);
  };

  // --- SEO ---
  const newsStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "아시아리그 아이스하키 뉴스",
    "description": "아시아리그 아이스하키 2025-26 시즌 최신 뉴스와 영상",
    "url": "https://alhockey.fans/news",
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": t('nav.home'), "item": "https://alhockey.fans" },
      { "@type": "ListItem", "position": 2, "name": t('nav.news'), "item": "https://alhockey.fans/news" }
    ]
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO
        title="아시아리그 뉴스 & 영상 - 최신 소식, 팀 영상 콘텐츠 | 2025-26 시즌"
        description="아시아리그 아이스하키 2025-26 시즌 최신 뉴스, 팀 영상, 다큐멘터리, 인터뷰를 실시간으로 확인. 한국어, 일본어, 영어 뉴스 제공."
        keywords="아시아리그 아이스하키 뉴스, 아시아리그 영상, 아이스하키 뉴스, 팀 다큐, 스타즈 고베 영상, HL안양 뉴스, 홋카이도 레드이글스 뉴스"
        path="/news"
        structuredData={[newsStructuredData, breadcrumbData]}
      />
      <PageHeader title={t('page.news.title')} subtitle={t('page.news.subtitle')} />

      <div className="container mx-auto px-4">
        {/* 뉴스 / 영상 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="news">{t('page.videos.tabNews')}</TabsTrigger>
            <TabsTrigger value="videos">{t('page.videos.tabVideos')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* === 뉴스 탭 === */}
        {activeTab === "news" && (
          <>
            <Tabs value={selectedLanguage} onValueChange={handleLanguageChange} className="mb-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">{t('filter.all')}</TabsTrigger>
                <TabsTrigger value="ko">{t('filter.koreanNews')}</TabsTrigger>
                <TabsTrigger value="ja">{t('filter.japaneseNews')}</TabsTrigger>
                <TabsTrigger value="en">{t('filter.englishNews')}</TabsTrigger>
              </TabsList>
            </Tabs>

            {newsLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t('game.loading')}</div>
            ) : paginatedNews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t('game.noNews')}</div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {paginatedNews.map((item) => (
                    <Card
                      key={item.id}
                      className="p-4 border-border hover:border-primary/50 transition-all cursor-pointer group"
                      onClick={() => window.open(item.origin_url, '_blank', 'noopener,noreferrer')}
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
                        <span>{format(new Date(item.published_at), 'PPP', { locale: getDateLocale() })}</span>
                      </div>
                    </Card>
                  ))}
                </div>

                {hasMoreNews && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      {t('button.loadMore')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* === 영상 탭 === */}
        {activeTab === "videos" && (
          <>
            {/* 팀별 필터 */}
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  variant={selectedTeam === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedTeam(null); setVideoPage(1); }}
                  className="whitespace-nowrap"
                >
                  {t('page.videos.allTeams')}
                </Button>
                {teams?.map((team) => (
                  <Button
                    key={team.id}
                    variant={selectedTeam === team.english_name ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setSelectedTeam(team.english_name); setVideoPage(1); }}
                    className="whitespace-nowrap flex items-center gap-2"
                  >
                    {team.logo && (
                      <img src={team.logo} alt={getLocalizedTeamName(team, i18n.language)} className="w-4 h-4 object-contain" />
                    )}
                    {getLocalizedTeamName(team, i18n.language)}
                  </Button>
                ))}
              </div>
            </div>

            {videosLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">{t('loading.videos')}</span>
              </div>
            ) : paginatedVideos.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>{t('page.videos.noVideos')}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedVideos.map((video) => {
                    const team = getTeamByEnglishName(video.team_english_name);
                    const publishDate = new Date(video.published_at);

                    return (
                      <Card
                        key={video.id}
                        className="overflow-hidden cursor-pointer transition-all border-border hover:border-primary/50 hover:shadow-lg group"
                        onClick={() => navigate(`/videos/${video.id}`)}
                      >
                        <div className="relative aspect-video bg-secondary">
                          <img
                            src={getYoutubeThumbnail(video.youtube_url) || ''}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 text-primary-foreground ml-0.5" fill="currentColor" />
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          {team && (
                            <div className="flex items-center gap-1.5 mb-2">
                              {team.logo && (
                                <img src={team.logo} alt={getLocalizedTeamName(team, i18n.language)} className="w-4 h-4 object-contain" />
                              )}
                              <span className="text-xs text-muted-foreground font-medium">
                                {getLocalizedTeamName(team, i18n.language)}
                              </span>
                            </div>
                          )}
                          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {video.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {format(publishDate, 'PPP', { locale: getDateLocale() })}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {hasMoreVideos && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setVideoPage(p => p + 1)}
                    >
                      {t('button.loadMore')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default News;
