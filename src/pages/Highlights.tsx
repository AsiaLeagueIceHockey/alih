import { useState, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { useTeams } from "@/hooks/useTeams";
import { Loader2, Play } from "lucide-react";
import SEO from "@/components/SEO";

interface ScheduleGame {
  id: number;
  home_alih_team_id: number;
  away_alih_team_id: number;
  home_alih_team_score: number | null;
  away_alih_team_score: number | null;
  match_at: string;
  match_place: string;
  highlight_url: string;
  highlight_title: string;
}

const Highlights = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const handleVideoSelect = (videoUrl: string) => {
    setSelectedVideo(videoUrl);
    // 비디오 플레이어가 완전히 보이도록 맨 위로 스크롤
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const { data: teams, isLoading: teamsLoading } = useTeams();

  const { data: games, isLoading, error } = useQuery({
    queryKey: ['alih-schedule-highlights'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_schedule')
        .select('*')
        .not('highlight_url', 'is', null)
        .neq('highlight_url', '')
        .order('match_at', { ascending: false });
      
      if (error) throw error;
      return data as ScheduleGame[];
    },
    staleTime: 1000 * 60 * 60, // 1시간 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
  });

  const getTeamById = (teamId: number) => {
    if (!teams) return null;
    return teams.find(t => t.id === teamId);
  };

  const filteredGames = games?.filter(game => {
    if (!selectedTeam) return true;
    const homeTeam = getTeamById(game.home_alih_team_id);
    const awayTeam = getTeamById(game.away_alih_team_id);
    return homeTeam?.english_name === selectedTeam || awayTeam?.english_name === selectedTeam;
  });

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match?.[1] || null;
  };

  const getYoutubeThumbnail = (url: string) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  // 하이라이트 페이지용 구조화 데이터
  const highlightStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "아시아리그 아이스하키 하이라이트 영상",
    "description": "아시아리그 아이스하키 2025-26 시즌 경기 하이라이트 영상 모음",
    "url": "https://alhockey.fans/highlights",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": filteredGames?.slice(0, 5).map((game, index) => ({
        "@type": "VideoObject",
        "position": index + 1,
        "name": game.highlight_title || `${getTeamById(game.home_alih_team_id)?.name} vs ${getTeamById(game.away_alih_team_id)?.name} 하이라이트`,
        "description": `아시아리그 아이스하키 경기 하이라이트 - ${getTeamById(game.home_alih_team_id)?.name} vs ${getTeamById(game.away_alih_team_id)?.name}`,
        "thumbnailUrl": getYoutubeThumbnail(game.highlight_url),
        "uploadDate": game.match_at,
        "contentUrl": game.highlight_url
      })) || []
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://alhockey.fans" },
      { "@type": "ListItem", "position": 2, "name": "하이라이트", "item": "https://alhockey.fans/highlights" }
    ]
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO 
        title="아시아리그 하이라이트 - 경기 영상, 골 장면 모음 | 2025-26 시즌"
        description="아시아리그 아이스하키 2025-26 시즌 하이라이트 영상 모음. 최신 경기 하이라이트, 골 장면, 베스트 세이브를 팀별로 확인하세요. HL안양, 홋카이도 레드이글스 등 모든 팀 영상 제공."
        keywords="아시아리그 아이스하키 하이라이트, 아시아리그 하이라이트, 아이스하키 영상, 경기 하이라이트, 골 영상, 아시아리그 경기 영상, HL안양 하이라이트, 안양한라 영상, 홋카이도 레드이글스 하이라이트, 도호쿠 프리블레이즈 영상, 닛코 아이스벅스 영상, 요코하마 그리츠 영상, 스타즈 고베 영상, 베스트 골, 세이브 영상, 최신 경기 영상"
        path="/highlights"
        structuredData={[highlightStructuredData, breadcrumbData]}
      />
      <PageHeader title="하이라이트" subtitle="최신 경기 영상" />
      
      <div className="container mx-auto px-4">
        {/* 팀별 필터 */}
        {teamsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={selectedTeam === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTeam(null)}
                className="whitespace-nowrap"
              >
                팀 전체
              </Button>
              {teams?.map((team) => (
                <Button
                  key={team.id}
                  variant={selectedTeam === team.english_name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTeam(team.english_name)}
                  className="whitespace-nowrap flex items-center gap-2"
                >
                  {team.logo && (
                    <img src={team.logo} alt={team.name} className="w-4 h-4 object-contain" />
                  )}
                  {team.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {selectedVideo && (
          <Card ref={playerRef} className="overflow-hidden border-border mb-6">
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
            {filteredGames?.map((game) => {
              const homeTeam = getTeamById(game.home_alih_team_id);
              const awayTeam = getTeamById(game.away_alih_team_id);
              const matchDate = new Date(game.match_at);

              const isSelected = selectedVideo === game.highlight_url;
              
              return (
                <Card
                  key={game.id}
                  className={`overflow-hidden cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary border-2 shadow-lg ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleVideoSelect(game.highlight_url)}
                >
                  <div className="relative aspect-video bg-secondary">
                    <img
                      src={getYoutubeThumbnail(game.highlight_url) || ''}
                      alt={game.highlight_title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {homeTeam?.logo && (
                          <img src={homeTeam.logo} alt={homeTeam.name} className="w-5 h-5 object-contain" />
                        )}
                        <span className="text-xs font-medium">{homeTeam?.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">vs</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{awayTeam?.name}</span>
                        {awayTeam?.logo && (
                          <img src={awayTeam.logo} alt={awayTeam.name} className="w-5 h-5 object-contain" />
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2">{game.highlight_title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {matchDate.toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && (!filteredGames || filteredGames.length === 0) && (
          <div className="text-center text-muted-foreground py-12">
            <p>해당 조건의 하이라이트가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Highlights;
