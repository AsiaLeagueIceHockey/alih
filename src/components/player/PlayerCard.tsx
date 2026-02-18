import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Player, Team, PlayerCard as PlayerCardType } from '@/types/team';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  team: Team | null;
  cardData?: PlayerCardType;
  className?: string;
  isFlipped?: boolean; // Controlled state if needed
  onFlip?: () => void;
  showRotateHint?: boolean;
  ownerName?: string;
  id?: string; // ID for DOM selection (e.g. for screenshot/GIF generation)
}

const PlayerCard = ({ player, team, cardData, className, isFlipped: controlledFlipped, onFlip, showRotateHint = true, ownerName, id }: PlayerCardProps) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [internalFlipped, setInternalFlipped] = useState(false);

  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
  
  const handleFlip = () => {
    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped(!internalFlipped);
    }
  };

  const getLocalizedName = () => {
    switch (currentLang) {
      case 'ko': return player.name_ko || player.name;
      case 'ja': return player.name_ja || player.name;
      case 'en': return player.name_en || player.name;
      default: return player.name;
    }
  };

  const getLocalizedTeamName = () => {
    if (!team) return '';
    const localized = (team.team_info as any)?.[`name_${currentLang}`] || team.name;
    return localized;
  };

  // Back of the jersey style number
  const JerseyNumber = () => (
    <div className="flex flex-col items-center justify-center h-full text-primary-foreground select-none pointer-events-none">
       <span className="text-xl font-bold uppercase tracking-widest opacity-80 mb-2">
          {player.name_en?.split(' ').pop() || player.name}
       </span>
       <span className="text-9xl font-black tracking-tighter" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
          {player.jersey_number}
       </span>
    </div>
  );

  return (
    <div 
      id={id}
      className={`relative perspective-1000 group cursor-pointer ${className}`}
      onClick={handleFlip}
    >
      <div className={cn(
        "w-full h-full relative preserve-3d transition-transform duration-500 transform-style-3d shadow-2xl rounded-xl",
        isFlipped ? "rotate-y-180" : ""
      )}>
        {/* === FRONT === */}
        <Card 
            className="absolute inset-0 w-full h-full backface-hidden overflow-hidden border-0 bg-background flex flex-col items-stretch"
            style={{ 
              WebkitBackfaceVisibility: 'hidden', 
              backfaceVisibility: 'hidden',
              zIndex: isFlipped ? 0 : 1 
            }}
        >
           {/* Background Image / Texture */}
           <div className="absolute inset-0 z-0">
             {player.photo_url ? (
               <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                   <span className="text-4xl text-muted-foreground font-bold">#{player.jersey_number}</span>
                </div>
             )}
             {/* Gradient Overlay for Text Readability */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
           </div>

           {/* Content Overlay */}
           <div className="relative z-10 flex flex-col justify-end h-full p-6 text-white">
              {/* Header: Team Logo & Name (Top Left) */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                 {team && <img src={team.logo} alt="Team Logo" className="w-8 h-8 object-contain drop-shadow-md" />}
                 {/* <span className="font-bold text-sm drop-shadow-md">{getLocalizedTeamName()}</span> */}
              </div>

              {/* Player Info */}
              <div className="mb-4">
                 <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs border-white/40 text-white/90 bg-black/30 backdrop-blur-sm">
                       {player.position}
                    </Badge>
                    <span className="text-2xl font-bold drop-shadow-md">#{player.jersey_number}</span>
                 </div>
                 <h2 className="text-3xl font-black uppercase leading-tight drop-shadow-lg tracking-tight">
                    {getLocalizedName()}
                 </h2>
              </div>

              {/* Season Stats (Mini) */}
              <div className="grid grid-cols-4 gap-2 bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/10">
                 <div className="text-center">
                    <div className="text-[10px] text-white/60 uppercase">GP</div>
                    <div className="font-bold text-lg">{player.games_played}</div>
                 </div>
                 {(player.position === 'G' || player.position === 'GK') ? (
                    <>
                       <div className="text-center col-span-2">
                          <div className="text-[10px] text-white/60 uppercase">SV%</div>
                          <div className="font-bold text-lg text-success">
                             {player.save_pct ? Number(player.save_pct).toFixed(3) : '-'}
                          </div>
                       </div>
                       <div className="text-center">
                          <div className="text-[10px] text-white/60 uppercase">GAA</div>
                          <div className="font-bold text-lg">{player.goals_against_average?.toFixed(2) || '-'}</div>
                       </div>
                    </>
                 ) : (
                    <>
                       <div className="text-center">
                          <div className="text-[10px] text-white/60 uppercase">G</div>
                          <div className="font-bold text-lg text-success">{player.goals}</div>
                       </div>
                       <div className="text-center">
                          <div className="text-[10px] text-white/60 uppercase">A</div>
                          <div className="font-bold text-lg">{player.assists}</div>
                       </div>
                       <div className="text-center">
                          <div className="text-[10px] text-white/60 uppercase">PTS</div>
                          <div className="font-bold text-lg">{player.points}</div>
                       </div>
                    </>
                 )}
              </div>
           </div>
           
           {showRotateHint && (
             <div className="absolute top-4 right-4 animate-pulse bg-black/30 p-1.5 rounded-full backdrop-blur-sm">
               <RotateCcw className="w-5 h-5 text-white/80" />
             </div>
           )}
        </Card>

        {/* === BACK === */}
        <Card 
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 overflow-hidden border-0 flex flex-col justify-between p-6 text-white"
          style={{ 
            backgroundColor: team?.team_color || '#1e293b', // Default to slate-800 if no color
            color: team?.team_color === '#C0C0C0' ? 'black' : 'white', // Silver gets black text
            WebkitBackfaceVisibility: 'hidden', 
            backfaceVisibility: 'hidden',
            zIndex: isFlipped ? 1 : 0
          }}
        >
           {/* Team Background Pattern/Texture could go here */}
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />

           {/* Content */}
           <div className="relative z-10 h-full flex flex-col">
              {/* Top: Serial Number & Date */}
              <div className="flex justify-between items-start text-xs font-mono opacity-70">
                 <div className="flex flex-col">
                    <span>ISSUED DATE</span>
                    <span>{cardData ? format(new Date(cardData.created_at), 'yyyy-MM-dd') : 'PREVIEW'}</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span>SERIAL NO.</span>
                    <span className="text-lg font-bold">
                       {cardData ? `#${cardData.serial_number.toString().padStart(4, '0')}` : 'SAMPLE'}
                    </span>
                 </div>
              </div>

              {/* Center: Jersey Look */}
              <div className="flex-1 flex items-center justify-center">
                 <div className="flex flex-col items-center justify-center h-full select-none pointer-events-none">
                    <span className="text-xl font-bold uppercase tracking-widest opacity-80 mb-2">
                       {player.name_en?.split(' ')[0] || player.name}
                    </span>
                    <span className="text-9xl font-black tracking-tighter" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
                       {player.jersey_number}
                    </span>
                 </div>
              </div>

              {/* Bottom: Footer & Watermark */}
              <div className="mt-auto pt-4 border-t border-white/20 flex justify-between items-end">
                 <div className="text-xs">
                    <div className="opacity-60 mb-0.5">OWNER</div>
                    <div className="font-bold truncate max-w-[120px]">
                       {ownerName || (cardData ? 'Collector' : 'You?')}
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="text-[10px] font-bold opacity-50 mb-1">OFFICIAL DIGITAL CARD</div>
                    <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight opacity-90">
                       <span className="bg-white text-black text-[10px] px-1 rounded uppercase">
                          {team?.team_code || 'ALIH'}
                       </span>
                       <span style={{ color: team?.team_color === '#C0C0C0' ? 'black' : 'white' }}>@alhockey_fans</span>
                    </div>
                 </div>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
};

export default PlayerCard;
