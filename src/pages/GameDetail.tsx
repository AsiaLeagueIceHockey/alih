import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Loader2, ArrowLeft, Trophy, Users, Goal, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlihTeam } from "@/hooks/useTeams";
import SEO from "@/components/SEO";

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

interface GameDetailData {
  id: string;
  game_no: number;
  spectators: number;
  game_info: {
    venue: string;
    coaches: {
      home_coach: string;
      away_coach: string;
      home_manager: string;
      away_manager: string;
    };
    timeouts: {
      home: string | null;
      away: string | null;
    };
    game_time: {
      start: string;
      end: string;
    };
    officials: {
      referees: string[];
      linesmen: string[];
      supervisor: string;
    };
  };
  game_summary: {
    period_1: { score: string; sog: string; pim: string; ppgf: string; shgf: string };
    period_2: { score: string; sog: string; pim: string; ppgf: string; shgf: string };
    period_3: { score: string; sog: string; pim: string; ppgf: string; shgf: string };
    total: { score: string; sog: string; pim: string; ppgf: string; shgf: string };
  };
  goalkeepers: {
    home: Array<{ no: number; name: string; mip: string; ga: number; saves: number }>;
    away: Array<{ no: number; name: string; mip: string; ga: number; saves: number }>;
  };
  home_roster: Array<{
    no: number;
    name: string;
    pos: string;
    sog: number;
    played: boolean;
    captain_asst: string | null;
  }>;
  away_roster: Array<{
    no: number;
    name: string;
    pos: string;
    sog: number;
    played: boolean;
    captain_asst: string | null;
  }>;
  goals: Array<{
    goal_no: number;
    period: number;
    time: string;
    team_id: number;
    situation: string;
    assist1_no: number | null;
    assist2_no: number | null;
  }>;
  penalties: Array<{
    player_no: number;
    period: number;
    time: string;
    team_id: number;
    offence: string;
    minutes: number;
  }>;
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
  live_url: string | null;
}

interface PlayerData {
  id: number;
  team_id: number;
  name: string;
  jersey_number: number;
  position: string;
  goals: number;
  assists: number;
  points: number;
  games_played: number;
}

