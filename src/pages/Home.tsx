import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, PlayCircle, Trophy, Newspaper } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { useTeams } from "@/hooks/useTeams";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  team: { name: string };
  teamLogo: { medium: string };
  stats: { PTS: number };
}

interface AlihTeam {
  english_name: string;
  name: string;
  logo: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { data: teams } = useTeams();

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
    staleTime: 1000 * 60 * 60, // 1시간 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
  });

  const { data: teamStandings } = useQuery({
    queryKey: ['team-standings-home'],
    queryFn: async () => {
      const response = await fetch(
        'https://widget.eliteprospects.com/api/league/asia-league?season=2025-2026'
      );
      const data = await response.json();
      return data.data as TeamStanding[];
    },
    staleTime: 1000 * 60 * 60, // 1시간 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
  });

  const getTeamById = (teamId: number) => {
    if (!teams) return null;
    return teams.find(t => t.id === teamId);
  };

  const getTeamName = (englishName: string) => {
    const team = alihTeams?.find(
      t => t.english_name.toLowerCase() === englishName.toLowerCase()
    );
    return team?.name || englishName;
  };

  const getTeamLogo = (englishName: string) => {
    const team = alihTeams?.find(
      t => t.english_name.toLowerCase() === englishName.toLowerCase()
    );
    return team?.logo || '';
  };

  const getYoutubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    const videoId = match?.[1] || null;
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  };

  const now = new Date();
  const nextGame = schedules?.find(game => new Date(game.match_at) > now);
  const recentGame = schedules?.filter(game => 
    new Date(game.match_at) < now && 
    game.home_alih_team_score !== null && 
    game.away_alih_team_score !== null
  ).reverse()[0];
  
  const latestHighlight = schedules?.filter(game => 
    game.highlight_url && game.highlight_url.trim() !== ''
  ).reverse()[0];

  const topThreeStandings = teamStandings?.slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="아시아리그 아이스하키" subtitle="2025-26 시즌" />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Next Game */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">다음 경기</h2>
          </div>
          {!nextGame ? (
            <Card className="p-4 border-border">
              <p className="text-sm text-muted-foreground text-center">예정된 경기가 없습니다</p>
            </Card>
          ) : (
            <Card className="p-4 shadow-card-glow border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="text-xs">
                  {new Date(nextGame.match_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} · {new Date(nextGame.match_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </Badge>
                <Badge className="text-xs bg-accent">예정</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  {getTeamById(nextGame.home_alih_team_id)?.logo ? (
                    <img 
                      src={getTeamById(nextGame.home_alih_team_id)!.logo} 
                      alt={getTeamById(nextGame.home_alih_team_id)!.name}
                      className="w-12 h-12 object-contain mx-auto mb-2"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-sm font-bold">{getTeamById(nextGame.home_alih_team_id)?.name || '미정'}</p>
                </div>
                <div className="text-2xl font-bold text-muted-foreground px-4">VS</div>
                <div className="text-center flex-1">
                  {getTeamById(nextGame.away_alih_team_id)?.logo ? (
                    <img 
                      src={getTeamById(nextGame.away_alih_team_id)!.logo} 
                      alt={getTeamById(nextGame.away_alih_team_id)!.name}
                      className="w-12 h-12 object-contain mx-auto mb-2"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-sm font-bold">{getTeamById(nextGame.away_alih_team_id)?.name || '미정'}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">{nextGame.match_place}</p>
            </Card>
          )}
        </section>

        {/* Recent Result */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">최근 결과</h2>
          </div>
          {!recentGame ? (
            <Card className="p-4 border-border">
              <p className="text-sm text-muted-foreground text-center">최근 결과가 없습니다</p>
            </Card>
          ) : (
            <Card 
              className="p-4 border-border cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/schedule/${recentGame.game_no}`, {
                state: {
                  homeTeam: getTeamById(recentGame.home_alih_team_id),
                  awayTeam: getTeamById(recentGame.away_alih_team_id),
                  matchDate: recentGame.match_at
                }
              })}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="text-xs">
                  {new Date(recentGame.match_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </Badge>
                <Badge variant="outline" className="text-xs">종료</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  {getTeamById(recentGame.home_alih_team_id)?.logo ? (
                    <img 
                      src={getTeamById(recentGame.home_alih_team_id)!.logo} 
                      alt={getTeamById(recentGame.home_alih_team_id)!.name}
                      className="w-12 h-12 object-contain mx-auto mb-2"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-sm font-bold">{getTeamById(recentGame.home_alih_team_id)?.name || '미정'}</p>
                  <p className="text-2xl font-bold text-primary mt-1">{recentGame.home_alih_team_score}</p>
                </div>
                <div className="text-xl font-bold text-muted-foreground px-4">:</div>
                <div className="text-center flex-1">
                  {getTeamById(recentGame.away_alih_team_id)?.logo ? (
                    <img 
                      src={getTeamById(recentGame.away_alih_team_id)!.logo} 
                      alt={getTeamById(recentGame.away_alih_team_id)!.name}
                      className="w-12 h-12 object-contain mx-auto mb-2"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-sm font-bold">{getTeamById(recentGame.away_alih_team_id)?.name || '미정'}</p>
                  <p className="text-2xl font-bold mt-1">{recentGame.away_alih_team_score}</p>
                </div>
              </div>
            </Card>
          )}
        </section>

        {/* League Standings Preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">리그 순위</h2>
            </div>
            <a href="/standings" className="text-xs text-primary hover:underline">
              전체 보기
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
                {topThreeStandings.map((standing, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary w-6">{index + 1}</span>
                      <div className="flex items-center gap-2">
                        {getTeamLogo(standing.team.name) && (
                          <img 
                            src={getTeamLogo(standing.team.name)} 
                            alt={getTeamName(standing.team.name)}
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span className="text-sm">{getTeamName(standing.team.name)}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold">{standing.stats.PTS}P</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        {/* Latest News */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">최신 뉴스</h2>
          </div>
          <div className="space-y-3">
            {[
              { title: "HL 안양, 홈 3연승으로 2위 굳히기", source: "HL안양 공홈", time: "2시간 전" },
              { title: "아시아리그 올스타전 일정 발표", source: "ALIH", time: "5시간 전" },
              { title: "레드 이글스 홋카이도 선두 질주", source: "ALIH", time: "1일 전" },
            ].map((news, i) => (
              <Card key={i} className="p-3 border-border hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm font-medium mb-1">{news.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{news.source}</span>
                  <span>·</span>
                  <span>{news.time}</span>
                </div>
              </Card>
            ))}
          </div>
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
            <Card className="overflow-hidden border-border">
              <div className="aspect-video bg-secondary/50 relative">
                {latestHighlight.highlight_url && (
                  <img 
                    src={getYoutubeThumbnail(latestHighlight.highlight_url)} 
                    alt={latestHighlight.highlight_title || "하이라이트"}
                    className="w-full h-full object-cover"
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
    </div>
  );
};

export default Home;
