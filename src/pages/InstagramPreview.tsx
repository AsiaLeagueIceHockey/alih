import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Calendar, MapPin, Clock } from "lucide-react";
import { AlihTeam } from "@/hooks/useTeams";
import { isFinalSeriesGame, isPlayoffGame } from "@/lib/game-utils";
import { getInstagramTheme } from "@/lib/instagram-theme";

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

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
  season_phase?: string | null;
  source_game_no?: number | null;
}

interface StandingData {
  rank: number;
  team_id: number;
}

const InstagramPreview = () => {
  const [searchParams] = useSearchParams();
  const gameNo = searchParams.get('game_no');

  // 기준 경기 데이터
  const { data: baseGame, isLoading: baseLoading } = useQuery({
    queryKey: ['instagram-preview-base', gameNo],
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
    queryKey: ['instagram-preview-teams', baseGame?.home_alih_team_id, baseGame?.away_alih_team_id],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_teams')
        .select('*')
        .in('id', [baseGame?.home_alih_team_id, baseGame?.away_alih_team_id]);
      if (error) throw error;
      return data as AlihTeam[];
    },
    enabled: !!baseGame,
  });

  // 순위 정보
  const { data: standingsData, isLoading: standingsLoading } = useQuery({
    queryKey: ['instagram-preview-standings'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_standings')
        .select('rank, team_id')
        .order('rank', { ascending: true });
      if (error) throw error;
      return data as StandingData[];
    },
    enabled: !!baseGame,
  });

  // 시리즈 경기들 (match_at 기준 ±3일, 같은 두 팀)
  const { data: seriesGames, isLoading: seriesLoading } = useQuery({
    queryKey: ['instagram-preview-series', baseGame?.id, baseGame?.match_at],
    queryFn: async () => {
      if (!baseGame) return [];
      
      const baseDate = new Date(baseGame.match_at);
      const startDate = new Date(baseDate);
      startDate.setDate(startDate.getDate() - 3);
      const endDate = new Date(baseDate);
      endDate.setDate(endDate.getDate() + 3);
      
      const { data, error } = await externalSupabase
        .from('alih_schedule')
        .select('*')
        .or(`and(home_alih_team_id.eq.${baseGame.home_alih_team_id},away_alih_team_id.eq.${baseGame.away_alih_team_id}),and(home_alih_team_id.eq.${baseGame.away_alih_team_id},away_alih_team_id.eq.${baseGame.home_alih_team_id})`)
        .gte('match_at', startDate.toISOString())
        .lte('match_at', endDate.toISOString())
        .order('match_at', { ascending: true });
      
      if (error) throw error;
      return data as ScheduleData[];
    },
    enabled: !!baseGame,
  });

  // 이번 시즌 과거 맞대결 (스코어가 있는 경기만)
  const { data: pastMatchups, isLoading: pastLoading } = useQuery({
    queryKey: ['instagram-preview-past', baseGame?.home_alih_team_id, baseGame?.away_alih_team_id],
    queryFn: async () => {
      if (!baseGame) return [];
      
      const { data, error } = await externalSupabase
        .from('alih_schedule')
        .select('*')
        .or(`and(home_alih_team_id.eq.${baseGame.home_alih_team_id},away_alih_team_id.eq.${baseGame.away_alih_team_id}),and(home_alih_team_id.eq.${baseGame.away_alih_team_id},away_alih_team_id.eq.${baseGame.home_alih_team_id})`)
        .not('home_alih_team_score', 'is', null)
        .order('match_at', { ascending: false });
      
      if (error) throw error;
      return data as ScheduleData[];
    },
    enabled: !!baseGame,
  });

  const homeTeam = teamsData?.find(t => t.id === baseGame?.home_alih_team_id);
  const awayTeam = teamsData?.find(t => t.id === baseGame?.away_alih_team_id);

  // 팀 순위 가져오기
  const getTeamRank = (teamId: number) => {
    const standing = standingsData?.find(s => s.team_id === teamId);
    return standing?.rank || '-';
  };

  const isLoading = baseLoading || teamsLoading || seriesLoading || pastLoading || standingsLoading;

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

  if (!baseGame || !homeTeam || !awayTeam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">경기 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const isPlayoff = isPlayoffGame(baseGame.match_at, baseGame.season_phase);
  const isFinal = isFinalSeriesGame(
    baseGame.match_at,
    baseGame.season_phase,
    baseGame.source_game_no,
    baseGame.home_alih_team_id,
    baseGame.away_alih_team_id
  );
  const theme = getInstagramTheme(isPlayoff, isFinal);

  // 과거 맞대결에서 각 팀 승리 수 계산
  const getWinCounts = () => {
    let team1Wins = 0; // homeTeam 기준
    let team2Wins = 0; // awayTeam 기준
    
    pastMatchups?.forEach(game => {
      if (game.home_alih_team_score === null || game.away_alih_team_score === null) return;
      
      const homeWon = game.home_alih_team_score > game.away_alih_team_score;
      
      if (game.home_alih_team_id === homeTeam?.id) {
        // homeTeam이 홈팀인 경기
        if (homeWon) team1Wins++;
        else team2Wins++;
      } else {
        // homeTeam이 원정팀인 경기
        if (homeWon) team2Wins++;
        else team1Wins++;
      }
    });
    
    return { team1Wins, team2Wins };
  };

  const { team1Wins, team2Wins } = getWinCounts();
  const hasPastMatchups = pastMatchups && pastMatchups.length > 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* 4:5 인스타그램 컨테이너 (1080x1350) */}
      <div 
        className={theme.frameClass}
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
          <div className={theme.topGlowClass} />
          <div className={theme.bottomGlowClass} />
          <div className={theme.sideGlowClass} />
        </div>

        {/* 컨텐츠 */}
        <div className="relative h-full flex flex-col p-12">
          
          {/* Header */}
          <div className="text-center mb-6">
            <p className={`${theme.headerEyebrowClass} text-xl tracking-[0.3em] font-light mb-2`}>
              ASIA LEAGUE ICE HOCKEY
            </p>
            <h1 className="text-white text-4xl font-bold tracking-wider">
              {isFinal ? "FINALS PREVIEW" : "SERIES PREVIEW"}
            </h1>
            {isPlayoff && (
              <div className="mt-4">
                <span className={theme.badgeClass}>{isFinal ? "Finals" : "Playoffs"}</span>
              </div>
            )}
          </div>

          {/* Team Logos - 상단 30% */}
          <div className="flex items-center justify-center gap-12 py-6">
            {/* Home Team */}
            <div className="flex flex-col items-center">
              <img 
                src={homeTeam.logo} 
                alt={homeTeam.name} 
                className="w-44 h-44 object-contain drop-shadow-2xl"
              />
              <p className="text-white text-2xl font-bold text-center mt-4">
                {homeTeam.name}
              </p>
              <span className={`${theme.accentChipClass} mt-2 px-4 py-1 text-lg font-semibold`}>
                {getTeamRank(homeTeam.id)}위
              </span>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center px-8">
              <span className={`${theme.accentTextClass} text-5xl font-black`}>VS</span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center">
              <img 
                src={awayTeam.logo} 
                alt={awayTeam.name} 
                className="w-44 h-44 object-contain drop-shadow-2xl"
              />
              <p className="text-white text-2xl font-bold text-center mt-4">
                {awayTeam.name}
              </p>
              <span className={`${theme.accentChipClass} mt-2 px-4 py-1 text-lg font-semibold`}>
                {getTeamRank(awayTeam.id)}위
              </span>
            </div>
          </div>

          {/* Series Games - 경기 일정 */}
          <div className="flex flex-col gap-5 py-6" style={{ marginLeft: '10%', marginRight: '10%' }}>
            <h2 className="text-slate-300 text-2xl font-semibold text-center mb-2">
              📅 경기 일정
            </h2>
            <div className="flex flex-col gap-4">
              {seriesGames?.map((game, index) => (
                <div 
                  key={game.id}
                  className={`${theme.strongPanelClass} rounded-2xl px-10 py-7`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <span className={`${theme.accentTextClass} font-bold text-2xl`}>GAME {index + 1}</span>
                      <div className="flex items-center gap-3 text-slate-300">
                        <Calendar className="w-6 h-6" />
                        <span className="text-xl">{formatDate(game.match_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-3 text-slate-300">
                        <Clock className="w-6 h-6" />
                        <span className="text-xl">{formatTime(game.match_at)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <MapPin className="w-6 h-6" />
                        <span className="text-xl">{game.match_place}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Matchups - 컴팩트한 가로 배치 */}
          <div className="py-4 mt-6 pt-6 pb-6" style={{ marginLeft: '10%', marginRight: '10%' }}>
            <h2 className="text-slate-300 text-2xl font-semibold text-center mb-3">
              ⚔️ 이번 시즌 맞대결
            </h2>
            
            {/* 승수 표시 - 헤더 아래에 로고와 함께 */}
            {hasPastMatchups && (
              <div className="flex items-center justify-center gap-6 mb-4">
                <div className="flex items-center gap-3">
                  <img src={homeTeam.logo} alt="" className="w-8 h-8 object-contain" />
                  <span className="text-white text-xl font-bold">{team1Wins}승</span>
                </div>
                <span className="text-slate-500 text-lg">vs</span>
                <div className="flex items-center gap-3">
                  <span className="text-white text-xl font-bold">{team2Wins}승</span>
                  <img src={awayTeam.logo} alt="" className="w-8 h-8 object-contain" />
                </div>
              </div>
            )}
            
            {hasPastMatchups ? (
              <div className="flex justify-center gap-3 flex-wrap">
                {pastMatchups.slice(0, 4).map((game) => {
                  const isHomeTeamHome = game.home_alih_team_id === homeTeam.id;
                  const displayHomeTeam = isHomeTeamHome ? homeTeam : awayTeam;
                  const displayAwayTeam = isHomeTeamHome ? awayTeam : homeTeam;
                  const homeScore = game.home_alih_team_score;
                  const awayScore = game.away_alih_team_score;
                  const matchDate = new Date(game.match_at);
                  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                  const shortDate = `${matchDate.getMonth() + 1}월 ${matchDate.getDate()}일(${weekdays[matchDate.getDay()]})`;
                  
                  return (
                    <div 
                      key={game.id}
                      className={`${theme.panelClass} rounded-xl px-4 py-3 text-center`}
                    >
                      <p className="text-slate-400 text-sm">{shortDate}</p>
                      <div className="flex items-center justify-center gap-2 my-1">
                        <img src={displayHomeTeam.logo} alt="" className="w-5 h-5 object-contain" />
                        <span className="text-white text-xl font-bold">{homeScore} : {awayScore}</span>
                        <img src={displayAwayTeam.logo} alt="" className="w-5 h-5 object-contain" />
                      </div>
                      <p className="text-slate-500 text-xs">{game.match_place}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`${theme.panelClass} rounded-xl px-6 py-4 text-center`}>
                <p className="text-slate-300 text-xl font-medium">
                  🏒 이번 시즌 첫 맞대결!
                </p>
              </div>
            )}
          </div>

          {/* Footer Branding */}
          <div className="text-center pt-6">
            <div className={`${theme.panelClass} inline-flex items-center gap-3 rounded-full px-8 py-4`}>
              <div className={`w-3 h-3 rounded-full animate-pulse ${theme.footerDotClass}`} />
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

export default InstagramPreview;
