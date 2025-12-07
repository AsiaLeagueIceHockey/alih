import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RecentVideo } from "@/types/team";

interface RecentVideosProps {
  videos: RecentVideo[];
}

const RecentVideos = ({ videos }: RecentVideosProps) => {
  const [selectedVideo, setSelectedVideo] = useState<RecentVideo | null>(null);

  if (!videos || videos.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-4 px-1">최신 영상</h2>
      
      {/* 가로 스크롤 캐러셀 */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {videos.map((video) => (
          <button
            key={video.id}
            onClick={() => setSelectedVideo(video)}
            className="flex-shrink-0 w-64 md:w-72 snap-start group cursor-pointer text-left"
          >
            {/* 썸네일 */}
            <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-muted">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              {/* 재생 버튼 오버레이 */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                  <Play className="h-7 w-7 text-primary-foreground ml-1" />
                </div>
              </div>
            </div>
            
            {/* 제목 & 날짜 */}
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {video.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(video.publishedAt), "yyyy년 M월 d일", { locale: ko })}
            </p>
          </button>
        ))}
      </div>

      {/* 영상 재생 모달 */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          <DialogTitle className="sr-only">{selectedVideo?.title || "영상 재생"}</DialogTitle>
          <div className="aspect-video">
            {selectedVideo && (
              <iframe
                src={`${selectedVideo.embedUrl}?autoplay=1`}
                title={selectedVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default RecentVideos;
