import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlihTeam } from "@/hooks/useTeams";

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

const GameDetail = () => {
  const { gameNo } = useParams<{ gameNo: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { homeTeam, awayTeam, matchDate } = location.state as { 
    homeTeam: AlihTeam; 
    awayTeam: AlihTeam;
    matchDate: string;
  };

  const { data: gameDetail, isLoading, error } = useQuery({
    queryKey: ['game-detail', gameNo],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_game_details')
        .select('*')
        .eq('game_no', gameNo)
        .single();

      if (error) throw error;
      return data as GameDetailData;
    },
    enabled: !!gameNo,
  });

  const getPlayerName = (playerNo: number, teamId: number) => {
    if (!gameDetail) return `#${playerNo}`;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !gameDetail) {
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

  const matchDateObj = new Date(matchDate);
  const [homeScore, awayScore] = gameDetail.game_summary.total.score.split(' : ');

  return (
    <div className="min-h-screen bg-background pb-20">
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
            <div className="flex-1 flex flex-col items-center">
              <img src={homeTeam.logo} alt={homeTeam.name} className="w-16 h-16 object-contain mb-2" />
              <p className="text-sm font-medium text-center">{homeTeam.name}</p>
            </div>

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
            <div className="flex-1 flex flex-col items-center">
              <img src={awayTeam.logo} alt={awayTeam.name} className="w-16 h-16 object-contain mb-2" />
              <p className="text-sm font-medium text-center">{awayTeam.name}</p>
            </div>
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

          {/* 탭 3: 페널티 (삭제됨 - 득점 기록 탭에 통합) */}

          {/* 탭 4: 선수 명단 */}
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
