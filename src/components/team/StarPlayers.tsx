import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/team";

interface StarPlayersProps {
  players: Player[];
  teamId: number;
}

const StarPlayers = ({ players, teamId }: StarPlayersProps) => {
  // 골리 제외
  const fieldPlayers = players.filter((p) => p.position !== "G");
  
  // 골 랭킹 상위 3명
  const topGoalScorers = [...fieldPlayers]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 3);
  
  // 어시스트 랭킹 상위 3명
  const topAssistPlayers = [...fieldPlayers]
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 3);

  const getRankEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    return "🥉";
  };

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-4 px-1">주요 선수</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 골 랭킹 */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-center mb-3 text-muted-foreground">골 랭킹</h3>
          <div className="space-y-2">
            {topGoalScorers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30"
              >
                <span className="text-base flex-shrink-0">{getRankEmoji(index)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{player.name}</p>
                  <p className="text-xs text-muted-foreground">
                    No.{player.jersey_number}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg text-primary">{player.goals}</p>
                  <p className="text-xs text-muted-foreground">골</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 어시스트 랭킹 */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-center mb-3 text-muted-foreground">어시스트 랭킹</h3>
          <div className="space-y-2">
            {topAssistPlayers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30"
              >
                <span className="text-base flex-shrink-0">{getRankEmoji(index)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{player.name}</p>
                  <p className="text-xs text-muted-foreground">
                    No.{player.jersey_number}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg text-primary">{player.assists}</p>
                  <p className="text-xs text-muted-foreground">도움</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 선수단 전체 보기 버튼 */}
      <div className="mt-4 flex justify-center">
        <Button variant="outline" asChild>
          <Link to={`/roster/${teamId}`} className="flex items-center gap-1">
            선수단 전체 보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default StarPlayers;
