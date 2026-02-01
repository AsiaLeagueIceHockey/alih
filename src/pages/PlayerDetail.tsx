import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { Loader2, ChevronLeft, Instagram, Calendar, MapPin, Ruler, Weight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SEO from "@/components/SEO";
import CommentSection from "@/components/comments/CommentSection";
import { Player, Team, CareerHistory } from "@/types/team";
import { useTranslation } from "react-i18next";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { format, differenceInYears } from "date-fns";

const PlayerDetail = () => {
  const { playerSlug } = useParams<{ playerSlug: string }>();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  // Detect if the param is a numeric ID (legacy support) or a slug
  const isNumericId = playerSlug && /^\d+$/.test(playerSlug);

  // 선수 정보 조회
  const { data: player, isLoading: isLoadingPlayer } = useQuery({
    queryKey: ['player-detail', playerSlug],
    queryFn: async () => {
      let query = externalSupabase
        .from('alih_players')
        .select('*');
      
      // Query by ID (legacy) or slug
      if (isNumericId) {
        query = query.eq('id', playerSlug);
      } else {
        query = query.eq('slug', playerSlug);
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      return data as Player;
    },
    enabled: !!playerSlug,
    staleTime: 1000 * 60 * 60,
  });

  // 팀 정보 조회
  const { data: team } = useQuery({
    queryKey: ['team-for-player', player?.team_id],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_teams')
        .select('*')
        .eq('id', player!.team_id)
        .single();

      if (error) throw error;
      return data as Team;
    },
    enabled: !!player?.team_id,
    staleTime: 1000 * 60 * 60,
  });

  // 득점 순위 조회 (동률 포함)
  const { data: goalRank } = useQuery({
    queryKey: ['player-goal-rank', player?.id],
    queryFn: async () => {
      // 1. 나보다 골이 많은 선수의 수를 셈
      const { count, error } = await externalSupabase
        .from('alih_players')
        .select('*', { count: 'exact', head: true })
        .gt('goals', player!.goals);

      if (error) throw error;
      
      // 2. (더 많은 선수 수) + 1 = 나의 등수
      return (count ?? 0) + 1;
    },
    enabled: !!player,
    staleTime: 1000 * 60 * 60,
  });

  // 다국어 선수명
  const getLocalizedPlayerName = () => {
    if (!player) return '';
    switch (currentLang) {
      case 'ko': return player.name_ko || player.name;
      case 'ja': return player.name_ja || player.name;
      case 'en': return player.name_en || player.name;
      default: return player.name;
    }
  };

  // 포지션 라벨
  const getPositionLabel = (pos: string) => {
    const positions: Record<string, Record<string, string>> = {
      'F': { ko: '포워드', en: 'Forward', ja: 'フォワード' },
      'D': { ko: '수비수', en: 'Defenseman', ja: 'ディフェンス' },
      'G': { ko: '골리', en: 'Goaltender', ja: 'ゴーリー' },
    };
    return positions[pos]?.[currentLang] || pos;
  };

  // 나이 계산
  const getAge = () => {
    if (!player?.birth_date) return null;
    return differenceInYears(new Date(), new Date(player.birth_date));
  };

  if (isLoadingPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">
          {currentLang === 'ko' ? '선수를 찾을 수 없습니다.' : 'Player not found.'}
        </p>
        <Link to="/">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('common.back', 'Back')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${getLocalizedPlayerName()} | ${team ? getLocalizedTeamName(team, currentLang) : ''}`}
        description={`${getLocalizedPlayerName()} - ${player.points}pts (${player.goals}G, ${player.assists}A)`}
        ogImage={player.photo_url}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative">
          {/* 블러 배경 */}
          {player.photo_url && (
            <div 
              className="absolute inset-0 h-80 bg-cover bg-center blur-2xl opacity-30"
              style={{ backgroundImage: `url(${player.photo_url})` }}
            />
          )}
          
          <div className="relative pt-[calc(1rem+env(safe-area-inset-top))] px-4 pb-6">
            {/* Back Button */}
            <div className="flex items-center justify-between mb-4">
              <Link to={team ? `/team/${team.id}` : '/'}>
                <Button variant="ghost" size="sm" className="gap-1">
                  <ChevronLeft className="w-4 h-4" />
                  {team ? getLocalizedTeamName(team, currentLang) : t('common.back', 'Back')}
                </Button>
              </Link>
              
              {player.instagram_url && (
                <a href={player.instagram_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </Button>
                </a>
              )}
            </div>

            {/* Player Info */}
            <div className="flex gap-4 items-start">
              {/* Photo */}
              <div className="w-28 h-36 md:w-36 md:h-48 rounded-lg overflow-hidden bg-secondary border-2 border-border shadow-lg flex-shrink-0">
                {player.photo_url ? (
                  <img 
                    src={player.photo_url} 
                    alt={getLocalizedPlayerName()} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
                    #{player.jersey_number}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold">#{player.jersey_number}</span>
                  {player.nationality_flag && (
                    <span className="text-lg">{player.nationality_flag}</span>
                  )}
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold mb-2 truncate">
                  {getLocalizedPlayerName()}
                </h1>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="text-sm">
                    {getPositionLabel(player.position)}
                  </Badge>
                  {team && (
                    <Badge variant="outline" className="text-sm">
                      <img src={team.logo} alt="" className="w-7 h-4 mr-2" />
                      {getLocalizedTeamName(team, currentLang)}
                    </Badge>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex gap-2 text-sm text-muted-foreground flex-wrap">
                  {getAge() && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {getAge()}{currentLang === 'ko' ? '세' : ' yrs'}
                    </span>
                  )}
                  {player.height_cm && (
                    <span className="flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5" />
                      {player.height_cm}cm
                    </span>
                  )}
                  {player.weight_kg && (
                    <span className="flex items-center gap-1">
                      <Weight className="w-3.5 h-3.5" />
                      {player.weight_kg}kg
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-24 space-y-6">
          {/* Stats Dashboard */}
          <Card className="p-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              📊 {currentLang === 'ko' ? '25-26 시즌 스탯' : currentLang === 'ja' ? '25-26 シーズン成績' : '25-26 Season Stats'}
            </h2>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">GP</div>
                <div className="text-xl font-bold">{player.games_played}</div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">G</div>
                <div className="text-xl font-bold text-success">{player.goals}</div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">A</div>
                <div className="text-xl font-bold text-primary">{player.assists}</div>
              </div>
              
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">PTS</div>
                <div className="text-xl font-bold">{player.points}</div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  {player.position === 'G' ? 'SVS/SA' : '+/-'}
                </div>
                <div className={`font-bold ${player.position === 'G' ? 'text-sm flex items-center justify-center h-7' : 'text-xl'} ${!player.position && player.plus_minus > 0 ? 'text-success' : !player.position && player.plus_minus < 0 ? 'text-destructive' : ''}`}>
                  {player.position !== 'G' && player.plus_minus > 0 ? '+' : ''}{player.plus_minus}
                </div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">PIM</div>
                <div className="text-xl font-bold">{player.pim}</div>
              </div>
            </div>

            {/* Goal Rank */}
            {goalRank && goalRank <= 20 && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {currentLang === 'ko' 
                    ? `리그 득점 ${goalRank}위` 
                    : currentLang === 'ja'
                      ? `リーグ得点${goalRank}位`
                      : `#${goalRank} in Goals`}
                </span>
              </div>
            )}
          </Card>

          {/* Draft Info */}
          {player.draft_info && (
            <Card className="p-4">
              <h2 className="text-lg font-bold mb-3">
                🏒 {currentLang === 'ko' ? '드래프트 정보' : 'Draft Info'}
              </h2>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{player.draft_info.year}</span>
                {' '}
                {currentLang === 'ko' ? '년' : ''} 
                {' '}
                {player.draft_info.team}
                {' - '}
                Round {player.draft_info.round}, Pick {player.draft_info.pick}
              </div>
            </Card>
          )}

          {/* Bio/Story */}
          {player.bio_markdown && (
            <Card className="p-4">
              <h2 className="text-lg font-bold mb-3">
                📜 {currentLang === 'ko' ? '선수 소개' : currentLang === 'ja' ? '選手紹介' : 'About'}
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {/* TODO: react-markdown 추가 시 마크다운 렌더링 */}
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {player.bio_markdown}
                </p>
              </div>
            </Card>
          )}

          {/* Career History */}
          {player.career_history && player.career_history.length > 0 && (
            <Card className="p-4">
              <h2 className="text-lg font-bold mb-3">
                📋 {currentLang === 'ko' ? '커리어' : 'Career History'}
              </h2>
              <div className="space-y-2">
                {player.career_history.map((career: CareerHistory, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <div className="font-medium">{career.team}</div>
                      <div className="text-xs text-muted-foreground">
                        {career.league} • {career.season}
                      </div>
                    </div>
                    {career.pts !== undefined && (
                      <Badge variant="secondary">
                        {career.g}G {career.a}A ({career.pts}P)
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Digital Card CTA */}
          {/* <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <h3 className="text-lg font-bold mb-2">
              🎴 {currentLang === 'ko' ? '나만의 선수 카드 발급받기' : 'Get Your Digital Player Card'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {currentLang === 'ko' 
                ? '팬 한정 디지털 카드를 발급받고 공유하세요!' 
                : 'Get your exclusive fan card and share it!'}
            </p>
            <Link to={`/player/${player.slug || player.id}/card`}>
              <Button size="lg" className="w-full">
                {currentLang === 'ko' ? '카드 발급하기' : 'Generate Card'}
              </Button>
            </Link>
          </Card> */}

          <Separator />

          {/* Comments */}
          <CommentSection entityType="player" entityId={player.id} />
        </div>
      </div>
    </>
  );
};

export default PlayerDetail;
