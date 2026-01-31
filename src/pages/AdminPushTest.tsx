import { useState, useEffect } from 'react';
import { useTeams } from '@/hooks/useTeams';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bell, User, CheckCircle2, XCircle } from 'lucide-react';
import SEO from '@/components/SEO';

interface NotificationUser {
  id: string;
  nickname: string | null;
  email: string | null;
  preferred_language: string | null;
  favorite_team_ids: number[] | null;
  token_count: number;
  token_created_at: string | null;
}

interface SendResult {
  timestamp: string;
  user: string;
  title: string;
  body: string;
  success: boolean;
  sent_count: number;
  failed_count: number;
  message: string;
  details?: any[];
}

const AdminPushTest = () => {
  const { data: teams } = useTeams();
  
  const [users, setUsers] = useState<NotificationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[]>([]);

  // Fetch users with notification tokens (via Edge Function to bypass RLS)
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Edge Function 호출 (service_role key로 RLS 우회)
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-list-notification-users`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            }
          }
        );

        const result = await response.json();
        
        if (!result.success) {
          console.error('Error fetching users:', result.error);
          setUsers([]);
          return;
        }

        setUsers(result.users || []);
      } catch (err) {
        console.error('Error:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getTeamName = (teamId: number) => {
    const team = teams?.find(t => t.id === teamId);
    return team?.name || `Team ${teamId}`;
  };

  const getLanguageLabel = (lang: string | null) => {
    switch (lang) {
      case 'ko': return '한국어';
      case 'ja': return '日本語';
      case 'en': return 'English';
      default: return lang || '-';
    }
  };

  const handleSend = async () => {
    if (!selectedUserId || !title.trim() || !body.trim()) {
      return;
    }

    setSending(true);
    const selectedUser = users.find(u => u.id === selectedUserId);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-test-push`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            user_id: selectedUserId,
            title: title.trim(),
            body: body.trim()
          })
        }
      );

      const result = await response.json();
      
      setResults(prev => [{
        timestamp: new Date().toLocaleTimeString('ko-KR'),
        user: selectedUser?.nickname || selectedUser?.email || selectedUserId,
        title: title.trim(),
        body: body.trim(),
        success: result.success || false,
        sent_count: result.sent_count || 0,
        failed_count: result.failed_count || 0,
        message: result.message || result.error || 'Unknown',
        details: result.details
      }, ...prev]);

    } catch (err: any) {
      setResults(prev => [{
        timestamp: new Date().toLocaleTimeString('ko-KR'),
        user: selectedUser?.nickname || selectedUser?.email || selectedUserId,
        title: title.trim(),
        body: body.trim(),
        success: false,
        sent_count: 0,
        failed_count: 0,
        message: err.message || 'Network error'
      }, ...prev]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SEO 
        title="푸시 알림 테스트"
        description="푸시 알림 테스트 페이지"
        noindex={true}
      />
      
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">푸시 알림 테스트</h1>
              <p className="text-muted-foreground">알림 설정 사용자에게 테스트 푸시를 발송합니다</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  알림 구독 사용자
                </CardTitle>
                <CardDescription>
                  알림을 받을 수 있는 사용자 {users.length}명
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    알림을 구독한 사용자가 없습니다
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedUserId === u.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {u.nickname || u.email?.split('@')[0] || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          <Badge variant="secondary">
                            {u.token_count}개 기기
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {getLanguageLabel(u.preferred_language)}
                          </Badge>
                          {u.favorite_team_ids?.slice(0, 2).map(teamId => (
                            <Badge key={teamId} variant="outline" className="text-xs">
                              {getTeamName(teamId)}
                            </Badge>
                          ))}
                          {(u.favorite_team_ids?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(u.favorite_team_ids?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Send Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  테스트 메시지
                </CardTitle>
                <CardDescription>
                  [테스트 알림] 접두사가 자동으로 추가됩니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">제목</Label>
                  <Input
                    id="title"
                    placeholder="예: 경기 시작 알림"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="body">내용</Label>
                  <Textarea
                    id="body"
                    placeholder="예: HL안양 vs 레드이글스 곧 시작됩니다!"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!selectedUserId || !title.trim() || !body.trim() || sending}
                  onClick={handleSend}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      발송 중...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      테스트 발송
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Log */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>발송 결과 로그</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        result.success 
                          ? 'border-green-500/30 bg-green-500/10' 
                          : 'border-destructive/30 bg-destructive/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          <div>
                            <p className="font-medium">{result.user}</p>
                            <p className="text-xs text-muted-foreground">{result.timestamp}</p>
                          </div>
                        </div>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.sent_count}/{result.sent_count + result.failed_count}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">
                        <p><strong>[테스트 알림] {result.title}</strong></p>
                        <p className="text-muted-foreground">{result.body}</p>
                        <p className="text-xs mt-1">{result.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPushTest;
