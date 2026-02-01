import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { Loader2, ChevronLeft, Download, Share2, Coffee, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Player, Team } from "@/types/team";
import { useTranslation } from "react-i18next";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { useAuth } from "@/context/AuthContext";
import LoginDialog from "@/components/auth/LoginDialog";
import { useState, useEffect } from "react";
import { format } from "date-fns";

const PlayerCard = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const { user } = useAuth();

  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cardGenerated, setCardGenerated] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);

  // 선수 정보 조회
  const { data: player, isLoading: isLoadingPlayer } = useQuery({
    queryKey: ['player-detail', playerId],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) throw error;
      return data as Player;
    },
    enabled: !!playerId,
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

  // 기존 카드 확인
  const { data: existingCard, refetch: refetchCard } = useQuery({
    queryKey: ['player-card', playerId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await externalSupabase
        .from('player_cards')
        .select('*')
        .eq('player_id', playerId)
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user && !!playerId,
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

  // 카드 발급 시작
  const handleGenerateCard = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    // 로딩 시뮬레이션 (나중에 실제 Edge Function 연동)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 500);

    setTimeout(async () => {
      clearInterval(interval);
      setProgress(100);
      
      // TODO: Edge Function 호출로 실제 카드 생성
      // 임시로 DB에 카드 기록 저장
      try {
        const { error } = await externalSupabase
          .from('player_cards')
          .insert({
            user_id: user.id,
            player_id: Number(playerId),
            serial_number: Math.floor(Math.random() * 10000) + 1,
          });

        if (!error) {
          refetchCard();
        }
      } catch (e) {
        console.error(e);
      }

      setIsGenerating(false);
      setCardGenerated(true);
      setShowDonationModal(true);
    }, 3000);
  };

  // 후원 링크
  const getDonationLink = () => {
    if (currentLang === 'ko') {
      return 'https://qr.kakaopay.com/Ej8JN15fH'; // 카카오페이 (예시)
    }
    return 'https://buymeacoffee.com/alhockey'; // Buy Me a Coffee
  };

  const getDonationText = () => {
    if (currentLang === 'ko') {
      return '카카오페이로 후원하기';
    } else if (currentLang === 'ja') {
      return 'コーヒーをおごる';
    }
    return 'Buy me a coffee';
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
        <p className="text-muted-foreground">Player not found</p>
        <Link to="/">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-[calc(1rem+env(safe-area-inset-top))] px-4 pb-24">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link to={`/player/${playerId}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="w-4 h-4" />
            {getLocalizedPlayerName()}
          </Button>
        </Link>
      </div>

      {/* Card Preview */}
      <Card className="mx-auto max-w-sm overflow-hidden">
        {/* Card Design */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            {team && <img src={team.logo} alt="" className="w-10 h-10" />}
            <span className="text-xs font-medium opacity-70">ASIA LEAGUE 25-26</span>
          </div>

          {/* Photo */}
          <div className="aspect-[3/4] bg-gray-700 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
            {player.photo_url ? (
              <img 
                src={player.photo_url} 
                alt={getLocalizedPlayerName()} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-6xl font-bold opacity-30">#{player.jersey_number}</div>
            )}
          </div>

          {/* Info */}
          <div className="text-center mb-4">
            <div className="text-2xl font-bold mb-1">
              #{player.jersey_number} {getLocalizedPlayerName()}
            </div>
            <div className="text-sm opacity-70">
              {player.position === 'F' ? 'Forward' : player.position === 'D' ? 'Defense' : 'Goalie'}
              {team && ` | ${getLocalizedTeamName(team, currentLang)}`}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-1 text-center text-xs mb-4">
            <div className="bg-white/10 rounded py-2">
              <div className="opacity-70">GP</div>
              <div className="font-bold text-lg">{player.games_played}</div>
            </div>
            <div className="bg-white/10 rounded py-2">
              <div className="opacity-70">G</div>
              <div className="font-bold text-lg text-green-400">{player.goals}</div>
            </div>
            <div className="bg-white/10 rounded py-2">
              <div className="opacity-70">A</div>
              <div className="font-bold text-lg text-blue-400">{player.assists}</div>
            </div>
            <div className="bg-white/10 rounded py-2">
              <div className="opacity-70">PTS</div>
              <div className="font-bold text-lg">{player.points}</div>
            </div>
            <div className="bg-white/10 rounded py-2">
              <div className="opacity-70">+/-</div>
              <div className={`font-bold text-lg ${player.plus_minus > 0 ? 'text-green-400' : player.plus_minus < 0 ? 'text-red-400' : ''}`}>
                {player.plus_minus > 0 ? '+' : ''}{player.plus_minus}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between text-xs opacity-50">
            <span>Serial: #{existingCard?.serial_number || '????'} / 10000</span>
            <span>{currentLang === 'ko' ? '발행일' : 'Issued'}: {existingCard ? format(new Date(existingCard.created_at), 'yyyy-MM-dd') : '—'}</span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="mt-6 max-w-sm mx-auto space-y-3">
        {!cardGenerated && !existingCard ? (
          <Button 
            size="lg" 
            className="w-full" 
            onClick={handleGenerateCard}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {currentLang === 'ko' ? '카드 생성 중...' : 'Generating...'}
              </>
            ) : (
              <>🎴 {currentLang === 'ko' ? '카드 발급하기' : 'Generate Card'}</>
            )}
          </Button>
        ) : (
          <>
            <Button size="lg" variant="outline" className="w-full gap-2">
              <Download className="w-4 h-4" />
              {currentLang === 'ko' ? '이미지 저장' : 'Download Image'}
            </Button>
            <Button size="lg" variant="outline" className="w-full gap-2">
              <Share2 className="w-4 h-4" />
              {currentLang === 'ko' ? '공유하기' : 'Share'}
            </Button>
          </>
        )}

        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              {progress < 30 ? (currentLang === 'ko' ? '카드 디자인 준비 중...' : 'Preparing design...') :
               progress < 60 ? (currentLang === 'ko' ? '선수 정보 로딩...' : 'Loading player info...') :
               progress < 90 ? (currentLang === 'ko' ? '카드 생성 중...' : 'Generating card...') :
               (currentLang === 'ko' ? '완료!' : 'Done!')}
            </p>
          </div>
        )}
      </div>

      {/* Donation Modal */}
      <Dialog open={showDonationModal} onOpenChange={setShowDonationModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <Coffee className="w-5 h-5" />
              {currentLang === 'ko' ? '커피 한 잔 후원하기' : 'Buy Me a Coffee'}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {currentLang === 'ko' 
                ? '카드 발급이 완료되었습니다! 🎉\n개발자에게 커피 한 잔 사주시겠어요?' 
                : 'Your card is ready! 🎉\nWould you like to support the developer?'}
            </p>
            <a href={getDonationLink()} target="_blank" rel="noopener noreferrer">
              <Button className="w-full gap-2 mb-3" size="lg">
                <Heart className="w-4 h-4" />
                {getDonationText()}
              </Button>
            </a>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => setShowDonationModal(false)}
            >
              {currentLang === 'ko' ? '다음에 하기' : 'Maybe later'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Dialog */}
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
      />
    </div>
  );
};

export default PlayerCard;
