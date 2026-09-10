import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import webPush from 'npm:web-push@3.6.7';
import { corsHeaders, requireUser } from '../_shared/auth.ts';

const retryFailedDeliveries = Deno.env.get('RETRY_FAILED_DELIVERIES') === 'true';

serve(async (req: Request) => {
  const headers = corsHeaders(req);
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }
    const caller = await requireUser(req);
    const { commentId } = await req.json();
    if (!commentId) {
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
    if (comment.user_id !== caller.id) throw new Error('Forbidden');

    const entityType = comment.entity_type;
    const entityId = comment.entity_id;
    const authorId = comment.user_id;

    const { data: eventId, error: claimError } = await supabaseAdmin.rpc('claim_notification_event', {
      p_event_key: `comment:${comment.id}`,
      p_event_type: 'comment',
      p_schedule_id: entityType === 'game' ? entityId : null,
      p_allow_retry: retryFailedDeliveries,
    });
    if (!eventId && !claimError) {
      return new Response(JSON.stringify({ success: true, message: 'Already notified' }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
    if (claimError) throw claimError;

    // 작성자 프로필 별도 조회
    const { data: authorProfile } = await supabaseAdmin
      .from('profiles')
      .select('nickname')
      .eq('id', comment.user_id)
      .single();

    const authorNickname = authorProfile?.nickname || '익명';

    // 엔티티 정보 가져오기 (알림 메시지용)
    let entityName = '';
    let entityPath = '/';
    if (entityType === 'game') {
      const { data: game } = await supabaseAdmin
        .from('alih_schedule')
        .select('game_no, season, home_alih_team_id, away_alih_team_id')
        .eq('id', entityId)
        .single();
      
      if (game) {
        entityPath = `/schedule/${game.game_no}?season=${encodeURIComponent(game.season)}`;
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
      entityPath = `/team/${entityId}`;
    } else if (entityType === 'player') {
      const { data: player } = await supabaseAdmin
        .from('alih_players')
        .select('name')
        .eq('id', entityId)
        .single();
      entityName = player?.name || '선수';
      entityPath = `/player/${entityId}`;
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
      await supabaseAdmin.rpc('complete_notification_event', {
        p_event_id: eventId,
        p_success_count: 0,
        p_failure_count: 0,
      });
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify' }),
        { headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    // 알린 사용자들의 푸시 토큰 가져오기
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('notification_tokens')
      .select('id, token, platform')
      .in('user_id', uniqueUserIds);

    if (tokenError) {
      throw tokenError;
    }

    if (!tokens || tokens.length === 0) {
      await supabaseAdmin.rpc('complete_notification_event', {
        p_event_id: eventId,
        p_success_count: 0,
        p_failure_count: 0,
      });
      return new Response(
        JSON.stringify({ success: true, message: 'No tokens found' }),
        { headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    // 알림 페이로드
    const payload = JSON.stringify({
      title: `💬 ${authorNickname}님이 댓글을 남겼습니다`,
      body: entityName 
        ? `${entityName}에 새 댓글: "${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}"`
        : comment.content.substring(0, 80),
      icon: '/icon-192x192.png',
      url: entityPath
    });

    // 푸시 알림 전송
    let successCount = 0;
    let failCount = 0;

    for (const tokenData of tokens) {
      const { data: claimed, error: deliveryClaimError } = await supabaseAdmin.rpc('claim_notification_delivery', {
        p_event_id: eventId,
        p_token_id: tokenData.id,
        p_allow_retry: retryFailedDeliveries,
      });
      if (deliveryClaimError) throw deliveryClaimError;
      if (claimed !== true) continue;
      try {
        // 토큰이 string이면 파싱, 이미 객체면 그대로 사용
        const subscription = typeof tokenData.token === 'string' 
          ? JSON.parse(tokenData.token) 
          : tokenData.token;
        await webPush.sendNotification(subscription, payload, {
          urgency: 'high',
          TTL: 60 * 60,
        });
        await supabaseAdmin.rpc('complete_notification_delivery', {
          p_event_id: eventId,
          p_token_id: tokenData.id,
          p_success: true,
          p_error: null,
        });
        successCount++;
      } catch (error: any) {
        console.error('Push send error:', error);
        failCount++;
        
        // 만료된 토큰 삭제
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabaseAdmin
            .from('notification_tokens')
            .delete()
            .eq('id', tokenData.id);
        }
        await supabaseAdmin.rpc('complete_notification_delivery', {
          p_event_id: eventId,
          p_token_id: tokenData.id,
          p_success: false,
          p_error: String(error?.message || error).slice(0, 500),
        });
      }
    }

    await supabaseAdmin.rpc('complete_notification_event', {
      p_event_id: eventId,
      p_success_count: successCount,
      p_failure_count: failCount,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        totalRecipients: uniqueUserIds.length 
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: error instanceof Error && error.message === 'Unauthorized' ? 401 : error instanceof Error && error.message === 'Forbidden' ? 403 : 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      }
    );
  }
});
