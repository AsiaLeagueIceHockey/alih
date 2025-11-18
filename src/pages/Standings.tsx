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
  player_name: string;
  jersey_number: string;
  team_id: number;
  goals: number;
  assists: number;
  points: number;
  goals_rank: number | null;
  assists_rank: number | null;
  points_rank: number | null;
  team?: AlihTeam;
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
      const { data, error } = await externalSupabase
        .from('alih_player_stats')
        .select('*, team:alih_teams(name, logo)')
        .order('points_rank', { ascending: true });
      
      if (error) throw error;
      
      // Flatten the team data for easier access
      return (data || []).map(player => ({
        ...player,
        team: player.team as unknown as AlihTeam
      })) as PlayerStats[];
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
                      <th className="p-3 font-semibold text-muted-foreground text-center">정규승</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">연장승</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">승부승</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">정규패</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">연장패</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">승부패</th>
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
                        <td className="p-3 text-center">{standing.lose_60min}</td>
                        <td className="p-3 text-center">{standing.lose_ot}</td>
                        <td className="p-3 text-center">{standing.lose_pss}</td>
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
            <Tabs defaultValue="goals" className="w-full">
              <TabsList className="w-full h-auto bg-transparent p-0 border-b border-border mb-4">
                <TabsTrigger 
                  value="goals" 
                  className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  득점 순위
                </TabsTrigger>
                <TabsTrigger 
                  value="assists"
                  className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  도움 순위
                </TabsTrigger>
                <TabsTrigger 
                  value="points"
                  className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  포인트 순위
                </TabsTrigger>
              </TabsList>

              {/* 득점 순위 */}
              <TabsContent value="goals">
                <Card className="border-border">
                  {isLoadingPlayers ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {playerStats
                        ?.filter(p => p.goals_rank !== null)
                        .sort((a, b) => (a.goals_rank || 0) - (b.goals_rank || 0))
                        .map((player) => (
                          <div 
                            key={`goals-${player.player_name}-${player.team_id}`}
                            className="p-4 hover:bg-secondary/30 transition-colors flex items-center gap-4"
                          >
                            {/* 순위 */}
                            <div className="flex-shrink-0 w-8 text-center">
                              {player.goals_rank === 1 ? (
                                <div className="text-xl font-bold text-yellow-500">🥇</div>
                              ) : player.goals_rank === 2 ? (
                                <div className="text-xl font-bold text-gray-400">🥈</div>
                              ) : player.goals_rank === 3 ? (
                                <div className="text-xl font-bold text-orange-600">🥉</div>
                              ) : (
                                <div className="text-sm font-semibold text-muted-foreground">
                                  {player.goals_rank}
                                </div>
                              )}
                            </div>

                            {/* 선수 정보 */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <img 
                                src={player.team?.logo || ''} 
                                alt={player.team?.name || ''}
                                className="w-10 h-10 rounded-full object-contain flex-shrink-0 bg-muted/50 p-1"
                                loading="lazy"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-base text-foreground truncate">
                                  {player.player_name}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>No.{player.jersey_number}</span>
                                  <span>•</span>
                                  <span className="truncate">{player.team?.name}</span>
                                </div>
                              </div>
                            </div>

                            {/* 스탯 정보 */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  {player.goals}
                                </div>
                                <div className="text-xs text-muted-foreground">골</div>
                              </div>
                              <div className="text-right opacity-50">
                                <div className="text-sm text-muted-foreground">
                                  {player.assists}A / {player.points}P
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* 도움 순위 */}
              <TabsContent value="assists">
                <Card className="border-border">
                  {isLoadingPlayers ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {playerStats
                        ?.filter(p => p.assists_rank !== null)
                        .sort((a, b) => (a.assists_rank || 0) - (b.assists_rank || 0))
                        .map((player) => (
                          <div 
                            key={`assists-${player.player_name}-${player.team_id}`}
                            className="p-4 hover:bg-secondary/30 transition-colors flex items-center gap-4"
                          >
                            {/* 순위 */}
                            <div className="flex-shrink-0 w-8 text-center">
                              {player.assists_rank === 1 ? (
                                <div className="text-xl font-bold text-yellow-500">🥇</div>
                              ) : player.assists_rank === 2 ? (
                                <div className="text-xl font-bold text-gray-400">🥈</div>
                              ) : player.assists_rank === 3 ? (
                                <div className="text-xl font-bold text-orange-600">🥉</div>
                              ) : (
                                <div className="text-sm font-semibold text-muted-foreground">
                                  {player.assists_rank}
                                </div>
                              )}
                            </div>

                            {/* 선수 정보 */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <img 
                                src={player.team?.logo || ''} 
                                alt={player.team?.name || ''}
                                className="w-10 h-10 rounded-full object-contain flex-shrink-0 bg-muted/50 p-1"
                                loading="lazy"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-base text-foreground truncate">
                                  {player.player_name}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>No.{player.jersey_number}</span>
                                  <span>•</span>
                                  <span className="truncate">{player.team?.name}</span>
                                </div>
                              </div>
                            </div>

                            {/* 스탯 정보 */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  {player.assists}
                                </div>
                                <div className="text-xs text-muted-foreground">도움</div>
                              </div>
                              <div className="text-right opacity-50">
                                <div className="text-sm text-muted-foreground">
                                  {player.goals}G / {player.points}P
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* 포인트 순위 */}
              <TabsContent value="points">
                <Card className="border-border">
                  {isLoadingPlayers ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {playerStats
                        ?.filter(p => p.points_rank !== null)
                        .sort((a, b) => (a.points_rank || 0) - (b.points_rank || 0))
                        .map((player) => (
                          <div 
                            key={`points-${player.player_name}-${player.team_id}`}
                            className="p-4 hover:bg-secondary/30 transition-colors flex items-center gap-4"
                          >
                            {/* 순위 */}
                            <div className="flex-shrink-0 w-8 text-center">
                              {player.points_rank === 1 ? (
                                <div className="text-xl font-bold text-yellow-500">🥇</div>
                              ) : player.points_rank === 2 ? (
                                <div className="text-xl font-bold text-gray-400">🥈</div>
                              ) : player.points_rank === 3 ? (
                                <div className="text-xl font-bold text-orange-600">🥉</div>
                              ) : (
                                <div className="text-sm font-semibold text-muted-foreground">
                                  {player.points_rank}
                                </div>
                              )}
                            </div>

                            {/* 선수 정보 */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <img 
                                src={player.team?.logo || ''} 
                                alt={player.team?.name || ''}
                                className="w-10 h-10 rounded-full object-contain flex-shrink-0 bg-muted/50 p-1"
                                loading="lazy"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-base text-foreground truncate">
                                  {player.player_name}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>No.{player.jersey_number}</span>
                                  <span>•</span>
                                  <span className="truncate">{player.team?.name}</span>
                                </div>
                              </div>
                            </div>

                            {/* 스탯 정보 */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  {player.points}
                                </div>
                                <div className="text-xs text-muted-foreground">포인트</div>
                              </div>
                              <div className="text-right opacity-50">
                                <div className="text-sm text-muted-foreground">
                                  {player.goals}G / {player.assists}A
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Standings;
