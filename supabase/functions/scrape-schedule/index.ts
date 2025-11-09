import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Game {
  date: string;
  time: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  venue: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching schedule data from asiaicehockey.com...');
    
    const response = await fetch('https://asiaicehockey.com/schedule');
    const html = await response.text();
    
    const games: Game[] = [];
    
    // Parse HTML to extract game data
    // This is a simplified parser - you may need to adjust based on actual HTML structure
    const gameMatches = html.matchAll(/(\d+月\d+日).+?(\d+:\d+).+?([\w\s]+)\s+(\d+).+?([\w\s]+)\s+(\d+)/gs);
    
    for (const match of gameMatches) {
      const [_, dateStr, time, awayTeam, awayScore, homeTeam, homeScore] = match;
      
      // Translate team names to Korean
      const teamMap: Record<string, string> = {
        'レッドイーグルス北海道': '레드 이글스 홋카이도',
        'HLアニャンアイスホッケークラブ': 'HL 안양',
        '東北フリーブレイズ': '도호쿠 프리블레이즈',
        'H.C.栃木日光アイスバックス': '닛코 아이스벅스',
        '横浜GRITS': '요코하마 그리츠',
        'スターズ神戸': '스타즈 고베',
      };
      
      const translateTeam = (team: string) => {
        for (const [jp, kr] of Object.entries(teamMap)) {
          if (team.includes(jp)) return kr;
        }
        return team;
      };
      
      games.push({
        date: dateStr,
        time,
        home: translateTeam(homeTeam),
        away: translateTeam(awayTeam),
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        status: '종료',
        venue: '확인 필요',
      });
    }
    
    console.log(`Successfully parsed ${games.length} games`);
    
    return new Response(
      JSON.stringify({ success: true, games }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error scraping schedule:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
