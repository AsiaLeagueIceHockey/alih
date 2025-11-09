import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface TeamStanding {
  team: { name: string };
  teamLogo: { medium: string };
  stats: { GP: number; W: number; L: number; OTW: number; OTL: number; PTS: number };
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

const Standings = () => {
  const { data: teamStandings, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['team-standings'],
    queryFn: async () => {
      const response = await fetch(
        'https://widget.eliteprospects.com/api/league/asia-league?season=2025-2026'
      );
      const data = await response.json();
      return data.data as TeamStanding[];
    }
  });

  const { data: playerStats, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['player-stats'],
    queryFn: async () => {
      const response = await fetch(
        'https://widget.eliteprospects.com/api/league/asia-league/scoring-leaders?season=2025-2026&statsType=regular'
      );
      const data = await response.json();
      return data.data as PlayerStats[];
    }
  });

  return (
    <div className="min-h-screen bg-background pb-20">
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
                    {teamStandings?.map((standing, index) => (
                      <tr 
                        key={index} 
                        className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                          standing.team.name === "HL Anyang" ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="p-3 font-bold text-primary">{index + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <img 
                              src={standing.teamLogo.medium} 
                              alt={standing.team.name}
                              className="w-6 h-6 object-contain"
                            />
                            <span className="font-medium">{standing.team.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">{standing.stats.GP}</td>
                        <td className="p-3 text-center font-bold text-primary">{standing.stats.PTS}</td>
                        <td className="p-3 text-center">{standing.stats.W}</td>
                        <td className="p-3 text-center">{standing.stats.L}</td>
                        <td className="p-3 text-center text-accent">{standing.stats.OTW}</td>
                        <td className="p-3 text-center text-muted-foreground">{standing.stats.OTL}</td>
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
