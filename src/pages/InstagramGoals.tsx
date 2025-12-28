import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { AlihTeam } from "@/hooks/useTeams";

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

// 페이지당 골 수
const GOALS_PER_PAGE = 6;

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
}

interface RosterPlayer {
  no: number;
  name: string;
  pos: string;
}

interface GoalData {
  goal_no: number;
  period: number;
  time: string;
  team_id: number;
  situation: string;
  assist1_no: number | null;
  assist2_no: number | null;
}

interface GameDetailData {
  game_no: number;
  home_roster: RosterPlayer[];
  away_roster: RosterPlayer[];
  goals: GoalData[];
}

const InstagramGoals = () => {
  const [searchParams] = useSearchParams();
  const gameNo = searchParams.get('game_no');
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  // 스케줄 데이터
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['instagram-goals-schedule', gameNo],
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
    queryKey: ['instagram-goals-teams', scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id],
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

  // 경기 상세 (골/로스터)
  const { data: gameDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['instagram-goals-detail', gameNo],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_game_details')
        .select('game_no, home_roster, away_roster, goals')
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

  if (!scheduleData || !homeTeam || !awayTeam || !gameDetail) {
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

  // 선수 이름 찾기 헬퍼
  const getPlayerName = (playerNo: number, teamId: number): string => {
    const roster = teamId === homeTeam.id ? gameDetail.home_roster : gameDetail.away_roster;
    const player = roster.find(p => p.no === playerNo);
    return player ? player.name : `#${playerNo}`;
  };

  // 피리어드 라벨
  const getPeriodLabel = (period: number) => {
    if (period === 4) return 'OT';
    if (period === 5) return 'SO';
    return `${period}P`;
  };

  // 시간 조정 (피리어드별)
  const adjustGameTime = (period: number, time: string) => {
    const [minutes, seconds] = time.split(':').map(Number);
    let adjustedMinutes = minutes;
    if (period === 2) adjustedMinutes = minutes - 20;
    else if (period === 3) adjustedMinutes = minutes - 40;
    else if (period === 4) adjustedMinutes = minutes - 60;
    else if (period === 5) adjustedMinutes = minutes - 65;
    return `${adjustedMinutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 득점 상황 라벨
  const getSituationLabel = (situation: string) => {
    if (situation === "+1") return "PP";
    if (situation === "-1") return "SH";
    return "EV";
  };

  // 골을 시간순으로 정렬
  const sortedGoals = [...gameDetail.goals].sort((a, b) => {
    const timeA = a.time.split(':').map(Number);
    const timeB = b.time.split(':').map(Number);
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(sortedGoals.length / GOALS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (safeCurrentPage - 1) * GOALS_PER_PAGE;
  const endIndex = startIndex + GOALS_PER_PAGE;
  const goalsForCurrentPage = sortedGoals.slice(startIndex, endIndex);
  const showPagination = totalPages > 1;

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
        <div className="relative h-full flex flex-col p-12">
          
          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-primary/80 text-xl tracking-[0.3em] font-light mb-2">
              ASIA LEAGUE ICE HOCKEY
            </p>
            <h1 className="text-white text-4xl font-bold tracking-wider mb-4">
              GOALS & ASSISTS
            </h1>
            <p className="text-slate-300 text-xl">{formattedDate}</p>
            <p className="text-slate-400 text-lg">{scheduleData.match_place}</p>
          </div>

          {/* 스코어 헤더 */}
          <div className="flex items-center justify-center gap-6 mb-8 py-4 bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-4">
              <img 
                src={homeTeam.logo} 
                alt={homeTeam.name} 
                className="w-16 h-16 object-contain"
              />
              <span className="text-white text-2xl font-bold">{homeTeam.name}</span>
            </div>
            <div className="flex items-center gap-3 px-6">
              <span className="text-white text-5xl font-black">
                {scheduleData.home_alih_team_score ?? 0}
              </span>
              <span className="text-slate-500 text-3xl">:</span>
              <span className="text-white text-5xl font-black">
                {scheduleData.away_alih_team_score ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white text-2xl font-bold">{awayTeam.name}</span>
              <img 
                src={awayTeam.logo} 
                alt={awayTeam.name} 
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>

          {/* 골 목록 */}
          <div className="flex-1 overflow-hidden">
            {goalsForCurrentPage.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-400 text-2xl">득점 기록이 없습니다</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {goalsForCurrentPage.map((goal, index) => {
                  const scoringTeam = goal.team_id === homeTeam.id ? homeTeam : awayTeam;
                  const isHomeGoal = goal.team_id === homeTeam.id;
                  const scorerName = getPlayerName(goal.goal_no, goal.team_id);
                  const assist1Name = goal.assist1_no ? getPlayerName(goal.assist1_no, goal.team_id) : null;
                  const assist2Name = goal.assist2_no ? getPlayerName(goal.assist2_no, goal.team_id) : null;

                  return (
                    <div 
                      key={index}
                      className={`flex items-center gap-6 p-5 rounded-2xl border backdrop-blur-sm ${
                        isHomeGoal 
                          ? 'bg-gradient-to-r from-primary/20 to-slate-800/60 border-primary/30' 
                          : 'bg-gradient-to-l from-blue-500/20 to-slate-800/60 border-blue-500/30'
                      }`}
                    >
                      {/* 팀 로고 */}
                      <img 
                        src={scoringTeam.logo} 
                        alt={scoringTeam.name}
                        className="w-14 h-14 object-contain flex-shrink-0"
                      />

                      {/* 득점 정보 */}
                      <div className="flex-1 min-w-0">
                        {/* 득점자 - 크게 강조 */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white text-3xl font-bold tracking-wide">
                            {scorerName}
                          </span>
                          <span className="text-slate-400 text-xl">
                            #{goal.goal_no}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            goal.situation === '+1' 
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' 
                              : goal.situation === '-1'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                          }`}>
                            {getSituationLabel(goal.situation)}
                          </span>
                        </div>

                        {/* 어시스트 */}
                        {(assist1Name || assist2Name) && (
                          <p className="text-slate-300 text-lg">
                            <span className="text-slate-500">Assist: </span>
                            <span className="font-medium">{assist1Name}</span>
                            {assist2Name && (
                              <>
                                <span className="text-slate-500">, </span>
                                <span className="font-medium">{assist2Name}</span>
                              </>
                            )}
                          </p>
                        )}
                      </div>

                      {/* 시간 정보 */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-primary text-xl font-bold">
                          {getPeriodLabel(goal.period)}
                        </p>
                        <p className="text-slate-400 text-lg">
                          {adjustGameTime(goal.period, goal.time)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer: 페이지 인디케이터 + 브랜딩 */}
          <div className="text-center pt-6 flex items-center justify-center gap-6">
            {showPagination && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full px-6 py-3">
                <span className="text-white text-xl font-bold">
                  {safeCurrentPage} / {totalPages}
                </span>
              </div>
            )}
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

export default InstagramGoals;
