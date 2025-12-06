import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const externalSupabase = createClient(
      'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
    );

    const siteUrl = 'https://alih.lovable.app';
    const today = new Date().toISOString().split('T')[0];

    // Fetch all schedules for game pages
    const { data: schedules, error: scheduleError } = await externalSupabase
      .from('alih_schedule')
      .select('game_no, match_at, game_status')
      .order('game_no', { ascending: true });

    if (scheduleError) {
      console.error('Error fetching schedules:', scheduleError);
      throw scheduleError;
    }

    // Fetch all teams for team pages
    const { data: teams, error: teamError } = await externalSupabase
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
      { url: '', priority: '1.0', changefreq: 'hourly' },
      { url: '/schedule', priority: '0.9', changefreq: 'hourly' },
      { url: '/standings', priority: '0.8', changefreq: 'daily' },
      { url: '/highlights', priority: '0.8', changefreq: 'daily' },
      { url: '/news', priority: '0.7', changefreq: 'daily' },
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add game pages
    if (schedules) {
      for (const schedule of schedules) {
        const lastmod = schedule.match_at ? schedule.match_at.split('T')[0] : today;
        const isCompleted = schedule.game_status === 'Game Finished';
        const changefreq = isCompleted ? 'monthly' : 'hourly';
        const priority = isCompleted ? '0.6' : '0.8';

        sitemap += `  <url>
    <loc>${siteUrl}/schedule/${schedule.game_no}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
      }
    }

    // Add team pages
    if (teams) {
      for (const team of teams) {
        sitemap += `  <url>
    <loc>${siteUrl}/team/${team.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
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
