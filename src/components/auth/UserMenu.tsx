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
import { LogOut, User, Globe, Trophy, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const languages = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
] as const;

const UserMenu = () => {
  const { user, profile, logout, signInWithGoogle, signInWithKakao, updateProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLanguageChange = (langCode: string) => {
    updateProfile({ preferred_language: langCode });
  };

  if (!user) {
    return (
      <>
        <Button variant="ghost" size="sm" onClick={() => setShowLoginModal(true)}>
          Login
        </Button>
        <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center mb-4">Login / Sign up</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="w-full h-12 gap-2 text-base"
                onClick={signInWithGoogle}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true"><path d="M12.0003 20.45c-4.6667 0-8.45-3.7833-8.45-8.45 0-4.6667 3.7833-8.45 8.45-8.45 2.28 0 4.35.8333 5.9667 2.3467l-2.4 2.4c-0.9167-0.8834-2.1-1.3967-3.5667-1.3967-2.9333 0-5.3333 2.4-5.3333 5.3333 0 2.9334 2.4 5.3334 5.3333 5.3334 1.55 0 2.9334-0.6667 3.9334-1.7834h-3.9334v-3.2333h7.2667c0.1 0.5 0.15 1 0.15 1.5167 0 4.5166-3.0333 7.8333-7.4167 7.8333z" fill="#4285F4"></path></svg>
                Continue with Google
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 gap-2 text-base bg-[#FEE500] text-black hover:bg-[#FEE500]/90 border-[#FEE500]"
                onClick={signInWithKakao}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true"><path d="M12 3C5.9 3 1 6.9 1 11.8c0 2.8 1.6 5.3 4.1 6.9-0.1 0.6-0.4 2.2-0.4 2.3 0 0.1 0 0.2 0.1 0.2 0.2 0.1 2.3-1.6 2.7-1.8 1.4 0.4 2.8 0.6 4.3 0.6 6.1 0 11-3.9 11-8.8S17.1 3 12 3z" fill="#000000"></path></svg>
                Continue with Kakao
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.nickname || "User"} />
            <AvatarFallback>{profile?.nickname?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.nickname}</p>
            <p className="text-xs leading-none text-muted-foreground">
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
             <User className="mr-2 h-4 w-4" />
             <span>My Page (Coming Soon)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="text-destructive focus:text-destructive" disabled>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Account</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
