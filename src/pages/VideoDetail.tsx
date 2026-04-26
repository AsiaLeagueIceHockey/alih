import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Play, Loader2, Calendar } from "lucide-react";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { useTeams } from "@/hooks/useTeams";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { format } from "date-fns";
import { ko, ja, enUS } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

interface AlihVideo {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  team_english_name: string | null;
  tags: string[];
  published_at: string;
}

const VideoDetail = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { data: teams } = useTeams();

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ja': return ja;
      case 'en': return enUS;
      default: return ko;
    }
  };

  const { data: video, isLoading, error } = useQuery({
    queryKey: ['alih-video', videoId],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_videos')
        .select('*')
        .eq('id', videoId)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data as AlihVideo;
    },
    enabled: !!videoId,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // 같은 팀의 다른 영상
  const { data: relatedVideos } = useQuery({
    queryKey: ['alih-videos-related', video?.team_english_name, videoId],
    queryFn: async () => {
      let query = externalSupabase
        .from('alih_videos')
        .select('*')
        .eq('is_published', true)
        .neq('id', videoId!)
        .order('published_at', { ascending: false })
        .limit(6);

      if (video?.team_english_name) {
        query = query.eq('team_english_name', video.team_english_name);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AlihVideo[];
    },
    enabled: !!video,
    staleTime: 1000 * 60 * 30,
  });

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match?.[1] || null;
  };

  const getYoutubeThumbnail = (url: string) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  const getTeamByEnglishName = (englishName: string | null) => {
    if (!englishName || !teams) return null;
    return teams.find(t => t.english_name === englishName);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: video?.title,
          text: video?.description || video?.title,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          description: t('page.videos.linkCopied'),
        });
      }
    } catch {
      // 사용자가 공유 취소
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">{t('error.loadFailed')}</p>
        <Button variant="outline" onClick={() => navigate('/news?tab=videos')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('button.back')}
        </Button>
      </div>
    );
  }

  const youtubeId = getYoutubeVideoId(video.youtube_url);
  const team = getTeamByEnglishName(video.team_english_name);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.description || video.title,
    "thumbnailUrl": getYoutubeThumbnail(video.youtube_url),
    "uploadDate": video.published_at,
    "contentUrl": video.youtube_url,
    "embedUrl": `https://www.youtube.com/embed/${youtubeId}`,
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO
        title={`${video.title} | 아시아리그 아이스하키`}
        description={video.description || video.title}
        keywords={`아시아리그 영상, ${video.team_english_name || ''}, 아이스하키 동영상`}
        path={`/videos/${video.id}`}
        structuredData={[structuredData]}
      />

      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/news?tab=videos')}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('button.back')}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* YouTube 플레이어 */}
      <div className="w-full bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video">
            {youtubeId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                {t('error.loadFailed')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 영상 정보 */}
      <div className="container mx-auto px-4 py-5">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* 제목 + 팀 뱃지 */}
          <div>
            <h1 className="text-xl font-bold leading-snug mb-3">{video.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {team && (
                <Badge variant="secondary" className="flex items-center gap-1.5">
                  {team.logo && (
                    <img src={team.logo} alt={getLocalizedTeamName(team, i18n.language)} className="w-4 h-4 object-contain" />
                  )}
                  {getLocalizedTeamName(team, i18n.language)}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(video.published_at), 'PPP', { locale: getDateLocale() })}
              </div>
            </div>
          </div>

          {/* 설명 */}
          {video.description && (
            <Card className="p-4 border-border">
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {video.description}
              </p>
            </Card>
          )}

          {/* 공유 버튼 */}
          <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            {t('page.videos.share')}
          </Button>

          {/* 관련 영상 */}
          {relatedVideos && relatedVideos.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">{t('page.videos.relatedVideos')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedVideos.map((rv) => {
                  const rvTeam = getTeamByEnglishName(rv.team_english_name);
                  return (
                    <Card
                      key={rv.id}
                      className="overflow-hidden cursor-pointer transition-all border-border hover:border-primary/50 group"
                      onClick={() => navigate(`/videos/${rv.id}`)}
                    >
                      <div className="relative aspect-video bg-secondary">
                        <img
                          src={getYoutubeThumbnail(rv.youtube_url) || ''}
                          alt={rv.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center">
                            <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                      <div className="p-2.5">
                        {rvTeam && (
                          <div className="flex items-center gap-1 mb-1.5">
                            {rvTeam.logo && (
                              <img src={rvTeam.logo} alt={getLocalizedTeamName(rvTeam, i18n.language)} className="w-3.5 h-3.5 object-contain" />
                            )}
                            <span className="text-[11px] text-muted-foreground">
                              {getLocalizedTeamName(rvTeam, i18n.language)}
                            </span>
                          </div>
                        )}
                        <h3 className="font-medium text-xs line-clamp-2 group-hover:text-primary transition-colors">
                          {rv.title}
                        </h3>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
