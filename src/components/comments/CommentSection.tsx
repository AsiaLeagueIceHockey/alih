import { useTranslation } from 'react-i18next';
import { useComments } from '@/hooks/useComments';
import { Card } from '@/components/ui/card';
import { Loader2, MessageCircle } from 'lucide-react';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';

interface CommentSectionProps {
  entityType: 'game' | 'team' | 'player';
  entityId: number;
}

const CommentSection = ({ entityType, entityId }: CommentSectionProps) => {
  const { i18n } = useTranslation();
  const {
    comments,
    isLoading,
    createComment,
    updateComment,
    deleteComment,
    isCreating,
    isUpdating,
    isDeleting,
  } = useComments({ entityType, entityId });

  const handleCreate = (content: string) => {
    createComment({ content });
  };

  const handleReply = (parentId: number, content: string) => {
    createComment({ content, parentId });
  };

  const handleUpdate = (id: number, content: string) => {
    updateComment({ id, content });
  };

  const handleDelete = (id: number) => {
    deleteComment(id);
  };

  const getTitle = () => {
    switch (i18n.language) {
      case 'ja': return 'コメント';
      case 'en': return 'Comments';
      default: return '댓글';
    }
  };

  return (
    <Card className="mt-6 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-bold">{getTitle()}</h3>
        <span className="text-sm text-muted-foreground">
          ({comments.length})
        </span>
      </div>

      {/* Comment Input */}
      <div className="mb-6">
        <CommentInput onSubmit={handleCreate} isLoading={isCreating} />
      </div>

      {/* Comment List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {i18n.language === 'ko' 
            ? '아직 댓글이 없습니다. 첫 댓글을 남겨보세요!' 
            : i18n.language === 'ja'
              ? 'まだコメントがありません。最初のコメントを残しましょう！'
              : 'No comments yet. Be the first to comment!'}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              isReplying={isCreating}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

export default CommentSection;
