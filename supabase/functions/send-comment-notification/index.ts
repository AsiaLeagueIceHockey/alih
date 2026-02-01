import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import webPush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { commentId, entityType, entityId, authorId } = await req.json();

    if (!commentId || !entityType || !entityId || !authorId) {
      throw new Error('Missing required fields');
    }

    // Supabase 클라이언트 생성 (service role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // VAPID 키 설정
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@alhockey.fans';

    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // 새 댓글 정보 가져오기 (profiles 조인 대신 별도 쿼리)
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('alih_comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      console.error('Comment query error:', commentError);
      throw new Error('Comment not found');
    }

    // 작성자 프로필 별도 조회
    const { data: authorProfile } = await supabaseAdmin
      .from('profiles')
      .select('nickname')
      .eq('id', comment.user_id)
      .single();

    const authorNickname = authorProfile?.nickname || '익명';

    // 엔티티 정보 가져오기 (알림 메시지용)
    let entityName = '';
    if (entityType === 'game') {
      const { data: game } = await supabaseAdmin
        .from('alih_schedule')
        .select('home_alih_team_id, away_alih_team_id')
        .eq('id', entityId)
        .single();
      
      if (game) {
        const { data: teams } = await supabaseAdmin
          .from('alih_teams')
          .select('id, name')
          .in('id', [game.home_alih_team_id, game.away_alih_team_id]);
        
        if (teams && teams.length === 2) {
          const homeTeam = teams.find(t => t.id === game.home_alih_team_id);
          const awayTeam = teams.find(t => t.id === game.away_alih_team_id);
          entityName = `${homeTeam?.name} vs ${awayTeam?.name}`;
        }
      }
    } else if (entityType === 'team') {
      const { data: team } = await supabaseAdmin
        .from('alih_teams')
        .select('name')
        .eq('id', entityId)
        .single();
      entityName = team?.name || '팀';
    } else if (entityType === 'player') {
      const { data: player } = await supabaseAdmin
        .from('alih_players')
        .select('name')
        .eq('id', entityId)
        .single();
      entityName = player?.name || '선수';
    }

    // 해당 엔티티에 댓글을 남긴 다른 사용자들 조회 (본인 제외)
    const { data: otherCommenters, error: commentersError } = await supabaseAdmin
      .from('alih_comments')
      .select('user_id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('is_deleted', false)
      .neq('user_id', authorId);

    if (commentersError) {
      throw commentersError;
    }

    // 중복 제거
    const uniqueUserIds = [...new Set(otherCommenters?.map(c => c.user_id) || [])];

    if (uniqueUserIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 알린 사용자들의 푸시 토큰 가져오기
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('notification_tokens')
      .select('token, platform')
      .in('user_id', uniqueUserIds);

    if (tokenError) {
      throw tokenError;
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No tokens found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 알림 페이로드
    const entityPath = entityType === 'game' 
      ? `/schedule/${entityId}`
      : entityType === 'team'
        ? `/team/${entityId}`
        : `/player/${entityId}`;

    const payload = JSON.stringify({
      title: `💬 ${authorNickname}님이 댓글을 남겼습니다`,
      body: entityName 
        ? `${entityName}에 새 댓글: "${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}"`
        : comment.content.substring(0, 80),
      icon: '/icon-192x192.png',
      data: {
        url: entityPath
      }
    });

    // 푸시 알림 전송
    let successCount = 0;
    let failCount = 0;

    for (const tokenData of tokens) {
      try {
        // 토큰이 string이면 파싱, 이미 객체면 그대로 사용
        const subscription = typeof tokenData.token === 'string' 
          ? JSON.parse(tokenData.token) 
          : tokenData.token;
        await webPush.sendNotification(subscription, payload);
        successCount++;
      } catch (error) {
        console.error('Push send error:', error);
        failCount++;
        
        // 만료된 토큰 삭제
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabaseAdmin
            .from('notification_tokens')
            .delete()
            .eq('token', tokenData.token);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        totalRecipients: uniqueUserIds.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
