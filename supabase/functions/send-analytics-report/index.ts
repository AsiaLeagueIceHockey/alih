import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 수신자 이메일
const RECIPIENT_EMAIL = "joel610naver@gmail.com";

// Resend API를 통한 이메일 발송
async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "아시아리그 아이스하키 <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${errorData}`);
  }

  return response.json();
}

interface AnalyticsData {
  visitors: number;
  pageviews: number;
  pages?: Array<{ pathname: string; visitors: number; pageviews: number }>;
  referrers?: Array<{ referrer: string; visitors: number; pageviews: number }>;
  device_types?: Array<{ device_type: string; visitors: number; pageviews: number }>;
  countries?: Array<{ country: string; visitors: number; pageviews: number }>;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getYesterdayKST(): { start: string; end: string } {
  const now = new Date();
  // KST는 UTC+9
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  
  // 어제 날짜 계산
  const yesterday = new Date(kstNow);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateStr = formatDate(yesterday);
  return { start: dateStr, end: dateStr };
}

async function fetchAnalytics(startDate: string, endDate: string, testMode: boolean = false): Promise<AnalyticsData | null> {
  // 테스트 모드에서는 mock 데이터 반환
  if (testMode) {
    console.log("Using test mode with mock data");
    return {
      visitors: 58,
      pageviews: 583,
      pages: [
        { pathname: "/", visitors: 45, pageviews: 312 },
        { pathname: "/schedule", visitors: 32, pageviews: 156 },
        { pathname: "/standings", visitors: 28, pageviews: 89 },
        { pathname: "/highlights", visitors: 21, pageviews: 67 },
        { pathname: "/news", visitors: 15, pageviews: 42 }
      ],
      referrers: [
        { referrer: "", visitors: 35, pageviews: 245 },
        { referrer: "google.com", visitors: 12, pageviews: 89 },
        { referrer: "naver.com", visitors: 8, pageviews: 56 }
      ],
      device_types: [
        { device_type: "mobile", visitors: 49, pageviews: 489 },
        { device_type: "desktop", visitors: 9, pageviews: 94 }
      ],
      countries: [
        { country: "KR", visitors: 54, pageviews: 548 },
        { country: "JP", visitors: 2, pageviews: 18 },
        { country: "US", visitors: 2, pageviews: 17 }
      ]
    };
  }
  
  const projectId = Deno.env.get("SUPABASE_PROJECT_ID") || "rmfwypuvpwndnhjznaig";
  const apiUrl = `https://api.lovable.dev/v1/projects/${projectId}/analytics`;
  
  const url = new URL(apiUrl);
  url.searchParams.set('startdate', startDate);
  url.searchParams.set('enddate', endDate);
  url.searchParams.set('granularity', 'daily');
  
  console.log(`Fetching analytics from: ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`Analytics API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Analytics data received:', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
}

function generateEmailHtml(data: AnalyticsData, dateStr: string): string {
  const topPages = data.pages?.slice(0, 5) || [];
  const topReferrers = data.referrers?.slice(0, 3) || [];
  const deviceTypes = data.device_types || [];
  const countries = data.countries?.slice(0, 5) || [];
  
  const mobileVisitors = deviceTypes.find(d => d.device_type === 'mobile')?.visitors || 0;
  const desktopVisitors = deviceTypes.find(d => d.device_type === 'desktop')?.visitors || 0;
  const totalDeviceVisitors = mobileVisitors + desktopVisitors;
  const mobilePercent = totalDeviceVisitors > 0 ? Math.round((mobileVisitors / totalDeviceVisitors) * 100) : 0;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>일일 애널리틱스 리포트</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🏒 아시아리그 아이스하키</h1>
      <p style="color: #a0c4e8; margin: 10px 0 0 0; font-size: 14px;">일일 애널리틱스 리포트</p>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; font-weight: bold;">${dateStr}</p>
    </div>
    
    <!-- Main Stats -->
    <div style="padding: 30px;">
      <div style="display: flex; justify-content: space-around; text-align: center; margin-bottom: 30px;">
        <div style="flex: 1; padding: 20px; background-color: #f8fafc; border-radius: 8px; margin: 0 5px;">
          <div style="font-size: 36px; font-weight: bold; color: #1e3a5f;">${data.visitors.toLocaleString()}</div>
          <div style="font-size: 14px; color: #64748b; margin-top: 5px;">👥 방문자</div>
        </div>
        <div style="flex: 1; padding: 20px; background-color: #f8fafc; border-radius: 8px; margin: 0 5px;">
          <div style="font-size: 36px; font-weight: bold; color: #2d5a87;">${data.pageviews.toLocaleString()}</div>
          <div style="font-size: 14px; color: #64748b; margin-top: 5px;">📄 페이지뷰</div>
        </div>
      </div>
      
      <!-- Device Distribution -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1e3a5f; font-size: 16px; margin-bottom: 15px;">📱 디바이스 분포</h3>
        <div style="background-color: #e2e8f0; border-radius: 10px; height: 20px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #3b82f6, #60a5fa); height: 100%; width: ${mobilePercent}%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; color: #64748b;">
          <span>📱 모바일: ${mobilePercent}% (${mobileVisitors}명)</span>
          <span>💻 데스크톱: ${100 - mobilePercent}% (${desktopVisitors}명)</span>
        </div>
      </div>
      
      <!-- Countries -->
      ${countries.length > 0 ? `
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1e3a5f; font-size: 16px; margin-bottom: 15px;">🌍 국가별 방문자</h3>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px;">
          ${countries.map(c => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #334155;">${c.country === 'KR' ? '🇰🇷 한국' : c.country === 'JP' ? '🇯🇵 일본' : c.country === 'US' ? '🇺🇸 미국' : c.country}</span>
              <span style="color: #1e3a5f; font-weight: bold;">${c.visitors}명</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      <!-- Top Pages -->
      ${topPages.length > 0 ? `
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1e3a5f; font-size: 16px; margin-bottom: 15px;">📄 인기 페이지 TOP 5</h3>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px;">
          ${topPages.map((page, i) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center;">
                <span style="background-color: #1e3a5f; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 10px;">${i + 1}</span>
                <span style="color: #334155; font-size: 13px;">${page.pathname === '/' ? '홈페이지' : page.pathname}</span>
              </div>
              <span style="color: #1e3a5f; font-weight: bold;">${page.pageviews} 뷰</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      <!-- Referrers -->
      ${topReferrers.length > 0 ? `
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1e3a5f; font-size: 16px; margin-bottom: 15px;">🔗 유입 경로</h3>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px;">
          ${topReferrers.map(r => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #334155; font-size: 13px;">${r.referrer || '직접 방문'}</span>
              <span style="color: #1e3a5f; font-weight: bold;">${r.visitors}명</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        이 리포트는 매일 밤 10시(KST)에 자동으로 발송됩니다.
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin: 10px 0 0 0;">
        아시아리그 아이스하키 팬 사이트 | alhockey.fan
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-analytics-report function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // request body에서 test 모드 확인
    let testMode = false;
    try {
      const body = await req.json();
      testMode = body?.test === true;
    } catch {
      // body가 없으면 무시
    }
    
    // 어제 날짜 데이터 가져오기
    const { start, end } = getYesterdayKST();
    console.log(`Fetching analytics for date: ${start}, testMode: ${testMode}`);
    
    const analyticsData = await fetchAnalytics(start, end, testMode);
    
    if (!analyticsData) {
      console.error("Failed to fetch analytics data");
      return new Response(
        JSON.stringify({ error: "Failed to fetch analytics data" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // 이메일 HTML 생성
    const emailHtml = generateEmailHtml(analyticsData, start);
    
    // 이메일 발송
    const emailResponse = await sendEmail(
      RECIPIENT_EMAIL,
      `📊 일일 애널리틱스 리포트 - ${start}`,
      emailHtml
    );

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Analytics report sent successfully",
        date: start,
        emailResponse 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-analytics-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
