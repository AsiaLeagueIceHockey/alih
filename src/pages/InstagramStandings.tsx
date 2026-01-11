import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

interface Standing {
  id: number;
  team_id: number;
  rank: number;
  games_played: number;
  points: number;
  team?: {
    name: string;
    logo: string;
  };
}

const InstagramStandings = () => {
  // 순위 데이터
  const { data: standings, isLoading } = useQuery({
    queryKey: ['instagram-standings'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_standings')
        .select('*, team:alih_teams(name, logo)')
        .order('rank', { ascending: true });
      if (error) throw error;
      return data as Standing[];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!standings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  // 현재 날짜
  const now = new Date();
  const formattedDate = now.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
      </div>

      <div className="relative z-10 flex flex-col h-full p-12">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <p className="text-primary/80 text-3xl tracking-[0.3em] font-light mb-6">
            ASIA LEAGUE ICE HOCKEY
          </p>
          <h1 className="text-white text-7xl font-bold tracking-wider mb-6">
            STANDINGS
          </h1>
          <p className="text-slate-400 text-2xl">
            {formattedDate} 기준
          </p>
        </div>

        {/* 순위표 - 간소화 */}
        <div className="flex-1 bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="grid grid-cols-12 gap-4 px-10 py-6 bg-slate-700/50 text-slate-300 text-xl font-medium">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-7 pl-4">팀</div>
            <div className="col-span-2 text-center">경기</div>
            <div className="col-span-2 text-center font-bold text-primary">P</div>
          </div>

          {/* 팀 순위 */}
          <div className="divide-y divide-slate-700/50">
            {standings.map((standing, index) => {
              return (
                <div 
                  key={standing.id}
                  className={`grid grid-cols-12 gap-4 px-10 py-8 items-center transition-all ${
                    index === 0 
                      ? 'bg-gradient-to-r from-yellow-500/20 to-transparent' 
                      : index < 4
                        ? 'bg-gradient-to-r from-green-500/10 to-transparent'
                        : ''
                  }`}
                >
                  {/* 순위 */}
                  <div className="col-span-1 text-center">
                    <span className={`text-4xl font-bold ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-slate-300' :
                      index === 2 ? 'text-amber-600' :
                      'text-slate-400'
                    }`}>
                      {standing.rank}
                    </span>
                  </div>

                  {/* 팀 정보 */}
                  <div className="col-span-7 flex items-center gap-5 pl-4">
                    {standing.team && (
                      <img 
                        src={standing.team.logo} 
                        alt={standing.team.name} 
                        className="w-16 h-16 object-contain"
                      />
                    )}
                    <span className="text-white font-bold text-2xl truncate">
                      {standing.team?.name}
                    </span>
                  </div>

                  {/* 경기 수 */}
                  <div className="col-span-2 text-center text-slate-300 text-2xl">
                    {standing.games_played}
                  </div>

                  {/* 승점 */}
                  <div className="col-span-2 text-center">
                    <span className="text-4xl font-bold text-primary">
                      {standing.points}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 범례 */}
        <div className="mt-8 flex justify-center gap-10 text-lg text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-yellow-500/50 rounded" />
            <span>1위</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-500/30 rounded" />
            <span>플레이오프 진출권</span>
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-8 text-center">
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

export default InstagramStandings;
