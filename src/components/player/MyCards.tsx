import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CreditCard, ChevronDown, ChevronLeft, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PlayerCard as PlayerCardType, Player, Team } from "@/types/team";
import PlayerCard from "@/components/player/PlayerCard";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import InstagramShareButton from "@/components/player/InstagramShareButton";

interface ExtendedCard extends PlayerCardType {
  player: Player;
  team: Team;
}

const MyCards = () => {
  const { user, profile } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentLang = i18n.language;
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const { data: cards, isLoading } = useQuery({
    queryKey: ['my-cards-list', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await externalSupabase
        .from('player_cards')
        .select(`
          *,
          player:alih_players (
            *,
            team:alih_teams (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[]; 
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
         <PageHeader title={t('nav.myCards', 'My Cards')} />
         <div className="flex flex-col items-center justify-center py-20 gap-4">
            <CreditCard className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t('auth.loginRequired', 'Login required')}</p>
         </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
         <PageHeader title={t('nav.myCards', 'My Cards')} />
         <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
         </div>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
         <PageHeader title={t('nav.myCards', 'My Cards')} />
         <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
               <CreditCard className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">
               {currentLang === 'ko' ? '발급 받은 카드가 없어요.' : 'No cards collected yet.'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-8">
               {currentLang === 'ko' 
                  ? '좋아하는 선수의 프로필에서 팬 카드를 무료로 발급받아보세요!' 
                  : 'Visit player profiles to issue your free fan cards!'}
            </p>
            <Link to="/players">
               <Button size="lg" className="px-8">
                  {t('common.browsePlayers', 'Browse Players')}
               </Button>
            </Link>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title={t('nav.myCards', 'My Cards')} 
        subtitle={t('myCards.collected', { count: cards.length, defaultValue: `${cards.length} cards collected` })} 
      />
      
      <div className="container mx-auto px-4 mt-8 relative min-h-[600px]">
         <div className="relative w-full max-w-[340px] mx-auto pb-32">
            <AnimatePresence>
            {cards.map((card, index) => {
               const isSelected = selectedCardId === card.id;
               
               // Stack calculation
               const offset = index * 60; // Distance between cards
               const zIndex = index;
               
               // Access team from nested player object
               const teamData = card.player?.team;

               return (
                  <motion.div
                     key={card.id}
                     // If selected, become a fixed full-screen overlay. If not, stack absolutely.
                     className={isSelected 
                        ? "fixed inset-0 z-[100] bg-background flex flex-col" 
                        : "absolute top-0 left-0 w-full"
                     }
                     initial={{ y: 50, opacity: 0 }}
                     animate={{ 
                        y: isSelected ? 0 : offset,
                        scale: isSelected ? 1 : 1, 
                        opacity: isSelected ? 1 : (selectedCardId ? 0 : 1), // Hide other cards when one is selected? Or just let them be behind?
                                                                         // Better to hide or push them away. Let's hide them for cleaner focus.
                        zIndex: isSelected ? 100 : zIndex
                     }}
                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
                     style={{ 
                        transformOrigin: "top center",
                     }}
                     onClick={() => {
                        if (!isSelected) {
                           setSelectedCardId(card.id);
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                     }}
                  >
                     {/* Custom Header for Selected State */}
                     {isSelected && (
                         <div className="flex items-center justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] border-b bg-background/80 backdrop-blur-md z-50">
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedCardId(null);
                              }}
                           >
                              <ChevronLeft className="w-6 h-6" />
                           </Button>
                           <span className="font-bold text-lg">{t('playerDetail.myCardTitle', 'My Player Card')}</span>
                           <div className="w-10"></div> {/* Spacer for centering */}
                        </div>
                     )}

                     {/* Card Container */}
                     <div 
                        className={`
                           relative transition-all duration-300
                           ${isSelected 
                              ? 'flex-1 flex flex-col items-center justify-center p-6 pb-24 overflow-y-auto' // Centered in full screen
                              : 'shadow-lg hover:shadow-xl cursor-pointer'
                           }
                        `}
                     >
                        <PlayerCard 
                           id={isSelected ? `share-card-mycards-${card.id}` : undefined}
                           player={card.player} 
                           team={teamData} 
                           cardData={card} 
                           showRotateHint={isSelected} // Only show hint in full view
                           ownerName={profile?.nickname || user?.user_metadata?.full_name || user?.user_metadata?.name || ( user?.email ? user.email.split('@')[0] : undefined )}
                           className={isSelected ? "w-full max-w-sm aspect-[2/3] shadow-2xl" : "w-full aspect-[2/3]"}
                           // Prevent flipping when not selected is clicked (because it triggers selection)
                           onFlip={!isSelected ? () => {} : undefined}
                        />
                        {isSelected && (
                           <div className="w-full max-w-sm px-4 mt-6">
                              <InstagramShareButton 
                                 cardElementId={`share-card-mycards-${card.id}`} 
                                 className="w-full h-12 text-lg font-bold shadow-lg" 
                              />
                           </div>
                        )}
                     </div>
                  </motion.div>
               );
            })}
            </AnimatePresence>
         </div>

         {/* Hint for interaction (only show when nothing selected) */}
         {!selectedCardId && (
            <div className="fixed bottom-24 left-0 right-0 text-center pointer-events-none opacity-50 animate-bounce">
               <ChevronDown className="w-6 h-6 mx-auto mb-1" />
               <span className="text-xs">Scroll or Tap to View</span>
            </div>
         )}
      </div>
    </div>
  );
};

export default MyCards;
