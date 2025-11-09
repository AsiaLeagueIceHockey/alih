import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Schedule = () => {
  const games = [
    { date: "12월 28일", time: "19:00", home: "HL 안양", away: "스타즈 고베", status: "예정", venue: "안양 빙상장" },
    { date: "12월 21일", time: "19:00", home: "HL 안양", away: "레드 이글스", homeScore: 3, awayScore: 2, status: "종료", venue: "안양 빙상장" },
    { date: "12월 15일", time: "18:00", home: "닛코 아이스벅스", away: "HL 안양", homeScore: 1, awayScore: 4, status: "종료", venue: "닛코 빙상장" },
    { date: "12월 14일", time: "19:00", home: "도호쿠 프리블레이즈", away: "HL 안양", homeScore: 2, awayScore: 3, status: "종료", venue: "센다이 빙상장" },
    { date: "12월 8일", time: "19:00", home: "HL 안양", away: "요코하마 그리츠", homeScore: 5, awayScore: 1, status: "종료", venue: "안양 빙상장" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="경기 일정 / 결과" subtitle="2025-26 시즌 전체 경기" />
      
      <div className="container mx-auto px-4">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button variant="default" size="sm">전체</Button>
          <Button variant="outline" size="sm">HL 안양</Button>
          <Button variant="outline" size="sm">예정</Button>
          <Button variant="outline" size="sm">종료</Button>
        </div>

        <div className="space-y-3">
          {games.map((game, i) => (
            <Card key={i} className="p-4 border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm">
                  <span className="font-medium">{game.date}</span>
                  <span className="text-muted-foreground ml-2">{game.time}</span>
                </div>
                <Badge 
                  variant={game.status === "예정" ? "default" : "outline"}
                  className={game.status === "예정" ? "bg-accent" : ""}
                >
                  {game.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <p className="text-sm font-medium mb-1">{game.away}</p>
                  {game.awayScore !== undefined && (
                    <p className="text-2xl font-bold">{game.awayScore}</p>
                  )}
                </div>

                <div className="px-4">
                  {game.status === "예정" ? (
                    <span className="text-lg font-bold text-muted-foreground">VS</span>
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">:</span>
                  )}
                </div>

                <div className="flex-1 text-center">
                  <p className="text-sm font-medium mb-1">{game.home}</p>
                  {game.homeScore !== undefined && (
                    <p className="text-2xl font-bold">{game.homeScore}</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-3">{game.venue}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
