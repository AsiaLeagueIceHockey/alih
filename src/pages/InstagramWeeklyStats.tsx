import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'goals'; // 'goals' or 'assists'
  const isGoals = type === 'goals';

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

  // Top 5 득점자 또는 어시스트
  const topPlayers = isGoals
    ? [...players].sort((a, b) => b.goals - a.goals).slice(0, 5)
    : [...players].sort((a, b) => b.assists - a.assists).slice(0, 5);

  // 현재 날짜 표시
  const now = new Date();
  const formattedDate = now.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 타입별 설정
  const config = isGoals
    ? {
        title: 'TOP SCORERS',
        subtitle: '득점 순위',
        statLabel: 'GOALS',
        icon: Trophy,
        iconColor: 'text-yellow-500',
        iconBg: 'bg-yellow-500/20',
        accentColor: 'text-yellow-500',
        topBg: 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30',
        topBadgeBg: 'bg-yellow-500 text-slate-900',
        getStat: (p: Player) => p.goals,
      }
    : {
        title: 'TOP ASSISTS',
        subtitle: '도움 순위',
        statLabel: 'ASSISTS',
        icon: Target,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/20',
        accentColor: 'text-blue-500',
        topBg: 'bg-gradient-to-r from-blue-500/20 to-transparent border-blue-500/30',
        topBadgeBg: 'bg-blue-500 text-white',
        getStat: (p: Player) => p.assists,
      };

  const IconComponent = config.icon;

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

      <div className="relative z-10 flex flex-col h-full p-12">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <p className="text-primary/80 text-3xl tracking-[0.3em] font-light mb-6">
            ASIA LEAGUE ICE HOCKEY
          </p>
          <div className="flex items-center justify-center gap-5 mb-6">
            <div className={`w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center`}>
              <IconComponent className={`w-10 h-10 ${config.iconColor}`} />
            </div>
            <h1 className="text-white text-6xl font-bold tracking-wider">
              {config.title}
            </h1>
          </div>
          <p className="text-slate-400 text-2xl">
            시즌 누적 기록 · {formattedDate} 기준
          </p>
        </div>

        {/* 메인 컨텐츠 - 풀 페이지 */}
        <div className="flex-1 bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-8">
          <div className="space-y-6">
            {topPlayers.map((player, index) => {
              const team = getTeam(player.team_id);
              return (
                <div 
                  key={player.id}
                  className={`flex items-center gap-6 p-6 rounded-2xl transition-all ${
                    index === 0 
                      ? `${config.topBg} border` 
                      : 'bg-slate-700/30'
                  }`}
                >
                  {/* 순위 */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-3xl ${
                    index === 0 ? config.topBadgeBg :
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
                      className="w-16 h-16 object-contain"
                    />
                  )}

                  {/* 선수 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-3xl truncate mb-1">
                      {player.name}
                    </div>
                    <div className="text-slate-400 text-xl">
                      #{player.jersey_number} · {team?.name}
                    </div>
                  </div>

                  {/* 스탯 수 */}
                  <div className="text-right">
                    <div className={`${config.accentColor} text-6xl font-bold`}>
                      {config.getStat(player)}
                    </div>
                    <div className="text-slate-400 text-lg">{config.statLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full px-10 py-5">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
            <span className="text-slate-300 text-2xl font-medium">
              @alhockey_fans
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramWeeklyStats;
