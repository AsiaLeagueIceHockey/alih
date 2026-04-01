import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // [변경 1] 하드코딩된 URL/Key 제거 -> 내부 환경 변수 사용
    // Supabase Edge Function에서는 이 변수들이 자동으로 주입됩니다.
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // 만약 RLS(Row Level Security) 정책 때문에 Anon Key로 조회가 안 된다면
    // SUPABASE_SERVICE_ROLE_KEY를 대신 사용해야 할 수도 있습니다.
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // [변경 2] 도메인 변경 반영
    const siteUrl = 'https://alhockey.fans';
    const today = new Date().toISOString().split('T')[0];

    // --- 이하 로직 동일 ---

    // Fetch all schedules for game pages
    const { data: schedules, error: scheduleError } = await supabase
      .from('alih_schedule')
      .select('game_no, match_at, game_status')
      .order('game_no', { ascending: true });

    if (scheduleError) {
      console.error('Error fetching schedules:', scheduleError);
      throw scheduleError;
    }

    // Fetch all teams for team pages
    const { data: teams, error: teamError } = await supabase
      .from('alih_teams')
      .select('id')
      .order('id', { ascending: true });

    if (teamError) {
      console.error('Error fetching teams:', teamError);
      throw teamError;
    }

    console.log(`Found ${schedules?.length || 0} games and ${teams?.length || 0} teams`);

    // Static pages
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'hourly' }, // 메인 페이지
      { url: '/schedule', priority: '0.9', changefreq: 'hourly' },
      { url: '/standings', priority: '0.8', changefreq: 'daily' },
      { url: '/highlights', priority: '0.8', changefreq: 'daily' },
      { url: '/players', priority: '0.8', changefreq: 'daily' },
      { url: '/news', priority: '0.7', changefreq: 'daily' },
    ];

    const languages = ['ko', 'ja', 'en'];

    // Helper: generate URL entry with hreflang links for all languages
    const generateUrlEntry = (path: string, lastmod: string, changefreq: string, priority: string): string => {
      let entries = '';
      for (const lang of languages) {
        const langUrl = `${siteUrl}${path}${path === '' ? '' : ''}?lang=${lang}`;
        entries += `  <url>
    <loc>${langUrl}</loc>
${languages.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${siteUrl}${path}?lang=${l}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${path}"/>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
      }
      return entries;
    };

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Add static pages
    for (const page of staticPages) {
      sitemap += generateUrlEntry(page.url, today, page.changefreq, page.priority);
    }

    // Add game pages
    if (schedules) {
      for (const schedule of schedules) {
        const lastmod = schedule.match_at ? schedule.match_at.split('T')[0] : today;
        const isCompleted = schedule.game_status === 'Game Finished';
        const changefreq = isCompleted ? 'monthly' : 'hourly';
        const priority = isCompleted ? '0.6' : '0.8';

        sitemap += generateUrlEntry(`/schedule/${schedule.game_no}`, lastmod, changefreq, priority);
      }
    }

    // Add team pages
    if (teams) {
      for (const team of teams) {
        sitemap += generateUrlEntry(`/team/${team.id}`, today, 'weekly', '0.7');
      }
    }

    // [New] Add player pages
    const { data: players, error: playerError } = await supabase
      .from('alih_players')
      .select('id, slug');

    if (playerError) {
      console.error('Error fetching players:', playerError);
    } else if (players) {
      for (const player of players) {
        const urlParam = player.slug || player.id;
        sitemap += generateUrlEntry(`/player/${urlParam}`, today, 'weekly', '0.6');
      }
    }

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        // 브라우저나 봇이 1시간 동안은 캐시하도록 설정 (부하 방지)
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating sitemap:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});