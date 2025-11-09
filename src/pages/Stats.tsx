import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Stats = () => {
  const scorers = [
    { rank: 1, name: "마이클 스튜어트", team: "레드 이글스", gp: 30, g: 18, a: 24, tp: 42 },
    { rank: 2, name: "김기성", team: "HL 안양", gp: 29, g: 15, a: 22, tp: 37 },
    { rank: 3, name: "브래드 맥클루어", team: "도호쿠", gp: 30, g: 16, a: 19, tp: 35 },
    { rank: 4, name: "션 콜린스", team: "닛코", gp: 28, g: 14, a: 20, tp: 34 },
    { rank: 5, name: "박진혁", team: "HL 안양", gp: 29, g: 13, a: 18, tp: 31 },
    { rank: 6, name: "유진 수슬로프", team: "요코하마", gp: 29, g: 12, a: 17, tp: 29 },
    { rank: 7, name: "타카하시 켄타", team: "레드 이글스", gp: 30, g: 11, a: 16, tp: 27 },
    { rank: 8, name: "라이언 맥도널드", team: "스타즈", gp: 30, g: 10, a: 15, tp: 25 },
  ];

  const goalies = [
    { rank: 1, name: "매트 달튼", team: "레드 이글스", gp: 28, gaa: 1.82, svp: "93.5%" },
    { rank: 2, name: "최지웅", team: "HL 안양", gp: 26, gaa: 1.95, svp: "92.8%" },
    { rank: 3, name: "히로세 다이키", team: "도호쿠", gp: 27, gaa: 2.15, svp: "91.2%" },
    { rank: 4, name: "스티브 윌슨", team: "닛코", gp: 25, gaa: 2.28, svp: "90.5%" },
    { rank: 5, name: "사토 유키", team: "요코하마", gp: 26, gaa: 2.65, svp: "89.1%" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="선수 스탯" subtitle="2025-26 시즌 개인 기록" />
      
      <div className="container mx-auto px-4">
        <Tabs defaultValue="scorers" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="scorers">득점 순위</TabsTrigger>
            <TabsTrigger value="goalies">골리 순위</TabsTrigger>
          </TabsList>

          <TabsContent value="scorers">
            <Card className="overflow-x-auto border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="p-3 font-semibold text-primary">#</th>
                    <th className="p-3 font-semibold text-primary">선수명</th>
                    <th className="p-3 font-semibold text-muted-foreground text-xs">팀</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center text-xs">GP</th>
                    <th className="p-3 font-semibold text-accent text-center">G</th>
                    <th className="p-3 font-semibold text-accent text-center">A</th>
                    <th className="p-3 font-semibold text-primary text-center">TP</th>
                  </tr>
                </thead>
                <tbody>
                  {scorers.map((player) => (
                    <tr 
                      key={player.rank} 
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-3 font-bold text-primary">{player.rank}</td>
                      <td className="p-3 font-medium">{player.name}</td>
                      <td className="p-3 text-muted-foreground text-xs">{player.team}</td>
                      <td className="p-3 text-center text-muted-foreground">{player.gp}</td>
                      <td className="p-3 text-center font-semibold">{player.g}</td>
                      <td className="p-3 text-center font-semibold">{player.a}</td>
                      <td className="p-3 text-center font-bold text-primary">{player.tp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            
            <div className="mt-4 text-xs text-muted-foreground space-y-1 px-2">
              <p>• GP: 경기수 | G: 골 | A: 어시스트 | TP: 총 포인트</p>
            </div>
          </TabsContent>

          <TabsContent value="goalies">
            <Card className="overflow-x-auto border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="p-3 font-semibold text-primary">#</th>
                    <th className="p-3 font-semibold text-primary">선수명</th>
                    <th className="p-3 font-semibold text-muted-foreground text-xs">팀</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center text-xs">GP</th>
                    <th className="p-3 font-semibold text-accent text-center">GAA</th>
                    <th className="p-3 font-semibold text-primary text-center">SV%</th>
                  </tr>
                </thead>
                <tbody>
                  {goalies.map((player) => (
                    <tr 
                      key={player.rank} 
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-3 font-bold text-primary">{player.rank}</td>
                      <td className="p-3 font-medium">{player.name}</td>
                      <td className="p-3 text-muted-foreground text-xs">{player.team}</td>
                      <td className="p-3 text-center text-muted-foreground">{player.gp}</td>
                      <td className="p-3 text-center font-semibold">{player.gaa}</td>
                      <td className="p-3 text-center font-bold text-primary">{player.svp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <div className="mt-4 text-xs text-muted-foreground space-y-1 px-2">
              <p>• GP: 경기수 | GAA: 평균 실점 | SV%: 세이브율</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Stats;
