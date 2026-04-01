import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { externalSupabase } from "@/lib/supabase-external";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";

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
  id: number;
  slug?: string;
  name: string;
  jersey_number: string;
  team_id: number;
  goals: number;
  assists: number;
  points: number;
  team?: AlihTeam;
}

interface AlihTeam {
  english_name: string;
  japanese_name?: string;
  name: string;
  logo: string;
}

const Standings = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { data: teamStandings, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['team-standings'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_standings')
        .select('*, team:alih_teams(name, english_name, japanese_name, logo)')
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

  // 득점 순위 데이터
  const { data: goalLeaders, isLoading: isLoadingGoals } = useQuery({
    queryKey: ['goal-leaders'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_players')
        .select('*, team:alih_teams(name, english_name, japanese_name, logo)')
        .order('goals', { ascending: false })
        .order('assists', { ascending: false })
        .order('points', { ascending: false });
      
      if (error) throw error;
      
      const players = (data || []).map(player => ({
        ...player,
        team: player.team as unknown as AlihTeam
      })) as PlayerStats[];
      
      // 30등의 골 수를 찾고, 그 값 이상인 선수들만 반환
      if (players.length > 30) {
        const rank30Goals = players[29].goals;
        return players.filter(p => p.goals >= rank30Goals);
      }
      return players;
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // 도움 순위 데이터
  const { data: assistLeaders, isLoading: isLoadingAssists } = useQuery({
    queryKey: ['assist-leaders'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_players')
        .select('*, team:alih_teams(name, english_name, japanese_name, logo)')
        .order('assists', { ascending: false })
        .order('goals', { ascending: false })
        .order('points', { ascending: false });
      
      if (error) throw error;
      
      const players = (data || []).map(player => ({
        ...player,
        team: player.team as unknown as AlihTeam
      })) as PlayerStats[];
      
      // 30등의 도움 수를 찾고, 그 값 이상인 선수들만 반환
      if (players.length > 30) {
        const rank30Assists = players[29].assists;
        return players.filter(p => p.assists >= rank30Assists);
      }
      return players;
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // 포인트 순위 데이터
  const { data: pointLeaders, isLoading: isLoadingPoints } = useQuery({
    queryKey: ['point-leaders'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_players')
        .select('*, team:alih_teams(name, english_name, japanese_name, logo)')
        .order('points', { ascending: false })
        .order('goals', { ascending: false })
        .order('assists', { ascending: false });
      
      if (error) throw error;
      
      const players = (data || []).map(player => ({
        ...player,
        team: player.team as unknown as AlihTeam
      })) as PlayerStats[];
      
      // 30등의 포인트를 찾고, 그 값 이상인 선수들만 반환
      if (players.length > 30) {
        const rank30Points = players[29].points;
        return players.filter(p => p.points >= rank30Points);
      }
      return players;
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // 순위 계산 함수 (동점자 처리)
  const calculateRank = (players: PlayerStats[], statKey: 'goals' | 'assists' | 'points') => {
    let currentRank = 1;
    let previousValue = -1;
    
    return players.map((player, index) => {
      const currentValue = player[statKey];
      if (currentValue !== previousValue) {
        currentRank = index + 1;
        previousValue = currentValue;
      }
      return { ...player, rank: currentRank };
    });
  };

  // 순위 페이지용 구조화 데이터
  const standingsStructuredData = {
    "@context": "https://schema.org",
    "@type": "Table",
    "name": "아시아리그 아이스하키 2025-26 시즌 순위표",
    "description": "아시아리그 아이스하키 팀 순위, 승점, 승패, 골득실 정보",
    "about": {
      "@type": "SportsLeague",
      "name": "Asia League Ice Hockey",
      "season": "2025-26"
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": t('nav.home'), "item": "https://alhockey.fans" },
      { "@type": "ListItem", "position": 2, "name": t('nav.standings'), "item": "https://alhockey.fans/standings" }
    ]
  };


  return (
    <div className="min-h-screen bg-background pb-10">
      <SEO 
        title="아시아리그 순위 - 팀 순위표, 선수 스탯 | 2025-26 시즌"
        description="아시아리그 아이스하키 2025-26 시즌 팀 순위표와 개인 기록 확인. 승점, 승패, 골득실, 득점왕, 어시스트왕, 포인트 리더 등 상세 스탯 제공. HL안양, 홋카이도 레드이글스 순위 실시간 업데이트."
        keywords="아시아리그 순위, 아이스하키 순위표, 팀 순위, 선수 스탯, 득점 순위, 아시아리그 팀 순위, 2025-26 시즌 순위, HL안양 순위, 안양한라 순위, 홋카이도 레드이글스 순위, 도호쿠 프리블레이즈 순위, 닛코 아이스벅스 순위, 요코하마 그리츠 순위, 스타즈 고베 순위, 승점 순위, 득점왕, 어시스트왕, 포인트 순위, 골득실"
        path="/standings"
        structuredData={[standingsStructuredData, breadcrumbData]}
      />
      <PageHeader title={t('page.standings.title')} subtitle={t('page.standings.subtitle')} />
      
      <div className="container mx-auto px-4">
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="teams">{t('standings.teamRank')}</TabsTrigger>
            <TabsTrigger value="players">{t('standings.playerStats')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="teams">
            <Card className="overflow-x-auto border-border">
              {isLoadingTeams ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="border-b border-border">
                    <tr className="text-left">
                      <th className="p-2 md:p-3 font-semibold text-primary">{t('standings.headers.rank')}</th>
                      <th className="p-2 md:p-3 font-semibold text-primary whitespace-nowrap">{t('standings.headers.team')}</th>
                      <th className="p-2 md:p-3 font-semibold text-primary text-center whitespace-nowrap">{t('standings.headers.gamesPlayed')}</th>
                      <th className="p-2 md:p-3 font-semibold text-primary text-center whitespace-nowrap">{t('standings.headers.points')}</th>
                      <th className="p-2 md:p-3 font-semibold text-muted-foreground text-center whitespace-nowrap">{t('standings.headers.regWin')}</th>
                      <th className="p-2 md:p-3 font-semibold text-muted-foreground text-center whitespace-nowrap">{t('standings.headers.otWin')}</th>
                      <th className="p-2 md:p-3 font-semibold text-muted-foreground text-center whitespace-nowrap">{t('standings.headers.pssWin')}</th>
                      <th className="p-2 md:p-3 font-semibold text-muted-foreground text-center whitespace-nowrap">{t('standings.headers.regLoss')}</th>
                      <th className="p-2 md:p-3 font-semibold text-muted-foreground text-center whitespace-nowrap">{t('standings.headers.otLoss')}</th>
                      <th className="p-2 md:p-3 font-semibold text-muted-foreground text-center whitespace-nowrap">{t('standings.headers.pssLoss')}</th>
                      <th className="p-2 md:p-3 font-semibold text-muted-foreground text-center whitespace-nowrap">{t('standings.headers.goalDiff')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamStandings?.map((standing) => (
                      <tr 
                        key={standing.rank} 
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="p-2 md:p-3 font-bold text-primary">{standing.rank}</td>
                        <td className="p-2 md:p-3 pr-4 md:pr-6">
                          <Link 
                            to={`/team/${standing.team_id}`}
                            className="flex items-center gap-2 hover:text-primary transition-colors whitespace-nowrap"
                          >
                            <img 
                              src={standing.team?.logo || ''} 
                              alt={getLocalizedTeamName(standing.team, currentLang)}
                              className="w-6 h-6 object-contain flex-shrink-0"
                              loading="lazy"
                            />
                            <span className="font-medium hover:underline">{getLocalizedTeamName(standing.team, currentLang)}</span>
                          </Link>
                        </td>
                        <td className="p-2 md:p-3 text-center">{standing.games_played}</td>
                        <td className="p-2 md:p-3 text-center font-bold text-primary">{standing.points}</td>
                        <td className="p-2 md:p-3 text-center">{standing.win_60min}</td>
                        <td className="p-2 md:p-3 text-center">{standing.win_ot}</td>
                        <td className="p-2 md:p-3 text-center">{standing.win_pss}</td>
                        <td className="p-2 md:p-3 text-center">{standing.lose_60min}</td>
                        <td className="p-2 md:p-3 text-center">{standing.lose_ot}</td>
                        <td className="p-2 md:p-3 text-center">{standing.lose_pss}</td>
                        <td className="p-2 md:p-3 text-center text-xs whitespace-nowrap">
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
                <p className="font-semibold text-foreground">{t('standings.explanation.title')}</p>
                <p>• <span className="font-medium">OT (Overtime)</span>: {t('standings.explanation.ot')}</p>
                <p>• <span className="font-medium">PSS (Penalty Shootout)</span>: {t('standings.explanation.pss')}</p>
                <p>• <span className="font-medium">{currentLang === 'ko' ? '승점 방식' : currentLang === 'ja' ? '勝点方式' : 'Points'}</span>: {t('standings.explanation.pointsRule')}</p>
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
                  {t('playerRanks.goals')}
                </TabsTrigger>
                <TabsTrigger 
                  value="assists"
                  className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  {t('playerRanks.assists')}
                </TabsTrigger>
                <TabsTrigger 
                  value="points"
                  className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  {t('playerRanks.points')}
                </TabsTrigger>
              </TabsList>

              {/* 득점 순위 */}
              <TabsContent value="goals">
                <Card className="border-border">
                  {isLoadingGoals ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {calculateRank(goalLeaders || [], 'goals').map((player) => (
                          <div 
                            key={`goals-${player.name}-${player.team_id}`}
                            className="p-4 hover:bg-secondary/30 transition-colors flex items-center gap-2 md:gap-4"
                          >
                            {/* 순위 */}
                            <div className="flex-shrink-0 w-8 text-center">
                              {player.rank === 1 ? (
                                <div className="text-xl font-bold text-medal-gold">🥇</div>
                              ) : player.rank === 2 ? (
                                <div className="text-xl font-bold text-medal-silver">🥈</div>
                              ) : player.rank === 3 ? (
                                <div className="text-xl font-bold text-medal-bronze">🥉</div>
                              ) : (
                                <div className="text-sm font-semibold text-muted-foreground">
                                  {player.rank}
                                </div>
                              )}
                            </div>

                            {/* 선수 정보 */}
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                              <img 
                                src={player.team?.logo || ''} 
                                alt={getLocalizedTeamName(player.team, currentLang)}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-contain flex-shrink-0 bg-muted/50 p-1"
                                loading="lazy"
                              />
                              <div className="flex-1 min-w-0">
                                <Link 
                                  to={`/player/${player.slug || player.id}`}
                                  className="font-bold text-sm md:text-base text-foreground truncate hover:text-primary hover:underline transition-colors cursor-pointer"
                                >
                                  {player.name}
                                </Link>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>No.{player.jersey_number}</span>
                                  <span>•</span>
                                  <span className="truncate">{getLocalizedTeamName(player.team, currentLang)}</span>
                                </div>
                              </div>
                            </div>

                            {/* 스탯 정보 */}
                            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                              <div className="text-right">
                                <div className="text-xl md:text-2xl font-bold text-primary">
                                  {player.goals}
                                </div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">{t('standings.playerLabels.goal')}</div>
                              </div>
                              <div className="text-right opacity-50">
                                <div className="text-xs md:text-sm text-muted-foreground">
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
                  {isLoadingAssists ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {calculateRank(assistLeaders || [], 'assists').map((player) => (
                          <div 
                            key={`assists-${player.name}-${player.team_id}`}
                            className="p-4 hover:bg-secondary/30 transition-colors flex items-center gap-2 md:gap-4"
                          >
                            {/* 순위 */}
                            <div className="flex-shrink-0 w-8 text-center">
                              {player.rank === 1 ? (
                                <div className="text-xl font-bold text-medal-gold">🥇</div>
                              ) : player.rank === 2 ? (
                                <div className="text-xl font-bold text-medal-silver">🥈</div>
                              ) : player.rank === 3 ? (
                                <div className="text-xl font-bold text-medal-bronze">🥉</div>
                              ) : (
                                <div className="text-sm font-semibold text-muted-foreground">
                                  {player.rank}
                                </div>
                              )}
                            </div>

                            {/* 선수 정보 */}
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                              <img 
                                src={player.team?.logo || ''} 
                                alt={getLocalizedTeamName(player.team, currentLang)}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-contain flex-shrink-0 bg-muted/50 p-1"
                                loading="lazy"
                              />
                              <div className="flex-1 min-w-0">
                                <Link 
                                  to={`/player/${player.slug || player.id}`}
                                  className="font-bold text-sm md:text-base text-foreground truncate hover:text-primary hover:underline transition-colors cursor-pointer"
                                >
                                  {player.name}
                                </Link>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>No.{player.jersey_number}</span>
                                  <span>•</span>
                                  <span className="truncate">{getLocalizedTeamName(player.team, currentLang)}</span>
                                </div>
                              </div>
                            </div>

                            {/* 스탯 정보 */}
                            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                              <div className="text-right">
                                <div className="text-xl md:text-2xl font-bold text-primary">
                                  {player.assists}
                                </div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">{t('standings.playerLabels.assist')}</div>
                              </div>
                              <div className="text-right opacity-50">
                                <div className="text-xs md:text-sm text-muted-foreground">
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
                  {isLoadingPoints ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {calculateRank(pointLeaders || [], 'points').map((player) => (
                          <div 
                            key={`points-${player.name}-${player.team_id}`}
                            className="p-4 hover:bg-secondary/30 transition-colors flex items-center gap-2 md:gap-4"
                          >
                            {/* 순위 */}
                            <div className="flex-shrink-0 w-8 text-center">
                              {player.rank === 1 ? (
                                <div className="text-xl font-bold text-medal-gold">🥇</div>
                              ) : player.rank === 2 ? (
                                <div className="text-xl font-bold text-medal-silver">🥈</div>
                              ) : player.rank === 3 ? (
                                <div className="text-xl font-bold text-medal-bronze">🥉</div>
                              ) : (
                                <div className="text-sm font-semibold text-muted-foreground">
                                  {player.rank}
                                </div>
                              )}
                            </div>

                            {/* 선수 정보 */}
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                              <img 
                                src={player.team?.logo || ''} 
                                alt={getLocalizedTeamName(player.team, currentLang)}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-contain flex-shrink-0 bg-muted/50 p-1"
                                loading="lazy"
                              />
                              <div className="flex-1 min-w-0">
                                <Link 
                                  to={`/player/${player.slug || player.id}`}
                                  className="font-bold text-sm md:text-base text-foreground truncate hover:text-primary hover:underline transition-colors cursor-pointer"
                                >
                                  {player.name}
                                </Link>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>No.{player.jersey_number}</span>
                                  <span>•</span>
                                  <span className="truncate">{getLocalizedTeamName(player.team, currentLang)}</span>
                                </div>
                              </div>
                            </div>

                            {/* 스탯 정보 */}
                            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                              <div className="text-right">
                                <div className="text-xl md:text-2xl font-bold text-primary">
                                  {player.points}
                                </div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">{t('standings.playerLabels.point')}</div>
                              </div>
                              <div className="text-right opacity-50">
                                <div className="text-xs md:text-sm text-muted-foreground">
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
