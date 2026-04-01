// Supabase Edge Function: admin-list-notification-users
// 관리자용 알림 설정 사용자 목록 조회 (service_role key로 RLS 우회)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Supabase 클라이언트 생성 (service_role 키로 RLS 우회)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: notification_tokens에서 모든 user_id 조회
    const { data: tokenData, error: tokenError } = await supabase
      .from("notification_tokens")
      .select("user_id, created_at")
      .order("created_at", { ascending: false });

    if (tokenError) {
      console.error("Error fetching tokens:", tokenError);
      throw tokenError;
    }

    if (!tokenData || tokenData.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          users: [],
          message: "알림을 구독한 사용자가 없습니다"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 고유 user_id 목록
    const userIds = [...new Set(tokenData.map((t: any) => t.user_id))];

    // Step 2: profiles에서 사용자 정보 조회
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, nickname, email, preferred_language, favorite_team_ids")
      .in("id", userIds);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      throw profileError;
    }

    // 프로필 맵 생성
    const profileMap = new Map(profileData?.map((p: any) => [p.id, p]) || []);

    // 사용자 목록 생성 (토큰 수 집계)
    const userMap = new Map<string, any>();
    
    tokenData.forEach((token: any) => {
      const profile = profileMap.get(token.user_id);
      
      if (userMap.has(token.user_id)) {
        const existing = userMap.get(token.user_id);
        existing.token_count++;
      } else {
        userMap.set(token.user_id, {
          id: token.user_id,
          nickname: profile?.nickname || null,
          email: profile?.email || null,
          preferred_language: profile?.preferred_language || null,
          favorite_team_ids: profile?.favorite_team_ids || null,
          token_count: 1,
          token_created_at: token.created_at
        });
      }
    });

    const users = Array.from(userMap.values());

    return new Response(
      JSON.stringify({
        success: true,
        users,
        total: users.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        users: [] 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
