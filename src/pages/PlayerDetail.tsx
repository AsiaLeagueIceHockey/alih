import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { Loader2, ChevronLeft, Instagram, Calendar, MapPin, Ruler, Weight, Trophy, CreditCard, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SEO from "@/components/SEO";
import CommentSection from "@/components/comments/CommentSection";
import { Player, Team, CareerHistory, PlayerCard as PlayerCardType } from "@/types/team";
import { useTranslation } from "react-i18next";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { format, differenceInYears } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import CardGenerationOverlay from "@/components/player/CardGenerationOverlay";
import PlayerCard from "@/components/player/PlayerCard";
import LoginDialog from "@/components/auth/LoginDialog";
import CardDetailModal from "@/components/player/CardDetailModal";

const PlayerDetail = () => {
  const { playerSlug } = useParams<{ playerSlug: string }>();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State for card generation
  const [showGenerationOverlay, setShowGenerationOverlay] = useState(false);
  const [showCardDetail, setShowCardDetail] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  
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
    queryKey: ['team-detail-v2', player?.team_id],
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

  // 내 보유 카드 조회
  const { data: myCard, refetch: refetchMyCard } = useQuery({
    queryKey: ['my-player-card', player?.id, user?.id],
    queryFn: async () => {
      if (!user || !player) return null;
      const { data, error } = await externalSupabase
        .from('player_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('player_id', player.id)
        .maybeSingle(); // Use maybeSingle to avoid 406 on no rows
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as PlayerCardType | null;
    },
    enabled: !!player && !!user,
  });

  // Handle Issue Card Click
  const handleIssueCardClick = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    setShowGenerationOverlay(true);
  };

  const handleCardGenerated = (card: PlayerCardType) => {
    // Invalidate queries to refresh card status
    queryClient.invalidateQueries({ queryKey: ['my-player-card'] });
    refetchMyCard();
    // Overlay will show success state, user closes it manually
  };

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
    // @ts-ignore
    return t(`playerDetail.position.${pos}`, pos); 
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
          {t('playerDetail.notFound')}
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
            {/* Top Bar - Instagram Only */}
            <div className="flex items-center justify-end mb-4">
              {player.instagram_url && (
                <a href={player.instagram_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2 bg-background/50 backdrop-blur-sm border-white/20 hover:bg-background/80">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </Button>
                </a>
              )}
            </div>

            {/* Player Info */}
            <div className="flex gap-4 items-start mt-8">
              {/* Photo */}
              <div className="w-28 h-36 md:w-36 md:h-48 rounded-lg overflow-hidden bg-secondary border-2 border-border shadow-lg flex-shrink-0 relative z-10">
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
              <div className="flex-1 min-w-0 pt-2 text-white drop-shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold">#{player.jersey_number}</span>
                  {player.nationality_flag && (
                    <span className="text-lg">{player.nationality_flag}</span>
                  )}
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold mb-3 truncate">
                  {getLocalizedPlayerName()}
                </h1>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="text-sm bg-black/50 backdrop-blur-md border-white/10 text-white hover:bg-black/60">
                    {getPositionLabel(player.position)}
                  </Badge>
                  {team && (
                    <Link to={`/team/${team.id}`}>
                      <Badge variant="outline" className="text-sm hover:bg-secondary/80 transition-colors border-foreground/20 text-foreground/80 cursor-pointer gap-2 pl-2 pr-3 py-1">
                         <img src={team.logo} alt="" className="w-5 h-5 object-contain" />
                        {getLocalizedTeamName(team, currentLang)}
                      </Badge>
                    </Link>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex gap-2 text-sm text-muted-foreground flex-wrap">
                  {getAge() && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {getAge()}{t('playerDetail.ageSuffix')}
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
              📊 {t('playerDetail.seasonStats')}
            </h2>
            
            <div className="grid grid-cols-6 gap-2 text-center">
              {/* Common Stat: GP */}
              <div className="bg-secondary/50 rounded-lg p-3 col-span-2">
                <div className="text-xs text-muted-foreground mb-1">GP</div>
                <div className="text-xl font-bold">{player.games_played}</div>
              </div>

              {/* Conditional Rendering based on Position */}
              {(player.position === 'G' || player.position === 'GK' || player.position === '골리') ? (
                <>
                  {/* Goalie Stats */}
                  <div className="bg-secondary/50 rounded-lg p-3 col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">SV%</div>
                    <div className="text-xl font-bold text-success">
                      {player.save_pct ? `${Number(player.save_pct).toFixed(2)}%` : '-'}
                    </div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">GAA</div>
                    <div className="text-xl font-bold text-primary">
                      {player.goals_against_average ? player.goals_against_average.toFixed(2) : '-'}
                    </div>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-lg p-3 col-span-3">
                    <div className="text-xs text-muted-foreground mb-1">Saves</div>
                    <div className="text-lg sm:text-xl font-bold tracking-tight">
                      {player.saves !== undefined ? (
                        player.shots_against 
                          ? `${player.saves} / ${player.shots_against}`
                          : player.saves
                      ) : '-'}
                    </div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 col-span-3">
                    <div className="text-xs text-muted-foreground mb-1">Time</div>
                    <div className="text-lg sm:text-xl font-bold truncate px-0 tracking-tight">
                      {player.play_time || '-'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Field Player Stats */}
                  <div className="bg-secondary/50 rounded-lg p-3 col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">G</div>
                    <div className="text-xl font-bold text-success">{player.goals}</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">A</div>
                    <div className="text-xl font-bold text-primary">{player.assists}</div>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-lg p-3 col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">PTS</div>
                    <div className="text-xl font-bold">{player.points}</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">
                      +/-
                    </div>
                    <div className={`font-bold text-xl ${player.plus_minus > 0 ? 'text-success' : player.plus_minus < 0 ? 'text-destructive' : ''}`}>
                      {player.plus_minus > 0 ? '+' : ''}{player.plus_minus}
                    </div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">PIM</div>
                    <div className="text-xl font-bold">{player.pim}</div>
                  </div>
                </>
              )}
            </div>

            {/* Goal Rank */}
            {goalRank && goalRank <= 20 && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {t('playerDetail.leagueRank', { rank: goalRank })}
                </span>
              </div>
            )}
            {/* Glossary */}
            <Separator className="my-4" />
            <div className="text-xs text-muted-foreground">
              <h3 className="font-semibold mb-2 flex items-center gap-1">
                ℹ️ {t('gameDetail.glossary.title', 'Stats Glossary')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                {(player.position === 'G' || player.position === 'GK' || player.position === '골리') ? (
                  <>
                    <div><span className="font-bold">GP:</span> {t('gameDetail.glossary.gp')}</div>
                    <div><span className="font-bold">SV%:</span> {t('gameDetail.glossary.sv_pct')}</div>
                    <div><span className="font-bold">GAA:</span> {t('gameDetail.glossary.gaa')}</div>
                    <div><span className="font-bold">Saves:</span> {t('gameDetail.glossary.saves')}</div>
                    <div><span className="font-bold">Time:</span> {t('gameDetail.glossary.time')}</div>
                  </>
                ) : (
                  <>
                    <div><span className="font-bold">GP:</span> {t('gameDetail.glossary.gp')}</div>
                    <div><span className="font-bold">G:</span> {t('gameDetail.glossary.g')}</div>
                    <div><span className="font-bold">A:</span> {t('gameDetail.glossary.a')}</div>
                    <div><span className="font-bold">PTS:</span> {t('gameDetail.glossary.pts')}</div>
                    <div><span className="font-bold">+/-:</span> {t('gameDetail.glossary.plus_minus')}</div>
                    <div><span className="font-bold">PIM:</span> {t('gameDetail.glossary.pim')}</div>
                  </>
                )}
              </div>
            </div>
          </Card>



          {/* Draft Info */}
          {player.draft_info && (
            <Card className="p-4">
              <h2 className="text-lg font-bold mb-3">
                🏒 {t('playerDetail.draftInfo')}
              </h2>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{player.draft_info.year}</span>
                {' '}
                {t('playerDetail.yearSuffix')} 
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
                📜 {t('playerDetail.about')}
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
                📋 {t('playerDetail.career')}
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

          {/* Digital Card CTA / View My Card */}
          <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            {myCard ? (
               // 이미 카드가 있는 경우: 보기 버튼
               <>
                  <h3 className="text-lg font-bold mb-2">
                    {t('playerDetail.myCardTitle')}
                  </h3>
                  <div className="flex gap-3 justify-center mt-4">
                     <Button 
                        variant="outline" 
                        className="flex-1 bg-background/50 border-primary/20 hover:bg-background/80"
                        onClick={handleIssueCardClick}
                     >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {t('playerDetail.issueNew')}
                     </Button>
                     <Button 
                        className="flex-1"
                        onClick={() => setShowCardDetail(true)}
                     >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {t('playerDetail.viewMyCard')}
                     </Button>
                  </div>
               </>
            ) : (
               // 카드가 없는 경우: 발급 버튼
               <>
                  <h3 className="text-lg font-bold mb-2">
                     {t('playerDetail.noCardTitle')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                     {t('playerDetail.noCardDesc')}
                  </p>
                  <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg shadow-lg shadow-primary/20 animate-pulse hover:animate-none transition-all" onClick={handleIssueCardClick}>
                     <CreditCard className="w-5 h-5 mr-2" />
                     {t('playerDetail.issueCard')}
                  </Button>
               </>
            )}
          </Card>

          <Separator />

          {/* Comments */}
          <CommentSection entityType="player" entityId={player.id} />
        </div>
      </div>

      {/* Card Generation Overlay */}
      {player && (
         <CardGenerationOverlay 
            isOpen={showGenerationOverlay} 
            onClose={() => setShowGenerationOverlay(false)} 
            player={player}
            team={team || null}
            onSuccess={handleCardGenerated}
            onViewCard={() => {
               setShowGenerationOverlay(false);
               setShowCardDetail(true);
            }}
         />
      )}

      {/* View My Card Modal */}
      {player && myCard && (
        <CardDetailModal
          isOpen={showCardDetail}
          onClose={() => setShowCardDetail(false)}
          card={myCard}
          player={player}
          team={team || null}
        />
      )}

      {/* Login Dialog */}
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
        triggerLocation="player-card"
      />
    </>
  );
};

export default PlayerDetail;
