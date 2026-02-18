import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, Printer, X, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Player, Team, PlayerCard as PlayerCardType } from '@/types/team';
import PlayerCard from './PlayerCard';
import confetti from 'canvas-confetti';
import { externalSupabase } from '@/lib/supabase-external';

interface CardGenerationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  team: Team | null;
  onSuccess: (card: PlayerCardType) => void;
  onViewCard?: () => void;
}

type Step = 'idle' | 'checking_stats' | 'verifying_identity' | 'printing' | 'completed';

const CardGenerationOverlay = ({ isOpen, onClose, player, team, onSuccess, onViewCard }: CardGenerationOverlayProps) => {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>('idle');
  const [generatedCard, setGeneratedCard] = useState<PlayerCardType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('idle');
      setError(null);
      setGeneratedCard(null);
      startGeneration();
    }
  }, [isOpen]);

  const startGeneration = async () => {
    try {
      // Step 1: Checking Stats
      setStep('checking_stats');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 2: Verifying Identity (Jersey, Team)
      setStep('verifying_identity');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Printing (Call RPC)
      setStep('printing');
      
      const { data, error } = await externalSupabase.rpc('generate_player_card', {
        p_player_id: player.id
      });

      if (error) throw error;


      // Artificial delay for "printing" effect
      await new Promise(resolve => setTimeout(resolve, 2000));

      setGeneratedCard(data as PlayerCardType);
      setStep('completed');
      
      // Confetti effect
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: team?.team_code === 'HL' ? ['#ce0e2d', '#ffffff'] : undefined // Example team color
      });

      if (onSuccess && data) {
         onSuccess(data as PlayerCardType);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate card');
      // setStep('idle'); // Don't reset step, so we can see where it failed or just show error
    }
  };

  const steps = [
    { id: 'checking_stats', label: t('cardGeneration.steps.checking') },
    { id: 'verifying_identity', label: t('cardGeneration.steps.verifying') },
    { id: 'printing', label: t('cardGeneration.steps.printing') },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <div className="w-full max-w-md relative">
          {step !== 'completed' && (
             <Button 
               variant="ghost" 
               size="icon" 
               className="absolute top-0 right-0 text-white/50 hover:text-white z-50"
               onClick={onClose}
             >
               <X className="w-6 h-6" />
             </Button>
          )}

          {step !== 'completed' ? (
            <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2 animate-pulse">
                   {t('cardGeneration.generatingTitle')}
                </h2>
                <p className="text-muted-foreground">
                   {t('cardGeneration.generatingDesc')}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-center">
                  <p className="font-semibold mb-2">{t('cardGeneration.errorTitle')}</p>
                  <p className="text-sm opacity-80 mb-4">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => { setError(null); startGeneration(); }}>
                    {t('cardGeneration.retry')}
                  </Button>
                </div>
              )}

              <div className="space-y-6">
                {steps.map((s, idx) => {
                  const isActive = s.id === step;
                  const stepIndex = steps.findIndex(x => x.id === step);
                  const isPast = stepIndex > -1 && stepIndex > idx;
                  
                  return (
                    <div key={s.id} className={`flex items-center gap-4 transition-all duration-300 ${isActive || isPast ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                        ${isActive ? 'border-primary text-primary' : isPast ? 'border-success bg-success text-white' : 'border-muted text-muted-foreground'}
                      `}>
                        {isActive ? (
                           <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isPast ? (
                           <Check className="w-5 h-5" />
                        ) : (
                           <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                        )}
                      </div>
                      <span className={`font-medium ${isActive ? 'text-primary' : ''}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <motion.div
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="flex flex-col items-center gap-6"
            >
               <div className="text-center text-white mb-2">
                  <h2 className="text-3xl font-bold mb-1">
                     {t('cardGeneration.completedTitle')}
                  </h2>
                  <p className="text-white/80">
                     {t('cardGeneration.completedDesc')}
                  </p>
               </div>

               {/* Result Card */}
               <div className="w-full">
                  <PlayerCard 
                     player={player} 
                     team={team} 
                     cardData={generatedCard!} 
                     showRotateHint={true}
                     ownerName={profile?.nickname || (profile?.email ? profile.email.split('@')[0] : 'Collector')}
                  />
               </div>

               <div className="w-full space-y-3 bg-card/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                  <p className="text-center text-sm text-white/70">
                     {t('cardGeneration.coffeePrompt')}
                  </p>
                  <Button 
                    className="w-full gap-2 bg-[#FFDD00] text-black hover:bg-[#FFDD00]/90 font-bold border-none"
                    onClick={() => {
                        if (i18n.language === 'ko') {
                            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                            if (isMobile) {
                                window.open('https://qr.kakaopay.com/FQqvZxoia9c405515', '_blank');
                            } else {
                                window.open('/images/kakaopay-qr.jpg', '_blank');
                            }
                        } else {
                            window.open('https://buymeacoffee.com/joelonsw', '_blank');
                        }
                    }}
                  >
                     <Coffee className="w-4 h-4" />
                     {t('cardGeneration.buyCoffee')}
                  </Button>
                  <Button 
                     variant="outline" 
                     className="w-full bg-transparent text-white border-white/20 hover:bg-white/10"
                     onClick={onViewCard || onClose}
                  >
                     {t('playerDetail.viewMyCard', 'View My Card')}
                  </Button>
               </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CardGenerationOverlay;
