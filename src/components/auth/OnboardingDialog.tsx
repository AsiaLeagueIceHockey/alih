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
  const { requestPermission } = useNotifications();

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

  // Step 1 -> 2
  const handleNextStep1 = async () => {
    await updateProfile({ preferred_language: selectedLang });
    // Generate random nickname if still empty
    if (!nickname) {
       const randomNum = Math.floor(Math.random() * 90000) + 10000;
       const newNick = `HockeyFan_${randomNum}`;
       setNickname(newNick);
       checkNickname(newNick);
    } else if (nicknameStatus === 'idle') {
      checkNickname(nickname);
    }
    setStep(2);
  };

  const handleTeamToggle = (teamId: number) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId) 
        : [...prev, teamId]
    );
  };

  // Step 2 -> 3
  const handleNextStep2 = async () => {
    if (nicknameStatus === 'available' || (profile?.nickname === nickname)) {
      // Save Step 1 & 2 data together (Team + Nickname)
      await updateProfile({ 
        favorite_team_ids: selectedTeamIds,
        nickname: nickname
      });
      setStep(3);
    }
  };

  const handleComplete = async () => {
    // Request Notification Permission
    await requestPermission();
    setOpen(false);
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
          {/* STEP 1: Language & Team */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Language Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {t('onboarding.selectLanguage')}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {languages.map((lang) => (
                    <div
                      key={lang.code}
                      role="button"
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedLang === lang.code 
                          ? 'border-primary bg-primary/10 ring-1 ring-primary/20' 
                          : 'border-border hover:bg-secondary/50'
                      }`}
                      onClick={() => handleLangSelect(lang.code)}
                    >
                      <span className="text-2xl mb-1">{lang.flag}</span>
                      <span className="text-xs font-medium">{lang.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {t('onboarding.selectTeam')}
                </h3>
                <div className="grid grid-cols-3 gap-2">
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

              <Button onClick={handleNextStep1} className="w-full mt-2">
                {t('onboarding.next')} <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: Nickname */}
          {step === 2 && (
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

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  {i18n.language === 'ko' ? '이전' : t('button.back')}
                </Button>
                <Button 
                  onClick={handleNextStep2} 
                  disabled={nicknameStatus !== 'available' && nicknameStatus !== 'idle'} // Allow idle if it was preflilled and not changed (handled in effect)
                  className="flex-1"
                >
                  {t('onboarding.next')} <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Notification */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Bell className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-lg text-primary">
                  {t('onboarding.step3Desc')}
                </p>
                <p className="text-sm text-center text-muted-foreground px-4">
                   {selectedTeamIds.length > 0 && (
                     <span className="font-medium text-foreground">
                       {selectedTeamIds
                         .map(id => {
                           const team = teams?.find(t => t.id === id);
                           return team ? getLocalizedTeamName(team, i18n.language) : '';
                         })
                         .filter(Boolean)
                         .join(", ")}
                     </span>
                   )}
                   {i18n.language === 'ko' 
                     ? ' 경기가 시작되거나 득점하면 알림을 보내드립니다.' 
                     : i18n.language === 'ja'
                     ? ' の試合開始や得点情報の通知を受け取ります。'
                     : ' matches and goal alerts.'}
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                 {i18n.language === 'ko' ? '이전' : t('button.back')}
                </Button>
                <Button onClick={handleComplete} className="flex-[2] h-12 text-base shadow-lg hover:shadow-xl transition-all">
                  {t('onboarding.step3Button')}
                </Button>
              </div>
            </div>
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
