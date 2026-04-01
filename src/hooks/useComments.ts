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
      // 1. 댓글 조회
      const { data: commentsData, error: commentsError } = await externalSupabase
        .from('alih_comments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      if (!commentsData || commentsData.length === 0) return [];

      // 2. 유저 ID 추출 (중복 제거)
      const userIds = [...new Set(commentsData.map(c => c.user_id))];

      // 3. 프로필 조회
      const { data: profiles, error: profilesError } = await externalSupabase
        .from('profiles')
        .select('id, nickname')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // 4. 프로필 맵 생성
      const profileMap = new Map(
        (profiles || []).map(p => [p.id, { nickname: p.nickname || '익명' }])
      );

      // 5. 댓글에 유저 정보 추가
      const commentsWithUser = commentsData.map(comment => ({
        ...comment,
        user: profileMap.get(comment.user_id) || { nickname: '익명' }
      }));

      // 6. 계층 구조로 정리 (부모-자식)
      const commentMap = new Map<number, Comment>();
      const rootComments: Comment[] = [];

      commentsWithUser.forEach((comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      commentsWithUser.forEach((comment) => {
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
