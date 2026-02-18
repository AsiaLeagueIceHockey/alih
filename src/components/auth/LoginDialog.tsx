import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLocation?: string;
}

const LoginDialog = ({ open, onOpenChange, triggerLocation }: LoginDialogProps) => {
  const { i18n } = useTranslation();
  const { signInWithGoogle, signInWithKakao, signInWithEmail, signUpWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    // Show if localhost OR if we are in dev mode (import.meta.env.DEV)
    setIsLocalhost(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || import.meta.env.DEV);
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await signInWithGoogle();
  };

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    await signInWithKakao();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await signUpWithEmail(email, password);
      alert("Sign up successful! Please check your email to confirm.");
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      alert(`Sign up failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (i18n.language === 'ko') return '로그인 / 회원가입';
    if (i18n.language === 'ja') return 'ログイン / 新規登録';
    return 'Login / Sign Up';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background text-foreground">
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

          {isLocalhost && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center mb-2">Dev Only (Email/Pass)</p>
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-3 py-2 border rounded text-sm bg-background text-foreground"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-3 py-2 border rounded text-sm bg-background text-foreground"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="button" onClick={handleEmailLogin} className="flex-1" disabled={isLoading}>
                    Login
                  </Button>
                  <Button type="button" onClick={handleEmailSignUp} variant="outline" className="flex-1" disabled={isLoading}>
                    Sign Up
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
