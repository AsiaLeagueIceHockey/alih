import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Highlights = () => {
  const playlists = [
    { 
      id: "PL-0oGzgYWnbChdi9B_klixxYRwgpHw55a", 
      title: "HL 안양 하이라이트",
      count: "최신 영상"
    },
    { 
      id: "PLmjC-WVJoGd3BhkVagxliAK-ASrpnByRK", 
      title: "아시아리그 하이라이트",
      count: "전체 경기"
    },
  ];

  const [selectedPlaylist, setSelectedPlaylist] = useState(playlists[0].id);

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="하이라이트" subtitle="최신 경기 영상" />
      
      <div className="container mx-auto px-4">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {playlists.map((playlist) => (
            <Button
              key={playlist.id}
              variant={selectedPlaylist === playlist.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPlaylist(playlist.id)}
            >
              {playlist.title}
            </Button>
          ))}
        </div>

        <Card className="overflow-hidden border-border mb-4">
          <div className="aspect-video w-full">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/videoseries?list=${selectedPlaylist}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>유튜브에서 최신 하이라이트를 시청하세요</p>
        </div>
      </div>
    </div>
  );
};

export default Highlights;
