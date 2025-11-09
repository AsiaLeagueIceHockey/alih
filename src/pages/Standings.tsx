import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";

const Standings = () => {
  const standings = [
    { rank: 1, team: "레드 이글스 홋카이도", gp: 30, pts: 45, w: 20, l: 8, otw: 2, otl: 0 },
    { rank: 2, team: "HL 안양", gp: 29, pts: 42, w: 19, l: 8, otw: 1, otl: 1 },
    { rank: 3, team: "도호쿠 프리블레이즈", gp: 30, pts: 38, w: 17, l: 10, otw: 1, otl: 2 },
    { rank: 4, team: "닛코 아이스벅스", gp: 28, pts: 35, w: 16, l: 10, otw: 1, otl: 1 },
    { rank: 5, team: "요코하마 그리츠", gp: 29, pts: 28, w: 12, l: 14, otw: 2, otl: 1 },
    { rank: 6, team: "스타즈 고베", gp: 30, pts: 22, w: 9, l: 18, otw: 2, otl: 1 },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="팀 순위" subtitle="2025-26 정규 리그 순위" />
      
      <div className="container mx-auto px-4">
        <Card className="overflow-x-auto border-border">
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
              {standings.map((team) => (
                <tr 
                  key={team.rank} 
                  className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                    team.team === "HL 안양" ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="p-3 font-bold text-primary">{team.rank}</td>
                  <td className="p-3 font-medium">{team.team}</td>
                  <td className="p-3 text-center">{team.gp}</td>
                  <td className="p-3 text-center font-bold text-primary">{team.pts}</td>
                  <td className="p-3 text-center">{team.w}</td>
                  <td className="p-3 text-center">{team.l}</td>
                  <td className="p-3 text-center text-accent">{team.otw}</td>
                  <td className="p-3 text-center text-muted-foreground">{team.otl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="mt-4 text-xs text-muted-foreground space-y-1 px-2">
          <p>• GP: 경기수 | PTS: 승점 | W: 승 | L: 패</p>
          <p>• OTW: 연장 승 | OTL: 연장 패</p>
        </div>
      </div>
    </div>
  );
};

export default Standings;
