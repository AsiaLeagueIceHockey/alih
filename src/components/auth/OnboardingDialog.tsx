import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTeams } from "@/hooks/useTeams";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { Check, Bell, ChevronRight, Loader2, X, Globe, Users } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { externalSupabase } from "@/lib/supabase-external";
import { debounce } from "lodash";

const languages = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
] as const;

const OnboardingDialog = () => {
  const { user, profile, updateProfile, isOnboardingCompleted } = useAuth();
  const { t, i18n } = useTranslation();
  const { data: teams } = useTeams();
  // Notification hook is no longer used in onboarding directly
  // const { requestPermission } = useNotifications(); 

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedLang, setSelectedLang] = useState<string>(i18n.language);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  
  // Nickname states
  const [nickname, setNickname] = useState("");
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  useEffect(() => {
    // Force open if logged in but onboarding incomplete
    if (user && !isOnboardingCompleted && profile) {
      setOpen(true);
      if (profile.favorite_team_ids) {
        setSelectedTeamIds(profile.favorite_team_ids);
      }
      // Initialize nickname if empty
      if (!nickname && profile.nickname) {
        setNickname(profile.nickname);
      } else if (!nickname) {
        // Generate random default nickname
        const randomNum = Math.floor(Math.random() * 90000) + 10000;
        setNickname(`HockeyFan_${randomNum}`);
      }
      // Ensure language is set
      if (profile.preferred_language) {
          setSelectedLang(profile.preferred_language);
          if (i18n.language !== profile.preferred_language) {
              i18n.changeLanguage(profile.preferred_language);
          }
      }
    } else {
      setOpen(false);
    }
  }, [user, isOnboardingCompleted, profile]);

  // Debounced nickname check
  const checkNickname = useCallback(
    debounce(async (name: string) => {
      if (!name || name.length < 2) {
        setNicknameStatus('invalid');
        return;
      }
      
      // If same as current profile nickname, it's available
      if (profile?.nickname === name) {
        setNicknameStatus('available');
        return;
      }

      setNicknameStatus('checking');
      try {
        const { data, error } = await externalSupabase
          .from('profiles')
          .select('id')
          .eq('nickname', name)
          .single();

        if (data) {
          setNicknameStatus('taken');
        } else {
          setNicknameStatus('available');
        }
      } catch (error) {
        // If error is "Row not found" (PGRST116), it means nickname is available
        setNicknameStatus('available');
      }
    }, 500),
    [profile]
  );

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    if (value.length > 0) {
      checkNickname(value);
    } else {
      setNicknameStatus('idle');
    }
  };

  const handleLangSelect = (code: string) => {
    setSelectedLang(code);
    i18n.changeLanguage(code); 
  };

  const handleTeamToggle = (teamId: number) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId) 
        : [...prev, teamId]
    );
  };

  // Navigation Handlers
  const handleNext = async () => {
    if (step === 1) {
        // Save Language
        await updateProfile({ preferred_language: selectedLang });
        setStep(2);
    } else if (step === 2) {
        // Save Team
         await updateProfile({ favorite_team_ids: selectedTeamIds });
         
         // Prepare Step 3 (Nickname)
         if (!nickname) {
            const randomNum = Math.floor(Math.random() * 90000) + 10000;
            const newNick = `HockeyFan_${randomNum}`;
            setNickname(newNick);
            checkNickname(newNick);
         } else if (nicknameStatus === 'idle') {
            checkNickname(nickname);
         }
         
         setStep(3);
    }
  };

  const handleComplete = async () => {
    if (step === 3 && (nicknameStatus === 'available' || profile?.nickname === nickname)) {
        // Save Nickname
        await updateProfile({ nickname: nickname });
        setOpen(false);
        // Page reload or state update handled by AuthContext/App
        window.location.reload(); // Force reload to ensure all states (like InstallPrompt) pick up the completion
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden focus:outline-none" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {step === 1 && t('onboarding.step1Title')}
            {step === 2 && t('onboarding.step2Title')}
            {step === 3 && t('onboarding.step3Title')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 1 && t('onboarding.step1Desc')}
            {step === 2 && t('onboarding.step2Desc')}
            {step === 3 && t('onboarding.step3Desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {/* STEP 1: Language */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {t('onboarding.selectLanguage')}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangSelect(lang.code)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        selectedLang === lang.code
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                          <span className="text-2xl">{lang.flag}</span>
                          <span className="font-medium">{lang.label}</span>
                      </div>
                      {selectedLang === lang.code && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Team */}
          {step === 2 && (
             <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {t('onboarding.selectTeam')}
                    </h3>
                    <div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                    {teams?.map((team) => {
                        const isSelected = selectedTeamIds.includes(team.id);
                        return (
                        <div
                            key={team.id}
                            role="button"
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-all aspect-square relative ${
                            isSelected
                                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                : 'border-border hover:bg-secondary/50'
                            }`}
                            onClick={() => handleTeamToggle(team.id)}
                        >
                            <img src={team.logo} alt={team.name} className="w-8 h-8 mb-2 object-contain" />
                            <span className="text-[10px] sm:text-xs font-medium text-center leading-tight break-keep">
                            {getLocalizedTeamName(team, i18n.language)}
                            </span>
                            {isSelected && (
                            <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                                <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                            )}
                        </div>
                        );
                    })}
                    </div>
                </div>
             </div>
          )}

          {/* STEP 3: Nickname */}
          {step === 3 && (
            <div className="space-y-6 pt-2">
               <div className="space-y-2">
                <label className="text-sm font-medium ml-1">
                  {t('onboarding.nicknameLabel')}
                </label>
                <div className="relative">
                  <Input 
                    value={nickname}
                    onChange={handleNicknameChange}
                    placeholder={t('onboarding.nicknamePlaceholder')}
                    className={`pr-10 ${
                      nicknameStatus === 'taken' ? 'border-destructive focus-visible:ring-destructive' : 
                      nicknameStatus === 'available' ? 'border-primary focus-visible:ring-primary' : ''
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {nicknameStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    {nicknameStatus === 'available' && <Check className="w-4 h-4 text-primary" />}
                    {nicknameStatus === 'taken' && <X className="w-4 h-4 text-destructive" />}
                  </div>
                </div>
                
                {/* Status Message */}
                <div className="h-4 pl-1">
                  {nicknameStatus === 'checking' && (
                    <span className="text-xs text-muted-foreground">{t('onboarding.checking')}</span>
                  )}
                  {nicknameStatus === 'available' && (
                    <span className="text-xs text-primary">{t('onboarding.nicknameAvailable')}</span>
                  )}
                  {nicknameStatus === 'taken' && (
                    <span className="text-xs text-destructive">{t('onboarding.nicknameTaken')}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Buttons */}
        <div className="flex gap-2 pt-4 mt-2 border-t">
             {step > 1 && (
                <Button variant="outline" onClick={() => setStep(prev => (prev - 1) as 1 | 2)} className="flex-1">
                  {i18n.language === 'ko' ? '이전' : t('button.back')}
                </Button>
             )}
             
             {step < 3 ? (
                 <Button 
                    onClick={handleNext} 
                    className="flex-1"
                    disabled={
                        (step === 1 && !selectedLang) ||
                        (step === 2 && selectedTeamIds.length === 0)
                    }
                 >
                    {t('onboarding.next')} <ChevronRight className="ml-2 w-4 h-4" />
                 </Button>
             ) : (
                 <Button 
                    onClick={handleComplete} 
                    disabled={nicknameStatus !== 'available' && nicknameStatus !== 'idle'} 
                    className="flex-1"
                 >
                    {t('onboarding.complete')} <Check className="ml-2 w-4 h-4" />
                 </Button>
             )}
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                step >= s ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
