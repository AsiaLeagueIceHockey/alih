import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Send, LogIn } from 'lucide-react';
import LoginDialog from '@/components/auth/LoginDialog';

interface CommentInputProps {
  onSubmit: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  parentId?: number;
  onCancel?: () => void;
}

const CommentInput = ({ 
  onSubmit, 
  isLoading = false, 
  placeholder,
  parentId,
  onCancel 
}: CommentInputProps) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  };

  const getPlaceholder = () => {
    if (!user) {
      return i18n.language === 'ko' 
        ? '로그인 후 댓글을 작성할 수 있습니다' 
        : i18n.language === 'ja'
          ? 'ログイン後にコメントできます'
          : 'Login to write a comment';
    }
    return placeholder || (i18n.language === 'ko' 
      ? '댓글을 입력하세요...' 
      : i18n.language === 'ja'
        ? 'コメントを入力...'
        : 'Write a comment...');
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <Textarea
          value={content}
          onChange={(e) => user && setContent(e.target.value)}
          placeholder={getPlaceholder()}
          className="min-h-[80px] resize-none"
          disabled={isLoading || !user}
          onClick={() => !user && setShowLoginDialog(true)}
        />
        <div className="flex justify-end gap-2">
          {parentId && onCancel && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCancel}
              disabled={isLoading}
            >
              {i18n.language === 'ko' ? '취소' : i18n.language === 'ja' ? 'キャンセル' : 'Cancel'}
            </Button>
          )}
          {user ? (
            <Button 
              size="sm" 
              onClick={handleSubmit}
              disabled={!content.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1" />
                  {i18n.language === 'ko' ? '등록' : i18n.language === 'ja' ? '送信' : 'Submit'}
                </>
              )}
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowLoginDialog(true)}
            >
              <LogIn className="w-4 h-4 mr-1" />
              {i18n.language === 'ko' ? '로그인' : i18n.language === 'ja' ? 'ログイン' : 'Login'}
            </Button>
          )}
        </div>
      </div>

      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
      />
    </>
  );
};

export default CommentInput;



