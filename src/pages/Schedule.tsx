import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { useTeams } from "@/hooks/useTeams";
import { Loader2, Video, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";

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
  game_status: string | null;
}

const MONTHS = [
  { value: 9, label: "9월", year: 2025 },
  { value: 10, label: "10월", year: 2025 },
  { value: 11, label: "11월", year: 2025 },
  { value: 12, label: "12월", year: 2025 },
  { value: 1, label: "1월", year: 2026 },
  { value: 2, label: "2월", year: 2026 },
  { value: 3, label: "3월", year: 2026 },
  { value: 4, label: "4월", year: 2026 },
];

const Schedule = () => {
  const navigate = useNavigate();
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // 현재 월에 해당하는 MONTHS 인덱스 찾기
  const currentMonthIndex = MONTHS.findIndex(
    m => m.value === currentMonth && m.year === currentYear
  );
  const defaultMonth = currentMonthIndex >= 0 ? currentMonthIndex : 0;
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);

  const { data: teams, isLoading: teamsLoading } = useTeams();

  const { data: schedules, isLoading: schedulesLoading, error } = useQuery({
    queryKey: ['alih-schedules'],
    queryFn: async () => {
      console.log('🔵 Supabase 연결 시도: alih_schedule 테이블 조회');
      
      const { data, error } = await externalSupabase
        .from('alih_schedule')
        .select('*')
        .order('match_at', { ascending: true });
      
      if (error) {
        console.error('❌ Supabase 에러 (alih_schedule):', error);
        throw error;
      }
      
      console.log('✅ alih_schedule 연결 성공! 조회된 경기 수:', data?.length || 0);
      console.log('📊 일정 데이터:', data);
      
      return data as ScheduleGame[];
    },
    staleTime: 1000 * 60 * 60, // 1시간 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
  });

  const getTeamById = (teamId: number) => {
    if (!teams) return null;
    return teams.find(t => t.id === teamId);
  };

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match?.[1] || null;
  };

  const filteredGames = useMemo(() => {
    if (!schedules || !teams) return [];
    
    return schedules.filter(game => {
      const gameDate = new Date(game.match_at);
      const gameMonth = gameDate.getMonth() + 1;
      const gameYear = gameDate.getFullYear();
      
      const monthFilter = MONTHS[selectedMonth];
      const monthMatch = gameMonth === monthFilter.value && gameYear === monthFilter.year;
      
      if (!monthMatch) return false;
      
      if (selectedTeam) {
        const homeTeam = getTeamById(game.home_alih_team_id);
        const awayTeam = getTeamById(game.away_alih_team_id);
        return homeTeam?.english_name === selectedTeam || awayTeam?.english_name === selectedTeam;
      }
      
      return true;
    });
  }, [schedules, selectedMonth, selectedTeam, teams]);

  const isLoading = teamsLoading || schedulesLoading;

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO 
        title="아시아리그 경기 일정 - 2025-26 시즌"
        description="아시아리그 아이스하키 2025-26 시즌 전체 경기 일정을 확인하세요. 월별 경기 일정, 팀별 일정, 하이라이트 영상을 제공합니다."
        keywords="아시아리그 일정, 아이스하키 경기 일정, ALIH 스케줄, 경기 결과, 하이라이트"
        path="/schedule"
      />
      <PageHeader title="경기 일정 / 결과" subtitle="2025-26 시즌 전체 경기" />
      
      <div className="container mx-auto px-4">
        {/* 월별 필터 */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {MONTHS.map((month, index) => (
              <Button
                key={index}
                variant={selectedMonth === index ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMonth(index)}
                className="whitespace-nowrap"
              >
                {month.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 팀별 필터 */}
        {teamsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={selectedTeam === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTeam(null)}
                className="whitespace-nowrap"
              >
                팀 전체
              </Button>
              {teams?.map((team) => (
                <Button
                  key={team.id}
                  variant={selectedTeam === team.english_name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTeam(team.english_name)}
                  className="whitespace-nowrap flex items-center gap-2"
                >
                  {team.logo && (
                    <img src={team.logo} alt={team.name} className="w-4 h-4 object-contain" />
                  )}
                  {team.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 경기 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">일정 로딩 중...</span>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-12">
            <p className="font-semibold">일정을 불러오는데 실패했습니다</p>
            <p className="text-sm text-muted-foreground mt-2">콘솔을 확인해주세요</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">해당 조건의 경기가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGames.map((game) => {
              const homeTeam = getTeamById(game.home_alih_team_id);
              const awayTeam = getTeamById(game.away_alih_team_id);
              const matchDate = new Date(game.match_at);
              const now = new Date();
              const hasScore = game.home_alih_team_score !== null && game.away_alih_team_score !== null;
              const hasHighlight = game.highlight_url && game.highlight_url.trim() !== '';
              const isExpanded = expandedGameId === game.id;
              
              // 게임 상태 계산
              const getGameStatus = () => {
                if (game.game_status === 'Game Finished') return "종료";
                if (matchDate <= now) return "진행 중";
                return "예정";
              };
              const gameStatus = getGameStatus();
              
              return (
                <Card 
                  key={game.id} 
                  className="p-4 border-border relative cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    navigate(`/schedule/${game.game_no}`, { 
                      state: { 
                        homeTeam, 
                        awayTeam,
                        matchDate: game.match_at
                      } 
                    });
                  }}
                >
                  {/* 우측 상단 배지와 버튼 */}
                  <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                    {hasHighlight && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedGameId(isExpanded ? null : game.id);
                        }}
                      >
                        <Video className={`h-3.5 w-3.5 mr-1.5 ${isExpanded ? 'text-primary' : ''}`} />
                        영상
                      </Button>
                    )}
                    <Badge 
                      variant={gameStatus === "예정" ? "default" : "outline"}
                      className={gameStatus === "예정" ? "bg-accent" : gameStatus === "진행 중" ? "bg-destructive text-destructive-foreground animate-pulse" : ""}
                    >
                      {gameStatus}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm">
                      <span className="font-medium">
                        {matchDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {matchDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex flex-col items-center">
                      {homeTeam?.logo && (
                        <img src={homeTeam.logo} alt={homeTeam.name} className="w-12 h-12 object-contain mb-2" />
                      )}
                      <p className="text-sm font-medium mb-1">{homeTeam?.name || '미정'}</p>
                      {hasScore && (
                        <p className={`text-2xl font-bold ${gameStatus === "진행 중" ? "text-destructive" : ""}`}>{game.home_alih_team_score}</p>
                      )}
                    </div>

                    <div className="px-4">
                      {!hasScore ? (
                        <span className="text-lg font-bold text-muted-foreground">VS</span>
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">:</span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      {awayTeam?.logo && (
                        <img src={awayTeam.logo} alt={awayTeam.name} className="w-12 h-12 object-contain mb-2" />
                      )}
                      <p className="text-sm font-medium mb-1">{awayTeam?.name || '미정'}</p>
                      {hasScore && (
                        <p className={`text-2xl font-bold ${gameStatus === "진행 중" ? "text-destructive" : ""}`}>{game.away_alih_team_score}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mt-3">{game.match_place}</p>

                  {isExpanded && hasHighlight && game.highlight_url && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="aspect-video w-full rounded-lg overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${getYoutubeVideoId(game.highlight_url)}`}
                          title={game.highlight_title || "경기 하이라이트"}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                      {game.highlight_title && (
                        <p className="text-sm font-medium mt-2">{game.highlight_title}</p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