const GameDetail = () => {
  const { gameNo } = useParams<{ gameNo: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // location.state에서 팀 정보를 가져오되, 없으면 null로 처리
  const stateData = location.state as { 
    homeTeam?: AlihTeam; 
    awayTeam?: AlihTeam;
    matchDate?: string;
  } | null;

  // 스케줄 데이터 가져오기 (항상 필요 - live_url 확인용)
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule-for-game', gameNo],
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

  // 팀 정보 가져오기
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams-for-game', scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_teams')
        .select('*')
        .in('id', [scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id]);

      if (error) throw error;
      return data as AlihTeam[];
    },
    enabled: !!scheduleData && !stateData?.homeTeam,
  });

  // 팀 정보 결정: state에서 먼저 확인, 없으면 DB에서 가져온 데이터 사용
  const homeTeamFromDB = teamsData?.find(t => t.id === scheduleData?.home_alih_team_id) || null;
  const awayTeamFromDB = teamsData?.find(t => t.id === scheduleData?.away_alih_team_id) || null;
  const homeTeam: AlihTeam | null = stateData?.homeTeam || homeTeamFromDB;
  const awayTeam: AlihTeam | null = stateData?.awayTeam || awayTeamFromDB;
  const matchDate: string = stateData?.matchDate || scheduleData?.match_at || '';

  // 경기 완료 여부 확인
  const isCompleted = scheduleData?.home_alih_team_score !== null && scheduleData?.away_alih_team_score !== null;

  // 경기 상세 데이터 (완료된 경기만)
  const { data: gameDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['game-detail', gameNo],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_game_details')
        .select('*')
        .eq('game_no', gameNo)
        .maybeSingle();

      if (error) throw error;
      return data as GameDetailData | null;
    },
    enabled: !!gameNo && isCompleted,
  });

  // 맞대결 전적 가져오기 (미완료 경기용)
  const { data: headToHead, isLoading: h2hLoading } = useQuery({
    queryKey: ['head-to-head', scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_schedule')
        .select('*')
        .or(`and(home_alih_team_id.eq.${scheduleData?.home_alih_team_id},away_alih_team_id.eq.${scheduleData?.away_alih_team_id}),and(home_alih_team_id.eq.${scheduleData?.away_alih_team_id},away_alih_team_id.eq.${scheduleData?.home_alih_team_id})`)
        .not('home_alih_team_score', 'is', null)
        .order('match_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as ScheduleData[];
    },
    enabled: !!scheduleData && !isCompleted,
  });

  // 양 팀 선수 데이터 가져오기 (미완료 경기용)
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['team-players', scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_players')
        .select('*')
        .in('team_id', [scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id]);

      if (error) throw error;
      return data as PlayerData[];
    },
    enabled: !!scheduleData && !isCompleted,
  });

  // 로딩 상태
  const isLoading = scheduleLoading || 
    (!stateData?.homeTeam && teamsLoading) ||
    (isCompleted && detailLoading);

  const getPlayerName = (playerNo: number, teamId: number) => {
    if (!gameDetail || !homeTeam) return `#${playerNo}`;
    const roster = teamId === homeTeam.id ? gameDetail.home_roster : gameDetail.away_roster;
    const player = roster.find(p => p.no === playerNo);
    return player ? player.name : `#${playerNo}`;
  };

  const getSituationLabel = (situation: string) => {
    if (situation === "+1") return "PPG (파워플레이)";
    if (situation === "-1") return "SHG (숏핸디드)";
    return "EV (이븐)";
  };

  // 피리어드별 시간 조정 함수 (2P는 -20분, 3P는 -40분)
  const adjustGameTime = (period: number, time: string) => {
    const [minutes, seconds] = time.split(':').map(Number);
    let adjustedMinutes = minutes;
    
    if (period === 2) {
      adjustedMinutes = minutes - 20;
    } else if (period === 3) {
      adjustedMinutes = minutes - 40;
    }
    
    return `${adjustedMinutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([^&?]+)/);
    return match?.[1] || null;
  };

  // 게임 상태 계산
  const getGameStatus = () => {
    if (isCompleted) return "종료";
    const matchDateObj = new Date(matchDate);
    const now = new Date();
    if (matchDateObj <= now) return "진행 중";
    return "예정";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!scheduleData || !homeTeam || !awayTeam) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">경기 정보를 불러올 수 없습니다</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>
    );
  }

  const matchDateObj = new Date(matchDate);
  const gameStatus = getGameStatus();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${homeTeam?.name} vs ${awayTeam?.name}`,
    "sport": "Ice Hockey",
    "startDate": matchDate,
    "location": {
      "@type": "Place",
      "name": scheduleData.match_place
    },
    "homeTeam": {
      "@type": "SportsTeam",
      "name": homeTeam?.name
    },
    "awayTeam": {
      "@type": "SportsTeam",
      "name": awayTeam?.name
    }
  };

  // 미완료 경기 UI
  if (!isCompleted) {
    const homePlayers = players?.filter(p => p.team_id === homeTeam.id) || [];
    const awayPlayers = players?.filter(p => p.team_id === awayTeam.id) || [];
    
    const homeTopScorers = [...homePlayers].sort((a, b) => b.goals - a.goals).slice(0, 3);
    const awayTopScorers = [...awayPlayers].sort((a, b) => b.goals - a.goals).slice(0, 3);
    const homeTopAssists = [...homePlayers].sort((a, b) => b.assists - a.assists).slice(0, 3);
    const awayTopAssists = [...awayPlayers].sort((a, b) => b.assists - a.assists).slice(0, 3);
    const homeTopGoalie = homePlayers.filter(p => p.position === 'G').sort((a, b) => b.games_played - a.games_played)[0];
    const awayTopGoalie = awayPlayers.filter(p => p.position === 'G').sort((a, b) => b.games_played - a.games_played)[0];

    return (
      <div className="min-h-screen bg-background pb-20">
        <SEO 
          title={`${homeTeam?.name} vs ${awayTeam?.name} - 경기 정보`}
          description={`${matchDateObj.toLocaleDateString('ko-KR')} ${homeTeam?.name} vs ${awayTeam?.name} 경기 정보, 맞대결 전적, 스타플레이어를 확인하세요.`}
          keywords={`${homeTeam?.name}, ${awayTeam?.name}, 경기 정보, 맞대결, 전적`}
          path={`/schedule/${gameNo}`}
          structuredData={structuredData}
        />
        
        {/* 헤더 */}
        <div className="bg-gradient-to-b from-primary/10 to-background pt-6 pb-4">
          <div className="container mx-auto px-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
            <h1 className="text-2xl font-bold text-center mb-6">경기 정보</h1>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-4">
          {/* 1. 팀 정보 및 경기 장소 */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <Link 
                to={`/team/${homeTeam.id}`}
                className="flex-1 flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img src={homeTeam.logo} alt={homeTeam.name} className="w-16 h-16 object-contain mb-2" />
                <p className="text-sm font-medium text-center hover:text-primary transition-colors">{homeTeam.name}</p>
              </Link>

              <div className="px-6 flex flex-col items-center">
                <span className="text-2xl font-bold text-muted-foreground">VS</span>
                <Badge 
                  variant={gameStatus === "진행 중" ? "default" : "outline"}
                  className={`mt-2 ${gameStatus === "진행 중" ? "bg-destructive animate-pulse" : "bg-accent"}`}
                >
                  {gameStatus}
                </Badge>
              </div>

              <Link 
                to={`/team/${awayTeam.id}`}
                className="flex-1 flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img src={awayTeam.logo} alt={awayTeam.name} className="w-16 h-16 object-contain mb-2" />
                <p className="text-sm font-medium text-center hover:text-primary transition-colors">{awayTeam.name}</p>
              </Link>
            </div>

            <div className="text-center space-y-1 text-sm text-muted-foreground border-t pt-4">
              <p className="font-medium">
                {matchDateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p>
                {matchDateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p>{scheduleData.match_place}</p>
            </div>
          </Card>

          {/* 2. 라이브 스트리밍 */}
          <Card className="p-4 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="text-destructive">●</span> 라이브 스트리밍
            </h3>
            {scheduleData.live_url ? (
              <div className="aspect-video w-full rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYoutubeVideoId(scheduleData.live_url)}`}
                  title="라이브 스트리밍"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                해당 경기는 유튜브 라이브가 없습니다
              </div>
            )}
          </Card>

          {/* 3. 맞대결 & 스타플레이어 탭 */}
          <Tabs defaultValue="record" className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="record">
                <Trophy className="h-4 w-4 mr-1.5" />
                맞대결 전적
              </TabsTrigger>
              <TabsTrigger value="stars">
                <Users className="h-4 w-4 mr-1.5" />
                스타 플레이어
              </TabsTrigger>
            </TabsList>

            {/* 맞대결 전적 */}
            <TabsContent value="record">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">최근 맞대결 기록</h3>
                {h2hLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : headToHead && headToHead.length > 0 ? (
                  <div className="space-y-3">
                    {headToHead.map((game) => {
                      const gameDate = new Date(game.match_at);
                      const isHomeTeamHome = game.home_alih_team_id === homeTeam.id;
                      const homeScore = isHomeTeamHome ? game.home_alih_team_score : game.away_alih_team_score;
                      const awayScore = isHomeTeamHome ? game.away_alih_team_score : game.home_alih_team_score;
                      const homeWin = (homeScore || 0) > (awayScore || 0);
                      const awayWin = (awayScore || 0) > (homeScore || 0);
                      
                      return (
                        <div 
                          key={game.id} 
                          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/schedule/${game.game_no}`)}
                        >
                          <div className="text-sm text-muted-foreground">
                            {gameDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 ${homeWin ? 'font-bold' : ''}`}>
                              <img src={homeTeam.logo} alt={homeTeam.name} className="w-6 h-6 object-contain" />
                              <span>{homeScore}</span>
                            </div>
                            <span className="text-muted-foreground">:</span>
                            <div className={`flex items-center gap-2 ${awayWin ? 'font-bold' : ''}`}>
                              <span>{awayScore}</span>
                              <img src={awayTeam.logo} alt={awayTeam.name} className="w-6 h-6 object-contain" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">맞대결 기록이 없습니다</p>
                )}
              </Card>
            </TabsContent>

            {/* 스타 플레이어 */}
            <TabsContent value="stars" className="space-y-4">
              {playersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* 득점 리더 */}
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Goal className="h-4 w-4 text-primary" />
                      득점 리더
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <img src={homeTeam.logo} alt={homeTeam.name} className="w-5 h-5 object-contain" />
                          <span className="text-sm font-medium">{homeTeam.name}</span>
                        </div>
                        {homeTopScorers.map((player, idx) => (
                          <div key={player.id} className="flex justify-between text-sm py-1">
                            <span className="truncate">{idx + 1}. {player.name}</span>
                            <span className="font-medium ml-2">{player.goals}G</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <img src={awayTeam.logo} alt={awayTeam.name} className="w-5 h-5 object-contain" />
                          <span className="text-sm font-medium">{awayTeam.name}</span>
                        </div>
                        {awayTopScorers.map((player, idx) => (
                          <div key={player.id} className="flex justify-between text-sm py-1">
                            <span className="truncate">{idx + 1}. {player.name}</span>
                            <span className="font-medium ml-2">{player.goals}G</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* 어시스트 리더 */}
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      어시스트 리더
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <img src={homeTeam.logo} alt={homeTeam.name} className="w-5 h-5 object-contain" />
                          <span className="text-sm font-medium">{homeTeam.name}</span>
                        </div>
                        {homeTopAssists.map((player, idx) => (
                          <div key={player.id} className="flex justify-between text-sm py-1">
                            <span className="truncate">{idx + 1}. {player.name}</span>
                            <span className="font-medium ml-2">{player.assists}A</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <img src={awayTeam.logo} alt={awayTeam.name} className="w-5 h-5 object-contain" />
                          <span className="text-sm font-medium">{awayTeam.name}</span>
                        </div>
                        {awayTopAssists.map((player, idx) => (
                          <div key={player.id} className="flex justify-between text-sm py-1">
                            <span className="truncate">{idx + 1}. {player.name}</span>
                            <span className="font-medium ml-2">{player.assists}A</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* 주전 골리 */}
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      주전 골키퍼
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <img src={homeTeam.logo} alt={homeTeam.name} className="w-5 h-5 object-contain" />
                          <span className="text-sm font-medium">{homeTeam.name}</span>
                        </div>
                        {homeTopGoalie ? (
                          <div className="text-sm py-1">
                            <p className="font-medium">{homeTopGoalie.name} #{homeTopGoalie.jersey_number}</p>
                            <p className="text-muted-foreground">{homeTopGoalie.games_played}경기 출전</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">정보 없음</p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <img src={awayTeam.logo} alt={awayTeam.name} className="w-5 h-5 object-contain" />
                          <span className="text-sm font-medium">{awayTeam.name}</span>
                        </div>
                        {awayTopGoalie ? (
                          <div className="text-sm py-1">
                            <p className="font-medium">{awayTopGoalie.name} #{awayTopGoalie.jersey_number}</p>
                            <p className="text-muted-foreground">{awayTopGoalie.games_played}경기 출전</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">정보 없음</p>
                        )}
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // 완료된 경기 UI (기존 코드)
  if (!gameDetail) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">경기 상세 기록을 불러올 수 없습니다</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>
    );
  }

  const [homeScore, awayScore] = gameDetail.game_summary.total.score.split(' : ');

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO 
        title={`${homeTeam?.name} vs ${awayTeam?.name} - 경기 상세 기록`}
        description={`${matchDateObj.toLocaleDateString('ko-KR')} ${homeTeam?.name} vs ${awayTeam?.name} 경기의 상세 기록, 스코어, 슈팅, 득점 정보를 확인하세요.`}
        keywords={`${homeTeam?.name}, ${awayTeam?.name}, 경기 기록, 상세 스탯, 득점, 어시스트`}
        path={`/schedule/${gameNo}`}
        structuredData={structuredData}
      />
      {/* 헤더 */}
      <div className="bg-gradient-to-b from-primary/10 to-background pt-6 pb-4">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          <h1 className="text-2xl font-bold text-center mb-6">경기 상세 기록</h1>
        </div>
      </div>

      {/* 메인 스코어보드 */}
      <div className="container mx-auto px-4 -mt-4">
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            {/* 홈팀 */}
            <Link 
              to={`/team/${homeTeam.id}`}
              className="flex-1 flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img src={homeTeam.logo} alt={homeTeam.name} className="w-16 h-16 object-contain mb-2" />
              <p className="text-sm font-medium text-center hover:text-primary transition-colors">{homeTeam.name}</p>
            </Link>

            {/* 스코어 */}
            <div className="px-6 flex flex-col items-center">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold">{homeScore}</span>
                <span className="text-2xl text-muted-foreground">:</span>
                <span className="text-4xl font-bold">{awayScore}</span>
              </div>
              <Badge variant="outline" className="mt-2">최종</Badge>
            </div>

            {/* 어웨이팀 */}
            <Link 
              to={`/team/${awayTeam.id}`}
              className="flex-1 flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img src={awayTeam.logo} alt={awayTeam.name} className="w-16 h-16 object-contain mb-2" />
              <p className="text-sm font-medium text-center hover:text-primary transition-colors">{awayTeam.name}</p>
            </Link>
          </div>

          {/* 경기 정보 */}
          <div className="text-center space-y-1 text-sm text-muted-foreground border-t pt-4">
            <p className="font-medium">
              {matchDateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p>{gameDetail.game_info.venue}</p>
            <p>관중: {gameDetail.spectators.toLocaleString()}명</p>
          </div>
        </Card>

        {/* 탭 인터페이스 */}
        <Tabs defaultValue="summary" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">경기 요약</TabsTrigger>
            <TabsTrigger value="goals">득점 & 페널티</TabsTrigger>
            <TabsTrigger value="roster">선수 명단</TabsTrigger>
          </TabsList>

          {/* 탭 1: 경기 요약 */}
          <TabsContent value="summary" className="space-y-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">피리어드별 요약</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">구분</TableHead>
                      <TableHead className="text-center">득점</TableHead>
                      <TableHead className="text-center">유효 슈팅</TableHead>
                      <TableHead className="text-center">페널티(분)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">1P</TableCell>
                      <TableCell className="text-center">{gameDetail.game_summary.period_1.score}</TableCell>
                      <TableCell className="text-center">{gameDetail.game_summary.period_1.sog}</TableCell>
                      <TableCell className="text-center">{gameDetail.game_summary.period_1.pim}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">2P</TableCell>
                      <TableCell className="text-center">{gameDetail.game_summary.period_2.score}</TableCell>
                      <TableCell className="text-center">{gameDetail.game_summary.period_2.sog}</TableCell>
                      <TableCell className="text-center">{gameDetail.game_summary.period_2.pim}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">3P</TableCell>
                      <TableCell className="text-center">{gameDetail.game_summary.period_3.score}</TableCell>
                      <TableCell className="text-center">{gameDetail.game_summary.period_3.sog}</TableCell>
                      <TableCell className="text-center">{gameDetail.game_summary.period_3.pim}</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-center">{gameDetail.game_summary.total.score}</TableCell>
                      <TableCell className="text-center">{gameDetail.game_summary.total.sog}</TableCell>
                      <TableCell className="text-center">{gameDetail.game_summary.total.pim}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="p-4 bg-muted/30">
              <h3 className="font-semibold mb-3">아이스하키 용어 설명</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">SOG:</span> Shot on Goal (유효 슈팅. 골키퍼가 막아내거나 골로 연결된 슈팅)</p>
                <p><span className="font-medium">PIM:</span> Penalties in Minutes (선수가 페널티로 인해 퇴장당한 총 시간(분))</p>
                <p><span className="font-medium">PPG:</span> Power Play Goal (팀이 수적 우위(파워플레이) 상황에서 넣은 골)</p>
                <p><span className="font-medium">SHG:</span> Short Handed Goal (팀이 수적 열세(숏핸디드) 상황에서 넣은 골)</p>
              </div>
            </Card>
          </TabsContent>

          {/* 탭 2: 득점 기록 & 페널티 */}
          <TabsContent value="goals">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">득점 기록 & 페널티</h3>
              {gameDetail.goals.length === 0 && gameDetail.penalties.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">기록이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {[
                    ...gameDetail.goals.map(goal => ({ ...goal, type: 'goal' as const })),
                    ...gameDetail.penalties.map(penalty => ({ ...penalty, type: 'penalty' as const }))
                  ]
                    .sort((a, b) => {
                      // 피리어드 우선 정렬
                      if (a.period !== b.period) return a.period - b.period;
                      // 같은 피리어드 내에서는 시간으로 정렬
                      const [aMin, aSec] = a.time.split(':').map(Number);
                      const [bMin, bSec] = b.time.split(':').map(Number);
                      const aTotal = aMin * 60 + aSec;
                      const bTotal = bMin * 60 + bSec;
                      return aTotal - bTotal;
                    })
                    .map((record, index) => {
                      if (record.type === 'goal') {
                        const goal = record as typeof record & { goal_no: number; situation: string; assist1_no: number | null; assist2_no: number | null; };
                        const scoringTeam = goal.team_id === homeTeam.id ? homeTeam : awayTeam;
                        return (
                          <div key={`goal-${index}`} className="flex items-start gap-3 p-3 border rounded-lg bg-primary/5">
                            <img src={scoringTeam.logo} alt={scoringTeam.name} className="w-10 h-10 object-contain" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">{goal.period}P {adjustGameTime(goal.period, goal.time)}</Badge>
                                <Badge className="text-xs">{getSituationLabel(goal.situation)}</Badge>
                              </div>
                              <p className="font-medium">
                                득점: {getPlayerName(goal.goal_no, goal.team_id)} (#{goal.goal_no})
                              </p>
                              {(goal.assist1_no || goal.assist2_no) && (
                                <p className="text-sm text-muted-foreground">
                                  어시스트: 
                                  {goal.assist1_no && ` ${getPlayerName(goal.assist1_no, goal.team_id)} (#${goal.assist1_no})`}
                                  {goal.assist2_no && `, ${getPlayerName(goal.assist2_no, goal.team_id)} (#${goal.assist2_no})`}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      } else {
                        const penalty = record as typeof record & { player_no: number; offence: string; minutes: number; };
                        const penaltyTeam = penalty.team_id === homeTeam.id ? homeTeam : awayTeam;
                        return (
                          <div key={`penalty-${index}`} className="flex items-start gap-3 p-3 border rounded-lg">
                            <img src={penaltyTeam.logo} alt={penaltyTeam.name} className="w-10 h-10 object-contain" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">{penalty.period}P {adjustGameTime(penalty.period, penalty.time)}</Badge>
                                <Badge variant="destructive" className="text-xs">{penalty.minutes}분</Badge>
                              </div>
                              <p className="font-medium">
                                페널티: {getPlayerName(penalty.player_no, penalty.team_id)} (#{penalty.player_no})
                              </p>
                              <p className="text-sm text-muted-foreground">반칙: {penalty.offence}</p>
                            </div>
                          </div>
                        );
                      }
                    })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* 탭 3: 선수 명단 */}
          <TabsContent value="roster" className="space-y-6">
            {/* 홈팀 */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <img src={homeTeam.logo} alt={homeTeam.name} className="w-8 h-8 object-contain" />
                <h3 className="font-semibold">{homeTeam.name}</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">번호</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead className="text-center w-16">포지션</TableHead>
                      <TableHead className="text-center w-16">SOG</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameDetail.home_roster
                      .filter(p => p.played)
                      .map((player) => (
                        <TableRow key={player.no}>
                          <TableCell className="font-medium">#{player.no}</TableCell>
                          <TableCell>
                            {player.name}
                            {player.captain_asst && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {player.captain_asst}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{player.pos}</TableCell>
                          <TableCell className="text-center">{player.sog}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* 어웨이팀 */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <img src={awayTeam.logo} alt={awayTeam.name} className="w-8 h-8 object-contain" />
                <h3 className="font-semibold">{awayTeam.name}</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">번호</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead className="text-center w-16">포지션</TableHead>
                      <TableHead className="text-center w-16">SOG</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameDetail.away_roster
                      .filter(p => p.played)
                      .map((player) => (
                        <TableRow key={player.no}>
                          <TableCell className="font-medium">#{player.no}</TableCell>
                          <TableCell>
                            {player.name}
                            {player.captain_asst && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {player.captain_asst}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{player.pos}</TableCell>
                          <TableCell className="text-center">{player.sog}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 기타 정보 */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-3">경기 정보</h3>
          <div className="text-sm">
            <h4 className="font-medium mb-2">코치진</h4>
            <div className="space-y-1 text-muted-foreground">
              <p>홈 감독: {gameDetail.game_info.coaches.home_manager}</p>
              <p>홈 코치: {gameDetail.game_info.coaches.home_coach}</p>
              <p>원정 감독: {gameDetail.game_info.coaches.away_manager}</p>
              <p>원정 코치: {gameDetail.game_info.coaches.away_coach}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GameDetail;
