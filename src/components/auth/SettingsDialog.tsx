import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { useTeams } from "@/hooks/useTeams";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { Bell, BellOff, Settings, User as UserIcon, LogOut, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { user, profile, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { permission, requestPermission } = useNotifications();
  const { data: teams } = useTeams();

  const favoriteTeam = teams?.find(t => t.id === profile?.favorite_team_id);
  const [isNotifEnabled, setIsNotifEnabled] = useState(permission === 'granted');

  useEffect(() => {
    setIsNotifEnabled(permission === 'granted');
  }, [permission]);

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      setIsNotifEnabled(true);
      alert(i18n.language === 'ko' ? "알림이 설정되었습니다." : "Notifications enabled.");
    } else if (result === 'denied') {
      alert(i18n.language === 'ko' ? "알림 권한이 차단되어 있습니다. 브라우저 설정에서 허용해주세요." : "Notifications blocked. Please enable in browser settings.");
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('auth.myPage', 'My Page')}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary border border-border">
              {profile?.nickname?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-medium text-lg">{profile?.nickname}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {i18n.language === 'ko' ? "알림 설정" : "Notifications"}
            </h3>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {isNotifEnabled ? (
                  <Bell className="w-5 h-5 text-primary" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
                <div className="flex flex-col">
                  <span className="font-medium">
                    {i18n.language === 'ko' ? "경기 알림" : "Match Alerts"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isNotifEnabled 
                      ? (i18n.language === 'ko' ? "알림을 받고 있습니다." : "Notifications enabled.")
                      : (i18n.language === 'ko' ? "알림이 꺼져 있습니다." : "Notifications disabled.")}
                  </span>
                </div>
              </div>
              {!isNotifEnabled && (
                <Button size="sm" onClick={handleEnableNotifications}>
                  {i18n.language === 'ko' ? "켜기" : "Enable"}
                </Button>
              )}
            </div>
          </div>

          {/* Favorite Team */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {i18n.language === 'ko' ? "응원 팀" : "Favorite Team"}
            </h3>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              {favoriteTeam ? (
                <>
                  <img src={favoriteTeam.logo} alt={favoriteTeam.name} className="w-8 h-8 object-contain" />
                  <span className="font-medium">{getLocalizedTeamName(favoriteTeam, i18n.language)}</span>
                </>
              ) : (
                <span className="text-muted-foreground text-sm">
                  {i18n.language === 'ko' ? "선택된 팀이 없습니다." : "No team selected."}
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              {t('auth.logout', 'Log out')}
            </Button>
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" disabled>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('auth.deleteAccount', 'Delete Account')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
