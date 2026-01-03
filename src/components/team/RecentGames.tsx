import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface TeamBasic {
  id: number;
  name: string;
  logo: string;
}

interface ScheduleGameRaw {
  id: number;
  game_no: number;
  match_at: string;
  home_alih_team_id: number;
  away_alih_team_id: number;
  home_alih_team_score: number | null;
  away_alih_team_score: number | null;
  game_status: string | null;
}

interface RecentGamesProps {
  games: ScheduleGameRaw[];
  teams: TeamBasic[];
  teamId: number;
}

const RecentGames = ({ games, teams, teamId }: RecentGamesProps) => {
  const navigate = useNavigate();

  const getTeamById = (id: number) => teams.find(t => t.id === id);

  if (!games || games.length === 0) {
    return (
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-4 px-1">최근 경기</h2>
        <Card className="p-6 text-center text-muted-foreground">
          최근 경기 기록이 없습니다.
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-4 px-1">최근 경기</h2>
      
      <Card className="p-3">
        <div className="divide-y divide-border">
          {games.map((game) => {
            const isHome = game.home_alih_team_id === teamId;
            const homeTeam = getTeamById(game.home_alih_team_id);
            const awayTeam = getTeamById(game.away_alih_team_id);
            const homeScore = game.home_alih_team_score;
            const awayScore = game.away_alih_team_score;
            
            // 승패 판정 (우리 팀 기준)
            const myScore = isHome ? homeScore : awayScore;
            const opponentScore = isHome ? awayScore : homeScore;
            let result: "win" | "lose" | "draw" | null = null;
            if (myScore !== null && opponentScore !== null) {
              if (myScore > opponentScore) result = "win";
              else if (myScore < opponentScore) result = "lose";
              else result = "draw";
            }

            const opponentTeam = isHome ? awayTeam : homeTeam;

            return (
              <div
                key={game.id}
                onClick={() => navigate(`/schedule/${game.game_no}`)}
                className="py-3 flex items-center gap-2 cursor-pointer hover:bg-secondary/30 rounded-lg transition-colors first:pt-0 last:pb-0"
              >
                {/* 날짜 */}
                <div className="text-center w-14 flex-shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(game.match_at), "M/d (EEE)", { locale: ko })}
                  </p>
                </div>

                {/* vs 상대팀 */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground flex-shrink-0">vs</span>
                  <img
                    src={opponentTeam?.logo || ""}
                    alt={opponentTeam?.name || ""}
                    className="w-5 h-5 object-contain flex-shrink-0"
                    loading="lazy"
                  />
                  <span className="text-sm truncate">{opponentTeam?.name}</span>
                </div>

                {/* 스코어 (우리팀:상대팀) */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {myScore !== null && opponentScore !== null ? (
                    <>
                      <span
                        className={`text-base font-bold ${
                          result === "win"
                            ? "text-info"
                            : result === "lose"
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {myScore}
                      </span>
                      <span className="text-muted-foreground">:</span>
                      <span className="text-base font-bold text-muted-foreground">
                        {opponentScore}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">예정</span>
                  )}
                </div>

                {/* 승패 표시 */}
                <div className="w-6 flex-shrink-0 text-center">
                  {result && (
                    <span
                      className={`text-sm font-bold ${
                        result === "win"
                          ? "text-info"
                          : result === "lose"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {result === "win" ? "승" : result === "lose" ? "패" : "무"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
};

export default RecentGames;
