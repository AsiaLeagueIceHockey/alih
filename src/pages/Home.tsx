import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, PlayCircle, Trophy, Newspaper, Coffee, Instagram, Heart } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { useTeams } from "@/hooks/useTeams";
import { useSchedules, ScheduleGame } from "@/hooks/useSchedules";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ko, ja, enUS } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SEO from "@/components/SEO";
import type { CarouselApi } from "@/components/ui/carousel";
import { useTranslation } from "react-i18next";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";

interface TeamStanding {
  rank: number;
  team_id: number;
  games_played: number;
  points: number;
  win_60min: number;
  win_ot: number;
  win_pss: number;
  lose_pss: number;
  lose_ot: number;
  lose_60min: number;
  goals_for: number;
  goals_against: number;
  team?: AlihTeam;
}

interface AlihTeam {
  english_name: string;
  japanese_name?: string;
  name: string;
  logo: string;
}

interface AlihNews {
  id: number;
  title: string;
  origin_url: string;
  created_at: string;
  summary: string;
  published_at: string;
  language: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { data: teams } = useTeams();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  
  // Date locale helper
  const getDateLocale = () => {
    switch (currentLang) {
      case 'ja': return ja;
      case 'en': return enUS;
      default: return ko;
    }
  };
  
  const [selectedHighlight, setSelectedHighlight] = useState<{ url: string; title: string } | null>(null);
  const [nextGamesApi, setNextGamesApi] = useState<CarouselApi>();
  const [recentGamesApi, setRecentGamesApi] = useState<CarouselApi>();
  const [nextGamesIndex, setNextGamesIndex] = useState(0);
  const [recentGamesIndex, setRecentGamesIndex] = useState(0);

  useEffect(() => {
    if (!nextGamesApi) return;

    setNextGamesIndex(nextGamesApi.selectedScrollSnap());

    nextGamesApi.on("select", () => {
      setNextGamesIndex(nextGamesApi.selectedScrollSnap());
    });
  }, [nextGamesApi]);

  useEffect(() => {
    if (!recentGamesApi) return;

    setRecentGamesIndex(recentGamesApi.selectedScrollSnap());

    recentGamesApi.on("select", () => {
      setRecentGamesIndex(recentGamesApi.selectedScrollSnap());
    });
  }, [recentGamesApi]);

  const { data: schedules } = useSchedules();

