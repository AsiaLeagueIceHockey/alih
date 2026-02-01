import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Send } from 'lucide-react';

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
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  };

  if (!user) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        {i18n.language === 'ko' 
          ? '댓글을 작성하려면 로그인이 필요합니다' 
          : i18n.language === 'ja'
            ? 'コメントするにはログインが必要です'
            : 'Please login to comment'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || (i18n.language === 'ko' 
          ? '댓글을 입력하세요...' 
          : i18n.language === 'ja'
            ? 'コメントを入力...'
            : 'Write a comment...')}
        className="min-h-[80px] resize-none"
        disabled={isLoading}
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
      </div>
    </div>
  );
};

export default CommentInput;
