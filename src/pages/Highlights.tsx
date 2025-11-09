import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Play } from "lucide-react";

const externalSupabase = createClient(
  "https://nvlpbdyqfzmlrjauvhxx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68"
);

interface Video {
  id: number;
  title: string;
  url: string;
  thumbnail?: string;
  created_at: string;
}

const Highlights = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const { data: videos, isLoading, error } = useQuery({
    queryKey: ['alih-videos'],
    queryFn: async () => {
      console.log('🔵 Supabase 연결 시도: alih_video 테이블 조회');
      
      const { data, error } = await externalSupabase
        .from('alih_video')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase 에러:', error);
        throw error;
      }
      
      console.log('✅ Supabase 연결 성공! 조회된 영상 수:', data?.length || 0);
      console.log('📊 조회된 데이터:', data);
      
      return data as Video[];
    }
  });

  // 에러 발생 시 로그
  if (error) {
    console.error('❌ 영상 데이터 로드 실패:', error);
  }

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match?.[1] || null;
  };

  const getYoutubeThumbnail = (url: string) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="하이라이트" subtitle="최신 경기 영상" />
      
      <div className="container mx-auto px-4">
        {selectedVideo && (
          <Card className="overflow-hidden border-border mb-6">
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedVideo)}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">영상 로딩 중...</span>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-12">
            <p className="font-semibold">영상을 불러오는데 실패했습니다</p>
            <p className="text-sm text-muted-foreground mt-2">콘솔을 확인해주세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos?.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden border-border cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedVideo(video.url)}
              >
                <div className="relative aspect-video bg-secondary">
                  <img
                    src={video.thumbnail || getYoutubeThumbnail(video.url) || ''}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(video.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && (!videos || videos.length === 0) && (
          <div className="text-center text-muted-foreground py-12">
            <p>아직 등록된 영상이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Highlights;
