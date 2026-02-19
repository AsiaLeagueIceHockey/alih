import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import PlayerCard from "@/components/player/PlayerCard";
import { Player, Team, PlayerCard as PlayerCardType } from "@/types/team";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";

interface CardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: PlayerCardType;
  player: Player;
  team: Team | null;
}

import InstagramShareButton from "./InstagramShareButton";

const CardDetailModal = ({ isOpen, onClose, card, player, team }: CardDetailModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Unique ID for this card instance to capture
  const cardId = `share-card-${card.id}`;

  if (!isOpen) return null;

  // Use a portal or fixed overlay at root level? 
  // For simplicity, we'll just use fixed inset-0 here.
  // Assuming this is rendered inside PlayerDetail or somewhere that allows fixed positioning relative to viewport.

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background flex flex-col"
      >
        {/* Header - Safe Area Fixed */}
        <div className="flex items-center justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] border-b bg-background/80 backdrop-blur-md z-50">
           <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
           >
              <ChevronLeft className="w-6 h-6" />
           </Button>
           <span className="font-bold text-lg">{t('playerDetail.myCardTitle', 'My Player Card')}</span>
           <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Card Container */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24 overflow-y-auto w-full">
            <PlayerCard 
               id={cardId}
               player={player} 
               team={team} 
               cardData={card} 
               showRotateHint={true}
               ownerName={user?.user_metadata?.nickname || ( user?.email ? user.email.split('@')[0] : undefined )}
               className="w-full max-w-sm aspect-[2/3] shadow-2xl mb-12"
            />
            
            {/* Share Button */}
            <div className="w-full max-w-sm px-4">
               <InstagramShareButton cardElementId={cardId} className="w-full h-12 text-lg font-bold shadow-lg" />
            </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CardDetailModal;
