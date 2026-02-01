import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { Loader2, ChevronLeft, Download, Share2, Coffee, Heart, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Player, Team } from "@/types/team";
import { useTranslation } from "react-i18next";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { useAuth } from "@/context/AuthContext";
import LoginDialog from "@/components/auth/LoginDialog";
import { useState, useRef } from "react";
import { format } from "date-fns";

const PlayerCard = () => {
  const { playerSlug } = useParams<{ playerSlug: string }>();
  // navigate unused but kept for compatibility
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const { user } = useAuth();
  
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cardGenerated, setCardGenerated] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);

  // Detect if the param is a numeric ID (legacy support) or a slug
  const isNumericId = playerSlug && /^\d+$/.test(playerSlug);

  // 선수 정보 조회
  const { data: player, isLoading: isLoadingPlayer } = useQuery({
    queryKey: ['player-detail', playerSlug],
    queryFn: async () => {
      let query = externalSupabase
        .from('alih_players')
        .select('*');
      
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
    staleTime: 0, // 캐시 제거 (이미지 즉시 반영)
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
    queryKey: ['player-card', player?.id, user?.id],
    queryFn: async () => {
      if (!user || !player) return null;
      const { data } = await externalSupabase
        .from('player_cards')
        .select('*')
        .eq('player_id', player.id)
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user && !!player?.id,
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

    // 로딩 시뮬레이션
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
      
      try {
        const { error } = await externalSupabase
          .from('player_cards')
          .insert({
            user_id: user.id,
            player_id: player!.id,
            serial_number: Math.floor(Math.random() * 10000) + 1,
            // TODO: 커스텀 사진 URL 저장 기능은 추후 구현 (현재는 로컬 프리뷰만)
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

  // 이미지 저장 핸들러
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // 고해상도
        backgroundColor: null, // 투명 배경 지원
        logging: false,
        useCORS: true, // 이미지 CORS 이슈 방지
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `player-card-${player?.jersey_number}-${getLocalizedPlayerName()}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to generate image:", err);
      alert(currentLang === 'ko' ? "이미지 저장에 실패했습니다." : "Failed to save image.");
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 초기화
  const handleResetImage = () => {
    setCustomPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 후원 링크
  const getDonationLink = () => {
    if (currentLang === 'ko') {
      return 'https://qr.kakaopay.com/Ej8JN15fH'; 
    }
    return 'https://buymeacoffee.com/alhockey'; 
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
        <Link to={`/player/${player?.slug || playerSlug}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="w-4 h-4" />
            {getLocalizedPlayerName()}
          </Button>
        </Link>
      </div>

      {/* Card Preview */}
      <Card className="mx-auto max-w-sm overflow-hidden" ref={cardRef} id="player-card-preview">
        {/* Card Design */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 relative">
          {/* Watermark - Adjusted position */}
          <div className="absolute bottom-12 right-4 text-[10px] text-white/10 font-mono z-0 pointer-events-none transform -rotate-12">
            @alhockey_fans
          </div>

          {/* Header - Added Team Name */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="flex items-center gap-2">
              {team && <img src={team.logo} alt="" className="w-8 h-8 object-contain" />}
              {team && <span className="font-bold text-sm tracking-wider">{getLocalizedTeamName(team, currentLang).toUpperCase()}</span>}
            </div>
            <span className="text-[10px] font-medium opacity-50 border border-white/20 px-2 py-0.5 rounded-full">
              ASIA LEAGUE 25-26
            </span>
          </div>

          {/* Photo Area with Upload Trigger */}
          <div className="group relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
             {/* Upload Overlay */}
             {!cardGenerated && (
               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-20 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}>
                 <Upload className="w-8 h-8 text-white mb-2" />
                 <span className="text-xs text-white font-medium">
                   {currentLang === 'ko' ? '사진 변경하기' : 'Change Photo'}
                 </span>
               </div>
             )}
             
             {/* Custom Photo Reset Button */}
             {!cardGenerated && customPhoto && (
               <button 
                 onClick={(e) => { e.stopPropagation(); handleResetImage(); }}
                 className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-full z-30 transition-colors"
               >
                 <X className="w-4 h-4" />
               </button>
             )}

            {customPhoto || player.photo_url ? (
              <img 
                src={customPhoto || player.photo_url} 
                alt={getLocalizedPlayerName()} 
                className="w-full h-full object-cover"
                crossOrigin="anonymous" 
              />
            ) : (
              <div className="text-6xl font-bold opacity-30">#{player.jersey_number}</div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
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
          <div className="grid grid-cols-3 gap-1 text-center text-xs mb-4">
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
              <div className="opacity-70">
                {player.position === 'G' ? 'SVS/SA' : '+/-'}
              </div>
              <div className={`font-bold ${player.position === 'G' ? 'text-sm flex items-center justify-center h-7' : 'text-lg'} ${player.position !== 'G' && player.plus_minus > 0 ? 'text-green-400' : player.position !== 'G' && player.plus_minus < 0 ? 'text-red-400' : ''}`}>
                {player.position !== 'G' && player.plus_minus > 0 ? '+' : ''}{player.plus_minus}
              </div>
            </div>
            <div className="bg-white/10 rounded py-2">
              <div className="opacity-70">PIM</div>
              <div className="font-bold text-lg">{player.pim}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-1 opacity-50 relative z-10">
            <div className="flex justify-between text-xs">
              <span>Serial: #{existingCard?.serial_number || '????'} / 10000</span>
              <span>{currentLang === 'ko' ? '발행일' : 'Issued'}: {existingCard ? format(new Date(existingCard.created_at), 'yyyy-MM-dd') : '—'}</span>
            </div>
            {cardGenerated && user && (
               <div className="text-[10px] text-right">
                 Issuer: {user.user_metadata?.nickname || user.email?.split('@')[0] || 'Fan'}
               </div>
            )}
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
            <Button size="lg" variant="outline" className="w-full gap-2" onClick={handleDownloadImage}>
              <Download className="w-4 h-4" />
              {currentLang === 'ko' ? '이미지 저장' : 'Download Image'}
            </Button>
            {/* Share button would go here */}
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
