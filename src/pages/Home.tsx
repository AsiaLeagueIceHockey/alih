import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, PlayCircle } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="bg-ice-gradient px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">
          아시아리그 아이스하키
        </h1>
        <p className="text-primary-foreground/90 text-sm">2025-26 시즌</p>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Next Game */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">다음 경기</h2>
          </div>
          <Card className="p-4 shadow-card-glow border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-xs">12월 28일 · 19:00</Badge>
              <Badge className="text-xs bg-accent">예정</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-xs font-bold">안양</span>
                </div>
                <p className="text-sm font-bold">HL 안양</p>
              </div>
              <div className="text-2xl font-bold text-muted-foreground px-4">VS</div>
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-xs font-bold">고베</span>
                </div>
                <p className="text-sm font-bold">스타즈 고베</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">안양 빙상장</p>
          </Card>
        </section>

        {/* Recent Result */}
        <section>
          <h2 className="text-lg font-bold mb-3">최근 결과</h2>
          <Card className="p-4 border-border">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-xs">12월 21일</Badge>
              <Badge variant="outline" className="text-xs">종료</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-xs font-bold">안양</span>
                </div>
                <p className="text-sm font-bold">HL 안양</p>
                <p className="text-2xl font-bold text-primary mt-1">3</p>
              </div>
              <div className="text-xl font-bold text-muted-foreground px-4">:</div>
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-xs font-bold">홋카이도</span>
                </div>
                <p className="text-sm font-bold">레드 이글스</p>
                <p className="text-2xl font-bold mt-1">2</p>
              </div>
            </div>
          </Card>
        </section>

        {/* League Standings Preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">리그 순위</h2>
            </div>
            <a href="/standings" className="text-xs text-primary hover:underline">
              전체 보기
            </a>
          </div>
          <Card className="p-4 border-border">
            <div className="space-y-3">
              {[
                { rank: 1, team: "레드 이글스 홋카이도", pts: 45 },
                { rank: 2, team: "HL 안양", pts: 42 },
                { rank: 3, team: "도호쿠 프리블레이즈", pts: 38 },
              ].map((item) => (
                <div key={item.rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary w-6">{item.rank}</span>
                    <span className="text-sm">{item.team}</span>
                  </div>
                  <span className="text-sm font-bold">{item.pts}P</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Latest News */}
        <section>
          <h2 className="text-lg font-bold mb-3">최신 뉴스</h2>
          <div className="space-y-3">
            {[
              { title: "HL 안양, 홈 3연승으로 2위 굳히기", source: "HL안양 공홈", time: "2시간 전" },
              { title: "아시아리그 올스타전 일정 발표", source: "ALIH", time: "5시간 전" },
              { title: "레드 이글스 홋카이도 선두 질주", source: "ALIH", time: "1일 전" },
            ].map((news, i) => (
              <Card key={i} className="p-3 border-border hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm font-medium mb-1">{news.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{news.source}</span>
                  <span>·</span>
                  <span>{news.time}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Latest Highlight */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <PlayCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">최신 하이라이트</h2>
          </div>
          <Card className="overflow-hidden border-border">
            <div className="aspect-video bg-secondary/50 flex items-center justify-center">
              <PlayCircle className="w-16 h-16 text-primary/50" />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium">HL 안양 vs 레드 이글스 홋카이도 하이라이트</p>
              <p className="text-xs text-muted-foreground mt-1">Asia League Ice Hockey · 1일 전</p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Home;
