import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Globe, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const languages = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
] as const;

// Colorful Google Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84.81-.81z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// Colorful Kakao Icon
const KakaoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
    <path d="M12 3C5.9 3 1 6.9 1 11.8c0 2.8 1.6 5.3 4.1 6.9-0.1 0.6-0.4 2.2-0.4 2.3 0 0.1 0 0.2 0.1 0.2 0.2 0.1 2.3-1.6 2.7-1.8 1.4 0.4 2.8 0.6 4.3 0.6 6.1 0 11-3.9 11-8.8S17.1 3 12 3z" />
  </svg>
);

const UserMenu = () => {
  const { user, profile, logout, signInWithGoogle, signInWithKakao, updateProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLanguageChange = (langCode: string) => {
    updateProfile({ preferred_language: langCode });
    // Also change i18n immediately needed if profile update is slow? 
    // AuthContext usually handles it but we can force it too.
    i18n.changeLanguage(langCode);
  };

  // Priority: Profile Nickname -> User Metadata Name -> Email -> "U"
  const displayName = profile?.nickname || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "User";
  const nicknameInitial = displayName[0].toUpperCase();
  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];

  if (!user) {
    return (
      <>
        <Button 
          variant="outline" 
          className="rounded-full gap-2 pl-3 pr-4"
          onClick={() => setShowLoginModal(true)}
        >
          <UserIcon className="w-4 h-4" />
          <span>{t('auth.login', 'Login')}</span>
        </Button>

        <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center mb-4">{t('auth.loginTitle', 'Login / Sign up')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="w-full h-12 gap-2 text-base justify-start pl-4"
                onClick={signInWithGoogle}
              >
                <div className="w-6 flex justify-center"><GoogleIcon /></div>
                <span className="flex-1 text-center pr-6">{t('auth.google', 'Continue with Google')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 gap-2 text-base bg-[#FEE500] text-[#000000] hover:bg-[#FEE500]/90 border-[#FEE500] justify-start pl-4"
                onClick={signInWithKakao}
              >
                <div className="w-6 flex justify-center"><KakaoIcon /></div>
                <span className="flex-1 text-center pr-6">{t('auth.kakao', 'Continue with Kakao')}</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9 border border-border/50">
            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
            <AvatarFallback>{nicknameInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {profile?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Globe className="mr-2 h-4 w-4" />
              <span>Language ({currentLang.flag})</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {languages.map((lang) => (
                <DropdownMenuItem key={lang.code} onClick={() => handleLanguageChange(lang.code)}>
                  <span className="mr-2">{lang.flag}</span>
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuItem disabled>
             <UserIcon className="mr-2 h-4 w-4" />
             <span>{t('auth.myPage', 'My Page')}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('auth.logout', 'Log out')}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="text-destructive focus:text-destructive" disabled>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>{t('auth.deleteAccount', 'Delete Account')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
