import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { Comment } from '@/hooks/useComments';
import { formatDistanceToNow } from 'date-fns';
import { ko, ja, enUS } from 'date-fns/locale';
import { Reply, Pencil, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CommentInput from './CommentInput';

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: number, content: string) => void;
  onUpdate: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  isReplying?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
  depth?: number;
}

const CommentItem = ({
  comment,
  onReply,
  onUpdate,
  onDelete,
  isReplying = false,
  isUpdating = false,
  isDeleting = false,
  depth = 0,
}: CommentItemProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwner = user?.id === comment.user_id;

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ja': return ja;
      case 'en': return enUS;
      default: return ko;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: getDateLocale(),
  });

  const handleReply = (content: string) => {
    onReply(comment.id, content);
    setShowReplyInput(false);
  };

  const handleUpdate = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onUpdate(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    const confirmMsg = i18n.language === 'ko' 
      ? '댓글을 삭제하시겠습니까?' 
      : i18n.language === 'ja'
        ? 'コメントを削除しますか？'
        : 'Delete this comment?';
    if (window.confirm(confirmMsg)) {
      onDelete(comment.id);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-border pl-4' : ''}`}>
      <div className="py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {comment.user?.nickname || 'Unknown'}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-xs text-muted-foreground">
                ({i18n.language === 'ko' ? '수정됨' : i18n.language === 'ja' ? '編集済み' : 'edited'})
              </span>
            )}
          </div>

          {/* Actions */}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {i18n.language === 'ko' ? '수정' : i18n.language === 'ja' ? '編集' : 'Edit'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {i18n.language === 'ko' ? '삭제' : i18n.language === 'ja' ? '削除' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
              >
                {i18n.language === 'ko' ? '취소' : i18n.language === 'ja' ? 'キャンセル' : 'Cancel'}
              </Button>
              <Button 
                size="sm" 
                onClick={handleUpdate}
                disabled={isUpdating || !editContent.trim()}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                  (i18n.language === 'ko' ? '저장' : i18n.language === 'ja' ? '保存' : 'Save')}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        )}

        {/* Reply Button */}
        {!isEditing && depth < 2 && user && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 text-xs text-muted-foreground"
            onClick={() => setShowReplyInput(!showReplyInput)}
          >
            <Reply className="h-3 w-3 mr-1" />
            {i18n.language === 'ko' ? '답글' : i18n.language === 'ja' ? '返信' : 'Reply'}
          </Button>
        )}

        {/* Reply Input */}
        {showReplyInput && (
          <div className="mt-3">
            <CommentInput
              onSubmit={handleReply}
              isLoading={isReplying}
              parentId={comment.id}
              onCancel={() => setShowReplyInput(false)}
              placeholder={i18n.language === 'ko' 
                ? '답글을 입력하세요...' 
                : i18n.language === 'ja'
                  ? '返信を入力...'
                  : 'Write a reply...'}
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isReplying={isReplying}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
