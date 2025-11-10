import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { useTeams } from "@/hooks/useTeams";
import { Loader2 } from "lucide-react";

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

interface ScheduleGame {
  id: number;
  date: string;
  time: string;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  status: string;
  venue: string;
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

  const { data: teams, isLoading: teamsLoading } = useTeams();

  const { data: schedules, isLoading: schedulesLoading, error } = useQuery({
    queryKey: ['alih-schedules'],
    queryFn: async () => {
      console.log('🔵 Supabase 연결 시도: alih_schedule 테이블 조회');
      
      const { data, error } = await externalSupabase
        .from('alih_schedule')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) {
        console.error('❌ Supabase 에러 (alih_schedule):', error);
        throw error;
      }
      
      console.log('✅ alih_schedule 연결 성공! 조회된 경기 수:', data?.length || 0);
      console.log('📊 일정 데이터:', data);
      
      return data as ScheduleGame[];
    }
  });

  const getTeamName = (englishName: string) => {
    if (!teams) return englishName;
    const team = teams.find(t => t.english_name.toLowerCase() === englishName.toLowerCase());
    return team ? team.name : englishName;
  };

  const getTeamLogo = (englishName: string) => {
    if (!teams) return null;
    const team = teams.find(t => t.english_name.toLowerCase() === englishName.toLowerCase());
    return team?.logo || null;
  };

  const filteredGames = useMemo(() => {
    if (!schedules) return [];
    
    return schedules.filter(game => {
      const gameDate = new Date(game.date);
      const gameMonth = gameDate.getMonth() + 1;
      const gameYear = gameDate.getFullYear();
      
      const monthFilter = MONTHS[selectedMonth];
      const monthMatch = gameMonth === monthFilter.value && gameYear === monthFilter.year;
      
      if (!monthMatch) return false;
      
      if (selectedTeam) {
        return game.home_team === selectedTeam || game.away_team === selectedTeam;
      }
      
      return true;
    });
  }, [schedules, selectedMonth, selectedTeam]);

  const isLoading = teamsLoading || schedulesLoading;

  return (
    <div className="min-h-screen bg-background pb-20">
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
              const homeTeamLogo = getTeamLogo(game.home_team);
              const awayTeamLogo = getTeamLogo(game.away_team);
              
              return (
                <Card key={game.id} className="p-4 border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm">
                      <span className="font-medium">{new Date(game.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</span>
                      <span className="text-muted-foreground ml-2">{game.time}</span>
                    </div>
                    <Badge 
                      variant={game.status === "예정" ? "default" : "outline"}
                      className={game.status === "예정" ? "bg-accent" : ""}
                    >
                      {game.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex flex-col items-center">
                      {awayTeamLogo && (
                        <img src={awayTeamLogo} alt={game.away_team} className="w-12 h-12 object-contain mb-2" />
                      )}
                      <p className="text-sm font-medium mb-1">{getTeamName(game.away_team)}</p>
                      {game.away_score !== undefined && (
                        <p className="text-2xl font-bold">{game.away_score}</p>
                      )}
                    </div>

                    <div className="px-4">
                      {game.status === "예정" ? (
                        <span className="text-lg font-bold text-muted-foreground">VS</span>
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">:</span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      {homeTeamLogo && (
                        <img src={homeTeamLogo} alt={game.home_team} className="w-12 h-12 object-contain mb-2" />
                      )}
                      <p className="text-sm font-medium mb-1">{getTeamName(game.home_team)}</p>
                      {game.home_score !== undefined && (
                        <p className="text-2xl font-bold">{game.home_score}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mt-3">{game.venue}</p>
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
