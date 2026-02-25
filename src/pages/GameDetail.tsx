import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Loader2, ArrowLeft, Trophy, Users, Goal, Shield, Play, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlihTeam } from "@/hooks/useTeams";
import { useScheduleByGameNo, ScheduleGame } from "@/hooks/useSchedules";
import SEO from "@/components/SEO";
import CheerBattle from "@/components/game/CheerBattle";
import MatchPrediction from "@/components/game/MatchPrediction";
import { FlightAffiliateBanner } from "@/components/game/FlightAffiliateBanner";
import { useTranslation } from "react-i18next";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { format } from "date-fns";
import { ko, ja, enUS } from "date-fns/locale";
import { CommentSection } from "@/components/comments";

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

interface GameDetailData {
  id: string;
  game_no: number;
  spectators: number;
  game_info: {
    venue: string;
    coaches: {
      home_coach: string;
      away_coach: string;
      home_manager: string;
      away_manager: string;
    };
    timeouts: {
      home: string | null;
      away: string | null;
    };
    game_time: {
      start: string;
      end: string;
    };
    officials: {
      referees: string[];
      linesmen: string[];
      supervisor: string;
    };
  };
  game_summary: {
    period_1: { score: string; sog: string; pim: string; ppgf: string; shgf: string };
    period_2: { score: string; sog: string; pim: string; ppgf: string; shgf: string };
    period_3: { score: string; sog: string; pim: string; ppgf: string; shgf: string };
    ovt?: { score: string; sog: string; pim: string; ppgf: string; shgf: string };
    pss?: { score: string | null; sog: string | null; pim: string | null; ppgf: string | null; shgf: string | null };
    total: { score: string; sog: string; pim: string; ppgf: string; shgf: string };
  };
  goalkeepers: {
    home: Array<{ no: number; name: string; mip: string; ga: number; saves: number }>;
    away: Array<{ no: number; name: string; mip: string; ga: number; saves: number }>;
  };
  home_roster: Array<{
    no: number;
    name: string;
    pos: string;
    sog: number;
    played: boolean;
    captain_asst: string | null;
  }>;
  away_roster: Array<{
    no: number;
    name: string;
    pos: string;
    sog: number;
    played: boolean;
    captain_asst: string | null;
  }>;
  goals: Array<{
    goal_no: number;
    period: number;
    time: string;
    team_id: number;
    situation: string;
    assist1_no: number | null;
    assist2_no: number | null;
  }>;
  penalties: Array<{
    player_no: number;
    period: number;
    time: string;
    team_id: number;
    offence: string;
    minutes: number;
  }>;
}

interface LiveData {
  shots: {
    '1p': { home: number; away: number };
    '2p': { home: number; away: number };
    '3p': { home: number; away: number };
    ovt: { home: number; away: number };
    pss: { home: number; away: number };
    total: { home: number; away: number };
  };
  events: Array<{
    time: string;
    scorer: { name: string; number: number };
    assist1: { name: string; number: number } | null;
    assist2: { name: string; number: number } | null;
    team_id: number;
    goal_type: string;
  }>;
  scores_by_period: {
    '1p': { home: number | null; away: number | null };
    '2p': { home: number | null; away: number | null };
    '3p': { home: number | null; away: number | null };
    ovt: { home: number | null; away: number | null };
    pss: { home: number | null; away: number | null };
  };
  polled_at: string;
  updated_at_source: string;
}

interface ScheduleData {
  id: number;
  game_no: number;
  home_alih_team_id: number;
  away_alih_team_id: number;
  home_alih_team_score: number | null;
  away_alih_team_score: number | null;
  match_at: string;
  match_place: string;
  live_url: string | null;
  highlight_url: string | null;
  game_status: string | null;
  live_data: LiveData | null;
}

interface PlayerData {
  id: number;
  team_id: number;
  name: string;
  jersey_number: number;
  position: string;
  goals: number;
  assists: number;
  points: number;
  games_played: number;
  slug?: string;
}

