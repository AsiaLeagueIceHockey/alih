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
  team: string;
  gp: number;
  pts: number;
  w: number;
  l: number;
  otw: number;
  otl: number;
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-standings`
      );
      const data = await response.json();
      return data.standings as TeamStanding[];
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

  const getTeamName = (englishName: string) => {
    const team = alihTeams?.find(
      t => t.english_name.toLowerCase() === englishName.toLowerCase()
    );
    return team?.name || englishName;
  };

  const getTeamLogo = (nameOrEnglishName: string) => {
    // 먼저 한국어 이름으로 찾기
    let team = alihTeams?.find(t => t.name === nameOrEnglishName);
    // 없으면 영어 이름으로 찾기
    if (!team) {
      team = alihTeams?.find(
        t => t.english_name.toLowerCase() === nameOrEnglishName.toLowerCase()
      );
    }
    return team?.logo || '';
  };

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
                      <th className="p-3 font-semibold text-primary">팀명</th>
                      <th className="p-3 font-semibold text-primary text-center">경기</th>
                      <th className="p-3 font-semibold text-primary text-center">승점</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">승</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">패</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">연승</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">연패</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamStandings?.map((standing) => (
                      <tr 
                        key={standing.rank} 
                        className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                          standing.team === "HL 안양" ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="p-3 font-bold text-primary">{standing.rank}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <img 
                              src={getTeamLogo(standing.team)} 
                              alt={standing.team}
                              className="w-6 h-6 object-contain"
                            />
                            <span className="font-medium">{standing.team}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">{standing.gp}</td>
                        <td className="p-3 text-center font-bold text-primary">{standing.pts}</td>
                        <td className="p-3 text-center">{standing.w}</td>
                        <td className="p-3 text-center">{standing.l}</td>
                        <td className="p-3 text-center text-accent">{standing.otw}</td>
                        <td className="p-3 text-center text-muted-foreground">{standing.otl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <div className="mt-4 text-xs text-muted-foreground space-y-1 px-2">
              <p>• GP: 경기수 | PTS: 승점 | W: 승 | L: 패</p>
              <p>• OTW: 연장 승 | OTL: 연장 패</p>
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
                              src={getTeamLogo(player.team.name) || player.team.logo.medium} 
                              alt={getTeamName(player.team.name)}
                              className="w-5 h-5 object-contain"
                            />
                            <span className="text-xs text-muted-foreground">{getTeamName(player.team.name)}</span>
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
