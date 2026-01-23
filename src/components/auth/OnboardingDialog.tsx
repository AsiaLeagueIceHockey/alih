import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTeams } from "@/hooks/useTeams";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { Check, Bell, ChevronRight } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";

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

  useEffect(() => {
    // Force open if logged in but onboarding incomplete
    if (user && !isOnboardingCompleted && profile) {
      setOpen(true);
      if (profile.favorite_team_ids) {
        setSelectedTeamIds(profile.favorite_team_ids);
      }
    } else {
      setOpen(false);
    }
  }, [user, isOnboardingCompleted, profile]);

  const handleLangSelect = (code: string) => {
    setSelectedLang(code);
    i18n.changeLanguage(code); 
  };

  const handleNextStep1 = async () => {
    await updateProfile({ preferred_language: selectedLang });
    setStep(2);
  };

  const handleTeamToggle = (teamId: number) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId) 
        : [...prev, teamId]
    );
  };

  const handleNextStep2 = () => {
    if (selectedTeamIds.length > 0) {
      setStep(3);
    }
  };

  const handleComplete = async () => {
    // 1. Update Profile (This completes onboarding on backend logic)
    if (selectedTeamIds.length > 0) {
       await updateProfile({ favorite_team_ids: selectedTeamIds });
    }
    
    // 2. Request Notification Permission
    await requestPermission();
    
    // 3. Close
    setOpen(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden focus:outline-none" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {step === 1 && t('onboarding.step1Title', 'Start Setup')}
            {step === 2 && t('onboarding.step2Title', 'Favorite Team')}
            {step === 3 && t('onboarding.step3Title', 'Stay Updated')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 1 && t('onboarding.step1Desc', 'Select your preferred language')}
            {step === 2 && t('onboarding.step2Desc', 'Which team do you support?')}
            {step === 3 && t('onboarding.step3Desc', 'Enable notifications for your team')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="grid grid-cols-1 gap-3">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedLang === lang.code 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:bg-secondary/50'
                  }`}
                  onClick={() => handleLangSelect(lang.code)}
                >
                  <span className="text-2xl mr-4">{lang.flag}</span>
                  <span className="flex-1 font-medium">{lang.label}</span>
                  {selectedLang === lang.code && <Check className="w-5 h-5 text-primary" />}
                </div>
              ))}
              <Button onClick={handleNextStep1} className="mt-4 w-full">
                {t('onboarding.next', 'Next')} <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-center text-sm text-muted-foreground -mt-2 mb-2">
                {i18n.language === 'ko' ? "응원하는 팀을 모두 선택해주세요!" : "Select all usage teams!"}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {teams?.map((team) => {
                  const isSelected = selectedTeamIds.includes(team.id);
                  return (
                    <div
                      key={team.id}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-all aspect-square relative ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border hover:bg-secondary/50'
                      }`}
                      onClick={() => handleTeamToggle(team.id)}
                    >
                      <img src={team.logo} alt={team.name} className="w-10 h-10 mb-2 object-contain" />
                      <span className="text-xs font-medium text-center leading-tight break-keep">
                        {getLocalizedTeamName(team, i18n.language)}
                      </span>
                      {isSelected && <Check className="absolute top-1 right-1 w-4 h-4 text-primary" />}
                    </div>
                  );
                })}
              </div>
              <Button onClick={handleNextStep2} disabled={selectedTeamIds.length === 0} className="w-full">
                {t('onboarding.next', 'Next')} <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Bell className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-lg text-primary">
                  {t('onboarding.step3Desc', 'Get Match Alerts')}
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
                   {i18n.language === 'ko' ? ' 경기가 시작되거나 득점하면 알림을 보내드립니다.' : ' matches and goal alerts.'}
                </p>
              </div>
              <Button onClick={handleComplete} className="w-full h-12 text-base shadow-lg hover:shadow-xl transition-all">
                {t('onboarding.step3Button', 'Allow Notifications & Finish')}
              </Button>
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
