import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { AlihTeam } from "@/hooks/useTeams";

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

interface LiveData {
  scores_by_period: {
    '1p': { home: number | null; away: number | null };
    '2p': { home: number | null; away: number | null };
    '3p': { home: number | null; away: number | null };
    ovt: { home: number | null; away: number | null };
    pss: { home: number | null; away: number | null };
  };
}

interface ScheduleData {
  id: number;
  game_no: number;
  home_alih_team_id: number;
  away_alih_team_id: number;
  home_alih_team_score: number | null;
  away_alih_team_score: number | null;
  match_at: string;
  match_place: string;
  game_status: string | null;
  live_data: LiveData | null;
}

interface GameSummary {
  period_1: { score: string };
  period_2: { score: string };
  period_3: { score: string };
  overtime?: { score: string };
  shootout?: { score: string };
}

interface GameDetailData {
  game_no: number;
  game_summary: GameSummary;
}

const InstagramScore = () => {
  const [searchParams] = useSearchParams();
  const gameNo = searchParams.get('game_no');

  // 스케줄 데이터
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['instagram-schedule', gameNo],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_schedule')
        .select('*')
        .eq('game_no', gameNo)
        .maybeSingle();
      if (error) throw error;
      return data as ScheduleData;
    },
    enabled: !!gameNo,
  });

  // 팀 정보
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['instagram-teams', scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_teams')
        .select('*')
        .in('id', [scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id]);
      if (error) throw error;
      return data as AlihTeam[];
    },
    enabled: !!scheduleData,
  });

  // 경기 상세 (피리어드별 스코어)
  const { data: gameDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['instagram-game-detail', gameNo],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_game_details')
        .select('game_no, game_summary')
        .eq('game_no', gameNo)
        .maybeSingle();
      if (error) throw error;
      return data as GameDetailData | null;
    },
    enabled: !!gameNo,
  });

  const homeTeam = teamsData?.find(t => t.id === scheduleData?.home_alih_team_id);
  const awayTeam = teamsData?.find(t => t.id === scheduleData?.away_alih_team_id);

  const isLoading = scheduleLoading || teamsLoading || detailLoading;

  if (!gameNo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">game_no 파라미터가 필요합니다</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!scheduleData || !homeTeam || !awayTeam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">경기 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  const matchDate = new Date(scheduleData.match_at);
  const formattedDate = matchDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  const formattedTime = matchDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 피리어드별 스코어 가져오기
  const getPeriodScores = () => {
    // score 문자열 파싱 헬퍼 (형식: "0 : 0" 또는 "0-0")
    const parseScore = (scoreStr: string): [number, number] => {
      const parts = scoreStr.includes(':') 
        ? scoreStr.split(':').map(s => parseInt(s.trim(), 10))
        : scoreStr.split('-').map(s => parseInt(s.trim(), 10));
      return [parts[0] || 0, parts[1] || 0];
    };

    if (gameDetail?.game_summary) {
      const gs = gameDetail.game_summary;
      const periods = [];
      
      if (gs.period_1) {
        const [home, away] = parseScore(gs.period_1.score);
        periods.push({ label: '1P', home, away });
      }
      if (gs.period_2) {
        const [home, away] = parseScore(gs.period_2.score);
        periods.push({ label: '2P', home, away });
      }
      if (gs.period_3) {
        const [home, away] = parseScore(gs.period_3.score);
        periods.push({ label: '3P', home, away });
      }
      if (gs.overtime && gs.overtime.score !== '0 : 0' && gs.overtime.score !== '0-0') {
        const [home, away] = parseScore(gs.overtime.score);
        periods.push({ label: 'OT', home, away });
      }
      if (gs.shootout && gs.shootout.score !== '0 : 0' && gs.shootout.score !== '0-0') {
        const [home, away] = parseScore(gs.shootout.score);
        periods.push({ label: 'SO', home, away });
      }
      
      return periods;
    }
    
    // live_data fallback
    if (scheduleData.live_data?.scores_by_period) {
      const sp = scheduleData.live_data.scores_by_period;
      const periods = [];
      
      if (sp['1p']?.home !== null) periods.push({ label: '1P', home: sp['1p'].home!, away: sp['1p'].away! });
      if (sp['2p']?.home !== null) periods.push({ label: '2P', home: sp['2p'].home!, away: sp['2p'].away! });
      if (sp['3p']?.home !== null) periods.push({ label: '3P', home: sp['3p'].home!, away: sp['3p'].away! });
      if (sp.ovt?.home !== null && sp.ovt.home !== 0) periods.push({ label: 'OT', home: sp.ovt.home!, away: sp.ovt.away! });
      if (sp.pss?.home !== null && sp.pss.home !== 0) periods.push({ label: 'SO', home: sp.pss.home!, away: sp.pss.away! });
      
      return periods;
    }
    
    return [];
  };

  const periodScores = getPeriodScores();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* 4:5 인스타그램 컨테이너 (1080x1350) */}
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
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-1/4 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* 컨텐츠 */}
        <div className="relative h-full flex flex-col justify-between p-16">
          
          {/* Header */}
          <div className="text-center">
            <p className="text-primary/80 text-2xl tracking-[0.3em] font-light mb-4">
              ASIA LEAGUE ICE HOCKEY
            </p>
            <h1 className="text-white text-4xl font-bold tracking-wider mb-6">
              MATCH RESULT
            </h1>
            <div className="text-slate-300 text-2xl space-y-2">
              <p>{formattedDate}</p>
              <p>{formattedTime} · {scheduleData.match_place}</p>
            </div>
          </div>

          {/* Main Scoreboard */}
          <div className="flex items-center justify-center gap-8 py-12">
            {/* Home Team */}
            <div className="flex-1 flex flex-col items-center">
              <img 
                src={homeTeam.logo} 
                alt={homeTeam.name} 
                className="w-48 h-48 object-contain mb-6 drop-shadow-2xl"
              />
              <p className="text-white text-3xl font-bold text-center">
                {homeTeam.name}
              </p>
              <p className="text-slate-400 text-xl mt-2">HOME</p>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center px-12">
              <div className="flex items-center gap-6">
                <span className="text-white text-9xl font-black tabular-nums drop-shadow-lg">
                  {scheduleData.home_alih_team_score ?? 0}
                </span>
                <span className="text-slate-500 text-7xl font-light">:</span>
                <span className="text-white text-9xl font-black tabular-nums drop-shadow-lg">
                  {scheduleData.away_alih_team_score ?? 0}
                </span>
              </div>
              <p className="text-primary text-2xl font-semibold mt-4 tracking-wider">
                FINAL
              </p>
            </div>

            {/* Away Team */}
            <div className="flex-1 flex flex-col items-center">
              <img 
                src={awayTeam.logo} 
                alt={awayTeam.name} 
                className="w-48 h-48 object-contain mb-6 drop-shadow-2xl"
              />
              <p className="text-white text-3xl font-bold text-center">
                {awayTeam.name}
              </p>
              <p className="text-slate-400 text-xl mt-2">AWAY</p>
            </div>
          </div>

          {/* Period Scores */}
          {periodScores.length > 0 && (
            <div className="flex justify-center gap-6">
              {periodScores.map((period) => (
                <div 
                  key={period.label} 
                  className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-10 py-6 text-center"
                >
                  <p className="text-slate-400 text-lg mb-3">{period.label}</p>
                  <p className="text-white text-3xl font-bold">
                    {period.home} - {period.away}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Footer Branding */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full px-8 py-4">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              <span className="text-slate-300 text-xl font-medium">
                @alhockey_fans
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramScore;
