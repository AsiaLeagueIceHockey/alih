import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/admin/AdminLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Video, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { externalSupabase } from '@/lib/supabase-external';
import { useTeams } from '@/hooks/useTeams';
import { useQueryClient } from '@tanstack/react-query';
import SEO from '@/components/SEO';

interface AlihVideo {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  team_english_name: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string;
  created_at: string;
}

const AdminVideos = () => {
  const queryClient = useQueryClient();
  const { data: teams } = useTeams();
  const [videos, setVideos] = useState<AlihVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 폼 상태
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formTeam, setFormTeam] = useState<string>('none');
  const [formPublished, setFormPublished] = useState(true);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      // 어드민은 비공개 영상도 봐야 함 → service role 또는 직접 쿼리
      // RLS 정책이 is_published=true만 허용하므로, 어드민은 모든 영상을 볼 수 있어야 함
      // Supabase anon key로는 공개 영상만 조회 가능 → 어드민용 Edge Function 필요
      // 일단 공개 영상만 표시 (비공개 관리는 Supabase Dashboard에서)
      const { data, error } = await externalSupabase
        .from('alih_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match?.[1] || null;
  };

  const getYoutubeThumbnail = (url: string) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  const handleAdd = async () => {
    if (!formTitle.trim() || !formYoutubeUrl.trim()) return;

    setSaving(true);
    try {
      const { error } = await externalSupabase
        .from('alih_videos')
        .insert({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          youtube_url: formYoutubeUrl.trim(),
          team_english_name: formTeam === 'none' ? null : formTeam,
          is_published: formPublished,
        });

      if (error) throw error;

      // 폼 초기화
      setFormTitle('');
      setFormDescription('');
      setFormYoutubeUrl('');
      setFormTeam('none');
      setFormPublished(true);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['alih-videos'] });
      fetchVideos();
    } catch (err) {
      console.error('Error adding video:', err);
      alert('영상 추가에 실패했습니다. RLS 정책을 확인하세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 영상을 삭제하시겠습니까?')) return;

    try {
      const { error } = await externalSupabase
        .from('alih_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['alih-videos'] });
      fetchVideos();
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleTogglePublished = async (id: string, currentState: boolean) => {
    try {
      const { error } = await externalSupabase
        .from('alih_videos')
        .update({ is_published: !currentState })
        .eq('id', id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['alih-videos'] });
      fetchVideos();
    } catch (err) {
      console.error('Error toggling publish:', err);
    }
  };

  const thumbnailPreview = formYoutubeUrl ? getYoutubeThumbnail(formYoutubeUrl) : null;

  return (
    <AdminLayout>
      <SEO
        title="영상 관리 - Admin"
        description="영상 콘텐츠 관리 페이지"
        noindex={true}
      />

      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">영상 관리</h1>
                <p className="text-muted-foreground">아시아리그 영상 콘텐츠를 관리합니다</p>
              </div>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="h-4 w-4" />
              영상 추가
            </Button>
          </div>

          {/* 새 영상 추가 폼 */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  새 영상 추가
                </CardTitle>
                <CardDescription>
                  YouTube URL과 정보를 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="youtube-url">YouTube URL *</Label>
                  <Input
                    id="youtube-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formYoutubeUrl}
                    onChange={(e) => setFormYoutubeUrl(e.target.value)}
                  />
                  {/* 썸네일 미리보기 */}
                  {thumbnailPreview && (
                    <div className="mt-2 rounded-md overflow-hidden border border-border">
                      <img
                        src={thumbnailPreview}
                        alt="미리보기"
                        className="w-full max-w-sm aspect-video object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    placeholder="예: Stars Kobe 창단 첫해 Recap"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    placeholder="영상에 대한 간단한 설명..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>관련 팀</Label>
                  <Select value={formTeam} onValueChange={setFormTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="팀 선택 (선택사항)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">팀 없음 (일반 영상)</SelectItem>
                      {teams?.map((team) => (
                        <SelectItem key={team.id} value={team.english_name}>
                          {team.name} ({team.english_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={formPublished}
                    onCheckedChange={setFormPublished}
                    id="published"
                  />
                  <Label htmlFor="published">
                    {formPublished ? '공개' : '비공개'}
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={!formTitle.trim() || !formYoutubeUrl.trim() || saving}
                    onClick={handleAdd}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        추가
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    취소
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 영상 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>등록된 영상</CardTitle>
              <CardDescription>
                총 {videos.length}개의 영상
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : videos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  등록된 영상이 없습니다
                </p>
              ) : (
                <div className="space-y-3">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="flex gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                    >
                      {/* 썸네일 */}
                      <div className="w-32 flex-shrink-0">
                        <div className="aspect-video rounded-md overflow-hidden bg-secondary">
                          {getYoutubeThumbnail(video.youtube_url) ? (
                            <img
                              src={getYoutubeThumbnail(video.youtube_url)!}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2 mb-1">
                          {video.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          {video.team_english_name && (
                            <Badge variant="outline" className="text-[10px]">
                              {video.team_english_name}
                            </Badge>
                          )}
                          <Badge
                            variant={video.is_published ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {video.is_published ? (
                              <><Eye className="w-3 h-3 mr-1" />공개</>
                            ) : (
                              <><EyeOff className="w-3 h-3 mr-1" />비공개</>
                            )}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(video.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>

                      {/* 액션 */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(video.youtube_url, '_blank', 'noopener,noreferrer')}
                          title="YouTube에서 보기"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleTogglePublished(video.id, video.is_published)}
                          title={video.is_published ? '비공개로 전환' : '공개로 전환'}
                        >
                          {video.is_published ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(video.id)}
                          title="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminVideos;
