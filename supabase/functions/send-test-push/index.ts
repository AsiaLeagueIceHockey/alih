import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.3";

// Supabase 클라이언트 설정
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

// VAPID 설정
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
let vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

// VAPID Subject가 이메일 주소만 있는 경우 'mailto:'를 강제로 붙임
if (!vapidSubject.startsWith("mailto:") && !vapidSubject.startsWith("http")) {
  vapidSubject = `mailto:${vapidSubject}`;
}

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error(`[INIT] VAPID Setup Error:`, err);
  }
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TestPushRequest {
  user_id: string;
  title: string;
  body: string;
}

interface PushResult {
  endpoint: string;
  status: "fulfilled" | "rejected";
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { user_id, title, body }: TestPushRequest = await req.json();

    // Validate input
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[TEST-PUSH] Sending test notification to user: ${user_id}`);

    // Get user's notification tokens
    const { data: tokens, error: tokenError } = await supabase
      .from("notification_tokens")
      .select("token")
      .eq("user_id", user_id);

    if (tokenError) {
      console.error("[TEST-PUSH] Error fetching tokens:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch tokens", details: tokenError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No notification tokens found for this user",
          sent_count: 0,
          failed_count: 0 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[TEST-PUSH] Found ${tokens.length} token(s)`);

    // Prepare notification with [테스트 알림] prefix
    const notificationTitle = `[테스트 알림] ${title}`;
    const notificationPayload = JSON.stringify({
      title: notificationTitle,
      body,
      url: "/"
    });

    // Send notifications
    const notifications = tokens.map((t) => {
      let subscription = t.token;
      if (typeof subscription === "string") {
        try {
          subscription = JSON.parse(subscription);
        } catch {
          return Promise.reject({ message: "Invalid JSON token" });
        }
      }
      
      return webpush.sendNotification(subscription, notificationPayload)
        .then(() => ({ 
          endpoint: subscription.endpoint || "unknown",
          status: "fulfilled" as const
        }))
        .catch((err: any) => ({ 
          endpoint: subscription.endpoint || "unknown",
          status: "rejected" as const,
          reason: err.message || String(err)
        }));
    });

    const results = await Promise.all(notifications);
    
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount = results.filter((r) => r.status === "rejected").length;

    console.log(`[TEST-PUSH] Result: ✅ Success: ${successCount}, ❌ Failed: ${failCount}`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        sent_count: successCount,
        failed_count: failCount,
        details: results,
        message: `${successCount}개 기기로 발송 완료 (실패: ${failCount})`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[TEST-PUSH] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
