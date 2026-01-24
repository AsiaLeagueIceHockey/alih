import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { useTeams } from "@/hooks/useTeams";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { Bell, BellOff, Settings, User as UserIcon, LogOut, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { externalSupabase } from "@/lib/supabase-external";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { user, profile, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { permission, requestPermission, refreshPermission } = useNotifications();
  const { data: teams } = useTeams();

  const [isNotifEnabled, setIsNotifEnabled] = useState(permission === 'granted');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter favorite teams based on profile.favorite_team_ids array
  const favoriteTeams = teams?.filter(t => profile?.favorite_team_ids?.includes(t.id));

  useEffect(() => {
    if (open) {
      refreshPermission();
    }
  }, [open, refreshPermission]);

  useEffect(() => {
    // If permission is denied or default, it's definitely off.
    // If granted, we assume on (user has token). In a real app we might check if token exists in DB too.
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

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // MVP: Delete profile row (Soft Delete from user perspective)
      // Note: This requires a DELETE policy on 'profiles' table which we will add.
      const { error } = await externalSupabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) {
        console.error("Delete profile error:", error);
        alert(i18n.language === 'ko' ? "회원 탈퇴 중 오류가 발생했습니다." : "Error deleting account.");
        return;
      }

      await logout();
      onOpenChange(false);
      alert(i18n.language === 'ko' ? "회원 탈퇴가 완료되었습니다." : "Account deleted successfully.");
    } catch (e) {
      console.error(e);
      alert(i18n.language === 'ko' ? "오류가 발생했습니다." : "An error occurred.");
    }
  };

  if (!user) return null;

  return (
    <>
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
                {t('onboarding.step3Title', 'Notification Settings')}
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
              <div className="grid grid-cols-5 gap-2 p-3 border rounded-lg min-h-[60px]">
                {favoriteTeams && favoriteTeams.length > 0 ? (
                  favoriteTeams.map(team => (
                     <div key={team.id} className="flex flex-col items-center justify-center gap-1" title={getLocalizedTeamName(team, i18n.language)}>
                        <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain" />
                     </div>
                  ))
                ) : (
                  <div className="col-span-5 flex items-center justify-center h-full">
                     <span className="text-muted-foreground text-sm">
                        {i18n.language === 'ko' ? "선택된 팀이 없습니다." : "No team selected."}
                     </span>
                  </div>
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
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('auth.deleteAccount', 'Delete Account')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
         <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
               <DialogTitle>{i18n.language === 'ko' ? "회원 탈퇴" : "Delete Account"}</DialogTitle>
               <DialogDescription className="pt-2">
                  {i18n.language === 'ko' 
                     ? "정말로 탈퇴하시겠습니까? 계정 정보와 관심 팀 설정, 알림 설정이 모두 삭제되며 복구할 수 없습니다."
                     : "Are you sure you want to delete your account? All data including team preferences and notification settings will be permanently lost."}
               </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
               <DialogClose asChild>
                  <Button variant="outline">{i18n.language === 'ko' ? "취소" : "Cancel"}</Button>
               </DialogClose>
               <Button variant="destructive" onClick={handleDeleteAccount}>
                  {i18n.language === 'ko' ? "탈퇴하기" : "Delete"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsDialog;