const GameDetail = () => {
  const { gameNo } = useParams<{ gameNo: string }>();
  const location = useLocation();
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

  // Collapsible roster state
  const [homeRosterOpen, setHomeRosterOpen] = useState(false);
  const [awayRosterOpen, setAwayRosterOpen] = useState(false);

  // location.state에서 팀 정보를 가져오되, 없으면 null로 처리
  const stateData = location.state as {
    homeTeam?: AlihTeam;
    awayTeam?: AlihTeam;
    matchDate?: string;
  } | null;

  // 스케줄 데이터 가져오기 (공통 훅 사용 - 캐시 일관성 보장)
  const { data: scheduleData, isLoading: scheduleLoading } = useScheduleByGameNo(gameNo) as {
    data: ScheduleGame | undefined;
    isLoading: boolean;
  };

  // 팀 정보 가져오기
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams-for-game', scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_teams')
        .select('*')
        .in('id', [scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id]);

      if (error) throw error;
      return data as AlihTeam[];
    },
    enabled: !!scheduleData && !stateData?.homeTeam,
  });

  // 팀 정보 결정: state에서 먼저 확인, 없으면 DB에서 가져온 데이터 사용
  const homeTeamFromDB = teamsData?.find(t => t.id === scheduleData?.home_alih_team_id) || null;
  const awayTeamFromDB = teamsData?.find(t => t.id === scheduleData?.away_alih_team_id) || null;
  const homeTeam: AlihTeam | null = stateData?.homeTeam || homeTeamFromDB;
  const awayTeam: AlihTeam | null = stateData?.awayTeam || awayTeamFromDB;
  const matchDate: string = stateData?.matchDate || scheduleData?.match_at || '';

  // 경기 완료 여부 확인 (game_status 기반)
  const isCompleted = scheduleData?.game_status === 'Game Finished';

  // 경기 상세 데이터 (완료된 경기만)
  const { data: gameDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['game-detail', gameNo],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_game_details')
        .select('*')
        .eq('game_no', gameNo)
        .maybeSingle();

      if (error) throw error;
      return data as GameDetailData | null;
    },
    enabled: !!gameNo && isCompleted,
  });

  // 맞대결 전적 가져오기 (미완료 경기 또는 종료됐지만 gameDetail이 없는 경우)
  const { data: headToHead, isLoading: h2hLoading } = useQuery({
    queryKey: ['head-to-head', scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id, gameNo],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_schedule')
        .select('*')
        .or(`and(home_alih_team_id.eq.${scheduleData?.home_alih_team_id},away_alih_team_id.eq.${scheduleData?.away_alih_team_id}),and(home_alih_team_id.eq.${scheduleData?.away_alih_team_id},away_alih_team_id.eq.${scheduleData?.home_alih_team_id})`)
        .eq('game_status', 'Game Finished') // 완료된 경기만
        .neq('game_no', Number(gameNo)) // 현재 경기 제외
        .order('match_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as ScheduleData[];
    },
    enabled: !!scheduleData && (!isCompleted || (isCompleted && !gameDetail)),
  });

  // 양 팀 선수 데이터 가져오기 (미완료 경기용 또는 live_data가 있는 경우)
  const hasLiveData = !!scheduleData?.live_data;
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['team-players', scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_players')
        .select('*')
        .in('team_id', [scheduleData?.home_alih_team_id, scheduleData?.away_alih_team_id]);

      if (error) throw error;
      return data as PlayerData[];
    },
    enabled: !!scheduleData,
  });

  // 로딩 상태
  const isLoading = scheduleLoading ||
    (!stateData?.homeTeam && teamsLoading) ||
    (isCompleted && detailLoading);

  const getPlayerName = (playerNo: number, teamId: number) => {
    if (!gameDetail || !homeTeam) return `#${playerNo}`;
    const roster = teamId === homeTeam.id ? gameDetail.home_roster : gameDetail.away_roster;
    const player = roster.find(p => p.no === playerNo);
    return player ? player.name : `#${playerNo}`;
  };

  const getPlayerSlug = (playerNo: number, teamId: number) => {
    const player = players?.find(p => p.team_id === teamId && p.jersey_number === playerNo);
    return player?.slug || player?.id; // Fallback to ID if slug missing
  };

  const getSituationLabel = (situation: string) => {
    if (situation === "+1") return t('stats.situation.ppg');
    if (situation === "-1") return t('stats.situation.shg');
    return t('stats.situation.ev');
  };

  // 피리어드별 시간 조정 함수 (2P는 -20분, 3P는 -40분, OT는 -60분)
  const adjustGameTime = (period: number, time: string) => {
    const [minutes, seconds] = time.split(':').map(Number);
    let adjustedMinutes = minutes;

    if (period === 2) {
      adjustedMinutes = minutes - 20;
    } else if (period === 3) {
      adjustedMinutes = minutes - 40;
    } else if (period === 4) {
      // OT (overtime) - 60분 이후
      adjustedMinutes = minutes - 60;
    } else if (period === 5) {
      // SO (shootout) - 별도 처리
      adjustedMinutes = minutes - 65; // 65분 이후로 가정
    }

    return `${adjustedMinutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 피리어드 라벨 변환 (4 -> OT, 5 -> SO)
  const getPeriodLabel = (period: number) => {
    if (period === 4) return 'OT';
    if (period === 5) return 'SO';
    return `${period}P`;
  };

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([^&?]+)/);
    return match?.[1] || null;
  };

  // 게임 상태 계산
  const getGameStatus = () => {
    if (scheduleData?.game_status === 'Game Finished') return t('game.status.finished');
    const matchDateObj = new Date(matchDate);
    const now = new Date();
    if (matchDateObj <= now) return t('game.status.inProgress');
    return t('game.status.scheduled');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!scheduleData || !homeTeam || !awayTeam) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">{t('error.gameNotFound')}</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('button.back')}
        </Button>
      </div>
    );
  }

  const matchDateObj = new Date(matchDate);
  const gameStatus = getGameStatus();

  // SportsEvent structured data for SEO
  const getEventStatus = () => {
    if (isCompleted) return "https://schema.org/EventScheduled";
    const matchDateObj = new Date(matchDate);
    const now = new Date();
    if (matchDateObj <= now) return "https://schema.org/EventScheduled";
    return "https://schema.org/EventScheduled";
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${getLocalizedTeamName(awayTeam, currentLang)} vs ${getLocalizedTeamName(homeTeam, currentLang)} - ${t('seo.leagueName')}`,
    "description": `${format(matchDateObj, 'PPP', { locale: getDateLocale() })} ${scheduleData.match_place} - ${getLocalizedTeamName(homeTeam, currentLang)} vs ${getLocalizedTeamName(awayTeam, currentLang)}`,
    "sport": "Ice Hockey",
    "startDate": matchDate,
    "endDate": matchDate,
    "eventStatus": getEventStatus(),
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": scheduleData.match_place,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": scheduleData.match_place.includes("안양") || scheduleData.match_place.includes("Anyang") ? "KR" : "JP"
      }
    },
    "homeTeam": {
      "@type": "SportsTeam",
      "name": homeTeam?.name,
      "logo": homeTeam?.logo,
      "url": `https://alhockey.fans/team/${homeTeam?.id}`
    },
    "awayTeam": {
      "@type": "SportsTeam",
      "name": awayTeam?.name,
      "logo": awayTeam?.logo,
      "url": `https://alhockey.fans/team/${awayTeam?.id}`
    },
    "organizer": {
      "@type": "SportsOrganization",
      "name": t('seo.leagueName'),
      "url": "https://alhockey.fans"
    },
    ...(isCompleted && scheduleData.home_alih_team_score !== null && {
      "competitor": [
        {
          "@type": "SportsTeam",
          "name": homeTeam?.name,
          "result": {
            "@type": "QuantitativeValue",
            "value": scheduleData.home_alih_team_score
          }
        },
        {
          "@type": "SportsTeam",
          "name": awayTeam?.name,
          "result": {
            "@type": "QuantitativeValue",
            "value": scheduleData.away_alih_team_score
          }
        }
      ]
    })
  };

  // 미완료 경기 UI 또는 종료됐지만 gameDetail이 없는 경우 (live_data 기반)
  const showLiveDataUI = !isCompleted || (isCompleted && !gameDetail && scheduleData?.live_data);

  if (showLiveDataUI) {
    const homePlayers = players?.filter(p => p.team_id === homeTeam.id) || [];
    const awayPlayers = players?.filter(p => p.team_id === awayTeam.id) || [];

    // 공격 포인트(골+어시스트) 기준 상위 5명
    const homeTopPlayers = [...homePlayers].filter(p => p.position !== 'G').sort((a, b) => b.points - a.points).slice(0, 5);
    const awayTopPlayers = [...awayPlayers].filter(p => p.position !== 'G').sort((a, b) => b.points - a.points).slice(0, 5);

    const liveData = scheduleData.live_data;
    const isInProgress = gameStatus === t('game.status.inProgress');
    const isFinishedWithLiveData = isCompleted && !gameDetail && liveData;

    // live_data events에서 선수 이름 가져오기 (alih_players에서 team_id와 jersey_number로 매칭)
    const getLivePlayerName = (teamId: number, jerseyNumber: number): string => {
      const player = players?.find(p => p.team_id === teamId && p.jersey_number === jerseyNumber);
      return player ? player.name : `#${jerseyNumber}`;
    };

    // goal_type 라벨
    const getGoalTypeLabel = (goalType: string) => {
      if (goalType === "+1") return "PPG";
      if (goalType === "-1") return "SHG";
      return "EQ";
    };

    return (
      <div className="min-h-screen bg-background pb-20">
        <SEO
          title={`${getLocalizedTeamName(homeTeam, currentLang)} vs ${getLocalizedTeamName(awayTeam, currentLang)} - ${isFinishedWithLiveData ? t('page.gameDetail.gameResult') : isInProgress ? t('page.gameDetail.liveGame') : t('page.gameDetail.gameInfo')} | ${t('seo.leagueName')}`}
          description={`${format(matchDateObj, 'PPP', { locale: getDateLocale() })} ${getLocalizedTeamName(homeTeam, currentLang)} vs ${getLocalizedTeamName(awayTeam, currentLang)} @ ${scheduleData?.match_place || ''}`}
          keywords={`${getLocalizedTeamName(homeTeam, currentLang)}, ${getLocalizedTeamName(awayTeam, currentLang)}, ${t('seo.leagueName')}, ${scheduleData?.match_place || ''}`}
          path={`/schedule/${gameNo}`}
          structuredData={structuredData}
        />

        {/* 헤더 */}
        <div className="bg-gradient-to-b from-primary/10 to-background pt-[calc(1rem+env(safe-area-inset-top))] pb-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10" /> {/* Spacer */}
              <h1 className="text-2xl font-bold text-center">
                {isFinishedWithLiveData ? t('page.gameDetail.gameResult') : isInProgress ? t('page.gameDetail.liveGame') : t('page.gameDetail.gameInfo')}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10"
                onClick={async () => {
                  const shareData = {
                    title: `${getLocalizedTeamName(homeTeam, currentLang)} vs ${getLocalizedTeamName(awayTeam, currentLang)}`,
                    text: `${format(matchDateObj, 'PPP', { locale: getDateLocale() })} ${scheduleData.match_place}`,
                    url: window.location.href,
                  };
                  
                  if (navigator.share) {
                    try {
                      await navigator.share(shareData);
                    } catch (err) {
                      // 사용자가 취소한 경우 무시
                    }
                  } else {
                    // 클립보드 복사 (Web Share API 미지원 브라우저)
                    await navigator.clipboard.writeText(window.location.href);
                    alert(t('gameDetail.linkCopied'));
                  }
                }}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-4">
          {/* 1. 팀 정보 및 스코어 */}
          <Card className="p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <Link
                to={`/team/${homeTeam.id}`}
                className="w-[calc(50%-60px)] flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img src={homeTeam.logo} alt={getLocalizedTeamName(homeTeam, currentLang)} className="w-16 h-16 object-contain mb-2" loading="lazy" />
                <p className="text-xs font-medium text-center hover:text-primary transition-colors">{getLocalizedTeamName(homeTeam, currentLang)}</p>
              </Link>

              <div className="w-[120px] flex-shrink-0 flex flex-col items-center">
                {(isInProgress || isFinishedWithLiveData) && liveData ? (
                  <>
                    <div className="flex items-center gap-4">
                      <span className={`text-4xl font-bold ${isInProgress ? 'text-destructive' : ''}`}>{scheduleData.home_alih_team_score ?? 0}</span>
                      <span className="text-2xl text-muted-foreground">:</span>
                      <span className={`text-4xl font-bold ${isInProgress ? 'text-destructive' : ''}`}>{scheduleData.away_alih_team_score ?? 0}</span>
                    </div>
                    {isFinishedWithLiveData ? (
                      <Badge variant="outline" className="mt-2">{t('game.status.finished')}</Badge>
                    ) : (
                      <Badge
                        variant="default"
                        className="mt-2 bg-destructive animate-pulse"
                      >
                        {t('game.status.inProgress')}
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-muted-foreground">VS</span>
                    <Badge
                      variant="outline"
                      className="mt-2 bg-accent"
                    >
                      {gameStatus}
                    </Badge>
                  </>
                )}
              </div>

              <Link
                to={`/team/${awayTeam.id}`}
                className="w-[calc(50%-60px)] flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img src={awayTeam.logo} alt={getLocalizedTeamName(awayTeam, currentLang)} className="w-16 h-16 object-contain mb-2" loading="lazy" />
                <p className="text-xs font-medium text-center hover:text-primary transition-colors">{getLocalizedTeamName(awayTeam, currentLang)}</p>
              </Link>
            </div>

            <div className="text-center space-y-1 text-sm text-muted-foreground border-t pt-4">
              <p className="font-medium">
                {format(matchDateObj, 'PPP', { locale: getDateLocale() })}
              </p>
              <p>
                {format(matchDateObj, 'p', { locale: getDateLocale() })}
              </p>
              <p>{scheduleData.match_place}</p>
            </div>
          </Card>

          {/* 제휴 배너 (항공권 등) */}
          <FlightAffiliateBanner homeTeam={homeTeam} />

          {/* 승부 예측 - 게임 전에만 여기에 표시 (경기 정보와 라이브 스트리밍 사이) */}
          {!isInProgress && !isFinishedWithLiveData && (
            <MatchPrediction
              scheduleId={scheduleData.id}
              homeTeam={{ id: homeTeam.id, name: homeTeam.name, english_name: homeTeam.english_name, japanese_name: homeTeam.japanese_name, logo: homeTeam.logo }}
              awayTeam={{ id: awayTeam.id, name: awayTeam.name, english_name: awayTeam.english_name, japanese_name: awayTeam.japanese_name, logo: awayTeam.logo }}
              disabled={false}
            />
          )}

          {/* 라이브 스트리밍 */}
          <Card className="p-4 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="text-destructive">●</span> {t('section.liveStreaming')}
            </h3>
            {scheduleData.live_url ? (
              <div className="aspect-video w-full rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYoutubeVideoId(scheduleData.live_url)}`}
                  title="라이브 스트리밍"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                {isInProgress
                  ? t('gameDetail.noLiveStream')
                  : t('gameDetail.liveStreamPending')}
              </div>
            )}
          </Card>

          {/* 응원 배틀 */}
          <CheerBattle
            gameNo={gameNo || ''}
            homeTeam={{ id: homeTeam.id, name: homeTeam.name, logo: homeTeam.logo }}
            awayTeam={{ id: awayTeam.id, name: awayTeam.name, logo: awayTeam.logo }}
            isLive={isInProgress}
          />

          {/* 승부 예측 - 게임 중/후에는 응원하기 아래에 표시 */}
          {(isInProgress || isFinishedWithLiveData) && (
            <MatchPrediction
              scheduleId={scheduleData.id}
              homeTeam={{ id: homeTeam.id, name: homeTeam.name, english_name: homeTeam.english_name, japanese_name: homeTeam.japanese_name, logo: homeTeam.logo }}
              awayTeam={{ id: awayTeam.id, name: awayTeam.name, english_name: awayTeam.english_name, japanese_name: awayTeam.japanese_name, logo: awayTeam.logo }}
              disabled={true}
            />
          )}

          {/* 댓글 섹션 */}
          <CommentSection entityType="game" entityId={scheduleData.id} />

          {/* 경기 현황 (live_data가 있을 때만) */}
          {liveData && (
            <Card className="p-4 mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                {isInProgress && <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />}
                {t('section.gameStatus')}
              </h3>

              {/* 피리어드별 득점 */}
              <div className="mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]"></TableHead>
                      <TableHead className="text-center w-10 px-1">1P</TableHead>
                      <TableHead className="text-center w-10 px-1">2P</TableHead>
                      <TableHead className="text-center w-10 px-1">3P</TableHead>
                      {(liveData.scores_by_period.ovt.home !== null || liveData.scores_by_period.pss.home !== null) && (
                        <>
                          {liveData.scores_by_period.ovt.home !== null && <TableHead className="text-center w-10 px-1">OT</TableHead>}
                          {liveData.scores_by_period.pss.home !== null && <TableHead className="text-center w-10 px-1">PSS</TableHead>}
                        </>
                      )}
                      <TableHead className="text-center w-12 px-1 font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium min-w-[90px]">
                        <div className="flex items-center gap-1.5">
                          <img src={homeTeam.logo} alt={getLocalizedTeamName(homeTeam, currentLang)} className="w-5 h-5 object-contain flex-shrink-0" />
                          <span className="text-xs whitespace-nowrap">{getLocalizedTeamName(homeTeam, currentLang)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-1">{liveData.scores_by_period['1p'].home ?? '-'}</TableCell>
                      <TableCell className="text-center px-1">{liveData.scores_by_period['2p'].home ?? '-'}</TableCell>
                      <TableCell className="text-center px-1">{liveData.scores_by_period['3p'].home ?? '-'}</TableCell>
                      {liveData.scores_by_period.ovt.home !== null && <TableCell className="text-center px-1">{liveData.scores_by_period.ovt.home}</TableCell>}
                      {liveData.scores_by_period.pss.home !== null && <TableCell className="text-center px-1">{liveData.scores_by_period.pss.home}</TableCell>}
                      <TableCell className="text-center px-1 font-bold">{scheduleData.home_alih_team_score ?? 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium min-w-[90px]">
                        <div className="flex items-center gap-1.5">
                          <img src={awayTeam.logo} alt={getLocalizedTeamName(awayTeam, currentLang)} className="w-5 h-5 object-contain flex-shrink-0" />
                          <span className="text-xs whitespace-nowrap">{getLocalizedTeamName(awayTeam, currentLang)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-1">{liveData.scores_by_period['1p'].away ?? '-'}</TableCell>
                      <TableCell className="text-center px-1">{liveData.scores_by_period['2p'].away ?? '-'}</TableCell>
                      <TableCell className="text-center px-1">{liveData.scores_by_period['3p'].away ?? '-'}</TableCell>
                      {liveData.scores_by_period.ovt.away !== null && <TableCell className="text-center px-1">{liveData.scores_by_period.ovt.away}</TableCell>}
                      {liveData.scores_by_period.pss.away !== null && <TableCell className="text-center px-1">{liveData.scores_by_period.pss.away}</TableCell>}
                      <TableCell className="text-center px-1 font-bold">{scheduleData.away_alih_team_score ?? 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* 슛 통계 */}
              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2 text-center">{t('gameDetail.sog')}</h4>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-right">
                    <span className="text-2xl font-bold">{liveData.shots.total.home}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-32 h-3 bg-muted rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.round((liveData.shots.total.home / (liveData.shots.total.home + liveData.shots.total.away || 1)) * 100)}%` }}
                      />
                      <div
                        className="h-full bg-destructive"
                        style={{ width: `${Math.round((liveData.shots.total.away / (liveData.shots.total.home + liveData.shots.total.away || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {liveData.shots['1p'].home}-{liveData.shots['1p'].away} / {liveData.shots['2p'].home}-{liveData.shots['2p'].away} / {liveData.shots['3p'].home}-{liveData.shots['3p'].away}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-2xl font-bold">{liveData.shots.total.away}</span>
                  </div>
                </div>
              </div>

              {/* 득점 이벤트 */}
              {liveData.events.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Goal className="h-4 w-4" />
                    {t('gameDetail.scoringRecord')}
                  </h4>
                  <div className="space-y-2">
                    {liveData.events.map((event, index) => {
                      const scoringTeam = event.team_id === homeTeam.id ? homeTeam : awayTeam;
                      // 시간을 기반으로 피리어드 계산 (MM:SS 형식)
                      const [minutes] = event.time.split(':').map(Number);
                      let period = 1;
                      let adjustedMinutes = minutes;
                      if (minutes >= 40) {
                        period = 3;
                        adjustedMinutes = minutes - 40;
                      } else if (minutes >= 20) {
                        period = 2;
                        adjustedMinutes = minutes - 20;
                      }
                      const adjustedTime = `${adjustedMinutes}:${event.time.split(':')[1]}`;

                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 border rounded-lg"
                        >
                          <img src={scoringTeam.logo} alt={getLocalizedTeamName(scoringTeam, currentLang)} className="w-10 h-10 object-contain" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{period}P {adjustedTime}</Badge>
                              <Badge className="text-xs">{getGoalTypeLabel(event.goal_type)}</Badge>
                            </div>
                            <p className="font-medium text-sm truncate">
                              {t('gameDetail.scorer')}: <Link to={`/player/${getPlayerSlug(event.scorer.number, event.team_id)}`} className="hover:underline hover:text-primary text-foreground transition-colors">{getLivePlayerName(event.team_id, event.scorer.number)}</Link> (#{event.scorer.number})
                            </p>
                            {(event.assist1 || event.assist2) && (
                              <p className="text-xs text-muted-foreground">
                                {t('gameDetail.assist')}: {event.assist1 && <><Link to={`/player/${getPlayerSlug(event.assist1.number, event.team_id)}`} className="hover:underline hover:text-primary text-muted-foreground transition-colors">{getLivePlayerName(event.team_id, event.assist1.number)}</Link> (#{event.assist1.number})</>}
                                {event.assist2 && <>, <Link to={`/player/${getPlayerSlug(event.assist2.number, event.team_id)}`} className="hover:underline hover:text-primary text-muted-foreground transition-colors">{getLivePlayerName(event.team_id, event.assist2.number)}</Link> (#{event.assist2.number})</>}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* 맞대결 전적 */}
          <Card className="p-4 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              {t('section.headToHead')}
            </h3>
            {h2hLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : headToHead && headToHead.length > 0 ? (
              <div className="space-y-3">
                {headToHead.map((game) => {
                  const gameDate = new Date(game.match_at);
                  const isHomeTeamHome = game.home_alih_team_id === homeTeam.id;
                  const homeScore = isHomeTeamHome ? game.home_alih_team_score : game.away_alih_team_score;
                  const awayScore = isHomeTeamHome ? game.away_alih_team_score : game.home_alih_team_score;
                  const homeWin = (homeScore || 0) > (awayScore || 0);
                  const awayWin = (awayScore || 0) > (homeScore || 0);

                  return (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/schedule/${game.game_no}`)}
                    >
                      <div className="text-sm text-muted-foreground">
                        {format(gameDate, 'M/d', { locale: getDateLocale() })}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 ${homeWin ? 'font-bold' : ''}`}>
                          <img src={homeTeam.logo} alt={getLocalizedTeamName(homeTeam, currentLang)} className="w-6 h-6 object-contain" />
                          <span>{homeScore}</span>
                        </div>
                        <span className="text-muted-foreground">:</span>
                        <div className={`flex items-center gap-2 ${awayWin ? 'font-bold' : ''}`}>
                          <span>{awayScore}</span>
                          <img src={awayTeam.logo} alt={getLocalizedTeamName(awayTeam, currentLang)} className="w-6 h-6 object-contain" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t('gameDetail.noH2HRecord')}</p>
            )}
          </Card>

          {/* 4. 스타 플레이어 */}
          <Card className="p-4 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('section.starPlayers')}
            </h3>
            {playersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* 모바일: 세로 배치, 데스크탑: 가로 배치 */}
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2">
                  {/* 홈팀 */}
                  <div>
                    <div className="flex justify-between items-center py-2 px-2 border-b bg-muted/30">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{getLocalizedTeamName(homeTeam, currentLang)}</span>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{t('gameDetail.goals')}</span>
                        <span>{t('gameDetail.assistLabel')}</span>
                      </div>
                    </div>
                    {homeTopPlayers.map((player, idx) => (
                      <div key={player.id} className={`flex justify-between items-center py-2 px-2 ${idx === 0 ? 'font-bold' : ''} border-b border-border/50`}>
                        <span className="text-sm truncate flex-1">
                          <Link to={`/player/${player.slug || player.id}`} className="hover:underline hover:text-primary text-foreground transition-colors">
                            {player.name}
                          </Link>
                        </span>
                        <div className="flex gap-4 text-sm">
                          <span className="w-6 text-center">{player.goals}</span>
                          <span className="w-6 text-center">{player.assists}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 어웨이팀 */}
                  <div>
                    <div className="flex justify-between items-center py-2 px-2 border-b bg-muted/30">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{getLocalizedTeamName(awayTeam, currentLang)}</span>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{t('gameDetail.goals')}</span>
                        <span>{t('gameDetail.assistLabel')}</span>
                      </div>
                    </div>
                    {awayTopPlayers.map((player, idx) => (
                      <div key={player.id} className={`flex justify-between items-center py-2 px-2 ${idx === 0 ? 'font-bold' : ''} border-b border-border/50`}>
                        <span className="text-sm truncate flex-1">
                          <Link to={`/player/${player.slug || player.id}`} className="hover:underline hover:text-primary text-foreground transition-colors">
                            {player.name}
                          </Link>
                        </span>
                        <div className="flex gap-4 text-sm">
                          <span className="w-6 text-center">{player.goals}</span>
                          <span className="w-6 text-center">{player.assists}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  {t('gameDetail.starPlayerDesc')}
                </p>
              </>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // 완료된 경기 UI (기존 코드)
  if (!gameDetail) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">경기 상세 기록을 불러올 수 없습니다</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>
    );
  }

  const [homeScore, awayScore] = gameDetail.game_summary.total.score.split(' : ');

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO
        title={`${getLocalizedTeamName(homeTeam, currentLang)} vs ${getLocalizedTeamName(awayTeam, currentLang)} - ${t('page.gameDetail.gameResult')} | ${t('seo.leagueName')}`}
        description={`${format(matchDateObj, 'PPP', { locale: getDateLocale() })} ${getLocalizedTeamName(homeTeam, currentLang)} vs ${getLocalizedTeamName(awayTeam, currentLang)} @ ${scheduleData?.match_place || ''}`}
        keywords={`${getLocalizedTeamName(homeTeam, currentLang)}, ${getLocalizedTeamName(awayTeam, currentLang)}, ${t('seo.leagueName')}, ${scheduleData?.match_place || ''}`}
        path={`/schedule/${gameNo}`}
        structuredData={structuredData}
      />
      {/* 헤더 */}
      <div className="bg-gradient-to-b from-primary/10 to-background pt-[calc(1rem+env(safe-area-inset-top))] pb-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="w-10" /> {/* Spacer */}
            <h1 className="text-2xl font-bold text-center">{t('page.gameDetail.gameResult')}</h1>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              onClick={async () => {
                const shareData = {
                  title: `${homeTeam.name} vs ${awayTeam.name} - 아시아리그 아이스하키`,
                  text: `${matchDateObj.toLocaleDateString('ko-KR')} ${gameDetail.game_info.venue}에서 열린 경기 상세 기록`,
                  url: window.location.href,
                };
                
                if (navigator.share) {
                  try {
                    await navigator.share(shareData);
                  } catch (err) {
                    // 사용자가 취소한 경우 무시
                  }
                } else {
                  await navigator.clipboard.writeText(window.location.href);
                  alert('링크가 클립보드에 복사되었습니다!');
                }
              }}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 스코어보드 */}
      <div className="container mx-auto px-4 -mt-4">
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            {/* 홈팀 */}
            <Link
              to={`/team/${homeTeam.id}`}
              className="w-[calc(50%-60px)] flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img src={homeTeam.logo} alt={getLocalizedTeamName(homeTeam, currentLang)} className="w-16 h-16 object-contain mb-2" />
              <p className="text-xs font-medium text-center hover:text-primary transition-colors">{getLocalizedTeamName(homeTeam, currentLang)}</p>
            </Link>

            {/* 스코어 */}
            <div className="w-[120px] flex-shrink-0 flex flex-col items-center">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold">{homeScore}</span>
                <span className="text-2xl text-muted-foreground">:</span>
                <span className="text-4xl font-bold">{awayScore}</span>
              </div>
              <Badge variant="outline" className="mt-2">{t('gameDetail.final')}</Badge>
            </div>

            {/* 어웨이팀 */}
            <Link
              to={`/team/${awayTeam.id}`}
              className="w-[calc(50%-60px)] flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img src={awayTeam.logo} alt={getLocalizedTeamName(awayTeam, currentLang)} className="w-16 h-16 object-contain mb-2" />
              <p className="text-xs font-medium text-center hover:text-primary transition-colors">{getLocalizedTeamName(awayTeam, currentLang)}</p>
            </Link>
          </div>

          {/* 경기 정보 */}
          <div className="text-center space-y-1 text-sm text-muted-foreground border-t pt-4">
            <p className="font-medium">
              {format(matchDateObj, 'PPP', { locale: getDateLocale() })}
            </p>
            <p>{gameDetail.game_info.venue}</p>
            <p>{t('gameDetail.spectators')}: {gameDetail.spectators.toLocaleString()}</p>
          </div>
        </Card>

        {/* 응원 배틀 */}
        <CheerBattle
          gameNo={gameNo || ''}
          homeTeam={{ id: homeTeam.id, name: homeTeam.name, logo: homeTeam.logo }}
          awayTeam={{ id: awayTeam.id, name: awayTeam.name, logo: awayTeam.logo }}
          isLive={false}
        />

        {/* 승부 예측 - 완료된 경기: 응원하기 아래, 읽기 전용 */}
        <MatchPrediction
          scheduleId={scheduleData?.id || 0}
          homeTeam={{ id: homeTeam.id, name: homeTeam.name, english_name: homeTeam.english_name, japanese_name: homeTeam.japanese_name, logo: homeTeam.logo }}
          awayTeam={{ id: awayTeam.id, name: awayTeam.name, english_name: awayTeam.english_name, japanese_name: awayTeam.japanese_name, logo: awayTeam.logo }}
          disabled={true}
        />

        {/* 제휴 배너 (항공권 등) */}
        <FlightAffiliateBanner homeTeam={homeTeam} />

        {/* 댓글 섹션 */}
        <CommentSection entityType="game" entityId={scheduleData?.id || 0} />

        {/* 경기 하이라이트 */}
        {scheduleData?.highlight_url && (
          <Card className="p-4 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Play className="h-4 w-4" />
              {t('gameDetail.gameHighlight')}
            </h3>
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${getYoutubeVideoId(scheduleData.highlight_url)}`}
                title={t('gameDetail.gameHighlight')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>
        )}

        {/* 경기 요약 카드 */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-4">{t('gameDetail.periodSummary')}</h3>
          <div className="overflow-x-auto scrollbar-hide">
            <Table className="min-w-[330px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 whitespace-nowrap">{t('gameDetail.category')}</TableHead>
                  <TableHead className="text-center whitespace-nowrap">{t('gameDetail.goals')}</TableHead>
                  <TableHead className="text-center whitespace-nowrap">{t('gameDetail.shotsOnGoal')}</TableHead>
                  <TableHead className="text-center whitespace-nowrap">{t('gameDetail.penaltyMin')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium whitespace-nowrap">1P</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.period_1.score}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.period_1.sog}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.period_1.pim}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium whitespace-nowrap">2P</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.period_2.score}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.period_2.sog}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.period_2.pim}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium whitespace-nowrap">3P</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.period_3.score}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.period_3.sog}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.period_3.pim}</TableCell>
                </TableRow>
                {gameDetail.game_summary.ovt && gameDetail.game_summary.ovt.score && (
                  <TableRow>
                    <TableCell className="font-medium whitespace-nowrap">OT</TableCell>
                    <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.ovt.score}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.ovt.sog}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.ovt.pim}</TableCell>
                  </TableRow>
                )}
                {gameDetail.game_summary.pss && gameDetail.game_summary.pss.score && (
                  <TableRow>
                    <TableCell className="font-medium whitespace-nowrap">SO</TableCell>
                    <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.pss.score}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.pss.sog}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.pss.pim}</TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell className="whitespace-nowrap">Total</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.total.score}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.total.sog}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{gameDetail.game_summary.total.pim}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* 득점 기록 카드 */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Goal className="h-4 w-4" />
            {t('gameDetail.scoringRecord')}
          </h3>
          {gameDetail.goals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('error.noHeadToHead')}</p>
          ) : (
            <div className="space-y-3">
              {[...gameDetail.goals]
                .sort((a, b) => {
                  if (a.period !== b.period) return a.period - b.period;
                  const [aMin, aSec] = a.time.split(':').map(Number);
                  const [bMin, bSec] = b.time.split(':').map(Number);
                  return (aMin * 60 + aSec) - (bMin * 60 + bSec);
                })
                .map((goal, index) => {
                  const scoringTeam = goal.team_id === homeTeam.id ? homeTeam : awayTeam;
                  return (
                    <div key={`goal-${index}`} className="flex items-start gap-3 p-3 border rounded-lg bg-primary/5">
                      <img src={scoringTeam.logo} alt={scoringTeam.name} className="w-10 h-10 object-contain flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">{getPeriodLabel(goal.period)} {adjustGameTime(goal.period, goal.time)}</Badge>
                          <Badge className="text-xs whitespace-nowrap">{getSituationLabel(goal.situation)}</Badge>
                        </div>
                        <p className="font-medium text-sm">
                          {t('gameDetail.scorer')}: <Link to={`/player/${getPlayerSlug(goal.goal_no, goal.team_id)}`} className="hover:underline hover:text-primary text-primary transition-colors">{getPlayerName(goal.goal_no, goal.team_id)}</Link> (#{goal.goal_no})
                        </p>
                        {(goal.assist1_no || goal.assist2_no) && (
                          <p className="text-xs text-muted-foreground">
                            {t('gameDetail.assist')}:
                            {goal.assist1_no && (
                              <> <Link to={`/player/${getPlayerSlug(goal.assist1_no, goal.team_id)}`} className="hover:underline hover:text-primary text-muted-foreground transition-colors">{getPlayerName(goal.assist1_no, goal.team_id)}</Link> (#{goal.assist1_no})</>
                            )}
                            {goal.assist2_no && (
                              <>, <Link to={`/player/${getPlayerSlug(goal.assist2_no, goal.team_id)}`} className="hover:underline hover:text-primary text-muted-foreground transition-colors">{getPlayerName(goal.assist2_no, goal.team_id)}</Link> (#{goal.assist2_no})</>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        {/* 페널티 기록 카드 */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('gameDetail.penalty')}
          </h3>
          {gameDetail.penalties.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('gameDetail.noPenalty')}</p>
          ) : (
            <div className="space-y-3">
              {[...gameDetail.penalties]
                .sort((a, b) => {
                  if (a.period !== b.period) return a.period - b.period;
                  const [aMin, aSec] = a.time.split(':').map(Number);
                  const [bMin, bSec] = b.time.split(':').map(Number);
                  return (aMin * 60 + aSec) - (bMin * 60 + bSec);
                })
                .map((penalty, index) => {
                  const penaltyTeam = penalty.team_id === homeTeam.id ? homeTeam : awayTeam;
                  return (
                    <div key={`penalty-${index}`} className="flex items-start gap-3 p-3 border rounded-lg">
                      <img src={penaltyTeam.logo} alt={penaltyTeam.name} className="w-10 h-10 object-contain flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">{getPeriodLabel(penalty.period)} {adjustGameTime(penalty.period, penalty.time)}</Badge>
                          <Badge variant="destructive" className="text-xs whitespace-nowrap">{penalty.minutes} min</Badge>
                        </div>
                        <p className="font-medium text-sm">
                          <Link to={`/player/${getPlayerSlug(penalty.player_no, penalty.team_id)}`} className="hover:underline hover:text-primary text-foreground transition-colors">
                            {getPlayerName(penalty.player_no, penalty.team_id)}
                          </Link> (#{penalty.player_no})
                        </p>
                        <p className="text-xs text-muted-foreground">{t('gameDetail.offence')}: {penalty.offence}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        {/* 선수 명단 - 접힘/펼침 가능 */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('gameDetail.roster')}
          </h3>

          {/* 홈팀 선수 명단 */}
          <div className="mb-4">
            <button
              onClick={() => setHomeRosterOpen(!homeRosterOpen)}
              className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <img src={homeTeam.logo} alt={homeTeam.name} className="w-6 h-6 object-contain" />
                <span className="font-medium">{homeTeam.name}</span>
              </div>
              {homeRosterOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {homeRosterOpen && (
              <div className="overflow-x-auto scrollbar-hide mt-3">
                <Table className="min-w-[350px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14 whitespace-nowrap">{t('gameDetail.rosterNumber')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('gameDetail.rosterName')}</TableHead>
                      <TableHead className="text-center w-16 whitespace-nowrap">{t('gameDetail.rosterPosition')}</TableHead>
                      <TableHead className="text-center w-14 whitespace-nowrap">SOG</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameDetail.home_roster
                      .filter(p => p.played)
                      .map((player) => (
                        <TableRow key={player.no}>
                          <TableCell className="font-medium whitespace-nowrap">#{player.no}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Link to={`/player/${getPlayerSlug(player.no, homeTeam.id)}`} className="hover:underline hover:text-primary text-foreground transition-colors">
                              {player.name}
                            </Link>
                            {player.captain_asst && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {player.captain_asst}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">{player.pos}</TableCell>
                          <TableCell className="text-center whitespace-nowrap">{player.sog}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* 어웨이팀 선수 명단 */}
          <div>
            <button
              onClick={() => setAwayRosterOpen(!awayRosterOpen)}
              className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <img src={awayTeam.logo} alt={awayTeam.name} className="w-6 h-6 object-contain" />
                <span className="font-medium">{awayTeam.name}</span>
              </div>
              {awayRosterOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {awayRosterOpen && (
              <div className="overflow-x-auto scrollbar-hide mt-3">
                <Table className="min-w-[350px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14 whitespace-nowrap">번호</TableHead>
                      <TableHead className="whitespace-nowrap">이름</TableHead>
                      <TableHead className="text-center w-16 whitespace-nowrap">포지션</TableHead>
                      <TableHead className="text-center w-14 whitespace-nowrap">SOG</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameDetail.away_roster
                      .filter(p => p.played)
                      .map((player) => (
                        <TableRow key={player.no}>
                          <TableCell className="font-medium whitespace-nowrap">#{player.no}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Link to={`/player/${getPlayerSlug(player.no, awayTeam.id)}`} className="hover:underline hover:text-primary text-foreground transition-colors">
                              {player.name}
                            </Link>
                            {player.captain_asst && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {player.captain_asst}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">{player.pos}</TableCell>
                          <TableCell className="text-center whitespace-nowrap">{player.sog}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-3">{t('gameDetail.glossary')}</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">SOG (Shot on Goal)</p>
              <p className="text-xs text-muted-foreground">{t('gameDetail.shotsOnGoal')}</p>
            </div>
            <div>
              <p className="font-medium">PIM (Penalties in Minutes)</p>
              <p className="text-xs text-muted-foreground">{t('gameDetail.penaltyMin')}</p>
            </div>
            <div>
              <p className="font-medium">PPG (Power Play Goal)</p>
              <p className="text-xs text-muted-foreground">{currentLang === 'ko' ? '팀이 수적 우위 상황에서 넣은 골' : currentLang === 'ja' ? 'パワープレイゴール' : 'Power play goal'}</p>
            </div>
            <div>
              <p className="font-medium">SHG (Short Handed Goal)</p>
              <p className="text-xs text-muted-foreground">{currentLang === 'ko' ? '팀이 수적 열세 상황에서 넣은 골' : currentLang === 'ja' ? 'ショートハンドゴール' : 'Short handed goal'}</p>
            </div>
          </div>
        </Card>

        {/* 기타 정보 */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-3">{t('gameDetail.gameInfo')}</h3>
          <div className="text-sm">
            <h4 className="font-medium mb-2">{currentLang === 'ko' ? '코치진' : currentLang === 'ja' ? 'コーチ陣' : 'Coaches'}</h4>
            <div className="space-y-1 text-muted-foreground">
              <p>{currentLang === 'ko' ? '홈 감독' : currentLang === 'ja' ? 'ホーム監督' : 'Home Manager'}: {gameDetail.game_info.coaches.home_manager}</p>
              <p>{currentLang === 'ko' ? '홈 코치' : currentLang === 'ja' ? 'ホームコーチ' : 'Home Coach'}: {gameDetail.game_info.coaches.home_coach}</p>
              <p>{currentLang === 'ko' ? '원정 감독' : currentLang === 'ja' ? 'アウェイ監督' : 'Away Manager'}: {gameDetail.game_info.coaches.away_manager}</p>
              <p>{currentLang === 'ko' ? '원정 코치' : currentLang === 'ja' ? 'アウェイコーチ' : 'Away Coach'}: {gameDetail.game_info.coaches.away_coach}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GameDetail;