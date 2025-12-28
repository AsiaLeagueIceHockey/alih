import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Trophy, Target } from "lucide-react";

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

interface Player {
  id: number;
  name: string;
  jersey_number: string;
  team_id: number;
  goals: number;
  assists: number;
  points: number;
}

interface Team {
  id: number;
  name: string;
  logo: string;
}

const InstagramWeeklyStats = () => {
  // 전체 선수 데이터
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['instagram-weekly-players'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_players')
        .select('*')
        .order('points', { ascending: false });
      if (error) throw error;
      return data as Player[];
    },
  });

  // 팀 데이터
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['instagram-weekly-teams'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_teams')
        .select('id, name, logo');
      if (error) throw error;
      return data as Team[];
    },
  });

  const isLoading = playersLoading || teamsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!players || !teams) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  const getTeam = (teamId: number) => teams.find(t => t.id === teamId);

  // Top 5 득점자
  const topScorers = [...players]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  // Top 5 어시스트
  const topAssisters = [...players]
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 5);

  // 현재 날짜 표시
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // 월요일
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // 일요일

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  return (
    <div 
      className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden"
      style={{ 
        width: '1080px', 
        height: '1350px',
        maxWidth: '100vw',
        maxHeight: '100vh',
        aspectRatio: '4/5',
      }}
    >
      {/* 배경 장식 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-10">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <p className="text-primary/80 text-2xl tracking-[0.3em] font-light mb-4">
            ASIA LEAGUE ICE HOCKEY
          </p>
          <h1 className="text-white text-5xl font-bold tracking-wider mb-4">
            WEEKLY LEADERS
          </h1>
          <p className="text-slate-400 text-xl">
            시즌 누적 기록
          </p>
        </div>

        {/* 메인 컨텐츠 - 좌우 분할 */}
        <div className="flex-1 grid grid-cols-2 gap-8">
          {/* 왼쪽: 득점 순위 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-white text-2xl font-bold">TOP SCORERS</h2>
                <p className="text-slate-400 text-sm">득점 순위</p>
              </div>
            </div>

            <div className="space-y-4">
              {topScorers.map((player, index) => {
                const team = getTeam(player.team_id);
                return (
                  <div 
                    key={player.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      index === 0 
                        ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30' 
                        : 'bg-slate-700/30'
                    }`}
                  >
                    {/* 순위 */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-yellow-500 text-slate-900' :
                      index === 1 ? 'bg-slate-400 text-slate-900' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-600 text-white'
                    }`}>
                      {index + 1}
                    </div>

                    {/* 팀 로고 */}
                    {team && (
                      <img 
                        src={team.logo} 
                        alt={team.name} 
                        className="w-10 h-10 object-contain"
                      />
                    )}

                    {/* 선수 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-lg truncate">
                        {player.name}
                      </div>
                      <div className="text-slate-400 text-sm">
                        #{player.jersey_number} · {team?.name}
                      </div>
                    </div>

                    {/* 득점 수 */}
                    <div className="text-right">
                      <div className="text-yellow-500 text-3xl font-bold">
                        {player.goals}
                      </div>
                      <div className="text-slate-400 text-xs">GOALS</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 오른쪽: 어시스트 순위 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-white text-2xl font-bold">TOP ASSISTS</h2>
                <p className="text-slate-400 text-sm">도움 순위</p>
              </div>
            </div>

            <div className="space-y-4">
              {topAssisters.map((player, index) => {
                const team = getTeam(player.team_id);
                return (
                  <div 
                    key={player.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      index === 0 
                        ? 'bg-gradient-to-r from-blue-500/20 to-transparent border border-blue-500/30' 
                        : 'bg-slate-700/30'
                    }`}
                  >
                    {/* 순위 */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-blue-500 text-white' :
                      index === 1 ? 'bg-slate-400 text-slate-900' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-600 text-white'
                    }`}>
                      {index + 1}
                    </div>

                    {/* 팀 로고 */}
                    {team && (
                      <img 
                        src={team.logo} 
                        alt={team.name} 
                        className="w-10 h-10 object-contain"
                      />
                    )}

                    {/* 선수 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-lg truncate">
                        {player.name}
                      </div>
                      <div className="text-slate-400 text-sm">
                        #{player.jersey_number} · {team?.name}
                      </div>
                    </div>

                    {/* 어시스트 수 */}
                    <div className="text-right">
                      <div className="text-blue-500 text-3xl font-bold">
                        {player.assists}
                      </div>
                      <div className="text-slate-400 text-xs">ASSISTS</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full px-8 py-4">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
            <span className="text-slate-300 text-xl font-medium">
              @alhockey_fans
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramWeeklyStats;
