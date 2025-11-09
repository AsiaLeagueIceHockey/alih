import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

const News = () => {
  const news = [
    {
      title: "HL 안양, 홈 3연승으로 2위 굳히기",
      source: "HL안양 공홈",
      time: "2시간 전",
      category: "팀 뉴스",
      excerpt: "HL 안양이 홈에서 스타즈 고베를 3-1로 꺾으며 3연승을 달렸다...",
    },
    {
      title: "아시아리그 올스타전 일정 발표, 2월 도쿄에서 개최",
      source: "ALIH",
      time: "5시간 전",
      category: "리그",
      excerpt: "아시아리그 사무국은 2026년 2월 15일 도쿄에서 올스타전을 개최한다고 발표했다...",
    },
    {
      title: "레드 이글스 홋카이도 선두 질주, 5연승 행진",
      source: "ALIH",
      time: "1일 전",
      category: "리그",
      excerpt: "레드 이글스 홋카이도가 닛코 아이스벅스를 4-2로 격파하며 5연승을 기록했다...",
    },
    {
      title: "김기성, 2경기 연속 멀티 골 작렬",
      source: "HL안양 공홈",
      time: "1일 전",
      category: "선수",
      excerpt: "HL 안양의 에이스 김기성이 2경기 연속 멀티 골을 기록하며 팀 승리를 이끌었다...",
    },
    {
      title: "요코하마 그리츠, 새 외국인 선수 영입 발표",
      source: "요코하마 공홈",
      time: "2일 전",
      category: "이적",
      excerpt: "요코하마 그리츠가 캐나다 출신 센터 라이언 해리슨 영입을 공식 발표했다...",
    },
    {
      title: "도호쿠 프리블레이즈 홈 개막전 매진",
      source: "도호쿠 공홈",
      time: "2일 전",
      category: "팀 뉴스",
      excerpt: "도호쿠 프리블레이즈의 새해 첫 홈경기 입장권이 전석 매진되었다...",
    },
  ];

  const categories = ["전체", "리그", "팀 뉴스", "선수", "이적"];

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="ALIH 뉴스" subtitle="최신 아이스하키 소식" />
      
      <div className="container mx-auto px-4">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Badge 
              key={cat}
              variant={cat === "전체" ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
            >
              {cat}
            </Badge>
          ))}
        </div>

        <div className="space-y-3">
          {news.map((item, i) => (
            <Card 
              key={i} 
              className="p-4 border-border hover:border-primary/50 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {item.category}
                </Badge>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              
              <h3 className="text-base font-semibold mb-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {item.excerpt}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{item.source}</span>
                <span>·</span>
                <span>{item.time}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default News;
