import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase } from '@/lib/supabase-external';
import { useAuth } from '@/context/AuthContext';

export interface Comment {
  id: number;
  user_id: string;
  entity_type: 'game' | 'team' | 'player';
  entity_id: number;
  content: string;
  parent_id: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  user?: {
    nickname: string;
  };
  replies?: Comment[];
}

interface UseCommentsOptions {
  entityType: 'game' | 'team' | 'player';
  entityId: number;
}

export const useComments = ({ entityType, entityId }: UseCommentsOptions) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['comments', entityType, entityId];

  // 댓글 목록 조회
  const { data: comments, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_comments')
        .select(`
          *,
          user:profiles!user_id(nickname)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // 댓글을 계층 구조로 정리 (부모-자식)
      const commentMap = new Map<number, Comment>();
      const rootComments: Comment[] = [];

      // 먼저 모든 댓글을 맵에 저장
      (data || []).forEach((comment: Comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // 부모-자식 관계 설정
      (data || []).forEach((comment: Comment) => {
        const mappedComment = commentMap.get(comment.id)!;
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(mappedComment);
          }
        } else {
          rootComments.push(mappedComment);
        }
      });

      return rootComments;
    },
    staleTime: 1000 * 60 * 2, // 2분
    enabled: !!entityId,
  });

  // 댓글 작성
  const createMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number }) => {
      if (!user) throw new Error('로그인이 필요합니다');

      const { data, error } = await externalSupabase
        .from('alih_comments')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          content,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // 푸시 알림 전송 (Edge Function 호출)
      try {
        await externalSupabase.functions.invoke('send-comment-notification', {
          body: {
            commentId: data.id,
            entityType,
            entityId,
            authorId: user.id,
          },
        });
      } catch (e) {
        console.error('Failed to send notification:', e);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 댓글 수정
  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      if (!user) throw new Error('로그인이 필요합니다');

      const { data, error } = await externalSupabase
        .from('alih_comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id) // 본인 댓글만
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 댓글 삭제 (soft delete)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!user) throw new Error('로그인이 필요합니다');

      const { error } = await externalSupabase
        .from('alih_comments')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('user_id', user.id); // 본인 댓글만

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    comments: comments || [],
    isLoading,
    error,
    createComment: createMutation.mutate,
    updateComment: updateMutation.mutate,
    deleteComment: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
