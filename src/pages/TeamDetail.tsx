import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import SEO from "@/components/SEO";

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

interface Team {
  id: number;
  name: string;
  english_name: string;
  logo: string;
  website: string;
  team_code: string;
}

interface Player {
  id: number;
  name: string;
  jersey_number: string;
  position: string;
  games_played: number;
  goals: number;
  assists: number;
  points: number;
  penalty_minutes: number;
  plus_minus: number;
}

const TeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

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
  });

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
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`${team.name} - 팀 상세 정보`}
        description={`${team.name}의 선수 명단과 통계를 확인하세요.`}
      />
      
      <div className="min-h-screen pb-20">
        <PageHeader title={team.name} subtitle="팀 상세 정보" />
        
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>

          {/* 팀 정보 카드 */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* 팀 로고 */}
              <div className="flex-shrink-0">
                <img 
                  src={team.logo} 
                  alt={team.name} 
                  className="w-32 h-32 object-contain"
                />
              </div>

              {/* 팀 정보 */}
              <div className="flex-1 text-center md:text-left space-y-3">
                <h1 className="text-3xl font-bold">{team.name}</h1>
                <p className="text-xl text-muted-foreground">{team.english_name}</p>
                
                {team.website && (
                  <a 
                    href={team.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    공식 홈페이지
                  </a>
                )}
              </div>
            </div>
          </Card>

          {/* 선수 명단 */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">선수 명단</h2>
            
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
                          {player.penalty_minutes}
                        </TableCell>
                        <TableCell className={`text-center font-medium ${
                          player.plus_minus > 0 ? 'text-green-600' : 
                          player.plus_minus < 0 ? 'text-red-600' : 
                          'text-muted-foreground'
                        }`}>
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
          </Card>
        </div>
      </div>
    </>
  );
};

export default TeamDetail;
