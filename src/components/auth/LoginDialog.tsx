import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginDialog = ({ open, onOpenChange }: LoginDialogProps) => {
  const { i18n } = useTranslation();
  const { signInWithGoogle, signInWithKakao } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await signInWithGoogle();
  };

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    await signInWithKakao();
  };

  const getTitle = () => {
    if (i18n.language === 'ko') return '로그인 / 회원가입';
    if (i18n.language === 'ja') return 'ログイン / 新規登録';
    return 'Login / Sign Up';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="outline"
            className="w-full h-12 text-base"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-5 h-5 mr-3"
            />
            {i18n.language === 'ko' ? 'Google로 계속하기' : 
             i18n.language === 'ja' ? 'Googleで続ける' : 
             'Continue with Google'}
          </Button>
          <Button
            className="w-full h-12 text-base bg-[#FEE500] hover:bg-[#FEE500]/90 text-black"
            onClick={handleKakaoLogin}
            disabled={isLoading}
          >
            <img 
              src="https://nvlpbdyqfzmlrjauvhxx.supabase.co/storage/v1/object/public/alih/kakaotalk.png" 
              alt="Kakao" 
              className="w-5 h-5 mr-3"
            />
            {i18n.language === 'ko' ? 'Kakao로 계속하기' : 
             i18n.language === 'ja' ? 'Kakaoで続ける' : 
             'Continue with Kakao'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
