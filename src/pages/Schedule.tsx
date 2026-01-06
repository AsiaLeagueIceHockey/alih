import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTeams } from "@/hooks/useTeams";
import { useSchedules, ScheduleGame } from "@/hooks/useSchedules";
import { Loader2, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { format } from "date-fns";
import { ko, ja, enUS } from "date-fns/locale";

// Month data (raw values only, labels come from translations)
const MONTHS_DATA = [
  { value: 9, year: 2025 },
  { value: 10, year: 2025 },
  { value: 11, year: 2025 },
  { value: 12, year: 2025 },
  { value: 1, year: 2026 },
  { value: 2, year: 2026 },
  { value: 3, year: 2026 },
  { value: 4, year: 2026 },
];

const Schedule = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  // Date locale helper
  const getDateLocale = () => {
    switch (currentLang) {
      case 'ja': return ja;
      case 'en': return enUS;
      default: return ko;
    }
  };

  // Locale code for toLocaleDateString
  const getLocaleCode = () => {
    switch (currentLang) {
      case 'ja': return 'ja-JP';
      case 'en': return 'en-US';
      default: return 'ko-KR';
    }
  };

  // Dynamic month labels
  const getMonthLabel = (month: number) => {
    const date = new Date(2025, month - 1, 1);
    return format(date, 'LLL', { locale: getDateLocale() });
  };

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // 현재 월에 해당하는 MONTHS_DATA 인덱스 찾기
  const currentMonthIndex = MONTHS_DATA.findIndex(
    m => m.value === currentMonth && m.year === currentYear
  );
  const defaultMonth = currentMonthIndex >= 0 ? currentMonthIndex : 0;
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);

  const { data: teams, isLoading: teamsLoading } = useTeams();

  const { data: schedules, isLoading: schedulesLoading, error } = useSchedules();

  const getTeamById = (teamId: number) => {
    if (!teams) return null;
    return teams.find(t => t.id === teamId);
  };

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match?.[1] || null;
  };

  const filteredGames = useMemo(() => {
    if (!schedules || !teams) return [];
    
    return schedules.filter(game => {
      const gameDate = new Date(game.match_at);
      const gameMonth = gameDate.getMonth() + 1;
      const gameYear = gameDate.getFullYear();
      
      const monthFilter = MONTHS_DATA[selectedMonth];
      const monthMatch = gameMonth === monthFilter.value && gameYear === monthFilter.year;
      
      if (!monthMatch) return false;
      
      if (selectedTeam) {
        const homeTeam = getTeamById(game.home_alih_team_id);
        const awayTeam = getTeamById(game.away_alih_team_id);
        return homeTeam?.english_name === selectedTeam || awayTeam?.english_name === selectedTeam;
      }
      
      return true;
    });
  }, [schedules, selectedMonth, selectedTeam, teams]);

  const isLoading = teamsLoading || schedulesLoading;

  // 경기 일정 페이지용 구조화 데이터
  const scheduleStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "아시아리그 아이스하키 경기 일정",
    "description": "아시아리그 아이스하키 2025-26 시즌 전체 경기 일정과 결과",
    "url": "https://alhockey.fans/schedule",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": filteredGames.slice(0, 10).map((game, index) => ({
        "@type": "SportsEvent",
        "position": index + 1,
        "name": `${getTeamById(game.home_alih_team_id)?.name || 'TBD'} vs ${getTeamById(game.away_alih_team_id)?.name || 'TBD'}`,
        "startDate": game.match_at,
        "location": {
          "@type": "Place",
          "name": game.match_place || "TBD"
        }
      }))
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": t('nav.home'), "item": "https://alhockey.fans" },
      { "@type": "ListItem", "position": 2, "name": t('nav.schedule'), "item": "https://alhockey.fans/schedule" }
    ]
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO 
        title="아시아리그 경기 일정 - 2025-26 시즌 전체 일정 및 결과"
        description="아시아리그 아이스하키 2025-26 시즌 전체 경기 일정, 월별 일정, 팀별 일정을 확인하세요. 실시간 경기 결과, 경기장 정보, 하이라이트 영상까지 한 번에. HL안양, 홋카이도 레드이글스 등 전 팀 경기 일정 제공."
        keywords="아시아리그 아이스하키 일정, 아시아리그 일정, 아이스하키 경기 일정, 아시아리그 경기 일정, 2025-26 시즌 일정, HL안양 경기 일정, 안양한라 일정, 홋카이도 레드이글스 일정, 도호쿠 프리블레이즈 일정, 닛코 아이스벅스 일정, 요코하마 그리츠 일정, 스타즈 고베 일정, 경기 결과, 하이라이트, 경기장 정보, 월별 경기"
        path="/schedule"
        structuredData={[scheduleStructuredData, breadcrumbData]}
      />
      <PageHeader title={t('page.schedule.title')} subtitle={t('page.schedule.subtitle')} />
      
      <div className="container mx-auto px-4">
        {/* 월별 필터 */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {MONTHS_DATA.map((month, index) => (
              <Button
                key={index}
                variant={selectedMonth === index ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMonth(index)}
                className="whitespace-nowrap"
              >
                {getMonthLabel(month.value)}
              </Button>
            ))}
          </div>
        </div>

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
                {t('filter.allTeams')}
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
                    <img src={team.logo} alt={getLocalizedTeamName(team, currentLang)} className="w-4 h-4 object-contain" />
                  )}
                  {getLocalizedTeamName(team, currentLang)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 경기 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">{t('loading.schedule')}</span>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-12">
            <p className="font-semibold">{t('error.loadFailed')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('error.checkConsole')}</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('error.noData')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGames.map((game) => {
              const homeTeam = getTeamById(game.home_alih_team_id);
              const awayTeam = getTeamById(game.away_alih_team_id);
              const matchDate = new Date(game.match_at);
              const now = new Date();
              const hasScore = game.home_alih_team_score !== null && game.away_alih_team_score !== null;
              const hasHighlight = game.highlight_url && game.highlight_url.trim() !== '';
              const isExpanded = expandedGameId === game.id;
              
              // 게임 상태 계산
              const getGameStatus = () => {
                if (game.game_status === 'Game Finished') return t('game.status.finished');
                if (matchDate <= now) return t('game.status.inProgress');
                return t('game.status.scheduled');
              };
              const gameStatus = getGameStatus();
              
              return (
                <Card 
                  key={game.id} 
                  className="p-4 border-border relative cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    navigate(`/schedule/${game.game_no}`, { 
                      state: { 
                        homeTeam, 
                        awayTeam,
                        matchDate: game.match_at
                      } 
                    });
                  }}
                >
                  {/* 우측 상단 배지와 버튼 */}
                  <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                    {hasHighlight && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedGameId(isExpanded ? null : game.id);
                        }}
                      >
                        <Video className={`h-3.5 w-3.5 mr-1.5 ${isExpanded ? 'text-primary' : ''}`} />
                        {t('button.video')}
                      </Button>
                    )}
                    <Badge 
                      variant={gameStatus === t('game.status.scheduled') ? "default" : "outline"}
                      className={gameStatus === t('game.status.scheduled') ? "bg-accent" : gameStatus === t('game.status.inProgress') ? "bg-destructive text-destructive-foreground animate-pulse" : ""}
                    >
                      {gameStatus}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm">
                      <span className="font-medium">
                        {format(matchDate, 'PPP', { locale: getDateLocale() })}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {format(matchDate, 'HH:mm', { locale: getDateLocale() })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex flex-col items-center">
                      {homeTeam?.logo && (
                        <img src={homeTeam.logo} alt={getLocalizedTeamName(homeTeam, currentLang)} className="w-12 h-12 object-contain mb-2" />
                      )}
                      <p className="text-sm font-medium mb-1">{getLocalizedTeamName(homeTeam, currentLang) || t('game.pending')}</p>
                      {hasScore && (
                        <p className={`text-2xl font-bold ${gameStatus === t('game.status.inProgress') ? "text-destructive" : ""}`}>{game.home_alih_team_score}</p>
                      )}
                    </div>

                    <div className="px-4">
                      {!hasScore ? (
                        <span className="text-lg font-bold text-muted-foreground">VS</span>
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">:</span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      {awayTeam?.logo && (
                        <img src={awayTeam.logo} alt={getLocalizedTeamName(awayTeam, currentLang)} className="w-12 h-12 object-contain mb-2" />
                      )}
                      <p className="text-sm font-medium mb-1">{getLocalizedTeamName(awayTeam, currentLang) || t('game.pending')}</p>
                      {hasScore && (
                        <p className={`text-2xl font-bold ${gameStatus === t('game.status.inProgress') ? "text-destructive" : ""}`}>{game.away_alih_team_score}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mt-3">{game.match_place}</p>

                  {isExpanded && hasHighlight && game.highlight_url && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="aspect-video w-full rounded-lg overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${getYoutubeVideoId(game.highlight_url)}`}
                          title={game.highlight_title || t('section.highlights')}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                      {game.highlight_title && (
                        <p className="text-sm font-medium mt-2">{game.highlight_title}</p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
