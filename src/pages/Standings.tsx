import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import SEO from "@/components/SEO";

const externalSupabase = createClient(
  "https://nvlpbdyqfzmlrjauvhxx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68"
);

interface TeamStanding {
  rank: number;
  team_id: number;
  games_played: number;
  points: number;
  win_60min: number;
  win_ot: number;
  win_pss: number;
  lose_pss: number;
  lose_ot: number;
  lose_60min: number;
  goals_for: number;
  goals_against: number;
  team?: AlihTeam;
}

interface PlayerStats {
  player: { 
    name: string; 
    nationality: { slug: string; name: string };
    flagUrl: string;
  };
  team: { name: string; logo: { medium: string } };
  regularStats: { GP: number; G: number; A: number; PTS: number };
}

interface AlihTeam {
  english_name: string;
  name: string;
  logo: string;
}

const Standings = () => {
  const { data: alihTeams } = useQuery({
    queryKey: ['alih-teams'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_teams')
        .select('english_name, name, logo');
      
      if (error) throw error;
      return data as AlihTeam[];
    },
    staleTime: 1000 * 60 * 60, // 1시간 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
  });

  const { data: teamStandings, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['team-standings'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_standings')
        .select('*, team:alih_teams(name, logo)')
        .order('rank', { ascending: true });
      
      if (error) throw error;
      
      // Flatten the team data for easier access
      return (data || []).map(standing => ({
        ...standing,
        team: standing.team as unknown as AlihTeam
      })) as TeamStanding[];
    },
    staleTime: 1000 * 60 * 60, // 1시간 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
  });

  const { data: playerStats, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['player-stats'],
    queryFn: async () => {
      const response = await fetch(
        'https://widget.eliteprospects.com/api/league/asia-league/scoring-leaders?season=2025-2026&statsType=regular'
      );
      const data = await response.json();
      return data.data as PlayerStats[];
    },
    staleTime: 1000 * 60 * 60, // 1시간 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
  });


  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO 
        title="아시아리그 순위 - 팀 순위 및 선수 스탯"
        description="아시아리그 아이스하키 2025-26 시즌 팀 순위표와 개인 기록을 확인하세요. 승점, 골, 어시스트, 포인트 등 상세 스탯을 제공합니다."
        keywords="아시아리그 순위, 아이스하키 순위표, 팀 순위, 선수 스탯, 득점 순위"
        path="/standings"
      />
      <PageHeader title="순위" subtitle="2025-26 시즌 기록" />
      
      <div className="container mx-auto px-4">
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="teams">팀 순위</TabsTrigger>
            <TabsTrigger value="players">개인 기록</TabsTrigger>
          </TabsList>
          
          <TabsContent value="teams">
            <Card className="overflow-x-auto border-border">
              {isLoadingTeams ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr className="text-left">
                      <th className="p-3 font-semibold text-primary">#</th>
                      <th className="p-3 font-semibold text-primary">팀</th>
                      <th className="p-3 font-semibold text-primary text-center">경기</th>
                      <th className="p-3 font-semibold text-primary text-center">승점</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">60분승</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">연장승</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">PSS승</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">PSS패</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">연장패</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">60분패</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">골득실</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamStandings?.map((standing) => (
                      <tr 
                        key={standing.rank} 
                        className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                          standing.team?.name === "안양 한라" ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="p-3 font-bold text-primary">{standing.rank}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <img 
                              src={standing.team?.logo || ''} 
                              alt={standing.team?.name || ''}
                              className="w-6 h-6 object-contain"
                            />
                            <span className="font-medium">{standing.team?.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">{standing.games_played}</td>
                        <td className="p-3 text-center font-bold text-primary">{standing.points}</td>
                        <td className="p-3 text-center">{standing.win_60min}</td>
                        <td className="p-3 text-center">{standing.win_ot}</td>
                        <td className="p-3 text-center">{standing.win_pss}</td>
                        <td className="p-3 text-center">{standing.lose_pss}</td>
                        <td className="p-3 text-center">{standing.lose_ot}</td>
                        <td className="p-3 text-center">{standing.lose_60min}</td>
                        <td className="p-3 text-center text-xs">
                          {standing.goals_for} - {standing.goals_against}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <div className="mt-4 text-xs text-muted-foreground space-y-2 px-2">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">📊 용어 설명</p>
                <p>• <span className="font-medium">OT (Overtime)</span>: 연장전. 정규 시간 60분 동안 승부가 나지 않으면 진행합니다.</p>
                <p>• <span className="font-medium">PSS (Penalty Shootout)</span>: 승부샷. 연장전에서도 승부가 나지 않을 경우 진행하는 승부치기입니다.</p>
                <p>• <span className="font-medium">승점 방식</span>: 정규 60분 승(3점), 연장/승부샷 승(2점), 연장/승부샷 패(1점), 정규 60분 패(0점)</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="players">
            <Card className="overflow-x-auto border-border">
              {isLoadingPlayers ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr className="text-left">
                      <th className="p-3 font-semibold text-primary">#</th>
                      <th className="p-3 font-semibold text-primary">선수명</th>
                      <th className="p-3 font-semibold text-primary">팀</th>
                      <th className="p-3 font-semibold text-primary text-center">경기</th>
                      <th className="p-3 font-semibold text-primary text-center">골</th>
                      <th className="p-3 font-semibold text-primary text-center">도움</th>
                      <th className="p-3 font-semibold text-primary text-center">득점</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerStats?.slice(0, 20).map((player, index) => (
                      <tr 
                        key={index} 
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="p-3 font-bold text-primary">{index + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <img 
                              src={player.player.flagUrl} 
                              alt={player.player.nationality.name}
                              className="w-5 h-4 object-cover"
                            />
                            <span className="font-medium">{player.player.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <img 
                              src={player.team.logo.medium} 
                              alt={player.team.name}
                              className="w-5 h-5 object-contain"
                            />
                            <span className="text-xs text-muted-foreground">{player.team.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">{player.regularStats.GP}</td>
                        <td className="p-3 text-center">{player.regularStats.G}</td>
                        <td className="p-3 text-center">{player.regularStats.A}</td>
                        <td className="p-3 text-center font-bold text-primary">{player.regularStats.PTS}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <div className="mt-4 text-xs text-muted-foreground space-y-1 px-2">
              <p>• GP: 경기수 | G: 골 | A: 어시스트 | PTS: 득점</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Standings;
