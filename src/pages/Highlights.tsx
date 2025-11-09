import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";

const Highlights = () => {
  const videos = [
    { title: "HL 안양 vs 레드 이글스 홋카이도 하이라이트", channel: "Asia League Ice Hockey", date: "1일 전", thumbnail: "안양" },
    { title: "도호쿠 vs 요코하마 경기 하이라이트", channel: "Asia League Ice Hockey", date: "2일 전", thumbnail: "도호쿠" },
    { title: "닛코 아이스벅스 홈경기 하이라이트", channel: "Asia League Ice Hockey", date: "3일 전", thumbnail: "닛코" },
    { title: "스타즈 고베 역전승 하이라이트", channel: "Asia League Ice Hockey", date: "5일 전", thumbnail: "고베" },
    { title: "레드 이글스 홋카이도 5연승 하이라이트", channel: "Asia League Ice Hockey", date: "1주 전", thumbnail: "홋카이도" },
    { title: "HL 안양 홈 3연승 하이라이트", channel: "Asia League Ice Hockey", date: "1주 전", thumbnail: "안양" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="하이라이트" subtitle="최신 경기 영상" />
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos.map((video, i) => (
            <Card key={i} className="overflow-hidden border-border hover:border-primary/50 transition-all cursor-pointer group">
              <div className="aspect-video bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <PlayCircle className="w-16 h-16 text-primary/50 group-hover:text-primary group-hover:scale-110 transition-all relative z-10" />
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                  {Math.floor(Math.random() * 5 + 3)}:00
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium line-clamp-2 mb-2">{video.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{video.channel}</span>
                  <span>·</span>
                  <span>{video.date}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Highlights;
