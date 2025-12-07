import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeamStanding } from "@/types/team";

interface LeagueStandingsSectionProps {
  standings: TeamStanding[];
  currentTeamId: number;
}

const LeagueStandingsSection = ({ standings, currentTeamId }: LeagueStandingsSectionProps) => {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-4 px-1">순위</h2>
      
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="p-3 text-left font-semibold">#</th>
              <th className="p-3 text-left font-semibold">팀</th>
              <th className="p-3 text-center font-semibold">경기</th>
              <th className="p-3 text-center font-semibold">승점</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => (
              <tr
                key={standing.team_id}
                className={`border-b border-border/50 ${
                  standing.team_id === currentTeamId
                    ? "bg-primary/10"
                    : "hover:bg-secondary/30"
                }`}
              >
                <td className="p-3 font-bold text-primary">{standing.rank}</td>
                <td className="p-3">
                  <Link
                    to={`/team/${standing.team_id}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <img
                      src={standing.team?.logo || ""}
                      alt={standing.team?.name || ""}
                      className="w-5 h-5 object-contain"
                      loading="lazy"
                    />
                    <span className="font-medium">{standing.team?.name}</span>
                  </Link>
                </td>
                <td className="p-3 text-center">{standing.games_played}</td>
                <td className="p-3 text-center font-bold text-primary">{standing.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-3 flex justify-center">
        <Button variant="outline" asChild>
          <Link to="/standings" className="flex items-center gap-1">
            전체 순위 보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default LeagueStandingsSection;
