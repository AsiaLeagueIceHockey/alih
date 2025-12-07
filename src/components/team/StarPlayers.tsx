import { Link } from "react-router-dom";
import { ChevronRight, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/team";

interface StarPlayersProps {
  players: Player[];
  teamId: number;
}

const StarPlayers = ({ players, teamId }: StarPlayersProps) => {
  // 상위 3명만 표시 (골리 제외, 포인트 순)
  const topPlayers = players
    .filter((p) => p.position !== "G")
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-4 px-1">Star Players</h2>
      
      <div className="grid grid-cols-3 gap-3">
        {topPlayers.map((player, index) => (
          <Card key={player.id} className="p-4 text-center relative">
            {/* 순위 뱃지 */}
            <div className="absolute top-2 left-2 text-lg">
              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
            </div>

            {/* 선수 아바타 (플레이스홀더) */}
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>

            {/* 선수 정보 */}
            <p className="font-bold text-sm truncate">{player.name}</p>
            <p className="text-xs text-muted-foreground mb-2">
              No.{player.jersey_number} · {player.position}
            </p>

            {/* 스탯 */}
            <div className="flex justify-center gap-3 text-xs">
              <div>
                <p className="font-bold text-primary text-lg">{player.goals}</p>
                <p className="text-muted-foreground">골</p>
              </div>
              <div>
                <p className="font-bold text-lg">{player.assists}</p>
                <p className="text-muted-foreground">도움</p>
              </div>
            </div>
          </Card>
        ))}
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