  const { data: alihTeams } = useQuery({
    queryKey: ['alih-teams-standings'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_teams')
        .select('english_name, japanese_name, name, logo');

      if (error) throw error;
      return data as AlihTeam[];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24시간 동안 캐시
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일 동안 메모리에 유지
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: teamStandings } = useQuery({
    queryKey: ['team-standings'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_standings')
        .select('*, team:alih_teams(name, logo, english_name)')
        .order('rank', { ascending: true });

      if (error) throw error;

      return (data || []).map(standing => ({
        ...standing,
        team: standing.team as unknown as AlihTeam
      })) as TeamStanding[];
    },
    staleTime: 1000 * 60 * 30, // 30분 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: allNews } = useQuery({
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

  // 홈에서는 최신 3개만 표시
  const latestNews = allNews?.slice(0, 3);

  const getTeamById = (teamId: number) => {
    if (!teams) return null;
    return teams.find(t => t.id === teamId);
  };

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match?.[1] || null;
  };

  const getGameStatus = (game: ScheduleGame) => {
    if (game.game_status === 'Game Finished') return t('game.status.finished');
    const matchDateObj = new Date(game.match_at);
    const now = new Date();
    if (matchDateObj <= now) return t('game.status.inProgress');
    return t('game.status.scheduled');
  };

  const now = new Date();

  // 진행 중인 경기: match_at <= now && game_status !== 'Game Finished'
  const inProgressGames = schedules?.filter(game => {
    const matchDate = new Date(game.match_at);
    return matchDate <= now && game.game_status !== 'Game Finished';
  }) || [];

  // 다음 경기: 미래의 가장 가까운 날짜의 모든 경기
  const nextGame = schedules?.find(game => new Date(game.match_at) > now);
  const nextGames = schedules?.filter(game => {
    if (!nextGame) return false;
    const gameDate = new Date(game.match_at).toDateString();
    const nextGameDate = new Date(nextGame.match_at).toDateString();
    return gameDate === nextGameDate;
  }) || [];

  // 최근 결과: game_status === 'Game Finished'인 경기 중 가장 최근 날짜
  const completedGames = schedules?.filter(game =>
    game.game_status === 'Game Finished'
  ).reverse() || [];

  const recentGame = completedGames[0];
  const recentGames = completedGames.filter(game => {
    if (!recentGame) return false;
    const gameDate = new Date(game.match_at).toDateString();
    const recentGameDate = new Date(recentGame.match_at).toDateString();
    return gameDate === recentGameDate;
  });

  const latestHighlight = schedules?.filter(game =>
    game.highlight_url && game.highlight_url.trim() !== ''
  ).reverse()[0];

  const topThreeStandings = teamStandings;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "아시아리그 아이스하키",
    "alternateName": ["Asia League Ice Hockey", "아시아리그하키"],
    "url": "https://alhockey.fans",
    "description": "아시아리그 아이스하키 2025-26 시즌 - 경기 일정, 실시간 스코어, 하이라이트 영상, 팀 순위, 선수 스탯, 최신 뉴스를 한 곳에서",
    "inLanguage": "ko-KR",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://alhockey.fans/schedule?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "아시아리그 아이스하키",
      "logo": {
        "@type": "ImageObject",
        "url": "https://alhockey.fans/og-image.png"
      }
    },
    "sameAs": [
      "https://www.instagram.com/alhockey_fans"
    ]
  };

  // 메인 페이지용 BreadcrumbList
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "홈",
      "item": "https://alhockey.fans"
    }]
  };

  const combinedStructuredData = [structuredData, breadcrumbData];

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO
        title="아시아리그 아이스하키 - 경기 일정, 실시간 스코어, 하이라이트 | 2025-26 시즌"
        description="아시아리그 아이스하키 2025-26 시즌 경기 일정, 실시간 결과, 하이라이트 영상, 팀 순위, 선수 스탯, 최신 뉴스를 한눈에 확인하세요. HL안양, 홋카이도 레드이글스, 도호쿠 프리블레이즈 등 전 팀 정보 제공."
        keywords="아시아리그 아이스하키, 아시아리그, 아이스하키, 2025-26 시즌, HL안양, 안양한라, 홋카이도 레드이글스, 도호쿠 프리블레이즈, 닛코 아이스벅스, 요코하마 그리츠, 스타즈 고베, HL ANYANG, RED EAGLES HOKKAIDO, TOHOKU FREE BLADES, NIKKO ICEBUCKS, YOKOHAMA GRITS, STARS KOBE, 경기 일정, 경기 결과, 실시간 스코어, 하이라이트 영상, 팀 순위, 승점, 선수 스탯, 득점 순위, 도움 순위, 아이스하키 뉴스, ALIH"
        path="/"
        structuredData={combinedStructuredData}
      />
      <PageHeader title={t('page.home.title')} subtitle={t('page.home.subtitle')} />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* In Progress Games */}
        {inProgressGames.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
              <h2 className="text-lg font-bold">{t('section.inProgress')}</h2>
              {inProgressGames.length > 1 && (
                <Badge variant="outline" className="text-xs ml-auto">
                  {inProgressGames.length}{t('game.games')}
                </Badge>
              )}
            </div>
            <div className="space-y-3">
              {inProgressGames.map((game) => (
                <Card
                  key={game.id}
                  className="p-4 shadow-card-glow border-primary/20 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate(`/schedule/${game.game_no}`, {
                    state: {
                      homeTeam: getTeamById(game.home_alih_team_id),
                      awayTeam: getTeamById(game.away_alih_team_id),
                      matchDate: game.match_at
                    }
                  })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {new Date(game.match_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} · {new Date(game.match_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </Badge>
                    <Badge className="text-xs bg-destructive animate-pulse">
                      진행 중
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      {getTeamById(game.home_alih_team_id)?.logo ? (
                        <img
                          src={getTeamById(game.home_alih_team_id)!.logo}
                          alt={getTeamById(game.home_alih_team_id)!.name}
                          className="w-12 h-12 object-contain mx-auto mb-2"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                      )}
                      <p className="text-sm font-bold">{getTeamById(game.home_alih_team_id)?.name || '미정'}</p>
                      {game.home_alih_team_score !== null && (
                        <p className="text-2xl font-bold mt-1 text-destructive">
                          {game.home_alih_team_score}
                        </p>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-muted-foreground px-4">
                      {game.home_alih_team_score !== null ? ":" : "VS"}
                    </div>
                    <div className="text-center flex-1">
                      {getTeamById(game.away_alih_team_id)?.logo ? (
                        <img
                          src={getTeamById(game.away_alih_team_id)!.logo}
                          alt={getTeamById(game.away_alih_team_id)!.name}
                          className="w-12 h-12 object-contain mx-auto mb-2"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                      )}
                      <p className="text-sm font-bold">{getTeamById(game.away_alih_team_id)?.name || '미정'}</p>
                      {game.away_alih_team_score !== null && (
                        <p className="text-2xl font-bold mt-1 text-destructive">
                          {game.away_alih_team_score}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3">{game.match_place}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Next Game */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">{t('section.nextGame')}</h2>
            {nextGames.length > 1 && (
              <Badge variant="outline" className="text-xs ml-auto">
                {nextGames.length}{t('game.games')}
              </Badge>
            )}
          </div>
          {nextGames.length === 0 ? (
            <Card className="p-4 border-border">
              <p className="text-sm text-muted-foreground text-center">{t('game.noGames')}</p>
            </Card>
          ) : nextGames.length === 1 ? (
            <Card
              className="p-4 shadow-card-glow border-primary/20 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/schedule/${nextGames[0].game_no}`, {
                state: {
                  homeTeam: getTeamById(nextGames[0].home_alih_team_id),
                  awayTeam: getTeamById(nextGames[0].away_alih_team_id),
                  matchDate: nextGames[0].match_at
                }
              })}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="text-xs">
                  {format(new Date(nextGames[0].match_at), 'PPP p', { locale: getDateLocale() })}
                </Badge>
                <Badge className={`text-xs ${getGameStatus(nextGames[0]) === t('game.status.inProgress') ? "bg-destructive animate-pulse" : "bg-accent"}`}>
                  {getGameStatus(nextGames[0])}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  {getTeamById(nextGames[0].home_alih_team_id)?.logo ? (
                    <img
                      src={getTeamById(nextGames[0].home_alih_team_id)!.logo}
                      alt={getLocalizedTeamName(getTeamById(nextGames[0].home_alih_team_id), currentLang)}
                      className="w-12 h-12 object-contain mx-auto mb-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-sm font-bold">{getLocalizedTeamName(getTeamById(nextGames[0].home_alih_team_id), currentLang) || t('game.pending')}</p>
                  {nextGames[0].home_alih_team_score !== null && (
                    <p className={`text-2xl font-bold mt-1 ${getGameStatus(nextGames[0]) === t('game.status.inProgress') ? "text-destructive" : ""}`}>
                      {nextGames[0].home_alih_team_score}
                    </p>
                  )}
                </div>
                <div className="text-2xl font-bold text-muted-foreground px-4">
                  {nextGames[0].home_alih_team_score !== null ? ":" : "VS"}
                </div>
                <div className="text-center flex-1">
                  {getTeamById(nextGames[0].away_alih_team_id)?.logo ? (
                    <img
                      src={getTeamById(nextGames[0].away_alih_team_id)!.logo}
                      alt={getLocalizedTeamName(getTeamById(nextGames[0].away_alih_team_id), currentLang)}
                      className="w-12 h-12 object-contain mx-auto mb-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-sm font-bold">{getLocalizedTeamName(getTeamById(nextGames[0].away_alih_team_id), currentLang) || t('game.pending')}</p>
                  {nextGames[0].away_alih_team_score !== null && (
                    <p className={`text-2xl font-bold mt-1 ${getGameStatus(nextGames[0]) === t('game.status.inProgress') ? "text-destructive" : ""}`}>
                      {nextGames[0].away_alih_team_score}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">{nextGames[0].match_place}</p>
            </Card>
          ) : (
            <Carousel className="w-full" setApi={setNextGamesApi}>
              <CarouselContent>
                {nextGames.map((game) => (
                  <CarouselItem key={game.id}>
                    <Card
                      className="p-4 shadow-card-glow border-primary/20 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => navigate(`/schedule/${game.game_no}`, {
                        state: {
                          homeTeam: getTeamById(game.home_alih_team_id),
                          awayTeam: getTeamById(game.away_alih_team_id),
                          matchDate: game.match_at
                        }
                      })}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {format(new Date(game.match_at), 'PPP p', { locale: getDateLocale() })}
                        </Badge>
                        <Badge className={`text-xs ${getGameStatus(game) === t('game.status.inProgress') ? "bg-destructive animate-pulse" : "bg-accent"}`}>
                          {getGameStatus(game)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          {getTeamById(game.home_alih_team_id)?.logo ? (
                            <img
                              src={getTeamById(game.home_alih_team_id)!.logo}
                              alt={getLocalizedTeamName(getTeamById(game.home_alih_team_id), currentLang)}
                              className="w-12 h-12 object-contain mx-auto mb-2"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                          )}
                          <p className="text-sm font-bold">{getLocalizedTeamName(getTeamById(game.home_alih_team_id), currentLang) || t('game.pending')}</p>
                          {game.home_alih_team_score !== null && (
                            <p className={`text-2xl font-bold mt-1 ${getGameStatus(game) === t('game.status.inProgress') ? "text-destructive" : ""}`}>
                              {game.home_alih_team_score}
                            </p>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-muted-foreground px-4">
                          {game.home_alih_team_score !== null ? ":" : "VS"}
                        </div>
                        <div className="text-center flex-1">
                          {getTeamById(game.away_alih_team_id)?.logo ? (
                            <img
                              src={getTeamById(game.away_alih_team_id)!.logo}
                              alt={getLocalizedTeamName(getTeamById(game.away_alih_team_id), currentLang)}
                              className="w-12 h-12 object-contain mx-auto mb-2"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                          )}
                          <p className="text-sm font-bold">{getLocalizedTeamName(getTeamById(game.away_alih_team_id), currentLang) || t('game.pending')}</p>
                          {game.away_alih_team_score !== null && (
                            <p className={`text-2xl font-bold mt-1 ${getGameStatus(game) === t('game.status.inProgress') ? "text-destructive" : ""}`}>
                              {game.away_alih_team_score}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-3">{game.match_place}</p>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-1 mt-3">
                {nextGames.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${index === nextGamesIndex ? 'bg-primary' : 'bg-muted'
                      }`}
                  />
                ))}
              </div>
            </Carousel>
          )}
        </section>

        {/* Recent Result */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">{t('section.recentResults')}</h2>
            {recentGames.length > 1 && (
              <Badge variant="outline" className="text-xs ml-auto">
                {recentGames.length}{t('game.games')}
              </Badge>
            )}
          </div>
          {recentGames.length === 0 ? (
            <Card className="p-4 border-border">
              <p className="text-sm text-muted-foreground text-center">{t('game.noResults')}</p>
            </Card>
          ) : recentGames.length === 1 ? (
            <Card
              className="p-4 border-border cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/schedule/${recentGames[0].game_no}`, {
                state: {
                  homeTeam: getTeamById(recentGames[0].home_alih_team_id),
                  awayTeam: getTeamById(recentGames[0].away_alih_team_id),
                  matchDate: recentGames[0].match_at
                }
              })}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="text-xs">
                  {format(new Date(recentGames[0].match_at), 'M/d', { locale: getDateLocale() })}
                </Badge>
                <Badge variant="outline" className="text-xs">{t('game.status.finished')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  {getTeamById(recentGames[0].home_alih_team_id)?.logo ? (
                    <img
                      src={getTeamById(recentGames[0].home_alih_team_id)!.logo}
                      alt={getLocalizedTeamName(getTeamById(recentGames[0].home_alih_team_id), currentLang)}
                      className="w-12 h-12 object-contain mx-auto mb-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-sm font-bold">{getLocalizedTeamName(getTeamById(recentGames[0].home_alih_team_id), currentLang) || t('game.pending')}</p>
                  <p className="text-2xl font-bold text-primary mt-1">{recentGames[0].home_alih_team_score}</p>
                </div>
                <div className="text-xl font-bold text-muted-foreground px-4">:</div>
                <div className="text-center flex-1">
                  {getTeamById(recentGames[0].away_alih_team_id)?.logo ? (
                    <img
                      src={getTeamById(recentGames[0].away_alih_team_id)!.logo}
                      alt={getLocalizedTeamName(getTeamById(recentGames[0].away_alih_team_id), currentLang)}
                      className="w-12 h-12 object-contain mx-auto mb-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-sm font-bold">{getLocalizedTeamName(getTeamById(recentGames[0].away_alih_team_id), currentLang) || t('game.pending')}</p>
                  <p className="text-2xl font-bold mt-1">{recentGames[0].away_alih_team_score}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Carousel className="w-full" setApi={setRecentGamesApi}>
              <CarouselContent>
                {recentGames.map((game) => (
                  <CarouselItem key={game.id}>
                    <Card
                      className="p-4 border-border cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => navigate(`/schedule/${game.game_no}`, {
                        state: {
                          homeTeam: getTeamById(game.home_alih_team_id),
                          awayTeam: getTeamById(game.away_alih_team_id),
                          matchDate: game.match_at
                        }
                      })}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {format(new Date(game.match_at), 'M/d', { locale: getDateLocale() })}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{t('game.status.finished')}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          {getTeamById(game.home_alih_team_id)?.logo ? (
                            <img
                              src={getTeamById(game.home_alih_team_id)!.logo}
                              alt={getLocalizedTeamName(getTeamById(game.home_alih_team_id), currentLang)}
                              className="w-12 h-12 object-contain mx-auto mb-2"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                          )}
                          <p className="text-sm font-bold">{getLocalizedTeamName(getTeamById(game.home_alih_team_id), currentLang) || t('game.pending')}</p>
                          <p className="text-2xl font-bold text-primary mt-1">{game.home_alih_team_score}</p>
                        </div>
                        <div className="text-xl font-bold text-muted-foreground px-4">:</div>
                        <div className="text-center flex-1">
                          {getTeamById(game.away_alih_team_id)?.logo ? (
                            <img
                              src={getTeamById(game.away_alih_team_id)!.logo}
                              alt={getLocalizedTeamName(getTeamById(game.away_alih_team_id), currentLang)}
                              className="w-12 h-12 object-contain mx-auto mb-2"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                          )}
                          <p className="text-sm font-bold">{getLocalizedTeamName(getTeamById(game.away_alih_team_id), currentLang) || t('game.pending')}</p>
                          <p className="text-2xl font-bold mt-1">{game.away_alih_team_score}</p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-1 mt-3">
                {recentGames.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${index === recentGamesIndex ? 'bg-primary' : 'bg-muted'
                      }`}
                  />
                ))}
              </div>
            </Carousel>
          )}
        </section>

        {/* Official Channel Card */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">{t('section.joinUs')}</h2>
          </div>
          <Card className="p-4 border-border">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="gap-2 h-auto py-3 flex-col"
                onClick={() => window.open('https://www.instagram.com/alhockey_fans', '_blank')}
              >
                <Instagram className="w-5 h-5 text-pink-500" />
                <span className="text-xs">@alhockey_fans</span>
              </Button>
              <Button
                variant="outline"
                className="gap-2 h-auto py-3 flex-col"
                onClick={() => {
                  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                  if (isMobile) {
                    window.open('https://qr.kakaopay.com/FQqvZxoia9c405515', '_blank');
                  } else {
                    window.open('/images/kakaopay-qr.jpg', '_blank');
                  }
                }}
              >
                <Coffee className="w-5 h-5 text-amber-600" />
                <span className="text-xs">{t('button.donate')}</span>
              </Button>
            </div>
          </Card>
        </section>

        {/* League Standings Preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">{t('section.leagueStandings')}</h2>
            </div>
            <a href="/standings" className="text-xs text-primary hover:underline">
              {t('button.viewAllStandings')}
            </a>
          </div>
          {!topThreeStandings ? (
            <Card className="p-4 border-border">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="p-3 text-left font-semibold">#</th>
                    <th className="p-3 text-left font-semibold">{t('standings.headers.team')}</th>
                    <th className="p-3 text-center font-semibold">{t('standings.headers.gamesPlayed')}</th>
                    <th className="p-3 text-center font-semibold">{t('standings.headers.points')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topThreeStandings.map((standing) => (
                    <tr
                      key={standing.rank}
                      className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer"
                      onClick={() => navigate(`/team/${standing.team_id}`)}
                    >
                      <td className="p-3 font-bold text-primary">{standing.rank}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {standing.team?.logo && (
                            <img
                              src={standing.team.logo}
                              alt={getLocalizedTeamName(standing.team, currentLang)}
                              className="w-5 h-5 object-contain"
                              loading="lazy"
                            />
                          )}
                          <span className="font-medium hover:text-primary transition-colors">{getLocalizedTeamName(standing.team, currentLang)}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">{standing.games_played}</td>
                      <td className="p-3 text-center font-bold text-primary">{standing.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </section>

        {/* Latest News */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">{t('section.latestNews')}</h2>
            </div>
            <a href="/news" className="text-xs text-primary hover:underline">
              {t('button.viewAllNews')}
            </a>
          </div>
          {!latestNews ? (
            <Card className="p-4 border-border">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {latestNews.map((news) => (
                <Card
                  key={news.id}
                  className="p-3 border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => window.open(news.origin_url, '_blank')}
                >
                  <p className="text-sm font-medium mb-1 line-clamp-2">{news.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(new Date(news.published_at), 'PPP', { locale: ko })}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Latest Highlight */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <PlayCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">{t('section.latestHighlight')}</h2>
          </div>
          {!latestHighlight ? (
            <Card className="p-4 border-border">
              <p className="text-sm text-muted-foreground text-center">{t('game.noHighlights')}</p>
            </Card>
          ) : (
            <Card
              className="overflow-hidden border-border cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                if (latestHighlight.highlight_url) {
                  setSelectedHighlight({
                    url: latestHighlight.highlight_url,
                    title: latestHighlight.highlight_title || `${getTeamById(latestHighlight.home_alih_team_id)?.name} vs ${getTeamById(latestHighlight.away_alih_team_id)?.name} 하이라이트`
                  });
                }
              }}
            >
              <div className="aspect-video bg-secondary/50 relative">
                {latestHighlight.highlight_url && (
                  <img
                    src={`https://img.youtube.com/vi/${getYoutubeVideoId(latestHighlight.highlight_url)}/maxresdefault.jpg`}
                    alt={latestHighlight.highlight_title || "하이라이트"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="w-16 h-16 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium">
                  {latestHighlight.highlight_title || `${getTeamById(latestHighlight.home_alih_team_id)?.name} vs ${getTeamById(latestHighlight.away_alih_team_id)?.name} 하이라이트`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Asia League Ice Hockey · {new Date(latestHighlight.match_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </p>
              </div>
            </Card>
          )}
        </section>
      </div>

      {/* YouTube Embed Dialog */}
      <Dialog open={!!selectedHighlight} onOpenChange={() => setSelectedHighlight(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedHighlight?.title}</DialogTitle>
          </DialogHeader>
          {selectedHighlight && (
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedHighlight.url)}`}
                title={selectedHighlight.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-md"
              ></iframe>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
