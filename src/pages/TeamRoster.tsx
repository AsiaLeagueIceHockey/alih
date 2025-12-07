import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SEO from "@/components/SEO";
import TeamHeader from "@/components/team/TeamHeader";
import { Team, Player, TeamStanding } from "@/types/team";

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

const TeamRoster = () => {
  const { teamId } = useParams<{ teamId: string }>();

  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['team-detail', teamId],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return data as Team;
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // 순위 정보 조회
  const { data: standings } = useQuery({
    queryKey: ['team-standings'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_standings')
        .select('*, team:alih_teams(name, logo)')
        .order('rank', { ascending: true });

      if (error) throw error;
      return (data || []).map(standing => ({
        ...standing,
        team: standing.team as unknown as { name: string; logo: string }
      })) as TeamStanding[];
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // 해당 팀의 현재 순위
  const currentRank = standings?.find(s => s.team_id === Number(teamId))?.rank;

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['team-players', teamId],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_players')
        .select('*')
        .eq('team_id', teamId)
        .order('points', { ascending: false });

      if (error) throw error;
      return data as Player[];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  if (isLoadingTeam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">팀 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${team.name} 선수단 - 선수 명단 및 통계`}
        description={`${team.name}의 전체 선수 명단과 시즌 통계를 확인하세요.`}
        keywords={`${team.name}, 선수 명단, 아시아리그, 아이스하키`}
        path={`/roster/${teamId}`}
      />

      <div className="min-h-screen pb-20">
        {/* 헤더 & 팀 아이덴티티 */}
        <div className="relative bg-gradient-to-b from-secondary/50 to-background">
          <TeamHeader team={team} rank={currentRank} />
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* 팀 페이지로 돌아가기 */}
          <Button variant="ghost" asChild className="mb-4">
            <Link to={`/team/${teamId}`} className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              팀 페이지로
            </Link>
          </Button>

          {/* 선수 명단 */}
          <Card className="p-4 md:p-6">
            <h2 className="text-lg font-bold mb-4">선수 명단</h2>

            {isLoadingPlayers ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : players && players.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">등번호</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead className="text-center">포지션</TableHead>
                      <TableHead className="text-center">경기</TableHead>
                      <TableHead className="text-center">골</TableHead>
                      <TableHead className="text-center">도움</TableHead>
                      <TableHead className="text-center font-semibold">포인트</TableHead>
                      <TableHead className="text-center">페널티</TableHead>
                      <TableHead className="text-center">+/-</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id} className="hover:bg-secondary/30">
                        <TableCell className="text-center font-medium">
                          {player.jersey_number}
                        </TableCell>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-1 bg-secondary rounded text-xs font-medium">
                            {player.position}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{player.games_played}</TableCell>
                        <TableCell className="text-center font-semibold text-primary">
                          {player.goals}
                        </TableCell>
                        <TableCell className="text-center">{player.assists}</TableCell>
                        <TableCell className="text-center font-bold text-lg">
                          {player.points}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {player.pim}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {player.plus_minus > 0 ? '+' : ''}{player.plus_minus}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                등록된 선수가 없습니다.
              </p>
            )}

            {/* 통계 용어 설명 */}
            {players && players.length > 0 && (
              <div className="mt-4 p-4 bg-secondary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">+/−</span> : 선수가 얼음 위에 있는 동안, 5대5(또는 균등 인원 상황)에서 팀이 득점한 골과 실점한 골의 차이를 나타냅니다.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default TeamRoster;
