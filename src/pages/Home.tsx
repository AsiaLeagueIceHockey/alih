import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, PlayCircle, Trophy, Newspaper, Coffee } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { useTeams } from "@/hooks/useTeams";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SEO from "@/components/SEO";
import type { CarouselApi } from "@/components/ui/carousel";

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

interface ScheduleGame {
  id: number;
  game_no: number;
  home_alih_team_id: number;
  away_alih_team_id: number;
  home_alih_team_score: number | null;
  away_alih_team_score: number | null;
  match_at: string;
  match_place: string;
  highlight_url: string | null;
  highlight_title: string | null;
}

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

  const { data: schedules } = useQuery({
    queryKey: ['alih-schedules'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_schedule')
        .select('*')
        .order('match_at', { ascending: true });
      
      if (error) throw error;
      return data as ScheduleGame[];
    },
    staleTime: 1000 * 60 * 60, // 1시간 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: alihTeams } = useQuery({
    queryKey: ['alih-teams-standings'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_teams')
        .select('english_name, name, logo');
      
      if (error) throw error;
      return data as AlihTeam[];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24시간 동안 캐시
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일 동안 메모리에 유지
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: teamStandings } = useQuery({
    queryKey: ['team-standings-home'],
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

  const { data: latestNews } = useQuery({
    queryKey: ['latest-news'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data as AlihNews[];
    },
    staleTime: 1000 * 60 * 30, // 30분 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const getTeamById = (teamId: number) => {
    if (!teams) return null;
    return teams.find(t => t.id === teamId);
  };

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match?.[1] || null;
  };

  const now = new Date();
  
  // 다음 경기: 미래의 가장 가까운 날짜의 모든 경기
  const nextGame = schedules?.find(game => new Date(game.match_at) > now);
  const nextGames = schedules?.filter(game => {
    if (!nextGame) return false;
    const gameDate = new Date(game.match_at).toDateString();
    const nextGameDate = new Date(nextGame.match_at).toDateString();
    return gameDate === nextGameDate;
  }) || [];

  // 최근 결과: 과거의 가장 최근 날짜의 모든 완료된 경기
  const completedGames = schedules?.filter(game => 
    new Date(game.match_at) < now && 
    game.home_alih_team_score !== null && 
    game.away_alih_team_score !== null
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
    "@type": "SportsOrganization",
    "name": "아시아리그 아이스하키",
    "sport": "Ice Hockey",
    "url": "https://alih.lovable.app",
    "description": "아시아리그 아이스하키 2025-26 시즌 - 경기 일정, 결과, 영상, 순위, 스탯, 뉴스를 한 곳에서",
    "memberOf": {
      "@type": "SportsLeague",
      "name": "Asia League Ice Hockey"
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO 
        title="아시아리그 아이스하키 - 2025-26 시즌"
        description="아시아리그 아이스하키 2025-26 시즌 경기 일정, 실시간 결과, 하이라이트 영상, 팀 순위, 선수 스탯, 최신 뉴스를 한눈에 확인하세요."
        keywords="아시아리그, 아이스하키, ALIH, HL 안양, 레드 이글스 홋카이도, 도호쿠 프리 블레이즈, 2025-26 시즌, 경기 일정, 하이라이트"
        path="/"
        structuredData={structuredData}
      />
      <PageHeader title="아시아리그 아이스하키" subtitle="2025-26 시즌" />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Next Game */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">다음 경기</h2>
            {nextGames.length > 1 && (
              <Badge variant="outline" className="text-xs ml-auto">
                {nextGames.length}경기
              </Badge>
            )}
          </div>
          {nextGames.length === 0 ? (
            <Card className="p-4 border-border">
              <p className="text-sm text-muted-foreground text-center">예정된 경기가 없습니다</p>
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
                  {new Date(nextGames[0].match_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} · {new Date(nextGames[0].match_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </Badge>
                <Badge className="text-xs bg-accent">예정</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  {getTeamById(nextGames[0].home_alih_team_id)?.logo ? (
                    <img 
                      src={getTeamById(nextGames[0].home_alih_team_id)!.logo} 
                      alt={getTeamById(nextGames[0].home_alih_team_id)!.name}
                      className="w-12 h-12 object-contain mx-auto mb-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-sm font-bold">{getTeamById(nextGames[0].home_alih_team_id)?.name || '미정'}</p>
                </div>
                <div className="text-2xl font-bold text-muted-foreground px-4">VS</div>
                <div className="text-center flex-1">
                  {getTeamById(nextGames[0].away_alih_team_id)?.logo ? (
                    <img 
                      src={getTeamById(nextGames[0].away_alih_team_id)!.logo} 
                      alt={getTeamById(nextGames[0].away_alih_team_id)!.name}
                      className="w-12 h-12 object-contain mx-auto mb-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-sm font-bold">{getTeamById(nextGames[0].away_alih_team_id)?.name || '미정'}</p>
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
                          {new Date(game.match_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} · {new Date(game.match_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                        <Badge className="text-xs bg-accent">예정</Badge>
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
                        </div>
                        <div className="text-2xl font-bold text-muted-foreground px-4">VS</div>
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
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      index === nextGamesIndex ? 'bg-primary' : 'bg-muted'
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
            <h2 className="text-lg font-bold">최근 결과</h2>
            {recentGames.length > 1 && (
              <Badge variant="outline" className="text-xs ml-auto">
                {recentGames.length}경기
              </Badge>
            )}
          </div>
          {recentGames.length === 0 ? (
            <Card className="p-4 border-border">
              <p className="text-sm text-muted-foreground text-center">최근 결과가 없습니다</p>
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
                  {new Date(recentGames[0].match_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </Badge>
                <Badge variant="outline" className="text-xs">종료</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  {getTeamById(recentGames[0].home_alih_team_id)?.logo ? (
                    <img 
                      src={getTeamById(recentGames[0].home_alih_team_id)!.logo} 
                      alt={getTeamById(recentGames[0].home_alih_team_id)!.name}
                      className="w-12 h-12 object-contain mx-auto mb-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-sm font-bold">{getTeamById(recentGames[0].home_alih_team_id)?.name || '미정'}</p>
                  <p className="text-2xl font-bold text-primary mt-1">{recentGames[0].home_alih_team_score}</p>
                </div>
                <div className="text-xl font-bold text-muted-foreground px-4">:</div>
                <div className="text-center flex-1">
                  {getTeamById(recentGames[0].away_alih_team_id)?.logo ? (
                    <img 
                      src={getTeamById(recentGames[0].away_alih_team_id)!.logo} 
                      alt={getTeamById(recentGames[0].away_alih_team_id)!.name}
                      className="w-12 h-12 object-contain mx-auto mb-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-sm font-bold">{getTeamById(recentGames[0].away_alih_team_id)?.name || '미정'}</p>
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
                          {new Date(game.match_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                        </Badge>
                        <Badge variant="outline" className="text-xs">종료</Badge>
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
                          <p className="text-2xl font-bold text-primary mt-1">{game.home_alih_team_score}</p>
                        </div>
                        <div className="text-xl font-bold text-muted-foreground px-4">:</div>
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
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      index === recentGamesIndex ? 'bg-primary' : 'bg-muted'
                    }`} 
                  />
                ))}
              </div>
            </Carousel>
          )}
        </section>

        {/* Support Banner */}
        <button 
          onClick={() => {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
              window.open('https://qr.kakaopay.com/FQqvZxoia9c405515', '_blank');
            } else {
              window.open('/images/kakaopay-qr.jpg', '_blank');
            }
          }}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[hsl(48,100%,50%)]/20 hover:bg-[hsl(48,100%,50%)]/30 rounded-lg transition-colors w-full"
        >
          <Coffee className="w-5 h-5 text-[hsl(48,100%,35%)]" />
          <span className="text-sm font-medium text-[hsl(48,100%,25%)]">개발자에게 커피 한 잔 후원하기</span>
        </button>

        {/* League Standings Preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">리그 순위</h2>
            </div>
            <a href="/standings" className="text-xs text-primary hover:underline" aria-label="리그 순위 전체 보기">
              전체 순위 보기
            </a>
          </div>
          {!topThreeStandings ? (
            <Card className="p-4 border-border">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </Card>
          ) : (
            <Card className="p-4 border-border">
              <div className="space-y-3">
                {topThreeStandings.map((standing) => (
                  <div key={standing.rank} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary w-6">{standing.rank}</span>
                      <div className="flex items-center gap-2">
                        {standing.team?.logo && (
                          <img 
                            src={standing.team.logo} 
                            alt={standing.team.name}
                            className="w-5 h-5 object-contain"
                            loading="lazy"
                          />
                        )}
                        <span className="text-sm">{standing.team?.name}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold">{standing.points}P</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        {/* Latest News */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">최신 뉴스</h2>
            </div>
            <a href="/news" className="text-xs text-primary hover:underline" aria-label="뉴스 전체 보기">
              전체 뉴스 보기
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
            <h2 className="text-lg font-bold">최신 하이라이트</h2>
          </div>
          {!latestHighlight ? (
            <Card className="p-4 border-border">
              <p className="text-sm text-muted-foreground text-center">하이라이트가 없습니다</p>
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
