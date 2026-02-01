import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase } from '@/lib/supabase-external';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Trash2, Search, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface AdminComment {
  id: number;
  user_id: string;
  entity_type: 'game' | 'team' | 'player';
  entity_id: number;
  content: string;
  parent_id: number | null;
  is_deleted: boolean;
  created_at: string;
  user?: {
    nickname: string;
    email: string;
  };
}

const AdminComments = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'game' | 'team' | 'player'>('all');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['admin-comments'],
    queryFn: async () => {
      // 1. 댓글 조회
      const { data: commentsData, error: commentsError } = await externalSupabase
        .from('alih_comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (commentsError) throw commentsError;
      if (!commentsData || commentsData.length === 0) return [];

      // 2. 유저 ID 추출 (중복 제거)
      const userIds = [...new Set(commentsData.map(c => c.user_id))];

      // 3. 프로필 조회
      const { data: profiles, error: profilesError } = await externalSupabase
        .from('profiles')
        .select('id, nickname, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // 4. 프로필 맵 생성
      const profileMap = new Map(
        (profiles || []).map(p => [p.id, { nickname: p.nickname || '익명', email: p.email || '' }])
      );

      // 5. 댓글에 유저 정보 추가
      return commentsData.map(comment => ({
        ...comment,
        user: profileMap.get(comment.user_id) || { nickname: '익명', email: '' }
      })) as AdminComment[];
    },
    staleTime: 1000 * 30,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Admin soft delete (using service role would be ideal, but we'll use is_deleted flag)
      const { error } = await externalSupabase
        .from('alih_comments')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
    },
  });

  const handleDelete = (id: number, content: string) => {
    const preview = content.length > 30 ? content.substring(0, 30) + '...' : content;
    if (window.confirm(`이 댓글을 삭제하시겠습니까?\n\n"${preview}"`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredComments = comments?.filter((comment) => {
    const matchesSearch = 
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.user?.nickname?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || comment.entity_type === filterType;
    return matchesSearch && matchesType && !comment.is_deleted;
  });

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'game': return '경기';
      case 'team': return '팀';
      case 'player': return '선수';
      default: return type;
    }
  };

  const getEntityLink = (type: string, id: number) => {
    switch (type) {
      case 'game': return `/schedule/${id}`;
      case 'team': return `/team/${id}`;
      case 'player': return `/player/${id}`;
      default: return '#';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            <h1 className="text-2xl font-bold">댓글 관리</h1>
          </div>
          <span className="text-sm text-muted-foreground">
            총 {filteredComments?.length || 0}개
          </span>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="내용 또는 닉네임으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'game', 'team', 'player'] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(type)}
                >
                  {type === 'all' ? '전체' : getEntityTypeLabel(type)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Comments Table */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">작성자</TableHead>
                    <TableHead className="w-[80px]">유형</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead className="w-[140px]">작성일</TableHead>
                    <TableHead className="w-[60px]">답글</TableHead>
                    <TableHead className="w-[80px]">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments?.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {comment.user?.nickname || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {comment.user?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={getEntityLink(comment.entity_type, comment.entity_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          <Badge variant="secondary">
                            {getEntityTypeLabel(comment.entity_type)} #{comment.entity_id}
                          </Badge>
                        </a>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-2 max-w-[300px]">
                          {comment.content}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(comment.created_at), 'MM/dd HH:mm', { locale: ko })}
                      </TableCell>
                      <TableCell>
                        {comment.parent_id && (
                          <Badge variant="outline" className="text-xs">답글</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(comment.id, comment.content)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredComments?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        댓글이 없습니다
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminComments;
