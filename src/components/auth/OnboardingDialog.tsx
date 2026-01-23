import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTeams } from "@/hooks/useTeams";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { Check, Bell, ChevronRight, Globe, Trophy } from "lucide-react";
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
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  useEffect(() => {
    // 로그인 상태이고, 온보딩이 완료되지 않았으면 모달 오픈
    if (user && !isOnboardingCompleted && profile) {
      setOpen(true);
      if (profile.favorite_team_id) {
        setSelectedTeamId(profile.favorite_team_id);
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

  const handleTeamSelect = (teamId: number) => {
    setSelectedTeamId(teamId);
  };

  const handleNextStep2 = async () => {
    if (selectedTeamId) {
      await updateProfile({ favorite_team_id: selectedTeamId });
      setStep(3);
    }
  };

  const handleComplete = async () => {
    // Request notification permission
    await requestPermission();
    // Finish onboarding
    setOpen(false); // AuthContext will eventually update isOnboardingCompleted state
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={() => {
        // Prevent closing if onboarding is needed? 
        // Or allow close but remind later? 
        // For now, allow close only if user clicks outside if we want, but shadcn Dialog doesn't easily lock.
        // But we forced open based on state. If they close, state is still incomplete.
    }}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {step === 1 && "Start Setup"}
            {step === 2 && "Favorite Team"}
            {step === 3 && "Stay Updated"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 1 && "Select your preferred language"}
            {step === 2 && "Which team do you support?"}
            {step === 3 && "Enable notifications for your team"}
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
                Next <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {teams?.map((team) => (
                  <div
                    key={team.id}
                    className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-colors text-center ${
                      selectedTeamId === team.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-secondary/50'
                    }`}
                    onClick={() => handleTeamSelect(team.id)}
                  >
                    <img src={team.logo} alt={team.name} className="w-12 h-12 mb-2 object-contain" />
                    <span className="text-sm font-medium">{getLocalizedTeamName(team, i18n.language)}</span>
                  </div>
                ))}
              </div>
              <Button onClick={handleNextStep2} disabled={!selectedTeamId} className="w-full">
                Next <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Bell className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-lg">Get Match Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when your favorite team starts a match or scores a goal.
                </p>
              </div>
              <Button onClick={handleComplete} className="w-full">
                Allow Notifications & Finish
              </Button>
            </div>
          )}
        </div>
        
        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full ${
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
