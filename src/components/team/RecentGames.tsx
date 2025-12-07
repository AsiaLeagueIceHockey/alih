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
        <div className="space-y-2">
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

            return (
              <div
                key={game.id}
                onClick={() => navigate(`/schedule/${game.game_no}`)}
                className="p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary/30 rounded-lg transition-colors"
              >
                {/* 날짜 */}
                <div className="text-center w-12 flex-shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(game.match_at), "M/d", { locale: ko })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(game.match_at), "EEE", { locale: ko })}
                  </p>
                </div>

                {/* 홈팀 */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                  <span className={`text-sm truncate ${isHome ? "font-bold" : ""}`}>
                    {homeTeam?.name}
                  </span>
                  <img
                    src={homeTeam?.logo || ""}
                    alt={homeTeam?.name || ""}
                    className="w-6 h-6 object-contain flex-shrink-0"
                    loading="lazy"
                  />
                </div>

                {/* 스코어 */}
                <div className="flex items-center gap-1 flex-shrink-0 min-w-[80px] justify-center">
                  {homeScore !== null && awayScore !== null ? (
                    <>
                      <span
                        className={`text-lg font-bold ${
                          isHome
                            ? result === "win"
                              ? "text-blue-500"
                              : result === "lose"
                              ? "text-red-500"
                              : "text-muted-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {homeScore}
                      </span>
                      <span className="text-muted-foreground">:</span>
                      <span
                        className={`text-lg font-bold ${
                          !isHome
                            ? result === "win"
                              ? "text-blue-500"
                              : result === "lose"
                              ? "text-red-500"
                              : "text-muted-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {awayScore}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">예정</span>
                  )}
                </div>

                {/* 원정팀 */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <img
                    src={awayTeam?.logo || ""}
                    alt={awayTeam?.name || ""}
                    className="w-6 h-6 object-contain flex-shrink-0"
                    loading="lazy"
                  />
                  <span className={`text-sm truncate ${!isHome ? "font-bold" : ""}`}>
                    {awayTeam?.name}
                  </span>
                </div>

                {/* 승패 표시 */}
                <div className="w-8 flex-shrink-0 text-center">
                  {result && (
                    <span
                      className={`text-sm font-bold ${
                        result === "win"
                          ? "text-blue-500"
                          : result === "lose"
                          ? "text-red-500"
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
